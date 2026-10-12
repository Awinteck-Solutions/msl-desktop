import { apiClient, unwrapData } from "./apiClient";
import apiEndpoints from "./apiConfig";

export function pastQuestionErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const message =
    typeof data === "string"
      ? data
      : data?.message || data?.error || error?.message || "Request failed";
  if (status === 403) {
    return (
      message ||
      "Past questions require an active course enrollment or an active AI subscription."
    );
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
