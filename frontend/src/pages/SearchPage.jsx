import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import FiltersSidebar from "../components/FiltersSidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import PaperCard from "../components/PaperCard";
import { listPapers, searchPapers, summarizePaper } from "../services/api";

const normalizeDomain = (value) => {
  const token = String(value || "").trim().toLowerCase();
  if (!token) return "";
  return token
    .split(",")[0]
    .split(/\s+/)[0]
    .replace(/[^a-z0-9.\-]+/g, "");
};

function SearchPage({ setError }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ year: "", domain: "", author: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [domains, setDomains] = useState([]);
  const [papersPerPage, setPapersPerPage] = useState(10);
  const [paperSummaries, setPaperSummaries] = useState({});
  const [summaryLoadingId, setSummaryLoadingId] = useState("");

  useEffect(() => {
    const loadDomains = async () => {
      try {
        const data = await listPapers();
        const uniqueDomains = [...new Set((data.papers || []).map((paper) => normalizeDomain(paper.domain)))]
          .filter((domain) => Boolean(domain) && domain !== "unknown")
          .sort();
        setDomains(uniqueDomains);
      } catch (error) {
        // Domain dropdown gracefully falls back
      }
    };
    loadDomains();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setError("");
    setResult(null);
    setPaperSummaries({});
    setLoading(true);
    try {
      const payload = {
        query,
        filters: {
          year: filters.year ? Number(filters.year) : null,
          domain: filters.domain || null,
          author: filters.author || null,
        },
      };
      const data = await searchPapers(payload);
      setResult(data);
    } catch (error) {
      setError(error?.response?.data?.detail || error.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizePaper = async (paper) => {
    setError("");
    setSummaryLoadingId(paper.arxiv_id);
    try {
      const data = await summarizePaper(paper);
      setPaperSummaries((prev) => ({ ...prev, [paper.arxiv_id]: data.summary }));
    } catch (error) {
      setError(error?.response?.data?.detail || error.message || "Paper summary failed");
    } finally {
      setSummaryLoadingId("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Search Header */}
      <div className="space-y-6">
        <div className="relative group">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Ask your research question..."
            className="w-full rounded-2xl border-2 border-slate-100 bg-white px-6 py-5 text-lg shadow-sm outline-none transition-all focus:border-tf-blue/20 focus:ring-4 focus:ring-tf-blue/5 placeholder:text-slate-400"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-3 top-3 h-12 w-12 rounded-xl bg-tf-blue flex items-center justify-center text-white transition-all hover:bg-tf-lightBlue disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <FiltersSidebar filters={filters} setFilters={setFilters} domains={domains} />
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Results</span>
            <select
              value={papersPerPage}
              onChange={(e) => setPapersPerPage(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 outline-none hover:border-tf-blue/30 transition-colors"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <LoadingSpinner />
          <p className="text-slate-400 text-sm animate-pulse">Analyzing academic literature...</p>
        </div>
      )}

      {result && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* AI Response Card */}
          <div className="chatgpt-card border-l-4 border-l-tf-blue bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-8 w-8 rounded-lg bg-tf-blue flex items-center justify-center text-white flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-tf-blue">AI-Generated Insights</h3>
            </div>
            
            <div className="ai-markdown-content">
              <ReactMarkdown>{result.answer}</ReactMarkdown>
            </div>

            {result.sources_used && result.sources_used.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Grounding Sources</h4>
                <div className="flex flex-wrap gap-2">
                  {result.sources_used.map((source) => (
                    <span key={source} className="px-2 py-1 rounded bg-tf-blue/5 text-tf-blue text-[10px] font-bold border border-tf-blue/10">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Papers List */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-slate-800">Relevant Publications</h3>
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-sm font-medium text-slate-400">{(result.top_papers || []).length} matches found</span>
            </div>

            {(result.top_papers || []).length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400">No papers matched your search criteria.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {(result.top_papers || []).slice(0, papersPerPage).map((paper) => (
                  <PaperCard
                    key={paper.arxiv_id}
                    paper={paper}
                    onSummarize={handleSummarizePaper}
                    summary={paperSummaries[paper.arxiv_id]}
                    loadingSummary={summaryLoadingId === paper.arxiv_id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
