import { Sparkles } from "lucide-react";

export default function PastQuestionChatFab({ onClick, disabled }) {
  return (
    <div className="fixed bottom-6 right-6 z-[1000] animate-msl-fab-bounce">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="h-12 px-5 rounded-full bg-gradient-cta text-white text-sm shadow-glow-indigo hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 border border-white/15 disabled:opacity-45 disabled:pointer-events-none disabled:animate-none"
        aria-label="Open past question MSL AI chat"
      >
        <Sparkles className="w-4 h-4 shrink-0" strokeWidth={2} />
        <span className="tracking-tight whitespace-nowrap">
          <span className="font-bold">MSL</span> AI
        </span>
      </button>
    </div>
  );
}
