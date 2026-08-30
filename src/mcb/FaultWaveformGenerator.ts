import { WaveformParams, ThreePhaseCurrents } from './types';

/**
 * IEC 60898-1 / IEC 60909 Fault Current Waveform Generator
 * 
 * Generates transient AC fault currents with decaying DC offset according to standard power system physics:
 * i(t) = I_peak * [ sin(ωt + θ - φ) - sin(θ - φ) * e^(-t / τ) ]
 * 
 * Implements:
 * 1. IEC 60909 Peak Factor: κ = 1.02 + 0.98 * exp(-3 * R/X)
 * 2. 1-Phase (230V) and 3-Phase (400V) waveform distribution for 3φ bolted, L-L, L-G
 * 3. DC Mode: Constant DC current + L·di/dt overvoltage spike & exponential decay τ = L / R_arc
 */
export class FaultWaveformGenerator {
  private params: WaveformParams;
  private omega: number;
  private phi: number;
  private tau: number;
  private I_peak: number;
  private kappa: number;

  constructor(params: WaveformParams) {
    this.params = { ...params };
    this.omega = 2 * Math.PI * (this.params.frequency || 50);
    const xr = Math.max(0.1, this.params.xrRatio);
    this.phi = Math.atan(xr);
    this.tau = xr / Math.max(1, this.omega);

    // IEC 60909 Kappa Peak Factor Formula: κ = 1.02 + 0.98 * exp(-3 * R/X) = 1.02 + 0.98 * exp(-3 / xr)
    this.kappa = 1.02 + 0.98 * Math.exp(-3 / xr);
    this.I_peak = Math.SQRT2 * this.params.I_rms;
  }

  /**
   * Update waveform parameters dynamically.
   */
  public setParams(params: WaveformParams): void {
    this.params = { ...params };
    this.omega = 2 * Math.PI * (this.params.frequency || 50);
    const xr = Math.max(0.1, this.params.xrRatio);
    this.phi = Math.atan(xr);
    this.tau = xr / Math.max(1, this.omega);
    this.kappa = 1.02 + 0.98 * Math.exp(-3 / xr);
    this.I_peak = Math.SQRT2 * this.params.I_rms;
  }

  /**
   * Returns IEC 60909 Peak Factor κ.
   */
  public getKappa(): number {
    return this.kappa;
  }

  /**
   * Returns IEC 60909 Peak Current i_peak = κ * √2 * I_rms.
   */
  public getPeakCurrent(): number {
    if (this.params.currentType === 'dc') return this.params.I_rms;
    return this.kappa * this.I_peak;
  }

  /**
   * Evaluates 3-phase instantaneous currents ia(t), ib(t), ic(t) and v_ln(t).
   */
  public generateThreePhaseCurrents(t: number): ThreePhaseCurrents {
    if (t < 0) {
      return { ia: 0, ib: 0, ic: 0, v_ln: 0 };
    }

    const isDC = this.params.currentType === 'dc';
    const is3Phase = this.params.systemType === '3ph_400v';
    const faultType = this.params.faultType;
    const V_nom = is3Phase ? 230 : 230; // Line to Neutral voltage
    const V_peak = Math.SQRT2 * V_nom;

    const v_ln = isDC ? V_nom : V_peak * Math.sin(this.omega * t + this.params.inceptionAngle);

    if (isDC) {
      // DC Mode
      const i_dc = this.params.I_rms;
      return {
        ia: i_dc,
        ib: is3Phase ? i_dc : 0,
        ic: is3Phase ? i_dc : 0,
        v_ln
      };
    }

    // AC Mode
    const theta = this.params.inceptionAngle;

    const calcPhase = (phaseShiftRad: number) => {
      const acTerm = Math.sin(this.omega * t + theta - this.phi + phaseShiftRad);
      const dcTerm = Math.sin(theta - this.phi + phaseShiftRad) * Math.exp(-t / this.tau);
      return this.I_peak * (acTerm - dcTerm);
    };

    let ia = calcPhase(0);
    let ib = 0;
    let ic = 0;

    if (is3Phase) {
      if (faultType === '3ph_bolted') {
        ib = calcPhase(- (2 * Math.PI / 3));
        ic = calcPhase(+(2 * Math.PI / 3));
      } else if (faultType === 'L-L') {
        // Line-to-Line fault between Phase A and B (magnitude factor sqrt(3)/2)
        ia = (Math.sqrt(3) / 2) * calcPhase(0);
        ib = -ia;
        ic = 0;
      } else if (faultType === 'L-G') {
        // Line-to-Ground fault on Phase A
        ia = calcPhase(0);
        ib = 0;
        ic = 0;
      }
    } else {
      // 1-Phase System (L-N or L-G)
      ia = calcPhase(0);
      ib = 0;
      ic = 0;
    }

    return { ia, ib, ic, v_ln };
  }

  /**
   * Evaluates single-phase line current i(t) at time t.
   */
  public generateTransientCurrent(t: number): number {
    return this.generateThreePhaseCurrents(t).ia;
  }

  /**
   * Evaluates steady-state sinusoidal AC load current or DC current.
   */
  public generateSteadyStateCurrent(t: number): number {
    if (t < 0) return 0;
    if (this.params.currentType === 'dc') return this.params.I_rms;
    return this.I_peak * Math.sin(this.omega * t + this.params.inceptionAngle);
  }

  /**
   * Evaluates DC interruption decay given time since unlatching t_arc (seconds) and inductance L (Henries).
   * i(t) = I_0 * exp(-t_arc / τ_arc) where τ_arc = L / R_arc
   */
  public generateDcDecayCurrent(I_initial: number, t_arc: number, inductanceH: number = 0.005): number {
    if (t_arc <= 0) return I_initial;
    const R_arc = Math.max(1.0, 100 / Math.max(1, I_initial)); // Arc resistance
    const tau_arc = Math.max(0.0005, inductanceH / R_arc);
    return I_initial * Math.exp(-t_arc / tau_arc);
  }

  /**
   * Computes DC stored inductive energy E_dc = ½ L I² (Joules).
   */
  public static calculateDcInductiveEnergy(I_amp: number, inductanceH: number = 0.005): number {
    return 0.5 * inductanceH * I_amp * I_amp;
  }

  public getTau(): number {
    return this.tau;
  }

  public getPhaseAngle(): number {
    return this.phi;
  }
}
