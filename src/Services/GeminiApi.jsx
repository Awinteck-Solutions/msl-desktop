import { apiClient, getAuthHeaders } from "./apiClient";
import apiEndpoints from "./apiConfig";
import { invalidateResponseCache } from "./responseCache";
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

export function buildScopePayload(scope = {}) {
  const payload = {};
  const courseId = scope.courseId ? String(scope.courseId) : null;
  const lessonId = scope.lessonId ? String(scope.lessonId) : null;
  if (courseId) payload.courseId = courseId;
  if (lessonId) payload.lessonId = lessonId;
  // File keys only apply when scoping a lesson/resource, not whole-course summarize.
  if (lessonId && scope.s3Keys?.length) {
    payload.s3Keys = scope.s3Keys.map((k) => normalizeS3Key(k)).filter(Boolean);
  } else if (!courseId && scope.s3Keys?.length) {
    payload.s3Keys = scope.s3Keys.map((k) => normalizeS3Key(k)).filter(Boolean);
  }
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pollGeneration(jobId) {
  const deadline = Date.now() + 3 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(2000);
    const response = await apiClient.get(apiEndpoints.geminiGenerationStatus, {
      params: { jobId },
    });
    const job = response.data?.response;
    if (job?.status === "ready") {
      return {
        status: true,
        response: { success: true, message: job.message, response: job.result },
      };
    }
    if (job?.status === "failed") {
      return { status: false, message: job.error || job.message, response: response.data };
    }
  }
  return {
    status: false,
    message: "Still generating. Open recent activity to check again.",
  };
}

async function beginJob(url, payload) {
  const response = await apiClient.post(url, payload);
  if (response.data?.jobId && response.data?.status === "processing") {
    return { status: true, jobId: response.data.jobId };
  }
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, immediate: response.data };
  }
  return { status: false, message: response.data?.message || "Could not start generation" };
}

async function startGeneration(url, payload) {
  const started = await beginJob(url, payload);
  if (started.jobId) return pollGeneration(started.jobId);
  if (started.immediate) return { status: true, response: started.immediate };
  return { status: false, message: started.message };
}

export const beginSummarize = (payload) => beginJob(apiEndpoints.geminiSummarize, payload);
export const beginFlashcards = (payload) => beginJob(apiEndpoints.geminiGenerateFlashcards, payload);
export const beginQuiz = (payload) => beginJob(apiEndpoints.geminiGenerateQuiz, payload);

export const getGenerationStatus = async (params = {}) => {
  const response = await apiClient.get(apiEndpoints.geminiGenerationStatus, { params });
  if (response.status === 200 && response.data?.success !== false) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data, message: response.data?.message };
};

export const summarize = async (payload) => startGeneration(apiEndpoints.geminiSummarize, payload);

export const generateFlashcards = async (payload) => {
  const result = await startGeneration(apiEndpoints.geminiGenerateFlashcards, payload);
  if (result.status) invalidateResponseCache("/v2/flashcard");
  return result;
};

export const generateQuiz = async (payload) => {
  const result = await startGeneration(apiEndpoints.geminiGenerateQuiz, payload);
  if (result.status) {
    invalidateResponseCache("/v2/quiz");
    invalidateResponseCache("/v2/course/user-with-quizzes");
  }
  return result;
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

export async function listTtsVoices() {
  const response = await apiClient.get(apiEndpoints.geminiVoices);
  return response.data?.response ?? [];
}
