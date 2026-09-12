/**
 * ChildShockRaceLane.tsx
 * 
 * Simple Mode Child Shock Acceptance Component:
 * - Side-by-side Race Lanes: Heartbeat Thump vs 0.03s Leak Guard CLICK
 * - Visual demonstration that 30ms CLICK wins by a mile against a 300ms cardiac cycle
 * - Confetti sticker: "YOU SAVED BABY!"
 * - Audio triggers: Heartbeat thump, breaker CLICK, triumphant cheer
 */

import React, { useEffect, useState } from 'react';
import { homeguardAudio } from '../../utils/homeguardAudio';
import { ShieldCheck, Heart, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface ChildShockRaceLaneProps {
  onComplete?: () => void;
  className?: string;
}

export const ChildShockRaceLane: React.FC<ChildShockRaceLaneProps> = ({
  onComplete,
  className
}) => {
  const [raceStage, setRaceStage] = useState<'ready' | 'racing' | 'finished'>('ready');
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  useEffect(() => {
    // Start race sequence after 200ms
    const startTimer = setTimeout(() => {
      setRaceStage('racing');
      homeguardAudio.playHeartbeatThump();

      // CLICK fires at 30ms (0.03s)
      const clickTimer = setTimeout(() => {
        homeguardAudio.playBreakerTripSound();
      }, 400);

      // Finish sequence after 900ms
      const finishTimer = setTimeout(() => {
        setRaceStage('finished');
        setShowConfetti(true);
        homeguardAudio.playCheerSound();
        if (onComplete) onComplete();
      }, 950);

      return () => {
        clearTimeout(clickTimer);
        clearTimeout(finishTimer);
      };
    }, 200);

    return () => clearTimeout(startTimer);
  }, []);

  return (
    <div 
      className={cn(
        "w-full max-w-lg mx-auto bg-white/95 rounded-3xl p-5 border-4 border-amber-300 shadow-2xl backdrop-blur-md select-none text-slate-800 relative overflow-hidden",
        className
      )}
      style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between mb-4 border-b border-amber-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏁</span>
          <div>
            <h4 className="text-base font-black text-slate-900 leading-tight">
              The 0.03 Second Life-Saving Race
            </h4>
            <span className="text-xs font-bold text-amber-700">
              Can the switch cut power before the heartbeat is harmed?
            </span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300">
          0.03s vs 0.30s
        </span>
      </div>

      {/* Race Lanes */}
      <div className="space-y-4 my-3">
        
        {/* Lane 1: Leak Guard CLICK (Speedy Champion) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              1. Smart Leak Guard (0.03s)
            </span>
            <span className="text-emerald-600 font-bold">
              {raceStage === 'finished' ? '⚡ SNAPPED OFF!' : 'RACING...'}
            </span>
          </div>

          <div className="w-full h-8 bg-emerald-50 rounded-2xl border-2 border-emerald-300 relative overflow-hidden flex items-center p-1">
            {/* Finish Line Flag */}
            <div className="absolute right-2 top-1 bottom-1 w-1 bg-emerald-400 rounded-full z-10" />
            
            {/* Racer Sprite */}
            <div
              className={cn(
                "h-6 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-black text-xs flex items-center gap-1 shadow-md transition-all duration-300",
                raceStage === 'racing' || raceStage === 'finished' ? "w-[96%] justify-end" : "w-16"
              )}
            >
              <span>CLICK!</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Lane 2: Heartbeat Reaction (Slow Runner) */}
        <div className="space-y-1 opacity-90">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="flex items-center gap-1.5 text-rose-700">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
              2. Single Heartbeat (0.30s)
            </span>
            <span className="text-rose-500 font-bold">
              {raceStage === 'finished' ? '🛡️ Protected in time!' : 'Still pumping...'}
            </span>
          </div>

          <div className="w-full h-8 bg-rose-50 rounded-2xl border-2 border-rose-200 relative overflow-hidden flex items-center p-1">
            {/* Racer Sprite (Only crawls to 20% in the same time frame) */}
            <div
              className={cn(
                "h-6 px-2.5 rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-xs flex items-center gap-1 shadow transition-all duration-700",
                raceStage === 'finished' ? "w-[25%]" : raceStage === 'racing' ? "w-[15%]" : "w-12"
              )}
            >
              <span>Lub-Dub</span>
            </div>
          </div>
        </div>

      </div>

      {/* Confetti Sticker Badge: "YOU SAVED BABY!" */}
      {showConfetti && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 border-3 border-white shadow-xl flex items-center justify-between gap-3 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-3xl animate-bounce">👶</span>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-black text-slate-900 tracking-wide">
                🎉 YOU SAVED BABY!
              </div>
              <p className="text-xs font-bold text-emerald-950 truncate">
                Power cut in 0.03s before electricity could harm the heart.
              </p>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-md font-black text-lg">
            ✓
          </div>
        </div>
      )}
    </div>
  );
};
