import { COURSE_GROUP_TABS } from "../../utils/courseProgressGroup";

export default function CourseGroupFilter({ value, onChange, counts = {} }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COURSE_GROUP_TABS.map((tab) => {
        const active = value === tab.id;
        const count = counts[tab.id] ?? 0;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-msl px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand text-white shadow-glow-indigo-soft"
                : "border border-msl-border bg-msl-surface text-msl-muted hover:text-msl-text hover:border-brand/30"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                active ? "bg-white/20" : "bg-msl-accent"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
