import { useEffect, useMemo, useState } from "react";
import { useToast } from "@chakra-ui/react";
import {
  FileText,
  History,
  Layers,
  Sparkles,
  Target,
} from "lucide-react";
import AiPanelShell from "../AiPanelShell";
import AiHtmlContent from "../AiHtmlContent";
import FlashcardPlayer from "../../Flashcard/FlashcardPlayer";
import QuizPlayer from "../../Quiz/QuizPlayer";
import StatusBadge from "../../UI/StatusBadge";
import { ActivityListSkeleton } from "../../UI/Skeleton";
import { getRecentActivity } from "../../../Services/GeminiApi";
import { getSubscriptionRecentActivity } from "../../../Services/SubscriptionAiApi";

const TYPE_META = {
  summarize: { label: "Summary", icon: Sparkles, status: "processing" },
  "generate-flashcards": { label: "Flashcards", icon: Layers, status: "neutral" },
  "generate-quiz": { label: "Quiz", icon: Target, status: "completed" },
};

const TABS = [
  { id: "all", label: "All" },
  { id: "summarize", label: "Summaries" },
  { id: "generate-flashcards", label: "Flashcards" },
  { id: "generate-quiz", label: "Quizzes" },
];

function parseJsonAnswer(raw) {
  let jsonStr = String(raw || "").trim();
  const m = jsonStr.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (m) jsonStr = m[1].trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function resolveActivityTitle(item) {
  if (item.title) return item.title;
  if (item.course && typeof item.course === "object" && item.course.title) {
    return item.course.title;
  }
  if (item.lesson && typeof item.lesson === "object" && item.lesson.title) {
    return item.lesson.title;
  }
  return null;
}

function normalizeActivityItem(item, forcedType) {
  const type = forcedType || item.queryType || item.type || "unknown";
  const meta = TYPE_META[type] || { label: type, status: "neutral" };

  let title = resolveActivityTitle(item);
  let subtitle = "";
  let answer = item.answer;
  let flashcards = item.flashcards;
  let questions = item.questions;
  let summary = item.summary;

  if (type === "summarize") {
    summary = summary || answer;
    answer = summary;
    if (!title) title = "Lesson summary";
    const preview = String(summary || "")
      .replace(/<[^>]+>/g, "")
      .trim();
    subtitle = preview
      ? preview.slice(0, 120) + (preview.length > 120 ? "…" : "")
      : "AI-generated summary";
  }

  if (type === "generate-flashcards") {
    const cards = Array.isArray(answer)
      ? answer
      : flashcards || parseJsonAnswer(answer) || [];
    flashcards = cards;
    answer = cards;
    if (!title) title = "Flashcard deck";
    subtitle = `${cards.length} card${cards.length === 1 ? "" : "s"}`;
  }

  if (type === "generate-quiz") {
    const qs = Array.isArray(answer)
      ? answer
      : questions || parseJsonAnswer(answer) || [];
    questions = qs;
    answer = qs;
    if (!title) title = "Generated quiz";
    subtitle = `${qs.length} question${qs.length === 1 ? "" : "s"}`;
  }

  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleString()
    : "";

  return {
    ...item,
    queryType: type,
    title,
    subtitle,
    answer,
    flashcards,
    questions,
    summary,
    date,
    meta,
  };
}

function ActivityList({ items, forcedType, onPracticeFlashcards, onPracticeQuiz, onViewSummary }) {
  const normalized = (items || []).map((item) => normalizeActivityItem(item, forcedType));

  if (!normalized.length) {
    return (
      <p className="text-sm text-msl-muted py-10 text-center flex flex-col items-center gap-2">
        <History className="w-8 h-8 opacity-40" strokeWidth={1.5} />
        No activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
      {normalized.map((item) => {
        const Icon = item.meta?.icon || FileText;
        const type = item.queryType;

        return (
          <div
            key={item._id}
            className="p-4 rounded-msl border border-msl-border bg-msl-surface-elevated hover:border-brand/25 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-msl bg-brand/10 flex items-center justify-center text-brand">
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-display font-semibold text-sm text-msl-text truncate">
                    {item.title}
                  </p>
                  <StatusBadge status={item.meta?.status || "neutral"}>
                    {item.meta?.label || type}
                  </StatusBadge>
                </div>
                {item.subtitle ? (
                  <p className="text-xs text-msl-muted line-clamp-2 mb-2">{item.subtitle}</p>
                ) : null}
                <p className="text-xs text-msl-muted font-mono tabular-nums mb-3">{item.date}</p>

                {type === "summarize" ? (
                  <button
                    type="button"
                    onClick={() => onViewSummary(item)}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    View summary
                  </button>
                ) : null}
                {type === "generate-flashcards" ? (
                  <button
                    type="button"
                    onClick={() => onPracticeFlashcards(item)}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Practice again
                  </button>
                ) : null}
                {type === "generate-quiz" ? (
                  <button
                    type="button"
                    onClick={() => onPracticeQuiz(item)}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Practice again
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AiRecentActivityPanel({ isOpen, onClose, onBack, variant = "course" }) {
  const isSubscription = variant === "subscription";
  const toast = useToast();
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [practiceDeck, setPracticeDeck] = useState(null);
  const [practiceQuiz, setPracticeQuiz] = useState(null);
  const [viewSummary, setViewSummary] = useState(null);

  useEffect(() => {
    if (isOpen) return;
    setTab("all");
    setPracticeDeck(null);
    setPracticeQuiz(null);
    setViewSummary(null);
    setItems([]);
    setLoading(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const load = isSubscription ? getSubscriptionRecentActivity : getRecentActivity;
    load({ page: 1, limit: 50 })
      .then((allRes) => {
        if (allRes.status) {
          setItems(allRes.response?.response || allRes.response?.items || []);
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen, isSubscription]);

  const filteredItems = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((item) => item.queryType === tab);
  }, [items, tab]);

  const practiceFlashcards = (item) => {
    const normalized = normalizeActivityItem(item, "generate-flashcards");
    const cards = normalized.flashcards || [];
    if (!cards.length) {
      toast({ title: "Could not load flashcards", status: "warning" });
      return;
    }
    setPracticeDeck({
      title: normalized.title || "Flashcards",
      flashcardItems: cards.map((c) => ({
        term: c.term,
        definition: c.definition,
      })),
    });
  };

  const handlePracticeQuiz = (item) => {
    const normalized = normalizeActivityItem(item, "generate-quiz");
    const questions = normalized.questions || [];
    if (!questions.length) {
      toast({ title: "Could not load quiz", status: "warning" });
      return;
    }
    setPracticeQuiz({
      title: normalized.title || "Quiz",
      quiz: questions.map((q, i) => ({ ...q, _id: q._id || `hist-${i}` })),
    });
  };

  if (practiceDeck) {
    return (
      <AiPanelShell
        isOpen={isOpen}
        onClose={onClose}
        onBack={() => setPracticeDeck(null)}
        title="Practice flashcards"
        size="lg"
      >
        <FlashcardPlayer
          deck={practiceDeck}
          ephemeral
          onBack={() => setPracticeDeck(null)}
        />
      </AiPanelShell>
    );
  }

  if (practiceQuiz) {
    return (
      <AiPanelShell
        isOpen={isOpen}
        onClose={onClose}
        onBack={() => setPracticeQuiz(null)}
        title="Practice quiz"
        size="lg"
      >
        <QuizPlayer quiz={practiceQuiz} ephemeral embedded onBack={() => setPracticeQuiz(null)} />
      </AiPanelShell>
    );
  }

  if (viewSummary) {
    const normalized = normalizeActivityItem(viewSummary, "summarize");
    return (
      <AiPanelShell
        isOpen={isOpen}
        onClose={onClose}
        onBack={() => setViewSummary(null)}
        title={normalized.title || "Summary"}
      >
        <div className="p-4 rounded-msl border border-msl-border bg-msl-surface-elevated text-sm text-msl-text">
          <AiHtmlContent content={normalized.summary || normalized.answer} />
        </div>
      </AiPanelShell>
    );
  }

  return (
    <AiPanelShell isOpen={isOpen} onClose={onClose} onBack={onBack} title="Recent activity" size="lg">
      {loading ? (
        <ActivityListSkeleton />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-msl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? "bg-brand text-white"
                    : "border border-msl-border text-msl-muted hover:text-msl-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <ActivityList
            items={filteredItems}
            forcedType={tab === "all" ? null : tab}
            onPracticeFlashcards={practiceFlashcards}
            onPracticeQuiz={handlePracticeQuiz}
            onViewSummary={setViewSummary}
          />
        </>
      )}
    </AiPanelShell>
  );
}
