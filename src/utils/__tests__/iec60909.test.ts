import { describe, it, expect } from 'vitest';
import {
  calculateIEC60909,
  calculateKappa,
  calculateCableWithstand,
  calculateSmin,
  getKFactor
} from '../iec60909';

describe('IEC 60909 Short Circuit Physics Engine', () => {
  it('should calculate 3-Phase fault current (Ik3) for default 630 kVA transformer, uk=6%, 415V, c=1.05', () => {
    const res = calculateIEC60909({
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

    // Z_T = 0.06 * 415^2 / 630000 = 0.01640238 Ohm
    expect(res.Z_T).toBeCloseTo(0.0164, 3);
    // Ik3 = (1.05 * 415) / (sqrt(3) * Z_T) ≈ 15340 A = 15.34 kA
    expect(res.Ik3_kA).toBeCloseTo(15.34, 1);
    expect(res.Ik_kA).toBeCloseTo(15.34, 1);
  });

  it('should calculate Single Line-to-Ground fault current (Ik1) with Z0/Z1 ratio = 1.7', () => {
    const res = calculateIEC60909({
      transformerKVA: 630,
      ukPercent: 6.0,
      voltageUn: 415,
      voltageFactorC: 1.05,
      cableLengthM: 0,
      cableSizeMm2: 16,
      z0z1Ratio: 1.7,
      faultType: 'line_ground',
      protectionSpeed: 'fast',
      isLimitingBreaker: false
    });

    // Ik1 = (sqrt(3) * 1.05 * 415) / (3.7 * Z1) ≈ 12.44 kA (~0.81 * Ik3)
    expect(res.Ik1_kA).toBeCloseTo(12.44, 1);
    expect(res.Ik_kA).toBeLessThan(res.Ik3_kA);
    expect(res.Ik1 / res.Ik3).toBeCloseTo(3 / 3.7, 2);
  });

  it('should calculate Peak Factor κ and Peak Making Current ip correctly', () => {
    // For R/X = 0.1: kappa = 1.02 + 0.98 * exp(-0.3) ≈ 1.746
    const kappa01 = calculateKappa(0.1);
    expect(kappa01).toBeCloseTo(1.746, 2);

    const res = calculateIEC60909({
      transformerKVA: 630,
      ukPercent: 6.0,
      voltageUn: 415,
      voltageFactorC: 1.05,
      cableLengthM: 0,
      cableSizeMm2: 16,
      transformerXR: 10,
      z0z1Ratio: 1.7,
      faultType: 'three_phase',
      protectionSpeed: 'fast',
      isLimitingBreaker: false
    });

    // Peak current ip = kappa * sqrt(2) * Ik3
    const expectedIp = res.kappa * Math.sqrt(2) * res.Ik;
    expect(res.ip).toBeCloseTo(expectedIp, 1);
    expect(res.ip_kA).toBeGreaterThan(res.Ik_kA);
  });

  it('should calculate Cable Thermal Withstand (k²S²) for 16 mm² Cu PVC (k=115)', () => {
    const k = getKFactor('Cu', 'PVC');
    expect(k).toBe(115);

    const withstand = calculateCableWithstand(16, 115);
    // 115^2 * 16^2 = 13225 * 256 = 3385600 A²s ≈ 3.3856 kA²s (~3.4 kA²s)
    expect(withstand).toBe(3385600);
    expect(withstand / 1000000).toBeCloseTo(3.39, 2);
  });

  it('should calculate Minimum Required Cable Size S_min = √(I²t) / k', () => {
    const letThrough = 1000000; // 1,000,000 A²s
    const k = 115;
    const Smin = calculateSmin(letThrough, k);
    // sqrt(1000000) / 115 = 1000 / 115 ≈ 8.70 mm²
    expect(Smin).toBeCloseTo(8.70, 2);
  });

  it('should calculate clearing time breakdown correctly (14ms fast vs 76ms delayed)', () => {
    const fast = calculateIEC60909({
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
    // 5ms relay + 6ms breaker + 3ms arc = 14ms total
    expect(fast.tRelayMs).toBe(5);
    expect(fast.tBreakerMs).toBe(6);
    expect(fast.tArcMs).toBe(3);
    expect(fast.tTotalMs).toBe(14);

    const delayed = calculateIEC60909({
      transformerKVA: 630,
      ukPercent: 6.0,
      voltageUn: 415,
      voltageFactorC: 1.05,
      cableLengthM: 0,
      cableSizeMm2: 16,
      z0z1Ratio: 1.7,
      faultType: 'three_phase',
      protectionSpeed: 'delayed',
      isLimitingBreaker: false
    });
    // 67ms relay + 6ms breaker + 3ms arc = 76ms total
    expect(delayed.tRelayMs).toBe(67);
    expect(delayed.tBreakerMs).toBe(6);
    expect(delayed.tArcMs).toBe(3);
    expect(delayed.tTotalMs).toBe(76);
  });

  it('should cap let-through energy in Current-Limiting Breaker mode', () => {
    const unlimited = calculateIEC60909({
      transformerKVA: 630,
      ukPercent: 6.0,
      voltageUn: 415,
      voltageFactorC: 1.05,
      cableLengthM: 0,
      cableSizeMm2: 16,
      z0z1Ratio: 1.7,
      faultType: 'three_phase',
      protectionSpeed: 'delayed', // 76ms
      isLimitingBreaker: false
    });

    const limited = calculateIEC60909({
      transformerKVA: 630,
      ukPercent: 6.0,
      voltageUn: 415,
      voltageFactorC: 1.05,
      cableLengthM: 0,
      cableSizeMm2: 16,
      z0z1Ratio: 1.7,
      faultType: 'three_phase',
      protectionSpeed: 'delayed', // 76ms
      isLimitingBreaker: true
    });

    expect(limited.isLimitingActive).toBe(true);
    expect(limited.letThroughEnergy_kA2s).toBeLessThan(unlimited.letThroughEnergy_kA2s);
    expect(limited.letThroughEnergy_kA2s).toBeLessThanOrEqual(0.65);
  });
});
