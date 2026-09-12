/**
 * ThermometerHeatDial.tsx
 * 
 * Simple Mode Overload Visualizer:
 * - Wire glow: yellow -> bright glowing red
 * - Sweating thermometer emoji face: 🙂 -> 😐 -> 😰
 * - Big circular countdown dial displaying seconds until safety trip
 */

import React from 'react';
import { cn } from '@/src/lib/utils';
import { Flame, Clock } from 'lucide-react';

export interface ThermometerHeatDialProps {
  countdownSec: number;
  maxCountdownSec?: number;
  currentWatts: number;
  isTripped: boolean;
  className?: string;
}

export const ThermometerHeatDial: React.FC<ThermometerHeatDialProps> = ({
  countdownSec,
  maxCountdownSec = 60,
  currentWatts,
  isTripped,
  className
}) => {
  const isHeating = currentWatts > 3680 && !isTripped;
  const progressPct = isHeating 
    ? Math.max(0, Math.min(100, ((maxCountdownSec - countdownSec) / maxCountdownSec) * 100))
    : 0;

  // Emotional thermometer state
  const emoji = isTripped ? '🛡️' : progressPct > 70 ? '😰' : progressPct > 30 ? '😐' : '🙂';
  const moodText = isTripped 
    ? 'Power cut safely!' 
    : progressPct > 70 
    ? 'Wire is sweating fever heat!' 
    : progressPct > 30 
    ? 'Getting quite warm...' 
    : 'Cool & cozy wire';

  return (
    <div 
      className={cn(
        "w-full max-w-sm mx-auto bg-white/95 rounded-3xl p-5 border-4 border-amber-300 shadow-2xl backdrop-blur-md select-none text-slate-800 flex flex-col items-center gap-3",
        className
      )}
      style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
    >
      <div className="flex items-center justify-between w-full border-b border-amber-100 pb-2">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span className="text-sm font-black text-slate-900">
            Wire Fever Gauge
          </span>
        </div>
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-xs font-black",
          isTripped ? "bg-emerald-100 text-emerald-800" : isHeating ? "bg-rose-100 text-rose-800 animate-pulse" : "bg-amber-100 text-amber-800"
        )}>
          {isTripped ? 'SAVED' : isHeating ? 'OVERLOAD' : 'NORMAL'}
        </span>
      </div>

      {/* Big Circular Countdown Dial with Sweating Face */}
      <div className="relative w-36 h-36 flex items-center justify-center my-1">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="48"
            stroke="#fef3c7"
            strokeWidth="12"
            fill="none"
          />
          {/* Active progress arc */}
          <circle
            cx="60"
            cy="60"
            r="48"
            stroke={isTripped ? '#10b981' : progressPct > 60 ? '#ef4444' : '#f59e0b'}
            strokeWidth="12"
            strokeDasharray={2 * Math.PI * 48}
            strokeDashoffset={(2 * Math.PI * 48) * (1 - progressPct / 100)}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-300"
          />
        </svg>

        {/* Center Face & Seconds Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl filter drop-shadow animate-pulse">
            {emoji}
          </span>
          <span className="text-xs font-black text-slate-700 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            {isTripped ? '0s' : `${Math.ceil(countdownSec)}s`}
          </span>
        </div>
      </div>

      {/* Wire Heat Tube Bar */}
      <div className="w-full space-y-1">
        <div className="flex justify-between text-xs font-bold text-slate-600">
          <span>Copper Wire Heat:</span>
          <span className={isHeating ? "text-rose-600 font-black" : "text-emerald-600 font-black"}>
            {moodText}
          </span>
        </div>
        <div className="w-full h-3.5 bg-amber-100 rounded-full overflow-hidden p-0.5 border border-amber-200">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isTripped 
                ? "bg-emerald-500" 
                : progressPct > 60 
                ? "bg-gradient-to-r from-amber-400 to-rose-600 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" 
                : "bg-gradient-to-r from-emerald-400 to-amber-400"
            )}
            style={{ width: `${Math.max(8, progressPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
