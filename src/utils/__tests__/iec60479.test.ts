import { describe, it, expect } from 'vitest';
import { calculateIECImpedance } from '../iec60479Impedance';
import { getC3Threshold, classifyIECZone } from '../iec60479Zones';

describe('IEC 60479-1:2018 Body Impedance Engine (Table 1)', () => {
  it('should lookup 50th percentile Dry Large contact area impedance correctly across voltage anchors', () => {
    const at50V = calculateIECImpedance(50, { percentile: 50, contactArea: 'large', skinCondition: 'dry', path: 'hand-to-hand' });
    expect(at50V.totalZ).toBe(2875);

    const at110V = calculateIECImpedance(110, { percentile: 50, contactArea: 'large', skinCondition: 'dry', path: 'hand-to-hand' });
    expect(at110V.totalZ).toBe(2400);

    const at230V = calculateIECImpedance(230, { percentile: 50, contactArea: 'large', skinCondition: 'dry', path: 'hand-to-hand' });
    expect(at230V.totalZ).toBe(2150);

    const at400V = calculateIECImpedance(400, { percentile: 50, contactArea: 'large', skinCondition: 'dry', path: 'hand-to-hand' });
    expect(at400V.totalZ).toBe(1725);

    const at1000V = calculateIECImpedance(1000, { percentile: 50, contactArea: 'large', skinCondition: 'dry', path: 'hand-to-hand' });
    expect(at1000V.totalZ).toBe(1050);
  });

  it('should lookup 5th and 95th population percentiles correctly at 230V', () => {
    const p5 = calculateIECImpedance(230, { percentile: 5, contactArea: 'large', skinCondition: 'dry', path: 'hand-to-hand' });
    expect(p5.totalZ).toBe(1000);

    const p95 = calculateIECImpedance(230, { percentile: 95, contactArea: 'large', skinCondition: 'dry', path: 'hand-to-hand' });
    expect(p95.totalZ).toBe(2800);
  });

  it('should linearly interpolate impedance between anchor voltages', () => {
    // 170V is midpoint between 110V (2400) and 230V (2150): 2400 + 0.5 * (2150 - 2400) = 2275
    const at170V = calculateIECImpedance(170, { percentile: 50, contactArea: 'large', skinCondition: 'dry', path: 'hand-to-hand' });
    expect(at170V.totalZ).toBe(2275);
  });

  it('should apply 0.8 conversion factor for Hand-to-Foot path', () => {
    // 230V 50th percentile: Hand-to-Hand is 2150, Hand-to-Foot is 2150 * 0.8 = 1720
    const h2f = calculateIECImpedance(230, { percentile: 50, contactArea: 'large', skinCondition: 'dry', path: 'hand-to-foot' });
    expect(h2f.totalZ).toBe(1720);
  });

  it('should apply Contact Area and Wet Skin condition factors', () => {
    const medium = calculateIECImpedance(230, { percentile: 50, contactArea: 'medium', skinCondition: 'dry', path: 'hand-to-hand' });
    expect(medium.totalZ).toBe(Math.round(2150 * 1.35));

    const wet = calculateIECImpedance(230, { percentile: 50, contactArea: 'large', skinCondition: 'wet', path: 'hand-to-hand' });
    expect(wet.totalZ).toBe(Math.round(2150 * 0.60));
  });
});

describe('IEC 60479-1 Ventricular Fibrillation (VF) & Curve c3 Engine', () => {
  it('should calculate curve c3 threshold mathematically using I = 116 / sqrt(t) for t < 1s', () => {
    expect(getC3Threshold(0.04)).toBeCloseTo(580.0, 1); // 116 / sqrt(0.04) = 580
    expect(getC3Threshold(0.25)).toBeCloseTo(232.0, 1); // 116 / sqrt(0.25) = 232
    expect(getC3Threshold(1.0)).toBeCloseTo(116.0, 1);  // 116 / sqrt(1.0) = 116
    expect(getC3Threshold(10.0)).toBeCloseTo(40.0, 1);  // Asymptote 40mA
  });

  it('should apply Heart Current Factors (0.4 for Hand-to-Hand, 1.0 for Hand-to-Foot)', () => {
    // At t = 1.0s, c3 = 116 mA.
    // Hand-to-Foot: F_H = 1.0 -> 100mA total is 100mA heart current -> AC-3 (below 116mA)
    const h2f = classifyIECZone(100.0, 1.0, 'hand-to-foot');
    expect(h2f.effectiveHeartCurrent).toBe(100.0);
    expect(h2f.zone).toBe('AC-3');

    // Hand-to-Hand: F_H = 0.4 -> 200mA total is 80mA heart current -> AC-3 (below 116mA)
    const h2h = classifyIECZone(200.0, 1.0, 'hand-to-hand');
    expect(h2h.effectiveHeartCurrent).toBe(80.0);
    expect(h2h.zone).toBe('AC-3');

    // Hand-to-Hand with high current (350mA * 0.4 = 140mA > 116mA -> AC-4.1)
    const h2hHigh = classifyIECZone(350.0, 1.0, 'hand-to-hand');
    expect(h2hHigh.effectiveHeartCurrent).toBe(140.0);
    expect(h2hHigh.zone).toBe('AC-4.1');
  });

  it('should mathematically classify currents into exact IEC zones (AC-1 to AC-4.3)', () => {
    // AC-1: < 0.5 mA
    const ac1 = classifyIECZone(0.4, 1.0, 'hand-to-foot');
    expect(ac1.zone).toBe('AC-1');

    // AC-2: 0.5 to 10 mA
    const ac2 = classifyIECZone(5.0, 1.0, 'hand-to-foot');
    expect(ac2.zone).toBe('AC-2');

    // AC-3: 10 mA to c3 (c3 at 1s is 116 mA)
    const ac3 = classifyIECZone(50.0, 1.0, 'hand-to-foot');
    expect(ac3.zone).toBe('AC-3');

    // AC-4.1: c3 to 1.5*c3 (116 to 174 mA)
    const ac41 = classifyIECZone(140.0, 1.0, 'hand-to-foot');
    expect(ac41.zone).toBe('AC-4.1');

    // AC-4.2: 1.5*c3 to 2.5*c3 (174 to 290 mA)
    const ac42 = classifyIECZone(220.0, 1.0, 'hand-to-foot');
    expect(ac42.zone).toBe('AC-4.2');

    // AC-4.3: > 2.5*c3 (> 290 mA)
    const ac43 = classifyIECZone(350.0, 1.0, 'hand-to-foot');
    expect(ac43.zone).toBe('AC-4.3');
  });
});
