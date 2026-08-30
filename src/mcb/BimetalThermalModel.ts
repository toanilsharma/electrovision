import { MCBSpecification, ThermalState } from './types';

/**
 * IEC 60898-1 Bimetal Thermal Model
 * 
 * Implements a first-order differential thermal model with thermal memory:
 * dT/dt = (I²·R_th - (T - T_amb)) / C_th
 * 
 * Includes ambient temperature derating and calibrated parameters to ensure:
 * 1. At 1.13x In (Conventional non-tripping current Int), steady state temp < T_trip (NEVER trips).
 * 2. At 1.45x In (Conventional tripping current It), trips in <= 3600s for In <= 63A.
 */
export class BimetalThermalModel {
  private spec: MCBSpecification;
  private currentTemp: number;
  private ambientTemp: number;

  constructor(spec: MCBSpecification, initialAmbientTemp: number = 30) {
    this.spec = { ...spec };
    this.ambientTemp = initialAmbientTemp;
    // Initial temperature starts at ambient temperature
    this.currentTemp = initialAmbientTemp;
  }

  /**
   * Factory function to create standard IEC 60898-1 calibrated specifications for a rated current In.
   */
  public static createCalibratedSpec(
    In: number,
    curve: 'B' | 'C' | 'D' = 'C',
    ambientTemp: number = 30
  ): MCBSpecification {
    const referenceAmbientTemp = 30;
    const tripTempRise = 100; // 100°C rise above 30°C reference -> trip at 130°C absolute

    // Steady state ΔT at 1.13x In set to 90°C (< 100°C trip rise)
    // (1.13 * In)^2 * R_th = 90 => R_th = 90 / (1.2769 * In^2) = 70.4832 / In^2
    const R_th = 70.4832015 / (In * In);

    // C_th chosen so that at 1.45x In (where ΔT_ss = 148.19°C), ΔT reaches 100°C in ~2250 seconds (<= 3600s)
    // 148.19 * (1 - exp(-2250 / C_th)) = 100 => C_th ≈ 2000 seconds
    const C_th = 2000.0;

    return {
      In,
      curve,
      referenceAmbientTemp,
      tripTempRise,
      R_th,
      C_th,
      ambientDeratingCoeff: 0.005, // -0.5% per °C above reference
      magneticUnlatchDelay: 0.001, // 1 ms
      thermalUnlatchDelay: 0.005,  // 5 ms
      arcDuration: 0.0025          // 2.5 ms
    };
  }

  /**
   * Calculates ambient-derated nominal current rating.
   * I_n_adj = I_n * [ 1 - α * (T_amb - 30) ]
   */
  public getDeratedRatedCurrent(): number {
    const deltaAmb = this.ambientTemp - this.spec.referenceAmbientTemp;
    const factor = 1.0 - this.spec.ambientDeratingCoeff * deltaAmb;
    return this.spec.In * Math.max(0.5, factor);
  }

  /**
   * Returns absolute trip temperature threshold (°C).
   */
  public getTripTemperatureThreshold(): number {
    return this.spec.referenceAmbientTemp + this.spec.tripTempRise;
  }

  /**
   * Resets thermal state to ambient temperature.
   */
  public reset(ambientTemp: number = this.ambientTemp): void {
    this.ambientTemp = ambientTemp;
    this.currentTemp = ambientTemp;
  }

  /**
   * Advances the thermal model by time step dt (seconds) given current (instantaneous or RMS) in Amperes.
   * Uses exact discrete exponential solution to the first-order differential equation:
   * dT/dt = (I² · R_th - (T - T_amb)) / C_th
   */
  public step(currentAmp: number, dt: number): ThermalState {
    if (dt <= 0) return this.getState();

    // Heat generation term: P_th = I² * R_th
    const heatPower = currentAmp * currentAmp * this.spec.R_th;
    const T_ss = this.ambientTemp + heatPower;

    // Exact analytical update for step dt:
    // T(t + dt) = T_ss + (T(t) - T_ss) * exp(-dt / C_th)
    const decayFactor = Math.exp(-dt / this.spec.C_th);
    this.currentTemp = T_ss + (this.currentTemp - T_ss) * decayFactor;

    return this.getState();
  }

  /**
   * Evaluates thermal state for a constant RMS current over duration t (seconds) starting from current state.
   */
  public stepRms(rmsCurrentAmp: number, durationSec: number): ThermalState {
    return this.step(rmsCurrentAmp, durationSec);
  }

  /**
   * Returns current thermal state.
   */
  public getState(): ThermalState {
    const tempRise = this.currentTemp - this.ambientTemp;
    const tripThreshold = this.getTripTemperatureThreshold();
    const isTripped = this.currentTemp >= tripThreshold;

    // Thermal memory ratio: fraction of allowable temperature rise reached above reference ambient
    const totalAllowableRise = this.spec.tripTempRise;
    const currentRiseFromRef = Math.max(0, this.currentTemp - this.spec.referenceAmbientTemp);
    const thermalMemoryRatio = Math.min(1.0, currentRiseFromRef / totalAllowableRise);

    return {
      temperature: this.currentTemp,
      tempRise,
      ambientTemp: this.ambientTemp,
      In_eff: this.getDeratedRatedCurrent(),
      thermalMemoryRatio,
      isTripped
    };
  }

  /**
   * Analytical calculation of steady-state temperature for a given RMS current.
   */
  public getSteadyStateTemp(rmsCurrentAmp: number): number {
    return this.ambientTemp + rmsCurrentAmp * rmsCurrentAmp * this.spec.R_th;
  }

  /**
   * Analytical calculation of trip time from cold reference state (30°C) for a given RMS current.
   * Returns Infinity if current will never cause trip (e.g. 1.13x In).
   */
  public calculateTheoreticalTripTime(rmsCurrentAmp: number, ambientTemp: number = 30): number {
    const T_ss = ambientTemp + rmsCurrentAmp * rmsCurrentAmp * this.spec.R_th;
    const T_trip = this.getTripTemperatureThreshold();

    if (T_ss <= T_trip) {
      return Infinity; // Will never trip
    }

    // T_trip = T_ss + (ambientTemp - T_ss) * exp(-t / C_th)
    // exp(-t / C_th) = (T_ss - T_trip) / (T_ss - ambientTemp)
    const ratio = (T_ss - T_trip) / (T_ss - ambientTemp);
    return -this.spec.C_th * Math.log(ratio);
  }
}
