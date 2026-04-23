import { useEffect, useMemo, useState } from "react";
import { ingestPapers, listPapers } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function DashboardPage({ setError }) {
  const [topic, setTopic] = useState("AI in healthcare");
  const [maxResults, setMaxResults] = useState(30);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const loadPapers = async () => {
    try {
      const data = await listPapers();
      setPapers(data.papers || []);
    } catch (_error) {
      // Stats are best-effort
    }
  };

  useEffect(() => {
    loadPapers();
  }, []);

  const handleIngest = async () => {
    setError("");
    setResponse(null);
    setLoading(true);
    try {
      const data = await ingestPapers(topic, maxResults);
      setResponse(data);
      await loadPapers();
    } catch (error) {
      setError(error?.response?.data?.detail || error.message || "Failed to ingest papers");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalPapers = papers.length;
    const domains = new Set(
      papers
        .map((paper) => String(paper.domain || "").trim())
        .filter((value) => Boolean(value) && value.toLowerCase() !== "unknown")
    ).size;
    const latestYear = papers.length ? Math.max(...papers.map((paper) => Number(paper.year) || 0)) : "-";
    return { totalPapers, domains, latestYear };
  }, [papers]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-tf-blue">Data Ingestion</h2>
        <p className="text-slate-500">Expand your knowledge base by fetching the latest research papers.</p>
      </div>

      <div className="chatgpt-card">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Topic / Query</label>
            <input
              className="input-minimal"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI in healthcare, Quantum Computing..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Number of Papers (5-30)</label>
            <input
              type="number"
              min={5}
              max={30}
              className="input-minimal"
              value={maxResults}
              onChange={(e) => setMaxResults(e.target.value)}
            />
          </div>

          <button
            onClick={handleIngest}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              "Fetch & Process Papers"
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="chatgpt-card bg-slate-50 border-dashed animate-pulse">
          <div className="flex flex-col items-center py-4 space-y-3">
            <LoadingSpinner />
            <div className="text-center">
              <p className="font-medium text-tf-blue">Fetching → Embedding → Storing</p>
              <p className="text-xs text-slate-400 mt-1">This might take a few moments depending on the count.</p>
            </div>
          </div>
        </div>
      )}

      {response && (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-6 text-center">
            <div className="text-emerald-600 font-bold text-xl mb-1">Success!</div>
            <p className="text-emerald-700">
              Successfully processed <span className="font-bold">{response.fetched}</span> papers.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
            >
              {showLogs ? "Hide" : "Show"} minimal logs
              <svg className={`w-3 h-3 transition-transform ${showLogs ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showLogs && (
              <div className="mt-2 p-4 bg-slate-900 rounded-lg font-mono text-[10px] text-slate-300 overflow-x-auto">
                <div className="opacity-50 line-through mb-1 uppercase tracking-widest text-[8px]">Session Logs</div>
                <div>[INFO] Initializing arXiv fetcher...</div>
                <div>[INFO] Querying topic: {topic}</div>
                <div>[INFO] Received {response.fetched} items from API.</div>
                <div>[INFO] Starting embedding generation for {response.indexed_chunks} chunks...</div>
                <div>[INFO] Persisting to ChromaDB...</div>
                <div>[SUCCESS] Indexing complete. Total papers in DB: {response.indexed_total}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
        <div className="chatgpt-card text-center py-8">
          <div className="text-3xl font-bold text-tf-blue mb-1">{stats.totalPapers}</div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Papers</div>
        </div>
        <div className="chatgpt-card text-center py-8">
          <div className="text-3xl font-bold text-tf-blue mb-1">{stats.domains}</div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Domains</div>
        </div>
        <div className="chatgpt-card text-center py-8">
          <div className="text-3xl font-bold text-tf-blue mb-1">{stats.latestYear}</div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Latest Year</div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
