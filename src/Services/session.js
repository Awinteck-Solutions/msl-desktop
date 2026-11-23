import { clearResponseCache } from "./responseCache";

const USER_KEY = "user";
const DEVICE_ID_KEY = "msl_device_id";

export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `desktop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw || raw === "null") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    clearResponseCache();
    return;
  }
  const previous = getStoredUser();
  const previousId = previous?._id || previous?.id || previous?.userId;
  const nextId = user?._id || user?.id || user?.userId;
  if (previousId && nextId && String(previousId) !== String(nextId)) {
    clearResponseCache();
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  clearResponseCache();
}

export function getDeviceIdForSession() {
  const user = getStoredUser();
  return user?.device_id || getOrCreateDeviceId();
}
