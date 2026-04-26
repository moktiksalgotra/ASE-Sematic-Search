import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, PlusIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { WavyBackground } from "../components/ui/wavy";
import { Workspaces, WorkspaceContent, WorkspaceTrigger } from "../components/ui/workspaces";
import { ingestPapers, listPapers } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const domainOptions = [
  {
    id: "ai-healthcare",
    name: "AI in Healthcare",
    logo: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=80&q=60",
    plan: "Applied AI"
  },
  {
    id: "nlp",
    name: "Natural Language Processing",
    logo: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=80&q=60",
    plan: "Core AI"
  },
  {
    id: "quantum",
    name: "Quantum Computing",
    logo: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=80&q=60",
    plan: "Emerging"
  },
  {
    id: "climate",
    name: "Climate Science",
    logo: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=80&q=60",
    plan: "Sustainability"
  },
  {
    id: "custom",
    name: "Custom Domain",
    logo: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=80&q=60",
    plan: "User defined"
  }
];

function DashboardPage({ setError, setPage, setSearchSeed }) {
  const [maxResults, setMaxResults] = useState(30);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState(domainOptions[0].id);
  const [customDomain, setCustomDomain] = useState("");

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

  useEffect(() => {
    const selectedDomain = domainOptions.find((d) => d.id === selectedDomainId);
    const domainQuery = selectedDomainId === "custom" ? customDomain.trim() : selectedDomain?.name || "";
    setSearchSeed?.({ topic: domainQuery, domain: domainQuery, domainId: selectedDomainId });
  }, [selectedDomainId, customDomain, setSearchSeed]);

  const handleIngest = async () => {
    setError("");
    setResponse(null);
    const selectedDomain = domainOptions.find((d) => d.id === selectedDomainId);
    const domainQuery = selectedDomainId === "custom" ? customDomain.trim() : selectedDomain?.name || "";
    const topic = domainQuery.trim();
    const maxResultsNumber = Number(maxResults);

    if (!topic) {
      setError("Please choose a domain or enter a custom topic.");
      return;
    }

    if (!Number.isInteger(maxResultsNumber) || maxResultsNumber < 5 || maxResultsNumber > 30) {
      setError("Number of Papers must be between 5 and 30.");
      return;
    }

    setLoading(true);
    try {
      const data = await ingestPapers(topic, maxResultsNumber);
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
    const latestYear = papers.length
      ? Math.max(...papers.map((paper) => Number(paper.year) || 0))
      : "-";
    return { totalPapers, domains, latestYear };
  }, [papers]);

  const selectedTopic =
    selectedDomainId === "custom"
      ? customDomain.trim()
      : domainOptions.find((d) => d.id === selectedDomainId)?.name || "";

  return (
    <WavyBackground className="bg-[#001a36]">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Data Ingestion</h2>
          <p className="text-slate-200">Expand your knowledge base by fetching the latest research papers.</p>
        </div>

        <div className="chatgpt-card bg-white/90 backdrop-blur-sm">
          <div className="space-y-6">

            {/* Domain Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Domain</label>
              <Workspaces
                workspaces={domainOptions}
                selectedWorkspaceId={selectedDomainId}
                onWorkspaceChange={(workspace) => setSelectedDomainId(workspace.id)}
              >
                <WorkspaceTrigger className="max-w-full" />
                <WorkspaceContent title="Choose domain" searchable>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-slate-500">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Custom research stream
                  </Button>
                </WorkspaceContent>
              </Workspaces>
            </div>

            {/* Custom Domain input — only shown when Custom is selected */}
            {selectedDomainId === "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Custom Domain Name</label>
                <input
                  className="input-minimal"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g. Bioinformatics, Robotics Ethics"
                />
              </div>
            )}

            {/* Number of Papers */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Number of Papers (5-30)</label>
              <input
                type="number"
                min={5}
                max={30}
                className="input-minimal"
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <button
              onClick={handleIngest}
              disabled={loading || (selectedDomainId === "custom" && !customDomain.trim())}
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
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="text-emerald-700 font-bold text-xl mb-1">Ingestion successful</div>
              <p className="text-emerald-700">
                Successfully processed <span className="font-bold">{response.fetched}</span> papers.
              </p>
              <button
                type="button"
                onClick={() => setPage("search")}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-tf-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-tf-lightBlue"
              >
                Search
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1 transition-colors"
              >
                {showLogs ? "Hide" : "Show"} minimal logs
                <svg
                  className={`w-3 h-3 transition-transform ${showLogs ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showLogs && (
                <div className="mt-2 p-4 bg-slate-900 rounded-lg font-mono text-[10px] text-slate-300 overflow-x-auto">
                  <div className="opacity-50 line-through mb-1 uppercase tracking-widest text-[8px]">Session Logs</div>
                  <div>[INFO] Initializing arXiv fetcher...</div>
                  <div>[INFO] Querying domain: {selectedTopic}</div>
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
          <div className="chatgpt-card text-center py-8 bg-white/90 backdrop-blur-sm">
            <div className="text-3xl font-bold text-tf-blue mb-1">{stats.totalPapers}</div>
            <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Papers</div>
          </div>
          <div className="chatgpt-card text-center py-8 bg-white/90 backdrop-blur-sm">
            <div className="text-3xl font-bold text-tf-blue mb-1">{stats.domains}</div>
            <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Domains</div>
          </div>
          <div className="chatgpt-card text-center py-8 bg-white/90 backdrop-blur-sm">
            <div className="text-3xl font-bold text-tf-blue mb-1">{stats.latestYear}</div>
            <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Latest Year</div>
          </div>
        </div>
      </div>
    </WavyBackground>
  );
}

export default DashboardPage;