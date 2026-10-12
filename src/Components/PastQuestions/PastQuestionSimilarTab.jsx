import AiHtmlContent from "../MslAi/AiHtmlContent";
import { sourceLabel } from "../../utils/pastQuestionGroups";

export default function PastQuestionSimilarTab({
  links,
  compareBusy,
  onOpenSitting,
  onAskAbout,
}) {
  if (compareBusy) {
    return (
      <p className="text-sm text-msl-muted px-5 py-8">
        Comparing questions across sittings…
      </p>
    );
  }

  if (!links.length) {
    return (
      <p className="text-sm text-msl-muted px-5 py-8">
        No close matches across sittings yet. Open a paper with multiple sittings in this
        course for similarity analysis.
      </p>
    );
  }

  return (
    <div className="px-5 py-4 space-y-4 max-w-3xl">
      {links.map((link) => (
        <article
          key={`${link.left._id}-${link.right._id}`}
          className="rounded-xl border border-msl-border bg-msl-surface p-4"
        >
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
            <strong className="text-brand">{link.score}% similar</strong>
            <span className="text-msl-muted">Different sittings</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[link.left, link.right].map((q) => (
              <div
                key={q._id}
                className="rounded-lg border border-msl-border bg-msl-bg/30 p-3 flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => onOpenSitting(q)}
                  className="text-left text-xs font-semibold text-brand hover:underline mb-2"
                >
                  {sourceLabel(q)} · Q{q.number || ""}
                </button>
                <div className="text-sm line-clamp-6 flex-1">
                  <AiHtmlContent content={q.question} />
                </div>
                <button
                  type="button"
                  onClick={() => onAskAbout(q)}
                  className="mt-3 text-xs font-semibold text-msl-muted hover:text-brand self-start"
                >
                  Ask AI
                </button>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
