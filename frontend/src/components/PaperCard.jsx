import ReactMarkdown from "react-markdown";

function PaperCard({ paper, onSummarize, summary, loadingSummary }) {
  return (
    <article className="chatgpt-card group">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <a
            href={paper.url}
            target="_blank"
            rel="noreferrer"
            className="text-xl font-bold text-slate-900 hover:text-tf-blue transition-colors leading-snug inline-block"
          >
            {paper.title}
          </a>
          <p className="text-sm text-slate-500 font-medium">{paper.authors}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
            {paper.year}
          </span>
          <span className="px-2 py-1 rounded bg-tf-blue/5 text-tf-blue text-[10px] font-bold uppercase tracking-wider">
            {paper.domain}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
          {paper.abstract_snippet || "No abstract available for this publication."}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSummarize(paper)}
            disabled={loadingSummary}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tf-blue/5 text-tf-blue text-xs font-bold hover:bg-tf-blue/10 transition-colors disabled:opacity-50"
          >
            {loadingSummary ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-tf-blue border-t-transparent" />
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            {loadingSummary ? "Generating..." : "AI Summarize"}
          </button>
          
          <a
            href={paper.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-slate-400 hover:text-tf-blue transition-colors flex items-center gap-1"
          >
            View Paper
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Match Score: {paper.score ? (paper.score * 100).toFixed(0) : "N/A"}%
        </div>
      </div>

      {summary && (
        <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 pl-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-tf-blue" />
            <h4 className="text-[10px] font-bold text-tf-blue uppercase tracking-widest mb-3">Deep Summary</h4>
            <div className="ai-markdown-content">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default PaperCard;
