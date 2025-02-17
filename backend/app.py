from flask import Flask, jsonify, request
import geopandas as gpd
import osmnx as ox
from werkzeug.exceptions import BadRequest

app = Flask(__name__)

def calculate_greenspace_percentage(postcode):
    try:
        # 1. Load ABS boundary
        abs_postcodes = gpd.read_file("abs_data/POA_2021_AUST_GDA2020.shp")
        postcode_area = abs_postcodes[abs_postcodes['POA_CODE21'] == postcode].to_crs(epsg=4326)

        if postcode_area.empty:
            raise BadRequest(f"Postcode {postcode} not found in dataset")

        # 2. Fetch greenspaces
        tags = {'leisure': ['park', 'garden'], 'landuse': ['grass', 'forest']}
        greenspaces = ox.features_from_polygon(postcode_area.geometry.unary_union, tags)

        # 3. Calculate area percentage (use projected CRS)
        postcode_proj = postcode_area.to_crs(epsg=3577)
        greenspaces_proj = greenspaces.to_crs(epsg=3577)
        greenspace_area = greenspaces_proj.geometry.area.sum()
        total_area = postcode_proj.geometry.area.sum()

        percentage = (greenspace_area / total_area) * 100

        return {
            'postcode': postcode,
            'greenspace_percentage': round(percentage, 2),
            'greenspace_area_sqm': round(greenspace_area, 2),
            'total_area_sqm': round(total_area, 2)
        }
    except Exception as e:
        raise BadRequest(str(e))

@app.route('/api/greenspace', methods=['GET'])
def get_greenspace():
    postcode = request.args.get('postcode')

    if not postcode:
        raise BadRequest("Postcode parameter is required")

    result = calculate_greenspace_percentage(postcode)
    return jsonify(result)

@app.errorhandler(BadRequest)
def handle_bad_request(e):
    return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)