import React from 'react';
import { motion } from 'motion/react';
import { MCBState, TripCause, MCBTrippingCurve } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { RotateCcw, Zap, ShieldAlert, Sparkles } from 'lucide-react';

interface DINRailMCBFaceplateProps {
  In: number;
  curve: MCBTrippingCurve;
  state: MCBState;
  tripCause: TripCause;
  onReclose: () => void;
  className?: string;
}

export const DINRailMCBFaceplate: React.FC<DINRailMCBFaceplateProps> = ({
  In,
  curve,
  state,
  tripCause,
  onReclose,
  className
}) => {
  const isTripped = state !== MCBState.CLOSED;

  return (
    <div className={cn("relative flex flex-col items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 shadow-xl font-mono select-none overflow-hidden", className)}>
      
      {/* Header Title */}
      <div className="w-full flex items-center justify-between mb-1.5 text-[11px] font-bold text-slate-300">
        <span className="flex items-center gap-1 text-slate-400">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> DIN RAIL MCB
        </span>
        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-black uppercase", isTripped ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400")}>
          {isTripped ? 'O (OPEN)' : 'I (CLOSED)'}
        </span>
      </div>

      {/* SVG DIN Rail & Modular 18mm Faceplate */}
      <div className="relative w-full h-[155px] flex items-center justify-center">
        <svg viewBox="0 0 240 155" className="w-full h-full max-w-[240px] overflow-visible">
          <defs>
            {/* Metallic DIN Rail Gradient */}
            <linearGradient id="dinRailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="30%" stopColor="#94a3b8" />
              <stop offset="70%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Industrial Plastic Housing Gradient */}
            <linearGradient id="mcbPlasticGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Handle Shadow Filter */}
            <filter id="handleShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* 1. TOP HAT DIN RAIL (EN 50022 - 35mm profile) */}
          <g transform="translate(10, 10)">
            <rect x="0" y="30" width="220" height="75" fill="url(#dinRailGrad)" stroke="#1e293b" strokeWidth="1.5" rx="3" />
            {/* DIN Rail Slots */}
            {[20, 60, 100, 140, 180].map((xP, i) => (
              <rect key={`slot-${i}`} x={xP} y="55" width="20" height="25" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            ))}
          </g>

          {/* 2. MODULAR 1-POLE 18mm MCB ENCLOSURE BODY */}
          <g transform="translate(75, 5)">
            {/* Base Housing */}
            <rect x="0" y="0" width="90" height="145" rx="6" fill="url(#mcbPlasticGrad)" stroke="#475569" strokeWidth="1.5" />
            <rect x="4" y="4" width="82" height="137" rx="4" fill="#f1f5f9" />

            {/* Top Terminal Screw Tunnel */}
            <rect x="25" y="8" width="40" height="16" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="45" cy="16" r="5" fill="#475569" />
            <line x1="42" y1="16" x2="48" y2="16" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* Bottom Terminal Screw Tunnel */}
            <rect x="25" y="121" width="40" height="16" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="45" cy="129" r="5" fill="#475569" />
            <line x1="42" y1="129" x2="48" y2="129" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* 3. ENGRAVED TECHNICAL SPECIFICATIONS (IEC 60898-1) */}
            <text x="45" y="38" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900" fontFamily="sans-serif">
              {curve}{In}
            </text>

            <text x="45" y="49" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">
              230/400V~
            </text>

            {/* 6000A Breaking Capacity & Energy Class 3 Box */}
            <rect x="22" y="53" width="22" height="11" fill="none" stroke="#0f172a" strokeWidth="1" />
            <text x="33" y="61" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="bold">
              6000
            </text>

            <rect x="47" y="53" width="20" height="11" fill="none" stroke="#0f172a" strokeWidth="1" />
            <text x="57" y="61" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="bold">
              3
            </text>

            <text x="45" y="72" textAnchor="middle" fill="#64748b" fontSize="6.5" fontWeight="bold">
              IEC 60898-1
            </text>

            {/* 4. DUAL-COLOR STATUS INDICATOR WINDOW (RED = CLOSED/ON, GREEN = OPEN/OFF) */}
            <g transform="translate(33, 76)">
              <rect x="0" y="0" width="24" height="10" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
              <rect
                x="2" y="2" width="20" height="6" rx="1"
                fill={isTripped ? '#22c55e' : '#ef4444'} // Green: Safe/Open, Red: Energized/Closed
              />
              <text x="12" y="7" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="black">
                {isTripped ? 'OFF' : 'ON'}
              </text>
            </g>

            {/* 5. INTERACTIVE OPERATING TOGGLE HANDLE */}
            <g
              transform="translate(45, 102)"
              onClick={onReclose}
              className="cursor-pointer group"
            >
              <title>{isTripped ? "Click to Reset / Re-close Breaker" : "Breaker Closed & Energized"}</title>
              {/* Handle Pivot Well */}
              <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
              
              {/* Molded Toggle Dolly with Spring Overshoot Motion */}
              <motion.g
                animate={{
                  rotate: isTripped ? 35 : -30,
                  y: isTripped ? 4 : -4
                }}
                transition={{
                  type: 'spring',
                  stiffness: 600,
                  damping: 18,
                  mass: 0.8
                }}
                style={{ originX: '0px', originY: '0px' }}
                filter="url(#handleShadow)"
              >
                <rect
                  x="-14" y="-10" width="28" height="20" rx="3"
                  fill={isTripped ? '#ef4444' : '#0f172a'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* Grip Ribs */}
                <line x1="-8" y1="-5" x2="-8" y2="5" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                <line x1="8" y1="-5" x2="8" y2="5" stroke="#ffffff" strokeWidth="1" opacity="0.6" />

                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="black">
                  {isTripped ? 'O' : 'I'}
                </text>
              </motion.g>
            </g>
          </g>
        </svg>
      </div>

      {/* Interactive Reset Action Tip */}
      <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
        <span>Click handle or button to reset</span>
        <button
          onClick={onReclose}
          className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/80 hover:bg-rose-900 text-rose-200 font-bold transition-colors cursor-pointer flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3 text-rose-400" /> Re-close
        </button>
      </div>
    </div>
  );
};
