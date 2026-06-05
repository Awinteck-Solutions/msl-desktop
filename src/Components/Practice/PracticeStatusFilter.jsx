import { PRACTICE_FILTERS } from "../../utils/practiceStatus";

export default function PracticeStatusFilter({ value, onChange, counts = {} }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {PRACTICE_FILTERS.map((tab) => {
        const count = counts[tab.id];
        const label =
          count !== undefined ? `${tab.label} (${count})` : tab.label;
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              active
                ? "bg-gradient-cta text-white shadow-glow-indigo-soft"
                : "border border-msl-border text-msl-muted hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
