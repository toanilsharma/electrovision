import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Activity, Zap, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { computeECGSample, resolvePhysiologicalState } from '../utils/ecgGenerator';

export interface MiniVitalsHUDProps {
  isSimulating: boolean;
  currentMA: number;
  voltage: number;
  path: 'hand-to-hand' | 'hand-to-foot';
  skinCondition: 'dry' | 'wet';
  isPPESafe: boolean;
  isMuscleLocked: boolean;
  className?: string;
}

export const MiniVitalsHUD: React.FC<MiniVitalsHUDProps> = ({
  isSimulating,
  currentMA,
  voltage,
  path,
  isPPESafe,
  isMuscleLocked,
  className
}) => {
  // Resolve state
  const { rhythm, targetParams } = resolvePhysiologicalState(
    currentMA,
    isSimulating,
    isPPESafe,
    0
  );

  const isVFib = rhythm === 'vfib';
  const isLetGo = isSimulating && !isPPESafe && currentMA >= 10;
  const isPerception = isSimulating && !isPPESafe && currentMA >= 0.5;

  const statusColor = targetParams.statusColor;

  // 1-second looping SVG ECG Waveform Path generated via McSharry model
  const ecgPath = useMemo(() => {
    const points: string[] = [];
    const width = 160;
    const timeSpan = 1.0; // 1 second span

    for (let x = 0; x <= width; x += 2) {
      const t = (x / width) * timeSpan;
      // Evaluate McSharry sample for current rhythm params
      const sample = computeECGSample(t, targetParams, 0);
      // Center at Y=15, scale amplitude to fit 30px height box
      const y = 15 - sample * 0.35;
      const clampedY = Math.max(2, Math.min(28, y));
      if (x === 0) {
        points.push(`M ${x} ${clampedY.toFixed(1)}`);
      } else {
        points.push(`L ${x} ${clampedY.toFixed(1)}`);
      }
    }
    return points.join(' ');
  }, [targetParams]);

  return (
    <div 
      className={cn(
        "w-full bg-slate-950/95 backdrop-blur-xl border border-slate-750/90 rounded-2xl p-2 shadow-2xl flex items-center justify-between gap-2 select-none md:hidden",
        isMuscleLocked && "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
        className
      )}
    >
      {/* 1. Tiny 40x40px Animated Body Silhouette with Glowing Current Path */}
      <div className="relative w-10 h-10 shrink-0 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-9 h-9">
          {/* Base Anatomical Silhouette */}
          {/* Head */}
          <circle cx="50" cy="18" r="10" fill="#475569" />
          {/* Torso */}
          <rect x="40" y="32" width="20" height="30" rx="4" fill="#334155" />
          {/* Left Arm */}
          <line x1="40" y1="36" x2="18" y2="52" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
          {/* Right Arm */}
          <line x1="60" y1="36" x2="82" y2="52" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
          {/* Left Leg */}
          <line x1="45" y1="62" x2="35" y2="92" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
          {/* Right Leg */}
          <line x1="55" y1="62" x2="65" y2="92" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

          {/* Animated Glowing Shock Path */}
          {isSimulating && !isPPESafe && (
            <g>
              {path === 'hand-to-foot' ? (
                // Left Hand -> Chest (Heart) -> Right Foot Path
                <motion.path
                  d="M 18 52 L 40 36 L 50 44 L 55 62 L 65 92"
                  fill="none"
                  stroke={statusColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.15, repeat: Infinity }}
                  style={{ filter: `drop-shadow(0 0 4px ${statusColor})` }}
                />
              ) : (
                // Hand -> Hand Path across Heart
                <motion.path
                  d="M 18 52 L 40 36 L 50 44 L 60 36 L 82 52"
                  fill="none"
                  stroke={statusColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.15, repeat: Infinity }}
                  style={{ filter: `drop-shadow(0 0 4px ${statusColor})` }}
                />
              )}

              {/* Glowing Heart Node */}
              <motion.circle
                cx="50"
                cy="44"
                r="4.5"
                fill={statusColor}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: isVFib ? 0.1 : 0.4, repeat: Infinity }}
                style={{ filter: `drop-shadow(0 0 6px ${statusColor})` }}
              />
            </g>
          )}

          {/* PPE Rubber Glove Icons if active */}
          {isPPESafe && (
            <g fill="#10b981">
              <circle cx="18" cy="52" r="3.5" />
              <circle cx="82" cy="52" r="3.5" />
            </g>
          )}
        </svg>
      </div>

      {/* 2. Live Current & Voltage Readout */}
      <div className="flex flex-col min-w-0 flex-1 pl-0.5">
        <div className="flex items-center gap-1.5">
          <Zap className={cn("w-3.5 h-3.5 shrink-0", isSimulating ? "text-orange-400 animate-pulse" : "text-slate-500")} />
          <span className="text-xs font-black font-mono tracking-tight text-white truncate">
            {isSimulating ? `${currentMA.toFixed(1)} mA` : '0.0 mA'}
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">
            ({voltage}V)
          </span>
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          {isPPESafe ? (
            <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> PPE SAFE (0 mA)
            </span>
          ) : isMuscleLocked ? (
            <span className="text-[9px] font-black text-red-400 flex items-center gap-0.5 animate-pulse">
              <Lock className="w-3 h-3" /> MUSCLE LOCKED
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase truncate" style={{ color: statusColor }}>
              {currentMA >= 50 
                ? '⚡ V-FIB RISK' 
                : currentMA >= 10 
                ? '🔒 CANNOT LET GO' 
                : currentMA >= 0.5 
                ? '〰️ INVOLUNTARY TWITCH' 
                : '✅ BELOW SENSORY LIMIT'}
            </span>
          )}
        </div>
      </div>

      {/* 3. 1-Second Looping ECG Waveform Canvas */}
      <div className="w-[85px] h-8 shrink-0 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 relative overflow-hidden flex items-center">
        <div className="absolute top-0.5 left-1 text-[7.5px] font-mono font-bold text-slate-400 flex items-center gap-0.5">
          <Activity className="w-2.5 h-2.5 text-emerald-400" />
          <span>ECG</span>
        </div>

        <svg viewBox="0 0 160 30" className="w-full h-full overflow-visible">
          {/* Oscilloscope Grid background */}
          <line x1="0" y1="15" x2="160" y2="15" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />

          {/* 1-Second Looping Waveform with Sweep Animation */}
          <motion.path
            d={ecgPath}
            fill="none"
            stroke={statusColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ x: [-80, 0] }}
            transition={{
              duration: isSimulating ? (isVFib ? 0.4 : 0.8) : 1.0,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ filter: `drop-shadow(0 0 3px ${statusColor})` }}
          />
        </svg>
      </div>
    </div>
  );
};
