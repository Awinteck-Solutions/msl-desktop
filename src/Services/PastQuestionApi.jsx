import { apiClient, getAuthHeaders, unwrapData } from "./apiClient";
import apiEndpoints from "./apiConfig";
import { consumeSseStream } from "../utils/sseParser";

export function pastQuestionErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const message =
    typeof data === "string"
      ? data
      : data?.message || data?.error || error?.message || "Request failed";
  if (status === 403) {
    return message || "You do not have access to this.";
  }
  return status ? `${status} — ${message}` : message;
}

export async function fetchPastQuestionTree(params = {}) {
  try {
    const response = await apiClient.get(apiEndpoints.pastQuestionsTree, {
      params,
    });
    const body = unwrapData(response);
    if (response.status === 200) {
      return { ok: true, tree: body?.response ?? [] };
    }
    return { ok: false, message: body?.message || "Could not load past questions" };
  } catch (error) {
    return {
      ok: false,
      message: pastQuestionErrorMessage(error),
      forbidden: error?.response?.status === 403,
    };
  }
}

export async function fetchPastQuestionPaperInsights(id) {
  try {
    const response = await apiClient.get(
      `${apiEndpoints.pastQuestionPaper}/${id}/insights`
    );
    const body = unwrapData(response);
    if (response.status === 200) {
      return { ok: true, insights: body?.response ?? body };
    }
    return { ok: false, message: body?.message || "Could not load insights" };
  } catch (error) {
    return {
      ok: false,
      message: pastQuestionErrorMessage(error),
      forbidden: error?.response?.status === 403,
    };
  }
}

export async function fetchPastQuestionPaper(id) {
  try {
    const response = await apiClient.get(
      `${apiEndpoints.pastQuestionPaper}/${id}`
    );
    const body = unwrapData(response);
    if (response.status === 200) {
      return { ok: true, paper: body?.response ?? body };
    }
    return { ok: false, message: body?.message || "Paper not found" };
  } catch (error) {
    return {
      ok: false,
      message: pastQuestionErrorMessage(error),
      forbidden: error?.response?.status === 403,
    };
  }
}

export async function fetchPastQuestionAiQuota() {
  try {
    const response = await apiClient.get(apiEndpoints.pastQuestionAiQuota);
    const body = unwrapData(response);
    if (response.status === 200) {
      return { ok: true, quota: body?.response ?? body };
    }
    return { ok: false, message: body?.message || "Could not load AI quota" };
  } catch (error) {
    return { ok: false, message: pastQuestionErrorMessage(error) };
  }
}

export async function fetchPastQuestionHistory(paperId) {
  try {
    const response = await apiClient.get(apiEndpoints.pastQuestionHistory, {
      params: paperId ? { paperId } : undefined,
    });
    const body = unwrapData(response);
    if (response.status === 200) {
      return { ok: true, items: body?.response ?? [] };
    }
    return { ok: false, message: body?.message || "Could not load chat history" };
  } catch (error) {
    return { ok: false, message: pastQuestionErrorMessage(error) };
  }
}

export async function pastQuestionChat(body) {
  try {
    const response = await apiClient.post(apiEndpoints.pastQuestionChat, body, {
      timeout: 120000,
    });
    const data = unwrapData(response);
    if (response.status === 200) {
      return { ok: true, data: data?.response ?? data };
    }
    return { ok: false, message: data?.message || "Chat failed" };
  } catch (error) {
    return { ok: false, message: pastQuestionErrorMessage(error) };
  }
}

export async function pastQuestionChatAudioStream({
  payload,
  signal,
  onText,
  onAudio,
  onError,
  onEnd,
}) {
  const response = await fetch(apiEndpoints.pastQuestionChatAudioStream, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      /* keep status message */
    }
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
}
