import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerHaptic, HAPTIC_PATTERNS } from '../haptics';

describe('Mobile Haptic Feedback Engine Unit Tests', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    });
  });

  it('verifies exact standard electrical safety vibration patterns', () => {
    expect(HAPTIC_PATTERNS.INITIAL_SHOCK).toEqual([80]);
    expect(HAPTIC_PATTERNS.MUSCLE_LOCK).toEqual([50, 50, 50, 50]);
    expect(HAPTIC_PATTERNS.VF_ASYSTOLE).toEqual([200, 100, 200, 100, 1000]);
    expect(HAPTIC_PATTERNS.BREAKER_TRIP).toEqual([30]);
  });

  it('safely calls navigator.vibrate when available', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(global, 'navigator', {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true
    });

    const result = triggerHaptic(HAPTIC_PATTERNS.INITIAL_SHOCK);
    expect(vibrateMock).toHaveBeenCalledWith([80]);
    expect(result).toBe(true);

    triggerHaptic(HAPTIC_PATTERNS.MUSCLE_LOCK);
    expect(vibrateMock).toHaveBeenCalledWith([50, 50, 50, 50]);

    triggerHaptic(HAPTIC_PATTERNS.VF_ASYSTOLE);
    expect(vibrateMock).toHaveBeenCalledWith([200, 100, 200, 100, 1000]);

    triggerHaptic(HAPTIC_PATTERNS.BREAKER_TRIP);
    expect(vibrateMock).toHaveBeenCalledWith([30]);
  });

  it('safely returns false when navigator.vibrate is missing or on desktop without crashing', () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
      configurable: true
    });

    const result = triggerHaptic([80]);
    expect(result).toBe(false);
  });
});
