/**
 * ApplianceDiscoveryCue.tsx
 * 
 * Animated Pulsing Discovery Beacon & Coachmark (Rec 3)
 * Teaches non-electrical users that appliances and loads are fully interactive.
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { Sparkles, X, Power, ArrowDown } from 'lucide-react';

export interface ApplianceDiscoveryCueProps {
  onDismiss?: () => void;
  className?: string;
}

export const ApplianceDiscoveryCue: React.FC<ApplianceDiscoveryCueProps> = ({
  onDismiss,
  className
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('homeguard_appliance_hint_seen') !== 'true';
    }
    return true;
  });

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homeguard_appliance_hint_seen', 'true');
    }
    if (onDismiss) onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "z-40 pointer-events-auto animate-in fade-in zoom-in-95 duration-300",
        className
      )}
    >
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-2.5 sm:p-3 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center gap-2.5 max-w-md">
        
        {/* Pulsing Hand Icon */}
        <div className="w-9 h-9 rounded-xl bg-slate-950/90 text-amber-300 flex items-center justify-center text-lg shrink-0 shadow-inner animate-bounce">
          👆
        </div>

        {/* Coachmark Text */}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1 font-black text-xs uppercase tracking-wider text-slate-950">
            <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
            <span>Interactive Simulator:</span>
          </div>
          <p className="text-[11.5px] font-bold text-slate-950 mt-0.5">
            Click any appliance in the house (or the switchboard below) to toggle power <span className="underline decoration-slate-950 decoration-2">ON & OFF</span>!
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-7 h-7 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 flex items-center justify-center cursor-pointer transition-colors shrink-0"
          title="Got it!"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
