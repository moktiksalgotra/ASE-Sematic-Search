"""Utilities for normalizing arXiv categories into UI-friendly domains."""

from __future__ import annotations

import re
from typing import Optional


def normalize_domain(value: Optional[str]) -> str:
    """Map raw arXiv category tokens to stable, readable domain buckets."""
    raw = str(value or "").strip().lower()
    if not raw:
        return "unknown"

    token = raw.split(",")[0].split()[0].strip().lower()
    token = re.sub(r"[^a-z0-9.\-]+", "", token)
    if not token:
        return "unknown"

    if token.startswith("quant-ph"):
        return "quantum-physics"
    if token.startswith("astro-ph"):
        return "astrophysics"
    if token.startswith("physics."):
        return "physics"
    if token == "physics":
        return "physics"
    if token.startswith("cs."):
        return "computer-science"
    if token == "cs":
        return "computer-science"
    if token.startswith("math."):
        return "mathematics"
    if token == "math":
        return "mathematics"
    if token.startswith("stat."):
        return "statistics"
    if token == "stat":
        return "statistics"
    if token.startswith("q-bio"):
        return "quantitative-biology"
    if token.startswith("q-fin"):
        return "quantitative-finance"
    if token.startswith("eess"):
        return "electrical-engineering"
    if token.startswith("econ"):
        return "economics"

    return token
