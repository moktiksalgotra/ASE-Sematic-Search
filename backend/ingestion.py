"""Data ingestion from arXiv with rate-limit retries."""

from __future__ import annotations

import re
import time
from typing import Any, Dict, List

import arxiv
from domain_utils import normalize_domain


def clean_text(text: Any) -> str:
    """Normalize spacing and line breaks for string-like metadata."""
    normalized = "" if text is None else str(text)
    cleaned = re.sub(r"\n+", " ", normalized)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def _parse_arxiv_id(entry_id: str) -> str:
    """Extract arXiv id from entry url."""
    if not entry_id:
        return ""
    return entry_id.rstrip("/").split("/")[-1]


def _normalize_domain(primary_category: Any) -> str:
    """Normalize arXiv category to a clean domain bucket."""
    return normalize_domain(clean_text(str(primary_category or "")))


def _without_version(arxiv_id: str) -> str:
    """Drop version suffix from arXiv id (e.g. 1234.5678v2 -> 1234.5678)."""
    token = clean_text(arxiv_id)
    return re.sub(r"v\d+$", "", token, flags=re.IGNORECASE)


def _resolve_domains_from_arxiv(arxiv_ids: List[str]) -> Dict[str, str]:
    """Best-effort domain lookup via arxiv package for ids missing categories."""
    ids = [_without_version(item) for item in arxiv_ids if item]
    ids = list(dict.fromkeys(ids))
    if not ids:
        return {}

    try:
        results = arxiv.Client().results(arxiv.Search(id_list=ids, max_results=len(ids)))
    except Exception:
        return {}

    mapping: Dict[str, str] = {}
    for result in results:
        try:
            short_id = clean_text(result.get_short_id())
            base_id = _without_version(short_id)
            category = getattr(result, "primary_category", "") or ""
            domain = _normalize_domain(category)
            if base_id and domain and domain != "unknown":
                mapping[base_id] = domain
        except Exception:
            continue
    return mapping


def _fetch_search_results(topic: str, max_results: int) -> List[Any]:
    """Fetch arXiv results with small exponential backoff on HTTP 429."""
    retries = 3
    # Keep page size small to reduce 429 frequency.
    client = arxiv.Client(page_size=min(max_results, 25), delay_seconds=3, num_retries=2)
    search = arxiv.Search(
        query=topic.strip(),
        max_results=max_results,
        sort_by=arxiv.SortCriterion.Relevance,
        sort_order=arxiv.SortOrder.Descending,
    )

    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            return list(client.results(search))
        except Exception as exc:
            last_error = exc
            message = str(exc).lower()
            is_rate_limited = "429" in message or "too many requests" in message
            if not is_rate_limited or attempt == retries:
                raise
            # 2s, 4s, 8s backoff on transient rate limit.
            time.sleep(2 ** (attempt + 1))

    if last_error is not None:
        raise last_error
    return []


def fetch_arxiv_papers(topic: str, max_results: int = 30) -> List[Dict[str, Any]]:
    """Fetch and normalize papers from arXiv."""
    if not topic or not topic.strip():
        raise ValueError("Topic cannot be empty.")
    max_results = int(max_results)
    if not 5 <= max_results <= 30:
        raise ValueError("max_results must be between 5 and 30.")

    try:
        results = _fetch_search_results(topic, max_results)
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch papers from arXiv: {exc}") from exc

    if not results:
        raise ValueError(f"No papers found for topic: '{topic}'.")

    paper_rows: List[Dict[str, Any]] = []
    for result in results:
        published_dt = getattr(result, "published", None)
        published = clean_text(published_dt.isoformat() if published_dt else "")
        year = int(published[:4]) if published[:4].isdigit() else 0
        authors_raw = getattr(result, "authors", []) or []
        authors = ", ".join(clean_text(getattr(author, "name", author)) for author in authors_raw if str(author).strip())

        primary_category = getattr(result, "primary_category", "") or ""
        domain = _normalize_domain(primary_category)
        entry_id = clean_text(getattr(result, "entry_id", "") or "")
        short_id = clean_text(result.get_short_id()) if hasattr(result, "get_short_id") else ""
        arxiv_id = _without_version(short_id) if short_id else _parse_arxiv_id(entry_id)
        pdf_url = clean_text(getattr(result, "pdf_url", "") or "")
        url = pdf_url or entry_id

        paper_rows.append(
            {
                "arxiv_id": clean_text(arxiv_id),
                "title": clean_text(getattr(result, "title", "") or ""),
                "abstract": clean_text(getattr(result, "summary", "") or ""),
                "authors": authors or "Unknown",
                "published": published or "Unknown",
                "year": year,
                "domain": domain,
                "url": clean_text(str(url or "")),
            }
        )

    resolved_domains = _resolve_domains_from_arxiv([paper.get("arxiv_id", "") for paper in paper_rows])
    papers: List[Dict[str, Any]] = []
    for paper in paper_rows:
        if paper["domain"] == "unknown":
            fallback = resolved_domains.get(_without_version(paper.get("arxiv_id", "")), "")
            if fallback:
                paper["domain"] = fallback
        papers.append(paper)

    # Skip malformed entries with missing identifiers or abstracts.
    valid_papers = [
        p
        for p in papers
        if p["arxiv_id"] and p["title"] and p["abstract"] and p["url"]
    ]
    if not valid_papers:
        raise ValueError("No valid papers were returned by arXiv.")
    return valid_papers
