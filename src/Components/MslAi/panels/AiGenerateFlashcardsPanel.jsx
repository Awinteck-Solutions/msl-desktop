import { useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { Layers, Loader2, Sparkles } from "lucide-react";
import AiPanelShell from "../AiPanelShell";
import AiGenerateScopePicker from "../AiGenerateScopePicker";
import FlashcardPlayer from "../../Flashcard/FlashcardPlayer";
import StudyModal from "../../UI/StudyModal";
import GradientButton from "../../UI/GradientButton";
import { useMslAi } from "../../../Context/MslAiContext";
import {
  buildScopePayload,
  generateFlashcards,
  hasAiScope,
} from "../../../Services/GeminiApi";

export default function AiGenerateFlashcardsPanel({ isOpen, onClose, onBack }) {
  const toast = useToast();
  const { scope } = useMslAi();
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [deck, setDeck] = useState(null);
  const [practicing, setPracticing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPracticing(false);
      setDeck(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!hasAiScope(scope)) {
      toast({ title: "Select a content source first", status: "warning" });
      return;
    }
    setLoading(true);
    const res = await generateFlashcards({
      ...buildScopePayload(scope),
      count,
      courseIdForLink: scope.courseId,
    });
    setLoading(false);
    if (res.status) {
      const cards = res.response?.response?.flashcards || [];
      setDeck({
        title: scope.label ? `AI — ${scope.label}` : "AI Flashcards",
        flashcardItems: cards,
      });
      setPracticing(true);
    } else {
      toast({ title: res.message || "Generation failed", status: "error" });
    }
  };

  const exitPractice = () => {
    setPracticing(false);
    setDeck(null);
  };

  return (
    <>
      <AiPanelShell
        isOpen={isOpen && !practicing}
        onClose={onClose}
        onBack={onBack}
        title="Generate flashcards"
        size="md"
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-msl-border bg-msl-accent/30 px-4 py-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand/15 text-brand flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-msl-text">AI flashcard deck</p>
              <p className="text-xs text-msl-muted mt-0.5">
                Pick any course or lesson below, then generate and practice.
              </p>
            </div>
          </div>

          <AiGenerateScopePicker panelOpen={isOpen} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-msl-text">Number of cards</label>
              <span className="text-sm font-semibold text-brand">{count}</span>
            </div>
            <input
              type="range"
              min={5}
              max={20}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-[11px] text-msl-muted mt-1">
              <span>5</span>
              <span>20</span>
            </div>
          </div>

          <GradientButton
            onClick={handleGenerate}
            disabled={loading || !hasAiScope(scope)}
            className="w-full"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate &amp; practice
              </span>
            )}
          </GradientButton>
        </div>
      </AiPanelShell>

      <StudyModal
        isOpen={isOpen && practicing && !!deck}
        onClose={exitPractice}
        title={deck?.title || "Flashcard review"}
        subtitle="AI-generated deck"
        size="xl"
        closeOnClickOutside={false}
      >
        <FlashcardPlayer deck={deck} ephemeral embedded onBack={exitPractice} />
      </StudyModal>
    </>
  );
}
