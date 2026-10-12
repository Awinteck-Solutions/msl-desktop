import { useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import AiPanelShell from "../AiPanelShell";
import AiGenerateScopePicker from "../AiGenerateScopePicker";
import AiHtmlContent from "../AiHtmlContent";
import GradientButton from "../../UI/GradientButton";
import { useMslAi } from "../../../Context/MslAiContext";
import {
  buildScopePayload,
  hasAiScope,
  summarize,
} from "../../../Services/GeminiApi";
import SubscriptionAiScopePicker from "../SubscriptionAiScopePicker";
import {
  buildSubscriptionScopePayload,
  subscriptionSummarize,
} from "../../../Services/SubscriptionAiApi";

export default function AiSummarizePanel({ isOpen, onClose, onBack, variant = "course" }) {
  const isSubscription = variant === "subscription";
  const toast = useToast();
  const { scope } = useMslAi();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSummary("");
      setLoading(false);
    }
  }, [isOpen]);

  const handleSummarize = async () => {
    if (!isSubscription && !hasAiScope(scope)) {
      toast({ title: "Select a content source first", status: "warning" });
      return;
    }
    setLoading(true);
    setSummary("");
    const res = isSubscription
      ? await subscriptionSummarize(buildSubscriptionScopePayload(scope))
      : await summarize(buildScopePayload(scope));
    setLoading(false);
    if (res.status) {
      setSummary(res.response?.response?.summary || "");
    } else {
      toast({ title: res.message || "Summarize failed", status: "error" });
    }
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
          disabled={loading || (!isSubscription && !hasAiScope(scope))}
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
              Generate summary
            </span>
          )}
        </GradientButton>

        {summary ? (
          <div className="rounded-xl border border-msl-border bg-msl-surface p-4 sm:p-5">
            <AiHtmlContent content={summary} />
          </div>
        ) : null}
      </div>
    </AiPanelShell>
  );
}
