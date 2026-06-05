export default function SecondaryButton({
  children,
  className = "",
  disabled = false,
  type = "button",
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-msl-border bg-transparent px-4 py-2.5 text-sm font-medium text-msl-text transition-colors hover:border-brand hover:bg-brand/10 hover:text-brand disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
