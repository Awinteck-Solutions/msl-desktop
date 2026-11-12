import { normalizeAiContent } from "../../utils/aiHtmlContent";

const HTML_CLASS =
  "ai-html-content text-sm text-msl-text [&_p]:mb-2 [&_p]:text-inherit [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_li]:text-inherit [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-inherit [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-inherit [&_h3]:font-semibold [&_h3]:text-inherit [&_strong]:font-semibold [&_em]:italic [&_code]:rounded [&_code]:bg-msl-surface [&_code]:border [&_code]:border-msl-border [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-inherit [&_pre]:my-2 [&_pre]:overflow-x-auto [&_a]:text-brand [&_a]:underline";

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
