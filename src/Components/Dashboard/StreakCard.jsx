import { Check } from "lucide-react";
import { getWeekDayStates } from "../../utils/gamificationHelpers";

const SCALLOP_PATH =
  "M18 3 L20.4 9.8 L27.5 8.2 L23.8 14.2 L29.5 18.5 L22.8 20.2 L23.5 27.5 L18 24.2 L12.5 27.5 L13.2 20.2 L6.5 18.5 L12.2 14.2 L8.5 8.2 L15.6 9.8 Z";

function WeekBadge({ status }) {
  const filled = status === "complete";

  return (
    <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full" aria-hidden>
        <path
          d={SCALLOP_PATH}
          fill={filled ? "#FACC15" : "none"}
          stroke={filled ? "none" : "currentColor"}
          strokeWidth="1.25"
          className={filled ? "" : "text-white/25"}
        />
      </svg>
      <Check
        className={`absolute w-3.5 h-3.5 ${filled ? "text-black" : "text-white/25"}`}
        strokeWidth={filled ? 2.75 : 1.5}
      />
    </div>
  );
}

export default function StreakCard({ currentStreak, longestStreak, streakAtRisk }) {
  const streak = currentStreak ?? 0;
  const best = longestStreak ?? 0;
  const weekDays = getWeekDayStates(streak, streakAtRisk);

  return (
    <div className="relative overflow-hidden rounded-msl h-full flex flex-col p-5 border border-white/10 bg-gradient-to-br from-[#1a1570] via-[#201895] to-[#2a1f8c] text-white shadow-glow-indigo backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-msl bg-white/10 text-xl shrink-0 leading-none">
          🔥
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-sm font-bold tracking-tight">This Week</h3>
          <p className="text-xs text-white/70 mt-0.5">
            {streak} days and counting!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
        <div className="flex-1 h-px bg-white/15" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
      </div>

      <div className="flex justify-between gap-0.5 flex-1 items-start">
        {weekDays.map((day) => (
          <div key={day.label} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <WeekBadge status={day.status} />
            <span
              className={`text-[10px] leading-none ${
                day.isToday ? "font-bold text-white" : "font-normal text-white/55"
              }`}
            >
              {day.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-right text-xs font-bold mt-4 tabular-nums">
        Longest streak: {best} days
      </p>

      {streakAtRisk ? (
        <p className="text-[10px] text-amber-300/90 text-right mt-1">
          Learn today to keep your streak
        </p>
      ) : null}
    </div>
  );
}
