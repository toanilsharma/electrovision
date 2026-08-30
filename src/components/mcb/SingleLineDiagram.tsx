import React from 'react';
import { motion } from 'motion/react';
import { MCBState, TripCause, SystemType, CurrentType } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Zap, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SingleLineDiagramProps {
  current: number;       // Instantaneous current (A)
  In: number;            // Rated current (A)
  state: MCBState;       // CLOSED, UNLATCHED, ARCING, OPEN_CLEARED
  tripCause: TripCause;
  bimetalTemp: number;   // °C
  bimetalTripTemp: number; // °C threshold
  isToleranceZone: boolean;
  systemType?: SystemType;
  currentType?: CurrentType;
  className?: string;
}

export const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  current,
  In,
  state,
  tripCause,
  bimetalTemp,
  bimetalTripTemp,
  isToleranceZone,
  systemType = '1ph_230v',
  currentType = 'ac',
  className
}) => {
  const isTripped = state !== MCBState.CLOSED;
  const absCurrent = Math.abs(current);
  const isNormal = !isTripped && absCurrent <= 1.13 * In;
  const isOverload = !isTripped && absCurrent > 1.13 * In && absCurrent <= 1.45 * In;
  const isShortCircuit = !isTripped && absCurrent > 1.45 * In;
  const is3Phase = systemType === '3ph_400v';

  let edgeStroke = '#10b981'; // Green
  let lineStatusText = 'Normal Current';

  if (isTripped) {
    edgeStroke = '#64748b'; // Slate / Gray
    lineStatusText = 'Tripped (0A - Cleared)';
  } else if (isShortCircuit) {
    edgeStroke = '#f43f5e'; // Rose / Red
    lineStatusText = 'Short Circuit / Fault';
  } else if (isOverload) {
    edgeStroke = '#f59e0b'; // Amber
    lineStatusText = 'Thermal Overload Zone';
  }

  // Calculate bimetal deflection angle (0 to 25 degrees)
  const bimetalDeflection = Math.min(
    25,
    Math.max(0, ((bimetalTemp - 30) / (bimetalTripTemp - 30)) * 25)
  );

  return (
    <div className={cn('relative flex flex-col items-center p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-xl overflow-hidden font-mono select-none', className)}>
      {/* Status Header Badge */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-3 h-3 rounded-full animate-pulse',
              isTripped
                ? 'bg-slate-500'
                : isShortCircuit
                ? 'bg-rose-500'
                : isOverload
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            )}
          />
          <span className="text-xs font-bold text-slate-200">
            {lineStatusText} {is3Phase ? '(3-Pole Ganged)' : '(1-Pole)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
          <span className="text-slate-400">State:</span>
          <span
            className={cn(
              'font-black',
              isTripped ? 'text-rose-400' : 'text-emerald-400'
            )}
          >
            {state}
          </span>
        </div>
      </div>

      {/* SVG Single Line Diagram Canvas */}
      <div className="relative w-full h-[180px] flex items-center justify-center">
        <svg
          viewBox="0 0 600 180"
          className="w-full h-full max-w-[600px] overflow-visible"
        >
          <defs>
            <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Lines */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <rect width="600" height="180" fill="url(#grid)" rx="12" opacity="0.4" />

          {/* 3-PHASE OR 1-PHASE CONTACT POLES */}
          {(is3Phase ? [70, 90, 110] : [90]).map((yPos, idx) => (
            <g key={`pole-${idx}`}>
              {/* Supply Line */}
              <path
                d={`M 40,${yPos} L 240,${yPos}`}
                fill="none" stroke={edgeStroke} strokeWidth={isShortCircuit ? '3.5' : '2.5'}
                strokeDasharray={isTripped ? '6 4' : 'none'}
              />
              {/* Load Line */}
              <path
                d={`M 340,${yPos} L 560,${yPos}`}
                fill="none" stroke={edgeStroke} strokeWidth={isShortCircuit ? '3.5' : '2.5'}
                strokeDasharray={isTripped ? '6 4' : 'none'}
              />
              {/* Terminals */}
              <circle cx="240" cy={yPos} r="5" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
              <circle cx="340" cy={yPos} r="5" fill="#f8fafc" stroke="#475569" strokeWidth="2" />

              {/* Moving Breaker Contact Blade */}
              <motion.line
                x1="240" y1={yPos} x2="340" y2={yPos}
                stroke={isTripped ? '#f43f5e' : '#10b981'} strokeWidth="3.5" strokeLinecap="round"
                animate={{ rotate: isTripped ? -35 : 0 }}
                style={{ originX: '240px', originY: `${yPos}px` }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
            </g>
          ))}

          {/* 3-POLE GANGED MECHANICAL TIE BAR LINKAGE */}
          {is3Phase && (
            <motion.line
              x1="290" y1="70" x2="290" y2="110"
              stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3 3"
              animate={{ rotate: isTripped ? -35 : 0 }}
              style={{ originX: '240px', originY: '90px' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          )}

          {/* Arcing Visual Effect */}
          {state === MCBState.ARCING && (
            <g transform="translate(245, 80)">
              <path d="M 0,0 Q 40,-30 85,-5" fill="none" stroke="#60a5fa" strokeWidth="3" className="animate-ping" />
              <path d="M 0,5 Q 45,-15 85,5" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-pulse" />
            </g>
          )}

          {/* MCB Enclosure Frame Box */}
          <rect x="200" y="20" width="180" height="140" rx="12" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="290" y="38" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
            {is3Phase ? 'IEC 60898-1 3-Pole MCB' : 'IEC 60898-1 1-Pole MCB'}
          </text>

          {/* Component Labels */}
          <g transform="translate(230, 140)">
            <rect x="0" y="0" width="40" height="6" rx="2" fill="#64748b" />
            <motion.rect
              x="0" y="0" width="40" height="6" rx="2"
              fill={bimetalTemp >= bimetalTripTemp ? '#f43f5e' : '#f59e0b'}
              animate={{ rotate: bimetalDeflection }}
              style={{ originX: '0px', originY: '3px' }}
            />
            <text x="20" y="18" textAnchor="middle" fill="#94a3b8" fontSize="9">
              Bimetal ({bimetalTemp.toFixed(1)}°C)
            </text>
          </g>

          <g transform="translate(310, 140)">
            <path d="M 0,0 Q 5,-10 10,0 Q 15,-10 20,0 Q 25,-10 30,0" fill="none" stroke="#60a5fa" strokeWidth="2" />
            <text x="15" y="18" textAnchor="middle" fill="#94a3b8" fontSize="9">
              Solenoid
            </text>
          </g>
        </svg>
      </div>

      {/* Footer Metrics Bar */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1 font-mono text-[10px]">
        <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase">Current (Ia)</span>
          <span className="text-xs font-black text-emerald-400 tabular-nums">{current.toFixed(1)} A</span>
        </div>

        <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase">Bimetal Temp</span>
          <span className={cn('text-xs font-black tabular-nums', bimetalTemp >= bimetalTripTemp ? 'text-rose-400' : 'text-amber-400')}>
            {bimetalTemp.toFixed(1)}°C
          </span>
        </div>

        <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase">Mag Tolerance</span>
          <span className={cn('text-xs font-black truncate', isToleranceZone ? 'text-amber-400' : 'text-slate-400')}>
            {isToleranceZone ? 'Tolerance Zone' : 'Normal'}
          </span>
        </div>

        <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase">Trip Trigger</span>
          <span className="text-xs font-black text-rose-400 truncate">{tripCause}</span>
        </div>
      </div>
    </div>
  );
};
