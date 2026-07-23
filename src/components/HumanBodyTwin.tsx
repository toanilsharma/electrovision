import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InfoTooltip } from './InfoTooltip';
import { Activity, Flame, HeartPulse, Zap, RotateCcw } from 'lucide-react';
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
}

export function HumanBodyTwin({ shockPath = 'none', intensity = 0, currentMA = 0, durationMs = 3000, isAnimating = false, profile = 'standard', isPPESafe = false, activePPENames = [] }: BodyTwinProps) {
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

  // When shock finishes (isAnimating goes from true to false), lock in persistent damage
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
      // Starting new shock -> reset previous recovery state
      setPersistentDamage({ active: false, intensity: 0, shockPath: 'none', currentMA: 0, durationMs: 0 });
      currentMaxIntensity.current = intensity;
      currentMaxMA.current = currentMA;
    }
    prevAnimatingRef.current = isAnimating;
  }, [isAnimating, intensity, currentMA, durationMs, isPPESafe, shockPath]);

  // 6-second recovery timer countdown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (persistentDamage.active && recoverySeconds > 0) {
      timer = setInterval(() => {
        setRecoverySeconds(prev => Math.max(0, prev - 1));
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

  const getRecoveryPrognosis = (ma: number, duration: number) => {
    if (ma <= 0) return { timeText: "No Trauma", desc: "No current passed through the body." };
    if (ma < 10) return { timeText: "Recovery: 10 - 30 Minutes", desc: "Transient nerve stimulation & mild perception threshold." };
    if (ma < 50) return { timeText: "Recovery: 1 - 7 Days (Muscle Soreness & Rest)", desc: "Flexor muscle spasms, joint stiffness & rest required." };
    if (ma < 200) return { timeText: "Recovery: 1 - 3 Months (Nerve Therapy)", desc: "Respiratory spasm, peripheral neuropathy & nerve rehab." };
    if (ma < 1000) return { timeText: "Recovery: 6 - 12 Months (Cardiac Care)", desc: "Ventricular fibrillation arrhythmia & 2nd-degree burns." };
    return { timeText: "Recovery: Years & Multiple Surgeries / Permanent Damage", desc: "Severe 3rd-degree burns, multi-organ shock & surgical skin grafts." };
  };

  const activeIntensity = isAnimating ? intensity : (persistentDamage.active ? persistentDamage.intensity : 0);
  const activePath = isAnimating ? shockPath : (persistentDamage.active ? persistentDamage.shockPath : 'none');
  const activeMA = isAnimating ? currentMA : (persistentDamage.active ? persistentDamage.currentMA : 0);
  const activeDuration = isAnimating ? durationMs : (persistentDamage.active ? persistentDamage.durationMs : 0);
  const hasDamage = isAnimating ? (intensity > 0 && !isPPESafe) : persistentDamage.active;

  const prognosis = getRecoveryPrognosis(activeMA, activeDuration);

  const organColor = !hasDamage ? "rgba(56, 189, 248, 0.15)" : (activeIntensity > 0.7 ? "rgba(239, 68, 68, 0.4)" : "rgba(249, 115, 22, 0.3)");
  const organStroke = !hasDamage ? "rgba(56, 189, 248, 0.4)" : (activeIntensity > 0.7 ? "rgba(239, 68, 68, 0.8)" : "rgba(249, 115, 22, 0.6)");

  const getEffects = (int: number) => {
    if (!hasDamage || int === 0) return [];
    const effects = [];
    if (int >= 0.1) effects.push({ id: 'perception', label: 'Sensory Perception', desc: 'Mild tingling sensation at the points of contact. Current is above the perception threshold of ~0.5mA.', top: '15%', left: '5%', color: 'text-yellow-400', border: 'border-yellow-500/30' });
    if (int >= 0.4) effects.push({ id: 'tetanization', label: 'Muscle Tetanization', desc: 'Involuntary muscle contractions occur, making it impossible to let go of the energized conductor (Let-go threshold ~10mA).', top: '35%', left: '0%', color: 'text-orange-500', border: 'border-orange-500/30' });
    if (int >= 0.6) effects.push({ id: 'respiratory', label: 'Respiratory Paralysis', desc: 'Current passing through the chest causes the diaphragm muscles to spasm, preventing breathing.', top: '25%', right: '0%', color: 'text-red-400', border: 'border-red-400/30' });
    if (int >= 0.7) effects.push({ id: 'vfib', label: 'Ventricular Fibrillation', desc: 'Current passing through the heart disrupts the electrical rhythm, leading to fatal cardiac arrest if not treated with an AED.', top: '45%', right: '2%', color: 'text-red-500', border: 'border-red-500/30' });
    if (int >= 0.8) effects.push({ id: 'burns', label: 'Severe Tissue Burns', desc: 'High specific energy (I²t) causes resistive heating, resulting in severe 3rd degree burns at current entry and exit points.', top: '65%', right: '8%', color: 'text-orange-600', border: 'border-orange-600/30' });
    return effects;
  };

  const activeEffects = useMemo(() => getEffects(activeIntensity), [activeIntensity, hasDamage]);

  // High-fidelity anatomical silhouette
  const bodySilhouette = "M 100 15 C 112 15, 115 25, 115 35 C 115 45, 110 55, 108 60 C 115 62, 125 65, 135 68 C 145 70, 150 80, 155 100 C 158 120, 160 140, 162 160 C 165 190, 170 210, 172 230 C 175 240, 178 250, 172 255 C 168 260, 162 255, 162 245 C 160 230, 158 215, 155 200 C 145 150, 135 110, 130 90 C 130 110, 128 140, 126 170 C 128 200, 132 230, 132 250 C 134 290, 135 330, 132 370 C 130 400, 128 430, 132 450 C 138 460, 142 468, 135 475 C 125 478, 118 472, 115 460 C 112 430, 110 400, 108 370 C 105 320, 105 280, 105 250 C 102 245, 98 245, 95 250 C 95 280, 95 320, 92 370 C 90 400, 88 430, 85 460 C 82 472, 75 478, 65 475 C 58 468, 62 460, 68 450 C 72 430, 70 400, 68 370 C 65 330, 66 290, 68 250 C 68 230, 72 200, 74 170 C 72 140, 70 110, 70 90 C 65 110, 55 150, 45 200 C 42 215, 40 230, 38 245 C 38 255, 32 260, 28 255 C 22 250, 25 240, 28 230 C 30 210, 35 190, 38 160 C 40 140, 42 120, 45 100 C 50 80, 55 70, 65 68 C 75 65, 85 62, 92 60 C 90 55, 85 45, 85 35 C 85 25, 88 15, 100 15 Z";

  // Organ details
  const brainPath = "M 100 18 C 108 18, 112 25, 110 32 C 112 38, 108 45, 100 48 C 92 45, 88 38, 90 32 C 88 25, 92 18, 100 18 Z";
  const leftLung = "M 96 85 C 96 78, 85 82, 80 95 C 75 110, 78 135, 86 140 C 94 145, 96 130, 96 120 Z";
  const rightLung = "M 104 85 C 104 78, 115 82, 120 95 C 125 110, 122 135, 114 140 C 106 145, 104 130, 104 120 Z";
  const heartAnatomical = "M 102 105 C 108 103, 114 108, 112 118 C 110 128, 105 135, 98 142 C 92 132, 90 125, 92 118 C 94 110, 98 105, 102 105 Z";

  // Nervous system visualization
  const centralNerve = "M 100 48 L 100 245";
  const nerveBranches = [
    "M 100 65 Q 125 75 138 120",
    "M 100 65 Q 75 75 62 120",
    "M 138 120 Q 148 160 168 230",
    "M 62 120 Q 52 160 32 230",
    "M 100 230 Q 120 250 115 320 Q 110 380 125 450",
    "M 100 230 Q 80 250 85 320 Q 90 380 75 450",
  ];

  const pathHandToHand = "M 30 250 Q 35 200 40 160 Q 55 100 70 80 Q 100 120 130 80 Q 145 100 160 160 Q 165 200 170 250";
  const pathHandToFoot = "M 30 250 Q 35 200 40 160 Q 55 100 70 80 Q 90 120 100 150 Q 120 200 130 250 Q 135 350 135 460";

  return (
    <div className="relative flex flex-col w-full h-full min-h-[250px] bg-slate-950/90 rounded-2xl border border-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Top Dedicated Human Protection & PPE Status Bar (Above Human Canvas) */}
      <div className="w-full bg-slate-900/95 border-b border-slate-800 p-2 px-3 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg border shadow-md flex items-center gap-1.5 transition-all whitespace-nowrap",
            isPPESafe 
              ? "bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)]" 
              : activePPENames.length > 0 
                ? "bg-amber-950/90 border-amber-500/80 text-amber-300 font-black"
                : "bg-red-950 border-2 border-red-500 text-yellow-300 font-black shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse"
          )}>
            {isPPESafe ? (
              <>🛡️ CONDITION: PROTECTED WITH PPE</>
            ) : activePPENames.length > 0 ? (
              <>🛡️ CONDITION: INSUFFICIENT PPE RATING</>
            ) : (
              <>⚠️ CONDITION: UNPROTECTED (WITHOUT PPE)</>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {activePPENames.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest mr-1">
                Equipped PPE:
              </span>
              {activePPENames.map((name, i) => (
                <span key={i} className="bg-sky-500/20 text-sky-300 border border-sky-500/50 px-1.5 py-0.5 rounded font-mono font-bold text-[9px]">
                  ✓ {name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[9px] font-mono text-amber-300 font-bold italic">
              No PPE items equipped
            </span>
          )}
        </div>
      </div>

      {/* Persistent Trauma Recovery Notification Bar */}
      {persistentDamage.active && (
        <div className="w-full bg-red-950 border-b-2 border-red-500 p-2 px-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 z-20 shrink-0 animate-pulse shadow-[0_4px_20px_rgba(239,68,68,0.5)]">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500 fill-current shrink-0 animate-bounce" />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black text-yellow-300 uppercase tracking-widest leading-tight">
                {prognosis.timeText}
              </span>
              <span className="text-[9.5px] font-bold text-white leading-tight">
                {prognosis.desc}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-amber-300 font-mono font-black shrink-0 self-end sm:self-center">
            {recoverySeconds > 0 ? `TRAUMA TIMER: ${recoverySeconds}s` : 'RECOVERY PHASE COMPLETED'}
          </span>
        </div>
      )}

      {/* Main SVG Human Twin Canvas Area */}
      <div className="relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
        {/* Medical Scanning Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03]"></div>
        
        {/* Target Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none mix-blend-screen">
          <div className="w-[80%] aspect-square rounded-full border border-sky-500/50"></div>
          <div className="w-[60%] aspect-square rounded-full border border-sky-500/30"></div>
          <div className="absolute w-full h-[1px] bg-sky-500/50"></div>
          <div className="absolute h-full w-[1px] bg-sky-500/50"></div>
        </div>

        {/* RESET HUMAN TWIN Button - Placed in Clean Empty Screen Area (Top Right) */}
        {persistentDamage.active && (
          <div className="absolute top-3 right-3 z-40 pointer-events-auto">
            <button
              onClick={handleResetDamage}
              className="py-2 px-3.5 bg-slate-900/95 hover:bg-slate-800 text-sky-300 hover:text-white border-2 border-sky-400 font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
              <span>🔄 RESET HUMAN TWIN</span>
            </button>
          </div>
        )}

        {/* Holographic scanner sweep */}
        <motion.div 
          animate={{ y: ['-100%', '800%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-sky-400/0 via-sky-400/10 to-sky-400/0 pointer-events-none mix-blend-screen"
        />

        {/* SVG Container */}
        <div className="relative z-10 w-full h-full max-h-[500px] flex items-center justify-center p-3">
          <svg viewBox="0 0 200 500" className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            
            {/* Base Silhouette (Vibrant Glowing Neon Hologram) */}
            <path 
              d={bodySilhouette} 
              fill={!hasDamage ? "rgba(56, 189, 248, 0.18)" : (activeIntensity > 0.7 ? "rgba(239, 68, 68, 0.45)" : activeIntensity > 0.4 ? "rgba(249, 115, 22, 0.45)" : "rgba(234, 179, 8, 0.45)")}
              stroke={!hasDamage ? "#38bdf8" : (activeIntensity > 0.7 ? '#ef4444' : activeIntensity > 0.4 ? '#f97316' : '#facc15')}
              strokeWidth={!hasDamage ? "2.5" : "3.5"}
              style={{ filter: !hasDamage ? "drop-shadow(0 0 10px rgba(56, 189, 248, 0.7))" : (activeIntensity > 0.7 ? "drop-shadow(0 0 22px #ef4444)" : "drop-shadow(0 0 22px #f97316)") }}
              className="transition-all duration-300"
            />

            {/* Internal Organs (Brain, Lungs, Heart) - Leaves Red Heart on when damaged */}
            <g className="transition-all duration-300">
              {/* Brain */}
              <path d={brainPath} fill={!hasDamage ? "rgba(56, 189, 248, 0.35)" : organColor} stroke={!hasDamage ? "#38bdf8" : organStroke} strokeWidth="1.5" />
              <path d="M 100 18 L 100 48" stroke={!hasDamage ? "#38bdf8" : organStroke} strokeWidth="1" strokeDasharray="2,2" />
              
              {/* Lungs */}
              <path d={leftLung} fill={!hasDamage ? "rgba(56, 189, 248, 0.3)" : organColor} stroke={!hasDamage ? "#38bdf8" : organStroke} strokeWidth="1.5" />
              <path d={rightLung} fill={!hasDamage ? "rgba(56, 189, 248, 0.3)" : organColor} stroke={!hasDamage ? "#38bdf8" : organStroke} strokeWidth="1.5" />
              
              {/* Heart - Red Heart persistent */}
              <motion.path 
                d={heartAnatomical}
                fill={hasDamage && activeIntensity >= 0.1 ? "#ef4444" : (!hasDamage ? "rgba(56, 189, 248, 0.5)" : organColor)}
                stroke={hasDamage && activeIntensity >= 0.1 ? "#f87171" : (!hasDamage ? "#38bdf8" : organStroke)}
                strokeWidth="2.5"
                animate={hasDamage ? {
                  scale: [1, 1.25, 0.95, 1.15, 1],
                  filter: ['drop-shadow(0 0 4px #ef4444)', 'drop-shadow(0 0 22px #ef4444)', 'drop-shadow(0 0 4px #ef4444)']
                } : {
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: hasDamage ? 0.3 : 0.8, repeat: Infinity, repeatType: 'reverse' }}
                style={{ transformOrigin: '100px 125px' }}
              />
            </g>

            {/* Nervous System / Vascular Tree - Nerves Burned */}
            <g stroke={!hasDamage ? "rgba(56, 189, 248, 0.6)" : (activeIntensity > 0.4 ? "#f97316" : "#eab308")} fill="none" className="transition-all duration-300">
              <path d={centralNerve} strokeWidth={hasDamage ? "3" : "2"} />
              {nerveBranches.map((d, i) => (
                <path key={i} d={d} strokeWidth={hasDamage ? "2" : "1.5"} strokeDasharray={hasDamage ? undefined : "3,3"} />
              ))}
            </g>

            {/* High-Fidelity Damage Overlays */}
            <g className="mix-blend-screen">
              {hasDamage && activeIntensity >= 0.1 && (
                <g key="nerves-burned" className="transition-all duration-500">
                  <path d={centralNerve} stroke="#f97316" strokeWidth="6" className="drop-shadow-[0_0_12px_#f97316]" fill="none" />
                  {nerveBranches.map((d, i) => (
                    <path key={i} d={d} stroke="#eab308" strokeWidth="4.5" className="drop-shadow-[0_0_12px_#eab308]" fill="none" />
                  ))}
                </g>
              )}
              {hasDamage && activeIntensity >= 0.4 && (
                <rect x="0" y="80" width="200" height="200" fill="#f97316" className="opacity-50 mix-blend-screen" />
              )}
              {hasDamage && activeIntensity >= 0.6 && (
                <g key="lungs-damaged">
                  <path d={leftLung} fill="#ef4444" className="drop-shadow-[0_0_10px_#ef4444]" />
                  <path d={rightLung} fill="#ef4444" className="drop-shadow-[0_0_10px_#ef4444]" />
                </g>
              )}
              {hasDamage && activeIntensity >= 0.7 && (
                <g key="heart-critical">
                  <motion.path 
                    d={heartAnatomical} fill="#ff0000" className="drop-shadow-[0_0_25px_#ff0000]" 
                    animate={{ opacity: [0.8, 1, 0.8] }} 
                    transition={{ duration: 0.15, repeat: Infinity }}
                  />
                </g>
              )}
            </g>

            {/* Electrical Shock Path Animation */}
            <AnimatePresence>
              {isAnimating && activePath !== 'none' && (
                <motion.path
                  key="shock-path-animation"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, repeat: Infinity, ease: 'linear' }}
                  d={activePath === 'hand-to-hand' ? pathHandToHand : pathHandToFoot}
                  stroke={activeIntensity > 0.7 ? '#ef4444' : '#f97316'}
                  strokeWidth="4"
                  strokeDasharray="15 15"
                  strokeLinecap="round"
                  fill="none"
                  style={{ filter: `drop-shadow(0 0 12px ${activeIntensity > 0.7 ? '#ef4444' : '#f97316'})` }}
                />
              )}
              
              {/* Severe Tetanization (Muscle Spasm Lines) */}
              {hasDamage && activeIntensity >= 0.4 && (
                <motion.g 
                  key="tetanization-spasms"
                  stroke="#f97316" strokeWidth="1" fill="none" opacity="0.8"
                  animate={{ x: [-1.5, 1.5, -1.5], y: [-1.5, 1.5, -1.5] }}
                  transition={{ duration: 0.05, repeat: Infinity }}
                >
                  <path d="M 65 110 L 55 130 L 60 145 L 45 155" />
                  <path d="M 135 110 L 145 130 L 140 145 L 155 155" />
                  <path d="M 115 320 L 125 350 L 115 380 L 130 420" />
                  <path d="M 85 320 L 75 350 L 85 380 L 70 420" />
                </motion.g>
              )}
            </AnimatePresence>

            {/* Tissue Burn Marks at Entry/Exit Points */}
            {hasDamage && activeIntensity >= 0.8 && (
              <g fill="#ef4444" opacity="0.9" style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }}>
                <circle cx="28" cy="255" r="8" className="animate-ping" />
                <circle cx="28" cy="255" r="4" fill="#fff" />
                
                {activePath === 'hand-to-hand' && (
                  <>
                    <circle cx="172" cy="255" r="8" className="animate-ping" />
                    <circle cx="172" cy="255" r="4" fill="#fff" />
                  </>
                )}
                {activePath === 'hand-to-foot' && (
                  <>
                    <circle cx="135" cy="475" r="8" className="animate-ping" />
                    <circle cx="135" cy="475" r="4" fill="#fff" />
                  </>
                )}
              </g>
            )}

          </svg>

          {/* Mobile List View for Effects (Bottom Left) */}
          <div className="md:hidden absolute bottom-2 left-2 flex flex-col gap-1 z-30 pointer-events-none">
            <AnimatePresence>
              {activeEffects.map((effect, index) => (
                <motion.div
                  key={`mobile-${effect.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-1.5 bg-slate-950/95 border backdrop-blur-xl px-2 py-1 rounded shadow-xl ${effect.color} ${effect.border}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full animate-ping ${effect.color.replace('text-', 'bg-')}`} />
                  <span className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap">
                    {effect.label}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Positioned Effects */}
          <div className="hidden md:block">
            <AnimatePresence>
              {activeEffects.map((effect, index) => (
                <motion.div
                  key={`desktop-${effect.id}`}
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.1 }}
                  className={`absolute flex items-center gap-1.5 bg-slate-950/95 border backdrop-blur-xl px-2 py-1 rounded-lg shadow-2xl z-20 pointer-events-none ${effect.color} ${effect.border}`}
                  style={{
                    top: effect.top,
                    left: effect.left,
                    right: effect.right,
                  }}
                >
                  <div className={`w-1.5 h-1.5 rounded-full animate-ping ${effect.color.replace('text-', 'bg-')}`} />
                  <InfoTooltip title={effect.label} description={effect.desc}><span className="text-[9.5px] font-black uppercase tracking-widest whitespace-nowrap cursor-help">{effect.label}</span></InfoTooltip>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Medical UI Header */}
          <div className="absolute top-2 right-2 flex justify-end items-start z-30 pointer-events-none">
            {hasDamage && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-end"
              >
                <div className={`px-2.5 py-1 text-[9px] uppercase font-black tracking-widest rounded-lg border backdrop-blur-sm animate-pulse shadow-xl ${
                  activeIntensity > 0.7 ? 'bg-red-950/80 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 
                  activeIntensity > 0.4 ? 'bg-orange-950/80 border-orange-500/50 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 
                  'bg-yellow-950/80 border-yellow-500/50 text-yellow-400'
                }`}>
                  {activeIntensity > 0.7 ? 'CRITICAL TISSUE DAMAGE' : activeIntensity > 0.4 ? 'SEVERE NERVE TRAUMA' : 'SENSORY WARNING'}
                </div>
              </motion.div>
            )}
          </div>

          {/* Danger Vignette */}
          {hasDamage && activeIntensity > 0 && (
            <div 
              className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-300" 
              style={{ 
                background: `radial-gradient(circle at center, transparent 30%, ${activeIntensity > 0.7 ? '#ef4444' : '#f97316'} 150%)`,
                opacity: activeIntensity * 0.9
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
