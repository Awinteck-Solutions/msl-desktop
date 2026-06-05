const EDITABLE_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]), textarea, select, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';

export function isEditableElement(target) {
  if (!target || !(target instanceof Element)) return false;
  const el = target.closest(EDITABLE_SELECTOR);
  if (!el) return false;
  if ("readOnly" in el && el.readOnly) return false;
  if ("disabled" in el && el.disabled) return false;
  return true;
}

function shouldBlock(event) {
  return !isEditableElement(event.target);
}

function blockClipboard(event) {
  if (!shouldBlock(event)) return;
  event.preventDefault();
}

function blockShortcut(event) {
  if (!shouldBlock(event)) return;
  const key = event.key?.toLowerCase();
  if (!key) return;

  const mod = event.ctrlKey || event.metaKey;
  if (mod && (key === "c" || key === "x" || key === "a" || key === "u")) {
    event.preventDefault();
    return;
  }

  if (event.shiftKey && key === "insert") {
    event.preventDefault();
  }
}

export function initCopyProtection() {
  if (typeof document === "undefined") return;

  document.addEventListener("copy", blockClipboard);
  document.addEventListener("cut", blockClipboard);
  document.addEventListener("contextmenu", blockClipboard);
  document.addEventListener("dragstart", blockClipboard);
  document.addEventListener("keydown", blockShortcut, true);
}
