import React from 'react';
import { motion } from 'motion/react';
import { MCBState, TripCause, MCBTrippingCurve } from '../../../mcb/types';
import { cn } from '@/src/lib/utils';
import { RotateCcw, Zap, Sparkles } from 'lucide-react';

export type BreakerDeviceType = 'mcb' | 'rccb' | 'rcbo';
export type BreakerTripCause = TripCause | 'RESIDUAL_LEAKAGE' | 'TEST_TRIP' | string;

export interface ModularDeviceFaceplateProps {
  deviceType?: BreakerDeviceType;
  In?: number;
  curve?: MCBTrippingCurve;
  iDeltaN?: number; // Residual operating current in mA (e.g. 30mA)
  rcdType?: 'AC' | 'A' | 'B';
  state: MCBState;
  tripCause?: BreakerTripCause;
  onReclose: () => void;
  onTestTrip?: () => void;
  compact?: boolean;
  className?: string;
}

export const ModularDeviceFaceplate: React.FC<ModularDeviceFaceplateProps> = ({
  deviceType = 'mcb',
  In = 16,
  curve = 'C',
  iDeltaN = 30,
  rcdType = 'A',
  state,
  tripCause,
  onReclose,
  onTestTrip,
  compact = false,
  className
}) => {
  const isTripped = state !== MCBState.CLOSED;

  // Header Title & Standard
  const getHeaderTitle = () => {
    switch (deviceType) {
      case 'rccb':
        return 'DIN RAIL RCCB';
      case 'rcbo':
        return 'DIN RAIL RCBO';
      default:
        return 'DIN RAIL MCB';
    }
  };

  const isRCCB = deviceType === 'rccb';
  const isRCBO = deviceType === 'rcbo';
  const hasResidualProtection = isRCCB || isRCBO;

  const handleTestButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTestTrip) {
      onTestTrip();
    } else {
      onReclose();
    }
  };

  return (
    <div
      className={cn(
        compact
          ? "relative flex flex-col items-center justify-center font-mono select-none overflow-hidden"
          : "relative flex flex-col items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 shadow-xl font-mono select-none overflow-hidden",
        className
      )}
    >
      {/* Header Title Bar (hidden in compact mode) */}
      {!compact && (
        <div className="w-full flex items-center justify-between mb-1.5 text-[11px] font-bold text-slate-300">
          <span className="flex items-center gap-1 text-slate-400">
            <Zap className={cn("w-3.5 h-3.5", isRCCB ? "text-cyan-400" : isRCBO ? "text-purple-400" : "text-amber-400")} />
            {getHeaderTitle()}
          </span>
          <div className="flex items-center gap-1.5">
            {hasResidualProtection && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {iDeltaN}mA Type {rcdType}
              </span>
            )}
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-black uppercase",
                isTripped ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
              )}
            >
              {isTripped ? 'O (OPEN)' : 'I (CLOSED)'}
            </span>
          </div>
        </div>
      )}

      {/* SVG DIN Rail & Modular 18mm/36mm Faceplate */}
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

            {/* Test Button Gradient */}
            <linearGradient id="testButtonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
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

          {/* 2. MODULAR ENCLOSURE BODY */}
          {!hasResidualProtection ? (
            /* ========================================================== */
            /* STANDARD MCB 1-POLE 18mm ENCLOSURE (100% IEC 60898-1 IDENTICAL) */
            /* ========================================================== */
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

              {/* Engraved Technical Specifications (IEC 60898-1) */}
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

              {/* Dual-Color Status Indicator Window (RED = CLOSED/ON, GREEN = OPEN/OFF) */}
              <g transform="translate(33, 76)">
                <rect x="0" y="0" width="24" height="10" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                <rect
                  x="2" y="2" width="20" height="6" rx="1"
                  fill={isTripped ? '#22c55e' : '#ef4444'}
                />
                <text x="12" y="7" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="black">
                  {isTripped ? 'OFF' : 'ON'}
                </text>
              </g>

              {/* Interactive Operating Toggle Handle */}
              <g
                transform="translate(45, 102)"
                onClick={onReclose}
                className="cursor-pointer group"
              >
                <title>{isTripped ? "Click to Reset / Re-close Breaker" : "Breaker Closed & Energized"}</title>
                <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                
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
                  <line x1="-8" y1="-5" x2="-8" y2="5" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                  <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                  <line x1="8" y1="-5" x2="8" y2="5" stroke="#ffffff" strokeWidth="1" opacity="0.6" />

                  <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="black">
                    {isTripped ? 'O' : 'I'}
                  </text>
                </motion.g>
              </g>
            </g>
          ) : (
            /* ========================================================== */
            /* RCCB / RCBO MODULAR ENCLOSURE (IEC 61008-1 / IEC 61009-1)  */
            /* ========================================================== */
            <g transform="translate(50, 5)">
              {/* 2-Pole Modular Housing (width 140) */}
              <rect x="0" y="0" width="140" height="145" rx="6" fill="url(#mcbPlasticGrad)" stroke="#475569" strokeWidth="1.5" />
              <rect x="4" y="4" width="132" height="137" rx="4" fill="#f1f5f9" />

              {/* Left Pole Terminal Screws (Phase / In) */}
              <rect x="12" y="8" width="30" height="15" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
              <circle cx="27" cy="15" r="4.5" fill="#475569" />
              <line x1="24" y1="15" x2="30" y2="15" stroke="#e2e8f0" strokeWidth="1.2" />

              {/* Right Pole Terminal Screws (Neutral / Out) */}
              <rect x="98" y="8" width="30" height="15" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
              <circle cx="113" cy="15" r="4.5" fill="#475569" />
              <line x1="110" y1="15" x2="116" y2="15" stroke="#e2e8f0" strokeWidth="1.2" />

              {/* Bottom Terminals */}
              <rect x="12" y="122" width="30" height="15" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
              <circle cx="27" cy="129" r="4.5" fill="#475569" />
              <rect x="98" y="122" width="30" height="15" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
              <circle cx="113" cy="129" r="4.5" fill="#475569" />

              {/* Technical Specifications Laser Markings */}
              {isRCCB ? (
                /* RCCB Laser Engravings */
                <>
                  <text x="36" y="36" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="900">
                    In {In}A
                  </text>
                  <text x="36" y="47" textAnchor="middle" fill="#0369a1" fontSize="9" fontWeight="800">
                    IΔn {iDeltaN}mA
                  </text>
                  <text x="36" y="58" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="bold">
                    230V~ 50Hz
                  </text>
                  <text x="36" y="70" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="bold">
                    IEC 61008-1
                  </text>
                </>
              ) : (
                /* RCBO Laser Engravings */
                <>
                  <text x="36" y="35" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="900">
                    {curve}{In}
                  </text>
                  <text x="36" y="46" textAnchor="middle" fill="#7c3aed" fontSize="9" fontWeight="800">
                    IΔn {iDeltaN}mA
                  </text>
                  {/* Breaking Capacity Box */}
                  <rect x="22" y="51" width="16" height="9" fill="none" stroke="#0f172a" strokeWidth="0.8" />
                  <text x="30" y="58" textAnchor="middle" fill="#0f172a" fontSize="6.5" fontWeight="bold">
                    6000
                  </text>
                  <rect x="39" y="51" width="11" height="9" fill="none" stroke="#0f172a" strokeWidth="0.8" />
                  <text x="44.5" y="58" textAnchor="middle" fill="#0f172a" fontSize="6.5" fontWeight="bold">
                    3
                  </text>
                  <text x="36" y="70" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="bold">
                    IEC 61009-1
                  </text>
                </>
              )}

              {/* Type A Marking Symbol (AC Sine + Pulsating DC wave) */}
              <g transform="translate(18, 74)">
                <rect x="0" y="0" width="36" height="11" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Sine wave ~ */}
                <path d="M 4 5.5 Q 6.5 2.5, 9 5.5 T 14 5.5" fill="none" stroke="#0f172a" strokeWidth="1" />
                {/* Pulsating DC wave _--_ */}
                <path d="M 18 8 L 22 8 Q 24 3, 26 8 L 30 8" fill="none" stroke="#0f172a" strokeWidth="1" />
                <text x="33" y="8" fill="#0f172a" fontSize="5" fontWeight="bold">A</text>
              </g>

              {/* TEST PUSH BUTTON ("T") */}
              <g
                transform="translate(18, 92)"
                onClick={handleTestButtonClick}
                className="cursor-pointer group"
              >
                <title>Push to Test Residual Mechanism ("T" Monthly Test)</title>
                {/* Button Housing Well */}
                <rect x="0" y="0" width="36" height="24" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <motion.rect
                  whileHover={{ scale: 0.96 }}
                  whileTap={{ scale: 0.90, y: 1 }}
                  x="3" y="3" width="30" height="18" rx="3"
                  fill="url(#testButtonGrad)"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
                <text x="18" y="16" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">
                  T
                </text>
                <text x="18" y="30" textAnchor="middle" fill="#64748b" fontSize="5" fontWeight="bold">
                  TEST
                </text>
              </g>

              {/* RIGHT POLE: STATUS INDICATOR & OPERATING TOGGLE HANDLE */}
              {/* Dual-Color Status Window */}
              <g transform="translate(93, 62)">
                <rect x="0" y="0" width="24" height="10" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                <rect
                  x="2" y="2" width="20" height="6" rx="1"
                  fill={isTripped ? '#22c55e' : '#ef4444'}
                />
                <text x="12" y="7" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="black">
                  {isTripped ? 'OFF' : 'ON'}
                </text>
              </g>

              {/* RCBO Differential Trip Flag Window (Shows White/Blue if Residual Trip) */}
              {isRCBO && (
                <g transform="translate(93, 46)">
                  <rect x="0" y="0" width="24" height="11" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                  <rect
                    x="2" y="2" width="20" height="7" rx="1"
                    fill={isTripped ? '#0284c7' : '#334155'}
                  />
                  <text x="12" y="7.5" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="bold">
                    {isTripped ? 'ΔI TRIP' : 'NORM'}
                  </text>
                </g>
              )}

              {/* Interactive Operating Toggle Handle */}
              <g
                transform="translate(105, 96)"
                onClick={onReclose}
                className="cursor-pointer group"
              >
                <title>{isTripped ? "Click to Reset / Re-close Breaker" : "Breaker Closed & Energized"}</title>
                <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                
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
                  <line x1="-8" y1="-5" x2="-8" y2="5" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                  <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                  <line x1="8" y1="-5" x2="8" y2="5" stroke="#ffffff" strokeWidth="1" opacity="0.6" />

                  <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="black">
                    {isTripped ? 'O' : 'I'}
                  </text>
                </motion.g>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Interactive Action Bar (hidden in compact mode) */}
      {!compact && (
        <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
          <span>{hasResidualProtection ? "Test 'T' or click handle to reset" : "Click handle or button to reset"}</span>
          <div className="flex items-center gap-1">
            {hasResidualProtection && (
              <button
                onClick={handleTestButtonClick}
                className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/80 hover:bg-sky-900 text-sky-200 font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-sky-400" /> Test 'T'
              </button>
            )}
            <button
              onClick={onReclose}
              className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/80 hover:bg-rose-900 text-rose-200 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" /> Re-close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
