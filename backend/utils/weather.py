import requests

from ..config import WEATHERAPI_KEY


def get_rainfall(lat, lon):
    """Return recent precipitation (mm) at the given lat/lon using WeatherAPI.

    Requires WEATHERAPI_KEY to be set. Returns 0 if the key is missing or on error.
    """
    if not WEATHERAPI_KEY:
        print("WEATHERAPI_KEY not set; cannot fetch rainfall")
        return 0

    try:
        # WeatherAPI current weather endpoint
        url = f"http://api.weatherapi.com/v1/current.json?key={WEATHERAPI_KEY}&q={lat},{lon}&aqi=no"
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        # WeatherAPI returns current.precip_mm (float)
        current = data.get("current", {})
        precip_mm = current.get("precip_mm", 0)
        try:
            return float(precip_mm)
        except Exception:
            return 0
    except Exception as e:
        print("Error fetching rainfall from WeatherAPI:", e)
        return 0
