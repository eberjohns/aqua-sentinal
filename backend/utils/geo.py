import math
import json
from functools import lru_cache

# Haversine distance (km)
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2)
    return 2 * R * math.asin(math.sqrt(a))

# Load rivers and cache the result in memory
@lru_cache(maxsize=1)
def load_rivers():
    import os
    # Try to find the JSON file relative to this script
    here = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(here, "..", "..", "kerala_water_bodies.json")
    json_path = os.path.abspath(json_path)
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)

# Find nearest river coordinate
def nearest_alert_river(user_lat, user_lon):
    rivers = load_rivers()
    nearest_river = None
    nearest_point = None
    min_dist = float("inf")

    for river in rivers:
        if not river.get("has_alert", False):
            continue
        for pt in river["coords"]:
            dist = haversine(user_lat, user_lon, pt["lat"], pt["lon"])
            if dist < min_dist:
                min_dist = dist
                nearest_river = river
                nearest_point = pt

    return nearest_river, nearest_point, min_dist
