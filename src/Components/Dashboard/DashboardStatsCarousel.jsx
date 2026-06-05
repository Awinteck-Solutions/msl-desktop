import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProfileProgressCard from "./ProfileProgressCard";
import ChallengePanel from "./ChallengePanel";
import StreakCard from "./StreakCard";

export default function DashboardStatsCarousel({ gamification, remaining, pct }) {
  const [page, setPage] = useState(0);
  const maxPage = 1;

  useEffect(() => {
    const id = setInterval(() => {
      setPage((p) => (p >= maxPage ? 0 : p + 1));
    }, 6000);
    return () => clearInterval(id);
  }, [maxPage]);

  const cards = [
    <ProfileProgressCard
      key="profile"
      level={gamification?.level}
      totalXp={gamification?.totalXp}
      remaining={remaining}
      pct={pct}
      badgeCount={gamification?.badges?.length}
    />,
    <ChallengePanel
      key="daily"
      title="Daily challenge"
      periodId={gamification?.dailyChallenge?.periodId}
      challenge={gamification?.dailyChallenge}
      expected={gamification?.dailyChallengeExpectedCounts}
    />,
    <ChallengePanel
      key="weekly"
      title="Weekly challenge"
      periodId={gamification?.weeklyChallenge?.periodId}
      challenge={gamification?.weeklyChallenge}
      expected={gamification?.weeklyChallengeExpectedCounts}
    />,
    <StreakCard
      key="streak"
      currentStreak={gamification?.currentStreak}
      longestStreak={gamification?.longestStreak}
      streakAtRisk={gamification?.streakAtRisk}
    />,
  ];

  return (
    <section className="relative">
      <div className="overflow-hidden rounded-msl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${page * 33.333}%)` }}
        >
          {cards.map((card) => (
            <div key={card.key} className="w-1/3 shrink-0 px-2 first:pl-0 last:pr-0">
              {card}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="p-2 rounded-msl border border-msl-border text-msl-muted hover:text-msl-text hover:border-brand/30 disabled:opacity-30 transition-colors"
          aria-label="Previous stats"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: maxPage + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                page === i ? "bg-brand" : "bg-msl-border"
              }`}
              aria-label={`Stats page ${i + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          disabled={page === maxPage}
          className="p-2 rounded-msl border border-msl-border text-msl-muted hover:text-msl-text hover:border-brand/30 disabled:opacity-30 transition-colors"
          aria-label="Next stats"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}
