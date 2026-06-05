import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2, Save, Target, Trophy } from "lucide-react";
import { useToast } from "@chakra-ui/react";
import { saveQuizProgress } from "../../Services/QuizApi";
import { getStoredUser } from "../../Services/session";
import { mediaUrl } from "../../Services/apiConfig";
import {
  capitalizeDifficulty,
  isTrueFalseQuestion,
  questionTypeLabel,
} from "../../utils/quizHelpers";
import GlassCard from "../UI/GlassCard";
import GradientButton from "../UI/GradientButton";
import SecondaryButton from "../UI/SecondaryButton";
import IndigoProgress from "../UI/IndigoProgress";
import StatusBadge from "../UI/StatusBadge";
import IconBox from "../UI/IconBox";
import ConfirmModal from "../UI/ConfirmModal";
import { DotsLoader } from "../UI/Skeleton";

function normalizeAnswer(entry) {
  return {
    ...entry,
    _id: entry._id ?? entry.question_id,
    question_id: entry.question_id ?? entry._id,
    student_response: entry.student_response,
    answer: entry.answer,
    title: entry.title,
    type: entry.type,
    difficulty: capitalizeDifficulty(entry.difficulty),
    objectives: entry.objectives,
    answer_notes: entry.answer_notes,
  };
}

function optionRevealClass({ option, selected, revealed, correctAnswer }) {
  if (!revealed) {
    return selected === option
      ? "border-brand bg-brand/10 ring-2 ring-brand/20"
      : "border-msl-border/50 bg-msl-surface hover:border-brand/30 hover:bg-brand/5";
  }
  if (option === correctAnswer) return "border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/25";
  if (option === selected) return "border-red-500/60 bg-red-500/10 ring-2 ring-red-500/20";
  return "border-msl-border/40 bg-msl-surface opacity-60";
}

