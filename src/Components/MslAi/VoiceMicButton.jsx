import { AudioLines, Mic } from "lucide-react";

/**
 * Mic control for chat composers. Shows a live recording treatment while the user is speaking.
 */
export default function VoiceMicButton({
  recording = false,
  onClick,
  disabled = false,
  audioMode = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={recording}
      aria-label={
        recording
          ? "Stop recording"
          : audioMode
            ? "Speak to send"
            : "Voice input"
      }
      title={
        recording
          ? "Tap to stop"
          : audioMode
            ? "Speak your question"
            : "Dictate into the message box"
      }
      className={`msl-voice-mic ${recording ? "is-recording" : ""} ${className}`.trim()}
    >
      {recording ? (
        <>
          <span className="msl-voice-mic__ring msl-voice-mic__ring--a" aria-hidden />
          <span className="msl-voice-mic__ring msl-voice-mic__ring--b" aria-hidden />
          <AudioLines className="msl-voice-mic__icon relative z-[1] h-4 w-4" strokeWidth={2} />
        </>
      ) : (
        <Mic className="msl-voice-mic__icon h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
