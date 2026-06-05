import { Search } from "lucide-react";

export default function PracticeSearchBar({
  value,
  onChange,
  placeholder = "Search…",
}) {
  return (
    <div className="relative mb-4 max-w-md">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-msl-muted pointer-events-none"
        strokeWidth={1.75}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-msl-border bg-msl-surface pl-10 pr-4 py-2.5 text-sm text-msl-text placeholder:text-msl-muted focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-shadow"
      />
    </div>
  );
}
