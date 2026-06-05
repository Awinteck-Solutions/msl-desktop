export function capitalizeDifficulty(value) {
  const d = String(value || "NEUTRAL").trim().toUpperCase();
  return ["EASY", "MEDIUM", "HARD", "NEUTRAL"].includes(d) ? d : "NEUTRAL";
}

export function isTrueFalseQuestion(question) {
  const type = String(question?.type || "")
    .toLowerCase()
    .replace(/[\s_/-]/g, "");
  if (
    type === "truefalse" ||
    type === "tf" ||
    type === "boolean" ||
    type === "trueorfalse"
  ) {
    return true;
  }

  const opts = question?.objectives ?? [];
  if (opts.length === 2) {
    const normalized = opts.map((o) => String(o).trim().toLowerCase());
    return normalized.includes("true") && normalized.includes("false");
  }
  return false;
}

export function questionTypeLabel(question) {
  return isTrueFalseQuestion(question) ? "True/False" : "MCQ";
}
