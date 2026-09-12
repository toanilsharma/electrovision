/**
 * Residential Distribution Board (Consumer Unit / DB Box)
 * 
 * Simple, Clean, Zero-Scrollbar Architecture:
 * - Direct visual DIN rail mounting of 4 modular breakers
 * - Clear, large MCB figures with interactive toggle levers and status indicators
 * - 1-click push UP to reset or flip DOWN to trip
 * - Prominent Yellow Test "T" button on RCCB
 * - Zero vertical/horizontal scrollbars and zero clutter
 */

import React from 'react';
import { ModularDeviceFaceplate } from '../../../core/ui/faceplates/ModularDeviceFaceplate';
import { CircuitState } from '../hooks/useHomeGuardEngine';
import { cn } from '@/src/lib/utils';
import { Zap, ShieldCheck, AlertTriangle } from 'lucide-react';

export interface DistributionBoardProps {
  circuitStates: Record<string, CircuitState>;
  onRecloseBreaker: (circuitId: string) => void;
  onTestTripRCCB: () => void;
  leakageCurrentMA?: number;
  isOpenDoor?: boolean;
  onToggleDoor?: () => void;
  className?: string;
}

export const DistributionBoard: React.FC<DistributionBoardProps> = ({
  circuitStates,
  onRecloseBreaker,
  onTestTripRCCB,
  className
}) => {
  const c2State = circuitStates.c2_living_sockets;
  const rccbState = circuitStates.main_rccb;
  const c1State = circuitStates.c1_lighting;
  const c3State = circuitStates.c3_kitchen_sockets;

  const isAnyTripped =
    c2State?.state !== 'CLOSED' ||
    rccbState?.state !== 'CLOSED' ||
    c1State?.state !== 'CLOSED' ||
    c3State?.state !== 'CLOSED';

  return (
    <div
      className={cn(
        "flex flex-col justify-between w-full h-full bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-2xl font-mono select-none overflow-hidden",
        className
      )}
    >
      {/* 1. SLIM CLEAN HEADER */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              230V MAIN CONSUMER UNIT (DB FUSE BOX)
            </h3>
          </div>
        </div>

        <div>
          {isAnyTripped ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 border border-rose-500 text-rose-300 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> BREAKER TRIPPED
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> ALL SWITCHES ON
            </span>
          )}
        </div>
      </div>

      {/* 2. REALISTIC DIN RAIL & 4 MODULAR BREAKERS (ZERO SCROLLBARS, 100% VISIBLE) */}
      <div className="relative flex-1 min-h-0 my-2 bg-slate-950/90 border border-slate-800 rounded-xl p-2 flex flex-col justify-center overflow-hidden">
        
        {/* Metallic DIN Rail bar behind breakers */}
        <div className="absolute top-1/2 left-3 right-3 h-12 -translate-y-1/2 bg-gradient-to-b from-slate-700 via-slate-500 to-slate-800 rounded opacity-20 pointer-events-none" />

        {/* Breakers Grid: 4 Breakers side by side */}
        <div className="relative z-10 grid grid-cols-4 gap-2 h-full items-center">
          
          {/* 1. MAIN INCOMER RCCB (Shock Guard) */}
          <div className="flex flex-col h-full justify-between items-center bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80">
            <div className="text-center w-full">
              <span className="text-[10px] font-black text-cyan-400 uppercase block truncate">
                1. MAIN RCCB
              </span>
              <span className="text-[8px] text-slate-400 block font-sans">
                Shock Guard (30mA)
              </span>
            </div>

            <div className="w-full flex-1 min-h-0 flex items-center justify-center">
              <ModularDeviceFaceplate
                deviceType="rccb"
                In={40}
                iDeltaN={30}
                rcdType="A"
                state={rccbState.state}
                tripCause={rccbState.tripCause}
                onReclose={() => onRecloseBreaker('main_rccb')}
                onTestTrip={onTestTripRCCB}
                compact={true}
                className="w-full max-h-[160px]"
              />
            </div>

            <button
              type="button"
              onClick={onTestTripRCCB}
              className="w-full mt-1 py-1 px-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[9px] transition-colors cursor-pointer text-center truncate shadow-sm"
              title="Quarterly push test"
            >
              🟡 TEST 'T'
            </button>
          </div>

          {/* 2. LIGHTING MCB */}
          <div className="flex flex-col h-full justify-between items-center bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80">
            <div className="text-center w-full">
              <span className="text-[10px] font-bold text-slate-300 uppercase block truncate">
                2. LIGHTS
              </span>
              <span className="text-[8px] text-slate-400 block font-sans">
                Circuit 1 (10A)
              </span>
            </div>

            <div className="w-full flex-1 min-h-0 flex items-center justify-center">
              <ModularDeviceFaceplate
                deviceType="mcb"
                In={10}
                curve="B"
                state={c1State.state}
                tripCause={c1State.tripCause}
                onReclose={() => onRecloseBreaker('c1_lighting')}
                compact={true}
                className="w-full max-h-[160px]"
              />
            </div>

            <button
              type="button"
              onClick={() => onRecloseBreaker('c1_lighting')}
              className={cn(
                "w-full mt-1 py-1 px-1 rounded-md font-bold text-[9px] transition-colors cursor-pointer text-center truncate",
                c1State.state !== 'CLOSED'
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              {c1State.state !== 'CLOSED' ? '⬆ RESET' : '● ON'}
            </button>
          </div>

          {/* 3. LIVING ROOM SOCKETS MCB (Target) */}
          <div className={cn(
            "flex flex-col h-full justify-between items-center p-1.5 rounded-lg border transition-all relative",
            c2State.state !== 'CLOSED'
              ? "bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500"
              : "bg-slate-900/60 border-slate-800/80"
          )}>
            {c2State.state !== 'CLOSED' && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black bg-rose-500 text-slate-950 shadow animate-bounce z-20">
                TRIPPED!
              </div>
            )}
            <div className="text-center w-full">
              <span className="text-[10px] font-black text-amber-400 uppercase block truncate">
                3. LIVING ROOM ★
              </span>
              <span className="text-[8px] text-amber-300 block font-sans font-bold">
                C16 Socket Circuit
              </span>
            </div>

            <div className="w-full flex-1 min-h-0 flex items-center justify-center">
              <ModularDeviceFaceplate
                deviceType="mcb"
                In={16}
                curve="C"
                state={c2State.state}
                tripCause={c2State.tripCause}
                onReclose={() => onRecloseBreaker('c2_living_sockets')}
                compact={true}
                className="w-full max-h-[160px]"
              />
            </div>

            <button
              type="button"
              onClick={() => onRecloseBreaker('c2_living_sockets')}
              className={cn(
                "w-full mt-1 py-1 px-1 rounded-md font-black text-[9.5px] transition-colors cursor-pointer text-center truncate shadow-sm",
                c2State.state !== 'CLOSED'
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 animate-pulse"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              {c2State.state !== 'CLOSED' ? '⬆ PUSH UP (RESET)' : '● ON (16A)'}
            </button>
          </div>

          {/* 4. KITCHEN SOCKETS MCB */}
          <div className="flex flex-col h-full justify-between items-center bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80">
            <div className="text-center w-full">
              <span className="text-[10px] font-bold text-slate-300 uppercase block truncate">
                4. KITCHEN
              </span>
              <span className="text-[8px] text-slate-400 block font-sans">
                Circuit 3 (16A)
              </span>
            </div>

            <div className="w-full flex-1 min-h-0 flex items-center justify-center">
              <ModularDeviceFaceplate
                deviceType="mcb"
                In={16}
                curve="C"
                state={c3State.state}
                tripCause={c3State.tripCause}
                onReclose={() => onRecloseBreaker('c3_kitchen_sockets')}
                compact={true}
                className="w-full max-h-[160px]"
              />
            </div>

            <button
              type="button"
              onClick={() => onRecloseBreaker('c3_kitchen_sockets')}
              className={cn(
                "w-full mt-1 py-1 px-1 rounded-md font-bold text-[9px] transition-colors cursor-pointer text-center truncate",
                c3State.state !== 'CLOSED'
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              {c3State.state !== 'CLOSED' ? '⬆ RESET' : '● ON'}
            </button>
          </div>

        </div>
      </div>

      {/* 3. COMPACT HINT FOOTER (SINGLE LINE) */}
      <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[9.5px] text-slate-400 font-sans shrink-0">
        <span>💡 <strong>How to operate:</strong> Click any switch handle or button to toggle power ON/OFF.</span>
        <span className="text-cyan-400 font-mono text-[9px]">IEC 60898-1 & IEC 61008-1 Compliant</span>
      </div>
    </div>
  );
};
