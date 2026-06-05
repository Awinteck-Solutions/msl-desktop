const STYLES = {
  completed: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
  pending: "bg-amber-500/15 text-amber-500 border-amber-500/25",
  processing: "bg-brand/15 text-brand border-brand/25",
  error: "bg-red-500/15 text-red-500 border-red-500/25",
  neutral: "bg-msl-muted/10 text-msl-muted border-msl-border",
};

export default function StatusBadge({ status = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STYLES[status] || STYLES.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
