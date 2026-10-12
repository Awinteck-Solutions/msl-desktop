import { Search, X } from "lucide-react";

const selectClass =
  "w-full text-xs rounded-lg border border-msl-border bg-msl-bg/50 px-2 py-2 text-msl-text focus:outline-none focus:border-brand/40";

export default function PastQuestionSourceFilters({
  filters,
  onChange,
  options,
  resultCount,
  compact = false,
}) {
  const { query, category, year, level, paperCode } = filters;
  const hasFilters = Boolean(category || year || level || paperCode || query.trim());

  const set = (patch) => onChange({ ...filters, ...patch });

  const clearAll = () =>
    onChange({
      query: "",
      category: "",
      year: "",
      level: "",
      paperCode: "",
    });

  return (
    <div
      className={`space-y-2 ${compact ? "" : "rounded-xl border border-msl-border bg-msl-surface p-3"}`}
    >
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-msl-muted pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Search title, sitting, code…"
          className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-msl-border bg-msl-bg/50 focus:outline-none focus:border-brand/40"
        />
        {query ? (
          <button
            type="button"
            onClick={() => set({ query: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-msl-muted hover:text-msl-text"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4"}`}>
        {options.categories.length > 1 ? (
          <label className="block min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-msl-muted">
              Programme
            </span>
            <select
              value={category}
              onChange={(e) => set({ category: e.target.value })}
              className={`${selectClass} mt-0.5`}
            >
              <option value="">All programmes</option>
              {options.categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-msl-muted">
            Year
          </span>
          <select
            value={year}
            onChange={(e) => set({ year: e.target.value })}
            className={`${selectClass} mt-0.5`}
          >
            <option value="">All years</option>
            {options.years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-msl-muted">
            Level
          </span>
          <select
            value={level}
            onChange={(e) => set({ level: e.target.value })}
            className={`${selectClass} mt-0.5`}
          >
            <option value="">All levels</option>
            {options.levels.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-msl-muted">
            Paper code
          </span>
          <select
            value={paperCode}
            onChange={(e) => set({ paperCode: e.target.value })}
            className={`${selectClass} mt-0.5`}
          >
            <option value="">All papers</option>
            {options.paperCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-msl-muted">
        <span>
          {resultCount != null ? (
            <>
              <strong className="text-msl-text">{resultCount}</strong> sitting
              {resultCount === 1 ? "" : "s"} match
            </>
          ) : null}
        </span>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="font-semibold text-brand hover:underline shrink-0"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
