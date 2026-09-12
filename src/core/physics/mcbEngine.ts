/**
 * IEC 60898-1 Miniature Circuit Breaker (MCB) Pure Factory Engine
 * 
 * Instance-safe factory per R2 & R5:
 * createMCB(cfg) returns an independent breaker instance with isolated thermal
 * and magnetic state for split-screen / multi-device simulation.
 */

import { MCBSimulator } from '@/src/mcb/MCBSimulator';
import { BimetalThermalModel } from '@/src/mcb/BimetalThermalModel';
import { MagneticSolenoidModel } from '@/src/mcb/MagneticSolenoidModel';
import {
  MCBSpecification,
  SimulationSnapshot,
  WaveformParams
} from '@/src/mcb/types';
import { MCBEngineConfig } from './types';

export interface MCBEngineInstance {
  spec: MCBSpecification;
  step: (dt: number, externalCurrent?: number, randomToleranceSeed?: number) => SimulationSnapshot;
  reset: (ambientTemp?: number) => void;
  runThermalSimulation: (rmsCurrent: number, durationSeconds: number, stepSec?: number) => SimulationSnapshot;
  getSnapshot: () => SimulationSnapshot;
  setFaultWaveform: (params: WaveformParams) => void;
  getRawSimulator: () => MCBSimulator;
}

/**
 * Pure Factory function to create an isolated, instance-safe MCB engine.
 */
export function createMCB(cfg: MCBEngineConfig = {}): MCBEngineInstance {
  const { In = 16, curve = 'C', ambientTemp = 30 } = cfg;
  const spec = BimetalThermalModel.createCalibratedSpec(In, curve, ambientTemp);
  const sim = new MCBSimulator(spec, ambientTemp);
  let lastSnapshot: SimulationSnapshot = sim.step(0);

  return {
    spec,
    step: (dt: number, externalCurrent?: number, randomToleranceSeed?: number) => {
      lastSnapshot = sim.step(dt, externalCurrent, randomToleranceSeed);
      return lastSnapshot;
    },
    reset: (amb?: number) => {
      sim.reset(amb);
      lastSnapshot = sim.step(0);
    },
    runThermalSimulation: (rmsCurrent: number, durationSeconds: number, stepSec: number = 1.0) => {
      lastSnapshot = sim.runThermalSimulation(rmsCurrent, durationSeconds, stepSec);
      return lastSnapshot;
    },
    getSnapshot: () => lastSnapshot,
    setFaultWaveform: (params: WaveformParams) =>
      sim.setFaultWaveform(params),
    getRawSimulator: () => sim,
  };
}

export {
  MCBSimulator,
  BimetalThermalModel,
  MagneticSolenoidModel
};
