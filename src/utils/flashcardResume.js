export function flashcardResumeKey(deckId) {
  return `msl-fc-resume-${deckId}`;
}

export function saveFlashcardResume(deckId, queueIndex, flipped) {
  if (!deckId) return;
  try {
    localStorage.setItem(
      flashcardResumeKey(deckId),
      JSON.stringify({ queueIndex, flipped: !!flipped })
    );
  } catch {
    /* ignore */
  }
}

export function loadFlashcardResume(deckId, itemCount, progress) {
  if (!deckId || !itemCount) {
    return { queueIndex: 0, flipped: false };
  }

  try {
    const raw = localStorage.getItem(flashcardResumeKey(deckId));
    if (raw) {
      const { queueIndex, flipped } = JSON.parse(raw);
      if (queueIndex >= 0 && queueIndex < itemCount) {
        return { queueIndex, flipped: !!flipped };
      }
    }
  } catch {
    /* ignore */
  }

  if (progress > 0 && progress < 100) {
    const idx = Math.min(
      Math.max(Math.floor((progress / 100) * itemCount), 0),
      itemCount - 1
    );
    return { queueIndex: idx, flipped: false };
  }

  return { queueIndex: 0, flipped: false };
}

export function clearFlashcardResume(deckId) {
  if (!deckId) return;
  try {
    localStorage.removeItem(flashcardResumeKey(deckId));
  } catch {
    /* ignore */
  }
}
