/** Smooth-scroll to a question card; retries until the list has mounted. */
export function scrollToQuestionElement(questionId, attempt = 0) {
  if (!questionId) return;
  const el = document.getElementById(`pq-q-${questionId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (attempt >= 40) return;
  window.setTimeout(() => scrollToQuestionElement(questionId, attempt + 1), 75);
}
