/**
 * Mobile Haptic Feedback Engine
 * Safely invokes Vibration API patterns with desktop fallbacks
 */

export type HapticPattern = number | number[];

/**
 * Universal safe mobile haptic trigger
 * Checks for navigator.vibrate before executing to prevent errors on desktop browsers
 */
export function triggerHaptic(pattern: HapticPattern): boolean {
  if (
    typeof navigator !== 'undefined' && 
    navigator &&
    typeof (navigator as any).vibrate === 'function'
  ) {
    try {
      return (navigator as any).vibrate(pattern);
    } catch (e) {
      console.warn('Haptic vibration failed:', e);
      return false;
    }
  }
  return false;
}

/**
 * Standardized Electrical Safety Haptic Patterns
 */
export const HAPTIC_PATTERNS = {
  INITIAL_SHOCK: [80] as number[],                    // Sharp jolt on initial contact
  MUSCLE_LOCK: [50, 50, 50, 50] as number[],           // Continuous tetanic pulse during let-go failure
  VF_ASYSTOLE: [200, 100, 200, 100, 1000] as number[], // Fading cardiac arrhythmia / v-fib arrest
  BREAKER_TRIP: [30] as number[],                      // Light solenoid mechanical click
  ARC_BLAST: [150, 50, 250] as number[],               // Arc flash plasma explosion
  CLICK: [15] as number[],                             // Subtle tactile UI click
};
