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
    file_handler = RotatingFileHandler(
        'app.log',
        maxBytes=1024 * 1024 * 10,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)

# Cache setup for repeated requests
cache = Cache(maxsize=100)

# Load ABS boundary data once at startup
try:
    ABS_BOUNDARIES = gpd.read_file("abs_data/POA_2021_AUST_GDA2020.shp")
    app.logger.info("Successfully loaded ABS boundary data")
except Exception as e:
    app.logger.error(f"Failed to load ABS data: {str(e)}")
    raise RuntimeError("Failed to initialize application data") from e

def calculate_greenspace_percentage(postcode):
    try:
        # Validate postcode format
        if not postcode.isdigit() or len(postcode) != 4:
            raise ValueError("Invalid postcode format")

        # Find postcode area
        postcode_area = ABS_BOUNDARIES[ABS_BOUNDARIES['POA_CODE21'] == postcode]
        if postcode_area.empty:
            raise ValueError(f"Postcode {postcode} not found in dataset")

        # Check cache first
        cache_key = f"postcode_{postcode}"
        if cache_key in cache:
            return cache[cache_key]

        # Convert to proper CRS
        postcode_area = postcode_area.to_crs(epsg=4326)

        # Fetch greenspaces with timeout
        tags = {'leisure': ['park', 'garden'], 'landuse': ['grass', 'forest']}
        greenspaces = ox.features_from_polygon(
            postcode_area.geometry.unary_union,
            tags,
        )

        # Calculate areas in projected CRS
        postcode_proj = postcode_area.to_crs(epsg=3577)
        greenspaces_proj = greenspaces.to_crs(epsg=3577)

        greenspace_area = greenspaces_proj.geometry.area.sum()
        total_area = postcode_proj.geometry.area.sum()

        if total_area <= 0:
            raise ValueError("Invalid area calculation")

        percentage = (greenspace_area / total_area) * 100

        result = {
            'postcode': postcode,
            'greenspace_percentage': round(percentage, 2),
            'greenspace_area_sqm': round(greenspace_area, 2),
            'total_area_sqm': round(total_area, 2)
        }

        # Cache the result
        cache[cache_key] = result
        return result

    except Exception as e:
        app.logger.error(f"Error processing postcode {postcode}: {str(e)}")
        raise

@app.route('/api/greenspace', methods=['GET'])
def get_greenspace():
    postcode = request.args.get('postcode')

    if not postcode:
        app.logger.warning("Missing postcode parameter")
        raise BadRequest("Postcode parameter is required")

    try:
        result = calculate_greenspace_percentage(postcode)
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Server error: {str(e)}")
        raise InternalServerError("An error occurred processing your request")

@app.errorhandler(BadRequest)
def handle_bad_request(e):
    return jsonify({'error': 'Invalid request', 'message': str(e)}), 400

@app.errorhandler(InternalServerError)
def handle_server_error(e):
    return jsonify({'error': 'Server error', 'message': 'Please try again later'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)