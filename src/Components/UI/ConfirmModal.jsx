import { X } from "lucide-react";
import GradientButton from "./GradientButton";
import SecondaryButton from "./SecondaryButton";

export default function ConfirmModal({
  isOpen,
  onClose,
  title,
  children,
  actions = [],
  zIndex = 1200,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-msl-bg/70"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        className="relative w-full max-w-sm glass-card rounded-msl border-2 border-msl-border bg-msl-surface shadow-xl animate-pop-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-msl-border">
          <h3
            id="confirm-modal-title"
            className="font-display text-base font-semibold text-msl-text"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-msl text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-msl-muted leading-relaxed">{children}</div>
        {actions.length ? (
          <div className="px-5 pb-5 flex flex-col gap-2">
            {actions.map((action) =>
              action.variant === "primary" ? (
                <GradientButton
                  key={action.label}
                  className="w-full py-2.5"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  loading={action.loading}
                >
                  {action.loading ? action.loadingLabel || action.label : action.label}
                </GradientButton>
              ) : action.variant === "destructive" ? (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="w-full rounded-msl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  {action.label}
                </button>
              ) : (
                <SecondaryButton
                  key={action.label}
                  className="w-full"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.label}
                </SecondaryButton>
              )
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
