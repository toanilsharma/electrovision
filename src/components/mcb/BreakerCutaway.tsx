import React from 'react';
import { motion } from 'motion/react';
import { MCBState, TripCause } from '../../mcb/types';
import { cn } from '@/src/lib/utils';

interface BreakerCutawayProps {
  temperature: number;      // Bimetal temp °C
  bimetalTripTemp: number;  // °C threshold (e.g. 130°C)
  state: MCBState;          // CLOSED, UNLATCHED, ARCING, OPEN_CLEARED
  tripCause: TripCause;
  className?: string;
}

export const BreakerCutaway: React.FC<BreakerCutawayProps> = ({
  temperature,
  bimetalTripTemp,
  state,
  tripCause,
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
    <div className={cn('relative flex flex-col items-center p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden select-none', className)}>
      {/* Title */}
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-300 font-mono">
          2D Breaker Mechanical Cutaway
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
          Internal Mechanics
        </span>
      </div>

      {/* SVG 2D Cross-section Canvas */}
      <div className="relative w-full h-[260px] flex items-center justify-center">
        <svg viewBox="0 0 500 300" className="w-full h-full max-w-[500px]">
          <defs>
            {/* Plasma Arc Gradient */}
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#60a5fa" />
              <stop offset="70%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Arc Glow Filter */}
            <filter id="plasmaGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Molded Plastic Housing Frame */}
          <path
            d="M 40,20 L 460,20 Q 480,20 480,40 L 480,260 Q 480,280 460,280 L 40,280 Q 20,280 20,260 L 20,40 Q 20,20 40,20 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="3"
          />

          {/* Internal Chamber Divider Lines */}
          <rect x="35" y="35" width="430" height="230" rx="8" fill="#1e293b" opacity="0.5" />

          {/* Line Terminal (Top Left) */}
          <rect x="40" y="40" width="30" height="30" fill="#475569" stroke="#94a3b8" strokeWidth="2" rx="4" />
          <text x="55" y="60" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">LINE</text>

          {/* Load Terminal (Bottom Right) */}
          <rect x="430" y="230" width="30" height="30" fill="#475569" stroke="#94a3b8" strokeWidth="2" rx="4" />
          <text x="445" y="250" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">LOAD</text>

          {/* 1. Arc Chute Splitter Plates (Right Side De-ionizing Chamber) */}
          <g transform="translate(350, 60)">
            <text x="25" y="-10" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">Arc Chute</text>
            {[0, 15, 30, 45, 60, 75, 90].map((yOffset, idx) => (
              <rect
                key={idx}
                x="0"
                y={yOffset}
                width="50"
                height="6"
                fill="#94a3b8"
                stroke="#475569"
                rx="2"
              />
            ))}
          </g>

          {/* 2. Magnetic Solenoid Coil & Plunger (Top Center) */}
          <g transform="translate(180, 50)">
            <rect x="0" y="0" width="40" height="60" fill="#0284c7" rx="4" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="20" y="35" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">SOLENOID</text>
            {/* Coil Windings */}
            <path d="M 0,10 L 40,10 M 0,20 L 40,20 M 0,30 L 40,30 M 0,40 L 40,40 M 0,50 L 40,50" stroke="#0284c7" strokeWidth="2" />

            {/* Solenoid Impact Plunger (Shoots down on magnetic trip) */}
            <motion.rect
              x="16"
              y="60"
              width="8"
              height="35"
              fill="#cbd5e1"
              stroke="#64748b"
              rx="2"
              animate={{
                y: isMagneticTrip && isTripped ? 85 : 60
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            />
          </g>

          {/* 3. Bimetal Thermal Strip Element (Left Bottom) */}
          <g transform="translate(80, 160)">
            <text x="15" y="-10" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">BIMETAL</text>
            {/* Fixed base */}
            <rect x="0" y="60" width="30" height="15" fill="#475569" rx="2" />

            {/* Bimetal Strip Layer (Bends with temperature) */}
            <g>
              <motion.path
                d="M 15,60 L 15,0"
                stroke={temperature >= bimetalTripTemp ? '#f43f5e' : '#f59e0b'}
                strokeWidth="6"
                strokeLinecap="round"
                animate={{
                  rotate: bimetalDeflection
                }}
                style={{ originX: '15px', originY: '60px' }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            </g>
          </g>

          {/* 4. Breaker Contacts & Latch Lever */}
          {/* Fixed Contact Pad */}
          <circle cx="280" cy="170" r="7" fill="#f8fafc" stroke="#475569" strokeWidth="2" />

          {/* Moving Contact Arm */}
          <g>
            <motion.line
              x1="200"
              y1="220"
              x2="280"
              y2="170"
              stroke="#e2e8f0"
              strokeWidth="5"
              strokeLinecap="round"
              animate={{
                rotate: isTripped ? -40 : 0
              }}
              style={{ originX: '200px', originY: '220px' }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            />
            {/* Moving Contact Pad */}
            <motion.circle
              cx="280"
              cy="170"
              r="7"
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="2"
              animate={{
                rotate: isTripped ? -40 : 0
              }}
              style={{ originX: '200px', originY: '220px' }}
            />
          </g>

          {/* 5. Plasma Arc drawn into Arc Chute during ARCING state */}
          {state === MCBState.ARCING && (
            <g filter="url(#plasmaGlow)">
              {/* Primary Arc Core stretching from contact to arc chute */}
              <motion.path
                d="M 280,170 Q 320,130 360,110"
                fill="none"
                stroke="url(#arcGrad)"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.05 }}
              />
              <motion.path
                d="M 280,170 Q 330,150 360,130"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
                className="animate-pulse"
              />
              {/* Arc Plasma Sparks */}
              <circle cx="310" cy="140" r="3" fill="#ffffff" className="animate-ping" />
              <circle cx="340" cy="120" r="4" fill="#fef08a" className="animate-ping" />
            </g>
          )}
        </svg>
      </div>

      {/* Mechanics Status Footer */}
      <div className="w-full flex items-center justify-between text-xs pt-2 border-t border-slate-800">
        <span className="text-slate-400 font-mono">
          Contact State: <strong className={isTripped ? 'text-rose-400' : 'text-emerald-400'}>{isTripped ? 'OPEN / UNLATCHED' : 'CLOSED'}</strong>
        </span>
        <span className="text-slate-400 font-mono">
          Arc Status: <strong className={state === MCBState.ARCING ? 'text-amber-400 animate-pulse' : 'text-slate-400'}>{state === MCBState.ARCING ? '⚡ PLASMA ARCING' : 'EXTINGUISHED'}</strong>
        </span>
      </div>
    </div>
  );
};
