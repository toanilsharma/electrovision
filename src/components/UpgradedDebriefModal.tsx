import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award, ShieldCheck, ShieldAlert, Zap, Activity, CheckCircle2, RotateCcw, BookOpen, HelpCircle } from 'lucide-react';
import { IECZoneChart } from './IECZoneChart';
import { InteractiveRescueDrill } from './InteractiveRescueDrill';
import { CPRMetronomeGame } from './CPRMetronomeGame';
import { cn } from '@/src/lib/utils';

interface UpgradedDebriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  voltage: number;
  currentMA: number;
  durationMs: number;
  shockPath: 'hand-to-hand' | 'hand-to-foot';
  skinCondition: 'dry' | 'wet';
  isPPESafe: boolean;
}

const MICRO_QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: '1. What is the IEC 60479-1 muscle let-go threshold where flexor muscles lock?',
    options: ['0.5 mA', '5 mA', '10 mA', '50 mA'],
    correctIndex: 2, // 10 mA
    explanation: 'Per IEC 60479-1 Clause 3.1, 10 mA AC (50/60Hz) is the let-go threshold where hand flexors tetanize and lock.'
  },
  {
    id: 'q2',
    question: '2. Why is the Hand-to-Foot shock path considered the most dangerous?',
    options: [
      'It has the highest total skin resistance',
      'Heart Current Factor F_H = 1.0 (100% current traverses cardiac tissues)',
      'It produces DC waveforms only',
      'It eliminates thermal skin burns'
    ],
    correctIndex: 1,
    explanation: 'Per IEC 60479-1 Table 2, Hand-to-Foot has F_H = 1.0, directing maximum current through the heart ventricles.'
  },
  {
    id: 'q3',
    question: '3. What is the VERY FIRST emergency action when discovering a shock victim?',
    options: [
      'Touch the victim to drag them away',
      'Isolate power (switch off main breaker)',
      'Check pupil dilation',
      'Apply dielectric grease'
    ],
    correctIndex: 1,
    explanation: 'Power isolation is mandatory before touching the victim to prevent secondary shock to the responder.'
  }
];

export const UpgradedDebriefModal: React.FC<UpgradedDebriefModalProps> = ({
  isOpen,
  onClose,
  voltage,
  currentMA,
  durationMs,
  shockPath,
  skinCondition,
  isPPESafe
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'rescue'>('analysis');

  if (!isOpen) return null;

  // Twin A/B Comparison Calculations
  const unprotectedImpedance = skinCondition === 'dry' ? 1350 : 825;
  const unprotectedCurrentMA = (voltage / unprotectedImpedance) * 1000;

  // Class 0 Glove Insulation = 10 MΩ (10,000,000 Ω)
  const ppeGloveImpedance = 10000000;
  const protectedTotalImpedance = unprotectedImpedance + ppeGloveImpedance;
  const protectedCurrentUA = (voltage / protectedTotalImpedance) * 1000000; // microamps (uA)
  const protectedCurrentMA = protectedCurrentUA / 1000;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl bg-slate-950 border-2 border-slate-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden select-none"
      >
        {/* Modal Top Header */}
        <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-300 font-sans leading-none">
                IEC 60479-1 Incident Debrief & Learning Hub
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-400 mt-0.5">
                Incident Touch Potential: {voltage}V AC | Path: {shockPath}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950 p-1 shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={cn(
              'flex-1 py-2 px-3 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2',
              activeTab === 'analysis' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'text-slate-400 hover:text-white'
            )}
          >
            <Activity className="w-4 h-4" />
            <span>Zone Replay & Twin A/B</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rescue')}
            className={cn(
              'flex-1 py-2 px-3 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2',
              activeTab === 'rescue' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' : 'text-slate-400 hover:text-white'
            )}
          >
            <Zap className="w-4 h-4" />
            <span>Rescue Drill & CPR Game</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4">
          {activeTab === 'analysis' && (
            <div className="space-y-4">
              {/* Twin A/B Side-by-Side PPE Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Twin A: Unprotected */}
                <div className="p-3 bg-red-950/70 border-2 border-red-500/80 rounded-2xl flex flex-col justify-between text-left space-y-2 shadow-lg">
                  <div className="flex items-center justify-between border-b border-red-500/50 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-red-200 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-400" /> TWIN A: UNPROTECTED (NO PPE)
                    </span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-red-900 border border-red-500 text-white">
                      CRITICAL RISK
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs text-red-100">
                    <div className="flex justify-between" title="IEC 60479-1 Table 10 Body Impedance">
                      <span>Body Impedance (Z_T):</span>
                      <span className="font-bold">{unprotectedImpedance} Ω ℹ️</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-red-300">
                      <span>Body Current (I_B):</span>
                      <span>{unprotectedCurrentMA.toFixed(1)} mA</span>
                    </div>
                    <div className="flex justify-between" title="IEC 60479-1 Figure 20 c3 Zone">
                      <span>IEC Zone Classification:</span>
                      <span className="font-bold text-red-400">AC-4.3 (V-Fib Risk &gt;50%) ℹ️</span>
                    </div>
                  </div>
                </div>

                {/* Twin B: Protected with Class 0 Insulation Gloves */}
                <div className="p-3 bg-emerald-950/70 border-2 border-emerald-500/80 rounded-2xl flex flex-col justify-between text-left space-y-2 shadow-lg">
                  <div className="flex items-center justify-between border-b border-emerald-500/50 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> TWIN B: WITH CLASS 0 PPE GLOVES
                    </span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900 border border-emerald-500 text-emerald-200">
                      100% SAFE
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs text-emerald-100">
                    <div className="flex justify-between" title="ASTM D120 Class 0 Insulation Resistance ≥ 10 MΩ">
                      <span>Total Series Impedance:</span>
                      <span className="font-bold">10,001,350 Ω (10 MΩ Gloves) ℹ️</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-emerald-300">
                      <span>Body Current (I_B):</span>
                      <span>{protectedCurrentUA.toFixed(1)} µA ({protectedCurrentMA.toFixed(4)} mA)</span>
                    </div>
                    <div className="flex justify-between" title="IEC 60479-1 Zone AC-1 Imperceptible">
                      <span>IEC Zone Classification:</span>
                      <span className="font-bold text-emerald-400">AC-1 (Imperceptible & Safe) ℹ️</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frozen IEC Zone Chart Operating Point Replay */}
              <IECZoneChart
                currentMA={currentMA}
                durationMs={durationMs}
                isSimulating={false}
                shockPath={shockPath}
              />
            </div>
          )}

          {activeTab === 'rescue' && (
            <div className="space-y-4">
              <InteractiveRescueDrill onDrillComplete={() => {}} />
              <CPRMetronomeGame />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
