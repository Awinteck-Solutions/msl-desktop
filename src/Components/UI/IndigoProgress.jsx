export default function IndigoProgress({ value = 0, className = "" }) {
  return (
    <div className={`h-1.5 w-full rounded-full bg-msl-border overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
