export default function IconBox({ children, variant = "indigo", className = "" }) {
  const variants = {
    indigo: "bg-brand/15 text-brand",
    emerald: "bg-emerald-500/15 text-emerald-500",
    amber: "bg-amber-500/15 text-amber-500",
    sky: "bg-sky-500/15 text-sky-500",
    red: "bg-red-500/15 text-red-500",
  };
  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${variants[variant] || variants.indigo} ${className}`}
    >
      {children}
    </div>
  );
}
