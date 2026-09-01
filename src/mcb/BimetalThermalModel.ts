import { MCBSpecification, ThermalState } from './types';

/**
 * IEC 60898-1 Bimetal Thermal Model (Table 7 Compliant)
 * 
 * Implements a first-order differential thermal model with thermal memory:
 * dT/dt = (I²·R_th - (T - T_amb)) / C_th_eff(I)
 * 
 * Calibrated strictly per IEC 60898-1 Table 7:
 * 1. At 1.13x In (Conventional non-tripping current Int), steady state temp < T_trip (NEVER trips <= 1h for In <= 63A).
 * 2. At 1.45x In (Conventional tripping current It), trips in <= 3600s (1h) for In <= 63A.
 * 3. At 2.55x In, trips in 1s - 60s (In <= 32A) or 1s - 90s (In > 32A) due to dynamic non-linear heating.
 * 4. Ambient temperature derating: -5°C to +40°C with α = 0.5% per °C from 30°C reference.
 * 5. Thermal memory: hot bimetal retains heat, accelerating subsequent trips upon hot re-closing.
 */
export class BimetalThermalModel {
  private spec: MCBSpecification;
  private currentTemp: number;
  private ambientTemp: number;

  constructor(spec: MCBSpecification, initialAmbientTemp: number = 30) {
    this.spec = { ...spec };
    this.ambientTemp = initialAmbientTemp;
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

    // Steady state ΔT at 1.13x In is 90°C (< 100°C trip rise)
    // (1.13 * In)^2 * R_th = 90 => R_th = 90 / (1.2769 * In^2) = 70.4832 / In^2
    const R_th = 70.4832015 / (In * In);

    // Baseline C_th chosen so at 1.45x In (ΔT_ss = 148.19°C), ΔT reaches 100°C in ~2246s (<= 3600s)
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
   * Calculates dynamic effective thermal capacity C_th_eff for a given current ratio I / In.
   * At heavy overloads (I > 1.45x In), heat transfer shifts towards adiabatic heating,
   * accelerating trip times to meet IEC 60898-1 Table 7 (2.55x In in 1-60s).
   */
  public getEffectiveCth(currentAmp: number): number {
    const ratio = Math.abs(currentAmp) / Math.max(1, this.spec.In);
    if (ratio <= 1.45) {
      return this.spec.C_th; // 2000s
    }
    // Non-linear acceleration above 1.45x In
    const overloadDelta = ratio - 1.45;
    const acceleration = 1.0 + 18.0 * Math.pow(overloadDelta / 1.1, 1.8);
    return Math.max(5.0, this.spec.C_th / acceleration);
  }

  /**
   * Calculates ambient-derated nominal current rating.
   * I_n_adj = I_n * [ 1 - α * (T_amb - 30) ]
   */
  public getDeratedRatedCurrent(): number {
    const deltaAmb = this.ambientTemp - this.spec.referenceAmbientTemp;
    const factor = 1.0 - this.spec.ambientDeratingCoeff * deltaAmb;
    return this.spec.In * Math.max(0.4, factor);
  }

  /**
   * Returns absolute trip temperature threshold (°C).
   */
  public getTripTemperatureThreshold(): number {
    return this.spec.referenceAmbientTemp + this.spec.tripTempRise;
  }

  /**
   * Resets thermal state (or maintains existing temperature for hot re-close).
   */
  public reset(ambientTemp: number = this.ambientTemp, keepEnthalpy: boolean = false): void {
    this.ambientTemp = ambientTemp;
    if (!keepEnthalpy) {
      this.currentTemp = ambientTemp;
    } else {
      // Ensure temp is at least ambient
      this.currentTemp = Math.max(this.ambientTemp, this.currentTemp);
    }
  }

  /**
   * Sets current bimetal temperature explicitly (useful for thermal memory testing).
   */
  public setTemperature(temp: number): void {
    this.currentTemp = temp;
  }

  /**
   * Advances the thermal model by time step dt (seconds) given current in Amperes.
   * Uses exact discrete exponential solution:
   * T(t + dt) = T_ss + (T(t) - T_ss) * exp(-dt / C_th_eff)
   */
  public step(currentAmp: number, dt: number): ThermalState {
    if (dt <= 0) return this.getState();

    const heatPower = currentAmp * currentAmp * this.spec.R_th;
    const T_ss = this.ambientTemp + heatPower;
    const cthEff = this.getEffectiveCth(currentAmp);

    const decayFactor = Math.exp(-dt / cthEff);
    this.currentTemp = T_ss + (this.currentTemp - T_ss) * decayFactor;

    return this.getState();
  }

  /**
   * Evaluates thermal state for a constant RMS current over duration t (seconds).
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
   * Analytical calculation of trip time from cold reference state (or current temperature) for a given RMS current.
   * Returns Infinity if current will never cause trip (e.g. 1.13x In).
   */
  public calculateTheoreticalTripTime(
    rmsCurrentAmp: number,
    ambientTemp: number = this.ambientTemp,
    startTemp: number = ambientTemp
  ): number {
    const T_ss = ambientTemp + rmsCurrentAmp * rmsCurrentAmp * this.spec.R_th;
    const T_trip = this.getTripTemperatureThreshold();

    if (T_ss <= T_trip) {
      return Infinity; // Will never trip
    }

    if (startTemp >= T_trip) {
      return 0; // Already tripped
    }

    const cthEff = this.getEffectiveCth(rmsCurrentAmp);
    const ratio = (T_ss - T_trip) / (T_ss - startTemp);
    if (ratio <= 0) return 0;
    return -cthEff * Math.log(ratio);
  }
}
