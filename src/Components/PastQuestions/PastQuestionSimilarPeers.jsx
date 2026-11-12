import { useState } from "react";
import { ChevronDown, LocateFixed } from "lucide-react";
import PastQuestionExamText from "./PastQuestionExamText";
import PastQuestionAnswerBlock from "./PastQuestionAnswerBlock";
import PastQuestionAskAiButton from "./PastQuestionAskAiButton";
import { sourceLabel } from "../../utils/pastQuestionGroups";

export function PastQuestionSimilarPeers({
  peers,
  onOpenSitting,
  onAskAbout,
  compact = false,
}) {
  const [openIds, setOpenIds] = useState(() => new Set());

  if (!peers?.length) return null;

  const togglePreview = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={`${compact ? "mt-3" : "mt-4"} rounded-lg border border-msl-border/80 bg-msl-bg/40 p-3`}>
      <p className="text-xs font-semibold text-msl-text flex items-center gap-2">
        Similar across sittings
        <span className="text-[10px] font-normal text-msl-muted bg-msl-surface px-1.5 py-0.5 rounded-full">
          {peers.length}
        </span>
      </p>
      <ul className="mt-2 space-y-2">
        {peers.map((peer) => {
          const q = peer.question;
          const id = q._id;
          const open = openIds.has(id);
          const sittingLabel = `${sourceLabel(q)}${q.number ? ` · Q${q.number}` : ""}`;

          return (
            <li key={id}>
              <div
                className={`rounded-md border bg-msl-surface transition-colors ${
                  open ? "border-brand/25 shadow-sm" : "border-msl-border/60"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 px-2 py-2 sm:px-3">
                  <strong className="text-xs text-brand shrink-0 min-w-[2.5rem]">
                    {peer.score}%
                  </strong>
                  <span className="text-xs text-msl-text flex-1 min-w-[8rem] leading-snug">
                    {sittingLabel}
                  </span>
                  <div className="flex flex-wrap items-center gap-1 shrink-0">
                    <IconAction
                      label={open ? "Hide preview" : "Preview question"}
                      pressed={open}
                      onClick={() => togglePreview(id)}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          open ? "rotate-180 text-brand" : "text-msl-muted"
                        }`}
                        strokeWidth={2}
                      />
                    </IconAction>
                    <IconAction
                      label="Go to question"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenSitting?.(q);
                      }}
                    >
                      <LocateFixed className="w-4 h-4" strokeWidth={2} />
                    </IconAction>
                  </div>
                  <PastQuestionAskAiButton
                    className="ml-auto"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAskAbout?.(q);
                    }}
                  />
                </div>
                <div
                  className={`grid transition-all duration-200 ease-out ${
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-msl-border/60 px-3 pb-3 pt-2 text-sm">
                      <PastQuestionExamText text={q.question} html={q.questionHtml} />
                      <PastQuestionAnswerBlock
                        label="Suggested answer"
                        text={q.answer}
                        html={q.answerHtml}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IconAction({ label, onClick, pressed, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      onClick={(e) => onClick?.(e)}
      className={`p-2 rounded-lg border transition-colors ${
        pressed
          ? "border-brand/30 bg-brand/10 text-brand"
          : "border-transparent text-msl-muted hover:text-brand hover:bg-brand/5 hover:border-brand/15"
      }`}
    >
      {children}
    </button>
  );
}
