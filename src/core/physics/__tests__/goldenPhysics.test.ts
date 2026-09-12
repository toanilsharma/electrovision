/**
 * HomeGuard Non-Regression Golden Physics Tests (R4)
 * 
 * MUST PASS AFTER EVERY PROMPT:
 * 1. MCB 1.45xIn -> t ≈ 2246.7s
 * 2. Ik3 = 15.34 kA
 * 3. 230V dry Z per IEC 60479 Table 1
 * 4. 30mA RCD <= 40ms at 5xIdn
 * 5. Step & Touch 921V IEEE 80 benchmark example
 */

import { describe, it, expect } from 'vitest';
import {
  createMCB,
  createRCD,
  bodyCurrent,
  calculateIECImpedance,
  calculateShortCircuit,
  createStepTouchEngine
} from '../index';

describe('HomeGuard Golden Physics Tests (R4 Protocol Invariants)', () => {

  // ==========================================================================
  // INVARIANT 1: MCB Thermal Overload 1.45x In Trip Time
  // ==========================================================================
  it('Golden 1: MCB 1.45xIn -> t ≈ 2246.7s trip time', () => {
    const mcb = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    const In = mcb.spec.In;
    const testCurrent = 1.45 * In; // 23.2 A

    // Thermal simulation stepping with 1.0s resolution
    const snap = mcb.runThermalSimulation(testCurrent, 2500, 1.0);

    expect(snap.thermal.isTripped).toBe(true);
    expect(snap.time).toBeGreaterThan(2240);
    expect(snap.time).toBeLessThan(2255);
    expect(snap.time).toBeCloseTo(2246.7, 0);
  });

  // ==========================================================================
  // INVARIANT 2: IEC 60909 Symmetrical 3-Phase Short Circuit Current
  // ==========================================================================
  it('Golden 2: Ik3 = 15.34 kA for 630kVA, uk=6%, 415V, c=1.05', () => {
    const res = calculateShortCircuit({
      transformerKVA: 630,
      ukPercent: 6.0,
      voltageUn: 415,
      voltageFactorC: 1.05,
      cableLengthM: 0,
      cableSizeMm2: 16,
      z0z1Ratio: 1.7,
      faultType: 'three_phase',
      protectionSpeed: 'fast',
      isLimitingBreaker: false
    });

    // Ik3 = (1.05 * 415) / (sqrt(3) * Z_T) = 15.34 kA
    expect(res.Ik3_kA).toBeCloseTo(15.34, 1);
  });

  // ==========================================================================
  // INVARIANT 3: IEC 60479-1:2018 Table 1 Total Body Impedance at 230V Dry
  // ==========================================================================
  it('Golden 3: 230V dry body impedance Z_T per IEC 60479 Table 1', () => {
    const z5 = calculateIECImpedance(230, { percentile: 5, skinCondition: 'dry', contactArea: 'large', path: 'hand-to-hand' });
    const z50 = calculateIECImpedance(230, { percentile: 50, skinCondition: 'dry', contactArea: 'large', path: 'hand-to-hand' });
    const z95 = calculateIECImpedance(230, { percentile: 95, skinCondition: 'dry', contactArea: 'large', path: 'hand-to-hand' });

    expect(z5.totalZ).toBe(1000);
    expect(z50.totalZ).toBe(2150);
    expect(z95.totalZ).toBe(2800);

    // Verify bodyCurrent factory returns matching Ohm's law shock current
    const shock = bodyCurrent({ voltage: 230, percentile: 50, skinCondition: 'dry', path: 'hand-to-hand' });
    expect(shock.totalZ).toBe(2150);
    expect(shock.currentMA).toBeCloseTo((230 / 2150) * 1000, 2); // 106.98 mA
    expect(shock.zone.zone).toBe('AC-3');

    // Hand-to-foot path with 5th percentile at 230V pushes into severe ventricular fibrillation risk AC-4.2
    const shockH2F = bodyCurrent({ voltage: 230, percentile: 5, skinCondition: 'dry', path: 'hand-to-foot', durationMs: 1000 });
    expect(shockH2F.zone.zone).toBe('AC-4.2');
  });

  // ==========================================================================
  // INVARIANT 4: IEC 61008-1 30mA RCD Break Time <= 40ms at 5x Idn
  // ==========================================================================
  it('Golden 4: 30mA RCD trip time <= 40ms at 5xIdn (150mA)', () => {
    const rcd = createRCD({ rating: 'rcbo_30ma', iDeltaN: 30 });
    const fault150mA = 5 * 30; // 150 mA
    const trip = rcd.evaluate(fault150mA);

    expect(trip.shouldTrip).toBe(true);
    expect(trip.tripTimeMs).toBeLessThanOrEqual(40);
    expect(trip.tripTimeMs).toBe(40);
    expect(trip.multiple).toBe(5.0);

    // Non-trip below 0.5x Idn (< 15mA)
    const hold = rcd.evaluate(14);
    expect(hold.shouldTrip).toBe(false);
    expect(hold.tripTimeMs).toBe(Infinity);
  });

  // ==========================================================================
  // INVARIANT 5: IEEE Std 80-2000 Benchmark Example (921V Tolerable Touch)
  // ==========================================================================
  it('Golden 5: Step & Touch 921V IEEE 80 benchmark example', () => {
    const engine = createStepTouchEngine({
      bodyWeightKg: 70,
      clearingTimeSec: 0.5,
      surfaceResistivity: 3000, // Dry gravel
      soilResistivity: 100,
      layerThicknessM: 0.10,
      faultCurrentKA: 22,
      gridResistanceOhm: 0.5
    });

    // Derating factor Cs = 0.700
    expect(engine.Cs).toBeCloseTo(0.700, 2);

    // Tolerable touch potential E_touch = 921.4 V ≈ 921 V
    expect(engine.E_touch_tolerable).toBeCloseTo(921.4, 0);
    expect(Math.round(engine.E_touch_tolerable)).toBe(921);

    // Tolerable step potential E_step
    expect(engine.E_step_tolerable).toBeGreaterThan(2500);
  });

  // ==========================================================================
  // INVARIANT 6: Instance-Safety (R5 Split-Screen Multi-Instance Test)
  // ==========================================================================
  it('Golden 6: Multiple instances maintain isolated state (R5 Instance-Safe)', () => {
    const breakerA = createMCB({ In: 16, curve: 'B' });
    const breakerB = createMCB({ In: 32, curve: 'D' });

    breakerA.step(0.1, 100); // Trigger magnetic/thermal on Breaker A
    expect(breakerA.getSnapshot().thermal.temperature).toBeGreaterThan(30);

    // Breaker B must be completely untouched and clean
    expect(breakerB.getSnapshot().thermal.temperature).toBe(30);
    expect(breakerB.spec.In).toBe(32);
    expect(breakerA.spec.In).toBe(16);
  });

});
