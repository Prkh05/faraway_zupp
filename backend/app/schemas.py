"""
FireWatch AI — Pydantic schemas for request/response validation.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SeverityLevel(str, Enum):
    NO_FIRE = "No Fire"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class IncidentStatus(str, Enum):
    REPORT_SUBMITTED = "Report Submitted"
    UNDER_REVIEW = "Under Review"
    ASSIGNED = "Assigned"
    RESPONDING = "Responding"
    RESOLVED = "Resolved"


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class ReportResponse(BaseModel):
    """Returned after a citizen submits a report."""
    incident_id: str
    status: str

    class Config:
        from_attributes = True


class IncidentDetail(BaseModel):
    """Full incident record returned to the dashboard."""
    id: str
    image_url: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    severity: str
    confidence: float
    priority_score: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncidentStatusResponse(BaseModel):
    """Returned to citizens — status + timestamps only, NO severity."""
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StatusUpdateRequest(BaseModel):
    """Body for PATCH /incident/{id}/status."""
    status: IncidentStatus = Field(
        ...,
        description="New status. One of: Report Submitted, Under Review, Assigned, Responding, Resolved",
    )
