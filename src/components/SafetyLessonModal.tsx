import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Zap, ShieldCheck, HeartPulse, Award } from 'lucide-react';

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
    if (v <= 500) recs.push("Class 00 Rubber Gloves (IEC 60903 / ASTM D120 up to 500V)");
    else if (v <= 1000) recs.push("Class 0 Rubber Gloves (IEC 60903 / ASTM D120 up to 1000V)");
    else if (v <= 7500) recs.push("Class 1 HV Gloves (IEC 60903 / ASTM D120 up to 7.5kV)");
    else recs.push("Class 2 HV Gloves (IEC 60903 / ASTM D120 up to 17kV)");

    recs.push("Dielectric EH Boots (ASTM F2413 / ASTM F1117)");
    recs.push("Eye Goggles & Arc Face Shield (ANSI Z87.1 / NFPA 70E)");
    recs.push("Arc-Rated / IFR Suit (NFPA 70E / IEC 61482 cal/cm² rated)");
    if (skin === 'wet') recs.push("Keep hands & skin completely dry");

    return recs;
  };

  const survivalRecs = getSurvivalRecommendations(voltage, skinCondition);

  return (
    <AnimatePresence>
      <div className="fixed top-14 left-3 sm:left-6 z-[95] w-[calc(100%-1.5rem)] sm:w-[440px] max-w-full">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          className={`rounded-2xl border-2 shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-slate-950 overflow-hidden flex flex-col ${
            isPPESafe 
              ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
              : 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
          }`}
        >
          {/* Header Bar */}
          <div className={`px-3.5 py-2 flex items-center justify-between font-black shrink-0 ${
            isPPESafe
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950'
          }`}>
            <div className="flex items-center gap-2">
              {isPPESafe ? (
                <Award className="w-4.5 h-4.5 fill-slate-950 text-emerald-400 shrink-0" />
              ) : (
                <Zap className="w-4.5 h-4.5 fill-current text-slate-950 shrink-0" />
              )}
              <h2 className="text-xs uppercase tracking-wider font-black">
                {isPPESafe ? '🎉 CONGRATULATIONS! LIFE SAVED BY PPE!' : 'POST-SHOCK HAZARD ANALYSIS'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Compact Main Content */}
          <div className="p-3 space-y-2.5 text-slate-100">

            {isPPESafe ? (
              /* PPE SAFE: ULTRA-COMPACT CELEBRATORY LAYOUT */
              <>
                {/* Hero Stat Header */}
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest block">
                      100% Shock Protection
                    </span>
                    <p className="text-xs font-bold text-white leading-tight">
                      Well done! You blocked <strong className="text-emerald-300 font-mono text-sm">{currentMA.toFixed(1)} mA ({currentAmp} A)</strong> at {voltage}V!
                    </p>
                  </div>
                  <div className="text-right shrink-0 px-2 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-lg">
                    <span className="text-[8px] font-bold text-emerald-300 block uppercase">Body Current</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">0.0 mA</span>
                  </div>
                </div>

                {/* Heart Danger & Safe Threshold Compact Box */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-emerald-400" /> 2. Heart Danger Status
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ZERO HEART HAZARD
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-200 leading-snug">
                    Max safe heart limit for {currentMA.toFixed(1)} mA is <strong className="text-amber-300 font-mono">{heartLimit.ms} ms ({heartLimit.sec}s)</strong>. Your exposure was {durationMs} ms. Without PPE, this current triggers fatal heart stop—your PPE isolated your heart 100%!
                  </p>
                </div>

                {/* 3 Key Risks Avoided Compact Grid */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                    3. Hazards & Risks Prevented By Your PPE
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-emerald-500/20">
                      <strong className="text-emerald-300 block text-[9.5px]">🫀 Heart Stop</strong>
                      <span className="text-slate-300 leading-tight block text-[9px]">Blocked fatal fibrillation ({heartLimit.ms}ms limit)</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-emerald-500/20">
                      <strong className="text-emerald-300 block text-[9.5px]">✋ Muscle Freeze</strong>
                      <span className="text-slate-300 leading-tight block text-[9px]">Prevented "Cannot Let Go" hand clamp</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-emerald-500/20">
                      <strong className="text-emerald-300 block text-[9.5px]">🔥 Arc Burns</strong>
                      <span className="text-slate-300 leading-tight block text-[9px]">Insulated skin from {voltage}V thermal burns</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Gear & Action Row */}
                <div className="pt-0.5 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1 text-[9px]">
                    {equippedPPENames.slice(0, 2).map((name, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold truncate max-w-[150px]">
                        ✓ {name}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={onClose}
                    className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              /* UNPROTECTED SHOCK: ULTRA-COMPACT HAZARD LAYOUT */
              <>
                {/* 3 Stat Bar */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-red-500/40">
                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Body Current</span>
                    <span className="text-xs font-black text-amber-300 font-mono block">{currentMA.toFixed(1)} mA</span>
                    <span className="text-[8px] text-slate-400 block">({currentAmp} A)</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Exposed Time</span>
                    <span className="text-xs font-black text-amber-300 font-mono block">{durationMs} ms</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Safe Heart Limit</span>
                    <span className="text-xs font-black text-red-400 font-mono block">{heartLimit.ms} ms</span>
                  </div>
                </div>

                {/* Heart Danger Box */}
                <div className={`p-2 rounded-xl border text-[11px] font-bold ${
                  durationMs >= heartLimit.ms ? 'bg-red-950/80 border-red-500 text-red-200' : 'bg-orange-950/80 border-orange-500 text-yellow-200'
                }`}>
                  <div className="flex items-center justify-between mb-1 text-[10px] font-black uppercase">
                    <span className="flex items-center gap-1 text-red-400">
                      <HeartPulse className="w-3.5 h-3.5" /> 2. Heart Danger Status
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                      {durationMs >= heartLimit.ms ? 'FATAL FIBRILATION RISK' : 'CRITICAL HEART HAZARD'}
                    </span>
                  </div>
                  <p className="leading-tight">
                    {durationMs >= heartLimit.ms
                      ? `Max safe limit for ${currentMA.toFixed(1)} mA is ${heartLimit.ms} ms. Exposure of ${durationMs} ms EXCEEDED limit by +${excessMs} ms! High risk of fatal Ventricular Fibrillation!`
                      : `Max safe heart limit is ${heartLimit.ms} ms (${heartLimit.sec}s). Exposure was ${durationMs} ms. Longer contact will trigger heart stop!`}
                  </p>
                </div>

                {/* Survival Recommendations */}
                <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-[10.5px] space-y-1">
                  <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-widest block flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 3. How To Prevent Injury
                  </span>
                  {survivalRecs.map((rec, i) => (
                    <p key={i} className="font-bold text-emerald-200 leading-tight flex items-start gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </p>
                  ))}
                </div>

                <div className="pt-0.5">
                  <button
                    onClick={onClose}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                  >
                    Close Panel & Equip PPE
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
