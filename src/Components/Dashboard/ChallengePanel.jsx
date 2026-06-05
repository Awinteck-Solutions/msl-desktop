import IndigoProgress from "../UI/IndigoProgress";
import StatusBadge from "../UI/StatusBadge";
import {
  buildChallengeItems,
  challengeCompletion,
} from "../../utils/gamificationHelpers";

export default function ChallengePanel({ title, periodId, challenge, expected }) {
  const items = buildChallengeItems(challenge?.counts, expected);
  const completion = challengeCompletion(items);
  const rewarded = challenge?.rewarded;

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-msl-text tracking-tight">
            {title}
          </h3>
          {periodId ? (
            <p className="text-xs text-msl-muted mt-0.5 font-mono">{periodId}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-brand tabular-nums">
            {completion}%
          </p>
          {rewarded ? (
            <StatusBadge status="completed">Rewarded</StatusBadge>
          ) : (
            <StatusBadge status="pending">In progress</StatusBadge>
          )}
        </div>
      </div>

      <IndigoProgress value={completion} className="mb-4" />

      <div className="space-y-3 flex-1">
        {items.map((item) => (
          <div key={item.key}>
            <div className="flex justify-between text-xs mb-1">
              <span className={item.done ? "text-emerald-500" : "text-msl-text"}>
                {item.label}
              </span>
              <span className="text-msl-muted font-mono tabular-nums">
                {item.current}/{item.target}
              </span>
            </div>
            <IndigoProgress value={item.pct} />
          </div>
        ))}
      </div>
    </div>
  );
}
