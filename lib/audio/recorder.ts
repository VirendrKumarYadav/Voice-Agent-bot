import { createLevelMeter, type LevelMeter } from "./level";

export interface MicRecorderOptions {
  onLevel?: (level: number) => void;
  /** RMS level (0-1) below which audio counts as silence. */
  silenceThreshold?: number;
  /** How long silence must persist before auto-stopping. */
  silenceDurationMs?: number;
  /** Hard cap so a stuck-open mic can't record forever. */
  maxDurationMs?: number;
  /** Minimum time spent above the silence threshold before we'll auto-stop. */
  minSpeechMs?: number;
}

function pickMimeType(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const candidate of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(candidate)
    ) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Captures one utterance from the mic: records until the user has spoken
 * and then gone quiet for `silenceDurationMs`, then resolves with the audio
 * blob. Call `stop()` to end early (e.g. the user clicked Stop).
 */
export class MicRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private levelMeter: LevelMeter | null = null;
  private chunks: Blob[] = [];
  private rafId: number | null = null;

  async start(options: MicRecorderOptions = {}): Promise<Blob> {
    const {
      onLevel,
      silenceThreshold = 0.02,
      silenceDurationMs = 1200,
      maxDurationMs = 20000,
      minSpeechMs = 400,
    } = options;

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.levelMeter = createLevelMeter(this.audioContext, source);

    const mimeType = pickMimeType();
    this.mediaRecorder = new MediaRecorder(
      this.stream,
      mimeType ? { mimeType } : undefined
    );
    this.chunks = [];
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };

    const stopped = new Promise<Blob>((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: mimeType || "audio/webm",
        });
        this.teardown();
        resolve(blob);
      };
    });

    this.mediaRecorder.start();

    let speechStart: number | null = null;
    let silenceStart: number | null = null;
    const startTime = performance.now();

    const tick = () => {
      if (!this.levelMeter) return;
      const level = this.levelMeter.getLevel();
      onLevel?.(level);

      const now = performance.now();

      if (level > silenceThreshold) {
        silenceStart = null;
        if (speechStart === null) speechStart = now;
      } else if (speechStart !== null && silenceStart === null) {
        silenceStart = now;
      }

      const hasSpokenEnough =
        speechStart !== null && now - speechStart > minSpeechMs;
      const silenceLongEnough =
        silenceStart !== null && now - silenceStart > silenceDurationMs;
      const timedOut = now - startTime > maxDurationMs;

      if ((hasSpokenEnough && silenceLongEnough) || timedOut) {
        this.stop();
        return;
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);

    return stopped;
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
  }

  private teardown() {
    this.levelMeter?.destroy();
    this.levelMeter = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    void this.audioContext?.close();
    this.audioContext = null;
  }
}
