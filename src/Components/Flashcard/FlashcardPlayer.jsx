import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Check,
  Layers,
  Loader2,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import {
  flashcardComplete,
  flashcardLeaderboard,
  flashcardProgress,
} from "../../Services/FlashcardApi";
import { mediaUrl } from "../../Services/apiConfig";
import GlassCard from "../UI/GlassCard";
import GradientButton from "../UI/GradientButton";
import SecondaryButton from "../UI/SecondaryButton";
import StatusBadge from "../UI/StatusBadge";
import LoadingOverlay from "../UI/LoadingOverlay";
import IconBox from "../UI/IconBox";
import {
  clearFlashcardResume,
  loadFlashcardResume,
  saveFlashcardResume,
} from "../../utils/flashcardResume";

function cardFront(item) {
  return item?.term ?? item?.question ?? item?.front ?? "—";
}

function cardBack(item) {
  return item?.definition ?? item?.answer ?? item?.back ?? "—";
}

export default function FlashcardPlayer({
  deck,
  onBack,
  ephemeral = false,
  embedded = false,
}) {
  const items = useMemo(() => deck?.flashcardItems ?? [], [deck]);
  const initialResume = useMemo(
    () => loadFlashcardResume(deck?._id, items.length, deck?.progress),
    [deck?._id, items.length, deck?.progress]
  );
  const hasResume = deck?.progress > 0 && deck?.progress < 100;

  const [phase, setPhase] = useState(embedded ? "study" : "intro");
  const [queue, setQueue] = useState(() => items.map((_, i) => i));
  const [queueIndex, setQueueIndex] = useState(() =>
    embedded ? initialResume.queueIndex : 0
  );
  const [flipped, setFlipped] = useState(() =>
    embedded ? initialResume.flipped : false
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [stats, setStats] = useState({ gotIt: 0, needsWork: 0 });

  useEffect(() => {
    if (!embedded || !items.length) return;
    const resume = loadFlashcardResume(deck?._id, items.length, deck?.progress);
    setQueue(items.map((_, i) => i));
    setQueueIndex(resume.queueIndex);
    setFlipped(resume.flipped);
    setPhase("study");
  }, [embedded, items.length, deck?._id, deck?.progress]);

  const progressPct = queue.length
    ? Math.round((queueIndex / queue.length) * 100)
    : 0;

  useEffect(() => {
    if (ephemeral || !deck?._id) return;
    setLoadingBoard(true);
    flashcardLeaderboard(deck._id)
      .then((res) => {
        if (res.status) setLeaderboard(res.response);
      })
      .finally(() => setLoadingBoard(false));
  }, [deck?._id, ephemeral]);

  const saveProgress = async (pct) => {
    if (ephemeral || !deck?._id) return;
    setSavingProgress(true);
    try {
      await flashcardProgress(deck._id, pct);
    } finally {
      setSavingProgress(false);
    }
  };

  const flipCard = () => {
    if (isAnimating || savingProgress) return;
    setIsAnimating(true);
    setFlipped((f) => {
      const next = !f;
      if (deck?._id) saveFlashcardResume(deck._id, queueIndex, next);
      return next;
    });
    setTimeout(() => setIsAnimating(false), 560);
  };

  const flipToFront = () => {
    if (!flipped || isAnimating || savingProgress) return;
    setIsAnimating(true);
    setFlipped(false);
    if (deck?._id) saveFlashcardResume(deck._id, queueIndex, false);
    setTimeout(() => setIsAnimating(false), 560);
  };

  const startStudy = () => {
    const resume = loadFlashcardResume(deck?._id, items.length, deck?.progress);
    setQueue(items.map((_, i) => i));
    setQueueIndex(resume.queueIndex);
    setFlipped(resume.flipped);
    setStats({ gotIt: 0, needsWork: 0 });
    setPhase("study");
  };

  const finishDeck = async () => {
    if (ephemeral || !deck?._id) {
      setPhase("done");
      return;
    }
    setSavingProgress(true);
    try {
      await flashcardProgress(deck._id, 100);
    } finally {
      setSavingProgress(false);
    }
    setCompleting(true);
    const res = await flashcardComplete(deck._id);
    setCompleting(false);
    if (res.status) {
      clearFlashcardResume(deck._id);
      const boardRes = await flashcardLeaderboard(deck._id);
      if (boardRes.status) setLeaderboard(boardRes.response);
      setPhase("done");
    }
  };

  const advanceCard = async (rating) => {
    if (savingProgress || completing) return;

    const nextStats = { ...stats };
    if (rating === "got_it") nextStats.gotIt += 1;
    if (rating === "needs_work") nextStats.needsWork += 1;
    setStats(nextStats);

    const isLast = queueIndex >= queue.length - 1;
    const pct = isLast ? 100 : Math.round(((queueIndex + 1) / queue.length) * 100);
    await saveProgress(pct);

    if (rating === "needs_work") {
      setQueue((prev) => [...prev, prev[queueIndex]]);
    }

    if (isLast) {
      await finishDeck();
      return;
    }

    const nextIndex = queueIndex + 1;
    setQueueIndex(nextIndex);
    setFlipped(false);
    if (deck?._id) saveFlashcardResume(deck._id, nextIndex, false);
  };

  const busy = savingProgress || completing;

  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto h-fit">
        {!ephemeral ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-msl-muted hover:text-msl-text mb-4"
          >
            ← Back to decks
          </button>
        ) : null}
        <GlassCard className="p-8">
          {deck.thumbnail ? (
            <img
              src={mediaUrl(deck.thumbnail)}
              alt=""
              className="h-40 w-full object-cover rounded-msl mb-4"
            />
          ) : null}
          <div className="flex items-center gap-2 mb-2">
            <IconBox>
              <Layers className="w-5 h-5" strokeWidth={1.75} />
            </IconBox>
            <span className="text-xs text-msl-muted uppercase tracking-widest">Flashcards</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-msl-text">{deck.title}</h1>
          {deck.description ? (
            <p className="text-sm text-msl-muted mt-2">{deck.description}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 mt-4">
            <StatusBadge status="neutral">{items.length} cards</StatusBadge>
            {hasResume ? (
              <StatusBadge status="pending">In progress — {deck.progress}%</StatusBadge>
            ) : deck.progress >= 100 || deck.completionCount > 0 ? (
              <StatusBadge status="completed">Completed</StatusBadge>
            ) : null}
          </div>
          <div className="flex gap-3 mt-8">
            <GradientButton onClick={startStudy} disabled={!items.length}>
              <Play className="w-4 h-4" strokeWidth={2} />
              {hasResume ? "Continue review" : "Start review"}
            </GradientButton>
            {!ephemeral ? (
              <SecondaryButton onClick={() => setShowBoard((v) => !v)}>
                {showBoard ? "Hide" : "View"} leaderboard
              </SecondaryButton>
            ) : null}
          </div>
        </GlassCard>
        {showBoard ? (
          <LeaderboardList entries={leaderboard} loading={loadingBoard} className="mt-6" />
        ) : null}
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard className="p-8 text-center animate-pop-in">
          <IconBox className="!w-14 !h-14 mx-auto mb-4">
            <Brain className="w-7 h-7" strokeWidth={1.5} />
          </IconBox>
          <h2 className="font-display text-lg font-semibold text-msl-text">Session complete</h2>
          <p className="text-sm text-msl-muted mt-2">
            Reviewed {queue.length} cards · Got it {stats.gotIt} · Needs work {stats.needsWork}
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <GradientButton onClick={onBack}>Done</GradientButton>
            <SecondaryButton
              onClick={() => {
                setPhase("intro");
                setQueueIndex(0);
                setFlipped(false);
              }}
            >
              Study again
            </SecondaryButton>
          </div>
        </GlassCard>
        <LeaderboardList entries={leaderboard} loading={loadingBoard} className="mt-8" />
      </div>
    );
  }

  const item = items[queue[queueIndex]];
  if (!item) {
    return (
      <div>
        <p className="text-sm text-msl-muted">No cards available in this deck.</p>
      </div>
    );
  }

  return (
    <div className={`relative ${embedded ? "flex flex-col min-h-[460px]" : "h-fit"}`}>
      {completing ? <LoadingOverlay message="Saving your review…" /> : null}

      <div className="flex items-center justify-between text-xs text-msl-muted mb-4 shrink-0">
        <span>
          Card {queueIndex + 1} of {queue.length}
        </span>
        <span className="font-mono tabular-nums flex items-center gap-2">
          {savingProgress ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-brand" />
              Saving…
            </>
          ) : (
            <>{progressPct}% through deck</>
          )}
        </span>
      </div>

      <div className={`flash-card-scene w-full ${embedded ? "flex-1 min-h-0" : ""}`}>
        <div
          className={`flip-card-inner w-full ${embedded ? "min-h-[340px]" : "min-h-[280px]"} ${flipped ? "is-flipped" : ""}`}
          onClick={() => {
            if (!flipped && !busy) flipCard();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!flipped && !busy) flipCard();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={flipped ? "Answer side" : "Question side — tap to reveal"}
        >
          <div className="flip-card-face flip-card-front flex flex-col items-center justify-center">
            {item?.termImage ? (
              <img
                src={mediaUrl(item.termImage)}
                alt=""
                className="mx-auto max-h-24 mb-4 rounded-msl"
              />
            ) : null}
            <p className="font-display text-base sm:text-lg font-medium text-msl-text leading-relaxed max-w-lg">
              {cardFront(item)}
            </p>
            <p className="text-xs text-msl-muted mt-6">Tap card to reveal answer</p>
          </div>
          <div className="flip-card-face flip-card-back flex flex-col items-center justify-center">
            {item?.definitionImage ? (
              <img
                src={mediaUrl(item.definitionImage)}
                alt=""
                className="mx-auto max-h-24 mb-4 rounded-msl"
              />
            ) : null}
            <p className="text-base text-msl-text leading-relaxed max-w-lg">{cardBack(item)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-6 justify-center shrink-0">
        {flipped ? (
          <>
            <SecondaryButton
              className="flex-1 sm:flex-none sm:min-w-[140px] border-red-500/40 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
              onClick={() => advanceCard("needs_work")}
              disabled={busy}
            >
              {savingProgress ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" strokeWidth={2} />
              )}
              Needs work
            </SecondaryButton>
            <SecondaryButton
              className="flex-1 sm:flex-none sm:min-w-[140px]"
              onClick={flipToFront}
              disabled={busy}
            >
              <RotateCcw className="w-4 h-4" strokeWidth={2} />
              Flip back
            </SecondaryButton>
            <GradientButton
              className="flex-1 sm:flex-none sm:min-w-[140px]"
              onClick={() => advanceCard("got_it")}
              loading={savingProgress}
              disabled={busy}
            >
              <Check className="w-4 h-4" strokeWidth={2} />
              Got it
            </GradientButton>
          </>
        ) : (
          <GradientButton
            className="w-full sm:w-auto sm:min-w-[200px] mx-auto"
            onClick={flipCard}
            disabled={busy}
          >
            Show answer
          </GradientButton>
        )}
      </div>

      {!embedded && showBoard ? (
        <LeaderboardList entries={leaderboard} loading={loadingBoard} className="mt-8" />
      ) : null}
    </div>
  );
}

function LeaderboardList({ entries, loading, className = "" }) {
  return (
    <GlassCard className={`p-5 ${className}`}>
      <h3 className="font-display font-semibold text-msl-text mb-4">Leaderboard</h3>
      {loading ? (
        <Loader2 className="w-5 h-5 text-brand animate-spin" />
      ) : entries.length ? (
        <ol className="space-y-3">
          {entries.map((entry, i) => {
            const name = [entry.student?.firstname, entry.student?.lastname]
              .filter(Boolean)
              .join(" ");
            return (
              <li key={entry.student?._id ?? i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-3">
                  <span className="w-6 font-mono text-msl-muted tabular-nums">{i + 1}</span>
                  {entry.student?.image ? (
                    <img
                      src={mediaUrl(entry.student.image)}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center text-xs text-brand">
                      {name?.[0] ?? "?"}
                    </span>
                  )}
                  <span className="font-medium text-msl-text">
                    {name || entry.student?.email || "Student"}
                  </span>
                </span>
                <StatusBadge status="completed">{entry.completionCount}×</StatusBadge>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-msl-muted">No completions yet.</p>
      )}
    </GlassCard>
  );
}
