import { ChevronDown } from "lucide-react";
import PastQuestionExamText from "./PastQuestionExamText";
import { hasPastQuestionContent } from "../../utils/pastQuestionExamHtml";

export default function PastQuestionAnswerBlock({ label, text, html, notes = false }) {
  if (!hasPastQuestionContent(text, html)) return null;

  return (
    <details className="mt-3 text-sm group/answer">
      <summary className="cursor-pointer list-none flex items-center gap-2 font-medium text-brand [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="w-4 h-4 text-msl-muted transition-transform group-open/answer:rotate-180"
          strokeWidth={2}
        />
        {label}
      </summary>
      <div
        className={`mt-2 pl-3 border-l-2 ${
          notes ? "border-amber-400/60" : "border-msl-border"
        }`}
      >
        <PastQuestionExamText text={text} html={html} />
      </div>
    </details>
  );
}
