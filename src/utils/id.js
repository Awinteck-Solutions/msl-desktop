export function idOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
}
