"""Groq-powered RAG answer generation."""

from __future__ import annotations

import os
from typing import Any, Dict, List

from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq


RAG_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template=(
        "You are a research assistant for academic publishing.\n"
        "Use ONLY the context below.\n"
        "If context is insufficient, explicitly say so.\n\n"
        "Format your response as clean markdown:\n"
        "- Use **bold** for key terms and paper titles.\n"
        "- Separate distinct ideas into their own paragraphs with a blank line between them.\n"
        "- Keep sentences concise and well-structured.\n"
        "- If referencing multiple papers, use a numbered list.\n"
        "- Do NOT use heading markers (#). Write flowing prose with paragraph breaks.\n\n"
        "Context:\n{context}\n\n"
        "Question:\n{question}\n\n"
        "Answer:"
    ),
)

PAPER_SUMMARY_PROMPT = PromptTemplate(
    input_variables=["title", "authors", "year", "domain", "abstract"],
    template=(
        "You are an expert research assistant.\n"
        "Summarize this research paper clearly for a technical audience.\n"
        "Keep it concise and practical.\n\n"
        "Format your response as exactly 4 sections using this structure:\n\n"
        "**Main Problem**\n"
        "A 1–2 sentence description of the core problem or research gap.\n\n"
        "**Proposed Method**\n"
        "A 1–2 sentence description of the approach or methodology used.\n\n"
        "**Key Findings**\n"
        "A 1–2 sentence summary of the most important results.\n\n"
        "**Why It Matters**\n"
        "A 1–2 sentence explanation of the significance and real-world impact.\n\n"
        "IMPORTANT: Each section MUST have a blank line between the header and the next section. "
        "Use **bold** for the section headers exactly as shown above. "
        "Do NOT use bullet points or dashes. Write clean paragraphs.\n\n"
        "Paper metadata:\n"
        "Title: {title}\n"
        "Authors: {authors}\n"
        "Year: {year}\n"
        "Domain: {domain}\n\n"
        "Abstract:\n{abstract}\n\n"
        "Summary:"
    ),
)


def _get_llm() -> ChatGroq:
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=0)


def _build_context(papers: List[Dict[str, Any]], max_items: int = 6) -> str:
    chunks = []
    for paper in papers[:max_items]:
        chunks.append(
            (
                f"Title: {paper['title']}\n"
                f"Authors: {paper['authors']}\n"
                f"Year: {paper['year']}\n"
                f"Domain: {paper['domain']}\n"
                f"Abstract: {paper['abstract']}"
            )
        )
    return "\n\n---\n\n".join(chunks)


def generate_answer(question: str, ranked_papers: List[Dict[str, Any]]) -> str:
    """Generate grounded answer from top retrieved papers."""
    if not ranked_papers:
        return "No relevant papers were found for this query."

    if not os.getenv("GROQ_API_KEY"):
        return "GROQ_API_KEY is missing. Set it to enable AI-generated answers."

    llm = _get_llm()
    prompt = RAG_PROMPT.format(context=_build_context(ranked_papers), question=question)
    response = llm.invoke(prompt)
    return str(response.content).strip()


def summarize_paper(paper: Dict[str, Any]) -> str:
    """Generate a concise Groq summary for one paper."""
    if not os.getenv("GROQ_API_KEY"):
        return "GROQ_API_KEY is missing. Set it to enable AI paper summaries."

    llm = _get_llm()
    prompt = PAPER_SUMMARY_PROMPT.format(
        title=str(paper.get("title", "")),
        authors=str(paper.get("authors", "")),
        year=str(paper.get("year", "")),
        domain=str(paper.get("domain", "")),
        abstract=str(paper.get("abstract", "")),
    )
    response = llm.invoke(prompt)
    return str(response.content).strip()
