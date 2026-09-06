import { describe, it, expect } from 'vitest';
import {
  DEMOGRAPHIC_PRESETS,
  evaluateDemographicCompression,
  evaluateRhythmTiming,
} from '../demographicPhysics';

describe('Demographic Physics & Pediatric Standards', () => {
  it('defines correct depth and ratio targets for all 3 demographics', () => {
    const adult = DEMOGRAPHIC_PRESETS.adult;
    const child = DEMOGRAPHIC_PRESETS.child;
    const infant = DEMOGRAPHIC_PRESETS.infant;

    expect(adult.targetDepthCmMin).toBe(5.0);
    expect(adult.targetDepthCmMax).toBe(6.0);
    expect(adult.aedEnergyJoules).toBe(150);

    expect(child.targetDepthCmMin).toBe(4.0);
    expect(child.targetDepthCmMax).toBe(5.0);
    expect(child.compressionRatioDual).toBe('15:2');
    expect(child.aedEnergyJoules).toBe(50);

    expect(infant.targetDepthCmMin).toBe(3.5);
    expect(infant.targetDepthCmMax).toBe(4.0);
    expect(infant.pulseCheckSite).toContain('Brachial');
    expect(infant.handTechnique).toContain('2-thumb');
  });

  it('correctly rates adult compressions as perfect, shallow, or too deep', () => {
    // 5.4 cm is optimal for adult
    const perfectEval = evaluateDemographicCompression(5.4, 40, 240, 545, 'adult');
    expect(perfectEval.depthRating).toBe('perfect');
    expect(perfectEval.isDepthAdequate).toBe(true);

    // 3.8 cm is too shallow for adult (needs >= 5.0)
    const shallowEval = evaluateDemographicCompression(3.8, 30, 240, 545, 'adult');
    expect(shallowEval.isTooShallow).toBe(true);
    expect(shallowEval.depthRating).toBe('shallow');

    // 6.5 cm is too deep for adult
    const deepEval = evaluateDemographicCompression(6.5, 45, 240, 545, 'adult');
    expect(deepEval.isTooDeep).toBe(true);
  });

  it('recognizes 4.5 cm as optimal for child and calculates child thoracic resistance', () => {
    const childEval = evaluateDemographicCompression(4.5, 35, 220, 545, 'child');
    expect(childEval.depthRating).toBe('perfect');
    expect(childEval.isDepthAdequate).toBe(true);
    // Child thorax requires significantly less force than adult
    expect(childEval.deliveredForceNewtons).toBeLessThan(250);
  });

  it('recognizes 3.8 cm as optimal for infant with gentle force resistance', () => {
    const infantEval = evaluateDemographicCompression(3.8, 25, 200, 545, 'infant');
    expect(infantEval.depthRating).toBe('perfect');
    expect(infantEval.isDepthAdequate).toBe(true);
    expect(infantEval.deliveredForceNewtons).toBeLessThan(120);
  });

  describe('evaluateRhythmTiming', () => {
    it('scores high for dead-on timing within +/- 45 ms', () => {
      const result = evaluateRhythmTiming(15);
      expect(result.accuracy).toBe('perfect');
      expect(result.score).toBe(300);
    });

    it('identifies early vs late compressions when user is off beat', () => {
      const early = evaluateRhythmTiming(-120);
      expect(early.accuracy).toBe('early');
      expect(early.feedback).toContain('SLOW DOWN');

      const late = evaluateRhythmTiming(130);
      expect(late.accuracy).toBe('late');
      expect(late.feedback).toContain('SPEED UP');
    });
  });
});
