import { normalizeAiContent } from "../../utils/aiHtmlContent";

const HTML_CLASS =
  "ai-html-content text-sm [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_strong]:font-semibold [&_em]:italic [&_code]:rounded [&_code]:bg-msl-surface-elevated [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_a]:text-blue-600 [&_a]:underline";

export default function AiHtmlContent({ content, className = "" }) {
  const html = normalizeAiContent(content);
  if (!html) return null;

  return (
    <div
      className={`${HTML_CLASS} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
