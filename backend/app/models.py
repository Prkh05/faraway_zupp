"""
FireWatch AI — ORM model for incidents.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_id() -> str:
    return uuid.uuid4().hex[:12].upper()


class Incident(Base):
    """A single fire incident report."""

    __tablename__ = "incidents"

    id: Mapped[str] = Column(String(12), primary_key=True, default=_new_id)

    # Image reference (local path or Supabase URL)
    image_url: Mapped[str] = Column(String(512), nullable=False)

    # Location from citizen GPS
    latitude: Mapped[float] = Column(Float, nullable=False)
    longitude: Mapped[float] = Column(Float, nullable=False)

    # Optional citizen description
    description: Mapped[str | None] = Column(Text, nullable=True)

    # --- ML outputs ---
    # 5-tier severity: No Fire | Low | Medium | High | Critical
    severity: Mapped[str] = Column(String(20), nullable=False)

    # Raw model confidence (max softmax probability)
    confidence: Mapped[float] = Column(Float, nullable=False)

    # Priority score: Critical=100, High=75, Medium=50, Low=25, No Fire=0
    priority_score: Mapped[int] = Column(Integer, nullable=False)

    # --- Status workflow ---
    # One of: Report Submitted | Under Review | Assigned | Responding | Resolved
    status: Mapped[str] = Column(String(30), nullable=False, default="Report Submitted")

    # --- Timestamps ---
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )
