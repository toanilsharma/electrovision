import { useRef, useCallback } from 'react';

/**
 * Web Audio API hook for mechanical contact CLACK and plasma arc HISS sounds
 */
export function useAudioTrip() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  /**
   * Synthesizes mechanical breaker contact separation "CLACK"
   */
  const playMechanicalClack = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Transient impulse oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }, [getAudioContext]);

  /**
   * Synthesizes 200ms high-frequency plasma arc extinction "HISS"
   */
  const playArcHiss = useCallback((durationMs: number = 200) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const durationSec = durationMs / 1000;
    const bufferSize = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate white noise buffer
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // High-pass filter for sharp electrical hiss
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3500, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + durationSec);
  }, [getAudioContext]);

  /**
   * Plays combined trip audio cue (CLACK + HISS)
   */
  const playTripAudio = useCallback((isShortCircuit: boolean) => {
    playMechanicalClack();
    if (isShortCircuit) {
      playArcHiss(250);
    } else {
      playArcHiss(120);
    }
  }, [playMechanicalClack, playArcHiss]);

  return {
    playMechanicalClack,
    playArcHiss,
    playTripAudio
  };
}
