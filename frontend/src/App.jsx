import { useState } from "react";
import ErrorAlert from "./components/ErrorAlert";
import DashboardPage from "./pages/DashboardPage";
import SearchPage from "./pages/SearchPage";

function App() {
  const [page, setPage] = useState("home");
  const [error, setError] = useState("");

  const renderContent = () => {
    switch (page) {
      case "home":
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-tf-blue tracking-tight mb-6">
              AES by Taylor & Francis
            </h1>
            <p className="max-w-2xl text-lg text-slate-600 mb-10 leading-relaxed">
              Experience the next generation of research discovery. Our AI-powered platform understands the context of your queries, providing faster insights and a deeper understanding of academic literature.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setPage("dashboard")} className="btn-primary text-lg px-8">
                Ingest Research Papers
              </button>
              <button onClick={() => setPage("search")} className="btn-secondary text-lg px-8">
                Search Research
              </button>
            </div>
          </div>
        );
      case "dashboard":
        return <DashboardPage setError={setError} setPage={setPage} />;
      case "search":
        return <SearchPage setError={setError} setPage={setPage} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center cursor-pointer" onClick={() => setPage("home")}>
              <span className="text-xl font-bold text-tf-blue tracking-tight">AES</span>
              <span className="ml-2 hidden sm:block text-sm font-medium text-slate-500 uppercase tracking-widest">by Taylor & Francis</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage("dashboard")}
                className={`text-sm font-medium transition-colors ${page === "dashboard" ? "text-tf-blue" : "text-slate-500 hover:text-tf-blue"}`}
              >
                Ingestion
              </button>
              <button
                onClick={() => setPage("search")}
                className={`text-sm font-medium transition-colors ${page === "search" ? "text-tf-blue" : "text-slate-500 hover:text-tf-blue"}`}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorAlert message={error} />
        {renderContent()}
      </main>

      {/* Footer */}
      {page === "home" && (
        <footer className="py-12 border-t border-slate-50">
          <div className="max-w-7xl mx-auto px-4 text-center text-md text-slate-400">
            Taylor & Francis
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
