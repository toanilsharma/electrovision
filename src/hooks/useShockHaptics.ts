import { useState, useCallback } from 'react';

export function useShockHaptics() {
  const [isHapticsEnabled, setIsHapticsEnabled] = useState<boolean>(true);

  const toggleHaptics = useCallback(() => {
    setIsHapticsEnabled((prev) => !prev);
  }, []);

  const triggerVibrate = useCallback((pattern: number | number[]) => {
    if (!isHapticsEnabled) return;
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Haptics unavailable
      }
    }
  }, [isHapticsEnabled]);

  const vibrateTingle = useCallback(() => {
    triggerVibrate(20);
  }, [triggerVibrate]);

  const vibrateLetGo = useCallback(() => {
    triggerVibrate([60, 40, 60]);
  }, [triggerVibrate]);

  const vibrateTetany = useCallback(() => {
    triggerVibrate([100, 50, 150]);
  }, [triggerVibrate]);

  const vibrateVFib = useCallback(() => {
    triggerVibrate([200, 60, 200, 60, 300]);
  }, [triggerVibrate]);

  return {
    isHapticsEnabled,
    toggleHaptics,
    vibrateTingle,
    vibrateLetGo,
    vibrateTetany,
    vibrateVFib
  };
}
