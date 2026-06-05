import { ArrowLeft, X } from "lucide-react";

export default function AiPanelShell({
  isOpen,
  onClose,
  title,
  onBack,
  children,
  size = "lg",
  fullHeight = false,
}) {
  if (!isOpen) return null;

  const maxW =
    size === "sm"
      ? "max-w-md"
      : size === "md"
        ? "max-w-2xl"
        : size === "xl"
          ? "max-w-5xl"
          : "max-w-3xl";

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-msl-bg/85"
        onClick={onClose}
        aria-label="Close panel"
      />
      <div
        className={`relative w-full ${maxW} ${
          fullHeight ? "h-[min(720px,calc(100vh-2rem))]" : "max-h-[90vh]"
        } flex flex-col rounded-msl border border-msl-border bg-msl-surface shadow-glow-indigo overflow-hidden animate-pop-in`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-msl-border bg-msl-surface shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="p-2 rounded-msl text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              </button>
            ) : null}
            <h2 className="font-display text-base font-semibold text-msl-text truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-msl text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className={`flex-1 overflow-y-auto bg-msl-surface ${fullHeight ? "flex flex-col min-h-0" : "p-4 sm:p-5"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
