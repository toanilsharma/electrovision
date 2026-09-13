import React from 'react';
import { CircuitStates } from '../types/homeguard';
import { MCBState } from '@/src/mcb/types';
import { cn } from '@/src/lib/utils';
import { X, Shield, Flame, Lightbulb, AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface DistributionBoardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  circuitStates: CircuitStates;
  onSafeRecloseBreaker: (circuitId: string) => void;
  onSafeTestTripRCCB: () => void;
}

export const DistributionBoardDrawer: React.FC<DistributionBoardDrawerProps> = ({
  isOpen,
  onClose,
  circuitStates,
  onSafeRecloseBreaker,
  onSafeTestTripRCCB
}) => {
  if (!isOpen) return null;

  const c1 = circuitStates.c1_lighting;
  const c2 = circuitStates.c2_living_sockets;
  const c3 = circuitStates.c3_kitchen_sockets;
  const rccb = circuitStates.main_rccb;

  const isRCCBTripped = rccb.state !== MCBState.CLOSED;
  const isC1Tripped = c1.state !== MCBState.CLOSED;
  const isC2Tripped = c2.state !== MCBState.CLOSED;
  const isC3Tripped = c3.state !== MCBState.CLOSED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="font-black text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
                Home Safety Fuse Box (Consumer Unit)
              </h3>
              <p className="text-[11px] text-slate-400">
                Push levers UP to restore power after unplugging heavy loads
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breaker Switches Row */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 overflow-y-auto">
          
          {/* Switch 1: 30mA RCCB (Life-Saver) */}
          <div className={cn(
            "p-3 rounded-xl border flex flex-col items-center text-center transition-all",
            isRCCBTripped
              ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-950/50 animate-pulse"
              : "bg-slate-800/80 border-slate-700"
          )}>
            <div className="flex items-center gap-1 text-[11px] font-black text-cyan-300 uppercase mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>1. Life-Saver</span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold mb-2">
              Shock Guard (30mA)
            </div>

            {/* Tactile Rocker Switch */}
            <button
              type="button"
              onClick={() => {
                if (isRCCBTripped) onSafeRecloseBreaker('main_rccb');
              }}
              className={cn(
                "w-16 h-24 rounded-xl border-2 flex flex-col items-center justify-between p-2 my-2 transition-all cursor-pointer font-black text-xs shadow-inner",
                isRCCBTripped
                  ? "bg-rose-900 border-rose-400 text-white hover:scale-105"
                  : "bg-emerald-900/60 border-emerald-500 text-emerald-300"
              )}
            >
              <span className="text-[10px] uppercase">
                {isRCCBTripped ? 'TRIPPED' : 'ON'}
              </span>
              <div className={cn(
                "w-10 h-8 rounded-lg shadow-md flex items-center justify-center text-base transition-transform",
                isRCCBTripped ? "translate-y-4 bg-rose-600 text-white" : "-translate-y-2 bg-emerald-500 text-slate-950"
              )}>
                {isRCCBTripped ? '▼' : '▲'}
              </div>
              <span className="text-[9px] text-slate-300 font-bold">
                {isRCCBTripped ? 'PUSH UP' : 'SAFE'}
              </span>
            </button>

            {/* Test Button "T" */}
            <button
              type="button"
              onClick={onSafeTestTripRCCB}
              disabled={isRCCBTripped}
              className="mt-2 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-black cursor-pointer disabled:opacity-40"
              title="Press Test Button (IEC 61008 requirement: test every 6 months)"
            >
              [T] TEST 6-MO
            </button>
          </div>

          {/* Switch 2: Circuit C2 Living Sockets (MCB 16A) */}
          <div className={cn(
            "p-3 rounded-xl border flex flex-col items-center text-center transition-all",
            isC2Tripped
              ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-950/50 animate-pulse"
              : "bg-slate-800/80 border-slate-700"
          )}>
            <div className="flex items-center gap-1 text-[11px] font-black text-orange-300 uppercase mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>2. Living MCB</span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold mb-2">
              Wire Fire-Guard (16A)
            </div>

            <button
              type="button"
              onClick={() => onSafeRecloseBreaker('c2_living_sockets')}
              className={cn(
                "w-16 h-24 rounded-xl border-2 flex flex-col items-center justify-between p-2 my-2 transition-all cursor-pointer font-black text-xs shadow-inner",
                isC2Tripped
                  ? "bg-rose-900 border-rose-400 text-white hover:scale-105"
                  : "bg-emerald-900/60 border-emerald-500 text-emerald-300"
              )}
            >
              <span className="text-[10px] uppercase">
                {isC2Tripped ? 'DOWN' : 'UP (ON)'}
              </span>
              <div className={cn(
                "w-10 h-8 rounded-lg shadow-md flex items-center justify-center text-base transition-transform",
                isC2Tripped ? "translate-y-4 bg-rose-600 text-white" : "-translate-y-2 bg-emerald-500 text-slate-950"
              )}>
                {isC2Tripped ? '▼' : '▲'}
              </div>
              <span className="text-[9px] text-slate-300 font-bold">
                {isC2Tripped ? 'PUSH UP' : `${c2.currentAmps.toFixed(1)} A`}
              </span>
            </button>

            <span className="mt-2 text-[10px] text-slate-400">
              TV, AC, Heater
            </span>
          </div>

          {/* Switch 3: Circuit C3 Kitchen Sockets (MCB 16A) */}
          <div className={cn(
            "p-3 rounded-xl border flex flex-col items-center text-center transition-all",
            isC3Tripped
              ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-950/50 animate-pulse"
              : "bg-slate-800/80 border-slate-700"
          )}>
            <div className="flex items-center gap-1 text-[11px] font-black text-amber-300 uppercase mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>3. Kitchen MCB</span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold mb-2">
              Wire Fire-Guard (16A)
            </div>

            <button
              type="button"
              onClick={() => onSafeRecloseBreaker('c3_kitchen_sockets')}
              className={cn(
                "w-16 h-24 rounded-xl border-2 flex flex-col items-center justify-between p-2 my-2 transition-all cursor-pointer font-black text-xs shadow-inner",
                isC3Tripped
                  ? "bg-rose-900 border-rose-400 text-white hover:scale-105"
                  : "bg-emerald-900/60 border-emerald-500 text-emerald-300"
              )}
            >
              <span className="text-[10px] uppercase">
                {isC3Tripped ? 'DOWN' : 'UP (ON)'}
              </span>
              <div className={cn(
                "w-10 h-8 rounded-lg shadow-md flex items-center justify-center text-base transition-transform",
                isC3Tripped ? "translate-y-4 bg-rose-600 text-white" : "-translate-y-2 bg-emerald-500 text-slate-950"
              )}>
                {isC3Tripped ? '▼' : '▲'}
              </div>
              <span className="text-[9px] text-slate-300 font-bold">
                {isC3Tripped ? 'PUSH UP' : `${c3.currentAmps.toFixed(1)} A`}
              </span>
            </button>

            <span className="mt-2 text-[10px] text-slate-400">
              Kettle, Oven, Geyser
            </span>
          </div>

          {/* Switch 4: Circuit C1 Lighting (MCB 10A) */}
          <div className={cn(
            "p-3 rounded-xl border flex flex-col items-center text-center transition-all",
            isC1Tripped
              ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-950/50 animate-pulse"
              : "bg-slate-800/80 border-slate-700"
          )}>
            <div className="flex items-center gap-1 text-[11px] font-black text-yellow-300 uppercase mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>4. Lights MCB</span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold mb-2">
              Lighting Guard (10A)
            </div>

            <button
              type="button"
              onClick={() => onSafeRecloseBreaker('c1_lighting')}
              className={cn(
                "w-16 h-24 rounded-xl border-2 flex flex-col items-center justify-between p-2 my-2 transition-all cursor-pointer font-black text-xs shadow-inner",
                isC1Tripped
                  ? "bg-rose-900 border-rose-400 text-white hover:scale-105"
                  : "bg-emerald-900/60 border-emerald-500 text-emerald-300"
              )}
            >
              <span className="text-[10px] uppercase">
                {isC1Tripped ? 'DOWN' : 'UP (ON)'}
              </span>
              <div className={cn(
                "w-10 h-8 rounded-lg shadow-md flex items-center justify-center text-base transition-transform",
                isC1Tripped ? "translate-y-4 bg-rose-600 text-white" : "-translate-y-2 bg-emerald-500 text-slate-950"
              )}>
                {isC1Tripped ? '▼' : '▲'}
              </div>
              <span className="text-[9px] text-slate-300 font-bold">
                {isC1Tripped ? 'PUSH UP' : `${c1.currentAmps.toFixed(1)} A`}
              </span>
            </button>

            <span className="mt-2 text-[10px] text-slate-400">
              LEDs & Exhaust Fan
            </span>
          </div>
        </div>

        {/* Footer Habit Callout */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-amber-200/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>
              <strong>Safety Habit:</strong> Always unplug heavy heating appliances before pushing switches UP.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
