/**
 * IEC 60898-1 MCB Cockpit Sound System
 * 
 * Provides responsive, low-latency audio effects:
 * - Mechanical Relay Click
 * - Heavy Spring Trip Clack
 * - Ionized Plasma Arc Hiss
 * - Continuous 50Hz/60Hz Electromagnetic Hum proportional to Current (I)
 */

class MCBSoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.humGain) {
      this.humGain.gain.value = 0;
    }
  }

  /**
   * Mechanical latch click sound.
   */
  public playRelayClick(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Heavy spring snap & mechanical trip clack.
   */
  public playTripClack(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Low frequency mechanical body thump
    const thumpOsc = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(160, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    thumpGain.gain.setValueAtTime(0.7, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.09);

    // 2. High frequency metallic strike
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(2800, now);
    snapOsc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    snapGain.gain.setValueAtTime(0.5, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.05);
  }

  /**
   * Ionized plasma electric arc hiss.
   */
  public playArcHiss(durationSec: number = 0.06): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * Math.min(0.2, durationSec);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 2.0;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + durationSec);
  }

  /**
   * Sets continuous 50Hz electromagnetic hum volume proportional to current (I / In).
   */
  public updateCurrentHum(currentRatio: number, isEnergized: boolean): void {
    if (this.isMuted || !isEnergized || currentRatio <= 0.1) {
      if (this.humGain && this.ctx) {
        this.humGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }

    const ctx = this.initContext();
    if (!ctx) return;

    if (!this.humOsc) {
      this.humOsc = ctx.createOscillator();
      this.humGain = ctx.createGain();
      this.humOsc.type = 'sawtooth';
      this.humOsc.frequency.value = 100; // 100Hz 2nd harmonic of 50Hz

      this.humGain.gain.value = 0;
      this.humOsc.connect(this.humGain);
      this.humGain.connect(ctx.destination);
      this.humOsc.start();
    }

    if (this.humGain) {
      const targetGain = Math.min(0.25, (currentRatio / 10) * 0.2);
      this.humGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);
    }
  }

  public dispose(): void {
    if (this.humOsc) {
      try {
        this.humOsc.stop();
        this.humOsc.disconnect();
      } catch {}
      this.humOsc = null;
    }
  }
}

export const mcbSoundSystem = new MCBSoundSystem();
