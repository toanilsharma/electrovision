import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { ShockPath, UserProfile } from '../types';
import { cn } from '@/src/lib/utils';

interface HumanBodyTwinProps {
  shockPath: ShockPath;
  intensity: number;
  currentMA: number;
  durationMs: number;
  isAnimating: boolean;
  profile?: string;
  isPPESafe?: boolean;
  activePPENames?: string[];
  onMasterReset?: () => void;
}

export const HumanBodyTwin: React.FC<HumanBodyTwinProps> = ({
  shockPath,
  intensity,
  currentMA,
  durationMs,
  isAnimating,
  profile,
  isPPESafe,
  onMasterReset
}) => {
  const skinCondition = (profile && typeof profile === 'object' && (profile as any)?.skinCondition) || 'dry';

  const [persistentDamage, setPersistentDamage] = useState<{
    maxMA: number;
    maxDuration: number;
    worstPath: ShockPath;
    active: boolean;
  }>({ maxMA: 0, maxDuration: 0, worstPath: 'hand-to-foot', active: false });

  useEffect(() => {
    if (isAnimating && !isPPESafe && currentMA > 0.5) {
      setPersistentDamage((prev) => ({
        maxMA: Math.max(prev.maxMA, currentMA),
        maxDuration: Math.max(prev.maxDuration, durationMs),
        worstPath: currentMA >= prev.maxMA ? shockPath : prev.worstPath,
        active: true
      }));
    }
  }, [isAnimating, isPPESafe, currentMA, durationMs, shockPath]);

  const handleResetDamage = () => {
    setPersistentDamage({ maxMA: 0, maxDuration: 0, worstPath: 'hand-to-foot', active: false });
    if (onMasterReset) {
      onMasterReset();
    }
  };

  const activeMA = persistentDamage.active ? Math.max(currentMA, persistentDamage.maxMA) : currentMA;
  const activeIntensity = persistentDamage.active ? Math.min(activeMA / 100, 1.0) : intensity;
  const activePath = persistentDamage.active ? persistentDamage.worstPath : shockPath;
  const hasDamage = persistentDamage.active || (isAnimating && !isPPESafe && currentMA > 0.5);

  // Anatomical Silhouette Path Data
  const bodySilhouette = `
    M 200 15 
    C 215 15, 225 25, 225 40 
    C 225 55, 215 65, 200 65 
    C 185 65, 175 55, 175 40 
    C 175 25, 185 15, 200 15 Z
    M 190 65 L 210 65 L 218 80 L 182 80 Z
    M 182 80 L 218 80 L 235 95 L 255 160 L 272 250 L 255 250 L 242 170 L 230 120 L 230 220 L 170 220 L 170 120 L 158 170 L 145 250 L 128 250 L 145 160 L 165 95 Z
    M 170 220 L 200 220 L 195 330 L 165 475 L 142 475 L 180 320 L 185 220 Z
    M 200 220 L 230 220 L 215 220 L 220 320 L 258 475 L 235 475 L 205 330 Z
  `;

  const brainPath = "M 188 28 C 188 20, 212 20, 212 28 C 215 38, 185 38, 188 28 Z";
  const leftLung = "M 178 92 C 170 100, 172 130, 188 135 C 192 120, 188 95, 178 92 Z";
  const rightLung = "M 222 92 C 230 100, 228 130, 212 135 C 208 120, 212 95, 222 92 Z";
  const heartAnatomical = "M 196 108 C 190 100, 185 115, 198 130 C 210 115, 206 100, 196 108 Z";

  const pathHandToFoot = "M 128 250 Q 150 170 170 120 Q 200 130 204 130 Q 205 250 235 475";
  const pathHandToHand = "M 128 250 Q 150 170 170 120 Q 200 130 230 120 Q 250 170 272 250";

  const pathColor = useMemo(() => {
    if (!hasDamage) return '#38bdf8';
    if (activeIntensity > 0.7) return '#ef4444';
    if (activeIntensity > 0.4) return '#f97316';
    return '#facc15';
  }, [hasDamage, activeIntensity]);

  const calloutChips = useMemo(() => {
    if (!hasDamage || activeMA < 0.5) return [];

    const chips = [];

    if (activeMA >= 0.5 && activeMA < 10) {
      chips.push({
        id: 'tingle',
        side: 'left',
        chipX: 10,
        chipY: 35,
        targetX: 150 + 175,
        targetY: 45,
        title: '⚡ MILD TINGLE (0.5mA - 10mA)',
        subtitle: 'Mild buzzing feeling in your fingers.',
        badgeClass: 'bg-yellow-950/95 border-yellow-400 text-yellow-200'
      });
    }

    if (activeMA >= 20) {
      chips.push({
        id: 'respiratory',
        side: 'right',
        chipX: 470,
        chipY: 75,
        targetX: 150 + 220,
        targetY: 115,
        title: '🫁 CHEST CRAMP (20mA+)',
        subtitle: 'Chest muscles lock tight. Hard to breathe!',
        badgeClass: 'bg-amber-950/95 border-amber-400 text-amber-100'
      });
    }

    if (activeMA >= 10) {
      chips.push({
        id: 'letgo',
        side: 'left',
        chipX: 10,
        chipY: 180,
        targetX: 150 + 138,
        targetY: 200,
        title: '✊ CANNOT LET GO (10mA+)',
        subtitle: 'Hands lock tight to the live wire!',
        badgeClass: 'bg-orange-950/95 border-orange-400 text-amber-100 font-bold'
      });
    }

    if (activeMA >= 50) {
      chips.push({
        id: 'vfib',
        side: 'right',
        chipX: 470,
        chipY: 220,
        targetX: 150 + 204,
        targetY: 130,
        title: '💔 HEART STOP RISK (50mA+)',
        subtitle: 'Heart beats out of rhythm! Can stop pumping!',
        badgeClass: 'bg-red-950/95 border-red-500 text-white animate-pulse'
      });
    }

    if (activeMA >= 100) {
      chips.push({
        id: 'burns',
        side: 'left',
        chipX: 10,
        chipY: 310,
        targetX: 150 + 128,
        targetY: 250,
        title: '🔥 HEAT BURNS (100mA+)',
        subtitle: 'Skin entry burns & internal heat damage.',
        badgeClass: 'bg-rose-950/95 border-rose-400 text-rose-100'
      });
    }

    if (activePath === 'hand-to-foot' && activeMA >= 50) {
      chips.push({
        id: 'toe_exit_burn',
        side: 'right',
        chipX: 470,
        chipY: 330,
        targetX: 150 + 235,
        targetY: 475,
        title: '🦶 FOOT & TOE EXIT BURN (DEEP WOUND)',
        subtitle: 'Electricity exiting through toes into the ground causes deep 3rd-degree burns and skin charring.',
        badgeClass: 'bg-red-950/95 border-red-500 text-rose-200 animate-pulse'
      });
    }

    return chips;
  }, [hasDamage, activeMA, activePath]);

  return (
    <div className="relative flex flex-col w-full h-full min-h-0 flex-1 bg-slate-950/95 rounded-2xl border border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl select-none">
      {/* Header Bar with Master Reset Button #2 */}
      <div className="w-full bg-slate-900/95 border-b border-slate-800 py-1 px-2.5 flex items-center justify-between gap-2 z-20 shrink-0 min-h-[32px]">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded border shadow-sm flex items-center gap-1 transition-all whitespace-nowrap',
              isAnimating
                ? 'bg-red-950/90 text-red-300 border-red-500/80 animate-pulse'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
            )}
          >
            {isAnimating ? '⚡ SHOCK IN PROGRESS' : 'STANDBY MODE'}
          </span>
          <span className="text-[10.5px] sm:text-xs font-mono font-bold text-slate-300">
            {skinCondition === 'wet' ? 'WET SKIN (1328Ω)' : 'DRY SKIN (8280Ω)'}
          </span>
        </div>

        {/* Master Reset Button #2 (Always Visible & Prominent) */}
        <button
          type="button"
          onClick={handleResetDamage}
          className="py-1 px-2.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border-2 border-rose-500/80 hover:border-rose-400 font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
          title="Master Reset all inputs, outputs, and body twin diagram to baseline state"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
          <span>MASTER RESET</span>
        </button>
      </div>

      <div className="relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden p-1 sm:p-2">
        <div
          className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              skinCondition === 'wet'
                ? 'radial-gradient(ellipse at 50% 40%, rgba(6, 182, 212, 0.35) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 80%)'
                : 'radial-gradient(ellipse at 50% 40%, rgba(249, 115, 22, 0.25) 0%, rgba(245, 158, 11, 0.1) 50%, transparent 80%)'
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03] pointer-events-none" />

        <div className="relative z-10 w-full h-full min-h-0 flex items-center justify-center">
          <svg
            viewBox="0 0 700 500"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full max-h-none drop-shadow-[0_0_15px_rgba(56,189,248,0.25)] overflow-visible shrink-0"
          >
            <defs>
              <filter id="particleGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g transform="translate(150, 0)">
              <motion.g
                animate={
                  isAnimating && hasDamage
                    ? { x: [-3, 3, -4, 4, -2, 2, 0], y: [-2, 2, -3, 3, -1, 1, 0] }
                    : {}
                }
                transition={{ duration: 0.08, repeat: isAnimating && hasDamage ? Infinity : 0, ease: 'linear' }}
              >
                <path
                  d={bodySilhouette}
                  fill={
                    !hasDamage
                      ? 'rgba(56, 189, 248, 0.18)'
                      : activeIntensity > 0.7
                      ? 'rgba(239, 68, 68, 0.45)'
                      : activeIntensity > 0.4
                      ? 'rgba(249, 115, 22, 0.45)'
                      : 'rgba(234, 179, 8, 0.45)'
                  }
                  stroke={!hasDamage ? '#38bdf8' : activeIntensity > 0.7 ? '#ef4444' : activeIntensity > 0.4 ? '#f97316' : '#facc15'}
                  strokeWidth={!hasDamage ? '2.5' : '3.5'}
                  style={{
                    filter: !hasDamage
                      ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.7))'
                      : activeIntensity > 0.7
                      ? 'drop-shadow(0 0 22px #ef4444)'
                      : 'drop-shadow(0 0 22px #f97316)'
                  }}
                  className="transition-all duration-300"
                />

                <g className="transition-all duration-300">
                  <path d={brainPath} fill={!hasDamage ? 'rgba(56, 189, 248, 0.35)' : 'rgba(249, 115, 22, 0.35)'} stroke="#38bdf8" strokeWidth="1.5" />
                  <path d={leftLung} fill={!hasDamage ? 'rgba(56, 189, 248, 0.3)' : 'rgba(249, 115, 22, 0.3)'} stroke="#38bdf8" strokeWidth="1.5" />
                  <path d={rightLung} fill={!hasDamage ? 'rgba(56, 189, 248, 0.3)' : 'rgba(249, 115, 22, 0.3)'} stroke="#38bdf8" strokeWidth="1.5" />

                  <motion.path
                    d={heartAnatomical}
                    fill={hasDamage && activeMA >= 0.5 ? '#ef4444' : 'rgba(56, 189, 248, 0.5)'}
                    stroke={hasDamage && activeMA >= 0.5 ? '#f87171' : '#38bdf8'}
                    strokeWidth="2.5"
                    animate={{ scale: isAnimating ? [1, 1.25, 0.9, 1.2, 1] : [1, 1.05, 1] }}
                    transition={{ duration: isAnimating ? 0.2 : 0.8, repeat: Infinity }}
                  />
                </g>
              </motion.g>

              {/* Animated Current Path & Arc Particles */}
              {isAnimating && (
                <g>
                  <path
                    d={activePath === 'hand-to-hand' ? pathHandToHand : pathHandToFoot}
                    stroke={pathColor}
                    strokeWidth="4"
                    fill="none"
                    filter="url(#particleGlow)"
                  />
                  <path
                    d={activePath === 'hand-to-hand' ? pathHandToHand : pathHandToFoot}
                    stroke="#ffffff"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d={activePath === 'hand-to-hand' ? pathHandToHand : pathHandToFoot}
                    stroke={pathColor}
                    strokeWidth="3.5"
                    strokeDasharray="6 6"
                    fill="none"
                    className="animate-pulse"
                  />
                  <circle r="4" fill={pathColor}>
                    <animateMotion
                      path={activePath === 'hand-to-hand' ? pathHandToHand : pathHandToFoot}
                      dur={`${Math.max(0.3, 1.5 - activeMA / 100)}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )}

              {hasDamage && activeMA >= 50 && (
                <g>
                  {/* Entry & Exit Burn Marks */}
                  <circle cx="128" cy="250" r="7" fill="#1c1917" stroke="#ef4444" strokeWidth="2.5" />
                  <circle cx={activePath === 'hand-to-hand' ? '272' : '235'} cy={activePath === 'hand-to-hand' ? '250' : '475'} r="7" fill="#1c1917" stroke="#ef4444" strokeWidth="2.5" />
                  
                  {/* Hand Entry Smoke */}
                  <g transform="translate(128, 240)">
                    <motion.path
                      d="M 0,0 Q -4,-10 0,-20 Q 4,-30 0,-40"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      animate={{ y: [-5, -25], opacity: [0.8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    />
                  </g>

                  {/* Foot/Toe Exit Crater Ring & Grounding Arc Sparks */}
                  {activePath === 'hand-to-foot' && (
                    <g transform="translate(235, 475)">
                      <circle r="11" fill="rgba(220, 38, 38, 0.25)" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" className="animate-spin" />
                      <circle r="4" fill="#dc2626" />
                      <motion.path
                        d="M 0,0 L 5,12 M 0,0 L -6,10 M 0,0 L 2,15"
                        stroke="#facc15"
                        strokeWidth="2"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 0.2, repeat: Infinity }}
                      />
                    </g>
                  )}
                </g>
              )}
            </g>

            {calloutChips.map((chip) => (
              <g key={chip.id}>
                <line
                  x1={chip.side === 'left' ? 220 : 470}
                  y1={chip.chipY + 40}
                  x2={chip.targetX}
                  y2={chip.targetY}
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <circle cx={chip.targetX} cy={chip.targetY} r="4" fill="#f43f5e" />

                <foreignObject
                  x={chip.chipX}
                  y={chip.chipY}
                  width="220"
                  height="90"
                  className="overflow-visible"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className={cn(
                      'p-3 rounded-2xl border-3 shadow-2xl flex flex-col justify-center text-left backdrop-blur-2xl bg-slate-950/98',
                      chip.badgeClass
                    )}
                  >
                    <span className="font-sans font-black uppercase text-xs sm:text-sm tracking-wider leading-tight drop-shadow">
                      {chip.title}
                    </span>
                    <span className="text-[11px] sm:text-xs font-sans font-bold leading-snug mt-1 opacity-95">
                      {chip.subtitle}
                    </span>
                  </motion.div>
                </foreignObject>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
