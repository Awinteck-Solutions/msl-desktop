import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@chakra-ui/react";
import {
  ImagePlus,
  MessageSquare,
  Mic,
  MicOff,
  Search,
  Send,
  Sparkles,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { useMslAi } from "../../../Context/MslAiContext";
import { userCourseList } from "../../../Services/CourseApi";
import {
  buildScopePayload,
  getChatHistory,
  queryImage,
  streamContextAudioChat,
  streamContextChat,
  voiceToText,
} from "../../../Services/GeminiApi";
import AiHtmlContent from "../AiHtmlContent";
import {
  mslAiAssistantBubbleClass,
  mslAiComposerClass,
  mslAiComposerFieldClass,
  mslAiSendButtonClass,
  mslAiUserBubbleClass,
} from "../MslAiChatUi";
import { plainTextFromHtml } from "../../../utils/aiHtmlContent";
import { createSequentialAudioPlayer } from "../../../utils/sequentialAudioPlayer";
import { ChatSkeleton, Skeleton } from "../../UI/Skeleton";

const GENERAL_CHAT_ID = "__general__";

const SUGGESTIONS = [
  "Explain this topic in simple terms",
  "What are the key ideas I should remember?",
  "Give me practice questions",
  "Summarize what I need to know for a test",
];

function formatRelativeTime(value) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function previewText(text, max = 56) {
  const plain = plainTextFromHtml(String(text || "")).replace(/\s+/g, " ").trim();
  if (!plain) return "No messages yet";
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

function historyItemToMessages(item) {
  const userMsg = { role: "user", text: item.question || "" };
  const meta = item.metadata;
  if (meta?.imageBase64) {
    userMsg.imageUrl = `data:${meta.imageMimeType || "image/jpeg"};base64,${meta.imageBase64}`;
  }
  return [userMsg, { role: "assistant", text: item.answer || "" }];
}

function UserMessage({ msg }) {
  return (
    <div className={mslAiUserBubbleClass}>
      {msg.imageUrl ? (
        <img
          src={msg.imageUrl}
          alt="Attached"
          className="rounded-lg max-w-full max-h-48 object-cover mb-2 border border-white/20"
        />
      ) : null}
      {msg.text ? <p className="whitespace-pre-wrap">{msg.text}</p> : null}
    </div>
  );
}

export default function AiChatPanel({ isOpen, onClose }) {
  const toast = useToast();
  const { scope, setAiScope, clearAiScope } = useMslAi();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedChatId, setSelectedChatId] = useState(GENERAL_CHAT_ID);
  const [coursePreviews, setCoursePreviews] = useState({});
  const [generalPreview, setGeneralPreview] = useState({ preview: null, at: null });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioMode, setAudioMode] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  if (!audioPlayerRef.current) {
    audioPlayerRef.current = createSequentialAudioPlayer();
  }

  const isGeneral = selectedChatId === GENERAL_CHAT_ID;

  const selectedCourse = useMemo(
    () =>
      isGeneral
        ? null
        : courses.find((c) => String(c._id) === String(selectedChatId)) || null,
    [courses, selectedChatId, isGeneral]
  );

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => String(c.title || "").toLowerCase().includes(q));
  }, [courses, courseSearch]);

  const scopePayload = isGeneral
    ? {}
    : buildScopePayload({
        courseId: selectedChatId,
        lessonId: null,
        s3Keys: [],
      });

  const chatTitle = isGeneral
    ? "General chat"
    : selectedCourse?.title || "Select a course";

  const canSend = Boolean(input.trim() || pendingImage);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingCourses(true);
    userCourseList()
      .then((res) => {
        const list = res?.response || [];
        setCourses(list);
        const routeId = scope.courseId ? String(scope.courseId) : null;
        if (routeId && list.some((c) => String(c._id) === routeId)) {
          setSelectedChatId(routeId);
        } else {
          setSelectedChatId(GENERAL_CHAT_ID);
        }
      })
      .finally(() => setLoadingCourses(false));
  }, [isOpen, scope.courseId]);

  useEffect(() => {
    if (!isOpen) {
      setCourseSearch("");
      setMessages([]);
      setInput("");
      setPendingImage(null);
      setSelectedChatId(GENERAL_CHAT_ID);
      abortRef.current?.abort();
      audioPlayerRef.current?.stop();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    };
  }, [pendingImage]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    getChatHistory({ page: 1, limit: 1 })
      .then((res) => {
        if (cancelled) return;
        const item = res.status ? res.response?.response?.[0] : null;
        setGeneralPreview({
          preview: item?.question || item?.answer || null,
          at: item?.createdAt || null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !courses.length) return;
    let cancelled = false;
    Promise.all(
      courses.map(async (course) => {
        const id = String(course._id);
        try {
          const res = await getChatHistory({ courseId: id, page: 1, limit: 1 });
          const item = res.status ? res.response?.response?.[0] : null;
          return {
            id,
            preview: item?.question || item?.answer || null,
            at: item?.createdAt || null,
          };
        } catch {
          return { id, preview: null, at: null };
        }
      })
    ).then((rows) => {
      if (cancelled) return;
      const next = {};
      rows.forEach((row) => {
        next[row.id] = { preview: row.preview, at: row.at };
      });
      setCoursePreviews(next);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, courses]);

  useEffect(() => {
    if (!isOpen || !selectedChatId) return;
    setLoadingHistory(true);
    const params = isGeneral
      ? { page: 1, limit: 30 }
      : { courseId: selectedChatId, page: 1, limit: 30 };
    getChatHistory(params)
      .then((res) => {
        if (res.status) {
          const items = (res.response?.response || []).reverse();
          setMessages(items.flatMap(historyItemToMessages));
        } else {
          setMessages([]);
        }
      })
      .finally(() => setLoadingHistory(false));
  }, [isOpen, selectedChatId, isGeneral]);

  useEffect(() => {
    if (isGeneral) {
      clearAiScope();
    } else if (selectedChatId) {
      setAiScope({
        courseId: selectedChatId,
        lessonId: null,
        s3Keys: [],
        label: selectedCourse?.title || "Course",
        source: "page",
        resourceType: null,
      });
    }
  }, [selectedChatId, isGeneral, selectedCourse?.title, setAiScope, clearAiScope]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pendingImage]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleClose = () => {
    abortRef.current?.abort();
    audioPlayerRef.current?.stop();
    onClose();
  };

  const selectChat = (chatId) => {
    if (String(chatId) === String(selectedChatId)) return;
    abortRef.current?.abort();
    audioPlayerRef.current?.stop();
    setLoading(false);
    setMessages([]);
    setSelectedChatId(String(chatId));
  };

  const updatePreview = (text) => {
    const now = new Date().toISOString();
    if (isGeneral) {
      setGeneralPreview({ preview: text, at: now });
    } else {
      setCoursePreviews((prev) => ({
        ...prev,
        [selectedChatId]: { preview: text, at: now },
      }));
    }
  };

  const clearPendingImage = () => {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  const sendMessage = async (question, { useAudio = false } = {}) => {
    const q = String(question || "").trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    updatePreview(q);

    const controller = new AbortController();
    abortRef.current = controller;
    audioPlayerRef.current?.reset();
    const payload = { question: q, ...scopePayload };
    let assistantText = "";

    const setAssistantText = (text, streaming = true) => {
      assistantText = text;
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          copy[copy.length - 1] = { role: "assistant", text: assistantText, streaming };
          return copy;
        }
        return [...copy, { role: "assistant", text: assistantText, streaming }];
      });
    };

    const appendAssistant = (chunk) => {
      setAssistantText(assistantText + chunk, true);
    };

    try {
      if (useAudio) {
        await streamContextAudioChat({
          payload,
          signal: controller.signal,
          onText: (data) => {
            if (data?.finished) {
              if (data.text) setAssistantText(data.text, true);
              return;
            }
            if (data?.text) appendAssistant(data.text);
          },
          onAudio: (data) => {
            if (data?.audio) {
              audioPlayerRef.current?.enqueue({
                chunkIndex: data.chunkIndex ?? 0,
                audio: data.audio,
                mimeType: data.mimeType,
                isFinal: data.isFinal,
              });
            }
          },
          onError: (err) => {
            toast({ title: err?.message || "Audio stream error", status: "error" });
          },
        });
      } else {
        await streamContextChat({
          payload,
          signal: controller.signal,
          onChunk: appendAssistant,
        });
      }
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.streaming) {
          copy[copy.length - 1] = { role: "assistant", text: last.text };
        }
        return copy;
      });
    } catch (err) {
      if (!controller.signal.aborted) {
        toast({
          title: err.message || "Chat failed",
          status: "error",
          duration: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const sendImageMessage = async () => {
    if (!pendingImage || loading) return;
    const question = input.trim() || "What is in this image?";
    const previewUrl = pendingImage.previewUrl;
    const imageFile = pendingImage.file;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: question, imageUrl: previewUrl },
    ]);
    setInput("");
    clearPendingImage();
    setLoading(true);
    updatePreview(question);

    const res = await queryImage({
      imageFile,
      question,
      scope: scopePayload,
    });
    setLoading(false);
    if (res.status) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.response?.response?.answer || "No answer" },
      ]);
    } else {
      toast({ title: res.message || "Image query failed", status: "error" });
    }
  };

  const handleSubmit = () => {
    if (pendingImage) {
      sendImageMessage();
      return;
    }
    sendMessage(input, { useAudio: audioMode });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage({
      file,
      previewUrl: URL.createObjectURL(file),
    });
    e.target.value = "";
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
        setLoading(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const res = await voiceToText(blob);
        setLoading(false);
        if (res.status && res.transcript) {
          if (audioMode) {
            sendMessage(res.transcript, { useAudio: true });
          } else {
            setInput(res.transcript);
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

  const stopStreaming = () => {
    abortRef.current?.abort();
    audioPlayerRef.current?.stop();
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-msl-bg/85"
        onClick={handleClose}
        aria-label="Close MSL AI"
      />
      <div
        className="relative w-full max-w-6xl h-[min(720px,calc(100vh-1.5rem))] flex overflow-hidden rounded-msl border border-msl-border bg-msl-surface shadow-glow-indigo animate-pop-in"
        role="dialog"
        aria-modal="true"
          aria-label="MSL AI"
      >
        <aside className="w-[280px] shrink-0 flex flex-col border-r border-msl-border bg-msl-surface">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-msl-border">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-brand shrink-0" strokeWidth={1.75} />
              <h2 className="font-display text-sm font-semibold text-msl-text truncate">
                MSL AI
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-msl text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-msl-muted pointer-events-none" />
              <input
                type="search"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses"
                className="w-full rounded-xl border border-msl-border bg-msl-surface pl-9 pr-3 py-2 text-sm text-msl-text placeholder:text-msl-muted focus:outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-0">
            <ul className="space-y-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => selectChat(GENERAL_CHAT_ID)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                    isGeneral
                      ? "bg-msl-accent border border-brand/20"
                      : "hover:bg-msl-accent/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-msl-text">General chat</span>
                    {generalPreview.at ? (
                      <span className="text-[11px] text-msl-muted shrink-0 pt-0.5">
                        {formatRelativeTime(generalPreview.at)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-msl-muted line-clamp-1 mt-0.5">
                    {previewText(generalPreview.preview, 48) || "Ask anything — no course context"}
                  </p>
                </button>
              </li>
            </ul>

            {loadingCourses ? (
              <div className="space-y-2 px-1 pt-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredCourses.length ? (
              <ul className="space-y-0.5 mt-1">
                {filteredCourses.map((course) => {
                  const id = String(course._id);
                  const active = id === String(selectedChatId);
                  const meta = coursePreviews[id];
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => selectChat(id)}
                        className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                          active
                            ? "bg-msl-accent border border-brand/20"
                            : "hover:bg-msl-accent/60 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-msl-text line-clamp-1">
                            {course.title}
                          </span>
                          {meta?.at ? (
                            <span className="text-[11px] text-msl-muted shrink-0 pt-0.5">
                              {formatRelativeTime(meta.at)}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-msl-muted line-clamp-1 mt-0.5">
                          {previewText(meta?.preview)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : courseSearch ? (
              <p className="px-3 py-4 text-sm text-msl-muted text-center">
                No courses match your search.
              </p>
            ) : null}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 bg-msl-bg/30">
          <header className="shrink-0 px-5 py-4 border-b border-msl-border bg-msl-surface">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold text-msl-text truncate">
                  {chatTitle}
                </h3>
                <p className="text-sm text-msl-muted mt-0.5">
                  {isGeneral
                    ? "General questions without course context"
                    : "Ask about this course and its study materials"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAudioMode((v) => !v)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  audioMode
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-msl-border text-msl-muted hover:text-msl-text"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                Audio replies
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
            {loadingHistory ? (
              <ChatSkeleton />
            ) : !messages.length ? (
              <div className="flex flex-col items-center justify-center text-center h-full min-h-[280px] px-4">
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-5">
                  <MessageSquare className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-semibold text-msl-text">
                  How can I help you study?
                </h3>
                <p className="text-sm text-msl-muted mt-2 max-w-md">
                  {audioMode
                    ? "Speak your question — it will be transcribed, sent, and answered with audio playback."
                    : "Pick a prompt below or type your own question."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s, { useAudio: audioMode })}
                      disabled={loading}
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
                      <UserMessage msg={msg} />
                    ) : (
                      <div className={mslAiAssistantBubbleClass}>
                        <AiHtmlContent content={msg.text} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {loading &&
            messages.length &&
            !messages.some((m) => m.role === "assistant" && m.streaming) ? (
              <div className="max-w-3xl mx-auto mt-4 space-y-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-40" />
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 px-5 pb-4 pt-2 border-t border-msl-border bg-msl-surface">
            <div className="max-w-3xl mx-auto space-y-2">
              {pendingImage ? (
                <div className="flex items-start gap-3 rounded-xl border border-msl-border bg-msl-surface-elevated p-3">
                  <img
                    src={pendingImage.previewUrl}
                    alt="Pending attachment"
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-msl-text">Image attached</p>
                    <p className="text-xs text-msl-muted mt-0.5">
                      Add a message below, then send.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearPendingImage}
                    className="p-1.5 rounded-lg text-msl-muted hover:text-msl-text hover:bg-brand/10"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : null}

              <div className={mslAiComposerClass}>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={loading}
                  className="p-2 rounded-xl text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors shrink-0 disabled:opacity-40"
                  aria-label="Upload image"
                >
                  <ImagePlus className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={loading}
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
                    pendingImage
                      ? "Add a message about this image…"
                      : audioMode
                        ? "Type or tap mic to speak…"
                        : "Message MSL AI…"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (canSend) handleSubmit();
                    }
                  }}
                  className={mslAiComposerFieldClass}
                />
                {loading ? (
                  <button
                    type="button"
                    onClick={stopStreaming}
                    className="p-2.5 rounded-full bg-msl-surface border border-msl-border text-msl-muted hover:text-msl-text shrink-0"
                    aria-label="Stop generating"
                  >
                    <Square className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canSend}
                    onClick={handleSubmit}
                    className={mslAiSendButtonClass}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-msl-muted text-center mt-2 max-w-3xl mx-auto">
              Enter to send · Shift+Enter for new line
              {audioMode ? " · Mic transcribes and sends with audio reply" : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
