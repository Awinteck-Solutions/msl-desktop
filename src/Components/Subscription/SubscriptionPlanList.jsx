import { Smartphone } from "lucide-react";
import { formatSubscriptionMoney } from "../../utils/subscriptionDisplay";

export default function SubscriptionPlanList({ plan }) {
  const models = Array.isArray(plan?.plans) && plan.plans.length
    ? [...plan.plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : plan
      ? [plan]
      : [];

  if (!models.length) {
    return <p className="text-sm text-msl-muted">Subscription plans are not available yet.</p>;
  }

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {models.map((item) => {
          const available = Boolean(item.isActive);
          return (
            <li
              key={item.id || item.code || item.name}
              className="rounded-lg border border-msl-border bg-msl-surface/60 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-msl-text">{item.name || "Plan"}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    available ? "bg-emerald-500/15 text-emerald-600" : "bg-msl-muted/15 text-msl-muted"
                  }`}
                >
                  {available ? "Available" : "Not available"}
                </span>
              </div>
              <p className="mt-2 text-sm text-msl-text">
                {formatSubscriptionMoney(item.amount, item.currency || plan?.currency)}
                <span className="text-msl-muted"> / {item.intervalDays || "—"} days</span>
              </p>
              {item.description ? (
                <p className="mt-1 text-xs text-msl-muted line-clamp-2">{item.description}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="flex items-start gap-2 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2.5">
        <Smartphone className="h-4 w-4 shrink-0 text-brand mt-0.5" strokeWidth={1.75} />
        <p className="text-sm text-msl-text">Subscribe with the mobile app. Checkout is not available on desktop.</p>
      </div>
    </div>
  );
}
