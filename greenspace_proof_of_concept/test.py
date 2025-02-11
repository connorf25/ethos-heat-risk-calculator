import geopandas as gpd
import osmnx as ox

# 1. Load ABS boundary
abs_postcodes = gpd.read_file("abs_data/POA_2021_AUST_GDA2020.shp")
postcode_2000 = abs_postcodes[abs_postcodes['POA_CODE21'] == '2000'].to_crs(epsg=4326)

# 2. Fetch greenspaces
tags = {'leisure': ['park', 'garden'], 'landuse': ['grass', 'forest']}
greenspaces = ox.features_from_polygon(postcode_2000.geometry.unary_union, tags)

# 3. Calculate area percentage (use projected CRS)
postcode_proj = postcode_2000.to_crs(epsg=3577)
greenspaces_proj = greenspaces.to_crs(epsg=3577)
greenspace_area = greenspaces_proj.geometry.area.sum()
postcode_area = postcode_proj.geometry.area.sum()

percentage = (greenspace_area / postcode_area) * 100
print(f"Greenspace: {percentage:.2f}%")