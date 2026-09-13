/**
 * WhatJustHappenedCard.tsx
 * 
 * 3-Beat "What Just Happened?" Trip Explanation Card (Rec 8)
 * Explains in plain language:
 * 1. What caused the trip
 * 2. Which safety switch protected the home
 * 3. What to do now (Unplug first, then push switch UP)
 * Includes 1-tap "Unplug Heavy Loads & Reset" button.
 */

import React from 'react';
import { cn } from '@/src/lib/utils';
import {
  AlertTriangle,
  Flame,
  Zap,
  HeartPulse,
  Droplets,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  X
} from 'lucide-react';

export interface WhatJustHappenedCardProps {
  tripType: 'overload' | 'short_circuit' | 'child_shock' | 'water_leak' | 'test_trip' | null;
  onQuickFixReset: () => void;
  onDismiss: () => void;
  className?: string;
}

export const WhatJustHappenedCard: React.FC<WhatJustHappenedCardProps> = ({
  tripType,
  onQuickFixReset,
  onDismiss,
  className
}) => {
  if (!tripType) return null;

  const content = {
    overload: {
      title: "WIRE OVERLOAD PREVENTED!",
      icon: <Flame className="w-5 h-5 text-amber-400" />,
      badge: "🔥 Fire-Guard (MCB) Tripped",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      beat1: "Heavy heaters/appliances drew ~23A on a 16-Amp socket line (145% over safe capacity).",
      beat2: "The Socket Fire-Guard (MCB C16) timed out and tripped before hidden wall wires could overheat and burn.",
      beat3: "Unplug the Space Heater or Kettle first, then push the breaker switch UP at the DB fuse box."
    },
    short_circuit: {
      title: "INSTANT SHORT CIRCUIT QUENCHED!",
      icon: <Zap className="w-5 h-5 text-rose-400" />,
      badge: "⚡ Instant Magnetic Trip (<10ms)",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      beat1: "Crushed appliance cord caused Live and Neutral wires to touch, creating an explosive 250A surge.",
      beat2: "The magnetic coil snapped the breaker open in under 0.01s, safely quenching the electric arc.",
      beat3: "Discard or repair the damaged cord before pushing the breaker switch back UP."
    },
    child_shock: {
      title: "LIFE-SAVER TRIPPED: CHILD IS SAFE!",
      icon: <HeartPulse className="w-5 h-5 text-emerald-400" />,
      badge: "🛡️ Life-Saver RCCB Tripped in 0.03s",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      beat1: "Wet skin contacted 230V live electricity (230mA shock current).",
      beat2: "Regular switches ignore 0.23A, but the 30mA Life-Saver sensed missing current and cut power in 0.03s!",
      beat3: "Child is safe from ventricular fibrillation. Ensure safety shutter sockets are installed."
    },
    water_leak: {
      title: "WATER LEAKAGE DETECTED!",
      icon: <Droplets className="w-5 h-5 text-cyan-400" />,
      badge: "💧 45mA Earth Leakage Cutoff",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      beat1: "Water splashed into an electrical appliance element, leaking 45mA into the metallic frame.",
      beat2: "The 30mA Life-Saver RCCB detected current leaking into earth ground and isolated the house.",
      beat3: "Dry out the appliance and inspect seals before restoring power."
    },
    test_trip: {
      title: "MONTHLY TEST BUTTON VERIFIED!",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      badge: "🟡 Monthly Test 'T' Button Pressed",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      beat1: "You simulated a 30mA internal test leakage by pressing the yellow 'T' button.",
      beat2: "The internal trip mechanism mechanically released smoothly, proving the spring and coil work.",
      beat3: "Push the switch UP to re-arm your Life-Saver. Electricians recommend testing monthly!"
    }
  }[tripType];

  return (
    <div className={cn(
      "fixed top-16 right-3 sm:top-20 sm:right-6 z-50 w-[92%] sm:w-96 max-w-sm animate-in slide-in-from-right-4 duration-200 select-none",
      className
    )}>
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl shadow-2xl p-3.5 sm:p-4 text-slate-100 flex flex-col gap-2.5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 border border-slate-700">
              {content.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white uppercase tracking-wide">
                  {content.title}
                </span>
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", content.badgeColor)}>
                  {content.badge}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Beats */}
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 font-bold shrink-0">1. Cause:</span>
            <span className="text-[11.5px] leading-snug">{content.beat1}</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold shrink-0">2. Saved:</span>
            <span className="text-[11.5px] leading-snug">{content.beat2}</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold shrink-0">3. Action:</span>
            <span className="text-[11.5px] leading-snug text-slate-200 font-medium">{content.beat3}</span>
          </div>
        </div>

        {/* Quick-Fix Button */}
        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={onQuickFixReset}
            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-98"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Unplug Heavy Load & Safely Push Switch UP</span>
          </button>
        </div>

      </div>
    </div>
  );
};
