# 🎓 Semantic Academic Search Engine

**Empowering Researchers with AI-Driven Insights**

A production-ready internal semantic search system tailored for academic publishing workflows. This engine utilizes **Retrieval-Augmented Generation (RAG)** and high-performance vector embeddings to provide precise, context-aware answers and summaries from the arXiv repository.

---

## 🌟 Key Features

*   **🔍 Contextual Semantic Search**: Go beyond keyword matching. Find papers based on the actual intent and meaning of your query.
*   **🤖 RAG-Powered Intelligence**: Get synthesized answers grounded directly in the context of retrieved academic abstracts.
*   **⚡ Automated Data Ingestion**: Seamlessly fetch, clean, and index papers directly from arXiv by topic.
*   **⚖️ Hybrid Ranking Algorithm**: Multi-factor scoring system combining semantic similarity (60%), recency (20%), and keyword relevance (20%).
*   **📄 Instant Summarization**: Generate concise, AI-powered summaries for any indexed paper to save time.
*   **💻 Modern Academic UI**: A clean, minimalist dashboard designed for high readability and professional use.

---

## 🛠️ Tech Stack

### Backend (The Core)
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High-performance Python API)
*   **LLM Integration**: [Groq](https://groq.com/) (Llama-3 for ultra-fast inference)
*   **Vector Engine**: [ChromaDB](https://www.trychroma.com/) (Local vector storage & retrieval)
*   **Logic Framework**: [LangChain](https://www.langchain.com/) (Orchestrating RAG pipelines)
*   **Embeddings**: `sentence-transformers` (Local high-quality text vectorization)

### Frontend (The Interface)
*   **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Minimalist academic aesthetic)
*   **Interactions**: [Framer Motion](https://www.framer.com/motion/) & [Lucide Icons](https://lucide.dev/)

---


## ⚙️ Quick Start Guide

### 1. Backend Initialization

1.  **Install dependencies**:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

2.  **Environment Setup**:
    Create a `.env` file in the `backend/` directory:
    ```env
    GROQ_API_KEY=your_groq_api_key_here
    ```

3.  **Start Service**:
    ```bash
    uvicorn main:app --reload
    ```
    *Access the interactive API docs at: [http://localhost:8000/docs](http://localhost:8000/docs)*

### 2. Frontend Initialization

1.  **Install & Start**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *Open your browser to: [http://localhost:5173](http://localhost:5173)*

---

## 📝 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/ingest` | `POST` | Scrapes and indexes arXiv papers based on a topic string. |
| `/search` | `POST` | Executes a semantic search and returns a RAG-synthesized answer. |
| `/summarize`| `POST` | Generates a high-level summary for a specific paper's abstract. |
| `/papers` | `GET` | Retrieves a list of all unique papers currently in the index. |

---

Developed for high-impact academic research and publishing workflows.
