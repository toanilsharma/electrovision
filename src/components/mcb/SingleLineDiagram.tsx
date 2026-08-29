import React from 'react';
import { motion } from 'motion/react';
import { MCBState, TripCause } from '../../mcb/types';
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
  className
}) => {
  const isTripped = state !== MCBState.CLOSED;
  const absCurrent = Math.abs(current);
  const isNormal = !isTripped && absCurrent <= 1.13 * In;
  const isOverload = !isTripped && absCurrent > 1.13 * In && absCurrent <= 1.45 * In;
  const isShortCircuit = !isTripped && absCurrent > 1.45 * In;

  // Determine line color and animation class
  let edgeStroke = '#10b981'; // Green
  let lineStatusText = 'Normal Current';

  if (isTripped) {
    edgeStroke = '#64748b'; // Slate / Gray
    lineStatusText = 'Tripped (0A - Cleared)';
  } else if (isShortCircuit) {
    edgeStroke = '#f43f5e'; // Rose / Red
    lineStatusText = 'Short Circuit / Magnetic Fault';
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
    <div className={cn('relative flex flex-col items-center p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden', className)}>
      {/* Status Header Badge */}
      <div className="w-full flex items-center justify-between mb-4">
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
          <span className="text-xs font-semibold text-slate-300 font-mono">
            {lineStatusText}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800">
          <span className="text-slate-400">State:</span>
          <span
            className={cn(
              'font-bold',
              isTripped ? 'text-rose-400' : 'text-emerald-400'
            )}
          >
            {state}
          </span>
        </div>
      </div>

      {/* SVG Single Line Diagram Canvas */}
      <div className="relative w-full h-[220px] flex items-center justify-center">
        <svg
          viewBox="0 0 600 200"
          className="w-full h-full max-w-[600px] overflow-visible"
        >
          <defs>
            {/* Glow filters for short circuit */}
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
          <rect width="600" height="200" fill="url(#grid)" rx="12" opacity="0.4" />

          {/* Line 1: Supply to Breaker Contact (X: 40 -> 240) */}
          <path
            d="M 40,100 L 240,100"
            fill="none"
            stroke={edgeStroke}
            strokeWidth={isShortCircuit ? '4' : '3'}
            strokeDasharray={isTripped ? '6 4' : 'none'}
            filter={isShortCircuit ? 'url(#redGlow)' : isNormal ? 'url(#emeraldGlow)' : undefined}
            className={cn(isShortCircuit ? 'animate-pulse' : '')}
          />

          {/* Line 2: Breaker Load Side to Output (X: 340 -> 560) */}
          <path
            d="M 340,100 L 560,100"
            fill="none"
            stroke={edgeStroke}
            strokeWidth={isShortCircuit ? '4' : '3'}
            strokeDasharray={isTripped ? '6 4' : 'none'}
            filter={isShortCircuit ? 'url(#redGlow)' : isNormal ? 'url(#emeraldGlow)' : undefined}
            className={cn(isShortCircuit ? 'animate-pulse' : '')}
          />

          {/* Normal Current Flowing Particles */}
          {isNormal && (
            <>
              <circle r="4" fill="#34d399">
                <animateMotion path="M 40,100 L 240,100" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#34d399">
                <animateMotion path="M 340,100 L 560,100" dur="1.2s" repeatCount="indefinite" />
              </circle>
            </>
          )}

          {/* Nodes */}
          {/* Node 1: Line In Terminal */}
          <circle cx="40" cy="100" r="8" fill="#0f172a" stroke={edgeStroke} strokeWidth="3" />
          <text x="40" y="75" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            Line Supply (230V)
          </text>

          {/* Node 2: Load Out Terminal */}
          <circle cx="560" cy="100" r="8" fill="#0f172a" stroke={edgeStroke} strokeWidth="3" />
          <text x="560" y="75" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            Load Terminal
          </text>

          {/* Breaker Contact Terminals (Fixed Posts) */}
          <circle cx="240" cy="100" r="6" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
          <circle cx="340" cy="100" r="6" fill="#f8fafc" stroke="#475569" strokeWidth="2" />

          {/* Moving Breaker Contact Blade */}
          <g>
            <motion.line
              x1="240"
              y1="100"
              x2="340"
              y2="100"
              stroke={isTripped ? '#f43f5e' : '#10b981'}
              strokeWidth="4"
              strokeLinecap="round"
              animate={{
                rotate: isTripped ? -35 : 0
              }}
              style={{ originX: '240px', originY: '100px' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          </g>

          {/* Arcing Visual Effect during ARCING state */}
          {state === MCBState.ARCING && (
            <g>
              <path
                d="M 245,95 Q 280,60 330,85"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="3"
                className="animate-ping"
              />
              <path
                d="M 245,100 Q 285,75 330,95"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                className="animate-pulse"
              />
            </g>
          )}

          {/* MCB Enclosure Frame Box */}
          <rect
            x="200"
            y="30"
            width="180"
            height="140"
            rx="12"
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="290" y="48" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
            IEC 60898-1 MCB
          </text>

          {/* Physical Mechanism Sub-Components Diagram */}
          {/* Bimetal Strip Representation */}
          <g transform="translate(230, 140)">
            <rect x="0" y="0" width="40" height="6" rx="2" fill="#64748b" />
            <motion.rect
              x="0"
              y="0"
              width="40"
              height="6"
              rx="2"
              fill={bimetalTemp >= bimetalTripTemp ? '#f43f5e' : '#f59e0b'}
              animate={{ rotate: bimetalDeflection }}
              style={{ originX: '0px', originY: '3px' }}
            />
            <text x="20" y="20" textAnchor="middle" fill="#94a3b8" fontSize="9">
              Bimetal ({bimetalTemp.toFixed(1)}°C)
            </text>
          </g>

          {/* Solenoid Coil Representation */}
          <g transform="translate(310, 140)">
            <path d="M 0,0 Q 5,-10 10,0 Q 15,-10 20,0 Q 25,-10 30,0" fill="none" stroke="#60a5fa" strokeWidth="2" />
            <text x="15" y="20" textAnchor="middle" fill="#94a3b8" fontSize="9">
              Solenoid
            </text>
          </g>
        </svg>
      </div>

      {/* Footer Metrics Bar */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-[10px] text-slate-400">Current (Instant)</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {current.toFixed(1)} A
          </span>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-[10px] text-slate-400">Bimetal Temp</span>
          <span className={cn('text-xs font-mono font-bold', bimetalTemp >= bimetalTripTemp ? 'text-rose-400' : 'text-amber-400')}>
            {bimetalTemp.toFixed(1)}°C
          </span>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-[10px] text-slate-400">Mag Tolerance</span>
          <span className={cn('text-xs font-mono font-bold', isToleranceZone ? 'text-amber-400' : 'text-slate-400')}>
            {isToleranceZone ? 'Tolerance Zone' : 'Normal'}
          </span>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-[10px] text-slate-400">Trip Trigger</span>
          <span className="text-xs font-mono font-bold text-rose-400">
            {tripCause}
          </span>
        </div>
      </div>
    </div>
  );
};
