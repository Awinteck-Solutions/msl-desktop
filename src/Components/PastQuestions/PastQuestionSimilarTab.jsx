import { useState } from "react";
import { ChevronDown, LocateFixed, Sparkles } from "lucide-react";
import PastQuestionExamText from "./PastQuestionExamText";
import { sourceLabel } from "../../utils/pastQuestionGroups";

function SimilarSide({ q, onOpenSitting, onAskAbout }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-msl-border bg-msl-bg/30 p-3 flex flex-col min-h-0">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-msl-text flex-1 min-w-0 leading-snug">
          {sourceLabel(q)} · Q{q.number || ""}
        </span>
        <button
          type="button"
          title={open ? "Hide preview" : "Preview question"}
          aria-label={open ? "Hide preview" : "Preview question"}
          aria-pressed={open}
          onClick={() => setOpen((v) => !v)}
          className={`p-1.5 rounded-lg border transition-colors ${
            open
              ? "border-brand/30 bg-brand/10 text-brand"
              : "border-transparent text-msl-muted hover:text-brand hover:bg-brand/5"
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          title="Go to question"
          aria-label="Go to question"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenSitting(q);
          }}
          className="p-1.5 rounded-lg text-msl-muted hover:text-brand hover:bg-brand/5"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Ask AI"
          aria-label="Ask AI"
          onClick={() => onAskAbout(q)}
          className="p-1.5 rounded-lg text-msl-muted hover:text-brand hover:bg-brand/5"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
      <div
        className={`grid transition-all duration-200 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-70"
        }`}
      >
        <div className="overflow-hidden">
          <div className={`text-sm ${open ? "" : "max-h-28 relative"}`}>
            <PastQuestionExamText text={q.question} html={q.questionHtml} />
            {!open ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-msl-bg/90 to-transparent" />
            ) : null}
          </div>
        </div>
      </div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 text-[11px] font-semibold text-brand hover:underline self-start"
        >
          Show full question
        </button>
      ) : null}
    </div>
  );
}

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
            <SimilarSide q={link.left} onOpenSitting={onOpenSitting} onAskAbout={onAskAbout} />
            <SimilarSide q={link.right} onOpenSitting={onOpenSitting} onAskAbout={onAskAbout} />
          </div>
        </article>
      ))}
    </div>
  );
}
