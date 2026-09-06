import { describe, it, expect } from 'vitest';
import { sampleECGVoltage, calculateCPRArtifact, generateECGSvgPath } from '../ecgSynthesizer';

describe('Procedural ECG & Biomechanical Motion Artifact Synthesizer', () => {
  it('generates distinctive positive R wave peak for Normal Sinus Rhythm (Lead II)', () => {
    // Lead II R peak should exceed 1.0 mV during ventricular depolarization
    let maxVoltage = -Infinity;
    for (let t = 0; t <= 1.0; t += 0.01) {
      const sample = sampleECGVoltage(t, { rhythm: 'sinus', lead: 'Lead II', heartRateBpm: 60 });
      if (sample.millivolts > maxVoltage) {
        maxVoltage = sample.millivolts;
      }
    }
    expect(maxVoltage).toBeGreaterThan(1.0);
  });

  it('generates Coarse VF with chaotic multi-frequency amplitudes exceeding fine VF', () => {
    let coarseMax = 0;
    let fineMax = 0;
    for (let t = 0; t <= 2.0; t += 0.02) {
      const coarseSample = sampleECGVoltage(t, { rhythm: 'coarse_vf' });
      const fineSample = sampleECGVoltage(t, { rhythm: 'fine_vf' });
      coarseMax = Math.max(coarseMax, Math.abs(coarseSample.millivolts));
      fineMax = Math.max(fineMax, Math.abs(fineSample.millivolts));
    }

    expect(coarseMax).toBeGreaterThan(0.3); // Coarse VF has robust fibrillatory waves
    expect(fineMax).toBeLessThan(0.25); // Fine VF is low amplitude
    expect(coarseMax).toBeGreaterThan(fineMax * 1.5);
  });

  it('keeps asystole near flatline baseline with minimal noise (< 0.1 mV)', () => {
    for (let t = 0; t <= 1.0; t += 0.05) {
      const sample = sampleECGVoltage(t, { rhythm: 'asystole' });
      expect(Math.abs(sample.millivolts)).toBeLessThan(0.1);
    }
  });

  it('injects ~1.8 Hz CPR compression motion artifacts that scale with depth', () => {
    // When compressing at 5.4 cm depth, artifact should be large (> 0.5 mV)
    let maxArtifact = 0;
    for (let t = 0; t <= 1.0; t += 0.02) {
      const art = calculateCPRArtifact(t, true, 5.4, 110);
      maxArtifact = Math.max(maxArtifact, Math.abs(art));
    }
    expect(maxArtifact).toBeGreaterThan(0.5);

    // When compression stops (e.g. during AED rhythm analysis), artifact is 0
    const zeroArt = calculateCPRArtifact(0.5, false, 0, 110);
    expect(zeroArt).toBe(0);
  });

  it('generates valid SVG path commands with M and L points', () => {
    const path = generateECGSvgPath(300, 100, 0, 2.0, { rhythm: 'sinus' });
    expect(path.startsWith('M ')).toBe(true);
    expect(path).toContain('L ');
    expect(path.length).toBeGreaterThan(50);
  });
});
