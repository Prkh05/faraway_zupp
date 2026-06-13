"""
FireWatch AI — FastAPI application entry point.

- Loads the ML model once at startup (lifespan)
- Creates database tables
- Mounts static file serving for uploaded images
- Configures CORS for citizen app + dashboard
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.ml.model import load_model
from app.routes.incidents import router as incidents_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup/shutdown lifecycle.

    On startup:
      1. Load the MobileNet model into memory (singleton)
      2. Create database tables (idempotent)
      3. Ensure uploads directory exists
    """
    # --- Startup ---
    logger.info("=" * 60)
    logger.info("FireWatch AI Backend — Starting up")
    logger.info("=" * 60)

    # Load ML model
    model_path = settings.resolved_model_path
    logger.info("Model path: %s", model_path)
    load_model(model_path)

    # Init database tables
    await init_db()
    logger.info("Database initialized: %s", settings.DATABASE_URL)

    # Ensure uploads dir
    upload_dir = settings.resolved_upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Uploads directory: %s", upload_dir)

    logger.info("=" * 60)
    logger.info("FireWatch AI Backend — Ready")
    logger.info("=" * 60)

    yield

    # --- Shutdown ---
    logger.info("FireWatch AI Backend — Shutting down")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="FireWatch AI",
    description="Emergency fire reporting platform with ML-based severity classification",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files — serve uploaded images (ensure directory exists before mounting to avoid Starlette error)
settings.resolved_upload_dir.mkdir(parents=True, exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=str(settings.resolved_upload_dir)),
    name="uploads",
)

# Routes
app.include_router(incidents_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "firewatch-ai"}
