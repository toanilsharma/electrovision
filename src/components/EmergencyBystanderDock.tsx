import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, CheckCircle2, Lock } from 'lucide-react';

interface EmergencyBystanderDockProps {
  isMuscleLocked: boolean;
  isSimulating: boolean;
  onSwitchOffPower: () => void;
  currentMA?: number;
  voltage?: number;
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
    }, 2800);
    return () => clearTimeout(timer);
  }, [onSwitchOffPower]);

  // Keyboard shortcut handler (Esc or Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSimulating && !isMuscleLocked) return;

      if (e.key === 'Escape' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
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
          /* Docked cleanly over Column 1 region on laptop/desktop so Charts & Human Twin are 100% clear */
          className="fixed bottom-3 left-4 right-4 lg:right-auto lg:left-4 lg:w-[330px] xl:w-[360px] z-[100] pointer-events-none flex flex-col items-center justify-end select-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {showIsolatedChip ? (
            /* Green POWER ISOLATED Hero Card (Child-Simple English) */
            <motion.div
              key="power-isolated-chip"
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="pointer-events-auto w-full rounded-2xl bg-emerald-950/98 border-3 border-emerald-400 text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.8)] backdrop-blur-2xl flex items-center justify-center gap-3 p-3.5 sm:p-4"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 animate-bounce" />
              <div className="flex flex-col text-left min-w-0">
                <span className="text-sm sm:text-base font-black tracking-wider uppercase text-emerald-300 font-sans leading-tight">
                  ✅ CIRCUIT ISOLATED. LIFE SAVED.
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold text-emerald-200 mt-0.5">
                  Standby person stopped the switch. Current cut to 0 mA.
                </span>
              </div>
            </motion.div>
          ) : (
            /* RED MUSCLE-LOCK WARNING + GIANT YELLOW BYSTANDER CUTOFF BUTTON (LARGE HIGH-LEGIBILITY FONT) */
            <motion.div
              key="emergency-bystander-alert-panel"
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="pointer-events-auto w-full flex flex-col gap-2 shadow-2xl"
            >
              {/* Child-Friendly Large Muscle Lock Alert */}
              <div className="p-3 sm:p-4 rounded-2xl bg-red-950/98 border-3 border-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.95)] backdrop-blur-2xl flex items-start gap-3 animate-pulse">
                <div className="p-2 rounded-xl bg-red-900/90 border border-red-400 shrink-0 flex items-center justify-center mt-0.5">
                  <Lock className="w-6 h-6 text-yellow-300 animate-bounce" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-sm sm:text-base md:text-lg font-black uppercase text-yellow-300 tracking-wider font-sans leading-tight drop-shadow">
                    🚨 CANNOT LET GO OF WIRE!
                  </span>
                  <p className="text-xs sm:text-sm font-sans font-bold text-red-100 leading-snug mt-1">
                    Hand muscles frozen tight! Standby person must stop switch!
                  </p>
                </div>
              </div>

              {/* Giant High-Contrast Electric Yellow Bystander Button */}
              <button
                type="button"
                onClick={handleCutoff}
                aria-keyshortcuts="Escape Space"
                className="w-full min-h-[54px] py-2 px-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 active:scale-[0.98] border-3 border-yellow-100 text-slate-950 font-black tracking-wider uppercase shadow-[0_0_35px_rgba(250,204,21,0.95)] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ring-3 ring-yellow-400/60"
              >
                <div className="flex items-center justify-center gap-2 text-center text-sm sm:text-base md:text-lg leading-none font-black text-slate-950">
                  <Zap className="w-5 h-5 fill-slate-950 text-slate-950 shrink-0 animate-bounce" />
                  <span>⚡ STANDBY PERSON: STOP SWITCH</span>
                </div>
                <span className="text-xs sm:text-sm font-mono font-black text-slate-950 opacity-95 tracking-normal mt-0.5">
                  (PRESS ESC OR SPACE BAR)
                </span>
              </button>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
