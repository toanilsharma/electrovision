import React from 'react';
import { CircuitStates } from '../types/homeguard';
import { MCBState } from '@/src/mcb/types';
import { cn } from '@/src/lib/utils';
import { ShieldCheck, ShieldAlert, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';

interface HousePowerStatusBannerProps {
  circuitStates: CircuitStates;
  onOpenDBBox?: () => void;
  className?: string;
}

export const HousePowerStatusBanner: React.FC<HousePowerStatusBannerProps> = ({
  circuitStates,
  onOpenDBBox,
  className
}) => {
  const isC1Closed = circuitStates.c1_lighting?.state === MCBState.CLOSED;
  const isC2Closed = circuitStates.c2_living_sockets?.state === MCBState.CLOSED;
  const isC3Closed = circuitStates.c3_kitchen_sockets?.state === MCBState.CLOSED;
  const isRCCBClosed = circuitStates.main_rccb?.state === MCBState.CLOSED;

  // Power state per room
  const isLivingPowered = isRCCBClosed && isC2Closed;
  const isKitchenPowered = isRCCBClosed && isC3Closed;
  const isBedPowered = isRCCBClosed && isC2Closed; // Bed sockets on C2
  const isBathPowered = isRCCBClosed && (isC3Closed || isC1Closed); // Geyser C3, Fan C1
  const isLightsPowered = isRCCBClosed && isC1Closed;

  // Overall condition
  const isTotalShutdown = !isRCCBClosed;
  const isPartialBlackout = isRCCBClosed && (!isC1Closed || !isC2Closed || !isC3Closed);
  const isAllSafe = isRCCBClosed && isC1Closed && isC2Closed && isC3Closed;

  return (
    <div
      className={cn(
        "w-full px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs border-b select-none transition-colors duration-200",
        isTotalShutdown
          ? "bg-rose-950/90 border-rose-600/80 text-rose-100 shadow-md animate-pulse"
          : isPartialBlackout
          ? "bg-amber-950/90 border-amber-500/80 text-amber-100"
          : "bg-slate-900/90 border-slate-800 text-slate-200",
        className
      )}
    >
      {/* Left: Overall Health Badge */}
      <div className="flex items-center gap-2">
        {isTotalShutdown ? (
          <div className="flex items-center gap-1.5 text-rose-300 font-black">
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
            <span className="tracking-wide uppercase">🔴 TOTAL HOME SHUTDOWN</span>
            <span className="hidden sm:inline text-rose-200 font-normal">
              — Life-Saver (RCCB) cut all power to prevent fatal electric shock
            </span>
          </div>
        ) : isPartialBlackout ? (
          <div className="flex items-center gap-1.5 text-amber-300 font-black">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="tracking-wide uppercase">
              ⚠️ PARTIAL BLACKOUT ({!isC3Closed ? 'Kitchen Sockets Tripped' : !isC2Closed ? 'Living Room Sockets Tripped' : 'Lighting Tripped'})
            </span>
            <span className="hidden sm:inline text-amber-200 font-normal">
              — Overloaded wire protected from burning; other rooms still have safe power
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="tracking-wide uppercase">🟢 ALL ROOMS POWERED & SAFE</span>
            <span className="hidden sm:inline text-slate-300 font-normal">
              — Normal 230V balanced flow across all circuits
            </span>
          </div>
        )}
      </div>

      {/* Right: Room Power Indicators & DB Quick Inspector */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <div className="hidden md:flex items-center gap-1 text-[11px] font-semibold bg-slate-950/60 px-2 py-0.5 rounded-lg border border-slate-800">
          <span className={cn("px-1 rounded", isLivingPowered ? "text-emerald-400" : "text-rose-400 font-bold line-through")}>
            🛋️ Living {isLivingPowered ? '●' : '✕'}
          </span>
          <span className="text-slate-600">|</span>
          <span className={cn("px-1 rounded", isKitchenPowered ? "text-emerald-400" : "text-rose-400 font-bold line-through")}>
            🍳 Kitchen {isKitchenPowered ? '●' : '✕'}
          </span>
          <span className="text-slate-600">|</span>
          <span className={cn("px-1 rounded", isBathPowered ? "text-emerald-400" : "text-rose-400 font-bold line-through")}>
            🚿 Bath {isBathPowered ? '●' : '✕'}
          </span>
          <span className="text-slate-600">|</span>
          <span className={cn("px-1 rounded", isBedPowered ? "text-emerald-400" : "text-rose-400 font-bold line-through")}>
            🛏️ Bed {isBedPowered ? '●' : '✕'}
          </span>
          <span className="text-slate-600">|</span>
          <span className={cn("px-1 rounded", isLightsPowered ? "text-emerald-400" : "text-rose-400 font-bold line-through")}>
            💡 Lights {isLightsPowered ? '●' : '✕'}
          </span>
        </div>

        {onOpenDBBox && (
          <button
            type="button"
            onClick={onOpenDBBox}
            className={cn(
              "px-2 py-0.5 rounded border text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer",
              isTotalShutdown
                ? "bg-rose-600 text-white border-rose-400 hover:bg-rose-500 animate-pulse shadow-lg"
                : isPartialBlackout
                ? "bg-amber-600 text-white border-amber-400 hover:bg-amber-500 shadow"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            )}
            title="Inspect DB Fuse Box Switches"
          >
            <Zap className="w-3 h-3" />
            <span>{isTotalShutdown || isPartialBlackout ? '⚡ FIX AT FUSE BOX' : '⚡ Fuse Box'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
