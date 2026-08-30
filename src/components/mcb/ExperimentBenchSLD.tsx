import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MCBState, TripCause, SystemType, CurrentType } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Zap, ShieldAlert, Cpu, Lightbulb, Flame, AlertCircle, Clock } from 'lucide-react';

export type LoadType = 'motor' | 'lamp' | 'impedance';
export type FaultLocation = 'line_side' | 'mid_cable' | 'load_side';

interface ExperimentBenchSLDProps {
  current: number;          // Instantaneous current (A)
  In: number;               // Rated current (A)
  state: MCBState;          // CLOSED, UNLATCHED, ARCING, OPEN_CLEARED
  tripCause: TripCause;
  bimetalTemp: number;      // °C
  bimetalTripTemp: number;    // °C threshold
  isToleranceZone: boolean;
  remainingTimeSec?: number; // Countdown timer until trip
  systemType?: SystemType;
  currentType?: CurrentType;
  faultLocation: FaultLocation;
  onFaultLocationChange: (loc: FaultLocation) => void;
  loadType: LoadType;
  onLoadTypeChange: (load: LoadType) => void;
  className?: string;
}

export const ExperimentBenchSLD: React.FC<ExperimentBenchSLDProps> = ({
  current,
  In,
  state,
  tripCause,
  bimetalTemp,
  bimetalTripTemp,
  isToleranceZone,
  remainingTimeSec,
  systemType = '1ph_230v',
  currentType = 'ac',
  faultLocation,
  onFaultLocationChange,
  loadType,
  onLoadTypeChange,
  className
}) => {
  const isTripped = state !== MCBState.CLOSED;
  const absCurrent = Math.abs(current);
  const isNormal = !isTripped && absCurrent <= 1.13 * In;
  const isOverload = !isTripped && absCurrent > 1.13 * In && absCurrent <= 1.45 * In;
  const isShortCircuit = !isTripped && absCurrent > 1.45 * In;
  const is3Phase = systemType === '3ph_400v';

  // Cable Thermal Glow Color
  let cableStroke = '#10b981'; // Green
  if (isTripped) {
    cableStroke = '#64748b'; // Gray
  } else if (isShortCircuit) {
    cableStroke = '#f43f5e'; // Red
  } else if (isOverload) {
    cableStroke = '#f59e0b'; // Amber
  }

  const cableGlowWidth = isOverload ? '6' : isShortCircuit ? '8' : '3.5';

  return (
    <div className={cn('relative flex flex-col justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-xl overflow-hidden font-mono select-none h-full', className)}>
      
      {/* Experiment Controls Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 z-10">
        {/* Load Selector */}
        <div className="flex items-center gap-1 text-[11px] font-bold bg-slate-900 p-1 rounded-lg border border-slate-800">
          <span className="text-slate-400 pl-1">Load:</span>
          {(['motor', 'lamp', 'impedance'] as LoadType[]).map((type) => (
            <button
              key={type}
              onClick={() => onLoadTypeChange(type)}
              className={cn(
                "px-2 py-0.5 rounded uppercase font-black transition-all cursor-pointer min-h-[28px]",
                loadType === type ? "bg-sky-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              )}
            >
              {type === 'motor' ? '⚡ Motor' : type === 'lamp' ? '💡 Lamp' : '🔥 Heater'}
            </button>
          ))}
        </div>

        {/* Fault Location Switch Selector */}
        <div className="flex items-center gap-1 text-[11px] font-bold bg-slate-900 p-1 rounded-lg border border-slate-800">
          <span className="text-slate-400 pl-1">Fault Switch:</span>
          {(['line_side', 'mid_cable', 'load_side'] as FaultLocation[]).map((loc) => (
            <button
              key={loc}
              onClick={() => onFaultLocationChange(loc)}
              className={cn(
                "px-2 py-0.5 rounded uppercase font-black transition-all cursor-pointer min-h-[28px]",
                faultLocation === loc ? "bg-rose-500 text-white shadow" : "text-slate-400 hover:text-white"
              )}
            >
              {loc === 'line_side' ? 'Line' : loc === 'mid_cable' ? 'Mid' : 'Load'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Experiment Bench Canvas */}
      <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
        
        {/* ANCHORED REVERSE COUNTDOWN TIMER HUD CHIP */}
        <div className="absolute top-2 right-2 z-20">
          {isTripped ? (
            <span className="px-3 py-1 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-300 text-xs font-black uppercase shadow animate-pulse flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> TRIPPED ({tripCause})
            </span>
          ) : remainingTimeSec !== undefined && remainingTimeSec < 3600 ? (
            <span className="px-3 py-1 rounded-lg bg-amber-950/90 border border-amber-500 text-amber-300 text-xs font-black uppercase shadow flex items-center gap-1.5 animate-pulse">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" /> TRIP IN: {remainingTimeSec.toFixed(1)}s
            </span>
          ) : (
            <span className="px-3 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold shadow flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" /> NO TRIP (1.13x In)
            </span>
          )}
        </div>

        <svg viewBox="0 0 650 200" className="w-full h-full max-w-[650px] overflow-visible">
          <defs>
            <filter id="cableGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <pattern id="benchGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <rect width="650" height="200" fill="url(#benchGrid)" rx="12" opacity="0.4" />

          {/* 1. SOURCE TRANSFORMER SYMBOL (X: 30 -> 90) */}
          <g transform="translate(30, 70)">
            <circle cx="20" cy="30" r="18" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
            <circle cx="35" cy="30" r="18" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
            <text x="27" y="65" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">
              {is3Phase ? '3φ 400V Grid' : '1φ 230V Grid'}
            </text>
          </g>

          {/* Line Segment 1: Transformer to MCB (X: 85 -> 240) */}
          <path
            d="M 85,100 L 240,100"
            fill="none" stroke={cableStroke} strokeWidth={cableGlowWidth}
            strokeDasharray={isTripped ? '6 4' : 'none'}
            filter={isOverload || isShortCircuit ? 'url(#cableGlowFilter)' : undefined}
          />

          {/* Fault Location Switch: Line Side (X: 160) */}
          {faultLocation === 'line_side' && (
            <g transform="translate(160, 100)">
              <circle cx="0" cy="0" r="5" fill="#f43f5e" />
              <line x1="0" y1="0" x2="0" y2="40" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M -10,40 L 10,40 M -6,44 L 6,44 M -2,48 L 2,48" stroke="#f43f5e" strokeWidth="2" />
              <text x="0" y="-10" textAnchor="middle" fill="#f43f5e" fontSize="9" fontWeight="bold">
                ⚡ Line Fault
              </text>
            </g>
          )}

          {/* 2. MCB IEC BREAKER SYMBOL (X: 240 -> 340) */}
          <rect x="230" y="45" width="120" height="110" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="290" y="62" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">
            {is3Phase ? 'MCB (3-Pole)' : 'MCB (1-Pole)'}
          </text>

          {/* MCB Contact Posts */}
          <circle cx="240" cy="100" r="5" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
          <circle cx="340" cy="100" r="5" fill="#f8fafc" stroke="#475569" strokeWidth="2" />

          {/* Moving Breaker Contact Blade */}
          <motion.line
            x1="240" y1="100" x2="340" y2="100"
            stroke={isTripped ? '#f43f5e' : '#10b981'} strokeWidth="4" strokeLinecap="round"
            animate={{ rotate: isTripped ? -35 : 0 }}
            style={{ originX: '240px', originY: '100px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />

          {/* Line Segment 2: MCB to Load (X: 340 -> 560) */}
          <path
            d="M 340,100 L 560,100"
            fill="none" stroke={cableStroke} strokeWidth={cableGlowWidth}
            strokeDasharray={isTripped ? '6 4' : 'none'}
            filter={isOverload || isShortCircuit ? 'url(#cableGlowFilter)' : undefined}
          />

          {/* Fault Location Switch: Mid Cable (X: 420) */}
          {faultLocation === 'mid_cable' && (
            <g transform="translate(420, 100)">
              <circle cx="0" cy="0" r="5" fill="#f43f5e" />
              <line x1="0" y1="0" x2="0" y2="40" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M -10,40 L 10,40 M -6,44 L 6,44 M -2,48 L 2,48" stroke="#f43f5e" strokeWidth="2" />
              <text x="0" y="-10" textAnchor="middle" fill="#f43f5e" fontSize="9" fontWeight="bold">
                ⚡ Mid-Cable Fault
              </text>
            </g>
          )}

          {/* Fault Location Switch: Load Side (X: 510) */}
          {faultLocation === 'load_side' && (
            <g transform="translate(510, 100)">
              <circle cx="0" cy="0" r="5" fill="#f43f5e" />
              <line x1="0" y1="0" x2="0" y2="40" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M -10,40 L 10,40 M -6,44 L 6,44 M -2,48 L 2,48" stroke="#f43f5e" strokeWidth="2" />
              <text x="0" y="-10" textAnchor="middle" fill="#f43f5e" fontSize="9" fontWeight="bold">
                ⚡ Load-Side Fault
              </text>
            </g>
          )}

          {/* 3. LOAD SYMBOL (X: 560 -> 610) */}
          <g transform="translate(560, 75)">
            <rect x="0" y="0" width="50" height="50" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            {loadType === 'motor' ? (
              <text x="25" y="32" textAnchor="middle" fill="#38bdf8" fontSize="20" fontWeight="bold">M</text>
            ) : loadType === 'lamp' ? (
              <circle cx="25" cy="25" r="14" fill="none" stroke="#fbbf24" strokeWidth="2" />
            ) : (
              <path d="M 10,25 L 18,15 L 26,35 L 34,15 L 42,25" fill="none" stroke="#f97316" strokeWidth="2" />
            )}
            <text x="25" y="65" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">
              {loadType === 'motor' ? 'Inductive Motor' : loadType === 'lamp' ? 'Filament Lamp' : 'Heater Load'}
            </text>
          </g>

          {/* Particle Flow along conductor when closed */}
          {isNormal && (
            <>
              <circle r="3.5" fill="#34d399">
                <animateMotion path="M 85,100 L 240,100" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle r="3.5" fill="#34d399">
                <animateMotion path="M 340,100 L 560,100" dur="1.2s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </svg>
      </div>

      {/* Footer Metrics */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] pt-1">
        <div className="p-1 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 font-bold uppercase">Fault Location</span>
          <span className="text-xs font-black text-rose-400 uppercase">{faultLocation.replace('_', ' ')}</span>
        </div>
        <div className="p-1 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 font-bold uppercase">Current (Ia)</span>
          <span className="text-xs font-black text-emerald-400 tabular-nums">{current.toFixed(1)} A</span>
        </div>
        <div className="p-1 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 font-bold uppercase">Bimetal Temp</span>
          <span className={cn('text-xs font-black tabular-nums', bimetalTemp >= bimetalTripTemp ? 'text-rose-400' : 'text-amber-400')}>
            {bimetalTemp.toFixed(1)}°C
          </span>
        </div>
        <div className="p-1 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 font-bold uppercase">State</span>
          <span className={cn('text-xs font-black', isTripped ? 'text-rose-400' : 'text-emerald-400')}>{state}</span>
        </div>
      </div>
    </div>
  );
};
