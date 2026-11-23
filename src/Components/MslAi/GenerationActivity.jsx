import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ChevronDown, Layers, Sparkles, Target, X } from "lucide-react";
import AiPanelShell from "./AiPanelShell";
import AiHtmlContent from "./AiHtmlContent";
import FlashcardPlayer from "../Flashcard/FlashcardPlayer";
import QuizPlayer from "../Quiz/QuizPlayer";
import {
  beginFlashcards,
  beginQuiz,
  beginSummarize,
  getGenerationStatus,
} from "../../Services/GeminiApi";
import { invalidateResponseCache } from "../../Services/responseCache";
import {
  beginSubscriptionFlashcards,
  beginSubscriptionQuiz,
  beginSubscriptionSummarize,
  getSubscriptionGenerationStatus,
} from "../../Services/SubscriptionAiApi";

const GenerationContext = createContext(null);

export const GENERATION_STEPS = {
  summarize: ["Reading the lesson", "Finding the main points", "Writing the summary"],
  "generate-flashcards": ["Reading the lesson", "Choosing the terms", "Writing the cards"],
  "generate-quiz": ["Reading the lesson", "Drafting the questions", "Checking the answers"],
};

const KIND_LABEL = {
  summarize: "Summary",
  "generate-flashcards": "Flashcards",
  "generate-quiz": "Quiz",
};

const STARTERS = {
  course: {
    summarize: beginSummarize,
    "generate-flashcards": beginFlashcards,
    "generate-quiz": beginQuiz,
  },
  subscription: {
    summarize: beginSubscriptionSummarize,
    "generate-flashcards": beginSubscriptionFlashcards,
    "generate-quiz": beginSubscriptionQuiz,
  },
};

export function useGenerationActivity() {
  const value = useContext(GenerationContext);
  if (!value) throw new Error("Generation activity is not available");
  return value;
}

