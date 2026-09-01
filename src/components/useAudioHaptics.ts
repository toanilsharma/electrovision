import { useCallback, useRef } from 'react';
import { triggerHaptic, HAPTIC_PATTERNS } from '@/src/utils/haptics';

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

      // Sharp initial shock jolt [80ms]
      triggerHaptic(HAPTIC_PATTERNS.INITIAL_SHOCK);
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
      triggerHaptic(0);
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
      triggerHaptic(HAPTIC_PATTERNS.ARC_BLAST);
    } catch (e) {
      console.warn("Audio/Haptic playback failed", e);
    }
  }, []);

  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fibNodes = useRef<{ osc1?: OscillatorNode; osc2?: OscillatorNode; gain?: GainNode; noise?: AudioBufferSourceNode; interval?: ReturnType<typeof setInterval> } | null>(null);

  const triggerMuscleLockVibration = useCallback(() => {
    triggerHaptic(HAPTIC_PATTERNS.MUSCLE_LOCK);
  }, []);

  const triggerBreakerTripHaptic = useCallback(() => {
    triggerHaptic(HAPTIC_PATTERNS.BREAKER_TRIP);
  }, []);

  const triggerVFibHaptic = useCallback(() => {
    triggerHaptic(HAPTIC_PATTERNS.VF_ASYSTOLE);
  }, []);

  const stopHeartbeat = useCallback(() => {
    try {
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = null;
      }
      if (fibNodes.current) {
        if (fibNodes.current.interval) clearInterval(fibNodes.current.interval);
        if (fibNodes.current.osc1) { fibNodes.current.osc1.stop(); fibNodes.current.osc1.disconnect(); }
        if (fibNodes.current.osc2) { fibNodes.current.osc2.stop(); fibNodes.current.osc2.disconnect(); }
        if (fibNodes.current.noise) { fibNodes.current.noise.stop(); fibNodes.current.noise.disconnect(); }
        if (fibNodes.current.gain) { fibNodes.current.gain.disconnect(); }
        fibNodes.current = null;
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const startHeartbeat = useCallback((isFibrillation: boolean = false) => {
    try {
      stopHeartbeat();
      initAudio();
      if (!audioCtx.current) return;
      const ctx = audioCtx.current;

      if (!isFibrillation) {
        // Dry skin = Normal heart beep + thump
        const playBeat = () => {
          if (!audioCtx.current || audioCtx.current.state === 'closed') return;
          const now = ctx.currentTime;
          
          // Thump (lub)
          const oscLow = ctx.createOscillator();
          const gainLow = ctx.createGain();
          oscLow.type = 'sine';
          oscLow.frequency.setValueAtTime(75, now);
          oscLow.frequency.exponentialRampToValueAtTime(35, now + 0.08);
          gainLow.gain.setValueAtTime(0.3, now);
          gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          oscLow.connect(gainLow);
          gainLow.connect(ctx.destination);
          oscLow.start(now);
          oscLow.stop(now + 0.09);

          // Beep accent (ECG monitor sound)
          const oscBeep = ctx.createOscillator();
          const gainBeep = ctx.createGain();
          oscBeep.type = 'sine';
          oscBeep.frequency.setValueAtTime(880, now);
          gainBeep.gain.setValueAtTime(0.15, now);
          gainBeep.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          oscBeep.connect(gainBeep);
          gainBeep.connect(ctx.destination);
          oscBeep.start(now);
          oscBeep.stop(now + 0.08);
        };

        playBeat();
        heartbeatTimer.current = setInterval(playBeat, 750); // ~80 bpm
      } else {
        // Wet skin + Hand-Foot = Chaotic Fibrillation Sound (Heavy chest-thumping sub-bass rumble & erratic tremors)
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.45, ctx.currentTime);
        masterGain.connect(ctx.destination);

        // Low frequency sub-bass oscillator 1
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(45, ctx.currentTime);
        
        // Low frequency sub-bass oscillator 2
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(62, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);

        // Chaotic noise buffer for cardiac muscular spasm noise
        const bufferSize = ctx.sampleRate * 1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(120, ctx.currentTime);
        noiseFilter.Q.setValueAtTime(2, ctx.currentTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        filter.connect(masterGain);

        osc1.start();
        osc2.start();
        noise.start();

        // Rapid chaotic frequency & amplitude modulation (simulates uncoordinated V-Fib cardiac muscle twitching)
        const fibInterval = setInterval(() => {
          if (!audioCtx.current || audioCtx.current.state === 'closed') return;
          const now = ctx.currentTime;
          const randomFreq1 = 30 + Math.random() * 70;
          const randomFreq2 = 40 + Math.random() * 90;
          const randomGain = 0.2 + Math.random() * 0.4;
          
          osc1.frequency.linearRampToValueAtTime(randomFreq1, now + 0.04);
          osc2.frequency.linearRampToValueAtTime(randomFreq2, now + 0.04);
          masterGain.gain.linearRampToValueAtTime(randomGain, now + 0.04);
        }, 50);

        fibNodes.current = { osc1, osc2, gain: masterGain, noise, interval: fibInterval };
      }
    } catch (e) {
      console.warn("Heartbeat playback failed", e);
    }
  }, [stopHeartbeat]);

  return { initAudio, playShockHum, startHum, stopHum, playArcBlast, startHeartbeat, stopHeartbeat, triggerMuscleLockVibration };
}

