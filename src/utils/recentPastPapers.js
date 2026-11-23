const STORAGE_KEY = "msl.pastQuestions.recent";
const MAX_RECENT = 8;

export function readRecentPapers() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => item && item._id);
  } catch {
    return [];
  }
}

export function rememberPastPaper(summary) {
  if (!summary?._id) return readRecentPapers();
  const entry = {
    _id: String(summary._id),
    title: summary.title || "",
    sitting: summary.sitting || "",
    year: summary.year || "",
    level: summary.level || "",
    paperCode: summary.paperCode || "",
    categoryName: summary.categoryName || "",
    openedAt: Date.now(),
  };
  const next = [
    entry,
    ...readRecentPapers().filter((item) => String(item._id) !== entry._id),
  ].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
