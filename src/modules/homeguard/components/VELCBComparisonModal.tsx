/**
 * Modern RCCB vs Obsolete v-ELCB Comparative Laboratory Modal
 * 
 * Standard:
 * - Modern: IEC 61008-1 (Current-Operated Residual Current Device)
 * - Obsolete: Pre-IEC 61008 / BS 4293 (Voltage-Operated Earth Leakage Circuit Breaker)
 * 
 * Key Learning Objectives:
 * 1. Understand why v-ELCBs were phased out worldwide in favor of RCCBs.
 * 2. Demonstrate the fatal failure mode: when the protective earth wire (CPC) is broken,
 *    the v-ELCB coil receives 0V and FAILS TO TRIP, leaving the appliance frame at 230V!
 * 3. Demonstrate that modern RCCBs still trip safely because they detect net differential
 *    magnetic flux in the toroid (IL != IN).
 */

import React, { useState, useMemo } from 'react';
import { createVELCB, VELCB_OBSOLETE_LABEL } from '../physics/vElcbModel';
import { createRCD } from '@/src/core/physics/rcdEngine';
import { cn } from '@/src/lib/utils';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  X,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

export interface VELCBComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VELCBComparisonModal: React.FC<VELCBComparisonModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isEarthIntact, setIsEarthIntact] = useState<boolean>(true);
  const [hasFault, setHasFault] = useState<boolean>(true);
  const [hasParallelPath, setHasParallelPath] = useState<boolean>(false);
  const [humanTouching, setHumanTouching] = useState<boolean>(false);

  // Core engines
  const vElcbEngine = useMemo(() => createVELCB({ tripVoltageThreshold: 50 }), []);
  const rccbEngine = useMemo(() => createRCD({ iDeltaN: 30 }), []);

  // Evaluate v-ELCB
  const vElcbResult = useMemo(() => {
    const frameVoltage = hasFault ? 230 : 0;
    const parallelR = hasParallelPath ? 3 : Infinity;
    return vElcbEngine.evaluate({
      frameVoltage,
      isEarthConductorIntact: isEarthIntact,
      parallelEarthResistance: parallelR
    });
  }, [vElcbEngine, hasFault, isEarthIntact, hasParallelPath]);

  // Evaluate Modern RCCB
  const rccbResult = useMemo(() => {
    // Current leaking to earth
    let leakageMA = 0;
    if (hasFault) {
      if (isEarthIntact) {
        // High leakage directly to earth conductor (e.g. 500mA or more)
        leakageMA = 500;
      } else if (humanTouching) {
        // Human touches 230V live chassis -> body impedance ~1000-2000 ohms -> ~150mA shock current!
        leakageMA = 150;
      } else {
        // Small capacitive / insulation leakage
        leakageMA = 5;
      }
    }
    const evalRes = rccbEngine.evaluate(leakageMA);
    return {
      leakageMA,
      isTripped: evalRes.shouldTrip,
      tripTimeMs: evalRes.tripTimeMs,
      explanation: evalRes.shouldTrip
        ? `Toroidal core sensed unbalanced magnetic flux (IΔn = ${leakageMA}mA > 30mA threshold). Tripped in ${evalRes.tripTimeMs}ms, disconnecting power immediately!`
        : `Toroid net flux balanced or below 30mA threshold (${leakageMA}mA). Breaker holds.`
    };
  }, [rccbEngine, hasFault, isEarthIntact, humanTouching]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-750 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto text-slate-100 font-mono">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-wide">
                  ⚠️ THE BROKEN GROUND WIRE TRAP: 1980s SWITCH vs TODAY'S SAFETY SWITCH
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-800">
                  {VELCB_OBSOLETE_LABEL}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Why old 1980s voltage switches failed when an earth wire broke, and why modern RCCBs are mandatory worldwide
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item 6 Family Story Card */}
        <div className="my-2 p-3 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-rose-950/60 border border-slate-750 text-xs font-sans text-slate-200 shrink-0">
          <p className="leading-relaxed">
            <strong className="text-amber-300 font-bold">The 1980s Danger Trap:</strong> Old voltage switches needed the green ground wire to sense danger. If a rat chewed the green wire, or a nail severed it, the old switch went completely blind—leaving a metal washing machine electrified to a deadly 230V without tripping! Modern safety switches (RCCB) measure the live current balance directly, cutting power in 0.03s even with a broken ground wire.
          </p>
        </div>

        {/* Interactive Experiment Controls */}
        <div className="my-3 p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-bold uppercase text-[11px]">FAULT LAB CONTROLS:</span>

            {/* Appliance Fault Toggle */}
            <button
              type="button"
              onClick={() => setHasFault(f => !f)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1.5",
                hasFault
                  ? "bg-rose-600 text-white border-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{hasFault ? "FAULT: 230V Live Chassis Active" : "CHASSIS: Normal 0V"}</span>
            </button>

            {/* Earth Wire Continuity (CPC) Toggle */}
            <button
              type="button"
              onClick={() => setIsEarthIntact(e => !e)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1.5",
                isEarthIntact
                  ? "bg-emerald-600 text-white border-emerald-400"
                  : "bg-amber-600 text-slate-950 border-amber-300 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse"
              )}
            >
              {isEarthIntact ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{isEarthIntact ? "Earth Conductor (CPC): INTACT" : "Earth Conductor: BROKEN / SEVERED!"}</span>
            </button>

            {/* Parallel Plumbing Path Toggle */}
            <button
              type="button"
              onClick={() => setHasParallelPath(p => !p)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1.5",
                hasParallelPath
                  ? "bg-cyan-600 text-white border-cyan-400"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
              )}
            >
              <span>{hasParallelPath ? "Parallel Metal Pipe: CONNECTED (3Ω)" : "Parallel Pipe: NONE"}</span>
            </button>

            {/* Human Touch Toggle (Active when earth is broken) */}
            {!isEarthIntact && hasFault && (
              <button
                type="button"
                onClick={() => setHumanTouching(h => !h)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1.5",
                  humanTouching
                    ? "bg-rose-500 text-slate-950 border-rose-300 font-black animate-bounce"
                    : "bg-slate-800 text-amber-300 border-amber-500/50 hover:bg-slate-750"
                )}
              >
                <span>{humanTouching ? "⚠️ PERSON TOUCHING CHASSIS!" : "Simulate Person Touching Frame"}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setHasFault(true);
              setIsEarthIntact(false);
              setHasParallelPath(false);
              setHumanTouching(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-bold hover:bg-rose-900 cursor-pointer flex items-center gap-1"
            title="Load the classic historical failure scenario"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Load Broken Earth Fatal Flaw</span>
          </button>
        </div>

        {/* Side-by-Side Breaker Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          
          {/* 1. MODERN CURRENT-OPERATED RCCB (IEC 61008-1) */}
          <div className="flex flex-col bg-slate-950 border border-emerald-500/40 rounded-xl p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs uppercase">MODERN RCCB (RCD)</span>
                  <div className="text-[10px] text-emerald-400 font-sans">IEC 61008-1 Standard (Current-Operated)</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                RECOMMENDED
              </span>
            </div>

            {/* Operating Principle Diagram / Summary */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-sans space-y-1 mb-3">
              <div className="font-mono font-bold text-emerald-300 text-[11px]">
                PRINCIPLE: Differential Current Toroid (IL - IN)
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Measures current imbalance passing through the ferrite ring. Does not rely on the earth conductor to detect a leak.
              </p>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Leakage Current (IΔn)</div>
                <div className="text-sm font-black text-cyan-400">{rccbResult.leakageMA} mA</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Break Time</div>
                <div className="text-sm font-black text-purple-300">
                  {rccbResult.isTripped ? `${rccbResult.tripTimeMs} ms` : '∞ (Holding)'}
                </div>
              </div>
            </div>

            {/* Trip Verdict Banner */}
            <div className={cn(
              "p-3 rounded-xl border flex items-center gap-2.5 font-mono text-xs mb-2",
              rccbResult.isTripped
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                : "bg-slate-900 border-slate-800 text-slate-300"
            )}>
              {rccbResult.isTripped ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-300 uppercase">PROTECTION SUCCESSFUL: TRIPPED</div>
                    <div className="text-[11px] font-sans text-slate-300">{rccbResult.explanation}</div>
                  </div>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-300 uppercase">CIRCUIT ARMED & ENERGIZED</div>
                    <div className="text-[11px] font-sans text-slate-400">{rccbResult.explanation}</div>
                  </div>
                </>
              )}
            </div>

            {/* Safety Verdict */}
            <div className="mt-auto pt-2 text-[11px] font-sans text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Safe even if the earth wire is completely cut or disconnected.</span>
            </div>
          </div>

          {/* 2. OBSOLETE VOLTAGE-OPERATED v-ELCB (PRE-IEC 61008) */}
          <div className={cn(
            "flex flex-col bg-slate-950 border rounded-xl p-4 relative overflow-hidden shadow-lg transition-colors",
            vElcbResult.status === 'CRITICAL_FAILURE_CPC_BROKEN'
              ? "border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              : "border-slate-800"
          )}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-rose-500/20 border border-rose-500/50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs uppercase">VOLTAGE ELCB (v-ELCB)</span>
                  <div className="text-[10px] text-rose-400 font-sans">Pre-IEC 61008 / BS 4293 (1950s-70s)</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-400 border border-rose-700 animate-pulse">
                OBSOLETE
              </span>
            </div>

            {/* Operating Principle Diagram / Summary */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-sans space-y-1 mb-3">
              <div className="font-mono font-bold text-amber-300 text-[11px]">
                PRINCIPLE: Frame-to-Earth Voltage Sensing Coil
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Relies on the protective earth wire to bring frame voltage to its internal trip coil.
              </p>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Coil Voltage (Vcoil)</div>
                <div className={cn(
                  "text-sm font-black",
                  vElcbResult.coilVoltage >= 50 ? "text-amber-400" : "text-slate-200"
                )}>
                  {vElcbResult.coilVoltage} V (50V trip target)
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Frame Voltage (Hazard)</div>
                <div className={cn(
                  "text-sm font-black",
                  vElcbResult.chassisVoltage >= 50 ? "text-rose-500 animate-pulse" : "text-slate-200"
                )}>
                  {vElcbResult.chassisVoltage} V
                </div>
              </div>
            </div>

            {/* Trip Verdict Banner */}
            <div className={cn(
              "p-3 rounded-xl border flex items-center gap-2.5 font-mono text-xs mb-2",
              vElcbResult.status === 'CRITICAL_FAILURE_CPC_BROKEN'
                ? "bg-rose-950 border-rose-500 text-rose-200"
                : vElcbResult.isTripped
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                : "bg-slate-900 border-slate-800 text-slate-300"
            )}>
              {vElcbResult.status === 'CRITICAL_FAILURE_CPC_BROKEN' ? (
                <>
                  <XCircle className="w-6 h-6 text-rose-500 shrink-0 animate-bounce" />
                  <div>
                    <div className="font-black text-rose-400 uppercase tracking-wide">
                      FATAL FLAW: BREAKER FAILED TO TRIP!
                    </div>
                    <div className="text-[11px] font-sans text-rose-200 leading-snug">
                      {vElcbResult.explanation}
                    </div>
                  </div>
                </>
              ) : vElcbResult.isTripped ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-300 uppercase">TRIPPED VIA EARTH VOLTAGE</div>
                    <div className="text-[11px] font-sans text-slate-300">{vElcbResult.explanation}</div>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-300 uppercase">STANDBY / NO TRIP</div>
                    <div className="text-[11px] font-sans text-slate-400">{vElcbResult.explanation}</div>
                  </div>
                </>
              )}
            </div>

            {/* Historical Note */}
            <div className="mt-auto pt-2 text-[11px] font-sans text-rose-300 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Withdrawn from global electrical wiring codes due to lethal failure modes.</span>
            </div>
          </div>
        </div>

        {/* Educational Summary Card */}
        <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-sans">
          <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5 font-mono">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            SUMMARY: WHY THE IEC MANDATES CURRENT-OPERATED RCCBS
          </div>
          <p className="text-slate-400 leading-relaxed">
            A voltage-operated breaker (v-ELCB) only knows what its earth wire tells it. If that wire is cut by a gardener,
            corroded under the ground, or bypassed by metal water pipes, the breaker is <strong>completely blind</strong>.
            The modern current-operated RCCB looks directly at the balance of electricity entering and leaving through its
            toroidal ferrite ring. If even 30 milliamps vanishes into a human body, it snaps off in milliseconds regardless of the earth wire condition.
          </p>
        </div>
      </div>
    </div>
  );
};
