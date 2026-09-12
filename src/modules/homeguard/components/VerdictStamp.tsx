/**
 * Verdict Stamp Component (Core Alert Overlay)
 * 
 * Renders an authentic, high-impact rubber-stamp verdict over the simulation viewport:
 * - 'SURVIVED': Green double-border, shield check, rapid clearance metrics.
 * - 'LETHAL': Red grunge double-border, skull / alert, ventricular fibrillation metrics.
 */

import React from 'react';
import { cn } from '@/src/lib/utils';
import { ShieldCheck, Skull, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface VerdictStampProps {
  verdict: 'SURVIVED' | 'LETHAL';
  tripTimeMs?: number;
  durationMs: number;
  vfProbabilityPercent: number;
  bodyCurrentMA: number;
  zoneLabel: string;
  className?: string;
}

export const VerdictStamp: React.FC<VerdictStampProps> = ({
  verdict,
  tripTimeMs,
  durationMs,
  vfProbabilityPercent,
  bodyCurrentMA,
  zoneLabel,
  className
}) => {
  const isSurvived = verdict === 'SURVIVED';

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px] z-30 pointer-events-none select-none animate-in zoom-in-75 duration-200",
        className
      )}
    >
      <div
        className={cn(
          "px-6 py-4 rounded-2xl border-4 text-center transform shadow-2xl flex flex-col items-center gap-1.5 backdrop-blur-md max-w-sm",
          isSurvived
            ? "border-emerald-400 bg-emerald-950/90 text-emerald-300 rotate-[-6deg] shadow-[0_0_30px_rgba(16,185,129,0.4)]"
            : "border-rose-500 bg-rose-950/90 text-rose-300 rotate-[6deg] shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse"
        )}
      >
        {/* Top Header Icon & Tag */}
        <div className="flex items-center gap-2 mb-0.5">
          {isSurvived ? (
            <ShieldCheck className="w-6 h-6 text-emerald-400 animate-bounce" />
          ) : (
            <Skull className="w-6 h-6 text-rose-400 animate-bounce" />
          )}
          <span className="text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-black/40 border border-current">
            IEC 60479 VERDICT
          </span>
        </div>

        {/* Primary Verdict Text */}
        <div className="text-2xl sm:text-3xl font-black uppercase tracking-wider font-mono">
          {isSurvived ? "SURVIVED!" : "LETHAL ARREST!"}
        </div>

        {/* Subtitle / Core Explanation */}
        <div className="text-xs font-bold font-sans">
          {isSurvived
            ? `RCCB Disconnected in ${tripTimeMs ?? 30}ms`
            : "MCB Blind to 230mA Shock Current"}
        </div>

        {/* Diagnostic Breakdown Matrix */}
        <div className="w-full mt-2 pt-2 border-t border-current/30 grid grid-cols-2 gap-1.5 text-[10px] font-mono text-left">
          <div>
            <span className="opacity-70">CURRENT: </span>
            <strong className="text-white">{bodyCurrentMA.toFixed(0)} mA</strong>
          </div>
          <div>
            <span className="opacity-70">SHOCK TIME: </span>
            <strong className="text-white">{durationMs.toFixed(0)} ms</strong>
          </div>
          <div>
            <span className="opacity-70">ZONE: </span>
            <strong className="text-white">{zoneLabel}</strong>
          </div>
          <div>
            <span className="opacity-70">VF RISK: </span>
            <strong className={isSurvived ? "text-emerald-300" : "text-rose-400 font-black"}>
              {vfProbabilityPercent}%
            </strong>
          </div>
        </div>

        {/* Rubber Stamp Double Rim Visual Indicator */}
        <div className="w-full mt-1 text-[9px] uppercase tracking-wider opacity-80 border-t border-dashed border-current/40 pt-1 font-sans">
          {isSurvived
            ? "Protected by IEC 61008 Residual Detection"
            : "Requires RCD Protection (IEC 60364-4-41)"}
        </div>
      </div>
    </div>
  );
};
