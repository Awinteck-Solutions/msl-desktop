import { apiClient, getAuthHeaders } from "./apiClient";
import apiEndpoints from "./apiConfig";
import { consumeSseStream } from "../utils/sseParser";

function jsonHeaders() {
  return {
    ...getAuthHeaders(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function parseErrorResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => ({}));
    return data?.message || `Request failed (${response.status})`;
  }
  const text = await response.text().catch(() => "");
  return text || `Request failed (${response.status})`;
}

export function buildScopePayload(scope = {}) {
  const payload = {};
  if (scope.courseId) payload.courseId = scope.courseId;
  if (scope.lessonId) payload.lessonId = scope.lessonId;
  if (scope.s3Keys?.length) payload.s3Keys = scope.s3Keys;
  return payload;
}

export function hasAiScope(scope = {}) {
  return !!(
    scope.courseId ||
    scope.lessonId ||
    (scope.s3Keys && scope.s3Keys.length > 0)
  );
}

export const getChatHistory = async (params = {}) => {
  const response = await apiClient.get(apiEndpoints.geminiHistory, { params });
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data, message: response.data?.message };
};

export const getRecentActivity = async (params = {}) => {
  const response = await apiClient.get(apiEndpoints.geminiRecentActivity, { params });
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const getSummarizeHistory = async (params = {}) => {
  const response = await apiClient.get(apiEndpoints.geminiSummaries, { params });
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const getFlashcardHistory = async (params = {}) => {
  const response = await apiClient.get(apiEndpoints.geminiFlashcardHistory, { params });
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const getQuizHistory = async (params = {}) => {
  const response = await apiClient.get(apiEndpoints.geminiQuizHistory, { params });
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const summarize = async (payload) => {
  const response = await apiClient.post(apiEndpoints.geminiSummarize, payload);
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data, message: response.data?.message };
};

export const generateFlashcards = async (payload) => {
  const response = await apiClient.post(apiEndpoints.geminiGenerateFlashcards, payload);
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data, message: response.data?.message };
};

export const generateQuiz = async (payload) => {
  const response = await apiClient.post(apiEndpoints.geminiGenerateQuiz, payload);
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data, message: response.data?.message };
};

/** Raw text stream (not SSE) from query-general-context-stream */
export const streamContextChat = async ({
  payload,
  signal,
  onChunk,
  onEnd,
  onError,
}) => {
  const response = await fetch(apiEndpoints.geminiContextStream, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    const message = await parseErrorResponse(response);
    onError?.({ message });
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) onChunk?.(chunk);
    }
    onEnd?.();
  } catch (err) {
    if (signal?.aborted) return;
    onError?.({ message: err.message });
    throw err;
  }
};

export const streamContextAudioChat = async ({
  payload,
  signal,
  onText,
  onAudio,
  onError,
  onEnd,
}) => {
  const response = await fetch(apiEndpoints.geminiContextAudioStream, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    const message = await parseErrorResponse(response);
    onError?.({ message });
    throw new Error(message);
  }

  await consumeSseStream(response, {
    signal,
    onEvent: (event) => {
      if (event.type === "text") onText?.(event.payload);
      else if (event.type === "audio") onAudio?.(event.payload);
      else if (event.type === "error") onError?.(event.payload);
      else if (event.type === "end") onEnd?.();
    },
  });
  onEnd?.();
};

export const queryImage = async ({ imageFile, question, scope = {} }) => {
  const form = new FormData();
  form.append("image", imageFile);
  form.append("question", question);
  if (scope.courseId) form.append("courseId", scope.courseId);
  if (scope.lessonId) form.append("lessonId", scope.lessonId);
  if (scope.s3Keys?.length) {
    scope.s3Keys.forEach((key) => form.append("s3Keys", key));
  }

  const headers = getAuthHeaders();
  const response = await fetch(apiEndpoints.geminiQueryImage, {
    method: "POST",
    headers,
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (response.ok && data?.success !== false) {
    return { status: true, response: data };
  }
  return { status: false, response: data, message: data?.message };
};

export const voiceToText = async (audioBlob, languageCode = "en-US") => {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  form.append("languageCode", languageCode);

  const response = await fetch(apiEndpoints.geminiVoiceToText, {
    method: "POST",
    headers: getAuthHeaders(),
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (response.ok && data?.success !== false) {
    return { status: true, transcript: data.transcript || "" };
  }
  return { status: false, message: data?.message || "Transcription failed" };
};
