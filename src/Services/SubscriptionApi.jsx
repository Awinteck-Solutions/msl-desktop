import { apiClient, publicClient, unwrapData } from "./apiClient";
import apiEndpoints from "./apiConfig";

function failMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const message =
    typeof data === "string"
      ? data
      : data?.message || data?.error || error?.message || "Request failed";
  return status ? `${status} — ${message}` : message;
}

export async function fetchSubscriptionPlan() {
  const response = await publicClient.get(apiEndpoints.subscriptionPlan);
  const body = unwrapData(response);
  if (response.status === 200 && body?.response) {
    return { ok: true, plan: body.response };
  }
  return { ok: false, message: body?.message || "Could not load plan" };
}

export async function fetchSubscriptionStatus() {
  try {
    const response = await apiClient.get(apiEndpoints.subscriptionStatus);
    const body = unwrapData(response);
    if (response.status === 200) {
      return { ok: true, data: body?.response ?? body };
    }
    return { ok: false, message: body?.message || "Could not load status" };
  } catch (error) {
    return { ok: false, message: failMessage(error) };
  }
}

export async function fetchSubscriptionResources(page = 1, limit = 50) {
  try {
    const response = await apiClient.get(apiEndpoints.subscriptionResources, {
      params: { page, limit },
    });
    const body = unwrapData(response);
    if (response.status === 200) {
      return {
        ok: true,
        items: body?.response ?? [],
        pagination: body?.pagination,
      };
    }
    return { ok: false, message: body?.message || "Could not load resources" };
  } catch (error) {
    return { ok: false, message: failMessage(error) };
  }
}

export async function cancelSubscription() {
  try {
    const response = await apiClient.post(apiEndpoints.subscriptionCancel, {});
    const body = unwrapData(response);
    if (response.status === 200) {
      return {
        ok: true,
        message: body?.message || "Subscription updated",
        subscription: body?.response,
      };
    }
    return { ok: false, message: body?.message || "Cancel failed" };
  } catch (error) {
    return { ok: false, message: failMessage(error) };
  }
}
