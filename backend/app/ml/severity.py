"""
FireWatch AI — Severity derivation and priority scoring.

=== KNOWN GAP (transparent for hackathon judging) ===

The MobileNet model outputs 4 classes:
  No Fire, Low, Medium, High

The application uses a 5-tier severity scale:
  No Fire, Low, Medium, High, **Critical**

"Critical" does NOT exist in the model's training data.
It is derived via a deterministic post-processing rule:

  RULE: If the model predicts "High" AND the confidence score
        is >= CRITICAL_CONFIDENCE_THRESHOLD (default: 0.90),
        then the severity is promoted from "High" to "Critical".

  RATIONALE: A very confident "High" prediction suggests an
  unambiguous, severe fire that warrants the highest priority.

This rule is:
  - Isolated in a single function (derive_severity)
  - Configurable via the CRITICAL_CONFIDENCE_THRESHOLD env var
  - Easy to demo and adjust live during a presentation
  - Clearly documented as a post-processing heuristic, not a model output

=================================================================
"""

from __future__ import annotations

import logging

from app.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Priority score mapping
# ---------------------------------------------------------------------------
PRIORITY_MAP: dict[str, int] = {
    "Critical": 100,
    "High": 75,
    "Medium": 50,
    "Low": 25,
    "No Fire": 0,
}


def derive_severity(predicted_class: str, confidence: float) -> str:
    """
    Map the model's 4-class prediction to the app's 5-tier severity.

    Args:
        predicted_class: One of "No Fire", "Low", "Medium", "High"
                         (from the model's softmax output).
        confidence:      The model's confidence score for the predicted class
                         (max softmax probability, 0.0–1.0).

    Returns:
        One of: "No Fire", "Low", "Medium", "High", "Critical"

    Critical derivation rule:
        High + confidence >= threshold  →  "Critical"
        Everything else                →  pass-through
    """
    threshold = settings.CRITICAL_CONFIDENCE_THRESHOLD

    if predicted_class == "High" and confidence >= threshold:
        logger.info(
            "Promoting High → Critical (confidence=%.4f >= threshold=%.2f)",
            confidence,
            threshold,
        )
        return "Critical"

    return predicted_class


def get_priority_score(severity: str) -> int:
    """
    Convert a 5-tier severity label to a numeric priority score.

    Args:
        severity: One of "No Fire", "Low", "Medium", "High", "Critical"

    Returns:
        Integer priority score (0–100).
    """
    score = PRIORITY_MAP.get(severity)
    if score is None:
        logger.warning("Unknown severity '%s' — defaulting to priority 0", severity)
        return 0
    return score
