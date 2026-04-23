function FiltersSidebar({ filters, setFilters, domains = [] }) {
  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Year</span>
        <input
          type="number"
          min="1990"
          max="2030"
          value={filters.year}
          onChange={(e) => updateFilter("year", e.target.value)}
          placeholder="Any"
          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-tf-blue/30"
        />
      </div>

      <div className="h-4 w-px bg-slate-200 hidden md:block" />

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Domain</span>
        <select
          value={filters.domain}
          onChange={(e) => updateFilter("domain", e.target.value)}
          className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-tf-blue/30"
        >
          <option value="">All domains</option>
          {domains.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>

      <div className="h-4 w-px bg-slate-200 hidden md:block" />

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Author</span>
        <input
          type="text"
          value={filters.author}
          onChange={(e) => updateFilter("author", e.target.value)}
          placeholder="Search author..."
          className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-tf-blue/30"
        />
      </div>

      <button
        type="button"
        onClick={() => setFilters({ year: "", domain: "", author: "" })}
        className="ml-auto text-[10px] font-bold text-slate-400 hover:text-tf-blue uppercase tracking-widest transition-colors mr-2"
      >
        Reset
      </button>
    </div>
  );
}

export default FiltersSidebar;
