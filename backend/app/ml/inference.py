"""
FireWatch AI — Image preprocessing and model inference.

Class index order (confirmed from training notebook Cell 35):
  Index 0 → Fake   (mapped to "No Fire")
  Index 1 → HIGH   (mapped to "High")
  Index 2 → LOW    (mapped to "Low")
  Index 3 → MEDIUM (mapped to "Medium")

The training notebook uses `ImageDataGenerator.flow_from_directory()` which
assigns class indices in alphabetical order of the subfolder names:
  Fake, HIGH (1), LOW (1), MEDIUM (1)  →  indices 0, 1, 2, 3

Preprocessing matches the training pipeline:
  - Resize to 128×128
  - Normalize pixel values to [0, 1] by dividing by 255.0
  - Expand dims to add batch dimension
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass

import numpy as np
from PIL import Image

from app.ml.model import get_model

logger = logging.getLogger(__name__)

# ---- Class index mapping (from training notebook) ----
# flow_from_directory alphabetical order: Fake=0, HIGH(1)=1, LOW(1)=2, MEDIUM(1)=3
CLASS_INDEX_MAP: dict[int, str] = {
    0: "No Fire",  # Folder: Fake
    1: "High",     # Folder: HIGH (1)
    2: "Low",      # Folder: LOW (1)
    3: "Medium",   # Folder: MEDIUM (1)
}

# Input size expected by the model
INPUT_SIZE = (128, 128)


@dataclass
class PredictionResult:
    """Raw prediction output from the model."""
    predicted_class: str   # One of: No Fire, High, Low, Medium
    confidence: float      # Max softmax probability (0.0–1.0)
    all_probabilities: dict[str, float]  # Class name → probability


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess raw image bytes to match the model's expected input.

    Steps (identical to training):
      1. Open image, convert to RGB
      2. Resize to 128×128
      3. Convert to float32 numpy array
      4. Normalize to [0, 1] by /255.0
      5. Add batch dimension → shape (1, 128, 128, 3)
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(INPUT_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


def predict(image_bytes: bytes) -> PredictionResult:
    """
    Run inference on raw image bytes.

    Returns a PredictionResult with the predicted class name,
    confidence score, and all class probabilities.
    """
    model = get_model()
    preprocessed = preprocess_image(image_bytes)

    # Model outputs shape (1, 4) — softmax probabilities
    probabilities = model.predict(preprocessed, verbose=0)[0]

    predicted_index = int(np.argmax(probabilities))
    predicted_class = CLASS_INDEX_MAP[predicted_index]
    confidence = float(probabilities[predicted_index])

    all_probs = {
        CLASS_INDEX_MAP[i]: float(probabilities[i])
        for i in range(len(probabilities))
    }

    logger.info(
        "Prediction: %s (confidence=%.4f) | All: %s",
        predicted_class, confidence, all_probs,
    )

    return PredictionResult(
        predicted_class=predicted_class,
        confidence=confidence,
        all_probabilities=all_probs,
    )
