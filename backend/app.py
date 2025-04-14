from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, InternalServerError
import geopandas as gpd
import osmnx as ox
import logging
from logging.handlers import RotatingFileHandler
from cachetools import Cache
import os

# Configuration
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config.from_mapping(
    ENV=os.environ.get('FLASK_ENV', 'production'),
    DEBUG=os.environ.get('FLASK_DEBUG', '0').lower() in ['1', 'true'],
)

# Production-grade logging setup
if not app.debug:
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, 'app.log'),
        maxBytes=1024 * 1024 * 10,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
else:
    # Basic logging for debug mode
    logging.basicConfig(level=logging.DEBUG)
    app.logger.setLevel(logging.DEBUG)


# Cache setup for repeated requests
cache = Cache(maxsize=100)

# --- Data Loading ---
ABS_DATA_PATH = "abs_data/POA_2021_AUST_GDA2020.shp"
ABS_BOUNDARIES = None # Initialize as None

def load_abs_data():
    """Loads ABS boundary data with error handling."""
    global ABS_BOUNDARIES
    try:
        if not os.path.exists(ABS_DATA_PATH):
             raise FileNotFoundError(f"ABS data file not found at: {ABS_DATA_PATH}")
        ABS_BOUNDARIES = gpd.read_file(ABS_DATA_PATH)
        # Ensure the postcode column is string type for reliable matching
        if 'POA_CODE21' in ABS_BOUNDARIES.columns:
            ABS_BOUNDARIES['POA_CODE21'] = ABS_BOUNDARIES['POA_CODE21'].astype(str)
        else:
             raise KeyError("Column 'POA_CODE21' not found in the shapefile.")
        app.logger.info(f"Successfully loaded ABS boundary data from {ABS_DATA_PATH}")
    except FileNotFoundError as e:
        app.logger.error(f"ABS data file error: {str(e)}")
        # Depending on requirements, you might exit or continue with limited functionality
        raise RuntimeError(f"Failed to initialize application data: {str(e)}") from e
    except KeyError as e:
        app.logger.error(f"ABS data structure error: {str(e)}")
        raise RuntimeError(f"Failed to initialize application data: {str(e)}") from e
    except Exception as e:
        app.logger.error(f"Failed to load ABS data: {str(e)}")
        raise RuntimeError("Failed to initialize application data") from e

# Load data at startup
load_abs_data()


def calculate_greenspace_data(postcode):
    """
    Calculates greenspace percentage, areas, and extracts geometries for a given postcode.

    Args:
        postcode (str): The 4-digit Australian postcode.

    Returns:
        dict: A dictionary containing postcode, percentage, areas, and GeoJSON geometries.

    Raises:
        ValueError: If postcode is invalid, not found, or area calculation fails.
        Exception: For errors during OSMnx fetching or processing.
    """
    global ABS_BOUNDARIES
    if ABS_BOUNDARIES is None:
         # This should ideally not happen if startup loading is correct, but good practice
         raise InternalServerError("ABS Boundary data not loaded.")

    try:
        # Validate postcode format
        if not isinstance(postcode, str) or not postcode.isdigit() or len(postcode) != 4:
            raise ValueError("Invalid postcode format. Must be a 4-digit string.")

        # Check cache first
        cache_key = f"greenspace_data_{postcode}"
        if cache_key in cache:
            app.logger.info(f"Cache hit for postcode {postcode}")
            return cache[cache_key]
        app.logger.info(f"Cache miss for postcode {postcode}. Calculating...")

        # Find postcode area (using string comparison)
        postcode_area_gdf = ABS_BOUNDARIES[ABS_BOUNDARIES['POA_CODE21'] == postcode]
        if postcode_area_gdf.empty:
            raise ValueError(f"Postcode {postcode} not found in ABS dataset")

        # --- Geometry Extraction (Web Mercator - EPSG:4326) ---
        # Ensure postcode area is in WGS84 (EPSG:4326) for OSMnx and GeoJSON output
        postcode_area_4326 = postcode_area_gdf.to_crs(epsg=4326)
        # Get the geometry of the first (and only) feature for the postcode
        postcode_geometry_4326 = postcode_area_4326.geometry.iloc[0]
        # Convert postcode boundary to GeoJSON format
        # Using __geo_interface__ gives a Python dict representation of GeoJSON geometry
        postcode_geojson_geometry = postcode_geometry_4326.__geo_interface__

        # Fetch greenspaces using the WGS84 geometry
        tags = {'leisure': ['park', 'garden'], 'landuse': ['grass', 'forest']}
        try:
            # Use the unary_union in case the shapefile had multipart polygons for a postcode
            boundary_polygon = postcode_area_4326.geometry.unary_union
            greenspaces_gdf_4326 = ox.features_from_polygon(boundary_polygon, tags)
            app.logger.info(f"Found {len(greenspaces_gdf_4326)} greenspace features for {postcode}")
        except Exception as osm_error:
             # Handle cases where OSMnx might fail (e.g., timeout, no data)
             app.logger.warning(f"OSMnx error fetching greenspaces for {postcode}: {osm_error}")
             # If no greenspaces are found or there's an error, create an empty GeoDataFrame
             # Important: Define columns matching expected structure if needed later,
             # or just use an empty one for geometry extraction.
             greenspaces_gdf_4326 = gpd.GeoDataFrame([], columns=['osmid', 'geometry'], crs='epsg:4326')


        # Convert greenspace features to GeoJSON FeatureCollection format
        greenspace_geojson_features = greenspaces_gdf_4326.__geo_interface__

        # --- Area Calculation (Projected CRS - EPSG:3577) ---
        # Use a suitable projected CRS for accurate area calculation (e.g., GDA94 / Australian Albers)
        projected_crs = '3577'
        postcode_area_proj = postcode_area_gdf.to_crs(epsg=projected_crs)

        if not greenspaces_gdf_4326.empty:
             greenspaces_proj = greenspaces_gdf_4326.to_crs(epsg=projected_crs)
             # Dissolve overlapping greenspaces before summing area to avoid double counting
             # This is crucial if parks/forests overlap in OSM data
             dissolved_greenspace = greenspaces_proj.unary_union
             greenspace_area = dissolved_greenspace.area
        else:
             greenspace_area = 0.0 # No greenspaces found

        total_area = postcode_area_proj.geometry.iloc[0].area

        if total_area <= 0:
            app.logger.warning(f"Calculated total area for postcode {postcode} is zero or negative.")
            # Decide how to handle this: raise error, return 0%, or specific message
            percentage = 0.0 # Assign 0% if total area is invalid
        else:
            percentage = (greenspace_area / total_area) * 100

        # --- Prepare Result ---
        result = {
            'postcode': postcode,
            'greenspace_percentage': round(percentage, 2),
            'greenspace_area_sqm': round(greenspace_area, 2),
            'total_area_sqm': round(total_area, 2),
            'postcode_geometry': postcode_geojson_geometry, # GeoJSON geometry dict
            'greenspace_features': greenspace_geojson_features # GeoJSON FeatureCollection dict
        }

        # Cache the result
        cache[cache_key] = result
        app.logger.info(f"Successfully calculated and cached data for postcode {postcode}")
        return result

    except ValueError as ve:
        # Log specific validation errors
        app.logger.warning(f"Validation error for postcode {postcode}: {str(ve)}")
        raise BadRequest(str(ve)) # Reraise as BadRequest for client
    except Exception as e:
        # Log unexpected errors during processing
        app.logger.error(f"Error processing postcode {postcode}: {str(e)}", exc_info=True) # Log traceback
        # Reraise as a generic internal error for the client
        raise InternalServerError(f"An internal error occurred while processing postcode {postcode}.")


