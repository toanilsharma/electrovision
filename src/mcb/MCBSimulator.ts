import { BimetalThermalModel } from './BimetalThermalModel';
import { FaultWaveformGenerator } from './FaultWaveformGenerator';
import { MagneticSolenoidModel } from './MagneticSolenoidModel';
import {
  LetThroughMetrics,
  MCBSpecification,
  MCBState,
  SimulationSnapshot,
  TripCause,
  WaveformParams
} from './types';

/**
 * IEC 60898-1 Miniature Circuit Breaker (MCB) Simulator Engine
 * 
 * Coordinates:
 * - First-order thermal bimetal model with memory & ambient temperature derating
 * - Solenoid magnetic instantaneous trip with curve B, C, D tolerance zones
 * - Decaying DC offset fault waveform generation
 * - Contact unlatching, current zero crossing detection, arc extinction & let-through energy (I²t & Ip)
 */
export class MCBSimulator {
  private spec: MCBSpecification;
  private thermalModel: BimetalThermalModel;
  private magneticModel: MagneticSolenoidModel;
  private waveformGen: FaultWaveformGenerator | null = null;

  // Simulator operational state
  private state: MCBState = MCBState.CLOSED;
  private tripCause: TripCause = TripCause.NONE;
  private currentTime: number = 0;

  // Internal state tracking timers
  private tripTriggerTime: number = -1;
  private contactSeparationTime: number = -1;
  private zeroCrossingDetected: boolean = false;
  private zeroCrossingTime: number = -1;
  private previousCurrent: number = 0;

  // Let-through metrics
  private cumulativeI2t: number = 0;
  private peakLetThroughCurrent: number = 0;

  constructor(spec?: MCBSpecification, initialAmbientTemp: number = 30) {
    this.spec = spec || BimetalThermalModel.createCalibratedSpec(16, 'C', initialAmbientTemp);
    this.thermalModel = new BimetalThermalModel(this.spec, initialAmbientTemp);
    this.magneticModel = new MagneticSolenoidModel(this.spec.In, this.spec.curve);
  }

  /**
   * Initialize or update fault waveform generator parameters.
   */
  public setFaultWaveform(params: WaveformParams): void {
    if (!this.waveformGen) {
      this.waveformGen = new FaultWaveformGenerator(params);
    } else {
      this.waveformGen.setParams(params);
    }
  }

  /**
   * Resets simulation state to initial closed condition.
   */
  public reset(ambientTemp?: number): void {
    this.state = MCBState.CLOSED;
    this.tripCause = TripCause.NONE;
    this.currentTime = 0;
    this.tripTriggerTime = -1;
    this.contactSeparationTime = -1;
    this.zeroCrossingDetected = false;
    this.zeroCrossingTime = -1;
    this.previousCurrent = 0;
    this.cumulativeI2t = 0;
    this.peakLetThroughCurrent = 0;
    this.thermalModel.reset(ambientTemp);
  }

