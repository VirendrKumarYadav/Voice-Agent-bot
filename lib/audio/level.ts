export interface LevelMeter {
  analyser: AnalyserNode;
  getLevel: () => number;
  destroy: () => void;
}

/**
 * Wraps an AnalyserNode around any audio source node and exposes a single
 * 0-1 "how loud right now" reading. Used for both mic input (listening) and
 * TTS playback (speaking) so the orb animation can share one code path.
 */
export function createLevelMeter(
  audioContext: AudioContext,
  sourceNode: AudioNode,
  connectToDestination = false
): LevelMeter {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.8;
  sourceNode.connect(analyser);
  if (connectToDestination) {
    analyser.connect(audioContext.destination);
  }

  const data = new Uint8Array(analyser.frequencyBinCount);

  function getLevel(): number {
    analyser.getByteTimeDomainData(data);
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    return Math.min(1, rms * 4);
  }

  function destroy() {
    analyser.disconnect();
  }

  return { analyser, getLevel, destroy };
}
