import { useCallback, useRef } from 'react';

export function useAudioHaptics() {
  const audioCtx = useRef<AudioContext | null>(null);
  const activeOsc = useRef<OscillatorNode | null>(null);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const startHum = useCallback((frequency: number = 60) => {
    try {
      initAudio();
      if (!audioCtx.current) return;
      
      if (activeOsc.current) {
        activeOsc.current.stop();
        activeOsc.current.disconnect();
      }

      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      activeOsc.current = osc;

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        // Continuous vibration pattern while holding
        navigator.vibrate([10000]); 
      }
    } catch (e) {
      console.warn("Audio/Haptic playback failed", e);
    }
  }, []);

  const stopHum = useCallback(() => {
    try {
      if (activeOsc.current && audioCtx.current) {
        activeOsc.current.stop(audioCtx.current.currentTime + 0.1);
        activeOsc.current = null;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(0);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const playShockHum = useCallback((durationMs: number = 500, freq: number = 60) => {
    startHum(freq);
    setTimeout(() => {
      stopHum();
    }, durationMs);
  }, [startHum, stopHum]);

  const playArcBlast = useCallback(() => {
    try {
      initAudio();
      if (!audioCtx.current) return;
      const ctx = audioCtx.current;
      
      // Blast noise (white noise burst)
      const bufferSize = ctx.sampleRate * 2; // 2 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.8;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      // Filter for explosion thud
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.5);
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      noise.start();
      
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
         navigator.vibrate([200, 50, 200, 50, 400]);
      }
    } catch (e) {
      console.warn("Audio/Haptic playback failed", e);
    }
  }, []);

  return { initAudio, playShockHum, startHum, stopHum, playArcBlast };
}
