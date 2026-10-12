import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@chakra-ui/react";
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Square,
  Volume2,
  X,
} from "lucide-react";
import AiHtmlContent from "../MslAi/AiHtmlContent";
import { Skeleton } from "../UI/Skeleton";
import { voiceToText } from "../../Services/GeminiApi";
import { plainTextFromHtml } from "../../utils/aiHtmlContent";
import { sourceLabel } from "../../utils/pastQuestionGroups";

const SUGGESTIONS_PAPER = [
  "What are the main topics in this sitting?",
  "How should I approach this paper under exam conditions?",
  "Summarize the hardest questions here",
];

const SUGGESTIONS_QUESTION = [
  "Explain this step by step",
  "What marking points should I include?",
  "Show a worked example approach",
];

function UserBubble({ text }) {
  return (
    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand text-white px-4 py-2.5 text-sm">
      <p className="whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function speakPlainText(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export default function PastQuestionChatModal({
  isOpen,
  onClose,
  paper,
  scope,
  onScopeChange,
  questionId,
  onQuestionIdChange,
  messages,
  input,
  onInputChange,
  onSend,
  busy,
  onClearQuestionContext,
  contextQuestions = [],
}) {
  const toast = useToast();
  const bottomRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [audioMode, setAudioMode] = useState(false);
  const [recording, setRecording] = useState(false);

  const questionCatalog = useMemo(() => {
    const map = new Map();
    for (const q of paper?.questions || []) map.set(String(q._id), q);
    for (const q of contextQuestions) map.set(String(q._id), q);
    return map;
  }, [paper?.questions, contextQuestions]);

  const questions = paper?.questions || [];
  const selectedQuestion = questionId ? questionCatalog.get(String(questionId)) : null;

  const scopeLabel =
    scope === "question" && selectedQuestion
      ? `Question ${selectedQuestion.number || ""}`.trim()
      : scope === "course"
        ? "Whole course (all sittings)"
        : "This paper";

  const suggestions =
    scope === "question" && questionId ? SUGGESTIONS_QUESTION : SUGGESTIONS_PAPER;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis?.cancel();
      setRecording(false);
      recorderRef.current?.stop();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && questionId && scope !== "question") {
      onScopeChange("question");
    }
  }, [isOpen, questionId, scope, onScopeChange]);

  const handleClose = () => {
    window.speechSynthesis?.cancel();
    recorderRef.current?.stop();
    setRecording(false);
    onClose();
  };

  const submitQuestion = async (questionText) => {
    const q = String(questionText || input || "").trim();
    if (!q || busy || !paper) return;
    if (scope === "question" && !questionId) {
      toast({
        title: "Choose a question for question-scoped chat",
        status: "warning",
        duration: 3500,
      });
      return;
    }
    const answer = await onSend(q, { useAudio: audioMode });
    if (audioMode && answer) {
      const plain = plainTextFromHtml(answer).replace(/\s+/g, " ").trim();
      if (plain) speakPlainText(plain.slice(0, 8000));
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    submitQuestion(input);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const res = await voiceToText(blob);
        if (res.status && res.transcript) {
          if (audioMode) {
            await submitQuestion(res.transcript);
          } else {
            onInputChange(res.transcript);
          }
        } else {
          toast({ title: res.message || "Could not transcribe", status: "warning" });
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast({ title: "Microphone access denied", status: "error" });
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-msl-bg/85"
        onClick={handleClose}
        aria-label="Close past question chat"
      />
      <div
        className="relative w-full max-w-4xl h-[min(720px,calc(100vh-1.5rem))] flex overflow-hidden rounded-msl border border-msl-border bg-msl-surface shadow-glow-indigo animate-pop-in"
        role="dialog"
        aria-modal="true"
        aria-label="Past question chat"
      >
        <aside className="w-[260px] shrink-0 flex flex-col border-r border-msl-border bg-msl-surface min-h-0 hidden sm:flex">
          <div className="px-4 py-3 border-b border-msl-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand shrink-0" strokeWidth={1.75} />
              <h2 className="font-display text-sm font-semibold text-msl-text">Context</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {paper ? (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-msl-muted">
                    Paper
                  </p>
                  <p className="font-medium text-msl-text mt-1 line-clamp-3">{paper.title}</p>
                  <p className="text-xs text-msl-muted mt-1">
                    {[paper.sitting, paper.year, paper.level, paper.paperCode]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-msl-muted uppercase tracking-wide">
                    Chat scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => onScopeChange(e.target.value)}
                    className="w-full text-xs rounded-lg border border-msl-border bg-msl-bg/50 px-2 py-2 text-msl-text focus:outline-none focus:border-brand/40"
                  >
                    <option value="paper">This paper</option>
                    <option value="course">Course (all sittings)</option>
                    <option value="question">One question</option>
                  </select>
                  {scope === "question" ? (
                    <select
                      value={questionId}
                      onChange={(e) => onQuestionIdChange(e.target.value)}
                      className="w-full text-xs rounded-lg border border-msl-border bg-msl-bg/50 px-2 py-2 text-msl-text focus:outline-none focus:border-brand/40"
                    >
                      <option value="">Select question</option>
                      {questions.map((item) => (
                        <option key={item._id} value={item._id}>
                          Q{item.number || item.order || ""}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
                {scope === "question" && questionId && selectedQuestion ? (
                  <div className="rounded-xl border border-brand/25 bg-brand/5 px-3 py-2 max-h-48 overflow-y-auto">
                    <p className="text-[11px] font-semibold text-brand">
                      Q{selectedQuestion.number || ""}
                      {selectedQuestion.paperId &&
                      paper?._id &&
                      String(selectedQuestion.paperId) !== String(paper._id) ? (
                        <span className="font-normal text-msl-muted">
                          {" "}
                          · {sourceLabel(selectedQuestion)}
                        </span>
                      ) : null}
                    </p>
                    <div className="text-[11px] text-msl-muted mt-1 line-clamp-6">
                      <AiHtmlContent content={selectedQuestion.question} />
                    </div>
                    <button
                      type="button"
                      onClick={onClearQuestionContext}
                      className="mt-2 text-[11px] text-brand hover:underline"
                    >
                      Clear question context
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-xs text-msl-muted">Open a sitting first.</p>
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 bg-msl-bg/30">
          <header className="shrink-0 px-5 py-4 border-b border-msl-border bg-msl-surface flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-semibold text-msl-text truncate">
                Past question chat
              </h3>
              <p className="text-sm text-msl-muted mt-0.5 truncate sm:hidden">{scopeLabel}</p>
              <p className="text-sm text-msl-muted mt-0.5 hidden sm:block">
                MSL AI · {scopeLabel}
              </p>
              <div className="flex flex-wrap gap-2 mt-2 sm:hidden">
                <select
                  value={scope}
                  onChange={(e) => onScopeChange(e.target.value)}
                  className="text-xs rounded-lg border border-msl-border bg-msl-bg/50 px-2 py-1.5"
                >
                  <option value="paper">This paper</option>
                  <option value="course">Course</option>
                  <option value="question">One question</option>
                </select>
                {scope === "question" ? (
                  <select
                    value={questionId}
                    onChange={(e) => onQuestionIdChange(e.target.value)}
                    className="text-xs rounded-lg border border-msl-border bg-msl-bg/50 px-2 py-1.5"
                  >
                    <option value="">Question</option>
                    {questions.map((item) => (
                      <option key={item._id} value={item._id}>
                        Q{item.number || ""}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setAudioMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  audioMode
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-msl-border text-msl-muted hover:text-msl-text"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                Audio replies
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-msl text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
            {!paper ? (
              <p className="text-sm text-msl-muted text-center py-12">Open a sitting to chat.</p>
            ) : !messages.length ? (
              <div className="flex flex-col items-center justify-center text-center h-full min-h-[240px] px-4">
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-5">
                  <MessageSquare className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-semibold text-msl-text">
                  Ask about this source
                </h3>
                <p className="text-sm text-msl-muted mt-2 max-w-md">
                  {audioMode
                    ? "Speak or type — answers can be read aloud when audio replies are on."
                    : "Pick a prompt or type your question. Use scope on the left for paper, course, or one question."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full max-w-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy}
                      onClick={() => submitQuestion(s)}
                      className="rounded-xl border border-msl-border bg-msl-surface px-4 py-3 text-sm text-msl-text text-left hover:border-brand/30 hover:bg-msl-accent/50 transition-colors disabled:opacity-40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5 max-w-3xl mx-auto">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "user" ? (
                      <UserBubble text={msg.text} />
                    ) : (
                      <div className="max-w-full w-full text-sm text-msl-text leading-relaxed">
                        <AiHtmlContent content={msg.html || msg.text} />
                      </div>
                    )}
                  </div>
                ))}
                {busy ? (
                  <div className="space-y-2 max-w-xs">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="shrink-0 px-5 pb-4 pt-2 border-t border-msl-border bg-msl-surface">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 rounded-2xl border border-msl-border bg-msl-bg/40 px-2 py-2 focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/15">
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={busy || !paper}
                  className={`p-2 rounded-xl transition-colors shrink-0 disabled:opacity-40 ${
                    recording
                      ? "text-red-500 bg-red-500/10"
                      : "text-msl-muted hover:text-msl-text hover:bg-brand/10"
                  }`}
                  aria-label={audioMode ? "Speak to send" : "Voice input"}
                >
                  {recording ? (
                    <MicOff className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <Mic className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </button>
                <textarea
                  rows={1}
                  placeholder={
                    !paper
                      ? "Open a source first"
                      : audioMode
                        ? "Type or tap mic to speak…"
                        : "Message MSL AI…"
                  }
                  value={input}
                  disabled={!paper || busy}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !busy) handleSubmit(e);
                    }
                  }}
                  className="flex-1 resize-none bg-transparent text-sm text-msl-text placeholder:text-msl-muted focus:outline-none max-h-32 py-2 min-w-0 disabled:opacity-50"
                />
                {busy ? (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="p-2.5 rounded-full bg-msl-surface border border-msl-border text-msl-muted hover:text-msl-text shrink-0"
                    aria-label="Stop audio"
                  >
                    <Square className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!paper || !input.trim() || busy}
                    onClick={() => handleSubmit()}
                    className="p-2.5 rounded-full bg-brand text-white disabled:opacity-40 hover:brightness-110 transition-all shrink-0"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-msl-muted text-center mt-2">
                Enter to send · Shift+Enter for new line
                {audioMode ? " · Mic transcribes and sends with spoken reply" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
