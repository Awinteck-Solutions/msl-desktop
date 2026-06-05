import IconBox from "./IconBox";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="glass-card p-12 text-center max-w-md mx-auto">
      <div className="mx-auto mb-4">
        <IconBox className="!w-14 !h-14">{icon}</IconBox>
      </div>
      <h3 className="font-display text-lg font-semibold text-msl-text tracking-tight">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-msl-muted mt-2">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
