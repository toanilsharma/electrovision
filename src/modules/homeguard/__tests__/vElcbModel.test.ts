import { describe, it, expect } from 'vitest';
import { createVELCB, VELCB_OBSOLETE_LABEL } from '../physics/vElcbModel';

describe('Voltage-Operated ELCB (v-ELCB) Physics Engine', () => {
  it('should have classification labeled as OBSOLETE pre-IEC 61008', () => {
    const elcb = createVELCB();
    expect(elcb.classification).toBe(VELCB_OBSOLETE_LABEL);
    expect(elcb.classification).toContain('OBSOLETE');
    expect(elcb.classification).toContain('pre-IEC 61008');
  });

  it('should trip safely when earth conductor is intact and chassis voltage exceeds 50V', () => {
    const elcb = createVELCB({ tripVoltageThreshold: 50 });
    const result = elcb.evaluate({
      frameVoltage: 230,
      isEarthConductorIntact: true
    });

    expect(result.isTripped).toBe(true);
    expect(result.status).toBe('TRIPPED_SAFE');
    expect(result.coilVoltage).toBeGreaterThanOrEqual(50);
    expect(result.tripTimeMs).toBe(60);
    expect(result.explanation).toContain('Frame voltage reached');
  });

  it('FATAL FLAW: should FAIL to trip when protective earth conductor (CPC) is broken', () => {
    const elcb = createVELCB({ tripVoltageThreshold: 50 });
    const result = elcb.evaluate({
      frameVoltage: 230,
      isEarthConductorIntact: false // Earth conductor severed!
    });

    expect(result.isTripped).toBe(false);
    expect(result.coilVoltage).toBe(0);
    expect(result.coilCurrentMA).toBe(0);
    expect(result.chassisVoltage).toBe(230); // Lethal 230V remains on appliance frame!
    expect(result.status).toBe('CRITICAL_FAILURE_CPC_BROKEN');
    expect(result.tripTimeMs).toBe(Infinity);
    expect(result.explanation).toContain('FATAL FLAW OCCURRED');
  });

  it('should not trip under normal conditions when frame voltage is 0V', () => {
    const elcb = createVELCB();
    const result = elcb.evaluate({
      frameVoltage: 0,
      isEarthConductorIntact: true
    });

    expect(result.isTripped).toBe(false);
    expect(result.coilVoltage).toBe(0);
    expect(result.status).toBe('STANDBY_SAFE');
  });

  it('should not trip when frame voltage is safe (< 50V touch limit)', () => {
    const elcb = createVELCB({ tripVoltageThreshold: 50 });
    const result = elcb.evaluate({
      frameVoltage: 24,
      isEarthConductorIntact: true
    });

    expect(result.isTripped).toBe(false);
    expect(result.coilVoltage).toBeLessThan(50);
    expect(result.status).toBe('BELOW_THRESHOLD');
  });

  it('should simulate desensitization when a low-resistance parallel earth path (e.g. plumbing) exists', () => {
    const elcb = createVELCB({ tripVoltageThreshold: 50, coilResistance: 300, auxiliaryEarthResistance: 20 });
    // Parallel plumbing resistance is only 2 ohms
    const result = elcb.evaluate({
      frameVoltage: 60,
      isEarthConductorIntact: true,
      parallelEarthResistance: 2
    });

    expect(result.isTripped).toBe(false);
    expect(result.status).toBe('DESENSITIZED_PARALLEL_PATH');
    expect(result.explanation).toContain('BLINDED BY PARALLEL EARTH');
  });
});
