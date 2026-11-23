import { useEffect, useState } from "react";

const STORAGE_KEY = "msl_tts_voice";

export function useTtsVoices(loadVoices) {
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState(() => localStorage.getItem(STORAGE_KEY) || "");

  useEffect(() => {
    let cancel = false;
    loadVoices()
      .then((rows) => {
        if (cancel) return;
        const list = Array.isArray(rows) ? rows : [];
        setVoices(list);
        setVoiceId((current) => {
          if (list.some((voice) => voice._id === current)) return current;
          const next = list.find((voice) => voice.isDefault)?._id || list[0]?._id || "";
          if (next) localStorage.setItem(STORAGE_KEY, next);
          return next;
        });
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [loadVoices]);

  const chooseVoice = (id) => {
    setVoiceId(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
  };

  return { voices, voiceId, chooseVoice };
}

export function TtsVoiceSelect({ voices, value, onChange }) {
  if (!voices?.length) return null;
  return (
    <label className="inline-flex items-center gap-2 text-xs text-msl-muted">
      <span className="sr-only">Reply voice</span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[9rem] rounded-full border border-msl-border bg-msl-surface px-2.5 py-1.5 text-xs font-semibold text-msl-text"
      >
        {voices.map((voice) => (
          <option key={voice._id} value={voice._id}>
            {voice.name}
          </option>
        ))}
      </select>
    </label>
  );
}
