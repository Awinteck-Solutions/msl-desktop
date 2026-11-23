import { mediaUrl } from "../Services/apiConfig";
import { markersForSlot } from "./videoTimestamps";

const VIDEO_KEYS = [
  "video",
  "video1",
  "video2",
  "video3",
  "video4",
  "video5",
  "video6",
  "video7",
  "video8",
  "video9",
  "video10",
];

const PDF_KEYS = [
  "pdf",
  "pdf1",
  "pdf2",
  "pdf3",
  "pdf4",
  "pdf5",
  "pdf6",
  "pdf7",
  "pdf8",
  "pdf9",
  "pdf10",
];

function kindFromKey(slot, fileKey) {
  if (slot.startsWith("pdf") || /\.pdf(\?|$)/i.test(fileKey)) return "pdf";
  if (/\.(mp3|wav|m4a|aac|ogg)(\?|$)/i.test(fileKey)) return "audio";
  return "video";
}

export function lessonMediaItems(lesson) {
  if (!lesson) return [];
  const items = [];
  const push = (slot, fileKey) => {
    if (!fileKey || !String(fileKey).trim()) return;
    const key = String(fileKey).trim();
    const kind = kindFromKey(slot, key);
    items.push({
      id: `${lesson._id}-${slot}`,
      slot,
      kind,
      fileKey: key,
      url: mediaUrl(key),
      label:
        kind === "pdf"
          ? `PDF${slot === "pdf" ? "" : slot.replace("pdf", " ")}`
          : kind === "audio"
            ? `Audio${slot === "video" ? "" : slot.replace("video", " ")}`
            : `Video${slot === "video" ? "" : slot.replace("video", " ")}`,
      timestamps: kind === "video" ? markersForSlot(lesson.videoTimestamps, slot) : [],
    });
  };
  for (const slot of PDF_KEYS) push(slot, lesson[slot]);
  for (const slot of VIDEO_KEYS) push(slot, lesson[slot]);
  return items;
}

export function subscriptionLessonsSorted(resource) {
  const lessons = resource?.lessons || [];
  return [...lessons].sort((a, b) => (a.position || 0) - (b.position || 0));
}

/** Flat file list for legacy fallback */
export function subscriptionFilesOrFromLessons(resource) {
  const lessons = subscriptionLessonsSorted(resource);
  const fromLessons = lessons.flatMap((lesson) =>
    lessonMediaItems(lesson).map((item) => ({
      _id: item.id,
      fileName: item.label,
      fileType: item.kind.toUpperCase(),
      fileKey: item.fileKey,
      url: item.url,
      lessonId: lesson._id,
      lessonTitle: lesson.title,
      timestamps: item.timestamps || [],
    }))
  );
  if (fromLessons.length) return fromLessons;
  return (resource?.files || []).filter((f) => f.fileKey || f.url);
}