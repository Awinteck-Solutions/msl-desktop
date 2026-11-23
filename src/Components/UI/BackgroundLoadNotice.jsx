import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function useQuotaNote() {
  const [note, setNote] = useState(null);

  useEffect(() => {
    if (!note) return undefined;
    const timer = window.setTimeout(() => setNote(null), 4000);
    return () => window.clearTimeout(timer);
  }, [note]);

  const showQuota = (quota) => {
    if (!quota || quota.unlimited) return;
    const remaining = Number(quota.remaining ?? 0);
    const limit = Number(quota.limit ?? 0);
    setNote({
      title: remaining > 0 ? `${remaining} of ${limit} free questions left` : "No free questions left",
      detail: "Past question AI",
    });
  };

  return { note, showQuota };
}

export default function CornerNotices({ loadingLabel, quotaNote, className = "" }) {
  if (!loadingLabel && !quotaNote) return null;
  return (
    <div className={`flex max-w-[240px] flex-col items-stretch gap-2 ${className}`.trim()}>
      {loadingLabel ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-msl-border bg-msl-bg px-3 py-1.5 text-xs font-medium text-msl-text shadow-[var(--card-shadow)]"
        >
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand" strokeWidth={2} />
          <span className="truncate">{loadingLabel}</span>
        </div>
      ) : null}
      {quotaNote ? (
        <div
          role="status"
          className="rounded-lg border border-msl-border bg-msl-bg px-3 py-2 text-msl-text shadow-[var(--card-shadow)]"
        >
          <p className="text-xs font-semibold">{quotaNote.title}</p>
          <p className="mt-0.5 text-[11px] text-msl-muted">{quotaNote.detail}</p>
        </div>
      ) : null}
    </div>
  );
}
