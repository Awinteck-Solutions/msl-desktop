import { apiClient, getAuthHeaders } from "./apiClient";
import apiEndpoints from "./apiConfig";
import { normalizeS3Key } from "../utils/s3Key";
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

export function buildSubscriptionScopePayload(scope = {}) {
  const payload = {};
  if (scope.resourceId) payload.resourceId = String(scope.resourceId);
  if (scope.s3Keys?.length) {
    payload.s3Keys = scope.s3Keys.map((k) => normalizeS3Key(k)).filter(Boolean);
  }
  return payload;
}

export function hasSubscriptionAiScope(scope = {}) {
  return !!(scope.resourceId || (scope.s3Keys && scope.s3Keys.length > 0));
}

export const getSubscriptionChatHistory = async (params = {}) => {
  const response = await apiClient.get(apiEndpoints.subscriptionAiHistory, { params });
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data, message: response.data?.message };
};

export const getSubscriptionRecentActivity = async (params = {}) => {
  const response = await apiClient.get(apiEndpoints.subscriptionAiRecentActivity, {
    params,
  });
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const subscriptionSummarize = async (payload) => {
  const response = await fetch(apiEndpoints.subscriptionAiSummarize, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (response.ok && data?.success !== false) {
    return { status: true, response: data };
  }
  return { status: false, response: data, message: data?.message };
};

export const subscriptionGenerateFlashcards = async (payload) => {
  const response = await fetch(apiEndpoints.subscriptionAiGenerateFlashcards, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (response.ok && data?.success !== false) {
    return { status: true, response: data };
  }
  return { status: false, response: data, message: data?.message };
};

export const subscriptionGenerateQuiz = async (payload) => {
  const response = await fetch(apiEndpoints.subscriptionAiGenerateQuiz, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (response.ok && data?.success !== false) {
    return { status: true, response: data };
  }
  return { status: false, response: data, message: data?.message };
};

export const streamSubscriptionContextChat = async ({
  payload,
  signal,
  onChunk,
  onEnd,
  onError,
}) => {
  const response = await fetch(apiEndpoints.subscriptionAiContextStream, {
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

export const streamSubscriptionContextAudioChat = async ({
  payload,
  signal,
  onText,
  onAudio,
  onError,
  onEnd,
}) => {
  const response = await fetch(apiEndpoints.subscriptionAiContextAudioStream, {
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

export const subscriptionQueryImage = async ({ imageFile, question, scope = {} }) => {
  const form = new FormData();
  form.append("image", imageFile);
  form.append("question", question);
  if (scope.resourceId) form.append("resourceId", scope.resourceId);
  if (scope.s3Keys?.length) {
    scope.s3Keys.forEach((key) => form.append("s3Keys", key));
  }

  const response = await fetch(apiEndpoints.subscriptionAiQueryImage, {
    method: "POST",
    headers: getAuthHeaders(),
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (response.ok && data?.success !== false) {
    return { status: true, response: data };
  }
  return { status: false, response: data, message: data?.message };
};

export const subscriptionVoiceToText = async (audioBlob, languageCode = "en-US") => {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  form.append("languageCode", languageCode);

  const response = await fetch(apiEndpoints.subscriptionAiVoiceToText, {
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
