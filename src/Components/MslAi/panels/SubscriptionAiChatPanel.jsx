import { useEffect, useRef, useState } from "react";
import { useToast } from "@chakra-ui/react";
import {
  ImagePlus,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Square,
  Volume2,
  X,
} from "lucide-react";
import AiHtmlContent from "../AiHtmlContent";
import {
  mslAiAssistantBubbleClass,
  mslAiComposerClass,
  mslAiComposerFieldClass,
  mslAiSendButtonClass,
  mslAiUserBubbleClass,
} from "../MslAiChatUi";
import SubscriptionAiScopePicker from "../SubscriptionAiScopePicker";
import { ChatSkeleton } from "../../UI/Skeleton";
import { useMslAi } from "../../../Context/MslAiContext";
import {
  buildSubscriptionScopePayload,
  getSubscriptionChatHistory,
  streamSubscriptionContextAudioChat,
  streamSubscriptionContextChat,
  subscriptionQueryImage,
  subscriptionVoiceToText,
} from "../../../Services/SubscriptionAiApi";
import { createSequentialAudioPlayer } from "../../../utils/sequentialAudioPlayer";

const SUGGESTIONS = [
  "Summarize the main ideas in my subscriber library",
  "What topics should I focus on this week?",
  "Explain a concept from my resources step by step",
  "Give me practice questions from the materials",
];

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

export default function SubscriptionAiChatPanel({ isOpen, onClose }) {
  const toast = useToast();
  const { scope } = useMslAi();
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

  const scopePayload = buildSubscriptionScopePayload(scope);
  const chatTitle = scope.label || "Subscription AI";

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInput("");
      setPendingImage(null);
      abortRef.current?.abort();
      audioPlayerRef.current?.stop();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingHistory(true);
    getSubscriptionChatHistory({ page: 1, limit: 30 })
      .then((res) => {
        if (res.status) {
          const items = (res.response?.response || []).reverse();
          const flat = [];
          for (const item of items) {
            flat.push({ role: "user", text: item.question || "" });
            flat.push({ role: "assistant", text: item.answer || "" });
          }
          setMessages(flat);
        } else {
          setMessages([]);
        }
      })
      .finally(() => setLoadingHistory(false));
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pendingImage]);

  useEffect(
    () => () => {
      if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    },
    [pendingImage]
  );

  const handleClose = () => {
    abortRef.current?.abort();
    audioPlayerRef.current?.stop();
    onClose();
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

    const controller = new AbortController();
    abortRef.current = controller;
    audioPlayerRef.current?.reset();
    const payload = { question: q, ...scopePayload };
    let assistantText = "";

    const appendAssistant = (chunk) => {
      assistantText += chunk;
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          copy[copy.length - 1] = { role: "assistant", text: assistantText, streaming: true };
          return copy;
        }
        return [...copy, { role: "assistant", text: assistantText, streaming: true }];
      });
    };

    try {
      if (useAudio) {
        await streamSubscriptionContextAudioChat({
          payload,
          signal: controller.signal,
          onText: (data) => {
            if (data?.finished && data.text) {
              assistantText = data.text;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", text: assistantText, streaming: true };
                return copy;
              });
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
        await streamSubscriptionContextChat({
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
        toast({ title: err.message || "Chat failed", status: "error", duration: 4000 });
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

    setMessages((prev) => [...prev, { role: "user", text: question, imageUrl: previewUrl }]);
    setInput("");
    clearPendingImage();
    setLoading(true);

    const res = await subscriptionQueryImage({
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
        const res = await subscriptionVoiceToText(blob);
        setLoading(false);
        if (res.status && res.transcript) {
          if (audioMode) sendMessage(res.transcript, { useAudio: true });
          else setInput(res.transcript);
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
        aria-label="Close"
      />
      <div
        className="relative w-full max-w-3xl h-[min(720px,calc(100vh-1.5rem))] flex flex-col overflow-hidden rounded-msl border border-msl-border bg-msl-surface shadow-glow-indigo"
        role="dialog"
        aria-modal="true"
      >
        <header className="shrink-0 px-5 py-4 border-b border-msl-border flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <h2 className="font-display text-base font-semibold text-msl-text truncate">
                {chatTitle}
              </h2>
            </div>
            <p className="text-sm text-msl-muted mt-0.5">
              Subscriber AI — trained on your subscription library
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAudioMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${
                audioMode
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-msl-border text-msl-muted"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              Audio
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-msl text-msl-muted hover:text-msl-text"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="shrink-0 px-5 pt-4">
          <SubscriptionAiScopePicker panelOpen={isOpen} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
          {loadingHistory ? (
            <ChatSkeleton />
          ) : !messages.length ? (
            <div className="flex flex-col items-center text-center py-12">
              <p className="text-sm text-msl-muted mb-4">Try asking:</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    className="text-xs rounded-full border border-msl-border px-3 py-1.5 text-msl-text hover:border-brand/30 hover:bg-brand/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "user" ? (
                    <UserMessage msg={msg} />
                  ) : (
                    <div className={mslAiAssistantBubbleClass}>
                      {msg.streaming && !msg.text ? (
                        <span className="text-msl-muted">Thinking…</span>
                      ) : (
                        <AiHtmlContent content={msg.text} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <footer className="shrink-0 border-t border-msl-border px-5 py-4 bg-msl-surface">
          {pendingImage ? (
            <div className="mb-2 flex items-center gap-2">
              <img
                src={pendingImage.previewUrl}
                alt=""
                className="h-14 w-14 rounded-lg object-cover border border-msl-border"
              />
              <button type="button" onClick={clearPendingImage} className="text-xs text-brand">
                Remove
              </button>
            </div>
          ) : null}
          <div className={mslAiComposerClass}>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                clearPendingImage();
                setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded-xl text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors shrink-0"
              aria-label="Attach image"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              placeholder="Ask about your subscription content…"
              className={mslAiComposerFieldClass}
              disabled={loading}
            />
            {loading ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="p-2.5 rounded-xl bg-red-500/10 text-red-500"
                aria-label="Stop"
              >
                <Square className="w-5 h-5" />
              </button>
            ) : recording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="p-2.5 rounded-full text-red-500 bg-red-500/10 shrink-0"
              >
                <MicOff className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="p-2 rounded-xl text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors shrink-0"
                aria-label="Voice input"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (!input.trim() && !pendingImage)}
              className={mslAiSendButtonClass}
              aria-label="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