@app.route('/api/greenspace', methods=['GET'])
def get_greenspace():
    """API endpoint to get greenspace data including geometries for a postcode."""
    postcode = request.args.get('postcode')
    app.logger.info(f"Received request for postcode: {postcode}")

    if not postcode:
        app.logger.warning("API request missing 'postcode' parameter.")
        # Use Werkzeug's BadRequest exception
        raise BadRequest("Mandatory query parameter 'postcode' is missing.")

    try:
        # Call the updated calculation function
        result = calculate_greenspace_data(postcode)
        # Flask's jsonify handles Python dicts (including nested ones like GeoJSON)
        return jsonify(result)

    # Specific handling for BadRequest raised from calculate_greenspace_data
    except BadRequest as br:
        app.logger.warning(f"Bad request for postcode '{postcode}': {br.description}")
        raise br # Reraise to be caught by the error handler below

    # Specific handling for InternalServerError raised from calculate_greenspace_data
    except InternalServerError as ise:
        app.logger.error(f"Server error processing postcode '{postcode}': {ise.description}")
        raise ise # Reraise to be caught by the error handler below

    # Catch any other unexpected exceptions during the request handling
    except Exception as e:
        app.logger.error(f"Unexpected error in /api/greenspace for postcode '{postcode}': {str(e)}", exc_info=True)
        # Raise a generic InternalServerError
        raise InternalServerError("An unexpected error occurred on the server.")


# --- Error Handlers ---
@app.errorhandler(BadRequest)
def handle_bad_request(e):
    """Handles 400 Bad Request errors."""
    app.logger.warning(f"Responding with 400: {e.description}")
    response = jsonify({'error': 'Bad Request', 'message': e.description})
    response.status_code = 400
    return response

@app.errorhandler(InternalServerError)
def handle_server_error(e):
    """Handles 500 Internal Server Error."""
    # Log the original exception if available (Werkzeug attaches it)
    if hasattr(e, 'original_exception'):
         app.logger.error(f"Internal Server Error: {e.original_exception}", exc_info=True)
    else:
         app.logger.error(f"Internal Server Error: {e.description}")

    response = jsonify({'error': 'Internal Server Error', 'message': 'An internal error occurred. Please try again later.'})
    response.status_code = 500
    return response

@app.errorhandler(404)
def handle_not_found(e):
    """Handles 404 Not Found errors."""
    app.logger.warning(f"Responding with 404: Resource not found at {request.path}")
    response = jsonify({'error': 'Not Found', 'message': 'The requested resource was not found.'})
    response.status_code = 404
    return response
# --- End Error Handlers ---

if __name__ == '__main__':
    # Load data before running the app (already called above, but good practice)
    if ABS_BOUNDARIES is None:
        print("Error: ABS Boundaries could not be loaded. Exiting.")
        exit(1)
    print("Starting Flask server...")
    # Debug mode should be controlled by FLASK_DEBUG env var now
    app.run(host='0.0.0.0', port=5000)