import { useCallback } from 'react';

/**
 * Custom hook for Web Haptic Feedback (navigator.vibrate)
 */
export function useHaptics() {
  const triggerOverloadHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        // Heavy clunk pattern for thermal overload trip
        navigator.vibrate([50, 50, 200]);
      } catch {
        // Ignore user activation restriction errors
      }
    }
  }, []);

  const triggerShortCircuitHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        // Violent, jarring shock pattern for short circuit magnetic trip
        navigator.vibrate([100, 30, 100, 30, 200]);
      } catch {
        // Ignore user activation restriction errors
      }
    }
  }, []);

  return {
    triggerOverloadHaptic,
    triggerShortCircuitHaptic
  };
}
