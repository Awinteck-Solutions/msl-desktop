import { normalizeS3Key } from "./s3Key";

const VIDEO_FIELDS = [
  "video",
  "video1",
  "video2",
  "video3",
  "video4",
  "video5",
  "video6",
  "video7",
  "video8",
];

const PDF_FIELDS = [
  "pdf",
  "pdf1",
  "pdf2",
  "pdf3",
  "pdf4",
  "pdf5",
  "pdf6",
  "pdf7",
  "pdf8",
];

function storageKey(courseId) {
  return `msl-course-resource-visits-${courseId}`;
}

function loadVisits(courseId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(courseId)) || "{}");
  } catch {
    return {};
  }
}

function saveVisits(courseId, data) {
  localStorage.setItem(storageKey(courseId), JSON.stringify(data));
}

export function visitKey(lessonId, s3Key) {
  return `${lessonId}::${normalizeS3Key(s3Key)}`;
}

export function lessonResourceKeys(lesson) {
  const keys = [];
  VIDEO_FIELDS.forEach((field) => {
    if (lesson?.[field]) keys.push(normalizeS3Key(lesson[field]));
  });
  PDF_FIELDS.forEach((field) => {
    if (lesson?.[field]) keys.push(normalizeS3Key(lesson[field]));
  });
  return keys;
}

export function isResourceVisited(courseId, lessonId, s3Key) {
  if (!courseId || !lessonId || !s3Key) return false;
  return Boolean(loadVisits(courseId)[visitKey(lessonId, s3Key)]);
}

export function markResourceVisited(courseId, lessonId, s3Key) {
  if (!courseId || !lessonId || !s3Key) return;
  const data = loadVisits(courseId);
  data[visitKey(lessonId, s3Key)] = true;
  saveVisits(courseId, data);
}

export function isLessonFullyVisited(courseId, lesson) {
  if (!courseId || !lesson?._id) return false;
  const resources = lessonResourceKeys(lesson);
  if (!resources.length) return false;
  const data = loadVisits(courseId);
  const lessonId = String(lesson._id);
  return resources.every((key) => Boolean(data[visitKey(lessonId, key)]));
}
