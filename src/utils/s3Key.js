import apiEndpoints from "../Services/apiConfig";

/** Normalize a media path or URL to an S3/Qdrant bucket key. */
export function normalizeS3Key(path) {
  if (!path) return "";
  let key = String(path).trim();
  const bucket = apiEndpoints.bucketUrl?.replace(/\/$/, "") || "";
  const cdn = apiEndpoints.cdnUrl?.replace(/\/$/, "") || "";
  if (bucket && key.startsWith(bucket)) {
    key = key.slice(bucket.length);
  }
  if (cdn && key.startsWith(cdn)) {
    key = key.slice(cdn.length);
  }
  key = key.replace(/^\/?public\/res\//, "");
  key = key.replace(/^\/+/, "");
  return key;
}

export function normalizeS3Keys(paths) {
  if (!paths) return [];
  const list = Array.isArray(paths) ? paths : [paths];
  return list.map(normalizeS3Key).filter(Boolean);
}
