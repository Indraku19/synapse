"""
Embedding generation service.

MVP:  Uses sentence-transformers (all-MiniLM-L6-v2) running locally via
      0G Compute or as a local model.
Mock: Falls back to a random unit vector when the model is not loaded,
      letting the API run without a GPU or model download.
"""
from __future__ import annotations

import logging
import math
import random
from typing import TYPE_CHECKING

from app.config import settings

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

_model = None  # Lazy-loaded


def _load_model():
    global _model
    if _model is not None:
        return _model
    try:
        from fastembed import TextEmbedding  # type: ignore
        logger.info("Loading embedding model: %s", settings.embedding_model)
        _model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        logger.info("Embedding model loaded.")
    except ImportError:
        logger.warning(
            "fastembed not installed — using mock embeddings."
        )
    return _model


def generate_embedding(text: str) -> list[float]:
    """
    Return a float list embedding for the given text.
    Falls back to a deterministic mock vector if the model is unavailable.
    """
    model = _load_model()
    if model is not None:
        vec = list(model.embed([text]))[0]
        return vec.tolist()

    return _mock_embedding(text)


def _mock_embedding(text: str, dim: int = 384) -> list[float]:
    """
    Deterministic mock embedding — same text always produces the same vector.
    Suitable for development / CI; NOT for production semantic search.
    """
    rng = random.Random(hash(text) & 0xFFFFFFFF)
    raw = [rng.gauss(0, 1) for _ in range(dim)]
    norm = math.sqrt(sum(x * x for x in raw)) or 1.0
    return [x / norm for x in raw]
