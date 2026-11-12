import { looksLikeHtml, markdownToHtml, sanitizeAiHtml } from "./aiHtmlContent";

/** Prefer stored HTML from paper extraction; otherwise normalize plain/markdown text. */
export function resolvePastQuestionHtml(text, html) {
  const rawHtml = String(html || "").trim();
  if (rawHtml) {
    return sanitizeExamHtml(rawHtml);
  }
  const value = String(text || "").trim();
  if (!value) return "";
  if (looksLikeHtml(value)) {
    return sanitizeExamHtml(value);
  }
  return sanitizeExamHtml(markdownToHtml(value));
}

export function sanitizeExamHtml(html) {
  let cleaned = sanitizeAiHtml(String(html || ""));
  cleaned = cleaned.replace(/<(?!\/?(?:p|br|strong|b|em|i|u|sub|sup|ul|ol|li|table|thead|tbody|tfoot|tr|th|td|caption|h[1-6]|blockquote|div|span)\b)[^>]+>/gi, "");
  return cleaned;
}

export function hasPastQuestionContent(text, html) {
  return Boolean(String(html || "").trim() || String(text || "").trim());
}