  /**
   * Advances the simulation by a single time step dt (seconds).
   * 
   * @param dt Time step in seconds
   * @param externalCurrent Optional external current input (if waveform generator is not used)
   * @param randomToleranceSeed Seed for tolerance band magnetic tripping (0 to 1)
   */
  public step(dt: number, externalCurrent?: number, randomToleranceSeed?: number): SimulationSnapshot {
    this.currentTime += dt;

    // Determine current line current
    let current = 0;
    if (this.state === MCBState.OPEN_CLEARED) {
      current = 0;
    } else if (externalCurrent !== undefined) {
      current = externalCurrent;
    } else if (this.waveformGen) {
      current = this.waveformGen.generateTransientCurrent(this.currentTime);
    } else {
      current = 0;
    }

    // Step thermal model
    const thermalState = this.thermalModel.step(current, dt);

    // Step magnetic model
    const magneticState = this.magneticModel.evaluate(current, randomToleranceSeed);

    // Track let-through metrics while circuit is closed or arcing
    if (this.state !== MCBState.OPEN_CLEARED) {
      const absCurrent = Math.abs(current);
      if (absCurrent > this.peakLetThroughCurrent) {
        this.peakLetThroughCurrent = absCurrent;
      }

      // Numerical trapezoidal integration of I²t: 0.5 * (i1² + i2²) * dt
      const prevI2 = this.previousCurrent * this.previousCurrent;
      const currI2 = current * current;
      this.cumulativeI2t += 0.5 * (prevI2 + currI2) * dt;
    }

    // Check tripping logic if currently CLOSED
    if (this.state === MCBState.CLOSED) {
      if (magneticState.isTripped) {
        this.state = MCBState.UNLATCHED;
        this.tripTriggerTime = this.currentTime;
        this.tripCause = magneticState.isToleranceZone
          ? TripCause.MAGNETIC_TOLERANCE_ZONE
          : TripCause.MAGNETIC;
      } else if (thermalState.isTripped) {
        this.state = MCBState.UNLATCHED;
        this.tripTriggerTime = this.currentTime;
        this.tripCause = TripCause.THERMAL;
      }
    }

    // State machine transitions: UNLATCHED -> ARCING -> OPEN_CLEARED
    if (this.state === MCBState.UNLATCHED) {
      const unlatchDelay = this.tripCause === TripCause.THERMAL
        ? this.spec.thermalUnlatchDelay
        : this.spec.magneticUnlatchDelay;

      if (this.currentTime - this.tripTriggerTime >= unlatchDelay) {
        // Mechanism unlatched -> contacts separate, arc drawn
        this.state = MCBState.ARCING;
        this.contactSeparationTime = this.currentTime;
      }
    }

    if (this.state === MCBState.ARCING) {
      // Check for current zero crossing after contact separation
      if (!this.zeroCrossingDetected) {
        // Zero crossing occurred if current flips sign or reaches zero
        if (this.previousCurrent * current <= 0 || Math.abs(current) < 1e-6) {
          this.zeroCrossingDetected = true;
          this.zeroCrossingTime = this.currentTime;
        }
      }

      // If zero crossing detected, wait for arc duration before extinguishing
      if (this.zeroCrossingDetected) {
        if (this.currentTime - this.zeroCrossingTime >= this.spec.arcDuration) {
          this.state = MCBState.OPEN_CLEARED;
          current = 0; // Current completely interrupted
        }
      }
    }

    this.previousCurrent = current;

    const letThrough: LetThroughMetrics = {
      i2t: this.cumulativeI2t,
      peakLetThroughCurrent: this.peakLetThroughCurrent,
      clearingTime: this.state === MCBState.OPEN_CLEARED ? this.currentTime - this.tripTriggerTime : 0
    };

    return {
      time: this.currentTime,
      current,
      state: this.state,
      thermal: thermalState,
      magnetic: magneticState,
      tripCause: this.tripCause,
      letThrough
    };
  }

  /**
   * Convenience runner for steady-state thermal loading test (e.g., 1.13x In or 1.45x In).
   * Runs fast thermal simulation using analytical step.
   */
  public runThermalSimulation(rmsCurrent: number, durationSeconds: number, stepSec: number = 1.0): SimulationSnapshot {
    this.reset();
    let snapshot: SimulationSnapshot = this.step(0, rmsCurrent);

    const totalSteps = Math.ceil(durationSeconds / stepSec);
    for (let i = 0; i < totalSteps; i++) {
      snapshot = this.step(stepSec, rmsCurrent);
      if (snapshot.state !== MCBState.CLOSED) {
        break;
      }
    }

    return snapshot;
  }

  /**
   * Accessors
   */
  public getState(): MCBState {
    return this.state;
  }

  public getTripCause(): TripCause {
    return this.tripCause;
  }

  public getSpec(): MCBSpecification {
    return { ...this.spec };
  }

  public getThermalModel(): BimetalThermalModel {
    return this.thermalModel;
  }

  public getMagneticModel(): MagneticSolenoidModel {
    return this.magneticModel;
  }
}
