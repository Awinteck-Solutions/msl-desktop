import AiHtmlContent from "../MslAi/AiHtmlContent";
import { sourceLabel } from "../../utils/pastQuestionGroups";

export function PastQuestionSimilarPeers({
  peers,
  onOpenSitting,
  onAskAbout,
  compact = false,
}) {
  if (!peers?.length) return null;

  return (
    <div className={`${compact ? "mt-3" : "mt-4"} rounded-lg border border-msl-border/80 bg-msl-bg/40 p-3`}>
      <p className="text-xs font-semibold text-msl-text flex items-center gap-2">
        Similar across sittings
        <span className="text-[10px] font-normal text-msl-muted bg-msl-surface px-1.5 py-0.5 rounded-full">
          {peers.length}
        </span>
      </p>
      <ul className="mt-2 space-y-2">
        {peers.map((peer) => (
          <li key={peer.question._id}>
            <details className="group rounded-md border border-msl-border/60 bg-msl-surface open:border-brand/20">
              <summary className="cursor-pointer list-none px-3 py-2 text-xs flex flex-wrap items-center gap-2">
                <strong className="text-brand">{peer.score}%</strong>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenSitting?.(peer.question);
                  }}
                  className="text-msl-text hover:text-brand hover:underline text-left"
                >
                  {sourceLabel(peer.question)}
                  {peer.question.number ? ` · Q${peer.question.number}` : ""}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onAskAbout?.(peer.question);
                  }}
                  className="ml-auto text-[11px] font-semibold text-msl-muted hover:text-brand"
                >
                  Ask AI
                </button>
              </summary>
              <div className="px-3 pb-3 pt-1 border-t border-msl-border/60 text-sm">
                <AiHtmlContent content={peer.question.question} />
                {peer.question.answer ? (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer text-brand font-medium">Suggested answer</summary>
                    <div className="mt-2 pl-3 border-l-2 border-msl-border">
                      <AiHtmlContent content={peer.question.answer} />
                    </div>
                  </details>
                ) : null}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
