import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Zap, ShieldCheck, HeartPulse, Award, AlertTriangle, ShieldAlert, Activity, ArrowRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface SafetyLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMA: number;
  durationMs: number;
  skinCondition: 'dry' | 'wet';
  path: 'hand-to-hand' | 'hand-to-foot' | 'none';
  voltage: number;
  isPPESafe: boolean;
  equippedPPENames?: string[];
  hazardType?: 'ac' | 'dc';
}

export const SafetyLessonModal: React.FC<SafetyLessonModalProps> = ({
  isOpen,
  onClose,
  currentMA,
  durationMs,
  skinCondition,
  voltage,
  isPPESafe,
  equippedPPENames = [],
  hazardType = 'ac'
}) => {
  if (!isOpen) return null;

  const currentAmp = (currentMA / 1000).toFixed(2);

  // IEC 60479-1 Heart Fibrillation Curve: t = (165 / mA)^2 seconds
  const calculateHeartLimit = (ma: number) => {
    if (ma < 0.5) return { ms: 99999, sec: '> 99' };
    const timeInSec = Math.pow(165 / ma, 2);
    const thresholdMs = Math.round(timeInSec * 1000);
    const thresholdSec = timeInSec < 1 ? timeInSec.toFixed(2) : timeInSec.toFixed(1);
    return { ms: thresholdMs, sec: thresholdSec };
  };

  const heartLimit = calculateHeartLimit(currentMA);
  const excessMs = durationMs - heartLimit.ms;

  const getSurvivalRecommendations = (v: number, skin: string) => {
    const recs: string[] = [];
    if (v <= 500) recs.push("Class 00 Rubber Gloves (500V)");
    else if (v <= 1000) recs.push("Class 0 Rubber Gloves (1000V)");
    else if (v <= 7500) recs.push("Class 1 HV Gloves (7.5kV)");
    else recs.push("Class 2 HV Gloves (17kV)");

    recs.push("Dielectric EH Boots (ASTM F2413)");
    recs.push("Eye Goggles & Arc Face Shield");
    if (skin === 'wet') recs.push("Keep skin completely dry");

    return recs;
  };

  const survivalRecs = getSurvivalRecommendations(voltage, skinCondition);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className={cn(
            "w-full max-w-[560px] bg-slate-950 rounded-2xl border-2 shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col my-auto",
            isPPESafe 
              ? 'border-emerald-400 ring-2 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.4)]' 
              : 'border-amber-400 ring-2 ring-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
          )}
        >
          {/* Header Bar */}
          <div className={cn(
            "px-4 py-3 flex items-center justify-between font-black shrink-0 border-b border-white/10",
            isPPESafe
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950'
          )}>
            <div className="flex items-center gap-2">
              {isPPESafe ? (
                <Award className="w-5 h-5 fill-slate-950 text-emerald-400 shrink-0" />
              ) : (
                <Zap className="w-5 h-5 fill-current text-slate-950 shrink-0 animate-bounce" />
              )}
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                {isPPESafe ? '🎉 CONGRATULATIONS! LIFE SAVED BY PPE!' : '⚡ POST-SHOCK HAZARD ANALYSIS'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 cursor-pointer transition-colors"
              title="Close Analysis Panel"
            >
              <X className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Balanced Content Layout */}
          <div className="p-3.5 sm:p-4 space-y-3 text-slate-100">

            {isPPESafe ? (
              /* PPE SAFE: BALANCED CELEBRATORY LAYOUT */
              <>
                {/* Hero Stat Header */}
                <div className="p-3 rounded-xl bg-emerald-950/90 border-2 border-emerald-500/60 flex items-center justify-between gap-3 shadow-md">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest block">
                      🛡️ 100% SHOCK PROTECTION
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                      Outstanding safety! Your rated PPE blocked <strong className="text-emerald-300 font-mono text-sm">{currentMA.toFixed(1)} mA ({currentAmp} A)</strong> body current at {voltage}V!
                    </p>
                  </div>
                  <div className="shrink-0 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/60 rounded-xl text-center">
                    <span className="text-[9px] font-black text-emerald-300 block uppercase">Insulated</span>
                    <span className="text-base font-black text-emerald-400 font-mono">0.0 mA</span>
                  </div>
                </div>

                {/* Heart Safety Status Box */}
                <div className="p-3 rounded-xl bg-slate-900 border-2 border-emerald-500/50 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-black uppercase">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-emerald-400" /> Heart Safety Status
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px]">
                      ZERO HEART HAZARD
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-100 leading-snug">
                    Without PPE, exposure at {currentMA.toFixed(1)} mA has a safe heart limit of <strong className="text-amber-300 font-mono">{heartLimit.ms} ms ({heartLimit.sec}s)</strong>. Your exposure was {durationMs} ms. Your insulated PPE prevented fatal heart arrest!
                  </p>
                </div>

                {/* 3 Key Risks Avoided Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/30">
                    <strong className="text-emerald-300 block font-bold text-xs mb-0.5">🫀 Heart Arrest</strong>
                    <span className="text-slate-200 leading-tight block text-[10px]">Blocked fatal heart fibrillation ({heartLimit.ms}ms limit)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/30">
                    <strong className="text-emerald-300 block font-bold text-xs mb-0.5">✋ Muscle Lock</strong>
                    <span className="text-slate-200 leading-tight block text-[10px]">Prevented hand muscle freeze ("Cannot Let Go")</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/30">
                    <strong className="text-emerald-300 block font-bold text-xs mb-0.5">🔥 Arc Burns</strong>
                    <span className="text-slate-200 leading-tight block text-[10px]">Insulated body against {voltage}V thermal burn heat</span>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">Equipped:</span>
                    {equippedPPENames.map((name, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                        ✓ {name}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={onClose}
                    className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)] shrink-0 active:scale-95"
                  >
                    Continue Simulation
                  </button>
                </div>
              </>
            ) : (
              /* UNPROTECTED SHOCK: BALANCED HAZARD LAYOUT WITH BRIGHT WHITE TEXT */
              <>
                {/* 3 Metric Cards Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900 border-2 border-red-500/50 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Body Current Flow</span>
                    <span className="text-sm sm:text-base font-black text-amber-300 font-mono block">{currentMA.toFixed(1)} mA</span>
                    <span className="text-[9px] text-slate-300 font-bold block">({currentAmp} Amperes)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border-2 border-slate-800 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Shock Exposure</span>
                    <span className="text-sm sm:text-base font-black text-amber-300 font-mono block">{durationMs} ms</span>
                    <span className="text-[9px] text-slate-300 font-bold block">({(durationMs/1000).toFixed(1)}s Duration)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border-2 border-red-500/50 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Safe Heart Limit</span>
                    <span className="text-sm sm:text-base font-black text-red-400 font-mono block">{heartLimit.ms} ms</span>
                    <span className="text-[9px] text-red-300 font-bold block">({heartLimit.sec}s Max)</span>
                  </div>
                </div>

                {/* Heart Danger Status Box */}
                <div className={cn(
                  "p-3 rounded-xl border-2 space-y-1 shadow-md",
                  durationMs >= heartLimit.ms 
                    ? 'bg-red-950 border-red-500 text-white' 
                    : 'bg-orange-950 border-orange-500 text-yellow-200'
                )}>
                  <div className="flex items-center justify-between text-xs font-black uppercase">
                    <span className="flex items-center gap-1.5 text-white">
                      <HeartPulse className="w-4 h-4 text-red-400 animate-pulse" /> 🫀 Heart Safety Status
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-500/30 text-white font-black border border-red-400 text-[10px]">
                      {durationMs >= heartLimit.ms ? '🚨 FATAL HEART ARREST RISK' : '⚠️ HIGH HEART HAZARD'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white leading-snug">
                    {durationMs >= heartLimit.ms
                      ? `Safe limit for ${currentMA.toFixed(1)} mA is ${heartLimit.ms} ms (${heartLimit.sec}s). Exposure of ${durationMs} ms EXCEEDED limit by +${excessMs} ms! High risk of fatal Heart Arrest (Ventricular Fibrillation)!`
                      : `Safe heart limit is ${heartLimit.ms} ms (${heartLimit.sec}s). Exposure was ${durationMs} ms. Longer contact will trigger heart stop!`}
                  </p>
                </div>

                {/* 2-Column Side-by-Side Grid: Effects (Left) & Rated PPE (Right) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Left Column: Trauma Effects Observed */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                      Electrical Trauma Effects Observed
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <p className="font-bold text-amber-200 leading-tight">
                        ✊ <strong className="text-amber-300">Muscle Lock:</strong> Hand muscles freeze on wire (&gt;10mA).
                      </p>
                      <p className="font-bold text-red-300 leading-tight">
                        🫀 <strong className="text-red-400">Heart Arrest Risk:</strong> Heart rhythm disrupted.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Survival Practices & PPE */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-1">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Rated Safety PPE Recommended
                    </span>
                    <div className="space-y-1 text-[10.5px]">
                      {survivalRecs.map((rec, i) => (
                        <p key={i} className="font-bold text-emerald-200 leading-tight flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{rec}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Restored Prominent Action Button */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95"
                  >
                    Close Analysis & Equip Rated PPE
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
