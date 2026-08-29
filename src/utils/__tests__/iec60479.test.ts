import { describe, it, expect } from 'vitest';
import { calculateIECImpedance } from '../iec60479Impedance';
import { getC3Threshold, classifyIECZone } from '../iec60479Zones';

describe('IEC 60479-1 Body Impedance Engine (Tables 10-13)', () => {
  it('should interpolate Dry Skin body impedance (Table 10) correctly across voltage range', () => {
    const at25V = calculateIECImpedance(25, 'dry');
    expect(at25V.totalZ).toBe(3250);
    expect(at25V.internalZ).toBe(500);
    expect(at25V.skinZ).toBe(2750);

    const at50V = calculateIECImpedance(50, 'dry');
    expect(at50V.totalZ).toBe(2625);

    const at220V = calculateIECImpedance(220, 'dry');
    expect(at220V.totalZ).toBe(1350);

    const at700V = calculateIECImpedance(700, 'dry');
    expect(at700V.totalZ).toBe(750);

    // Midpoint interpolation (e.g. 230V between 220V and 400V)
    const at230V = calculateIECImpedance(230, 'dry');
    expect(at230V.totalZ).toBeLessThan(1350);
    expect(at230V.totalZ).toBeGreaterThan(950);
  });

  it('should interpolate Wet Skin body impedance (Table 13) correctly', () => {
    const at25V = calculateIECImpedance(25, 'wet');
    expect(at25V.totalZ).toBe(1500);

    const at220V = calculateIECImpedance(220, 'wet');
    expect(at220V.totalZ).toBe(825);
  });
});

describe('IEC 60479-1 Curve c3 & Zone Classification Engine', () => {
  it('should calculate digitized c3 curve thresholds correctly across shock duration', () => {
    expect(getC3Threshold(10.0)).toBeCloseTo(40.0, 1);
    expect(getC3Threshold(1.0)).toBeCloseTo(50.0, 1);
    expect(getC3Threshold(0.1)).toBeCloseTo(100.0, 1);
    expect(getC3Threshold(0.01)).toBeCloseTo(200.0, 1);
  });

  it('should classify currents into correct IEC 60479-1 Zones (AC-1 to AC-4.3)', () => {
    // AC-1: Imperceptible (≤ 0.5 mA)
    const ac1 = classifyIECZone(0.4, 1.0);
    expect(ac1.zone).toBe('AC-1');

    // AC-2: Perception & Involuntary Twitch (0.5 - 10 mA)
    const ac2 = classifyIECZone(5.0, 1.0);
    expect(ac2.zone).toBe('AC-2');

    // AC-3: Muscle Lock & Breathing Distress (>10 mA to c3)
    const ac3 = classifyIECZone(30.0, 1.0); // c3 at 1s is 50 mA -> 30 mA is AC-3
    expect(ac3.zone).toBe('AC-3');

    // AC-4.1: Low V-Fib Risk (c3 to 1.5*c3)
    const ac41 = classifyIECZone(60.0, 1.0); // 50 * 1.5 = 75 mA -> 60 mA is AC-4.1
    expect(ac41.zone).toBe('AC-4.1');

    // AC-4.2: Medium V-Fib Risk (1.5*c3 to 2.5*c3)
    const ac42 = classifyIECZone(100.0, 1.0); // 50 * 2.5 = 125 mA -> 100 mA is AC-4.2
    expect(ac42.zone).toBe('AC-4.2');

    // AC-4.3: Lethal V-Fib Risk (> 2.5*c3)
    const ac43 = classifyIECZone(150.0, 1.0); // 150 mA > 125 mA -> AC-4.3
    expect(ac43.zone).toBe('AC-4.3');
  });
});
