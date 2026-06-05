import IconBox from "../UI/IconBox";

export default function StatCard({ label, value, sub, icon }) {
  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="relative">
        {icon ? <IconBox className="mb-3">{icon}</IconBox> : null}
        <p className="text-xs text-msl-muted uppercase tracking-widest">{label}</p>
        <p className="font-display text-2xl sm:text-3xl font-bold text-msl-text mt-1 tabular-nums tracking-tight">
          {value}
        </p>
        {sub ? <p className="text-sm text-msl-muted mt-1">{sub}</p> : null}
      </div>
    </div>
  );
}
