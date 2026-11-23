import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import { Layers, Loader2, Sparkles } from "lucide-react";
import AiPanelShell from "../AiPanelShell";
import AiGenerateScopePicker from "../AiGenerateScopePicker";
import GradientButton from "../../UI/GradientButton";
import { useMslAi } from "../../../Context/MslAiContext";
import { buildScopePayload, hasAiScope } from "../../../Services/GeminiApi";
import SubscriptionAiScopePicker from "../SubscriptionAiScopePicker";
import { buildSubscriptionScopePayload } from "../../../Services/SubscriptionAiApi";
import { useGenerationActivity } from "../GenerationActivity";

export default function AiGenerateFlashcardsPanel({ isOpen, onClose, onBack, variant = "course" }) {
  const isSubscription = variant === "subscription";
  const toast = useToast();
  const { scope } = useMslAi();
  const { begin } = useGenerationActivity();
  const [count, setCount] = useState(10);
  const [starting, setStarting] = useState(false);

  const handleGenerate = async () => {
    if (!isSubscription && !hasAiScope(scope)) {
      toast({ title: "Select a content source first", status: "warning" });
      return;
    }
    setStarting(true);
    const payload = isSubscription
      ? { ...buildSubscriptionScopePayload(scope), count }
      : { ...buildScopePayload(scope), count, courseIdForLink: scope.courseId };
    const res = await begin({
      kind: "generate-flashcards",
      label: scope.label ? `Flashcards — ${scope.label}` : "Flashcards",
      variant: isSubscription ? "subscription" : "course",
      payload,
    });
    setStarting(false);
    if (res.status) onClose();
    else toast({ title: res.message || "Generation failed", status: "error" });
  };

  return (
    <>
      <AiPanelShell
        isOpen={isOpen}
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
                {isSubscription
                  ? "Pick subscriber content below, then generate and practice."
                  : "Pick any course or lesson below, then generate and practice."}
              </p>
            </div>
          </div>

          {isSubscription ? (
            <SubscriptionAiScopePicker panelOpen={isOpen} />
          ) : (
            <AiGenerateScopePicker panelOpen={isOpen} />
          )}

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
            disabled={starting || (!isSubscription && !hasAiScope(scope))}
            className="w-full"
          >
            {starting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting…
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
    </>
  );
}
