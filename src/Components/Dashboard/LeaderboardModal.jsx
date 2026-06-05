import { useEffect, useState } from "react";
import { Star, Trophy, X } from "lucide-react";
import { getLeaderboard } from "../../Services/GamificationApi";
import { mediaUrl } from "../../Services/apiConfig";
import { DotsLoader } from "../UI/Skeleton";

const RANK_STYLES = {
  1: { star: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
  2: { star: "text-slate-300", bg: "bg-slate-300/10 border-slate-300/30" },
  3: { star: "text-amber-700", bg: "bg-amber-700/10 border-amber-700/30" },
};

export default function LeaderboardModal({ isOpen, onClose }) {
  const [type, setType] = useState("xp");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getLeaderboard(type, 20)
      .then((res) => {
        if (res.status) setData(res.response);
      })
      .finally(() => setLoading(false));
  }, [isOpen, type]);

  if (!isOpen) return null;

  const items = data?.items ?? [];

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-msl-bg/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close leaderboard"
      />
      <div
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-msl border border-msl-border bg-msl-surface shadow-glow-indigo overflow-hidden animate-pop-in"
        role="dialog"
        aria-modal="true"
        aria-label="Leaderboard"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-msl-border">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand" strokeWidth={1.75} />
            <h2 className="font-display text-base font-semibold text-msl-text">Leaderboard</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-msl text-msl-muted hover:text-msl-text hover:bg-brand/10"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 pt-4 flex gap-2">
          {["xp", "streak"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-msl px-3.5 py-1.5 text-sm font-medium transition-colors ${
                type === t
                  ? "bg-brand text-white"
                  : "border border-msl-border text-msl-muted hover:text-msl-text"
              }`}
            >
              {t === "xp" ? "XP" : "Streak"}
            </button>
          ))}
        </div>

        {data?.myRank != null ? (
          <p className="px-5 pt-3 text-sm text-brand font-medium">
            Your rank: #{data.myRank}
          </p>
        ) : null}

        <div className="overflow-y-auto px-5 py-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <DotsLoader />
              <p className="text-sm text-msl-muted mt-3">Loading rankings…</p>
            </div>
          ) : !items.length ? (
            <p className="text-sm text-msl-muted text-center py-12">No leaderboard data yet.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((row) => {
                const rankStyle = RANK_STYLES[row.rank];
                const name = [row.firstname, row.lastname].filter(Boolean).join(" ");
                return (
                  <li
                    key={row.rank}
                    className={`flex items-center gap-3 p-3 rounded-msl border ${
                      rankStyle
                        ? rankStyle.bg
                        : "border-msl-border bg-msl-surface-elevated/50"
                    }`}
                  >
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {rankStyle ? (
                        <Star className={`w-5 h-5 fill-current ${rankStyle.star}`} strokeWidth={1.5} />
                      ) : (
                        <span className="text-sm font-mono text-msl-muted tabular-nums">
                          {row.rank}
                        </span>
                      )}
                    </div>
                    {row.image ? (
                      <img
                        src={mediaUrl(row.image)}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-brand/15 flex items-center justify-center text-xs font-semibold text-brand shrink-0">
                        {name?.[0] ?? "?"}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-msl-text truncate">
                        {name || "Student"}
                      </p>
                      {rankStyle ? (
                        <p className="text-xs text-msl-muted">
                          {row.rank === 1 ? "Gold" : row.rank === 2 ? "Silver" : "Bronze"}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-sm font-mono font-semibold text-brand tabular-nums shrink-0">
                      {type === "streak" ? `${row.currentStreak ?? 0}d` : `${row.totalXp ?? 0} XP`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
