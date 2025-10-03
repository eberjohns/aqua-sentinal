import requests

def get_elevation(lat, lon):
    url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat},{lon}"
    r = requests.get(url).json()
    #print(r["results"][0]["elevation"])
    return r["results"][0]["elevation"]

#get_elevation(input(),input())