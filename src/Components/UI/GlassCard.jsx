export default function GlassCard({ children, className = "", animate = false }) {
  return (
    <div
      className={`glass-card rounded-2xl ${animate ? "animate-slide-in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
