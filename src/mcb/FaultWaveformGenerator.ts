import { WaveformParams } from './types';

/**
 * IEC 60898-1 Fault Current Waveform Generator
 * 
 * Generates transient AC fault currents with decaying DC offset according to standard power system physics:
 * i(t) = I_peak * [ sin(ωt + θ - φ) - sin(θ - φ) * e^(-t / τ) ]
 */
export class FaultWaveformGenerator {
  private params: WaveformParams;
  private omega: number;
  private phi: number;
  private tau: number;
  private I_peak: number;

  constructor(params: WaveformParams) {
    this.params = { ...params };
    this.omega = 2 * Math.PI * this.params.frequency;
    this.phi = Math.atan(this.params.xrRatio);
    // Time constant tau = (X / R) / omega
    this.tau = this.params.xrRatio / this.omega;
    this.I_peak = Math.SQRT2 * this.params.I_rms;
  }

  /**
   * Update waveform parameters dynamically.
   */
  public setParams(params: WaveformParams): void {
    this.params = { ...params };
    this.omega = 2 * Math.PI * this.params.frequency;
    this.phi = Math.atan(this.params.xrRatio);
    this.tau = this.params.xrRatio / this.omega;
    this.I_peak = Math.SQRT2 * this.params.I_rms;
  }

  /**
   * Evaluates instantaneous transient fault current i(t) at time t (seconds).
   * Includes decaying DC offset:
   * i(t) = I_peak * [ sin(ωt + θ - φ) - sin(θ - φ) * e^(-t/τ) ]
   */
  public generateTransientCurrent(t: number): number {
    if (t < 0) return 0;
    const theta = this.params.inceptionAngle;
    const acTerm = Math.sin(this.omega * t + theta - this.phi);
    const dcTerm = Math.sin(theta - this.phi) * Math.exp(-t / this.tau);
    return this.I_peak * (acTerm - dcTerm);
  }

  /**
   * Evaluates steady-state sinusoidal AC current i(t) without DC offset component.
   * i(t) = I_peak * sin(ωt + θ)
   */
  public generateSteadyStateCurrent(t: number): number {
    if (t < 0) return 0;
    return this.I_peak * Math.sin(this.omega * t + this.params.inceptionAngle);
  }

  /**
   * Computes the decaying DC offset magnitude at time t.
   */
  public getDcOffset(t: number): number {
    if (t < 0) return 0;
    const theta = this.params.inceptionAngle;
    return -this.I_peak * Math.sin(theta - this.phi) * Math.exp(-t / this.tau);
  }

  /**
   * Returns peak current I_peak = √2 * I_rms.
   */
  public getPeakCurrent(): number {
    return this.I_peak;
  }

  /**
   * Returns system time constant τ in seconds.
   */
  public getTau(): number {
    return this.tau;
  }

  /**
   * Returns system impedance angle φ in radians.
   */
  public getPhaseAngle(): number {
    return this.phi;
  }
}
