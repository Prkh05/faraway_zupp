"""
FireWatch AI — Local file storage for uploaded images.

This module saves images to the local filesystem under UPLOAD_DIR.
It provides a simple abstraction that can be swapped for Supabase Storage
by replacing save_image() with a Supabase client upload call.
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)


def _ensure_upload_dir() -> Path:
    """Create the uploads directory if it doesn't exist."""
    upload_dir = settings.resolved_upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


async def save_image(file_bytes: bytes, incident_id: str, filename: str) -> str:
    """
    Save uploaded image bytes to local storage.

    Args:
        file_bytes:  Raw image bytes from the upload.
        incident_id: The incident ID (used in the filename for traceability).
        filename:    Original filename from the upload.

    Returns:
        Relative URL path for serving the image (e.g. "/uploads/ABC123_photo.jpg").

    To swap to Supabase Storage:
        1. Install supabase-py
        2. Replace this function body with:
           supabase.storage.from_("incidents").upload(path, file_bytes)
           return supabase.storage.from_("incidents").get_public_url(path)
    """
    upload_dir = _ensure_upload_dir()

    # Generate a unique filename to avoid collisions
    ext = Path(filename).suffix or ".jpg"
    safe_name = f"{incident_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = upload_dir / safe_name

    file_path.write_bytes(file_bytes)
    logger.info("Image saved: %s (%d bytes)", file_path, len(file_bytes))

    # Return the URL path (served via FastAPI static mount)
    return f"/uploads/{safe_name}"
