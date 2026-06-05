import { useEffect, useState } from "react";
import {
  Brain,
  ChevronRight,
  History,
  Layers,
  MessageCircle,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import IconBox from "../UI/IconBox";

const MENU_ITEMS = [
  { id: "chat", label: "Chat with AI", desc: "Ask about your lessons", icon: MessageCircle },
  { id: "flashcards", label: "Generate flashcards", desc: "From course content", icon: Layers },
  { id: "quiz", label: "Generate quiz", desc: "Practice questions", icon: Target },
  { id: "summarize", label: "Summarise", desc: "Quick lesson summary", icon: Sparkles },
  { id: "activity", label: "Recent activity", desc: "History & practice again", icon: History },
];

export default function MslAiMenu({ isOpen, onClose, onSelect }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-[999] bg-msl-bg/60 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-label="Close menu"
      />
      <div
        className={`fixed bottom-[5.5rem] right-6 z-[1000] w-[min(22rem,calc(100vw-2rem))] rounded-msl border-2 border-brand/20 bg-msl-surface shadow-glow-indigo overflow-hidden transition-all duration-250 ease-out origin-bottom-right ${
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3"
        }`}
        role="dialog"
        aria-label="MSL AI menu"
      >
        <div className="px-4 pt-4 pb-3 border-b border-msl-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <IconBox className="!w-9 !h-9">
              <Brain className="w-4 h-4" strokeWidth={1.75} />
            </IconBox>
            <div>
              <h2 className="font-display text-sm font-bold text-msl-text leading-none">
                <span className="font-bold">MSL</span> AI
              </h2>
              <p className="text-[10px] text-msl-muted mt-1 uppercase tracking-widest">
                Learning assistant
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-msl text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="p-3 space-y-1.5">
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-msl border border-msl-border bg-msl-surface/40 hover:border-brand/35 hover:bg-brand/8 transition-all duration-150 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                }`}
                style={{ transitionDelay: visible ? `${index * 35}ms` : "0ms" }}
              >
                <IconBox className="!w-9 !h-9 shrink-0">
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </IconBox>
                <span className="flex-1 text-left min-w-0">
                  <span className="block text-sm font-medium text-msl-text">{item.label}</span>
                  <span className="block text-[11px] text-msl-muted truncate">{item.desc}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-msl-muted shrink-0" strokeWidth={2} />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
