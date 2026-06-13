"""
FireWatch AI — API routes for incident management.

Endpoints:
  POST   /report              — Submit a new fire report (citizen)
  GET    /incident/{id}       — Get incident status (citizen)
  GET    /incidents           — List all incidents sorted by priority (dashboard)
  PATCH  /incident/{id}/status — Update incident status (dashboard)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.ml.inference import predict
from app.ml.severity import derive_severity, get_priority_score
from app.models import Incident
from app.schemas import (
    IncidentDetail,
    IncidentStatusResponse,
    ReportResponse,
    StatusUpdateRequest,
)
from app.storage.local import save_image

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /report
# ---------------------------------------------------------------------------

@router.post("/report", response_model=ReportResponse, status_code=201)
async def submit_report(
    image: UploadFile = File(..., description="Fire image from citizen"),
    latitude: float = Form(..., description="GPS latitude"),
    longitude: float = Form(..., description="GPS longitude"),
    description: str = Form(None, description="Optional text description"),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a new fire report.

    1. Save image to storage
    2. Run ML inference for severity prediction
    3. Apply Critical derivation rule
    4. Compute priority score
    5. Store incident in database
    6. Return incident ID + initial status
    """
    # Read image bytes
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    import uuid
    incident_id = uuid.uuid4().hex[:12].upper()

    # Save image to storage
    image_url = await save_image(image_bytes, incident_id, image.filename or "upload.jpg")

    # Create incident with generated ID
    incident = Incident(
        id=incident_id,
        image_url=image_url,
        latitude=latitude,
        longitude=longitude,
        description=description,
        severity="",  # placeholder
        confidence=0.0,
        priority_score=0,
    )

    # Run ML inference
    prediction = predict(image_bytes)

    # Apply 4→5 tier mapping (Critical derivation rule)
    severity = derive_severity(prediction.predicted_class, prediction.confidence)
    priority_score = get_priority_score(severity)

    # Update incident with ML results
    incident.severity = severity
    incident.confidence = prediction.confidence
    incident.priority_score = priority_score

    logger.info(
        "New incident %s: severity=%s, confidence=%.4f, priority=%d",
        incident.id, severity, prediction.confidence, priority_score,
    )

    db.add(incident)
    await db.flush()

    return ReportResponse(incident_id=incident.id, status=incident.status)


# ---------------------------------------------------------------------------
# GET /incident/{id}
# ---------------------------------------------------------------------------

@router.get("/incident/{incident_id}", response_model=IncidentStatusResponse)
async def get_incident_status(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get current status and timestamps for an incident.

    This is the citizen-facing endpoint — it does NOT return
    severity, confidence, or priority score.
    """
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    return IncidentStatusResponse(
        id=incident.id,
        status=incident.status,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
    )


# ---------------------------------------------------------------------------
# GET /incidents
# ---------------------------------------------------------------------------

@router.get("/incidents", response_model=list[IncidentDetail])
async def list_incidents(
    db: AsyncSession = Depends(get_db),
):
    """
    List all incidents sorted by priority score (descending).

    This is the dashboard-facing endpoint — returns full detail
    including severity, confidence, and priority.
    """
    result = await db.execute(
        select(Incident).order_by(Incident.priority_score.desc(), Incident.created_at.desc())
    )
    incidents = result.scalars().all()

    return [IncidentDetail.model_validate(inc) for inc in incidents]


# ---------------------------------------------------------------------------
# PATCH /incident/{id}/status
# ---------------------------------------------------------------------------

@router.patch("/incident/{incident_id}/status", response_model=IncidentDetail)
async def update_incident_status(
    incident_id: str,
    body: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Update the status of an incident.

    Valid statuses: Report Submitted, Under Review, Assigned, Responding, Resolved.
    Each action from the dashboard maps to a status transition:
      Accept   → "Under Review"
      Dispatch → "Responding"
      Resolve  → "Resolved"
    """
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = body.status.value
    incident.updated_at = datetime.now(timezone.utc)
    await db.flush()

    logger.info("Incident %s status updated to: %s", incident_id, body.status.value)

    return IncidentDetail.model_validate(incident)
