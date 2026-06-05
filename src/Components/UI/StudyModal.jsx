import { X } from "lucide-react";

export default function StudyModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "lg",
  closeOnClickOutside = true,
}) {
  if (!isOpen) return null;

  const maxW =
    size === "sm"
      ? "max-w-sm"
      : size === "md"
        ? "max-w-2xl"
        : size === "xl"
          ? "max-w-5xl"
          : "max-w-[800px]";

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6">
      {closeOnClickOutside ? (
        <button
          type="button"
          className="absolute inset-0 bg-msl-bg/85 backdrop-blur-md"
          onClick={onClose}
          aria-label="Close"
        />
      ) : (
        <div className="absolute inset-0 bg-msl-bg/85 backdrop-blur-md" aria-hidden />
      )}
      <div
        className={`relative w-full ${maxW} max-h-[92vh] flex flex-col rounded-msl border border-msl-border/60 bg-msl-surface/95 backdrop-blur-xl shadow-glow-indigo overflow-hidden animate-pop-in`}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Study"}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-msl-border bg-msl-surface shrink-0">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-display text-base font-semibold text-msl-text truncate">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="text-xs text-msl-muted truncate mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-msl text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors"
            aria-label="Close study session"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 sm:p-6 relative">{children}</div>
      </div>
    </div>
  );
}