function McqOptions({ options, selected, revealed, correctAnswer, onPick }) {
  return (
    <div className="mt-6 space-y-2">
      {options.map((option, i) => {
        const isSelected = selected === option;
        return (
          <button
            key={i}
            type="button"
            disabled={revealed}
            onClick={() => onPick(option)}
            className={`w-full flex items-center gap-3 text-left rounded-msl border px-4 py-3 text-sm transition-all duration-200 ${optionRevealClass({
              option,
              selected,
              revealed,
              correctAnswer,
            })} ${revealed && option === correctAnswer ? "animate-answer-reveal" : ""}`}
            style={revealed && option === correctAnswer ? { animationDelay: `${i * 60}ms` } : undefined}
          >
            <span
              className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                revealed && option === correctAnswer
                  ? "border-emerald-500 bg-emerald-500"
                  : revealed && isSelected
                    ? "border-red-500 bg-red-500"
                    : isSelected
                      ? "border-brand"
                      : "border-msl-border"
              }`}
            >
              {(isSelected || (revealed && option === correctAnswer)) ? (
                <span className="w-2 h-2 rounded-full bg-white" />
              ) : null}
            </span>
            <span className="text-msl-text">{option}</span>
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseOptions({ options, selected, revealed, correctAnswer, onPick }) {
  const tfOptions = options.length >= 2 ? options : ["True", "False"];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      {tfOptions.map((option) => {
        const isTrue = String(option).toLowerCase() === "true";
        const isSelected = selected === option;
        return (
          <button
            key={option}
            type="button"
            disabled={revealed}
            onClick={() => onPick(option)}
            className={`min-h-[100px] rounded-msl text-sm font-semibold flex flex-col items-center justify-center gap-2 border transition-all duration-200 ${optionRevealClass({
              option,
              selected,
              revealed,
              correctAnswer,
            })}`}
          >
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                isTrue ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
              }`}
            >
              {isTrue ? "✓" : "✕"}
            </span>
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function QuizPlayer({
  quiz,
  initialResponse,
  onBack,
  ephemeral = false,
  embedded = false,
  lessonTitle,
  onRegisterCloseHandler,
}) {
  const toast = useToast();
  const questions = useMemo(() => quiz?.quiz ?? [], [quiz]);
  const [phase, setPhase] = useState(embedded ? "playing" : "intro");
  const [index, setIndex] = useState(0);
  const [draftAnswers, setDraftAnswers] = useState({});
  const [answers, setAnswers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responseId, setResponseId] = useState(initialResponse?._id ?? null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [isRetake, setIsRetake] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!initialResponse || !questions.length) return;

    setResponseId(initialResponse._id);
    const restored = (initialResponse.quiz ?? []).map(normalizeAnswer);
    const isPartial = restored.length > 0 && restored.length < questions.length;
    const isComplete = restored.length >= questions.length;

    if (restored.length) {
      setAnswers(restored);
      setSavedCount(restored.length);
    }

    if (!embedded) return;

    if (isPartial) {
      const draft = {};
      restored.forEach((a, i) => {
        if (a.student_response != null) draft[i] = a.student_response;
      });
      setDraftAnswers(draft);
      setIndex(restored.length);
      setIsRetake(false);
      setRevealed(false);
    } else {
      setDraftAnswers({});
      setIndex(0);
      setIsRetake(isComplete);
      setRevealed(false);
    }
    setPhase("playing");
  }, [initialResponse, embedded, questions.length]);

  const current = questions[index];
  const isTrueFalse = isTrueFalseQuestion(current);
  const typeLabel = questionTypeLabel(current);
  const selected = draftAnswers[index] ?? null;

  const answeredInSession = Object.keys(draftAnswers).length;
  const hasUnsavedAnswers = answeredInSession > savedCount;

  const progressPct = questions.length
    ? Math.round(((index + 1) / questions.length) * 100)
    : 0;

  const score = useMemo(() => {
    let correct = 0;
    const finalAnswers = questions.map((q, i) => {
      const response = draftAnswers[i];
      const isCorrect = response === q.answer;
      if (isCorrect) correct += 1;
      return normalizeAnswer({
        ...q,
        question_id: q._id,
        student_response: response ?? "",
        answer: q.answer,
        difficulty: capitalizeDifficulty(q.difficulty),
      });
    });
    return { correct, total: questions.length, finalAnswers };
  }, [draftAnswers, questions]);

  const scorePct = questions.length
    ? Math.round((score.correct / questions.length) * 100)
    : 0;

  const answeredCount = parseInt(initialResponse?.total_response, 10) || savedCount;
  const totalCount =
    parseInt(initialResponse?.total_questions, 10) || questions.length;
  const hasPartialProgress =
    answeredCount > 0 && totalCount > 0 && answeredCount < totalCount;

  const persistProgress = async (nextAnswers) => {
    if (ephemeral) return null;
    const user = getStoredUser();
    if (!user?._id || !quiz?._id) return null;
    setSaving(true);
    try {
      const res = await saveQuizProgress(quiz, nextAnswers, user._id, responseId);
      if (res.status) {
        const savedId =
          res.response?.response?._id ?? responseId ?? initialResponse?._id;
        if (savedId) setResponseId(savedId);
        setSavedCount(nextAnswers.length);
        setAnswers(nextAnswers);
        return savedId;
      }
    } finally {
      setSaving(false);
    }
    return null;
  };

  const buildAnswersFromDraft = () =>
    questions
      .map((q, i) => {
        const response = draftAnswers[i];
        if (response == null || response === "") return null;
        return normalizeAnswer({
          ...q,
          question_id: q._id,
          student_response: response,
          answer: q.answer,
          difficulty: capitalizeDifficulty(q.difficulty),
        });
      })
      .filter(Boolean);

  const requestClose = useCallback(() => {
    if (phase === "results" || phase === "intro") {
      onBack?.();
      return;
    }
    if (hasUnsavedAnswers) {
      setShowCloseConfirm(true);
      return;
    }
    onBack?.();
  }, [phase, hasUnsavedAnswers, onBack]);

  useEffect(() => {
    onRegisterCloseHandler?.(requestClose);
    return () => onRegisterCloseHandler?.(null);
  }, [onRegisterCloseHandler, requestClose]);

  const startPractice = () => {
    if (hasPartialProgress && answers.length && answers.length < questions.length) {
      const draft = {};
      answers.forEach((a, i) => {
        if (a.student_response != null) draft[i] = a.student_response;
      });
      setDraftAnswers(draft);
      setIndex(answers.length);
      setIsRetake(false);
    } else {
      setIndex(0);
      setDraftAnswers({});
      setIsRetake(
        !!(initialResponse && answers.length >= questions.length && questions.length > 0)
      );
    }
    setRevealed(false);
    setPhase("playing");
  };

  const handleSaveForLater = async () => {
    const nextAnswers = buildAnswersFromDraft();
    if (!nextAnswers.length) return;
    await persistProgress(nextAnswers);
    toast({
      title: "Progress saved — continue from Practice",
      status: "success",
      duration: 3000,
    });
    setShowCloseConfirm(false);
    onBack?.();
  };

  const handleLeaveWithoutSaving = () => {
    setShowCloseConfirm(false);
    onBack?.();
  };

  const buildConfirmedAnswers = () => {
    const confirmed = [];
    for (let i = 0; i < questions.length; i++) {
      const response = draftAnswers[i];
      if (response == null || response === "") continue;
      const q = questions[i];
      confirmed.push(
        normalizeAnswer({
          ...q,
          question_id: q._id,
          student_response: response,
          answer: q.answer,
          difficulty: capitalizeDifficulty(q.difficulty),
        })
      );
    }
    return confirmed;
  };

  const checkAnswer = async () => {
    if (selected == null || selected === "" || revealed || !current) return;
    const confirmed = buildConfirmedAnswers();
    await persistProgress(confirmed);
    setAnswers(confirmed);
    setRevealed(true);
  };

  const goNext = async () => {
    if (!revealed) return;

    if (index >= questions.length - 1) {
      setSubmitting(true);
      const finalAnswers = buildConfirmedAnswers();
      await persistProgress(finalAnswers);
      setSubmitting(false);
      setPhase("results");
      return;
    }
    setIndex((i) => i + 1);
    setRevealed(false);
  };

  if (!questions.length) {
    return (
      <div className="text-center py-12">
        <p className="text-msl-muted text-sm">This quiz has no questions yet.</p>
        <SecondaryButton className="mt-4" onClick={onBack}>
          Go back
        </SecondaryButton>
      </div>
    );
  }

  if (phase === "intro") {
    const mcqCount = questions.filter((q) => !isTrueFalseQuestion(q)).length;
    const tfCount = questions.length - mcqCount;

    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard className="overflow-hidden">
          {quiz.thumbnail ? (
            <img src={mediaUrl(quiz.thumbnail)} alt="" className="w-full h-44 object-cover" />
          ) : (
            <div className="h-32 bg-gradient-cta opacity-90" />
          )}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-3">
              <IconBox>
                <Target className="w-5 h-5" strokeWidth={1.75} />
              </IconBox>
              <span className="text-xs text-msl-muted uppercase tracking-widest">Quiz</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-msl-text tracking-tight">
              {quiz.title}
            </h1>
            {quiz.description ? (
              <p className="mt-3 text-sm text-msl-muted">{quiz.description}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge status="neutral">{questions.length} questions</StatusBadge>
              {mcqCount > 0 ? <StatusBadge status="processing">{mcqCount} MCQ</StatusBadge> : null}
              {tfCount > 0 ? <StatusBadge status="processing">{tfCount} T/F</StatusBadge> : null}
              {hasPartialProgress ? (
                <StatusBadge status="pending">
                  In progress — {answeredCount}/{totalCount}
                </StatusBadge>
              ) : initialResponse && answeredCount >= totalCount ? (
                <StatusBadge status="completed">Previously completed</StatusBadge>
              ) : (
                <StatusBadge status="pending">Not started</StatusBadge>
              )}
            </div>
            <GradientButton className="w-full mt-8" onClick={startPractice}>
              {hasPartialProgress
                ? "Continue practice"
                : initialResponse && answeredCount >= totalCount
                  ? "Retake quiz"
                  : "Start practice"}
            </GradientButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard className="p-8 text-center animate-pop-in">
          <Trophy className="w-12 h-12 text-brand mx-auto" strokeWidth={1.5} />
          <p className="font-display text-3xl font-bold text-msl-text mt-4 tabular-nums tracking-tight">
            {scorePct}%
          </p>
          <p className="text-sm text-msl-muted mt-1">
            {score.correct} of {questions.length} correct
          </p>
          {ephemeral || isRetake ? (
            <p className="mt-3 text-sm text-msl-muted">
              Practice retake — not saved to your record
            </p>
          ) : (
            <p className="mt-3 text-sm text-brand font-medium">Progress saved</p>
          )}
          <GradientButton className="w-full mt-6" onClick={onBack}>
            Done
          </GradientButton>
        </GlassCard>
      </div>
    );
  }

  const options = current?.objectives ?? [];
  const progressLabel = lessonTitle
    ? `${lessonTitle} — ${quiz.title}`
    : quiz.title;
  const isLastQuestion = index >= questions.length - 1;
  const showRetakeBanner = ephemeral || isRetake;
  const isCorrect = revealed && selected === current?.answer;

  return (
    <div className="relative">
      {submitting ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-msl-bg/85 backdrop-blur-sm rounded-msl min-h-[320px]">
          <DotsLoader />
          <p className="mt-4 text-sm font-medium text-msl-text">Submitting your quiz…</p>
          <p className="text-xs text-msl-muted mt-1">This may take a few seconds</p>
        </div>
      ) : null}

      {showRetakeBanner ? (
        <div className="mb-4 rounded-msl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400">
          Practice retake — your score will not be saved or affect XP.
        </div>
      ) : null}

      <div className="mb-2 flex items-center justify-between gap-4 text-xs text-msl-muted">
        <span className="truncate">{progressLabel}</span>
        <span className="font-mono tabular-nums shrink-0">
          Question {index + 1} / {questions.length}
        </span>
      </div>
      <IndigoProgress value={progressPct} className="mb-5" />

      <div
        key={index}
        className="rounded-msl border border-msl-border/50 bg-msl-surface shadow-sm p-6 sm:p-8 animate-slide-in"
      >
        {!embedded ? (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <StatusBadge status="neutral">{typeLabel}</StatusBadge>
          </div>
        ) : null}

        <h2 className="font-display text-base font-semibold text-msl-text leading-relaxed">
          {current?.title}
        </h2>
        {current?.description ? (
          <p className="mt-2 text-sm text-msl-muted">{current.description}</p>
        ) : null}

        {isTrueFalse ? (
          <TrueFalseOptions
            options={options}
            selected={selected}
            revealed={revealed}
            correctAnswer={current?.answer}
            onPick={(val) => setDraftAnswers((d) => ({ ...d, [index]: val }))}
          />
        ) : options.length ? (
          <McqOptions
            options={options}
            selected={selected}
            revealed={revealed}
            correctAnswer={current?.answer}
            onPick={(val) => setDraftAnswers((d) => ({ ...d, [index]: val }))}
          />
        ) : (
          <input
            type="text"
            value={selected ?? ""}
            disabled={revealed}
            onChange={(e) => setDraftAnswers((d) => ({ ...d, [index]: e.target.value }))}
            placeholder="Your answer"
            className="mt-6 w-full rounded-msl border border-msl-border/50 bg-msl-surface px-4 py-2.5 text-sm text-msl-text placeholder:text-msl-muted focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-70"
          />
        )}

        {revealed ? (
          <div
            className={`mt-6 p-4 rounded-msl text-sm animate-answer-reveal ${
              isCorrect
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                : "bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300"
            }`}
          >
            <p className="font-semibold">{isCorrect ? "Correct!" : "Not quite"}</p>
            {!isCorrect && current?.answer ? (
              <p className="mt-1.5">
                Correct answer: <strong>{current.answer}</strong>
              </p>
            ) : null}
            {current?.answer_notes ? (
              <p className="mt-2 opacity-90 leading-relaxed">{current.answer_notes}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={requestClose}
          className="text-sm text-msl-muted hover:text-msl-text transition-colors"
        >
          Close quiz
        </button>
        <div className="flex gap-2">
          {!ephemeral && !showRetakeBanner ? (
            <SecondaryButton
              disabled={!answeredInSession || saving || submitting}
              onClick={handleSaveForLater}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" strokeWidth={1.75} />
                  Save &amp; continue later
                </>
              )}
            </SecondaryButton>
          ) : null}
          {!revealed ? (
            <GradientButton
              className="!px-4 !py-2"
              disabled={selected == null || selected === "" || saving || submitting}
              loading={saving}
              onClick={checkAnswer}
            >
              Check answer
            </GradientButton>
          ) : (
            <GradientButton
              className="!px-4 !py-2"
              disabled={saving || submitting}
              loading={submitting}
              onClick={goNext}
            >
              {isLastQuestion ? "See results" : "Next"}
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </GradientButton>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        title="Leave quiz?"
        zIndex={1300}
        actions={[
          {
            label: "Save for later",
            loadingLabel: "Saving…",
            variant: "primary",
            onClick: handleSaveForLater,
            disabled: saving,
            loading: saving,
          },
          {
            label: "Continue quiz",
            variant: "neutral",
            onClick: () => setShowCloseConfirm(false),
            disabled: saving,
          },
          {
            label: "Leave without saving",
            variant: "destructive",
            onClick: handleLeaveWithoutSaving,
            disabled: saving,
          },
        ]}
      >
        You have unsaved answers. Save your progress to continue later, or leave without saving.
      </ConfirmModal>
    </div>
  );
}
