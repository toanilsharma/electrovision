/**
 * ShockRescueDrillModal.tsx
 * 
 * Usability Audit Item 16: Interactive "Shock Rescue: What Do You Do First?"
 * Life-saving interactive drill teaching families and 12-year-olds how to rescue
 * an electrocution victim without getting shocked themselves.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Sparkles,
  Zap,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { homeguardAudio } from '../utils/homeguardAudio';

export interface ShockRescueDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ShockRescueDrillModal: React.FC<ShockRescueDrillModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setHasSubmitted(true);
    if (optionId === 'opt_safe') {
      homeguardAudio.playSuccessChime();
      if (onSuccess) onSuccess();
    } else {
      homeguardAudio.playArcSizzleSound();
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-3 sm:p-4 bg-rose-950/50 border-b border-rose-800/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  Shock Rescue Emergency Drill
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500 text-slate-950">
                  LIFE OR DEATH
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                What to do when someone is touching live electricity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drill Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs font-sans text-slate-200 overflow-y-auto">
          
          {/* Situation Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5 font-mono">
              <Zap className="w-3.5 h-3.5" />
              The Emergency Scenario
            </span>
            <p className="text-slate-300 leading-relaxed font-medium">
              You walk into the bathroom and see your family member holding a damaged cord. Their hand muscles are clamped tight in a freeze spasm and they are violently shaking!
            </p>
            <div className="bg-rose-950/40 border border-rose-800/40 p-2.5 rounded-lg text-[11px] text-rose-200 font-bold font-mono">
              ⚡ QUESTION: What is your IMMEDIATE First Action?
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {/* Option A: Fatal Trap */}
            <button
              type="button"
              disabled={hasSubmitted}
              onClick={() => handleSelect('opt_grab')}
              className={cn(
                "w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3",
                selectedOption === 'opt_grab'
                  ? "bg-rose-950/70 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
              )}
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                A
              </div>
              <div className="space-y-1">
                <strong className="block font-bold text-white text-xs">
                  Grab their arms or shirt with both hands and yank them away with all your strength!
                </strong>
                <span className="text-[11px] text-slate-400 block">
                  Natural instinctive reaction when seeing a loved one in danger.
                </span>
              </div>
            </button>

            {/* Option B: Correct Action */}
            <button
              type="button"
              disabled={hasSubmitted}
              onClick={() => handleSelect('opt_safe')}
              className={cn(
                "w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3",
                selectedOption === 'opt_safe'
                  ? "bg-emerald-950/70 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
              )}
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                B
              </div>
              <div className="space-y-1">
                <strong className="block font-bold text-white text-xs">
                  DO NOT TOUCH THEM! Flip the Main DB Switch OFF, or push them free using a dry wooden stick or plastic broom!
                </strong>
                <span className="text-[11px] text-slate-400 block">
                  Break the electrical circuit using non-conductive insulation.
                </span>
              </div>
            </button>
          </div>

          {/* Feedback Section */}
          {hasSubmitted && (
            <div className={cn(
              "p-4 rounded-xl border space-y-2 animate-in fade-in duration-200",
              selectedOption === 'opt_safe'
                ? "bg-emerald-950/80 border-emerald-500/80 text-emerald-200"
                : "bg-rose-950/80 border-rose-500/80 text-rose-200"
            )}>
              <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase">
                {selectedOption === 'opt_safe' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>CORRECT! YOU SAVED THEIR LIFE & YOUR OWN!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>FATAL TRAP! SECONDARY ELECTROCUTION!</span>
                  </>
                )}
              </div>

              <p className="text-[11px] leading-relaxed">
                {selectedOption === 'opt_safe' ? (
                  <>
                    <strong>Why this works:</strong> Electric current seeks the easiest path to ground. By cutting the DB breaker switch or using dry wood/plastic, you remain insulated. The circuit breaks and the victim is instantly freed without harming you!
                  </>
                ) : (
                  <>
                    <strong>Why Option A is deadly:</strong> The victim's body is charged at 230V. Touching them with bare hands turns YOU into the second path to ground. Your muscles will also freeze, and both of your hearts will enter ventricular fibrillation!
                  </>
                )}
              </p>

              {/* Step 2 Follow-Up */}
              <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] space-y-1 font-mono">
                <div className="text-white font-bold">NEXT IMMEDIATE STEPS:</div>
                <div>1. Call Emergency Ambulance (112 / 911 / 999).</div>
                <div>2. Check breathing. If unresponsive & not breathing normally, begin CPR compressions immediately!</div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 font-mono text-xs">
          {hasSubmitted && selectedOption !== 'opt_safe' ? (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-400">
              Golden Rule: Never Touch With Bare Skin
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer ml-auto"
          >
            {hasSubmitted ? "Close Drill" : "Exit"}
          </button>
        </div>

      </div>
    </div>
  );
};
