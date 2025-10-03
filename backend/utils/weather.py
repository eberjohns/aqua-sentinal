import requests

from ..config import OPENWEATHER_API_KEY

def get_rainfall(lat, lon):
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        r = requests.get(url)
        data = r.json()
        rain = data.get("rain", {})
        # take 1h rainfall if available, else 3h, else 0
        rainfall = rain.get("1h", rain.get("3h", 0))
        return rainfall
    except Exception as e:
        print("Error fetching rainfall:", e)
        return 0
