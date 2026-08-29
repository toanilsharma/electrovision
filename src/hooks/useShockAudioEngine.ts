import { useRef, useCallback, useEffect, useState } from 'react';

interface ShockAudioEngineProps {
  isSimulating: boolean;
  currentMA: number;
  ecgState: 'sinus' | 'artifact' | 'vfib' | 'asystole';
}

export function useShockAudioEngine({ isSimulating, currentMA, ecgState }: ShockAudioEngineProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Sound nodes
  const humOscRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const flatlineOscRef = useRef<OscillatorNode | null>(null);
  const flatlineGainRef = useRef<GainNode | null>(null);

  // Initialize Audio Context on user gesture
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Master Gain capped at -12 dB (0.25 linear) to prevent clipping/ear strain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.25, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // 50 Hz AC Fundamental Hum Oscillator
      const humOsc = ctx.createOscillator();
      humOsc.type = 'sine';
      humOsc.frequency.setValueAtTime(50, ctx.currentTime);

      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0, ctx.currentTime);

      humOsc.connect(humGain);
      humGain.connect(masterGain);
      humOsc.start();
      humOscRef.current = humOsc;
      humGainRef.current = humGain;

      // 440 Hz Asystole Flatline Oscillator
      const flatOsc = ctx.createOscillator();
      flatOsc.type = 'sine';
      flatOsc.frequency.setValueAtTime(440, ctx.currentTime);

      const flatGain = ctx.createGain();
      flatGain.gain.setValueAtTime(0, ctx.currentTime);

      flatOsc.connect(flatGain);
      flatGain.connect(masterGain);
      flatOsc.start();
      flatlineOscRef.current = flatOsc;
      flatlineGainRef.current = flatGain;
    } catch {
      // AudioContext unavailable
    }
  }, []);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled((prev) => {
      const next = !prev;
      if (next) initAudio();
      return next;
    });
  }, [initAudio]);

  // Update Audio Synthesis based on real-time physics state
  useEffect(() => {
    if (!isAudioEnabled || !audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;

    if (isSimulating && currentMA > 0) {
      // Scale 50 Hz hum volume proportional to current (max 0.2 linear)
      const humVol = Math.min(currentMA / 500, 1.0) * 0.2;
      if (humGainRef.current) {
        humGainRef.current.gain.setTargetAtTime(humVol, ctx.currentTime, 0.05);
      }

      // Check Asystole flatline tone
      if (ecgState === 'asystole') {
        if (flatlineGainRef.current) {
          flatlineGainRef.current.gain.setTargetAtTime(0.15, ctx.currentTime, 0.05);
        }
      } else {
        if (flatlineGainRef.current) {
          flatlineGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        }
      }
    } else {
      // Mute hum and flatline when non-simulating
      if (humGainRef.current) {
        humGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      }
      if (flatlineGainRef.current) {
        flatlineGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      }
    }
  }, [isSimulating, currentMA, ecgState, isAudioEnabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return {
    isAudioEnabled,
    toggleAudio,
    initAudio
  };
}
