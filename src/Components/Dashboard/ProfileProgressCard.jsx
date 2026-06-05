import { Award, Star, Zap } from "lucide-react";

function GlassProgress({ value = 0 }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-white/80 to-white transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ProfileProgressCard({ level, totalXp, remaining, pct, badgeCount }) {
  const currentLevel = level ?? 1;
  const xp = totalXp ?? 0;
  const badges = badgeCount ?? 0;
  const progressPct = Math.round(pct ?? 0);
  const xpRemaining = remaining ?? 0;

  return (
    <div className="relative overflow-hidden rounded-msl h-full flex flex-col p-5 border border-white/10 bg-gradient-to-br from-[#181070] via-[#201895] to-[#2e22b8] text-white shadow-glow-indigo backdrop-blur-xl">
      <div
        className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/5 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-[#2e22b8]/40 blur-xl"
        aria-hidden
      />

      <div className="relative flex items-center gap-3 mb-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-msl bg-white/10 text-amber-300 shrink-0">
          <Star className="w-5 h-5" strokeWidth={1.75} fill="currentColor" fillOpacity={0.35} />
        </div>
        <h3 className="font-display text-sm font-bold tracking-tight">Your progress</h3>
      </div>

      <div className="relative flex items-center gap-0 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
        <div className="flex-1 h-px bg-white/15" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
      </div>

      <div className="relative grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/55 mb-1">Level</p>
          <p className="font-display text-3xl font-bold tabular-nums leading-none">{currentLevel}</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/55 mb-1">Badges</p>
          <div className="flex items-center justify-center gap-1.5">
            <Award className="w-5 h-5 text-emerald-300 shrink-0" strokeWidth={1.75} />
            <p className="font-display text-3xl font-bold tabular-nums leading-none">{badges}</p>
          </div>
        </div>
      </div>

      <div className="relative mt-auto space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-white/75">
            <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" strokeWidth={1.75} />
            <span>To level {currentLevel + 1}</span>
          </div>
          <p className="text-xs font-semibold text-white tabular-nums text-right">
            {xpRemaining.toLocaleString()} XP left
          </p>
        </div>

        <GlassProgress value={progressPct} />

        <div className="flex items-start justify-between gap-3 text-[11px] text-white/60">
          <p className="font-mono tabular-nums">{progressPct}% to next level</p>
          <p className="font-mono tabular-nums text-right">
            {xp.toLocaleString()} XP total
          </p>
        </div>
      </div>
    </div>
  );
}
