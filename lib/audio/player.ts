import { createLevelMeter, type LevelMeter } from "./level";

/**
 * Plays a single TTS audio blob and reports playback loudness (0-1) via
 * onLevel while it plays, so the orb can react to the agent's voice.
 * Reuses one audio graph across calls (browsers only allow a media element
 * to be wired into an AudioContext once).
 */
export class SpeechPlayer {
  private audioEl: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private meter: LevelMeter | null = null;

  private ensureGraph() {
    if (!this.audioEl) {
      this.audioEl = new Audio();
    }
    if (!this.audioContext || !this.meter) {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaElementSource(this.audioEl);
      this.meter = createLevelMeter(this.audioContext, source, true);
    }
    return {
      audioEl: this.audioEl,
      audioContext: this.audioContext,
      meter: this.meter,
    };
  }

  async play(audioBlob: Blob, onLevel?: (level: number) => void): Promise<void> {
    const { audioEl, audioContext, meter } = this.ensureGraph();
    await audioContext.resume();

    const url = URL.createObjectURL(audioBlob);
    audioEl.src = url;

    let rafId = 0;
    const tick = () => {
      onLevel?.(meter.getLevel());
      rafId = requestAnimationFrame(tick);
    };

    const donePromise = new Promise<void>((resolve, reject) => {
      audioEl.onended = () => resolve();
      audioEl.onerror = () => reject(new Error("Audio playback failed"));
    });

    try {
      rafId = requestAnimationFrame(tick);
      await audioEl.play();
      await donePromise;
    } finally {
      cancelAnimationFrame(rafId);
      URL.revokeObjectURL(url);
      onLevel?.(0);
    }
  }

  stop() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
  }

  destroy() {
    this.stop();
    this.meter?.destroy();
    void this.audioContext?.close();
    this.audioContext = null;
    this.meter = null;
    this.audioEl = null;
  }
}
