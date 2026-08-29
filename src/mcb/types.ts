/**
 * IEC 60898-1 Miniature Circuit Breaker (MCB) Simulator Types & Interfaces
 */

export type MCBTrippingCurve = 'B' | 'C' | 'D';

export enum MCBState {
  CLOSED = 'CLOSED',
  UNLATCHED = 'UNLATCHED',
  ARCING = 'ARCING',
  OPEN_CLEARED = 'OPEN_CLEARED'
}

export enum TripCause {
  NONE = 'NONE',
  THERMAL = 'THERMAL',
  MAGNETIC = 'MAGNETIC',
  MAGNETIC_TOLERANCE_ZONE = 'MAGNETIC_TOLERANCE_ZONE'
}

export interface MCBSpecification {
  /** Rated current In (Amperes), e.g., 16A, 32A, 63A */
  In: number;

  /** Instantaneous magnetic tripping characteristic curve */
  curve: MCBTrippingCurve;

  /** Reference ambient temperature in °C (IEC 60898-1 standard is 30°C) */
  referenceAmbientTemp: number;

  /** Bimetal trip temperature rise ΔT_trip above ambient (°C) */
  tripTempRise: number;

  /** Thermal resistance R_th (°C / A²) */
  R_th: number;

  /** Thermal heat capacity C_th (Joules / °C or seconds time constant factor) */
  C_th: number;

  /** Ambient temperature derating factor per °C above reference (default: 0.005 / °C = -0.5%/°C) */
  ambientDeratingCoeff: number;

  /** Mechanical unlatching delay for magnetic trip (seconds, e.g. 0.001s = 1ms) */
  magneticUnlatchDelay: number;

  /** Mechanical unlatching delay for thermal trip (seconds, e.g. 0.005s = 5ms) */
  thermalUnlatchDelay: number;

  /** Arc duration after current zero crossing (seconds, e.g. 0.0025s = 2.5ms) */
  arcDuration: number;
}

export interface WaveformParams {
  /** Fault RMS current (Amperes) */
  I_rms: number;

  /** System frequency (Hz), default 50Hz */
  frequency: number;

  /** Fault inception angle θ (radians) */
  inceptionAngle: number;

  /** X/R ratio of system impedance */
  xrRatio: number;
}

export interface ThermalState {
  /** Current absolute temperature (°C) */
  temperature: number;

  /** Current temperature rise ΔT above ambient (°C) */
  tempRise: number;

  /** Ambient temperature (°C) */
  ambientTemp: number;

  /** Thermal memory fraction (0.0 to 1.0, where 1.0 = fully hot at trip point) */
  thermalMemoryRatio: number;

  /** True if bimetal has reached trip threshold */
  isTripped: boolean;
}

export interface MagneticState {
  /** Instantaneous peak current evaluated (Amperes) */
  peakCurrent: number;

  /** Multiple of rated peak current (I_peak / (In * sqrt(2))) */
  multipleOfIn: number;

  /** True if instantaneous current is inside the magnetic tolerance zone */
  isToleranceZone: boolean;

  /** True if magnetic trip trigger condition is satisfied */
  isTripped: boolean;

  /** Trip probability in tolerance zone (0.0 to 1.0) */
  toleranceProbability: number;
}

export interface LetThroughMetrics {
  /** Cumulative let-through energy ∫ i(t)² dt (A²s) */
  i2t: number;

  /** Peak let-through current Ip (Amperes) */
  peakLetThroughCurrent: number;

  /** Total clearing time from fault inception to arc extinction (seconds) */
  clearingTime: number;
}

export interface SimulationSnapshot {
  /** Simulation time t (seconds) */
  time: number;

  /** Instantaneous line current i(t) (Amperes) */
  current: number;

  /** MCB mechanical / electrical state */
  state: MCBState;

  /** Thermal bimetal model state */
  thermal: ThermalState;

  /** Magnetic solenoid model state */
  magnetic: MagneticState;

  /** Cause of trip trigger */
  tripCause: TripCause;

  /** Real-time cumulative let-through metrics */
  letThrough: LetThroughMetrics;
}
