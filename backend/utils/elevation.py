import requests

def get_elevation(lat, lon):
    """Return elevation in meters for lat/lon using Open-Elevation API.

    On any error (network, parsing), return 0 as a safe default.
    """
    try:
        url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat},{lon}"
        r = requests.get(url, timeout=6)
        r.raise_for_status()
        data = r.json()
        return data.get("results", [{}])[0].get("elevation", 0)
    except Exception as e:
        print(f"Warning: get_elevation failed for {lat},{lon}: {e}")
        return 0

#get_elevation(input(),input())