export function LivePhrase({ kind, className = "" }) {
  const steps = GENERATION_STEPS[kind] || GENERATION_STEPS.summarize;
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % steps.length), 2200);
    return () => window.clearInterval(timer);
  }, [steps.length]);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`.trim()}>
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className={`h-1 w-1 rounded-full bg-current ${dot === index ? "opacity-100" : "opacity-35"}`}
          />
        ))}
      </span>
      <span key={steps[index]} className="animate-pop-in">
        {steps[index]}
      </span>
    </span>
  );
}

function stepIndex(startedAt, count) {
  const elapsed = Math.max(0, Date.now() - startedAt);
  return Math.min(count - 1, Math.floor(elapsed / 2200) % count);
}

export function GenerationProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [open, setOpen] = useState(true);
  const [activeId, setActiveId] = useState(null);

  const applyRemote = useCallback((job, remote) => {
    if (!remote || (remote.status !== "ready" && remote.status !== "failed")) return null;
    const result = remote.result || {};
    return {
      ...job,
      status: remote.status,
      error: remote.error || remote.message || "",
      summary: result.summary || "",
      flashcards: result.flashcards || [],
      questions: result.questions || [],
    };
  }, []);

  useEffect(() => {
    const pending = jobs.filter((job) => job.status === "processing");
    if (!pending.length) return undefined;
    let cancelled = false;
    const tick = async () => {
      const updates = await Promise.all(
        pending.map(async (job) => {
          const loader = job.variant === "subscription" ? getSubscriptionGenerationStatus : getGenerationStatus;
          const res = await loader({ jobId: job.id });
          const remote = res.response?.response;
          return applyRemote(job, remote);
        })
      );
      if (cancelled) return;
      const ready = updates.filter(Boolean);
      if (!ready.length) return;
      setJobs((current) =>
        current.map((job) => ready.find((next) => next.id === job.id) || job)
      );
      ready.forEach((job) => {
        if (job.status !== "ready") return;
        if (job.kind === "summarize" && job.summary) {
          setActiveId((current) => current || job.id);
        }
        if (job.kind === "generate-flashcards") invalidateResponseCache("/v2/flashcard");
        if (job.kind === "generate-quiz") {
          invalidateResponseCache("/v2/quiz");
          invalidateResponseCache("/v2/course/user-with-quizzes");
        }
      });
    };
    const timer = window.setInterval(tick, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [jobs, applyRemote]);

  const begin = useCallback(async ({ kind, label, variant, payload }) => {
    const start = STARTERS[variant]?.[kind];
    if (!start) return { status: false, message: "This generation is not available." };
    const result = await start(payload);
    if (!result.status) return result;
    const job = {
      id: result.jobId || `local-${Date.now()}`,
      kind,
      label: label || KIND_LABEL[kind],
      variant,
      status: result.immediate ? "ready" : "processing",
      startedAt: Date.now(),
      error: "",
      summary: result.immediate?.response?.summary || "",
      flashcards: result.immediate?.response?.flashcards || [],
      questions: result.immediate?.response?.questions || [],
    };
    setJobs((current) => [job, ...current]);
    setOpen(true);
    if (job.status === "ready" && job.kind === "summarize" && job.summary) {
      setActiveId(job.id);
    }
    return { status: true };
  }, []);

  const closeAll = () => {
    setJobs([]);
    setActiveId(null);
  };

  const openJob = (job) => setActiveId(job.id);

  const value = useMemo(() => ({ begin, jobs }), [begin, jobs]);
  const running = jobs.filter((job) => job.status === "processing");
  const activeJob = jobs.find((job) => job.id === activeId) || null;
  const resultReady = activeJob?.status === "ready";
  const wideResult = resultReady && activeJob.kind !== "summarize";

  return (
    <GenerationContext.Provider value={value}>
      {children}
      <GenerationNotice
        jobs={jobs}
        running={running}
        open={open}
        onToggle={() => setOpen((current) => !current)}
        onOpen={openJob}
        onCloseAll={closeAll}
      />
      <AiPanelShell
        isOpen={Boolean(activeJob)}
        onClose={() => setActiveId(null)}
        title={activeJob?.label || "AI"}
        size={wideResult ? "xl" : "md"}
        fullHeight={resultReady && activeJob?.kind === "generate-quiz"}
        zClass="z-[1200]"
      >
        {activeJob ? <JobWindow job={activeJob} onClose={() => setActiveId(null)} /> : null}
      </AiPanelShell>
    </GenerationContext.Provider>
  );
}

function GenerationNotice({ jobs, running, open, onToggle, onOpen, onCloseAll }) {
  const [clock, setClock] = useState(0);
  useEffect(() => {
    if (!running.length) return undefined;
    const timer = window.setInterval(() => setClock((value) => value + 1), 2200);
    return () => window.clearInterval(timer);
  }, [running.length]);
  if (!jobs.length) return null;
  const count = running.length;
  const headline =
    count > 1 ? `${count} AI jobs running` : count === 1 ? KIND_LABEL[running[0].kind] || "AI job" : "AI results ready";
  const detail =
    count === 1 ? (
      <LivePhrase kind={running[0].kind} />
    ) : count > 1 ? (
      running.map((job) => KIND_LABEL[job.kind]).join(" · ")
    ) : (
      "Open a finished result"
    );

  return (
    <div className="fixed bottom-24 right-6 z-[900] w-[min(340px,calc(100vw-2rem))]">
      <div className="overflow-hidden rounded-2xl border border-msl-border bg-msl-bg text-msl-text shadow-[var(--card-shadow)]">
        <div className="flex items-center gap-2 px-3 py-3">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
            {count ? <span className="absolute inset-0 rounded-full border-2 border-brand/25 border-t-brand animate-spin" /> : null}
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            {count > 1 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{headline}</span>
            <span className="mt-0.5 block truncate text-xs text-msl-muted">{detail}</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-msl-muted transition ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onCloseAll}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-msl-muted hover:bg-msl-surface hover:text-msl-text"
          aria-label="Close all AI jobs"
        >
          <X className="h-4 w-4" />
        </button>
        </div>
        {open ? (
          <ul className="space-y-2 border-t border-msl-border px-3 py-3">
            {jobs.map((job) => (
              <JobRow key={`${job.id}-${clock}`} job={job} onOpen={() => onOpen(job)} />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function JobRow({ job, onOpen }) {
  const steps = GENERATION_STEPS[job.kind] || GENERATION_STEPS.summarize;
  const active = job.status === "processing" ? stepIndex(job.startedAt, steps.length) : steps.length - 1;
  const Icon = job.kind === "generate-quiz" ? Target : job.kind === "generate-flashcards" ? Layers : Sparkles;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-xl border border-msl-border bg-msl-surface px-3 py-2.5 text-left hover:border-brand/40"
      >
        <span className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{job.label}</span>
            <span className="block text-[11px] text-msl-muted">
              {job.status === "failed" ? job.error || "Generation failed" : job.status === "ready" ? "Ready — open" : steps[active]}
            </span>
            <span className="mt-2 flex gap-1" aria-hidden>
              {steps.map((step, index) => (
                <span
                  key={step}
                  className={`h-1 flex-1 rounded-full ${
                    job.status === "failed"
                      ? "bg-red-400/70"
                      : index <= active
                        ? "bg-brand"
                        : "bg-msl-border"
                  }`}
                />
              ))}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}

function JobWindow({ job, onClose }) {
  if (job.status === "failed") {
    return <p className="text-sm text-msl-muted">{job.error || "Generation failed."}</p>;
  }
  if (job.status !== "ready") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="relative grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
          <span className="absolute inset-0 rounded-full border-2 border-brand/25 border-t-brand animate-spin" />
          <Sparkles className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-semibold text-msl-text">{KIND_LABEL[job.kind] || "AI"}</p>
        <LivePhrase kind={job.kind} className="text-sm text-msl-muted" />
      </div>
    );
  }
  if (job.kind === "summarize") return <AiHtmlContent content={job.summary || ""} />;
  if (job.kind === "generate-flashcards") {
    return (
      <FlashcardPlayer
        deck={{ title: job.label, flashcardItems: job.flashcards || [] }}
        ephemeral
        embedded
        onBack={onClose}
      />
    );
  }
  return (
    <div className="flex h-full min-h-0 flex-col p-4 sm:p-6">
      <QuizPlayer
        quiz={{
          title: job.label,
          quiz: (job.questions || []).map((question, index) => ({ ...question, _id: `ai-q-${index}` })),
        }}
        ephemeral
        embedded
        onBack={onClose}
      />
    </div>
  );
}
