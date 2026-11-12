/** Same control as the Questions tab — opens past-question chat scoped to that question. */
export default function PastQuestionAskAiButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={(e) => onClick?.(e)}
      className={`text-xs font-semibold text-brand hover:underline shrink-0 ${className}`.trim()}
    >
      Ask AI
    </button>
  );
}
