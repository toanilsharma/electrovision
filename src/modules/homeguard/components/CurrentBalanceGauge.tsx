/**
 * CurrentBalanceGauge.tsx
 * 
 * "Water In vs Water Out" Visual Balance Meter (Rec 7)
 * Makes Kirchhoff's Current Law and RCCB Differential Operation intuitive
 * for non-electrical users using a dual-tube water balance metaphor.
 */

import React from 'react';
import { cn } from '@/src/lib/utils';
import { Zap, ShieldAlert, ShieldCheck, Droplets, Info, X } from 'lucide-react';

export interface CurrentBalanceGaugeProps {
  liveAmps: number;
  neutralAmps: number;
  leakageCurrentMA: number;
  isTripped: boolean;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export const CurrentBalanceGauge: React.FC<CurrentBalanceGaugeProps> = ({
  liveAmps,
  neutralAmps,
  leakageCurrentMA,
  isTripped,
  isOpen,
  onClose,
  className
}) => {
  if (!isOpen) return null;

  const isLeaking = leakageCurrentMA > 0 && !isTripped;
  const isProtected = isTripped && leakageCurrentMA > 0;

  // Max scale for visual tube height (up to 32A)
  const maxAmps = 25;
  const livePercent = Math.min(100, Math.max(8, (liveAmps / maxAmps) * 100));
  const neutralPercent = Math.min(100, Math.max(8, (neutralAmps / maxAmps) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className={cn(
        "relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-5 flex flex-col gap-4 font-sans text-slate-100",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                CURRENT BALANCE METER (KCL)
              </h3>
              <span className="text-[10px] text-slate-400 block">
                How Your 30mA Life-Saver Switch (RCCB) Detects Shocks
              </span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dual Liquid Tubes: Live vs Neutral */}
        <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
          
          {/* Live In Column */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-black text-orange-400 uppercase">
              <span>⚡ Live Current In</span>
            </div>

            {/* Tube Frame */}
            <div className="w-14 h-44 rounded-full bg-slate-900 border-2 border-orange-500/40 p-1 flex flex-col justify-end relative overflow-hidden shadow-inner">
              <div
                className="w-full rounded-full bg-gradient-to-t from-orange-600 via-orange-500 to-amber-400 transition-all duration-300 relative shadow-lg shadow-orange-500/40"
                style={{ height: `${livePercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Readout */}
            <span className="text-sm font-black font-mono text-orange-300">
              {isTripped ? '0.00 A' : `${liveAmps.toFixed(2)} A`}
            </span>
            <span className="text-[9.5px] text-slate-400 text-center">
              Pushed from Grid
            </span>
          </div>

          {/* Neutral Return Column */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-black text-blue-400 uppercase">
              <span>⬅ Neutral Return</span>
            </div>

            {/* Tube Frame */}
            <div className="w-14 h-44 rounded-full bg-slate-900 border-2 border-blue-500/40 p-1 flex flex-col justify-end relative overflow-hidden shadow-inner">
              <div
                className="w-full rounded-full bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-400 transition-all duration-300 relative shadow-lg shadow-blue-500/40"
                style={{ height: `${neutralPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full" />
              </div>
            </div>

            {/* Readout */}
            <span className="text-sm font-black font-mono text-blue-300">
              {isTripped ? '0.00 A' : `${neutralAmps.toFixed(2)} A`}
            </span>
            <span className="text-[9.5px] text-slate-400 text-center">
              Returning to Grid
            </span>
          </div>

        </div>

        {/* Center Differential Status Badge */}
        <div className={cn(
          "p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs transition-all",
          isLeaking
            ? "bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse"
            : isProtected
            ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
            : "bg-slate-950 border-slate-800 text-slate-300"
        )}>
          <div className="flex items-center gap-2">
            {isLeaking ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <span className="font-black block uppercase tracking-wider text-[11px]">
                {isLeaking ? "⚠️ LEAKAGE DETECTED!" : isProtected ? "🛡️ PROTECTED BY RCCB (TRIPPED)" : "✓ BALANCED & SAFE"}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Imbalance (ΔI): {isTripped ? '0.0 mA' : `${leakageCurrentMA.toFixed(1)} mA`}
              </span>
            </div>
          </div>

          <span className={cn(
            "text-xs font-black font-mono px-2 py-0.5 rounded-lg border",
            leakageCurrentMA >= 30
              ? "bg-rose-500 text-slate-950 border-rose-400"
              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
          )}>
            {leakageCurrentMA >= 30 ? "TRIP ≥ 30mA" : "< 30mA SAFE"}
          </span>
        </div>

        {/* The Everyday Metaphor Explanation */}
        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-1 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-1 font-bold text-cyan-400 text-[11px]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>The Water Pipe Metaphor:</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Electricity works like a closed loop of water. Every drop pushed in through the <strong>Live</strong> wire must return through the <strong>Neutral</strong> wire.
          </p>
          <p className="text-[11px] text-slate-400">
            If a child touches a socket or an appliance leaks into water, electricity escapes into ground. Your <strong>30mA Life-Saver Switch</strong> senses the missing drops and snaps power OFF in <strong>0.03 seconds</strong>!
          </p>
        </div>

        {/* Dismiss Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors cursor-pointer text-center shadow-md"
          >
            Close Balance Gauge
          </button>
        )}

      </div>
    </div>
  );
};
