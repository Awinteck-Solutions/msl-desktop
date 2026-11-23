export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remain = seconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(remain)}` : `${minutes}:${pad(remain)}`;
}

export function markersForSlot(timestamps, slot) {
  if (!Array.isArray(timestamps) || !slot) return [];
  return timestamps
    .filter((marker) => marker && marker.slot === slot && Number.isFinite(Number(marker.seconds)))
    .map((marker) => ({
      seconds: Math.floor(Number(marker.seconds)),
      text: String(marker.text || marker.label || "").trim(),
    }))
    .filter((marker) => marker.text)
    .sort((a, b) => a.seconds - b.seconds);
}

export function videoSlotForNumber(number) {
  const index = Number(number) || 1;
  return index <= 1 ? "video" : `video${index - 1}`;
}
