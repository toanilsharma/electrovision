import { describe, it, expect } from 'vitest';
import {
  evaluateStroke,
  calculateCCF,
  generateCertificateSerial,
  compileExamScorecard,
  TelemetryStroke,
  TelemetryVentilation,
} from '../cprExamTelemetry';

describe('Resuscitation Mastery Exam Telemetry Engine', () => {
  it('correctly evaluates stroke depth, recoil, and cadence for Adult', () => {
    // Perfect adult stroke (5.4 cm depth, 0.1 cm recoil, 110 bpm)
    const result1 = evaluateStroke(5.4, 0.1, 110, 'adult');
    expect(result1.isDepthAccurate).toBe(true);
    expect(result1.isRecoilComplete).toBe(true);
    expect(result1.isCadenceAccurate).toBe(true);

    // Shallow stroke (< 5.0 cm)
    const result2 = evaluateStroke(4.2, 0.1, 110, 'adult');
    expect(result2.isDepthAccurate).toBe(false);

    // Incomplete recoil (> 0.35 cm)
    const result3 = evaluateStroke(5.5, 0.6, 110, 'adult');
    expect(result3.isRecoilComplete).toBe(false);

    // Cadence too fast (> 120 bpm)
    const result4 = evaluateStroke(5.4, 0.1, 135, 'adult');
    expect(result4.isCadenceAccurate).toBe(false);
  });

  it('correctly evaluates stroke depth for Child and Infant demographics', () => {
    // Child: 4.0 - 5.0 cm
    const childGood = evaluateStroke(4.5, 0.1, 110, 'child');
    expect(childGood.isDepthAccurate).toBe(true);

    const childTooDeep = evaluateStroke(5.6, 0.1, 110, 'child');
    expect(childTooDeep.isDepthAccurate).toBe(false);

    // Infant: 3.5 - 4.0 cm
    const infantGood = evaluateStroke(3.8, 0.1, 110, 'infant');
    expect(infantGood.isDepthAccurate).toBe(true);

    const infantTooShallow = evaluateStroke(2.5, 0.1, 110, 'infant');
    expect(infantTooShallow.isDepthAccurate).toBe(false);
  });

  it('calculates Chest Compression Fraction (CCF) accurately', () => {
    expect(calculateCCF(96, 120)).toBe(80.0);
    expect(calculateCCF(108, 120)).toBe(90.0);
    expect(calculateCCF(60, 120)).toBe(50.0);
    expect(calculateCCF(0, 120)).toBe(0);
  });

  it('generates reproducible AHA/ERC cryptographic serial numbers', () => {
    const serial1 = generateCertificateSerial('John Doe', 92, 1700000000000);
    const serial2 = generateCertificateSerial('John Doe', 92, 1700000000000);
    expect(serial1).toBe(serial2);
    expect(serial1).toMatch(/^AHA-ERC-2026-[A-F0-9]{4}-[A-F0-9]{4}$/);
  });

  it('compiles a comprehensive clinical exam scorecard with passing criteria', () => {
    // Simulate 100 strokes over 120 seconds with 96s active compression (CCF = 80%)
    const strokes: TelemetryStroke[] = [];
    for (let i = 0; i < 100; i++) {
      strokes.push({
        id: i,
        timestampMs: i * 545,
        depthCm: 5.4,
        recoilDepthCm: 0.1,
        velocityCmS: 45,
        durationMs: 250,
        isDepthAccurate: true,
        isRecoilComplete: true,
        isCadenceAccurate: true,
        instantBpm: 110,
      });
    }

    const ventilations: TelemetryVentilation[] = [
      {
        timestampMs: 16000,
        tidalVolumeMl: 550,
        airwayAngleDeg: 35,
        isAirwayOpen: true,
        isEffective: true,
        gastricDistensionPct: 5,
      },
      {
        timestampMs: 17500,
        tidalVolumeMl: 580,
        airwayAngleDeg: 35,
        isAirwayOpen: true,
        isEffective: true,
        gastricDistensionPct: 5,
      },
    ];

    const scorecard = compileExamScorecard(
      'Dr. Alice Sharma',
      strokes,
      ventilations,
      120,
      96,
      22.5,
      45,
      'adult'
    );

    expect(scorecard.totalCompressions).toBe(100);
    expect(scorecard.ccfPct).toBe(80.0);
    expect(scorecard.depthAccuracyPct).toBe(100);
    expect(scorecard.recoilCompletenessPct).toBe(100);
    expect(scorecard.cadenceUniformityPct).toBe(100);
    expect(scorecard.overallScore).toBeGreaterThanOrEqual(90);
    expect(scorecard.passed).toBe(true);
    expect(scorecard.grade).toBe('MASTERY (DISTINCTION)');
    expect(scorecard.strengths.length).toBeGreaterThan(0);
    expect(scorecard.certificateSerial).toMatch(/^AHA-ERC-2026-/);
  });
});
