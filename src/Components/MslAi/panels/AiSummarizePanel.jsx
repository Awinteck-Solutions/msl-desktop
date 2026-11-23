import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import AiPanelShell from "../AiPanelShell";
import AiGenerateScopePicker from "../AiGenerateScopePicker";
import GradientButton from "../../UI/GradientButton";
import { useMslAi } from "../../../Context/MslAiContext";
import { buildScopePayload, hasAiScope } from "../../../Services/GeminiApi";
import SubscriptionAiScopePicker from "../SubscriptionAiScopePicker";
import { buildSubscriptionScopePayload } from "../../../Services/SubscriptionAiApi";
import { useGenerationActivity } from "../GenerationActivity";

export default function AiSummarizePanel({ isOpen, onClose, onBack, variant = "course" }) {
  const isSubscription = variant === "subscription";
  const toast = useToast();
  const { scope } = useMslAi();
  const { begin } = useGenerationActivity();
  const [starting, setStarting] = useState(false);

  const handleSummarize = async () => {
    if (!isSubscription && !hasAiScope(scope)) {
      toast({ title: "Select a content source first", status: "warning" });
      return;
    }
    setStarting(true);
    const res = await begin({
      kind: "summarize",
      label: scope.label || "Summary",
      variant: isSubscription ? "subscription" : "course",
      payload: isSubscription ? buildSubscriptionScopePayload(scope) : buildScopePayload(scope),
    });
    setStarting(false);
    if (res.status) onClose();
    else toast({ title: res.message || "Summarize failed", status: "error" });
  };

  return (
    <AiPanelShell isOpen={isOpen} onClose={onClose} onBack={onBack} title="Summarise" size="md">
      <div className="space-y-6">
        <div className="rounded-xl border border-msl-border bg-msl-accent/30 px-4 py-3 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand/15 text-brand flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold text-msl-text">AI summary</p>
            <p className="text-xs text-msl-muted mt-0.5">
              {isSubscription
                ? "Pick a subscriber resource or file, then generate a concise summary."
                : "Pick any course or lesson below, then generate a concise summary."}
            </p>
          </div>
        </div>

        {isSubscription ? (
          <SubscriptionAiScopePicker panelOpen={isOpen} />
        ) : (
          <AiGenerateScopePicker panelOpen={isOpen} />
        )}

        <GradientButton
          onClick={handleSummarize}
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
              Generate summary
            </span>
          )}
        </GradientButton>
      </div>
    </AiPanelShell>
  );
}
