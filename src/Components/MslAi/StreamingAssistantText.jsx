import { useEffect, useRef, useState } from "react";
import AiHtmlContent from "./AiHtmlContent";

/**
 * Reveals assistant text letter-by-letter while the stream (and TTS) continue.
 * When `streaming` ends, snaps to the full content.
 */
export default function StreamingAssistantText({
  content = "",
  streaming = false,
  className = "",
  cps = 56,
}) {
  const target = String(content || "");
  const [shown, setShown] = useState(() => (streaming ? "" : target));
  const lenRef = useRef(streaming ? 0 : target.length);

  useEffect(() => {
    if (!streaming) {
      lenRef.current = target.length;
      setShown(target);
      return undefined;
    }

    if (target.length < lenRef.current) {
      lenRef.current = 0;
      setShown("");
    }

    const tickMs = Math.max(12, Math.round(1000 / cps));
    const timer = setInterval(() => {
      if (lenRef.current >= target.length) return;
      // Catch up a little when chunks arrive faster than the reveal.
      const lag = target.length - lenRef.current;
      const step = lag > 24 ? 3 : lag > 10 ? 2 : 1;
      lenRef.current = Math.min(target.length, lenRef.current + step);
      setShown(target.slice(0, lenRef.current));
    }, tickMs);

    return () => clearInterval(timer);
  }, [target, streaming, cps]);

  if (!shown && streaming) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-msl-muted">
        <span className="msl-stream-caret" aria-hidden />
        Thinking…
      </span>
    );
  }

  return (
    <div className={`relative ${className}`.trim()}>
      <AiHtmlContent content={shown} />
      {streaming ? <span className="msl-stream-caret ml-0.5 align-text-bottom" aria-hidden /> : null}
    </div>
  );
}
