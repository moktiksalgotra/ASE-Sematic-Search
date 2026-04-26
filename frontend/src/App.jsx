import { useEffect, useState } from "react";
import { BookOpen, Moon, Search } from "lucide-react";
import ErrorAlert from "./components/ErrorAlert";
import MountainVistaParallax from "./components/ui/mountain-vista-bg";
import DashboardPage from "./pages/DashboardPage";
import SearchPage from "./pages/SearchPage";

function App() {
  const [page, setPage] = useState("home");
  const [error, setError] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = page === "home";
  const isDashboard = page === "dashboard";
  const isSearch = page === "search";
  const [searchSeed, setSearchSeed] = useState({ topic: "", domain: "" });

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const renderContent = () => {
    switch (page) {
      case "home":
        return (
          <MountainVistaParallax
            title="Taylor and Francis
             Academic Explorer"
            subtitle="Discover better evidence faster with semantic retrieval and grounded AI answers."
          >
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => setPage("dashboard")} className="btn-primary text-lg px-8 inline-flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Ingest Research Papers
              </button>
              <button onClick={() => setPage("search")} className="btn-secondary text-lg px-8 inline-flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Research
              </button>
            </div>
          </MountainVistaParallax>
        );
      case "dashboard":
        return <DashboardPage setError={setError} setPage={setPage} setSearchSeed={setSearchSeed} />;
      case "search":
        return <SearchPage setError={setError} setPage={setPage} searchSeed={searchSeed} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#021730]">
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isHome
            ? "border-0 bg-transparent shadow-none"
            : isDashboard || isSearch
              ? "border-b border-white/20 bg-[#0b284b]/28 backdrop-blur-lg"
            : isScrolled
              ? "border-b border-slate-100 bg-white/80 shadow-sm backdrop-blur-md"
              : "border-b border-white/20 bg-white/10 backdrop-blur-md"
        }`}
        style={isHome ? { backgroundColor: "transparent", borderColor: "transparent" } : undefined}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPage("home")}>
              <img src="/logo.png" alt="Taylor & Francis Group" className="h-16 w-auto object-contain" />
              <span className={`text-xl font-bold tracking-tight ${isDashboard || isSearch ? "text-white" : isScrolled || page !== "home" ? "text-tf-blue" : "text-white"}`}>
                Taylor & Francis Group
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isHome && (
                <button
                  type="button"
                  className="hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-sky-200/30 bg-[#0f2548]/60 text-slate-200"
                  aria-label="Theme"
                >
                  <Moon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setPage("dashboard")}
                className={`text-sm font-medium transition-colors ${
                  page === "dashboard"
                    ? isDashboard || isSearch
                      ? "text-white"
                      : "text-tf-blue"
                    : isHome
                      ? "text-slate-100 hover:text-white"
                      : isDashboard || isSearch
                      ? "text-slate-200 hover:text-white"
                      : isScrolled || page !== "home"
                      ? "text-slate-500 hover:text-tf-blue"
                      : "text-slate-200 hover:text-white"
                }`}
              >
                Ingestion
              </button>
              <button
                onClick={() => setPage("search")}
                className={`text-sm font-medium transition-colors ${
                  page === "search"
                    ? isDashboard || isSearch
                      ? "text-white"
                      : "text-tf-blue"
                    : isHome
                      ? "text-slate-100 hover:text-white"
                      : isDashboard || isSearch
                      ? "text-slate-200 hover:text-white"
                      : isScrolled || page !== "home"
                      ? "text-slate-500 hover:text-tf-blue"
                      : "text-slate-200 hover:text-white"
                }`}
              >
                Search
              </button>
              {isHome && (
                <>
                  <button type="button" className="hidden md:block text-sm font-medium text-slate-100 hover:text-white">About</button>
                  <button type="button" className="hidden md:block rounded-lg border border-slate-300/60 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-white/10">Docs</button>
                  <button type="button" className="hidden md:block text-sm font-medium text-slate-100 hover:text-white">Get Started</button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main
        className={`${
          page === "home"
            ? "pt-16"
            : page === "dashboard"
            ? "pt-16"
            : page === "search"
            ? "pt-16"
            : "mx-auto max-w-7xl px-4 py-8 pt-16 sm:px-6 lg:px-8"
        }`}
      >
        <ErrorAlert message={error} />
        {renderContent()}
      </main>

      {page === "home" && (
        <footer className="border-t border-[#10355a] bg-[#05234a] py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-xs text-slate-300 sm:px-6 lg:px-8">
            <span>Taylor and Francis | Academic Explorer</span>
            <div className="flex items-center gap-4">
              <button type="button" className="hover:text-white">Privacy</button>
              <button type="button" className="hover:text-white">Support</button>
              <span>© 2026</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
