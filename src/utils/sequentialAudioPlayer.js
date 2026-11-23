const DEFAULTS = {
  // Hold briefly so the first TTS phrase can land while text types out.
  minBufferChunks: 1,
  minBufferMs: 420,
  maxInitialWaitMs: 1600,
};

function decodeBase64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function createSequentialAudioPlayer(options = {}) {
  const config = { ...DEFAULTS, ...options };
  const segments = new Map();
  let audioContext = null;
  let nextPlayIndex = 0;
  let isScheduling = false;
  let playbackStarted = false;
  let firstEnqueueAt = null;
  let scheduledTime = 0;
  let bufferTimer = null;
  let activeSources = [];
  let idleTimer = null;
  let stopped = false;

  const notifyIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleTimer = null;
      if (
        !stopped &&
        !activeSources.length &&
        !segments.size &&
        !isScheduling
      ) {
        config.onIdle?.();
      }
    }, 120);
  };

  const getContext = () => {
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContext();
    }
    return audioContext;
  };

  const completedSegmentCount = () => {
    let count = 0;
    segments.forEach((seg) => {
      if (seg.complete && seg.parts.length) count += 1;
    });
    return count;
  };

  const isSegmentReady = (index) => {
    const seg = segments.get(index);
    return Boolean(seg?.complete && seg.parts.length);
  };

  const canStartPlayback = () => {
    if (playbackStarted) return true;
    if (!firstEnqueueAt) return false;

    // One completed final reply — play immediately (avoids a long mute then a clicky start).
    if (isSegmentReady(0) && segments.get(0)?.complete && completedSegmentCount() === 1) {
      return true;
    }

    if (completedSegmentCount() >= config.minBufferChunks) return true;
    if (isSegmentReady(0) && Date.now() - firstEnqueueAt >= config.minBufferMs) {
      return true;
    }
    if (Date.now() - firstEnqueueAt >= config.maxInitialWaitMs) return true;
    return false;
  };

  const scheduleBufferCheck = () => {
    if (playbackStarted || bufferTimer) return;
    const elapsed = firstEnqueueAt ? Date.now() - firstEnqueueAt : 0;
    const waitMs = Math.max(200, config.minBufferMs - elapsed, 300);
    bufferTimer = setTimeout(() => {
      bufferTimer = null;
      void scheduleSegments();
    }, waitMs);
  };

  const scheduleSegments = async () => {
    if (isScheduling) return;
    if (!canStartPlayback()) {
      scheduleBufferCheck();
      return;
    }

    playbackStarted = true;
    isScheduling = true;

    try {
      const ctx = getContext();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      // Keep a tiny lead-in so decode jitter does not force a restart gap/click.
      if (scheduledTime < ctx.currentTime + 0.04) {
        scheduledTime = ctx.currentTime + 0.04;
      }

      while (isSegmentReady(nextPlayIndex)) {
        const seg = segments.get(nextPlayIndex);
        for (const part of seg.parts) {
          try {
            const arrayBuffer = decodeBase64ToArrayBuffer(part.audio);
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
            const source = ctx.createBufferSource();
            // Soften chunk edges so spliced PCM/WAV pieces do not scratch.
            const gain = ctx.createGain();
            const fade = Math.min(0.012, Math.max(0.004, audioBuffer.duration / 8));
            gain.gain.setValueAtTime(0, scheduledTime);
            gain.gain.linearRampToValueAtTime(1, scheduledTime + fade);
            gain.gain.setValueAtTime(1, Math.max(scheduledTime + fade, scheduledTime + audioBuffer.duration - fade));
            gain.gain.linearRampToValueAtTime(0.0001, scheduledTime + audioBuffer.duration);
            source.buffer = audioBuffer;
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start(scheduledTime);
            activeSources.push(source);
            source.onended = () => {
              activeSources = activeSources.filter((s) => s !== source);
              notifyIdle();
            };
            scheduledTime += audioBuffer.duration;
          } catch {
            /* skip corrupt chunk */
          }
        }
        segments.delete(nextPlayIndex);
        nextPlayIndex += 1;
      }
    } finally {
      isScheduling = false;
      if (isSegmentReady(nextPlayIndex)) {
        void scheduleSegments();
      }
    }
  };

  return {
    enqueue({ chunkIndex = 0, audio, mimeType, isFinal }) {
      if (!audio) return;
      stopped = false;
      if (!firstEnqueueAt) firstEnqueueAt = Date.now();

      const index = Number.isFinite(chunkIndex) ? chunkIndex : 0;
      if (!segments.has(index)) {
        segments.set(index, { parts: [], complete: false });
      }
      const seg = segments.get(index);
      seg.parts.push({ audio, mimeType });
      if (isFinal) seg.complete = true;

      void scheduleSegments();
      if (!playbackStarted) scheduleBufferCheck();
    },
    stop() {
      stopped = true;
      if (bufferTimer) {
        clearTimeout(bufferTimer);
        bufferTimer = null;
      }
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      activeSources.forEach((source) => {
        try {
          source.stop();
        } catch {
          /* already stopped */
        }
      });
      activeSources = [];
      segments.clear();
      nextPlayIndex = 0;
      playbackStarted = false;
      firstEnqueueAt = null;
      scheduledTime = 0;
      isScheduling = false;
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
      audioContext = null;
    },
    reset() {
      this.stop();
      stopped = false;
    },
  };
}

function playAudioBase64(base64, mimeType = "audio/wav") {
  return new Promise((resolve) => {
    if (!base64) {
      resolve();
      return;
    }
    const audio = new Audio(`data:${mimeType};base64,${base64}`);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

export { playAudioBase64 };
