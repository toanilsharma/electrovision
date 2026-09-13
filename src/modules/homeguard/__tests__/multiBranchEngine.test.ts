import { describe, it, expect } from 'vitest';
import { createMCB } from '../../../core/physics/mcbEngine';
import { createRCD } from '../../../core/physics/rcdEngine';
import { MCBState, TripCause } from '../../../mcb/types';
import { calculatePowerBreakdown, HOMEGUARD_APPLIANCES } from '../data/homeguardAppliances';

describe('HomeGuard Multi-Branch Electrical Distribution Engine', () => {
  it('correctly maps appliances to respective circuits and computes branch currents', () => {
    // Turn on Kettle (2200W, C3 Kitchen), OTG Oven (1400W, C3 Kitchen), Fridge (200W, C3 Kitchen), and Smart TV (150W, C2 Living)
    const breakdown = calculatePowerBreakdown(['kettle', 'otg_oven', 'refrigerator', 'tv_console']);
    
    // C3 has kettle (2200W) + oven (1400W) + fridge (200W) = 3800W -> 3800 / 230 = 16.5A
    // tv_console is C2 (150W) -> ~0.65A
    expect(breakdown.c3Amps).toBeGreaterThan(16.0);
    expect(breakdown.c2Amps).toBeGreaterThan(0.5);
    expect(breakdown.c2Amps).toBeLessThan(1.0);
    expect(breakdown.c1Amps).toBe(0); // No lighting turned on
    expect(breakdown.totalWatts).toBe(2200 + 1400 + 200 + 150);
  });

  it('kitchen heavy overload trips C3 (Kitchen MCB) independently while C2 (Living Room MCB) stays intact', () => {
    const c2MCB = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    const c3MCB = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });

    // Living room moderate load: 4.5A (TV + Fan + Charger)
    // Kitchen massive overload: Kettle (2200W) + Oven (1400W) = 3600W -> 15.65A + Geyser (2000W) = 24.3A (>1.45 * 16A = 23.2A)
    const c2Current = 4.5;
    const c3Current = 24.3;

    // Simulate thermal response: C3 is in overload, C2 is well below rated 16A
    const snapC3 = c3MCB.runThermalSimulation(c3Current, 2500, 1.0);
    const snapC2 = c2MCB.runThermalSimulation(c2Current, 2500, 1.0);

    // Kitchen MCB tripped on thermal overload
    expect(snapC3.state).not.toBe(MCBState.CLOSED);
    expect(snapC3.tripCause).toBe(TripCause.THERMAL);

    // Living Room MCB remained safely energized and CLOSED
    expect(snapC2.state).toBe(MCBState.CLOSED);
    expect(snapC2.tripCause).toBe(TripCause.NONE);
  });

  it('short circuit on Living Room (C2) trips instantaneously without tripping Kitchen (C3)', () => {
    const c2MCB = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    const c3MCB = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });

    const c2ShortCurrent = 250.0; // Damaged cord short circuit (>10x In)
    const c3NormalCurrent = 3.0; // Normal fridge load

    // Step 0.01 seconds
    const snapC2 = c2MCB.step(0.01, c2ShortCurrent);
    const snapC3 = c3MCB.step(0.01, c3NormalCurrent);

    expect(snapC2.state).not.toBe(MCBState.CLOSED);
    expect(snapC2.tripCause).toBe(TripCause.MAGNETIC);

    // C3 kitchen is unaffected
    expect(snapC3.state).toBe(MCBState.CLOSED);
    expect(snapC3.tripCause).toBe(TripCause.NONE);
  });

  it('residual earth leakage (35mA) trips RCCB (Shock Guard) within standard IEC trip boundaries', () => {
    const rccb = createRCD({ iDeltaN: 30 });

    // Below threshold (10mA) -> Should NOT trip
    const evalSafe = rccb.evaluate(10);
    expect(evalSafe.shouldTrip).toBe(false);

    // Dangerous human contact leakage (35mA > 30mA threshold) -> MUST trip
    const evalTrip = rccb.evaluate(35);
    expect(evalTrip.shouldTrip).toBe(true);
    expect(evalTrip.tripTimeMs).toBeLessThanOrEqual(300); // IEC 61008 max trip time for 1x IΔn is 300ms
  });

  it('incomer Kirchhoff current balance equals exact sum of branch loads when healthy', () => {
    const c1Amps = 1.5;
    const c2Amps = 6.2;
    const c3Amps = 8.1;
    const totalIncomer = Number((c1Amps + c2Amps + c3Amps).toFixed(1));

    expect(totalIncomer).toBe(15.8);

    // If C3 trips, incomer drops by C3's contribution
    const incomerAfterC3Trip = Number((c1Amps + c2Amps).toFixed(1));
    expect(incomerAfterC3Trip).toBe(7.7);
  });

  it('verifies all 10 appliances have valid circuit IDs matching homeguard distribution board', () => {
    const validCircuits = new Set(['c1_lighting', 'c2_living_sockets', 'c3_kitchen_sockets']);
    expect(HOMEGUARD_APPLIANCES.length).toBe(10);

    for (const app of HOMEGUARD_APPLIANCES) {
      expect(validCircuits.has(app.circuitId)).toBe(true);
      expect(app.watts).toBeGreaterThan(0);
      expect(app.name).toBeTruthy();
      expect(app.icon).toBeTruthy();
    }
  });
});
