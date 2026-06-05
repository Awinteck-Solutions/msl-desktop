import axios from "axios";
import apiEndpoints from "./apiConfig";
import {
  clearSession,
  getDeviceIdForSession,
  getStoredUser,
  setStoredUser,
} from "./session";

export const publicClient = axios.create({
  baseURL: apiEndpoints.baseUrl,
});

export const apiClient = axios.create({
  baseURL: apiEndpoints.baseUrl,
});

function buildAuthHeaders() {
  const user = getStoredUser();
  const headers = {};
  if (user?.token) {
    headers.Authorization = `Bearer ${user.token}`;
  }
  const deviceId = getDeviceIdForSession();
  if (deviceId) {
    headers["x-device-id"] = deviceId;
  }
  try {
    headers["x-timezone"] =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    headers["x-timezone"] = "UTC";
  }
  return headers;
}

export function getAuthHeaders() {
  return buildAuthHeaders();
}

apiClient.interceptors.request.use((config) => {
  Object.assign(config.headers, buildAuthHeaders());
  return config;
});

let refreshInFlight = null;

async function tryRefreshToken() {
  const user = getStoredUser();
  if (!user?.token) return false;

  if (!refreshInFlight) {
    refreshInFlight = apiClient
      .post(apiEndpoints.refreshToken, {})
      .then((res) => {
        const nextUser = res.data?.user;
        if (nextUser?.token) {
          setStoredUser({ ...user, ...nextUser, token: nextUser.token });
          return true;
        }
        return false;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/refresh-token")
    ) {
      original._retry = true;
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        Object.assign(original.headers, buildAuthHeaders());
        return apiClient(original);
      }
      clearSession();
      if (typeof window !== "undefined" && window.location) {
        const hash = window.location.hash || "";
        if (!hash.includes("/login")) {
          window.location.hash = "#/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export function unwrapData(response) {
  return response?.data ?? null;
}
