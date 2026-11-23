import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatClock } from "../../utils/videoTimestamps";

export default function VideoChapters({ markers, onSeek, compact = false }) {
  const [open, setOpen] = useState(true);
  if (!markers?.length) return null;
  return (
    <div className={compact ? "px-3 pb-2" : "border-t border-msl-border bg-msl-surface px-4 py-3"}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-left text-sm font-semibold text-brand hover:bg-brand/15"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} strokeWidth={2.25} />
          Timestamps
          <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">{markers.length}</span>
        </span>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <ul className="mt-2 space-y-1">
          {markers.map((marker, index) => (
            <li key={`${marker.seconds}-${index}`}>
              <button
                type="button"
                onClick={() => onSeek?.(marker.seconds)}
                className="flex w-full items-start gap-3 rounded-md px-1 py-1 text-left text-sm text-msl-text hover:bg-brand/5 hover:text-brand"
              >
                <span className="shrink-0 font-mono text-xs font-semibold text-brand">
                  {formatClock(marker.seconds)}
                </span>
                <span className="min-w-0 flex-1">{marker.text}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
