/**
 * HomeGuardKirchhoffTelemetry.tsx
 * 
 * High-Visibility Kirchhoff Flow & Physical Electrical Telemetry Dashboard
 * Conforms to IEC 60364 / IS 732 residential balance monitoring:
 * - Phase Supply (I_L)
 * - Neutral Return (I_N)
 * - Residual Leakage (IΔn)
 * - Kirchhoff Flux Equilibrium (Φ = 0 vs Unbalanced Trip)
 */

import React, { useMemo } from 'react';
import { CircuitState } from '../hooks/useHomeGuardEngine';
import { calculatePowerBreakdown } from '../data/homeguardAppliances';
import { cn } from '@/src/lib/utils';
import { Zap, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface HomeGuardKirchhoffTelemetryProps {
  circuitStates: Record<string, CircuitState>;
  activeApplianceIds: string[];
  scenarioId?: string;
  className?: string;
  isCompact?: boolean;
}

export const HomeGuardKirchhoffTelemetry: React.FC<HomeGuardKirchhoffTelemetryProps> = ({
  circuitStates,
  activeApplianceIds,
  scenarioId = 'winter_overload_145',
  className,
  isCompact = false
}) => {
  const c1State = circuitStates.c1_lighting;
  const c2State = circuitStates.c2_living_sockets;
  const c3State = circuitStates.c3_kitchen_sockets;
  const rccbState = circuitStates.main_rccb;

  const isRCCBClosed = rccbState?.state === 'CLOSED';
  const isC1Closed = isRCCBClosed && c1State?.state === 'CLOSED';
  const isC2Closed = isRCCBClosed && c2State?.state === 'CLOSED';
  const isC3Closed = isRCCBClosed && c3State?.state === 'CLOSED';

  const isChildShock = scenarioId === 'child_touch_shock' || scenarioId === 'preset_child_shock';
  const isWetBath = scenarioId === 'kettle_earth_leakage' || scenarioId === 'preset_wet_bath';

  // Multi-branch live electrical calculation
  const powerBreakdown = useMemo(() => calculatePowerBreakdown(activeApplianceIds), [activeApplianceIds]);
  const c1Amps = isC1Closed ? (powerBreakdown.c1Amps > 0 ? powerBreakdown.c1Amps : 1.2) : 0;
  const c2Amps = isC2Closed ? powerBreakdown.c2Amps : 0;
  const c3Amps = isC3Closed ? powerBreakdown.c3Amps : 0;
  const totalIncomerAmps = isRCCBClosed ? Number((c1Amps + c2Amps + c3Amps).toFixed(1)) : 0;

  // Real-time Kirchhoff calculations
  const leakageMA = (isChildShock ? 230 : isWetBath ? 45 : 0);
  const neutralReturnAmps = isRCCBClosed ? Math.max(0, totalIncomerAmps - (leakageMA / 1000)) : 0;
  const isUnbalanced = leakageMA >= 30;

  return (
    <div className={cn("bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 space-y-2 shadow-md", className)}>
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          KIRCHHOFF & FLOW TELEMETRY
        </span>
        <span className="text-[9px] font-bold text-slate-400 font-mono">
          IEC 60364
        </span>
      </div>

      <div className={cn("grid gap-1.5", isCompact ? "grid-cols-2" : "grid-cols-2")}>
        {/* Card 1: Phase Supply (I_L) */}
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide truncate">
            Phase Supply (I_L)
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-amber-400 my-0.5">
            {totalIncomerAmps.toFixed(1)} A
          </div>
          <div className="text-[8px] text-slate-500 truncate">
            Mains Incomer Live
          </div>
        </div>

        {/* Card 2: Neutral Return (I_N) */}
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide truncate">
            Neutral Return (I_N)
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-sky-400 my-0.5">
            {neutralReturnAmps.toFixed(2)} A
          </div>
          <div className="text-[8px] text-slate-500 truncate">
            Return via Toroid
          </div>
        </div>

        {/* Card 3: Residual Leakage (IΔn) */}
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide truncate">
            Residual Leak (IΔn)
          </div>
          <div className={cn(
            "text-base sm:text-lg font-black font-mono my-0.5",
            isUnbalanced ? "text-rose-400 animate-pulse" : leakageMA > 0 ? "text-amber-400" : "text-emerald-400"
          )}>
            {leakageMA} mA
          </div>
          <div className="text-[8px] text-slate-500 truncate">
            {isUnbalanced ? 'Exceeds 30mA!' : 'Safe < 30mA limit'}
          </div>
        </div>

        {/* Card 4: Kirchhoff Equilibrium */}
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide truncate">
            Flux Balance
          </div>
          <div className={cn(
            "text-[10px] sm:text-[11px] font-black font-mono my-0.5 flex items-center gap-1",
            isUnbalanced ? "text-rose-400" : "text-emerald-400"
          )}>
            {isUnbalanced ? (
              <>
                <ShieldAlert className="w-3 h-3 shrink-0" />
                <span className="truncate">UNBALANCED</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span className="truncate">BALANCED (Φ=0)</span>
              </>
            )}
          </div>
          <div className="text-[8px] text-slate-500 truncate">
            {isUnbalanced ? 'Trip Solenoid Fired' : 'RCCB Closed & Armed'}
          </div>
        </div>
      </div>
    </div>
  );
};
