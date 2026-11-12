import { resolvePastQuestionHtml } from "../../utils/pastQuestionExamHtml";

export default function PastQuestionExamText({ text, html, className = "" }) {
  const content = resolvePastQuestionHtml(text, html);
  if (!content) return null;

  return (
    <div
      className={`pq-exam-html ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
