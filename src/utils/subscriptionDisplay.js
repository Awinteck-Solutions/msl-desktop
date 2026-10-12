import { mediaUrl } from "../Services/apiConfig";

/** Default card art when a resource has no uploaded thumbnail. */
export const MSL_SUBSCRIPTION_THUMBNAIL =
  "https://mslelearning.com/mslogo.png";

export function formatSubscriptionMoney(amount, currency = "GHS") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "GHS",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatSubscriptionDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function subscriptionStatusLabel(status) {
  if (!status) return "None";
  return String(status).replace(/_/g, " ");
}

export function subscriptionResourceThumbnail(resource) {
  const key = resource?.thumbnail;
  if (key) return mediaUrl(key);
  return MSL_SUBSCRIPTION_THUMBNAIL;
}

export function subscriptionResourceFileUrl(file) {
  if (file?.url) return file.url;
  if (file?.fileKey) return mediaUrl(file.fileKey);
  return "";
}

export function subscriptionFileKind(file) {
  const type = String(file?.fileType || "").toUpperCase();
  if (type === "PDF") return "pdf";
  if (type === "VIDEO") return "video";
  if (type === "AUDIO") return "audio";
  const mime = String(file?.fileName || "").toLowerCase();
  if (mime.endsWith(".pdf")) return "pdf";
  if (/\.(mp4|webm|mov|m4v)$/.test(mime)) return "video";
  if (/\.(mp3|wav|m4a|aac|ogg)$/.test(mime)) return "audio";
  return "other";
}
