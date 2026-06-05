export const CHALLENGE_META = {
  ai_query: { label: "AI questions", short: "AI" },
  lesson_complete: { label: "Lessons completed", short: "Lessons" },
  quiz_complete: { label: "Quizzes completed", short: "Quizzes" },
  flashcard_session: { label: "Flashcard sessions", short: "Flashcards" },
};

export function buildChallengeItems(counts = {}, expected = {}) {
  const keys = Object.keys(expected);
  return keys.map((key) => {
    const current = counts[key] ?? 0;
    const target = expected[key] ?? 0;
    const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    return {
      key,
      label: CHALLENGE_META[key]?.label || key,
      short: CHALLENGE_META[key]?.short || key,
      current,
      target,
      pct,
      done: target > 0 && current >= target,
    };
  });
}

export function challengeCompletion(items = []) {
  if (!items.length) return 0;
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}

export function xpProgress(totalXp = 0, nextLevelXp = 0) {
  const remaining = typeof nextLevelXp === "number" ? nextLevelXp : 0;
  const threshold = totalXp + remaining;
  const pct = threshold > 0 ? Math.min(100, (totalXp / threshold) * 100) : 0;
  return { remaining, pct, threshold };
}

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Derive Mon–Sun badge states from streak count (no per-day API). */
export function getWeekDayStates(currentStreak = 0, streakAtRisk = false) {
  const streak = Math.max(0, Number(currentStreak) || 0);
  const todayIdx = (new Date().getDay() + 6) % 7;

  return WEEK_DAYS.map((label, i) => {
    const isToday = i === todayIdx;

    if (i > todayIdx) {
      return { label, status: "future", isToday };
    }

    if (isToday) {
      return {
        label,
        status: streakAtRisk || streak === 0 ? "today" : "complete",
        isToday,
      };
    }

    const daysFromIToYesterday = todayIdx - i;
    const required = streakAtRisk ? daysFromIToYesterday : daysFromIToYesterday + 1;
    const complete = streak >= required;

    return {
      label,
      status: complete ? "complete" : "missed",
      isToday,
    };
  });
}
