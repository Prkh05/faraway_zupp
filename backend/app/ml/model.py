"""
FireWatch AI — ML model loading (singleton).

The TensorFlow/Keras .h5 model is loaded ONCE at application startup
and held in memory for the lifetime of the process.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Module-level singleton
_model: Any = None


def load_model(model_path: Path) -> Any:
    """
    Load the MobileNet .h5 model into memory.

    This should be called exactly once during the FastAPI lifespan startup.
    Subsequent calls are a no-op and return the cached model.
    """
    global _model
    if _model is not None:
        logger.info("Model already loaded — returning cached instance.")
        return _model

    import tensorflow as tf
    import h5py
    import numpy as np
    from tensorflow.keras.applications import MobileNet
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout

    logger.info("Loading MobileNet model weights from %s …", model_path)
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    try:
        # Reconstruct the model sequential architecture exactly as it was built
        base_model = MobileNet(weights=None, include_top=False, input_shape=(128, 128, 3))
        dense_16 = Dense(128, activation='relu', name='dense_16')
        dense_17 = Dense(4, activation='softmax', name='dense_17')

        model = Sequential([
            base_model,
            GlobalAveragePooling2D(name='global_average_pooling2d_6'),
            dense_16,
            Dropout(0.5, name='dropout_8'),
            dense_17
        ])

        # Manually load the weights from the H5 file to avoid Keras 3 deserialization errors
        with h5py.File(str(model_path), 'r') as f:
            weights_group = f['model_weights']

            # 1. Base model layers
            mobilenet_h5 = weights_group['mobilenet_1.00_128']
            for layer in base_model.layers:
                name = layer.name
                if name in mobilenet_h5:
                    g = mobilenet_h5[name]
                    layer_weights = []
                    for w in layer.weights:
                        short_name = w.name.split('/')[-1].split(':')[0]
                        if short_name in g:
                            layer_weights.append(np.array(g[short_name]))
                        else:
                            logger.warning("%s not found in group %s for weight %s", short_name, name, w.name)
                    if layer_weights:
                        layer.set_weights(layer_weights)

            # 2. Top dense layers
            for dense_name, dense_layer in [('dense_16', dense_16), ('dense_17', dense_17)]:
                if dense_name in weights_group:
                    g = weights_group[dense_name]
                    subkeys = list(g.keys())
                    if subkeys:
                        subg = g[subkeys[0]][dense_name]
                        layer_weights = []
                        for w in dense_layer.weights:
                            short_name = w.name.split('/')[-1].split(':')[0]
                            if short_name in subg:
                                layer_weights.append(np.array(subg[short_name]))
                            else:
                                logger.warning("%s not found in group %s", short_name, dense_name)
                        if layer_weights:
                            dense_layer.set_weights(layer_weights)

        logger.info("Model weights loaded successfully manually. Input shape: %s", model.input_shape)
        _model = model
        return _model

    except Exception as e:
        logger.error("Failed to load model manually: %s", str(e), exc_info=True)
        raise RuntimeError(f"Failed to load model: {e}") from e


def get_model() -> Any:
    """
    Return the already-loaded model.
    Raises RuntimeError if called before load_model().
    """
    if _model is None:
        raise RuntimeError(
            "Model not loaded. Ensure load_model() is called during app startup."
        )
    return _model
