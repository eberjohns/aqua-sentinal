import uuid
from typing import ClassVar

from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, DOUBLE_PRECISION
from sqlalchemy.sql import func
from geoalchemy2 import Geography

from .database import Base


class User(Base):
    __tablename__ = 'users'
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())


class Post(Base):
    __tablename__ = 'posts'
    post_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user = Column(String(100), nullable=False)
    caption = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)
    latitude = Column(DOUBLE_PRECISION, nullable=True)
    longitude = Column(DOUBLE_PRECISION, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())


class Report(Base):
    __tablename__ = 'reports'
    report_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location = Column(Geography('POINT', srid=4326), nullable=False)
    report_type = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default='UNVERIFIED')
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    latitude: ClassVar[float]
    longitude: ClassVar[float]


class DamOpening(Base):
    __tablename__ = 'dam_openings'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    latitude = Column(DOUBLE_PRECISION, nullable=False)
    longitude = Column(DOUBLE_PRECISION, nullable=False)
    opening_time = Column(TIMESTAMP(timezone=True), nullable=False)
    notification_sent = Column(TIMESTAMP(timezone=True), nullable=True)