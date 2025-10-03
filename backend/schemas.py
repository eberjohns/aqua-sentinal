import uuid
from datetime import datetime
from pydantic import BaseModel


# --- Prediction Schemas ---
class FloodInput(BaseModel):
    river_level_now: float
    dam_release: float
    inflow: float
    actual_future_level: float = None  # optional for logging
    lat: float
    lon: float


# --- Report Schemas ---
class ReportCreate(BaseModel):
    latitude: float
    longitude: float
    report_type: str
    details: str | None = None
    image_url: str | None = None


class ReportBase(BaseModel):
    report_id: uuid.UUID
    latitude: float
    longitude: float
    report_type: str
    details: str | None
    status: str
    image_url: str | None

    class Config:
        from_attributes = True


# --- Community Post Schemas ---
class PostCreate(BaseModel):
    user: str
    caption: str
    image_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class PostBase(BaseModel):
    post_id: uuid.UUID
    user: str
    caption: str
    image_url: str | None
    latitude: float | None
    longitude: float | None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Dam Schemas ---
class DamOpeningCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    time: datetime


class DamOpening(BaseModel):
    id: uuid.UUID
    name: str
    latitude: float
    longitude: float
    opening_time: datetime

    class Config:
        from_attributes = True