import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Zap, AlertTriangle, ShieldCheck, HeartPulse, Clock, Activity } from 'lucide-react';

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
  path,
  voltage,
  isPPESafe,
  equippedPPENames = [],
  hazardType = 'ac'
}) => {
  if (!isOpen) return null;

  // Calculation for Line 1: Current Passed, Duration, Condition
  const currentAmp = (currentMA / 1000).toFixed(2);
  const durationSec = (durationMs / 1000).toFixed(2);

  // Calculation for Line 2: Human Body & Heart Hazard Threshold
  const getHeartDangerInfo = (ma: number, durMs: number) => {
    if (ma < 0.5) {
      return {
        level: 'safe',
        badge: 'SAFE LEVEL',
        title: 'Micro-Tingle Current',
        description: 'Below 0.5 mA — Completely safe. No risk to the human heart or muscles.'
      };
    }
    if (ma < 10) {
      return {
        level: 'warning',
        badge: 'PAINFUL SHOCK',
        title: 'Reflex Jerk Hazard',
        description: 'Painful shock causing muscle jerks, but you can still pull your hand away safely.'
      };
    }
    if (ma < 30) {
      return {
        level: 'danger',
        badge: 'MUSCLE FREEZE HAZARD',
        title: 'Cannot Let Go!',
        description: 'Hand muscles clamp tight on the conductor — You cannot let go without help!'
      };
    }

    // IEC 60479-1 Z_c curve formula: t = (165 / mA)^2 seconds
    const timeInSec = Math.pow(165 / ma, 2);
    const thresholdMs = Math.round(timeInSec * 1000);
    const thresholdSec = timeInSec < 1 ? timeInSec.toFixed(2) : timeInSec.toFixed(1);
    
    const excessMs = durMs - thresholdMs;
    const excessSec = (excessMs / 1000).toFixed(2);

    if (durMs >= thresholdMs) {
      return {
        level: 'critical',
        badge: 'HIGH RISK OF FATAL HEART STOP',
        thresholdMs,
        thresholdSec,
        excessMs,
        excessSec,
        multiplier: (durMs / thresholdMs).toFixed(1),
        description: `Max safe heart limit for this current is ${thresholdMs} ms (${thresholdSec} sec). Shock lasted ${durMs} ms (${durationSec} sec) — EXCEEDED BY ${excessMs} ms (${excessSec} sec)! High risk of fatal Ventricular Fibrillation.`
      };
    } else {
      return {
        level: 'danger',
        badge: 'CRITICAL HEART HAZARD',
        thresholdMs,
        thresholdSec,
        description: `Max safe heart limit is ${thresholdMs} ms (${thresholdSec} sec). Exposure was ${durMs} ms (${durationSec} sec). Longer contact will trigger heart stop!`
      };
    }
  };

  const dangerInfo = getHeartDangerInfo(currentMA, durationMs);

  // Calculation for Line 3: Survival & Prevention
  const getSurvivalRecommendations = (v: number, skin: string, safe: boolean) => {
    if (safe) return ["Fully Safe! Rated PPE completely blocked the electric shock."];
    
    const recs: string[] = [];
    if (v <= 500) recs.push("Class 00 Insulating Safety Gloves (up to 500V)");
    else if (v <= 1000) recs.push("Class 0 Insulating Safety Gloves (up to 1000V)");
    else if (v <= 7500) recs.push("Class 1 High-Voltage Safety Gloves (up to 7.5kV)");
    else recs.push("Class 2 High-Voltage Safety Gloves (up to 17kV)");

    recs.push("Dielectric Safety Boots (stops current through feet)");

    if (skin === 'wet') {
      recs.push("Keep hands & skin dry (moisture drops body resistance)");
    }

    return recs;
  };

  const survivalRecs = getSurvivalRecommendations(voltage, skinCondition, isPPESafe);

  return (
    <AnimatePresence>
      <div className="fixed top-16 left-3 sm:left-6 z-[95] w-[calc(100%-1.5rem)] sm:w-[420px] max-w-full bg-slate-900/98 border-2 border-amber-500 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[85vh]">
        <motion.div
          initial={{ opacity: 0, x: -30, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.96 }}
          className="flex flex-col h-full overflow-hidden"
        >
          {/* Compact Header Bar */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-3.5 py-2.5 flex items-center justify-between text-slate-950 font-black shrink-0">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 fill-current text-slate-950 shrink-0" />
              <h2 className="text-xs uppercase tracking-wider leading-none font-black">
                POST-SHOCK SAFETY SUMMARY
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Card Content - Compact & Scrollable */}
          <div className="p-3 sm:p-3.5 space-y-2.5 flex-1 overflow-y-auto">
            
            {/* CARD 1: ELECTRICITY PASSED & BODY CONTACT */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-sky-500/40 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  1. SHOCK & BODY CONTACT
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                  {hazardType.toUpperCase()} HAZARD
                </span>
              </div>

              {/* Visual 3-Stat Grid */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Current</span>
                  <span className="text-xs font-black text-amber-300 font-mono block">{currentMA.toFixed(1)} mA</span>
                  <span className="text-[8px] text-slate-500 block">({currentAmp} A)</span>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Exposed Time</span>
                  <span className="text-xs font-black text-amber-300 font-mono block">{durationMs} ms</span>
                  <span className="text-[8px] text-slate-500 block">({durationSec} sec)</span>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Path & Skin</span>
                  <span className="text-[10px] font-bold text-white block capitalize truncate">
                    {skinCondition === 'dry' ? 'Dry Skin' : 'Wet Skin'}
                  </span>
                  <span className="text-[8px] text-sky-300 block capitalize truncate">
                    {path === 'hand-to-hand' ? 'Hand-Hand' : 'Hand-Foot'}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: HUMAN BODY & HEART DANGER LEVEL */}
            <div className={`p-2.5 rounded-xl space-y-2 border shadow-sm ${
              dangerInfo.level === 'critical' 
                ? 'bg-red-950/70 border-red-500/80' 
                : dangerInfo.level === 'danger'
                ? 'bg-orange-950/70 border-orange-500/80'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  2. HEART DANGER LEVEL
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${
                  dangerInfo.level === 'critical'
                    ? 'bg-red-500/30 text-red-200 border-red-400 animate-pulse'
                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                }`}>
                  {dangerInfo.badge}
                </span>
              </div>

              {/* Easy-to-Understand Visual Threshold Callout */}
              {dangerInfo.thresholdMs ? (
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-slate-950/90 border border-red-500/40 flex items-center justify-between text-xs font-bold">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" /> Safe Heart Limit
                      </span>
                      <span className="text-amber-300 font-mono font-black text-xs">
                        {dangerInfo.thresholdMs} ms <span className="text-[10px] text-slate-400">({dangerInfo.thresholdSec}s)</span>
                      </span>
                    </div>

                    {dangerInfo.excessMs && (
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-red-400 uppercase block">Time Exceeded</span>
                        <span className="text-red-400 font-mono font-black text-xs">
                          +{dangerInfo.excessMs} ms <span className="text-[10px] text-red-300">({dangerInfo.excessSec}s)</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-bold text-yellow-200 leading-snug flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{dangerInfo.description}</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-200 leading-snug flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span>{dangerInfo.description}</span>
                </p>
              )}
            </div>

            {/* CARD 3: HOW TO PREVENT THIS INJURY */}
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/70 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                3. HOW TO PREVENT THIS INJURY
              </span>

              <div className="space-y-1">
                {survivalRecs.map((rec, i) => (
                  <p key={i} className="text-xs font-bold text-emerald-200 leading-tight flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex items-center justify-end">
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
