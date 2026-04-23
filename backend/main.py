"""FastAPI service for semantic academic search."""

from __future__ import annotations

from datetime import datetime
import re
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from domain_utils import normalize_domain
from embeddings import embed_text, embed_texts
from ingestion import fetch_arxiv_papers
from rag import generate_answer, summarize_paper
from vectorstore import get_all_indexed_papers, has_index, semantic_search, upsert_papers

load_dotenv()


class IngestRequest(BaseModel):
    topic: str = Field(..., min_length=2)
    max_results: int = Field(default=30, ge=5, le=30)


class SearchFilters(BaseModel):
    year: Optional[int] = None
    domain: Optional[str] = None
    author: Optional[str] = None


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    filters: SearchFilters = Field(default_factory=SearchFilters)


class SummarizePaperRequest(BaseModel):
    title: str
    authors: str
    year: int
    domain: str
    abstract: str


app = FastAPI(title="Semantic Academic Search Engine", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _keyword_score(query: str, title: str, abstract: str) -> float:
    tokens = [token for token in query.lower().split() if token.strip()]
    if not tokens:
        return 0.0
    haystack = f"{title} {abstract}".lower()
    matches = sum(1 for token in tokens if token in haystack)
    return matches / len(tokens)


def _recency_score(year: int) -> float:
    current_year = datetime.utcnow().year
    if year <= 0:
        return 0.0
    age = max(0, current_year - year)
    return max(0.0, 1.0 - (age / 15))


def _normalize_similarity(distance: float) -> float:
    # Chroma cosine distance is lower-is-better; convert to [0, 1] similarity.
    return max(0.0, min(1.0, 1.0 - float(distance)))


def _abstract_snippet(text: str, limit: int = 320) -> str:
    cleaned = str(text or "").strip()
    if len(cleaned) <= limit:
        return cleaned
    return f"{cleaned[:limit]}..."


def _chunk_text(text: str, chunk_size: int = 900, overlap: int = 150) -> List[str]:
    """Split text into overlapping character chunks for better retrieval granularity."""
    cleaned = str(text or "").strip()
    if not cleaned:
        return []
    if len(cleaned) <= chunk_size:
        return [cleaned]

    chunks: List[str] = []
    step = max(1, chunk_size - overlap)
    start = 0
    while start < len(cleaned):
        end = min(len(cleaned), start + chunk_size)
        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(cleaned):
            break
        start += step
    return chunks


def _matches_filters(paper: Dict[str, Any], filters: SearchFilters) -> bool:
    if filters.year and int(paper.get("year", 0)) != filters.year:
        return False
    if filters.domain:
        filter_domain = normalize_domain(filters.domain)
        paper_domain = normalize_domain(str(paper.get("domain", "")))
        if filter_domain and filter_domain != paper_domain:
            return False
    if filters.author and filters.author.strip().lower() not in str(paper.get("authors", "")).lower():
        return False
    return True


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/papers")
def papers() -> Dict[str, Any]:
    items = get_all_indexed_papers()
    return {"count": len(items), "papers": items}


@app.post("/ingest")
def ingest(payload: IngestRequest) -> Dict[str, Any]:
    try:
        papers = fetch_arxiv_papers(payload.topic, payload.max_results)

        chunk_ids: List[str] = []
        docs_for_embedding: List[str] = []
        metadata: List[Dict[str, Any]] = []
        total_chunks = 0
        for paper in papers:
            paper_chunks = _chunk_text(paper["abstract"])
            if not paper_chunks:
                paper_chunks = [paper["abstract"]]
            total_chunks += len(paper_chunks)
            for idx, chunk in enumerate(paper_chunks):
                chunk_ids.append(f"{paper['arxiv_id']}::chunk-{idx}")
                docs_for_embedding.append(f"{paper['title']}\n\n{chunk}")
                metadata.append(
                    {
                        "arxiv_id": paper["arxiv_id"],
                        "title": paper["title"],
                        "authors": paper["authors"],
                        "year": paper["year"],
                        "domain": paper["domain"],
                        "url": paper["url"],
                        "published": paper["published"],
                        "abstract": paper["abstract"],
                        "chunk_index": idx,
                        "chunk_count": len(paper_chunks),
                    }
                )

        vectors = embed_texts(docs_for_embedding)
        upsert_papers(
            arxiv_ids=chunk_ids,
            embeddings=vectors,
            documents=docs_for_embedding,
            metadatas=metadata,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "topic": payload.topic,
        "fetched": len(papers),
        "inserted_new": len(papers),
        "indexed_total": len(papers),
        "indexed_chunks": total_chunks,
    }


@app.post("/search")
def search(payload: SearchRequest) -> Dict[str, Any]:
    if not has_index():
        raise HTTPException(status_code=400, detail="No indexed papers. Run /ingest first.")

    try:
        query_embedding = embed_text(payload.query)
        raw = semantic_search(query_embedding, top_k=40)
        metadatas: List[Dict[str, Any]] = raw.get("metadatas", [[]])[0]
        distances: List[float] = raw.get("distances", [[]])[0]
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Search failed: {exc}") from exc

    grouped: Dict[str, Dict[str, Any]] = {}
    for metadata, distance in zip(metadatas, distances):
        if not metadata:
            continue
        if not _matches_filters(metadata, payload.filters):
            continue

        key = str(metadata.get("arxiv_id", ""))
        if not key:
            continue
        semantic = _normalize_similarity(distance)
        existing = grouped.get(key)
        if existing is None or semantic > float(existing.get("semantic_score", 0.0)):
            grouped[key] = {**metadata, "semantic_score": semantic}

    scored = []
    for metadata in grouped.values():
        recency = _recency_score(int(metadata.get("year", 0)))
        keyword = _keyword_score(payload.query, str(metadata.get("title", "")), str(metadata.get("abstract", "")))
        final_score = 0.6 * float(metadata["semantic_score"]) + 0.2 * recency + 0.2 * keyword
        scored.append(
            {
                "arxiv_id": metadata.get("arxiv_id"),
                "url": metadata.get("url"),
                "title": metadata.get("title"),
                "authors": metadata.get("authors"),
                "year": metadata.get("year"),
                "domain": normalize_domain(str(metadata.get("domain", ""))),
                "abstract": metadata.get("abstract"),
                "abstract_snippet": _abstract_snippet(str(metadata.get("abstract", ""))),
                "score": round(final_score, 4),
                "semantic_score": round(float(metadata["semantic_score"]), 4),
                "recency_score": round(recency, 4),
                "keyword_score": round(keyword, 4),
            }
        )

    ranked = sorted(scored, key=lambda item: item["score"], reverse=True)
    answer = generate_answer(payload.query, ranked)

    return {
        "answer": answer,
        "results": [
            {
                "title": paper["title"],
                "authors": paper["authors"],
                "year": paper["year"],
                "domain": paper["domain"],
                "abstract_snippet": paper["abstract_snippet"],
                "score": paper["score"],
            }
            for paper in ranked
        ],
        "top_papers": ranked,
        "sources_used": [paper["title"] for paper in ranked[:5]],
    }


@app.post("/summarize")
def summarize(payload: SummarizePaperRequest) -> Dict[str, str]:
    try:
        summary = summarize_paper(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Summary failed: {exc}") from exc
    return {"summary": summary}
