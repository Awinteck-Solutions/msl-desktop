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

/** Monday = 0 … Sunday = 6 */
function weekDayIndex(date) {
  return (date.getDay() + 6) % 7;
}

/**
 * Weekday indices (0–6) covered by the streak: N consecutive calendar days
 * ending today, or ending yesterday when streakAtRisk (today not yet counted).
 * Works for any streak length; only seven columns exist so we stop after 7.
 */
export function getStreakCompleteIndices(currentStreak = 0, streakAtRisk = false) {
  const streak = Math.max(0, Number(currentStreak) || 0);
  if (streak === 0) return new Set();

  const completeIndices = new Set();
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  if (streakAtRisk) {
    end.setDate(end.getDate() - 1);
  }

  const daysToMark = Math.min(streak, WEEK_DAYS.length);
  for (let d = 0; d < daysToMark; d++) {
    const date = new Date(end);
    date.setDate(end.getDate() - d);
    completeIndices.add(weekDayIndex(date));
  }

  return completeIndices;
}

/** Derive Mon–Sun badge states from streak count (no per-day API). */
export function getWeekDayStates(currentStreak = 0, streakAtRisk = false) {
  const todayIdx = weekDayIndex(new Date());
  const completeIndices = getStreakCompleteIndices(currentStreak, streakAtRisk);

  return WEEK_DAYS.map((label, i) => {
    const isToday = i === todayIdx;

    if (completeIndices.has(i)) {
      return { label, status: "complete", isToday };
    }

    if (isToday) {
      return { label, status: "today", isToday };
    }

    if (i > todayIdx) {
      return { label, status: "future", isToday };
    }

    return { label, status: "missed", isToday };
  });
}
