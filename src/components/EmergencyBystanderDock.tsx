import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, CheckCircle2 } from 'lucide-react';

interface EmergencyBystanderDockProps {
  isMuscleLocked: boolean;
  isSimulating: boolean;
  onSwitchOffPower: () => void;
}

export const EmergencyBystanderDock: React.FC<EmergencyBystanderDockProps> = ({
  isMuscleLocked,
  isSimulating,
  onSwitchOffPower
}) => {
  const [showIsolatedChip, setShowIsolatedChip] = useState<boolean>(false);

  const handleCutoff = useCallback(() => {
    onSwitchOffPower();
    setShowIsolatedChip(true);
    const timer = setTimeout(() => {
      setShowIsolatedChip(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onSwitchOffPower]);

  // Keyboard shortcut handler (Esc or Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSimulating && !isMuscleLocked) return;

      if (e.key === 'Escape' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); // Prevent spacebar page scrolling
        handleCutoff();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSimulating, isMuscleLocked, handleCutoff]);

  const shouldShowDock = isMuscleLocked || showIsolatedChip;

  return (
    <AnimatePresence>
      {shouldShowDock && (
        <div
          /* Positioned in center/left column region so it NEVER covers right-side ECG & Waveforms */
          className="fixed bottom-0 left-0 right-0 lg:left-[330px] lg:right-[330px] xl:right-[350px] z-[100] p-2 sm:p-3 pointer-events-none flex flex-col items-center justify-end select-none"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {showIsolatedChip ? (
            /* Green POWER ISOLATED Chip */
            <motion.div
              key="power-isolated-chip"
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="pointer-events-auto w-[calc(100%-16px)] max-w-xl min-h-[64px] rounded-2xl bg-emerald-950/95 border-2 border-emerald-400 text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.6)] backdrop-blur-xl flex items-center justify-center gap-3 px-4 py-3"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 animate-bounce" />
              <div className="flex flex-col text-left">
                <span className="text-base sm:text-xl font-black tracking-wider uppercase text-emerald-300 font-sans leading-none">
                  POWER ISOLATED ✓
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold text-emerald-200 mt-1">
                  Breaker tripped. Victim released safely from conductor.
                </span>
              </div>
            </motion.div>
          ) : (
            /* Giant High-Contrast Electric Yellow Bystander Button (Big Bold Fonts) */
            <motion.div
              key="emergency-bystander-button"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="pointer-events-auto w-[calc(100%-16px)] max-w-xl"
            >
              <button
                type="button"
                onClick={handleCutoff}
                aria-keyshortcuts="Escape Space"
                className="w-full min-h-[64px] py-3 px-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 active:scale-[0.98] border-2 border-yellow-100 text-slate-950 font-black tracking-wider uppercase shadow-[0_0_45px_rgba(250,204,21,1)] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ring-4 ring-yellow-400/60"
              >
                <div className="flex items-center justify-center gap-2 text-center text-base sm:text-xl md:text-2xl leading-none font-black text-slate-950">
                  <Zap className="w-7 h-7 fill-slate-950 text-slate-950 shrink-0 animate-bounce" />
                  <span>⚡ BYSTANDER: SWITCH OFF POWER</span>
                </div>
                <span className="text-xs sm:text-sm font-mono font-black text-slate-950 opacity-95 tracking-normal">
                  (Press ESC or SPACE bar to isolate power)
                </span>
              </button>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
