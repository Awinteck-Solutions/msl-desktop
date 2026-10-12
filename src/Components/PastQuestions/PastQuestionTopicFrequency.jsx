import { displayTopicLabel } from "../../utils/syllabusTopics";

export default function PastQuestionTopicFrequency({
  frequency,
  title = "Syllabus topic frequency across sittings",
  subtitle = "",
  limit = 16,
  onSelect,
  syllabusTopics = [],
}) {
  const topics = frequency?.topics || [];
  const sittings = frequency?.sittings || 0;

  if (!topics.length) {
    return (
      <section className="rounded-xl border border-msl-border bg-msl-surface p-4">
        <h3 className="text-sm font-semibold text-msl-text">{title}</h3>
        <p className="text-sm text-msl-muted mt-2">
          Topic frequency will appear once sittings are compared.
        </p>
      </section>
    );
  }

  const max = Math.max(1, ...topics.map((item) => item.sittings || item.questions || 0));

  return (
    <section className="rounded-xl border border-msl-border bg-msl-surface p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-msl-text">{title}</h3>
        {sittings ? (
          <span className="text-xs text-msl-muted shrink-0">{sittings} sittings</span>
        ) : null}
      </div>
      {subtitle ? <p className="text-xs text-msl-muted mb-3">{subtitle}</p> : null}
      <ul className="space-y-3">
        {topics.slice(0, limit).map((topic) => {
          const share = Math.round(((topic.sittings || 0) / Math.max(1, sittings)) * 100);
          const label = displayTopicLabel(topic.topic, syllabusTopics);
          return (
            <li key={topic.topic}>
              <button
                type="button"
                onClick={onSelect ? () => onSelect(label) : undefined}
                disabled={!onSelect}
                className="w-full text-left rounded-lg border border-msl-border hover:border-brand/30 hover:bg-brand/5 px-3 py-2.5 transition-colors disabled:cursor-default disabled:hover:bg-transparent disabled:hover:border-msl-border"
              >
                <div className="flex justify-between gap-2 text-xs mb-1.5">
                  <strong className="text-msl-text line-clamp-2">{label}</strong>
                  <span className="text-msl-muted shrink-0 text-[11px]">
                    {topic.sittings} sittings
                    {topic.questions ? ` · ${topic.questions} q` : ""}
                    {sittings ? ` · ${share}%` : ""}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-msl-border overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full"
                    style={{
                      width: `${Math.max(8, ((topic.sittings || 0) / max) * 100)}%`,
                    }}
                  />
                </div>
                {topic.years?.length ? (
                  <p className="text-[10px] text-msl-muted mt-1.5">
                    {topic.years[0]}
                    {topic.years.length > 1 ? `–${topic.years[topic.years.length - 1]}` : ""}
                    {topic.sittingLabels?.length
                      ? ` · ${topic.sittingLabels.slice(0, 3).join(", ")}${
                          topic.sittingLabels.length > 3 ? "…" : ""
                        }`
                      : ""}
                  </p>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
