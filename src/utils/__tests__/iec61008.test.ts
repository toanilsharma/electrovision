import { describe, it, expect } from 'vitest';
import { calculateRCDTripTime } from '../iec61008RCD';

describe('IEC 61008-1 Residual Current Device (RCD) Trip Engine', () => {
  it('should not trip below 0.5 * I_Δn', () => {
    const result = calculateRCDTripTime(12, 'rcbo_30ma'); // 12mA < 15mA (0.5 * 30mA)
    expect(result.shouldTrip).toBe(false);
    expect(result.tripTimeMs).toBe(Infinity);
  });

  it('should trip in exactly 300 ms at I_fault = 1.0 * I_Δn (30 mA)', () => {
    const result = calculateRCDTripTime(30, 'rcbo_30ma');
    expect(result.shouldTrip).toBe(true);
    expect(result.tripTimeMs).toBe(300);
    expect(result.multiple).toBe(1.0);
  });

  it('should trip in exactly 40 ms at I_fault = 5.0 * I_Δn (150 mA)', () => {
    const result = calculateRCDTripTime(150, 'rcbo_30ma');
    expect(result.shouldTrip).toBe(true);
    expect(result.tripTimeMs).toBe(40);
    expect(result.multiple).toBe(5.0);
  });

  it('should trip in 40 ms for high fault currents above 5.0 * I_Δn (e.g. 500 mA)', () => {
    const result = calculateRCDTripTime(500, 'rcbo_30ma');
    expect(result.shouldTrip).toBe(true);
    expect(result.tripTimeMs).toBe(40);
  });

  it('should linearly interpolate trip time between I_Δn (300ms) and 5*I_Δn (40ms)', () => {
    // At 3x I_Δn (90 mA): midpoint fraction = (3 - 1) / (5 - 1) = 0.5
    // Trip time = 300 - 0.5 * (300 - 40) = 300 - 130 = 170 ms
    const at90mA = calculateRCDTripTime(90, 'rcbo_30ma');
    expect(at90mA.shouldTrip).toBe(true);
    expect(at90mA.tripTimeMs).toBe(170);

    // At 2x I_Δn (60 mA): fraction = (2 - 1) / 4 = 0.25
    // Trip time = 300 - 0.25 * 260 = 235 ms
    const at60mA = calculateRCDTripTime(60, 'rcbo_30ma');
    expect(at60mA.tripTimeMs).toBe(235);
  });

  it('should work correctly for other RCD ratings (10mA, 100mA)', () => {
    // 10mA RCD at 10mA -> 300ms, at 50mA -> 40ms
    const rcd10at10 = calculateRCDTripTime(10, 'rcd_10ma');
    expect(rcd10at10.tripTimeMs).toBe(300);

    const rcd10at50 = calculateRCDTripTime(50, 'rcd_10ma');
    expect(rcd10at50.tripTimeMs).toBe(40);

    // 100mA RCD at 100mA -> 300ms, at 500mA -> 40ms
    const rcd100at100 = calculateRCDTripTime(100, 'rcd_100ma');
    expect(rcd100at100.tripTimeMs).toBe(300);
  });
});
