from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from geoalchemy2.shape import to_shape

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/v1",
    tags=["community"],
)


@router.post("/reports", status_code=201, response_model=schemas.ReportBase)
def create_report(report: schemas.ReportCreate, db: Session = Depends(get_db)):
    wkt_location = f'POINT({report.longitude} {report.latitude})'
    new_report = models.Report(
        location=wkt_location,
        report_type=report.report_type,
        details=report.details,
        image_url=report.image_url,
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    point = to_shape(new_report.location)
    new_report.latitude = point.y
    new_report.longitude = point.x

    return new_report


@router.get("/reports", response_model=list[schemas.ReportBase])
def get_all_reports(db: Session = Depends(get_db)):
    reports = db.query(models.Report).all()
    for report in reports:
        point = to_shape(report.location)
        report.latitude = point.y
        report.longitude = point.x
    return reports


@router.post("/posts", status_code=201, response_model=schemas.PostBase)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db)):
    new_post = models.Post(**post.model_dump())
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.get("/posts", response_model=list[schemas.PostBase])
def get_posts(db: Session = Depends(get_db), lat: float = None, lng: float = None, radius: float = None):
    query = db.query(models.Post)
    # For production, use a proper geospatial query with ST_DWithin if PostGIS is enabled.
    # This is a simplified square-based filter. Radius is in degrees.
    if lat is not None and lng is not None and radius is not None:
        query = query.filter(
            models.Post.latitude.between(lat - radius, lat + radius),
            models.Post.longitude.between(lng - radius, lng + radius)
        )
    posts = query.order_by(models.Post.created_at.desc()).all()
    return posts