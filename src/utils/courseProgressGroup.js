export const COURSE_GROUP_TABS = [
  { id: "all", label: "All" },
  { id: "not_started", label: "Not started" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
];

export function getCourseProgressState(progress) {
  const pct = progress?.percentage ?? 0;
  const total = progress?.total ?? 0;
  const completed = progress?.completed ?? 0;

  if (total > 0 && (pct >= 100 || completed >= total)) return "completed";
  if (pct > 0 || completed > 0) return "in_progress";
  return "not_started";
}

export function filterCoursesByGroup(courses, group) {
  if (group === "all") return courses;
  return courses.filter((c) => getCourseProgressState(c.progress) === group);
}

export function countCoursesByGroup(courses) {
  const counts = { all: courses.length, not_started: 0, in_progress: 0, completed: 0 };
  courses.forEach((c) => {
    const state = getCourseProgressState(c.progress);
    counts[state] += 1;
  });
  return counts;
}
