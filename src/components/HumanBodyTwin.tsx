import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ShieldCheck, Heart, Activity, AlertOctagon, Flame, Skull } from 'lucide-react';
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
  compareLabel?: string;
  isCompactDual?: boolean;
}

export const HumanBodyTwin: React.FC<HumanBodyTwinProps> = ({
  shockPath,
  intensity,
  currentMA,
  durationMs,
  isAnimating,
  profile,
  isPPESafe,
  activePPENames = [],
  onMasterReset,
  compareLabel,
  isCompactDual = false
}) => {
  const skinCondition = (profile && typeof profile === 'object' && (profile as any)?.skinCondition) || 'dry';

  const [persistentDamage, setPersistentDamage] = useState<{
    maxMA: number;
    maxDuration: number;
    worstPath: ShockPath;
    active: boolean;
  }>({ maxMA: 0, maxDuration: 0, worstPath: 'hand-to-foot', active: false });

  // Reset persistent damage if duration resets to 0 and not animating
  useEffect(() => {
    if (durationMs === 0 && !isAnimating) {
      setPersistentDamage({ maxMA: 0, maxDuration: 0, worstPath: 'hand-to-foot', active: false });
    }
  }, [durationMs, isAnimating]);

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

  const activeMA = isPPESafe ? 0 : persistentDamage.active ? Math.max(currentMA, persistentDamage.maxMA) : currentMA;
  const activeIntensity = isPPESafe ? 0 : persistentDamage.active ? Math.min(activeMA / 100, 1.0) : intensity;
  const activePath = persistentDamage.active ? persistentDamage.worstPath : shockPath;
  const hasDamage = !isPPESafe && (persistentDamage.active || (isAnimating && currentMA > 0.5));

  // Dynamic animation speed (higher mA = much faster stroke-dash flow)
  const animSpeedSec = useMemo(() => {
    if (!isAnimating || activeMA <= 0.1 || isPPESafe) return 1.5;
    const speed = 1.3 / Math.pow(Math.max(activeMA, 0.4) / 2.8, 0.68);
    return Math.max(0.06, Math.min(1.8, speed)).toFixed(3);
  }, [isAnimating, activeMA, isPPESafe]);

  // Dynamic glow color and intensity
  const glowStyle = useMemo(() => {
    if (!isAnimating || isPPESafe) {
      return {
        glowColor: isPPESafe ? '#10b981' : '#38bdf8',
        coreColor: isPPESafe ? '#a7f3d0' : '#7dd3fc',
        dropShadow: isPPESafe ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' : 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.4))',
        haloWidth: 4,
        beamWidth: 2.5
      };
    }
    const glowRadius = Math.min(48, Math.max(8, Math.round(activeMA * 0.38 + 6)));
    let glowColor = '#38bdf8';
    let coreColor = '#bae6fd';

    if (activeMA >= 100) {
      glowColor = '#ff0037';
      coreColor = '#ffffff';
    } else if (activeMA >= 50) {
      glowColor = '#ef4444';
      coreColor = '#fee2e2';
    } else if (activeMA >= 10) {
      glowColor = '#f97316';
      coreColor = '#ffedd5';
    } else if (activeMA >= 0.5) {
      glowColor = '#facc15';
      coreColor = '#fef08a';
    }

    const dropShadow = `drop-shadow(0 0 ${glowRadius}px ${glowColor}) drop-shadow(0 0 ${Math.round(glowRadius * 1.8)}px ${glowColor}) drop-shadow(0 0 ${Math.max(2, Math.round(glowRadius * 0.3))}px #ffffff)`;

    return {
      glowColor,
      coreColor,
      dropShadow,
      haloWidth: Math.min(18, 6 + activeMA * 0.04),
      beamWidth: Math.min(6.5, 3.5 + activeMA * 0.015)
    };
  }, [isAnimating, activeMA, isPPESafe]);

  // Clean Layered Anatomical SVG Silhouette (Natural Human Proportions, centered at X=200 in a 400x500 box)
  const anatomicalBodySilhouette = `
    M 200 18
    C 214 18, 226 28, 226 44
    C 226 58, 218 70, 212 78
    L 214 90
    C 224 93, 242 100, 252 112
    C 262 124, 270 148, 274 180
    C 278 208, 284 238, 286 265
    C 288 278, 280 286, 274 286
    C 268 286, 262 276, 260 260
    C 256 230, 252 195, 244 165
    L 236 165
    C 234 195, 230 225, 226 250
    C 232 260, 240 285, 242 315
    C 244 345, 246 380, 248 410
    C 250 435, 254 465, 258 480
    C 260 488, 244 492, 240 488
    C 236 480, 232 450, 230 420
    C 226 380, 222 330, 206 285
    L 200 280
    L 194 285
    C 178 330, 174 380, 170 420
    C 168 450, 164 480, 160 488
    C 156 492, 140 488, 142 480
    C 146 465, 150 435, 152 410
    C 154 380, 156 345, 158 315
    C 160 285, 168 260, 174 250
    C 170 225, 166 195, 164 165
    L 156 165
    C 148 195, 144 230, 140 260
    C 138 276, 132 286, 126 286
    C 120 286, 112 278, 114 265
    C 116 238, 122 208, 126 180
    C 130 148, 138 124, 148 112
    C 158 100, 176 93, 186 90
    L 188 78
    C 182 70, 174 58, 174 44
    C 174 28, 186 18, 200 18 Z
  `;

  // Skeletal & Ribcage Infrastructure
  const skeletalInfrastructure = {
    cranium: "M 184 44 C 184 32, 216 32, 216 44 C 216 56, 184 56, 184 44 Z",
    spine: "M 200 88 L 200 274",
    clavicles: "M 197 102 C 180 100, 165 108, 154 114 M 203 102 C 220 100, 235 108, 246 114",
    sternum: "M 200 104 L 200 162",
    ribs: [
      "M 197 114 C 182 112, 172 120, 174 130 M 203 114 C 218 112, 228 120, 226 130",
      "M 197 126 C 178 124, 168 134, 170 144 M 203 126 C 222 124, 232 134, 230 144",
      "M 197 138 C 176 138, 168 148, 171 158 M 203 138 C 224 138, 232 148, 229 158",
      "M 197 150 C 178 152, 170 162, 173 172 M 203 150 C 222 152, 230 162, 227 172"
    ],
    pelvis: "M 178 244 C 188 238, 196 250, 200 254 C 204 250, 212 238, 222 244 C 226 260, 218 274, 208 276 C 203 277, 197 277, 192 276 C 182 274, 174 260, 178 244 Z"
  };

  // Vital Internal Organs
  const organBrain = "M 186 42 C 184 30, 216 30, 214 42 C 216 54, 184 54, 186 42 Z";
  const organLeftLung = "M 174 112 C 166 122, 165 150, 178 162 C 188 158, 192 144, 188 120 Z";
  const organRightLung = "M 226 112 C 234 122, 235 150, 222 162 C 212 158, 208 144, 212 120 Z";
  const organHeart = "M 196 130 C 186 122, 180 138, 194 154 C 208 138, 206 122, 196 130 Z";
  const organAorta = "M 197 126 C 197 118, 205 116, 207 122 L 207 128";

  // Dedicated Anatomical Current Paths
  const pathHandToHand = "M 124 270 C 122 230, 134 185, 148 145 C 158 120, 178 114, 196 138 C 214 114, 234 120, 244 145 C 258 185, 270 230, 276 270";
  const pathHandToFoot = "M 124 270 C 122 230, 134 185, 148 145 C 158 120, 178 114, 196 138 C 202 165, 198 215, 202 260 C 206 295, 220 340, 230 395 C 238 435, 246 465, 250 484";

  const currentPathString = activePath === 'hand-to-hand' ? pathHandToHand : pathHandToFoot;

  // Left Column Compact Telemetry Chips (Visual-First, Zero Paragraphs)
  const leftAlerts = useMemo(() => {
    if (isPPESafe || !hasDamage || activeMA < 0.5) return [];
    const list = [];

    if (activeMA >= 0.5 && activeMA < 10) {
      list.push({
        id: 'tingle',
        icon: <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />,
        title: 'TINGLE PERCEPTION',
        metric: `${activeMA.toFixed(1)} mA`,
        tag: 'ZONE AC-2',
        detail: 'Sensory threshold (IEC 60479-1 §5.2)',
        badgeClass: 'bg-slate-900/95 border-yellow-500/60 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
      });
    }

    if (activeMA >= 10) {
      list.push({
        id: 'letgo',
        icon: <AlertOctagon className="w-3.5 h-3.5 text-orange-400 shrink-0 animate-pulse" />,
        title: 'TETANY LOCK',
        metric: `${activeMA.toFixed(1)} mA > 10mA`,
        tag: 'LET-GO FAILED',
        detail: 'Forearm flexors seized; grip locked to conductor',
        badgeClass: 'bg-orange-950/90 border-orange-500 text-orange-200 shadow-[0_0_18px_rgba(249,115,22,0.35)] ring-1 ring-orange-400/50'
      });
    }

    if (activeMA >= 100) {
      list.push({
        id: 'burns',
        icon: <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />,
        title: 'ARC PUNCTURE',
        metric: `JOULE HEATING`,
        tag: 'STRATUM CORNEUM',
        detail: 'Skin puncture & subcutaneous thermal necrosis',
        badgeClass: 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.35)]'
      });
    }

    return list;
  }, [isPPESafe, hasDamage, activeMA]);

  // Right Column Compact Telemetry Chips (Visual-First, Zero Paragraphs)
  const rightAlerts = useMemo(() => {
    if (isPPESafe || !hasDamage || activeMA < 0.5) return [];
    const list = [];

    if (activeMA >= 20) {
      list.push({
        id: 'respiratory',
        icon: <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />,
        title: 'CHEST TETANY',
        metric: 'RESPIRATORY SPASM',
        tag: 'ASPHYXIA RISK',
        detail: 'Intercostal muscle cramp blocks respiration',
        badgeClass: 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.3)]'
      });
    }

    if (activeMA >= 50) {
      list.push({
        id: 'vfib',
        icon: <Skull className="w-3.5 h-3.5 text-red-400 shrink-0 animate-bounce" />,
        title: 'CARDIAC V-FIB',
        metric: 'FATAL ARREST',
        tag: 'ZONE AC-4',
        detail: 'Ventricular fibrillation; heart stops pumping blood',
        badgeClass: 'bg-red-950/95 border-red-500 text-white font-black animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.7)] ring-2 ring-red-500'
      });
    }

    if (activePath === 'hand-to-foot' && activeMA >= 50) {
      list.push({
        id: 'toe_exit_burn',
        icon: <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
        title: 'GROUND EXIT',
        metric: 'PLANTAR ARC',
        tag: 'EARTH EXIT',
        detail: 'Current arcs through sole into ground plane',
        badgeClass: 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-[0_0_18px_rgba(239,68,68,0.4)]'
      });
    }

    return list;
  }, [isPPESafe, hasDamage, activeMA, activePath]);

  return (
    <div className="relative flex flex-col w-full h-full min-h-0 flex-1 bg-slate-950/95 rounded-2xl border border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl select-none">
      {/* Dynamic CSS Keyframe Styles for SVG Flow Animations */}
      <style>{`
        @keyframes shockCurrentFlow {
          0% {
            stroke-dashoffset: 160;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes shockSparksMotion {
          0% {
            stroke-dashoffset: 80;
          }
          100% {
            stroke-dashoffset: -80;
          }
        }
      `}</style>

      {/* Header Bar with Live Status & Telemetry (Single Unified Architecture) */}
      <div className="w-full bg-slate-900/95 border-b border-slate-800 py-1 px-2 flex items-center justify-between gap-1 z-20 shrink-0 min-h-[34px]">
        {compareLabel && (
          <span className={cn(
            "px-2 py-0.5 text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider rounded border font-mono shrink-0 shadow-sm",
            isPPESafe
              ? "bg-emerald-950 text-emerald-300 border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              : "bg-red-950 text-red-200 border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse"
          )}>
            {compareLabel}
          </span>
        )}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span
            className={cn(
              'px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded border shadow-sm flex items-center gap-1 transition-all whitespace-nowrap',
              isPPESafe
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : isAnimating
                ? 'bg-red-950/90 text-red-300 border-red-500/80 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            )}
          >
            {isPPESafe ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                PROTECTED (0 mA)
              </>
            ) : isAnimating ? (
              <>
                <Zap className="w-3 h-3 text-red-400 fill-current animate-bounce" />
                SHOCK ({activeMA.toFixed(1)} mA)
              </>
            ) : (
              'MONITOR'
            )}
          </span>
          {!isCompactDual && (
            <>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-300">
                {skinCondition === 'wet' ? 'WET (1328Ω)' : 'DRY (8280Ω)'}
              </span>
              <span className="text-[8.5px] sm:text-[9px] font-mono text-cyan-400/90 bg-cyan-950/40 px-1 py-0.2 rounded border border-cyan-800/40">
                {activePath === 'hand-to-hand' ? 'H-H' : 'H-F'}
              </span>
            </>
          )}
        </div>

        {/* Right Header: Dynamic Condition Indicator */}
        <div className="flex items-center gap-1 shrink-0">
          {isPPESafe ? (
            <span className="text-[9px] sm:text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded border border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              SAFE
            </span>
          ) : hasDamage ? (
            <span className="text-[9px] sm:text-[10px] font-mono font-black text-rose-300 bg-rose-950/80 px-2 py-0.2 rounded border border-rose-500/70 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]">
              INJURY
            </span>
          ) : (
            <span className="text-[9px] font-mono text-slate-400">
              OK
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden p-1 sm:p-2">
        {/* Ambient Medical Grid & Fluid Lighting Backdrop */}
        <div
          className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
          style={{
            background: isPPESafe
              ? 'radial-gradient(ellipse at 50% 40%, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 50%, transparent 80%)'
              : skinCondition === 'wet'
              ? 'radial-gradient(ellipse at 50% 40%, rgba(6, 182, 212, 0.3) 0%, rgba(14, 165, 233, 0.12) 50%, transparent 80%)'
              : 'radial-gradient(ellipse at 50% 40%, rgba(249, 115, 22, 0.22) 0%, rgba(245, 158, 11, 0.08) 50%, transparent 80%)'
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.04] pointer-events-none" />

        {/* ========================================================================= */}
        {/* LEFT COLUMN: Compact Visual Telemetry Chips (No Bulky Paragraphs) */}
        {/* ========================================================================= */}
        <div className={cn(
          "absolute left-0.5 sm:left-1 top-1 bottom-1 z-30 flex flex-col justify-around pointer-events-none",
          isCompactDual ? "w-[70px] sm:w-[82px]" : "w-[112px] sm:w-[126px] md:w-[136px]"
        )}>
          <AnimatePresence>
            {(isCompactDual ? leftAlerts.slice(0, 2) : leftAlerts).map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -14, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -14, scale: 0.92 }}
                transition={{ duration: 0.16 }}
                title={alert.detail}
                className={cn(
                  isCompactDual ? 'p-1 rounded-lg' : 'p-1.5 sm:p-2 rounded-xl',
                  'border shadow-[0_4px_16px_rgba(0,0,0,0.7)] backdrop-blur-2xl pointer-events-auto flex flex-col text-left cursor-help transition-transform hover:scale-105',
                  alert.badgeClass
                )}
              >
                <div className={cn(
                  "flex items-center justify-between gap-0.5 font-mono font-black uppercase tracking-wider leading-none",
                  isCompactDual ? "text-[7.5px]" : "text-[9px] sm:text-[9.5px]"
                )}>
                  <div className="flex items-center gap-1 min-w-0">
                    {alert.icon}
                    <span className="truncate">{alert.title}</span>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center justify-between gap-0.5 font-mono font-bold mt-0.5 text-slate-200",
                  isCompactDual ? "text-[6.5px]" : "text-[8px] sm:text-[8.5px]"
                )}>
                  <span className="truncate">{alert.metric}</span>
                  <span className={cn(
                    "px-0.5 rounded bg-black/50 border border-white/10 font-bold shrink-0",
                    isCompactDual ? "text-[6px]" : "text-[7.5px]"
                  )}>{alert.tag}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Compact Visual Telemetry Chips (No Bulky Paragraphs) */}
        {/* ========================================================================= */}
        <div className={cn(
          "absolute right-0.5 sm:right-1 top-1 bottom-1 z-30 flex flex-col justify-around pointer-events-none",
          isCompactDual ? "w-[70px] sm:w-[82px]" : "w-[112px] sm:w-[126px] md:w-[136px]"
        )}>
          <AnimatePresence>
            {(isCompactDual ? rightAlerts.slice(0, 2) : rightAlerts).map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 14, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 14, scale: 0.92 }}
                transition={{ duration: 0.16 }}
                title={alert.detail}
                className={cn(
                  isCompactDual ? 'p-1 rounded-lg' : 'p-1.5 sm:p-2 rounded-xl',
                  'border shadow-[0_4px_16px_rgba(0,0,0,0.7)] backdrop-blur-2xl pointer-events-auto flex flex-col text-left cursor-help transition-transform hover:scale-105',
                  alert.badgeClass
                )}
              >
                <div className={cn(
                  "flex items-center justify-between gap-0.5 font-mono font-black uppercase tracking-wider leading-none",
                  isCompactDual ? "text-[7.5px]" : "text-[9px] sm:text-[9.5px]"
                )}>
                  <div className="flex items-center gap-1 min-w-0">
                    {alert.icon}
                    <span className="truncate">{alert.title}</span>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center justify-between gap-0.5 font-mono font-bold mt-0.5 text-slate-200",
                  isCompactDual ? "text-[6.5px]" : "text-[8px] sm:text-[8.5px]"
                )}>
                  <span className="truncate">{alert.metric}</span>
                  <span className={cn(
                    "px-0.5 rounded bg-black/50 border border-white/10 font-bold shrink-0",
                    isCompactDual ? "text-[6px]" : "text-[7.5px]"
                  )}>{alert.tag}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Main Anatomical Twin Canvas (Centered Clean Body Silhouette) */}
        <div className="relative z-10 w-full h-full min-h-0 flex items-center justify-center">
          <svg
            viewBox="0 0 400 500"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full max-h-none drop-shadow-[0_0_20px_rgba(56,189,248,0.2)] overflow-visible shrink-0"
          >
            <defs>
              {/* Dynamic Plasma Glow Filter */}
              <filter id="twinPlasmaGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Organ Subtle Shadow */}
              <filter id="organGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Linear Gradient for Body Fill */}
              <linearGradient id="bodySkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity={hasDamage ? 0.35 : 0.18} />
                <stop offset="50%" stopColor="#0369a1" stopOpacity={hasDamage ? 0.25 : 0.12} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.45" />
              </linearGradient>

              {/* Trauma Damage Gradient */}
              <linearGradient id="traumaBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#b91c1c" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.2" />
              </linearGradient>

              {/* PPE Safe Glow Gradient */}
              <linearGradient id="ppeSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#059669" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#064e3b" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Anatomical Human Body Group */}
            <g transform="translate(0, 0)">
              <motion.g
                animate={
                  isAnimating && hasDamage && !isPPESafe
                    ? {
                        x: activeMA >= 20 ? [-2.5, 2.5, -3, 3, -1.5, 1.5, 0] : [-1, 1, -1, 1, 0],
                        y: activeMA >= 20 ? [-1.5, 1.5, -2, 2, -1, 1, 0] : [-0.5, 0.5, 0]
                      }
                    : {}
                }
                transition={{
                  duration: activeMA >= 50 ? 0.06 : 0.1,
                  repeat: isAnimating && hasDamage ? Infinity : 0,
                  ease: 'linear'
                }}
              >
                {/* 1. LAYER: Outer Anatomical Body Silhouette */}
                <path
                  d={anatomicalBodySilhouette}
                  fill={
                    isPPESafe
                      ? 'url(#ppeSkinGradient)'
                      : !hasDamage
                      ? 'url(#bodySkinGradient)'
                      : activeIntensity > 0.7
                      ? 'url(#traumaBodyGradient)'
                      : activeIntensity > 0.4
                      ? 'rgba(249, 115, 22, 0.28)'
                      : 'rgba(234, 179, 8, 0.22)'
                  }
                  stroke={
                    isPPESafe
                      ? '#10b981'
                      : !hasDamage
                      ? '#38bdf8'
                      : activeIntensity > 0.7
                      ? '#ef4444'
                      : activeIntensity > 0.4
                      ? '#f97316'
                      : '#facc15'
                  }
                  strokeWidth={hasDamage ? '2.8' : '2.0'}
                  style={{
                    filter: isPPESafe
                      ? 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))'
                      : !hasDamage
                      ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.5))'
                      : activeIntensity > 0.7
                      ? 'drop-shadow(0 0 24px #ef4444)'
                      : 'drop-shadow(0 0 18px #f97316)'
                  }}
                  className="transition-all duration-300"
                />

                {/* 2. LAYER: Skeletal Structure & Tech-Anatomy Blueprint */}
                <g opacity={isPPESafe ? 0.4 : hasDamage ? 0.45 : 0.3} stroke={isPPESafe ? '#10b981' : '#38bdf8'} fill="none" className="transition-opacity">
                  <path d={skeletalInfrastructure.cranium} strokeWidth="1.2" strokeDasharray="3 2" />
                  <path d={skeletalInfrastructure.spine} strokeWidth="2.5" strokeDasharray="4 3" stroke={isPPESafe ? '#6ee7b7' : '#7dd3fc'} />
                  <path d={skeletalInfrastructure.clavicles} strokeWidth="1.8" />
                  <path d={skeletalInfrastructure.sternum} strokeWidth="2.2" stroke={isPPESafe ? '#a7f3d0' : '#bae6fd'} />
                  {skeletalInfrastructure.ribs.map((ribPath, i) => (
                    <path key={`rib-${i}`} d={ribPath} strokeWidth="1.2" />
                  ))}
                  <path d={skeletalInfrastructure.pelvis} strokeWidth="1.6" strokeDasharray="5 2" />
                </g>

                {/* 3. LAYER: Vital Organs */}
                <g className="transition-all duration-300">
                  <path
                    d={organBrain}
                    fill={isPPESafe ? 'rgba(16, 185, 129, 0.3)' : !hasDamage ? 'rgba(56, 189, 248, 0.3)' : 'rgba(249, 115, 22, 0.4)'}
                    stroke={isPPESafe ? '#10b981' : !hasDamage ? '#38bdf8' : '#fb923c'}
                    strokeWidth="1.4"
                    filter="url(#organGlow)"
                  />
                  <path
                    d="M 192 36 Q 200 32 208 36 M 190 44 Q 200 48 210 42 M 200 28 L 200 48"
                    stroke={isPPESafe ? 'rgba(16, 185, 129, 0.6)' : !hasDamage ? 'rgba(56, 189, 248, 0.6)' : 'rgba(251, 146, 60, 0.7)'}
                    strokeWidth="1.0"
                    fill="none"
                  />

                  {/* Lungs */}
                  <path
                    d={organLeftLung}
                    fill={
                      !isPPESafe && activeMA >= 20 && isAnimating
                        ? 'rgba(239, 68, 68, 0.45)'
                        : isPPESafe
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(56, 189, 248, 0.22)'
                    }
                    stroke={!isPPESafe && activeMA >= 20 && isAnimating ? '#ef4444' : isPPESafe ? '#10b981' : '#38bdf8'}
                    strokeWidth="1.5"
                    filter="url(#organGlow)"
                  />
                  <path
                    d={organRightLung}
                    fill={
                      !isPPESafe && activeMA >= 20 && isAnimating
                        ? 'rgba(239, 68, 68, 0.45)'
                        : isPPESafe
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(56, 189, 248, 0.22)'
                    }
                    stroke={!isPPESafe && activeMA >= 20 && isAnimating ? '#ef4444' : isPPESafe ? '#10b981' : '#38bdf8'}
                    strokeWidth="1.5"
                    filter="url(#organGlow)"
                  />

                  {/* Aortic Arch */}
                  <path d={organAorta} stroke={isPPESafe ? '#34d399' : '#f87171'} strokeWidth="2.5" fill="none" />

                  {/* Heart */}
                  <g transform="translate(196, 138)">
                    <motion.path
                      d="M 0 -8 C -10 -16, -16 0, -2 16 C 12 0, 10 -16, 0 -8 Z"
                      fill={isPPESafe ? '#10b981' : hasDamage && activeMA >= 0.5 ? '#ef4444' : 'rgba(56, 189, 248, 0.6)'}
                      stroke={isPPESafe ? '#6ee7b7' : hasDamage && activeMA >= 0.5 ? '#fca5a5' : '#38bdf8'}
                      strokeWidth="2.2"
                      style={{
                        filter: isPPESafe
                          ? 'drop-shadow(0 0 8px #10b981)'
                          : hasDamage && activeMA >= 50
                          ? 'drop-shadow(0 0 12px #ff003c)'
                          : hasDamage
                          ? 'drop-shadow(0 0 6px #ef4444)'
                          : 'none'
                      }}
                      animate={
                        isAnimating && !isPPESafe
                          ? activeMA >= 50
                            ? {
                                scale: [1, 1.25, 0.85, 1.2, 0.9, 1],
                                x: [-2, 2, -3, 3, 0],
                                y: [-1, 1, -2, 2, 0]
                              }
                            : { scale: [1, 1.18, 0.95, 1] }
                          : { scale: [1, 1.06, 1] }
                      }
                      transition={{
                        duration: isAnimating && !isPPESafe ? (activeMA >= 50 ? 0.12 : 0.35) : 0.85,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  </g>
                </g>
              </motion.g>

              {/* 4. LAYER: Dedicated Hand-to-Hand & Hand-to-Foot Current Path Overlays */}
              {!isAnimating && !isPPESafe && (
                <path
                  d={currentPathString}
                  stroke="#0284c7"
                  strokeWidth="1.8"
                  strokeDasharray="6 6"
                  opacity="0.5"
                  fill="none"
                />
              )}

              {/* Active Energized High-Current Plasma Arc Flow (Only if NOT PPE Safe) */}
              {isAnimating && !isPPESafe && (
                <g>
                  {/* Layer A: Broad Diffused Corona Halo */}
                  <path
                    d={currentPathString}
                    stroke={glowStyle.glowColor}
                    strokeWidth={glowStyle.haloWidth}
                    opacity="0.45"
                    fill="none"
                    filter="url(#twinPlasmaGlow)"
                    style={{ filter: glowStyle.dropShadow }}
                  />

                  {/* Layer B: Flowing Segmented Energy Beam */}
                  <path
                    d={currentPathString}
                    stroke={glowStyle.glowColor}
                    strokeWidth={glowStyle.beamWidth}
                    strokeDasharray="16 10"
                    fill="none"
                    style={{
                      animation: `shockCurrentFlow ${animSpeedSec}s linear infinite`,
                      filter: glowStyle.dropShadow
                    }}
                  />

                  {/* Layer C: White-Hot Concentrated Core Beam */}
                  <path
                    d={currentPathString}
                    stroke={glowStyle.coreColor}
                    strokeWidth={Math.max(1.8, glowStyle.beamWidth * 0.45)}
                    strokeDasharray="8 14"
                    fill="none"
                    style={{
                      animation: `shockSparksMotion ${Math.max(0.05, Number(animSpeedSec) * 0.8).toFixed(3)}s linear infinite`
                    }}
                  />

                  {/* Layer D: Travelling Spark Node */}
                  <circle r={Math.min(6, 3 + activeMA * 0.02)} fill="#ffffff">
                    <animateMotion
                      path={currentPathString}
                      dur={`${animSpeedSec}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )}

              {/* 5. LAYER: Dielectric PPE Visual Gear Overlays */}
              {isPPESafe && (
                <g>
                  {/* Dielectric Insulating Gloves on Left & Right Hands */}
                  <g transform="translate(114, 255)">
                    <rect x="0" y="0" width="26" height="34" rx="6" fill="#047857" stroke="#34d399" strokeWidth="2" />
                    <circle cx="13" cy="17" r="4" fill="#a7f3d0" className="animate-pulse" />
                  </g>
                  <g transform="translate(260, 255)">
                    <rect x="0" y="0" width="26" height="34" rx="6" fill="#047857" stroke="#34d399" strokeWidth="2" />
                    <circle cx="13" cy="17" r="4" fill="#a7f3d0" className="animate-pulse" />
                  </g>

                  {/* Dielectric Safety Boots on Feet */}
                  <g transform="translate(138, 470)">
                    <rect x="0" y="0" width="28" height="20" rx="4" fill="#065f46" stroke="#34d399" strokeWidth="2" />
                  </g>
                  <g transform="translate(234, 470)">
                    <rect x="0" y="0" width="28" height="20" rx="4" fill="#065f46" stroke="#34d399" strokeWidth="2" />
                  </g>

                  {/* Protective Dielectric Shield Forcefield */}
                  <path
                    d="M 200 6 C 265 6, 295 90, 295 250 C 295 410, 260 500, 200 508 C 140 500, 105 410, 105 250 C 105 90, 135 6, 200 6 Z"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="8 6"
                    className="animate-pulse"
                    style={{ filter: 'drop-shadow(0 0 12px #10b981)' }}
                  />
                </g>
              )}

              {/* 6. LAYER: Contact Points, Entry/Exit Trauma & Ground Arcs (If NOT PPE Safe) */}
              {!isPPESafe && hasDamage && activeMA >= 10 && (
                <g>
                  <circle
                    cx="124"
                    cy="270"
                    r={activeMA >= 100 ? '9' : '6'}
                    fill="#18181b"
                    stroke={glowStyle.glowColor}
                    strokeWidth="2.5"
                  />
                  <circle cx="124" cy="270" r="3" fill="#ffffff" className="animate-ping" />

                  {/* Hand Entry Smoke */}
                  {activeMA >= 50 && (
                    <g transform="translate(124, 260)">
                      <motion.path
                        d="M 0,0 Q -4,-10 0,-20 Q 4,-30 0,-40"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        animate={{ y: [-5, -25], opacity: [0.8, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                      />
                    </g>
                  )}

                  {/* Right Hand Exit */}
                  {activePath === 'hand-to-hand' && (
                    <g>
                      <circle
                        cx="276"
                        cy="270"
                        r={activeMA >= 100 ? '9' : '6'}
                        fill="#18181b"
                        stroke={glowStyle.glowColor}
                        strokeWidth="2.5"
                      />
                      <circle cx="276" cy="270" r="3" fill="#ffffff" className="animate-ping" />
                    </g>
                  )}

                  {/* Foot Ground Exit */}
                  {activePath === 'hand-to-foot' && (
                    <g transform="translate(250, 484)">
                      <circle
                        r={activeMA >= 100 ? '14' : '9'}
                        fill="rgba(220, 38, 38, 0.2)"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        className="animate-spin"
                      />
                      <circle r="4.5" fill="#dc2626" />
                      {isAnimating && (
                        <motion.path
                          d="M 0,0 L 8,14 M 0,0 L -8,12 M 0,0 L 0,16 M 0,0 L -4,14 M 0,0 L 5,15"
                          stroke="#facc15"
                          strokeWidth="2"
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 0.15, repeat: Infinity }}
                        />
                      )}
                    </g>
                  )}
                </g>
              )}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};



