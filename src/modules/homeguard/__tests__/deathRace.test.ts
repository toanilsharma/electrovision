import { describe, it, expect } from 'vitest';
import { createMCB } from '@/src/core/physics/mcbEngine';
import { createRCD } from '@/src/core/physics/rcdEngine';
import { classifyIECZone, getC3Threshold } from '@/src/core/physics/bodyCurrent';
import { MCBState } from '@/src/mcb/types';

describe('Death Race (MCB-Only vs RCCB+MCB) Electrophysiology Physics', () => {
  it('should maintain independent instance states between two MCB engines (R5)', () => {
    const mcbA = createMCB({ In: 16, curve: 'C' });
    const mcbB = createMCB({ In: 16, curve: 'C' });

    // Step mcbA with 250A (short circuit) -> should trip
    const snapA = mcbA.step(0.01, 250);
    expect(snapA.state).not.toBe(MCBState.CLOSED);

    // mcbB should remain completely unaffected and CLOSED
    const snapB = mcbB.step(0.01, 10);
    expect(snapB.state).toBe(MCBState.CLOSED);
  });

  it('LEFT HOUSE: 16A MCB completely ignores 230mA child shock current (0.014x In)', () => {
    const mcb = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    const touchCurrentA = 0.23; // 230mA = 0.23A

    // Step for 1.5 seconds of continuous shock
    const snap = mcb.step(1.5, touchCurrentA);

    // MCB remains rigidly closed
    expect(snap.state).toBe(MCBState.CLOSED);
    // Bimetal temperature stays at ambient 30°C (ignoring 0.23A)
    expect(snap.thermal.temperature).toBeCloseTo(30, 0);
  });

  it('RIGHT HOUSE: 30mA RCCB trips within IEC 61008-1 limit (<= 40ms at 230mA)', () => {
    const rcd = createRCD({ iDeltaN: 30 });
    const touchCurrentMA = 230;

    const evalResult = rcd.evaluate(touchCurrentMA);

    expect(evalResult.shouldTrip).toBe(true);
    // 230mA is > 5x IΔn (150mA), so tripTime must be <= 40ms
    expect(evalResult.tripTimeMs).toBeLessThanOrEqual(40);
  });

  it('IEC 60479-1: c3 ventricular fibrillation curve threshold is at t ≈ 254ms for 230mA', () => {
    // I = 116 / sqrt(t) => t = (116 / 230)^2 = 0.2543s = 254.3ms
    const c3ThresholdAt254ms = getC3Threshold(0.2543);
    expect(c3ThresholdAt254ms).toBeCloseTo(230, 0);
  });

  it('Physiological hazard comparison: 30ms shock is survivable (0% VF), prolonged shock enters lethal Zone AC-4.2 (50% VF)', () => {
    const touchCurrentMA = 230;

    // Right house (RCD cut at 30ms = 0.03s)
    const rightZone = classifyIECZone(touchCurrentMA, 0.03, 'hand-to-foot');
    expect(rightZone.zone).not.toBe('AC-4.1');
    expect(rightZone.zone).not.toBe('AC-4.2');
    expect(rightZone.zone).not.toBe('AC-4.3');
    expect(rightZone.vfibProbability).toBe('0%');

    // Left house: at 400ms it crosses c3 (AC-4.1)
    const leftZone400 = classifyIECZone(touchCurrentMA, 0.4, 'hand-to-foot');
    expect(leftZone400.zone).toBe('AC-4.1');

    // Left house: at 800ms it crosses 1.5*c3 (AC-4.2, 50% VF probability)
    const leftZone800 = classifyIECZone(touchCurrentMA, 0.8, 'hand-to-foot');
    expect(leftZone800.zone).toBe('AC-4.2');
    expect(leftZone800.vfibProbability).toContain('50%');
  });
});
