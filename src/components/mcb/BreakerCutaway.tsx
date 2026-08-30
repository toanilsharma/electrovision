import React from 'react';
import { motion } from 'motion/react';
import { MCBState, TripCause } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Clock, ShieldAlert } from 'lucide-react';

interface BreakerCutawayProps {
  temperature: number;      // Bimetal temp °C
  bimetalTripTemp: number;  // °C threshold (e.g. 130°C)
  state: MCBState;          // CLOSED, UNLATCHED, ARCING, OPEN_CLEARED
  tripCause: TripCause;
  remainingTimeSec?: number; // Countdown timer until trip
  className?: string;
}

export const BreakerCutaway: React.FC<BreakerCutawayProps> = ({
  temperature,
  bimetalTripTemp,
  state,
  tripCause,
  remainingTimeSec,
  className
}) => {
  const isTripped = state !== MCBState.CLOSED;
  const isMagneticTrip = tripCause === TripCause.MAGNETIC || tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE;

  // Bimetal bending angle (0 to 30 degrees)
  const bimetalDeflection = Math.min(
    30,
    Math.max(0, ((temperature - 30) / (bimetalTripTemp - 30)) * 30)
  );

  return (
    <div className={cn('relative flex flex-col items-center p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden select-none h-full font-mono', className)}>
      {/* Title & Live Reverse Countdown Timer */}
      <div className="w-full flex items-center justify-between mb-2 z-10">
        <span className="text-xs font-bold text-slate-300">
          2D Breaker Mechanical Cutaway
        </span>

        {/* Live Reverse Countdown Timer Badge */}
        <div>
          {isTripped ? (
            <span className="px-2.5 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 text-[11px] font-black uppercase flex items-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> TRIPPED ({tripCause})
            </span>
          ) : remainingTimeSec !== undefined && remainingTimeSec < 3600 ? (
            <span className="px-2.5 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 text-[11px] font-black uppercase flex items-center gap-1 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> TRIP IN: {remainingTimeSec.toFixed(1)}s
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> NO TRIP (1.13x In)
            </span>
          )}
        </div>
      </div>

      {/* SVG 2D Mechanism Cutaway Canvas */}
      <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
        <svg viewBox="0 0 500 240" className="w-full h-full max-w-[500px] overflow-visible">
          <defs>
            <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Enclosure Outer Housing Border */}
          <rect x="50" y="20" width="400" height="200" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

          {/* Line Terminal (Top) */}
          <rect x="235" y="5" width="30" height="20" fill="#475569" rx="3" />
          <circle cx="250" cy="15" r="4" fill="#94a3b8" />

          {/* Load Terminal (Bottom) */}
          <rect x="235" y="215" width="30" height="20" fill="#475569" rx="3" />
          <circle cx="250" cy="225" r="4" fill="#94a3b8" />

          {/* Fixed Contact Post (Left) */}
          <circle cx="160" cy="110" r="7" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
          <path d="M 50,110 L 160,110" stroke="#10b981" strokeWidth="3" />

          {/* Moving Contact Arm */}
          <g>
            <motion.line
              x1="160" y1="110" x2="230" y2="80"
              stroke={isTripped ? '#f43f5e' : '#10b981'} strokeWidth="5" strokeLinecap="round"
              animate={{ rotate: isTripped ? -40 : 0 }}
              style={{ originX: '160px', originY: '110px' }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            />
          </g>

          {/* Arc Chute Assembly (Left Upper) */}
          <g transform="translate(80, 50)">
            <rect x="0" y="0" width="50" height="80" fill="#1e293b" stroke="#475569" strokeWidth="1" rx="4" />
            {[10, 25, 40, 55, 70].map((yPos, i) => (
              <line key={`plate-${i}`} x1="5" y1={yPos} x2="45" y2={yPos} stroke="#94a3b8" strokeWidth="3" />
            ))}
            <text x="25" y="-6" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">Arc Chute</text>
          </g>

          {/* Arcing Effect */}
          {state === MCBState.ARCING && (
            <g filter="url(#arcGlow)">
              <path d="M 155,105 Q 120,80 100,70" fill="none" stroke="#60a5fa" strokeWidth="4" className="animate-ping" />
              <path d="M 155,105 Q 125,85 100,75" fill="none" stroke="#f43f5e" strokeWidth="3" className="animate-pulse" />
            </g>
          )}

          {/* Solenoid Assembly (Center Right) */}
          <g transform="translate(260, 100)">
            <rect x="0" y="0" width="50" height="35" fill="#78350f" stroke="#f59e0b" strokeWidth="1" rx="4" />
            {[5, 13, 21, 29, 37, 45].map((xPos, idx) => (
              <line key={`turn-${idx}`} x1={xPos} y1="0" x2={xPos} y2="35" stroke="#fbbf24" strokeWidth="2" />
            ))}
            {/* Plunger */}
            <motion.rect
              x="-15" y="12" width="20" height="10" fill="#cbd5e1" rx="2"
              animate={{ x: isMagneticTrip ? -30 : -15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            />
            <text x="25" y="48" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">Solenoid</text>
          </g>

          {/* Bimetal Strip (Far Right) */}
          <g transform="translate(360, 70)">
            <rect x="0" y="90" width="15" height="30" fill="#334155" rx="2" />
            <motion.path
              d="M 7,90 C 7,60 7,30 7,0"
              fill="none"
              stroke={temperature >= bimetalTripTemp ? '#f43f5e' : temperature > 60 ? '#f59e0b' : '#38bdf8'}
              strokeWidth="6"
              strokeLinecap="round"
              animate={{
                d: `M 7,90 C 7,60 ${7 - bimetalDeflection},30 ${7 - bimetalDeflection * 1.2},0`
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            />
            <text x="7" y="132" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">
              Bimetal ({temperature.toFixed(1)}°C)
            </text>
          </g>
        </svg>
      </div>

      {/* Footer Metrics */}
      <div className="w-full flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1">
        <span>Bimetal Temp: <strong className="text-amber-400">{temperature.toFixed(1)}°C</strong></span>
        <span>Trip Threshold: <strong className="text-rose-400">130.0°C</strong></span>
        <span>Trip Cause: <strong className="text-sky-400">{tripCause}</strong></span>
      </div>
    </div>
  );
};
