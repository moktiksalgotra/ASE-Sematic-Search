"""SQLite persistence layer for arXiv papers."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any, Dict, List


DB_PATH = Path(__file__).resolve().parent / "papers.db"


def get_connection() -> sqlite3.Connection:
    """Return a SQLite connection with dict-like row access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create papers table when missing."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS papers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                arxiv_id TEXT UNIQUE,
                title TEXT NOT NULL,
                abstract TEXT NOT NULL,
                authors TEXT NOT NULL,
                published TEXT NOT NULL,
                year INTEGER NOT NULL,
                domain TEXT NOT NULL,
                url TEXT NOT NULL
            )
            """
        )
        conn.commit()


def insert_papers(papers: List[Dict[str, Any]]) -> int:
    """Insert papers with de-duplication via INSERT OR IGNORE."""
    if not papers:
        return 0

    inserted = 0
    with get_connection() as conn:
        cursor = conn.cursor()
        for paper in papers:
            cursor.execute(
                """
                INSERT OR IGNORE INTO papers
                (arxiv_id, title, abstract, authors, published, year, domain, url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    paper["arxiv_id"],
                    paper["title"],
                    paper["abstract"],
                    paper["authors"],
                    paper["published"],
                    paper["year"],
                    paper["domain"],
                    paper["url"],
                ),
            )
            inserted += cursor.rowcount
        conn.commit()
    return inserted


def get_all_papers() -> List[Dict[str, Any]]:
    """Fetch all papers sorted by publish date descending."""
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, arxiv_id, title, abstract, authors, published, year, domain, url
            FROM papers
            ORDER BY published DESC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def get_papers_by_arxiv_ids(arxiv_ids: List[str]) -> List[Dict[str, Any]]:
    """Fetch papers by a list of arXiv identifiers."""
    if not arxiv_ids:
        return []

    placeholders = ",".join("?" for _ in arxiv_ids)
    with get_connection() as conn:
        rows = conn.execute(
            f"""
            SELECT id, arxiv_id, title, abstract, authors, published, year, domain, url
            FROM papers
            WHERE arxiv_id IN ({placeholders})
            """,
            arxiv_ids,
        ).fetchall()
    return [dict(row) for row in rows]
