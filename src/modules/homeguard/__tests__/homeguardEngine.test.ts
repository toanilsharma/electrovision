/**
 * HomeGuard Physics Engine Tests & Cockpit Parity Acceptance (HG3)
 * 
 * Verifies that HomeGuard residential scenarios consume pure physics from src/core/physics
 * and produce identical countdown and tripping behavior as the MCB cockpit.
 */

import { describe, it, expect } from 'vitest';
import { createMCB } from '../../../core/physics/mcbEngine';
import { createRCD } from '../../../core/physics/rcdEngine';
import { MCBState, TripCause } from '../../../mcb/types';
import {
  RESIDENTIAL_SCENARIOS,
  RESIDENTIAL_CIRCUITS,
  AVAILABLE_APPLIANCES
} from '../data/residentialProfile';

describe('HomeGuard Core Physics & Scenario Integration (HG3)', () => {

  // ==========================================================================
  // 1. Overload Countdown & Trip Parity with MCB Cockpit
  // ==========================================================================
  it('Overload Scenario: 23.2A (1.45x In on 16A C-curve) trips at t ≈ 2246.7s via CORE engine', () => {
    // 16A C-curve socket breaker
    const breaker = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    const In = breaker.spec.In;
    const overloadCurrent = 1.45 * In; // 23.2 A

    // Verify theoretical calculation matches the cockpit invariant
    const theoreticalTripTime = breaker
      .getRawSimulator()
      .getThermalModel()
      .calculateTheoreticalTripTime(overloadCurrent, 30);

    expect(theoreticalTripTime).toBeCloseTo(2246.7, 0);

    // Verify dynamic thermal stepped simulation reaches trip point
    const snap = breaker.runThermalSimulation(overloadCurrent, 2500, 1.0);
    expect(snap.state).not.toBe(MCBState.CLOSED);
    expect(snap.tripCause).toBe(TripCause.THERMAL);
    expect(snap.time).toBeCloseTo(2246.7, 0);
  });

  // ==========================================================================
  // 2. Short Circuit Instantaneous Magnetic Trip
  // ==========================================================================
  it('Short Circuit Scenario: 250A (>10x In peak) trips instantaneously (<10ms) via CORE magnetic engine', () => {
    const breaker = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    const shortCurrent = 250; // >10x In peak (226.3A)

    // Step by a single small sub-cycle time step
    const snap = breaker.step(0.005, shortCurrent);

    expect(snap.magnetic.isTripped).toBe(true);
    expect(snap.tripCause).toBe(TripCause.MAGNETIC);
  });

  // ==========================================================================
  // 3. Earth Leakage RCD Trip
  // ==========================================================================
  it('Earth Leakage Scenario: 45mA leakage trips 30mA Type A RCCB within standard break time', () => {
    const rcd = createRCD({ iDeltaN: 30 });
    const leakageResult = rcd.evaluate(45); // 45mA leakage (1.5x Idn)

    expect(leakageResult.shouldTrip).toBe(true);
    expect(leakageResult.tripTimeMs).toBeLessThanOrEqual(300); // 268ms per IEC 61008-1 Table 1

    // At 5x Idn (150mA), break time is <= 40ms
    const highLeakage = rcd.evaluate(150);
    expect(highLeakage.shouldTrip).toBe(true);
    expect(highLeakage.tripTimeMs).toBeLessThanOrEqual(40);
  });

  // ==========================================================================
  // 4. Conventional Non-Tripping Current (1.13x In)
  // ==========================================================================
  it('Safe Boundary Hold: 18.0A (1.13x In on 16A) does NOT trip', () => {
    const breaker = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    const In = breaker.spec.In;
    const holdCurrent = 1.13 * In; // 18.08 A

    const theoreticalTripTime = breaker
      .getRawSimulator()
      .getThermalModel()
      .calculateTheoreticalTripTime(holdCurrent, 30);

    expect(theoreticalTripTime).toBe(Infinity);

    const snap = breaker.runThermalSimulation(holdCurrent, 1000, 10.0);
    expect(snap.state).toBe(MCBState.CLOSED);
    expect(snap.thermal.isTripped).toBe(false);
  });

  // ==========================================================================
  // 5. Residential Topology Data Integrity
  // ==========================================================================
  it('Residential profiles, circuits, and appliances are properly configured', () => {
    expect(RESIDENTIAL_CIRCUITS.length).toBe(3);
    expect(RESIDENTIAL_SCENARIOS.length).toBeGreaterThanOrEqual(5);
    expect(AVAILABLE_APPLIANCES.length).toBeGreaterThanOrEqual(7);

    // Living room socket circuit exists
    const livingCircuit = RESIDENTIAL_CIRCUITS.find(c => c.id === 'c2_living_sockets');
    expect(livingCircuit).toBeDefined();
    expect(livingCircuit?.ratedCurrentIn).toBe(16);
    expect(livingCircuit?.curve).toBe('C');
  });

});
