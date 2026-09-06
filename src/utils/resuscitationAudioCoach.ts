/**
 * Multi-Modal Audio-Haptic AI Resuscitation Voice Coach & Sound Synthesizer
 * Provides spoken AED voice prompts via Web Speech API, dual-tone metronome (110 BPM),
 * capacitor charging whines, BVM air rush acoustics, and haptic feedback.
 */

export interface VoiceCoachConfig {
  speechEnabled: boolean;
  audioEffectsEnabled: boolean;
  hapticsEnabled: boolean;
  volume?: number; // 0.0 to 1.0
}

class ResuscitationAudioCoach {
  private audioCtx: AudioContext | null = null;
  private isSpeechActive = true;
  private isAudioActive = true;
  private isHapticsActive = true;
  private lastSpokenText = '';
  private lastSpokenTime = 0;
  private chargeOsc: OscillatorNode | null = null;
  private chargeGain: GainNode | null = null;

  constructor() {
    // Lazy audio context creation on first user interaction
  }

  public setConfig(config: VoiceCoachConfig) {
    this.isSpeechActive = config.speechEnabled;
    this.isAudioActive = config.audioEffectsEnabled;
    this.isHapticsActive = config.hapticsEnabled;
  }

  private initAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Speaks an emergency voice instruction with debouncing and prioritization.
   */
  public speak(phrase: string, priority: 'urgent' | 'normal' = 'normal') {
    if (!this.isSpeechActive || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    // Debounce identical phrases within 2.5 seconds unless urgent
    if (priority !== 'urgent' && phrase === this.lastSpokenText && now - this.lastSpokenTime < 2500) {
      return;
    }

    try {
      if (priority === 'urgent') {
        window.speechSynthesis.cancel(); // Interrupt current speech for emergency safety alerts
      }

      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.05; // Urgent, commanding emergency pace
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick a clear natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural')) && v.lang.startsWith('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.lastSpokenText = phrase;
      this.lastSpokenTime = now;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful degradation
    }
  }

  /**
   * Dual-tone 110 BPM metronome beat:
   * Crisp 880 Hz impulse + low 65 Hz sub-bass visceral chest punch.
   */
  public playMetronomeTick() {
    if (!this.isAudioActive) return;
    const ctx = this.initAudioContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // 1. High frequency acoustic tick (880 Hz)
      const oscHigh = ctx.createOscillator();
      const gainHigh = ctx.createGain();
      oscHigh.type = 'triangle';
      oscHigh.frequency.setValueAtTime(880, t);
      oscHigh.frequency.exponentialRampToValueAtTime(440, t + 0.04);

      gainHigh.gain.setValueAtTime(0.35, t);
      gainHigh.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      oscHigh.connect(gainHigh);
      gainHigh.connect(ctx.destination);
      oscHigh.start(t);
      oscHigh.stop(t + 0.05);

      // 2. Sub-bass compression body punch (65 Hz)
      const oscSub = ctx.createOscillator();
      const gainSub = ctx.createGain();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(85, t);
      oscSub.frequency.exponentialRampToValueAtTime(45, t + 0.08);

      gainSub.gain.setValueAtTime(0.40, t);
      gainSub.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      oscSub.connect(gainSub);
      gainSub.connect(ctx.destination);
      oscSub.start(t);
      oscSub.stop(t + 0.1);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /**
   * Defibrillator capacitor charging whine (frequency ramp from 250 Hz to 1350 Hz).
   */
  public startCapacitorCharge(durationSec: number = 3.0) {
    if (!this.isAudioActive) return;
    const ctx = this.initAudioContext();
    if (!ctx) return;

    this.stopCapacitorCharge();

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, t);
      osc.frequency.exponentialRampToValueAtTime(1350, t + durationSec);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      this.chargeOsc = osc;
      this.chargeGain = gain;
    } catch {
      // Ignore
    }
  }

  public stopCapacitorCharge() {
    if (this.chargeOsc) {
      try {
        this.chargeOsc.stop();
        this.chargeOsc.disconnect();
      } catch {
        // Ignore
      }
      this.chargeOsc = null;
    }
  }

  /**
   * Delivers high-energy BTE shock audio blast and haptic impulse.
   */
  public playDefibrillationShock() {
    this.stopCapacitorCharge();
    if (this.isAudioActive) {
      const ctx = this.initAudioContext();
      if (ctx) {
        try {
          const t = ctx.currentTime;
          // White noise blast burst
          const bufferSize = ctx.sampleRate * 0.15;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
          }

          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.6, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

          noise.connect(gain);
          gain.connect(ctx.destination);
          noise.start(t);
        } catch {
          // Ignore
        }
      }
    }

    if (this.isHapticsActive && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([120, 50, 240]);
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Synthesizes BVM air inflow rush and exhalation recoil.
   */
  public playBVMBreath(isInhalation: boolean) {
    if (!this.isAudioActive) return;
    const ctx = this.initAudioContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const duration = isInhalation ? 0.8 : 0.6;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Filtered soft air rush sound
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isInhalation ? 600 : 400, t);
      filter.frequency.linearRampToValueAtTime(isInhalation ? 1200 : 300, t + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.18, t + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.005, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(t);
    } catch {
      // Ignore
    }
  }

  /**
   * Tactile haptic pulse for compression stroke and recoil.
   */
  public triggerCompressionHaptic(isRecoil: boolean = false) {
    if (!this.isHapticsActive || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    try {
      navigator.vibrate(isRecoil ? [8] : [16]);
    } catch {
      // Ignore
    }
  }
}

export const resuscitationCoach = new ResuscitationAudioCoach();
