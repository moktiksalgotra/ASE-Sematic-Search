"""Chroma vector store operations."""

from __future__ import annotations

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

import chromadb
from chromadb.api.models.Collection import Collection
from domain_utils import normalize_domain


PERSIST_DIR = Path(__file__).resolve().parent / "chroma_db"
COLLECTION_NAME = "academic_papers"


def get_collection() -> Collection:
    """Get or create the Chroma collection."""
    client = chromadb.PersistentClient(path=str(PERSIST_DIR))
    return client.get_or_create_collection(name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"})


def upsert_papers(
    arxiv_ids: List[str],
    embeddings: List[List[float]],
    documents: List[str],
    metadatas: List[Dict[str, Any]],
) -> None:
    """Upsert papers into Chroma."""
    if not arxiv_ids:
        return
    collection = get_collection()
    collection.upsert(ids=arxiv_ids, embeddings=embeddings, documents=documents, metadatas=metadatas)


def semantic_search(query_embedding: List[float], top_k: int = 10) -> Dict[str, Any]:
    """Retrieve nearest papers from Chroma."""
    collection = get_collection()
    return collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["distances", "metadatas", "documents"],
    )


def collection_count() -> int:
    """Return total number of indexed vectors."""
    return get_collection().count()


def has_index() -> bool:
    """Check whether collection has indexed documents."""
    try:
        return collection_count() > 0
    except Exception:
        return False


def get_all_indexed_papers() -> List[Dict[str, Any]]:
    """Return unique paper metadata from Chroma (one row per arXiv id)."""
    collection = get_collection()
    total = collection.count()
    if total <= 0:
        return []

    payload = collection.get(include=["metadatas"])
    metadatas: List[Dict[str, Any]] = payload.get("metadatas", []) or []

    unique: Dict[str, Dict[str, Any]] = {}
    for metadata in metadatas:
        if not metadata:
            continue
        arxiv_id = str(metadata.get("arxiv_id", "")).strip()
        if not arxiv_id:
            continue

        # Prefer chunk-0 when available as canonical row.
        chunk_idx = int(metadata.get("chunk_index", 999999))
        existing = unique.get(arxiv_id)
        if existing is None or chunk_idx < int(existing.get("chunk_index", 999999)):
            unique[arxiv_id] = metadata

    papers = []
    for item in unique.values():
        papers.append(
            {
                "arxiv_id": item.get("arxiv_id"),
                "title": item.get("title"),
                "abstract": item.get("abstract"),
                "authors": item.get("authors"),
                "published": item.get("published"),
                "year": item.get("year"),
                "domain": normalize_domain(str(item.get("domain", ""))),
                "url": item.get("url"),
            }
        )

    papers.sort(key=lambda p: str(p.get("published", "")), reverse=True)
    return papers
