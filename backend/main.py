import threading
import time
import csv
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../notification'))
from .notification_function import send_email_notification

from . import models, schemas
from fastapi import HTTPException
from dateutil import parser as date_parser
import pytz
from .database import engine, Base, SessionLocal, get_db
from .config import RECIPIENTS_CSV
from .routers import predictions, community, news

# Create database tables
Base.metadata.create_all(bind=engine)

# --- FastAPI App Initialization ---
app = FastAPI()

# CORS: allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Notification config
NOTIFY_MINUTES_BEFORE = 1  # <--- Change this to adjust pre-notification time
from functools import lru_cache

@lru_cache(maxsize=1)
def get_recipients():
    recipients = []
    try:
        with open(RECIPIENTS_CSV, newline='') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                if row:
                    recipients.append(row[0])
    except Exception as e:
        print(f"Error reading recipients: {e}")
    print(recipients)
    return recipients

def scheduler():
    while True:
        db = SessionLocal()
        try:
            now = datetime.now(timezone.utc)
            notify_window_start = now + timedelta(minutes=NOTIFY_MINUTES_BEFORE)

            dams_to_notify = db.query(models.DamOpening).filter(
                models.DamOpening.notification_sent == None,
                models.DamOpening.opening_time <= notify_window_start,
                models.DamOpening.opening_time > now
            ).all()

            for dam in dams_to_notify:
                recipients = get_recipients()
                print(f"[NOTIFY] Sending notification for {dam.name} to {recipients}")
                subject = f"Dam Opening Alert: {dam.name}"
                html_body = f"""
                    <html><body>
                    <h2>Dam Opening Alert</h2>
                    <p>The dam <b>{dam.name}</b> (Lat: {dam.latitude}, Lng: {dam.longitude}) is scheduled to open at {dam.opening_time.strftime('%Y-%m-%d %H:%M:%S %Z')}.</p>
                    <p>Please take necessary precautions.</p>
                    </body></html>
                    """
                try:
                    # send_email_notification(recipients, subject, html_body)
                    print(f"[NOTIFY] Email sent for {dam.name}")
                    dam.notification_sent = datetime.now(timezone.utc)
                    db.commit()
                except Exception as e:
                    print(f"[ERROR] Failed to send email for {dam.name}: {e}")
                    db.rollback()

            # Optional: Clean up old, processed dam openings
            db.query(models.DamOpening).filter(models.DamOpening.opening_time < now).delete()
            db.commit()
        finally:
            db.close()

        time.sleep(10)

threading.Thread(target=scheduler, daemon=True).start()

# --- API Endpoints ---
app.include_router(predictions.router)
app.include_router(community.router)
app.include_router(news.router, prefix="/api/v1")

@app.get("/api/v1/dam-openings", response_model=List[schemas.DamOpening])
def get_dam_openings(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    openings = db.query(models.DamOpening).filter(models.DamOpening.opening_time > now).order_by(models.DamOpening.opening_time).all()
    return openings

@app.post("/api/v1/dam-openings", response_model=schemas.DamOpening, status_code=201)
def add_dam_opening(opening: schemas.DamOpeningCreate, db: Session = Depends(get_db)):
    # Accept either `time` (from create payload) or `opening_time` if provided
    raw_time = getattr(opening, 'time', None)
    if raw_time is None:
        # try to read opening_time if present in incoming JSON
        # pydantic model DamOpeningCreate defines `time`, so this is a defensive check
        raise HTTPException(status_code=400, detail="Missing time field for dam opening")

    # Ensure we have a timezone-aware datetime in UTC
    try:
        if isinstance(raw_time, str):
            dt = date_parser.isoparse(raw_time)
        else:
            dt = raw_time
        if dt.tzinfo is None:
            # assume local naive times are UTC
            dt = dt.replace(tzinfo=timezone.utc)
        dt_utc = dt.astimezone(pytz.UTC)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid time format: {e}")

    new_opening = models.DamOpening(
        name=opening.name,
        latitude=opening.latitude,
        longitude=opening.longitude,
        opening_time=dt_utc
    )
    db.add(new_opening)
    db.commit()
    db.refresh(new_opening)
    return new_opening
