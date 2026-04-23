"""Embedding utilities for search and indexing."""

from __future__ import annotations

from functools import lru_cache
from typing import List

from sentence_transformers import SentenceTransformer


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """Load sentence-transformers model once per process."""
    return SentenceTransformer(MODEL_NAME)


def embed_text(text: str) -> List[float]:
    """Embed a single text input."""
    model = get_embedding_model()
    return model.encode(text, normalize_embeddings=True).tolist()


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed multiple text inputs in batch."""
    if not texts:
        return []
    model = get_embedding_model()
    return model.encode(texts, normalize_embeddings=True).tolist()
