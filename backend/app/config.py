"""
FireWatch AI — Application settings.

All configuration is loaded from environment variables / .env file.
See .env.example for documentation of each variable.
"""

from __future__ import annotations

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from env vars / .env file."""

    # --- Model ---
    MODEL_PATH: str = "../MobileNet_model.h5"

    # --- Database ---
    # Default: async SQLite (zero-config, works out of the box)
    DATABASE_URL: str = "sqlite+aiosqlite:///./firewatch.db"

    # --- Storage ---
    UPLOAD_DIR: str = "./uploads"

    # --- ML Post-processing ---
    # If the model predicts "High" with confidence >= this threshold,
    # the severity is promoted to "Critical".
    # This is the ONLY place the Critical derivation rule threshold lives.
    CRITICAL_CONFIDENCE_THRESHOLD: float = 0.90

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081,http://localhost:19006"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def resolved_model_path(self) -> Path:
        """Resolve MODEL_PATH relative to the backend/ directory."""
        p = Path(self.MODEL_PATH)
        if p.is_absolute():
            return p
        return (Path(__file__).resolve().parent.parent / p).resolve()

    @property
    def resolved_upload_dir(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        if p.is_absolute():
            return p
        return (Path(__file__).resolve().parent.parent / p).resolve()

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
