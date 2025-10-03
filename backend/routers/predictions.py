from fastapi import APIRouter, HTTPException

from .. import schemas
from ..utils.geo import nearest_alert_river
from ..utils.elevation import get_elevation
from ..utils.weather import get_rainfall

router = APIRouter()

# --- Prediction Model Constants ---
# These coefficients can be calibrated with real-world data.
K_RAINFALL = 0.02       # meters per mm of rain
K_INFLOW = 0.1          # meters per cubic meter per second
K_DAM_RELEASE = 0.05    # meters per unit dam release
DISCHARGE_FACTOR = 0.05 # 5% natural flow reduction


@router.get("/rainfall")
def rainfall_endpoint(lat: float, lon: float):
    """Fetch rainfall at a given location (lat, lon)."""
    rainfall = get_rainfall(lat, lon)
    rounded = round(rainfall, 2)
    return {"lat": lat, "lon": lon, "rainfall_mm": rounded, "amount": rounded}


@router.post("/predict")
def predict_math(input_data: schemas.FloodInput):
    # Call the utility function directly instead of the endpoint
    rainfall = get_rainfall(input_data.lat, input_data.lon)
    
    predicted_rise = (K_RAINFALL * rainfall +
                      K_INFLOW * input_data.inflow +
                      K_DAM_RELEASE * input_data.dam_release)

    predicted_level = input_data.river_level_now + predicted_rise
    predicted_level = predicted_level * (1 - DISCHARGE_FACTOR)

    return {
        "predicted_future_level_meters": round(predicted_level, 2),
        "used_rainfall_mm": rainfall
    }


@router.get("/risk_alert")
def risk_alert(lat: float, lon: float):
    try:
        river, closest_point, distance = nearest_alert_river(lat, lon)
        if not river or not closest_point:
            return {"risk": "LOW", "message": "No nearby rivers with active flood alerts."}

        user_elev = get_elevation(lat, lon)
        river_elev = get_elevation(closest_point["lat"], closest_point["lon"])
        # Call the utility function directly
        rainfall = get_rainfall(lat, lon)

        risk = "HIGH" if user_elev < river_elev and distance < 10 else "MEDIUM" if user_elev < river_elev and distance < 25 else "LOW"

        return {"nearest_river": river["name"], "nearest_point": closest_point, "distance_km": round(distance, 2), "river_elevation": round(river_elev, 1), "user_elevation": round(user_elev, 1), "rainfall_mm": rainfall, "risk": risk}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error in /risk_alert: {e}")