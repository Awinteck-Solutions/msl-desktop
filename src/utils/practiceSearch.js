export function matchesSearch(query, ...fields) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) =>
    String(field || "")
      .toLowerCase()
      .includes(q)
  );
}
