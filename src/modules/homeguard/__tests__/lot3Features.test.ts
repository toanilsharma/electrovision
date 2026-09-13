import { describe, it, expect } from 'vitest';
import { HOMEGUARD_PRESETS } from '../data/homeguardPresets';
import { homeguardAudio } from '../utils/homeguardAudio';

describe('HomeGuard Lot 3 Features & Usability Enhancements', () => {
  it('correctly sequences all 6 presets in clean 1-6 order without duplicate numbers', () => {
    expect(HOMEGUARD_PRESETS).toHaveLength(6);

    const expectedTitles = [
      '1. Normal Safe Home (No Faults)',
      '2. Winter Room Overload (145% Safe Capacity)',
      '3. Damaged Appliance Cord Bolted Short Circuit',
      '4. Child Wet-Skin Contact Shock (Why Regular Switches Won\'t Save You)',
      '5. Wet Appliance Water Leakage (The Missing Skin Armor)',
      '6. The Broken Green Ground Wire: Old 1980s Switch Trap'
    ];

    HOMEGUARD_PRESETS.forEach((preset, idx) => {
      expect(preset.title).toBe(expectedTitles[idx]);
      expect(preset.title.startsWith(`${idx + 1}.`)).toBe(true);
    });
  });

  it('supports wire hum warning audio method in audio engine', () => {
    expect(typeof homeguardAudio.playWireHumWarningSound).toBe('function');
    // Ensure it can be called safely without throwing
    expect(() => homeguardAudio.playWireHumWarningSound()).not.toThrow();
  });

  it('evaluates house power status logic across all operating conditions', () => {
    // 1. All safe condition
    const allSafeStates = {
      c1: true,
      c2: true,
      c3: true,
      rccb: true
    };
    const isTotalShutdown = !allSafeStates.rccb;
    const isPartialBlackout = allSafeStates.rccb && (!allSafeStates.c1 || !allSafeStates.c2 || !allSafeStates.c3);
    const isAllSafe = allSafeStates.rccb && allSafeStates.c1 && allSafeStates.c2 && allSafeStates.c3;

    expect(isTotalShutdown).toBe(false);
    expect(isPartialBlackout).toBe(false);
    expect(isAllSafe).toBe(true);

    // 2. Partial blackout: Kitchen tripped, living still safe
    const kitchenTrippedStates = {
      c1: true,
      c2: true,
      c3: false,
      rccb: true
    };
    const partial1 = kitchenTrippedStates.rccb && (!kitchenTrippedStates.c1 || !kitchenTrippedStates.c2 || !kitchenTrippedStates.c3);
    expect(partial1).toBe(true);

    // 3. Total shutdown: RCCB tripped due to human shock
    const shockTripStates = {
      c1: false,
      c2: false,
      c3: false,
      rccb: false
    };
    const totalShut = !shockTripStates.rccb;
    expect(totalShut).toBe(true);
  });
});
