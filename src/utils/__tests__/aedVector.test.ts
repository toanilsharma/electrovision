import { describe, it, expect } from 'vitest';
import {
  calculatePadVector,
  IDEAL_PAD_STERNAL,
  IDEAL_PAD_APICAL,
} from '../aedVector';

describe('aedVector - Electrode Pad Placement & Vector Physics', () => {
  it('returns disconnected status when one or both pads are unattached', () => {
    const unattached = calculatePadVector(
      { x: 0, y: 0, isAttached: false },
      { x: 0, y: 0, isAttached: false }
    );
    expect(unattached.isBothAttached).toBe(false);
    expect(unattached.padContactQuality).toBe('disconnected');
    expect(unattached.contactImpedanceOhms).toBe(999);
    expect(unattached.transcardiacCurrentFraction).toBe(0);

    const oneAttached = calculatePadVector(
      { x: IDEAL_PAD_STERNAL.x, y: IDEAL_PAD_STERNAL.y, isAttached: true },
      { x: 0, y: 0, isAttached: false }
    );
    expect(oneAttached.isBothAttached).toBe(false);
    expect(oneAttached.placementFeedback).toContain('Attach Lower Left');
  });

  it('calculates optimal current fraction (>=0.85) when pads are placed in ideal anterolateral positions', () => {
    const ideal = calculatePadVector(
      { x: IDEAL_PAD_STERNAL.x, y: IDEAL_PAD_STERNAL.y, isAttached: true },
      { x: IDEAL_PAD_APICAL.x, y: IDEAL_PAD_APICAL.y, isAttached: true }
    );
    expect(ideal.isBothAttached).toBe(true);
    expect(ideal.padContactQuality).toBe('ideal');
    expect(ideal.transcardiacCurrentFraction).toBeGreaterThanOrEqual(0.85);
    expect(ideal.contactImpedanceOhms).toBeLessThanOrEqual(80);
    expect(ideal.vectorAngleDeg).toBeLessThanOrEqual(5);
  });

  it('penalizes when pads are placed too close together (arcing risk)', () => {
    const tooClose = calculatePadVector(
      { x: 50, y: 50, isAttached: true },
      { x: 55, y: 55, isAttached: true }
    );
    expect(tooClose.isBothAttached).toBe(true);
    expect(tooClose.padContactQuality).toBe('poor');
    expect(tooClose.placementFeedback).toContain('DANGER: Pads placed too close');
    expect(tooClose.transcardiacCurrentFraction).toBeLessThan(0.3);
  });

  it('detects misaligned current vector when pads are reversed or on same side', () => {
    const reversed = calculatePadVector(
      { x: IDEAL_PAD_APICAL.x, y: IDEAL_PAD_APICAL.y, isAttached: true },
      { x: IDEAL_PAD_STERNAL.x, y: IDEAL_PAD_STERNAL.y, isAttached: true }
    );
    // Reversed polarity yields negative dot product / poor vector
    expect(reversed.transcardiacCurrentFraction).toBeLessThan(0.5);
    expect(reversed.padContactQuality).toBe('poor');
  });
});
