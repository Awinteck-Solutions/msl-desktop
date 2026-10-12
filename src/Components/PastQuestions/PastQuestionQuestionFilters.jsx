import { Search, X } from "lucide-react";

export default function PastQuestionQuestionFilters({
  value,
  onChange,
  total,
  shown,
  placeholder = "Filter by Q number or keywords…",
}) {
  return (
    <div className="sticky top-0 z-10 -mx-5 px-5 py-3 mb-2 bg-msl-bg/95 backdrop-blur-sm border-b border-msl-border">
      <div className="relative max-w-3xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-msl-muted pointer-events-none" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-msl-border bg-msl-surface focus:outline-none focus:border-brand/40"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-msl-muted hover:text-msl-text"
            aria-label="Clear question filter"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {value.trim() ? (
        <p className="text-xs text-msl-muted mt-1.5 max-w-3xl">
          Showing {shown} of {total} questions
        </p>
      ) : null}
    </div>
  );
}
