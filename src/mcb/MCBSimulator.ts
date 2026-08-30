import { BimetalThermalModel } from './BimetalThermalModel';
import { FaultWaveformGenerator } from './FaultWaveformGenerator';
import { MagneticSolenoidModel } from './MagneticSolenoidModel';
import {
  LetThroughMetrics,
  MCBSpecification,
  MCBState,
  SimulationSnapshot,
  ThreePhaseCurrents,
  TripCause,
  WaveformParams
} from './types';

/**
 * IEC 60898-1 Miniature Circuit Breaker (MCB) Simulator Engine
 * 
 * Coordinates:
 * - First-order thermal bimetal model with memory & ambient temperature derating In_eff
 * - Solenoid magnetic instantaneous trip with curve B, C, D tolerance zones and IEC 60909 κ-peak factor
 * - 1-Phase / 3-Phase AC fault current waveform generation and DC mode interruption
 * - Mechanical unlatching delay <= half cycle (10ms) with magnetic pickup flash
 * - Contact unlatching, current zero crossing detection, arc extinction & let-through energy (I²t, Ip, ½LI²)
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
  private dcDecayEnergyJoules: number = 0;

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
    this.dcDecayEnergyJoules = 0;
    this.thermalModel.reset(ambientTemp);
  }

  /**
   * Advances the simulation by a single time step dt (seconds).
   */
  public step(dt: number, externalCurrent?: number, randomToleranceSeed?: number): SimulationSnapshot {
    this.currentTime += dt;

    let threePhase: ThreePhaseCurrents = { ia: 0, ib: 0, ic: 0, v_ln: 0 };

    if (this.state === MCBState.OPEN_CLEARED) {
      threePhase = { ia: 0, ib: 0, ic: 0, v_ln: 0 };
    } else if (externalCurrent !== undefined) {
      threePhase = { ia: externalCurrent, ib: 0, ic: 0, v_ln: 230 * Math.SQRT2 * Math.sin(100 * Math.PI * this.currentTime) };
    } else if (this.waveformGen) {
      threePhase = this.waveformGen.generateThreePhaseCurrents(this.currentTime);
    }

    let current = threePhase.ia;

    // Step thermal model
    const thermalStateBase = this.thermalModel.step(current, dt);
    const thermalState = {
      ...thermalStateBase,
      In_eff: this.thermalModel.getDeratedRatedCurrent()
    };

    // Step magnetic model
    const magneticStateBase = this.magneticModel.evaluate(current, randomToleranceSeed);
    const kappa = this.waveformGen ? this.waveformGen.getKappa() : (1.02 + 0.98 * Math.exp(-3 / 10));
    const magneticState = {
      ...magneticStateBase,
      kappaPeakFactor: kappa
    };

    // Track let-through metrics while circuit is closed or arcing
    if (this.state !== MCBState.OPEN_CLEARED) {
      const absCurrent = Math.abs(current);
      if (absCurrent > this.peakLetThroughCurrent) {
        this.peakLetThroughCurrent = absCurrent;
      }

      // Trapezoidal integration of I²t
      const prevI2 = this.previousCurrent * this.previousCurrent;
      const currI2 = current * current;
      this.cumulativeI2t += 0.5 * (prevI2 + currI2) * dt;

      // DC Inductive Energy ½ L I²
      this.dcDecayEnergyJoules = FaultWaveformGenerator.calculateDcInductiveEnergy(this.peakLetThroughCurrent, 0.005);
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
        this.state = MCBState.ARCING;
        this.contactSeparationTime = this.currentTime;
      }
    }

    if (this.state === MCBState.ARCING) {
      if (!this.zeroCrossingDetected) {
        if (this.previousCurrent * current <= 0 || Math.abs(current) < 1e-6) {
          this.zeroCrossingDetected = true;
          this.zeroCrossingTime = this.currentTime;
        }
      }

      if (this.zeroCrossingDetected) {
        if (this.currentTime - this.zeroCrossingTime >= this.spec.arcDuration) {
          this.state = MCBState.OPEN_CLEARED;
          current = 0;
          threePhase = { ia: 0, ib: 0, ic: 0, v_ln: 0 };
        }
      }
    }

    this.previousCurrent = current;

    const letThrough: LetThroughMetrics = {
      i2t: this.cumulativeI2t,
      dcDecayEnergyJoules: this.dcDecayEnergyJoules,
      peakLetThroughCurrent: this.peakLetThroughCurrent,
      clearingTime: this.state === MCBState.OPEN_CLEARED ? this.currentTime - this.tripTriggerTime : 0
    };

    return {
      time: this.currentTime,
      current,
      threePhase,
      state: this.state,
      thermal: thermalState,
      magnetic: magneticState,
      tripCause: this.tripCause,
      letThrough
    };
  }

  /**
   * Convenience runner for steady-state thermal loading test (e.g., 1.13x In or 1.45x In).
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
