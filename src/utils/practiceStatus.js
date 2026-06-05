export const PRACTICE_FILTERS = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "not_started", label: "Not started" },
];

export function getQuizStatus(item) {
  const response = item?.latestResponse;
  if (!response) return "not_started";

  const answered = parseInt(response.total_response, 10) || 0;
  const total = parseInt(response.total_questions, 10) || 0;

  if (total > 0 && answered >= total) return "completed";
  if (answered > 0) return "in_progress";
  return "not_started";
}

export function getFlashcardStatus(deck) {
  const progress = deck?.progress ?? 0;
  const completions = deck?.completionCount ?? 0;

  if (progress >= 100 || completions > 0) return "completed";
  if (progress > 0) return "in_progress";
  return "not_started";
}

export function filterByStatus(items, getStatus, filter) {
  if (!filter || filter === "all") return items;
  return items.filter((item) => getStatus(item) === filter);
}
