import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Flame, HeartPulse, Zap, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface BodyTwinProps {
  shockPath?: 'hand-to-hand' | 'hand-to-foot' | 'none';
  intensity?: number; // 0 to 1
  currentMA?: number;
  durationMs?: number;
  isAnimating?: boolean;
  profile?: string;
  isPPESafe?: boolean;
  activePPENames?: string[];
  skinCondition?: 'dry' | 'wet';
}

export function HumanBodyTwin({
  shockPath = 'none',
  intensity = 0,
  currentMA = 0,
  durationMs = 3000,
  isAnimating = false,
  profile = 'standard',
  isPPESafe = false,
  activePPENames = [],
  skinCondition = 'dry'
}: BodyTwinProps) {
  const [persistentDamage, setPersistentDamage] = useState<{
    active: boolean;
    intensity: number;
    shockPath: 'hand-to-hand' | 'hand-to-foot' | 'none';
    currentMA: number;
    durationMs: number;
  }>({ active: false, intensity: 0, shockPath: 'none', currentMA: 0, durationMs: 0 });

  const [recoverySeconds, setRecoverySeconds] = useState<number>(6);
  const prevAnimatingRef = useRef(isAnimating);
  const currentMaxIntensity = useRef(intensity);
  const currentMaxMA = useRef(currentMA);

  // Track max intensity during active shock
  useEffect(() => {
    if (isAnimating) {
      if (intensity > currentMaxIntensity.current) {
        currentMaxIntensity.current = intensity;
      }
      if (currentMA > currentMaxMA.current) {
        currentMaxMA.current = currentMA;
      }
    }
  }, [isAnimating, intensity, currentMA]);

  // Lock in persistent damage on shock completion
  useEffect(() => {
    if (prevAnimatingRef.current && !isAnimating) {
      const damageInt = currentMaxIntensity.current > 0 ? currentMaxIntensity.current : intensity;
      const damageMA = currentMaxMA.current > 0 ? currentMaxMA.current : currentMA;
      if (damageInt > 0 && !isPPESafe) {
        setPersistentDamage({
          active: true,
          intensity: damageInt,
          shockPath: shockPath,
          currentMA: damageMA,
          durationMs: durationMs
        });
        setRecoverySeconds(6);
      }
      currentMaxIntensity.current = 0;
      currentMaxMA.current = 0;
    } else if (!prevAnimatingRef.current && isAnimating) {
      setPersistentDamage({ active: false, intensity: 0, shockPath: 'none', currentMA: 0, durationMs: 0 });
      currentMaxIntensity.current = intensity;
      currentMaxMA.current = currentMA;
    }
    prevAnimatingRef.current = isAnimating;
  }, [isAnimating, intensity, currentMA, durationMs, isPPESafe, shockPath]);

  // 6-second recovery timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (persistentDamage.active && recoverySeconds > 0) {
      timer = setInterval(() => {
        setRecoverySeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [persistentDamage.active, recoverySeconds]);

  const handleResetDamage = () => {
    setPersistentDamage({ active: false, intensity: 0, shockPath: 'none', currentMA: 0, durationMs: 0 });
    setRecoverySeconds(0);
  };

  const activeIntensity = isAnimating ? intensity : (persistentDamage.active ? persistentDamage.intensity : 0);
  const activePath = isAnimating ? shockPath : (persistentDamage.active ? persistentDamage.shockPath : 'none');
  const activeMA = isAnimating ? currentMA : (persistentDamage.active ? persistentDamage.currentMA : 0);
  const hasDamage = isAnimating ? (intensity > 0 && !isPPESafe) : persistentDamage.active;

  // Heart Current Factor (F_H)
  const heartFactor = activePath === 'hand-to-foot' ? 1.0 : activePath === 'hand-to-hand' ? 0.4 : 0;
  const effectiveHeartCurrent = activeMA * heartFactor;

  // ECG Heart State Machine (Sinus, Artifact, V-Fib, Asystole)
  const ecgState = useMemo(() => {
    if (!hasDamage || activeMA < 0.5) return 'sinus';
    if (activeMA < 20) return 'artifact';
    if (activeMA < 100) return 'vfib';
    return 'asystole';
  }, [hasDamage, activeMA]);

  // Color grading by IEC zone
  const pathColor = activeMA > 20 ? '#ef4444' : activeMA > 0.5 ? '#f59e0b' : '#38bdf8';

  // Centered SVG Silhouette Geometry (ViewBox: 0 0 400 500, Center X = 200)
  const bodySilhouette = "M 200 15 C 212 15, 215 25, 215 35 C 215 45, 210 55, 208 60 C 215 62, 225 65, 235 68 C 245 70, 250 80, 255 100 C 258 120, 260 140, 262 160 C 265 190, 270 210, 272 230 C 275 240, 278 250, 272 255 C 268 260, 262 255, 262 245 C 260 230, 258 215, 255 200 C 245 150, 235 110, 230 90 C 230 110, 228 140, 226 170 C 228 200, 232 230, 232 250 C 234 290, 235 330, 232 370 C 230 400, 228 430, 232 450 C 238 460, 242 468, 235 475 C 225 478, 218 472, 215 460 C 212 430, 210 400, 208 370 C 205 320, 205 280, 205 250 C 202 245, 198 245, 195 250 C 195 280, 195 320, 192 370 C 190 400, 188 430, 185 460 C 182 472, 175 478, 165 475 C 158 468, 162 460, 168 450 C 172 430, 170 400, 168 370 C 165 330, 166 290, 168 250 C 168 230, 172 200, 174 170 C 172 140, 170 110, 170 90 C 165 110, 155 150, 145 200 C 142 215, 140 230, 138 245 C 138 255, 132 260, 128 255 C 122 250, 125 240, 128 230 C 130 210, 135 190, 138 160 C 140 140, 142 120, 145 100 C 150 80, 155 70, 165 68 C 175 65, 185 62, 192 60 C 190 55, 185 45, 185 35 C 185 25, 188 15, 200 15 Z";

  const brainPath = "M 200 18 C 208 18, 212 25, 210 32 C 212 38, 208 45, 200 48 C 192 45, 188 38, 190 32 C 188 25, 192 18, 200 18 Z";
  const leftLung = "M 196 85 C 196 78, 185 82, 180 95 C 175 110, 178 135, 186 140 C 194 145, 196 130, 196 120 Z";
  const rightLung = "M 204 85 C 204 78, 215 82, 220 95 C 225 110, 222 135, 214 140 C 206 145, 204 130, 204 120 Z";
  const heartAnatomical = "M 202 105 C 208 103, 214 108, 212 118 C 210 128, 205 135, 198 142 C 192 132, 190 125, 192 118 C 194 110, 198 105, 202 105 Z";

  const pathHandToHand = "M 128 250 Q 150 170 170 120 Q 200 130 230 120 Q 250 170 272 250";
  const pathHandToFoot = "M 128 250 Q 150 170 170 120 Q 200 130 204 130 Q 205 250 235 475";

  const calloutChips = useMemo(() => {
    if (!hasDamage || activeMA < 0.5) return [];

    const chips = [];

    if (activeMA >= 0.5) {
      chips.push({
        id: 'tingle',
        side: 'left',
        chipX: 10,
        chipY: 35,
        targetX: 150 + 175,
        targetY: 45,
        title: '⚡ MILD TINGLE (0.5mA+)',
        subtitle: 'Sensory threshold crossed. Nerve excitation.',
        badgeClass: 'bg-yellow-950/95 border-yellow-400 text-yellow-200'
      });
    }

    if (activeMA >= 20) {
      chips.push({
        id: 'respiratory',
        side: 'right',
        chipX: 480,
        chipY: 75,
        targetX: 150 + 220,
        targetY: 115,
        title: '🫁 CHEST SPASM (20mA+)',
        subtitle: 'Intercostal muscle paralysis. Breathing stops.',
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
        title: '✊ MUSCLE LOCK (10mA+)',
        subtitle: 'Flexor tetanization locks fingers to wire.',
        badgeClass: 'bg-orange-950/95 border-orange-400 text-amber-100'
      });
    }

    if (activeMA >= 50) {
      chips.push({
        id: 'vfib',
        side: 'right',
        chipX: 480,
        chipY: 220,
        targetX: 150 + 204,
        targetY: 130,
        title: '💔 V-FIB ARREST (50mA+)',
        subtitle: 'Lethal heart rhythm disruption. Fatal in seconds.',
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
        title: '🔥 TISSUE BURNS (100mA+)',
        subtitle: 'Charred skin entry mark & internal heat trauma.',
        badgeClass: 'bg-rose-950/95 border-rose-400 text-rose-100'
      });
    }

    return chips;
  }, [hasDamage, activeMA]);

  return (
    <div className="relative flex flex-col w-full h-full min-h-[360px] bg-slate-950/95 rounded-2xl border border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl select-none">
      <div className="w-full bg-slate-900/95 border-b border-slate-800 py-0.5 px-2 flex items-center justify-between gap-2 z-20 shrink-0 min-h-[28px]">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider rounded border shadow-sm flex items-center gap-1 transition-all whitespace-nowrap',
              isAnimating
                ? 'bg-amber-950/90 text-amber-300 border-amber-500/80 animate-pulse'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
            )}
          >
            {isAnimating ? '⚡ SHOCK IN PROGRESS' : 'STANDBY MODE'}
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            {skinCondition === 'wet' ? 'WET SKIN (1328Ω)' : 'DRY SKIN (8280Ω)'}
          </span>
        </div>

        {persistentDamage.active && (
          <button
            type="button"
            onClick={handleResetDamage}
            className="py-0.5 px-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-sky-400/60 font-black text-[9px] uppercase tracking-wider rounded shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <RotateCcw className="w-2.5 h-2.5 text-sky-400" />
            <span>RESET TWIN</span>
          </button>
        )}
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
                    animate={
                      ecgState === 'asystole'
                        ? { scale: 1 }
                        : ecgState === 'vfib'
                        ? { scale: [1, 1.25, 0.9, 1.2, 1], rotate: [-4, 4, -3, 3, 0] }
                        : ecgState === 'artifact'
                        ? { scale: [1, 1.15, 1] }
                        : { scale: [1, 1.08, 1] }
                    }
                    transition={{
                      duration: ecgState === 'vfib' ? 0.15 : ecgState === 'artifact' ? 0.4 : 0.8,
                      repeat: ecgState === 'asystole' ? 0 : Infinity
                    }}
                    style={{ transformOrigin: '200px 125px' }}
                  />
                </g>
              </motion.g>

              {isAnimating && activePath !== 'none' && (
                <g filter="url(#particleGlow)">
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

              {hasDamage && activeMA >= 100 && (
                <g>
                  <circle cx="128" cy="250" r="7" fill="#1c1917" stroke="#f97316" strokeWidth="2.5" />
                  <circle cx={activePath === 'hand-to-hand' ? '272' : '235'} cy={activePath === 'hand-to-hand' ? '250' : '475'} r="7" fill="#1c1917" stroke="#f97316" strokeWidth="2.5" />
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
                </g>
              )}
            </g>

            {calloutChips.map((chip) => (
              <g key={chip.id}>
                <line
                  x1={chip.side === 'left' ? 220 : 480}
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
                  width="210"
                  height="85"
                  className="overflow-visible"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className={cn(
                      'p-3 sm:p-3.5 rounded-2xl border-3 shadow-2xl flex flex-col justify-center text-left backdrop-blur-2xl bg-slate-950/98',
                      chip.badgeClass
                    )}
                  >
                    <span className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wider leading-snug text-white drop-shadow-md">
                      {chip.title}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold leading-snug text-amber-100 opacity-95 mt-1 tracking-wide">
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
}
