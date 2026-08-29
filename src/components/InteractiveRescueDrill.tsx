import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, PhoneCall, HeartPulse, ShieldAlert, CheckCircle2, AlertTriangle, Timer } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface InteractiveRescueDrillProps {
  onDrillComplete: (score: number, elapsedTimeSec: number) => void;
  className?: string;
}

interface StepOption {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  correctOrderIndex: number;
}

const DRILL_STEPS: StepOption[] = [
  {
    id: 'isolate_power',
    label: '1. ISOLATE POWER MAINS',
    desc: 'Switch off circuit breaker or disconnect main plug immediately.',
    icon: Zap,
    correctOrderIndex: 0
  },
  {
    id: 'touch_victim',
    label: '2. DO NOT TOUCH BAREHANDED',
    desc: 'Verify power is isolated before physical contact to prevent secondary shock.',
    icon: ShieldAlert,
    correctOrderIndex: 1
  },
  {
    id: 'call_emergency',
    label: '3. CALL EMERGENCY SERVICES',
    desc: 'Dial 911 / 112 / 108 immediately and state electrical shock incident.',
    icon: PhoneCall,
    correctOrderIndex: 2
  },
  {
    id: 'check_breathing',
    label: '4. CHECK BREATHING & PULSE',
    desc: 'Look for chest rise and feel carotid pulse for up to 10 seconds.',
    icon: Timer,
    correctOrderIndex: 3
  },
  {
    id: 'cpr_aed',
    label: '5. BEGIN CPR & APPLY AED',
    desc: 'Start 30:2 chest compressions and attach AED pads if unresponsive.',
    icon: HeartPulse,
    correctOrderIndex: 4
  }
];

export const InteractiveRescueDrill: React.FC<InteractiveRescueDrillProps> = ({
  onDrillComplete,
  className
}) => {
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [score, setScore] = useState<number>(1000);
  const [mistakeWarning, setMistakeWarning] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Timer ticker
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (!isFinished) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        setScore((prev) => Math.max(100, prev - 5)); // -5 pts per second elapsed
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isFinished]);

  const handleStepClick = (step: StepOption) => {
    if (completedStepIds.includes(step.id) || isFinished) return;

    const expectedIndex = completedStepIds.length;

    if (step.correctOrderIndex === expectedIndex) {
      // Correct step choice!
      const nextCompleted = [...completedStepIds, step.id];
      setCompletedStepIds(nextCompleted);
      setMistakeWarning(null);

      if (nextCompleted.length === DRILL_STEPS.length) {
        setIsFinished(true);
        onDrillComplete(score, elapsedSeconds);
      }
    } else {
      // Wrong step choice penalty!
      if (step.id === 'touch_victim' && !completedStepIds.includes('isolate_power')) {
        setMistakeWarning('🚨 CRITICAL MISTAKE! Never touch a victim before isolating power! Secondary shock incurred (-300 pts penalty).');
      } else {
        setMistakeWarning(`⚠️ Out of sequence! Perform step ${expectedIndex + 1} first (-100 pts penalty).`);
      }
      setScore((prev) => Math.max(100, prev - 150));
    }
  };

  return (
    <div className={cn('w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 shadow-2xl select-none', className)}>
      {/* Header with Rescue Timer & Live Score */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 font-sans">
            Interactive 5-Step Electrical Rescue Drill
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-300">
            TIME: <span className="text-amber-400 font-black">{elapsedSeconds}s</span>
          </span>
          <span className="text-xs font-mono font-bold text-slate-300">
            SCORE: <span className="text-emerald-400 font-black">{score} XP</span>
          </span>
        </div>
      </div>

      {/* Mistake Warning Alert */}
      <AnimatePresence>
        {mistakeWarning && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-2.5 bg-red-950/90 border-2 border-red-500 rounded-xl text-red-200 text-xs font-bold flex items-center gap-2 animate-pulse shadow-lg"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{mistakeWarning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5 Tappable Step Action Cards */}
      <div className="flex flex-col gap-2">
        {DRILL_STEPS.map((step) => {
          const isDone = completedStepIds.includes(step.id);
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepClick(step)}
              disabled={isDone || isFinished}
              className={cn(
                'w-full p-3 rounded-xl border-2 flex items-center gap-3 text-left transition-all cursor-pointer min-h-[52px]',
                isDone
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 cursor-default opacity-90'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700 hover:border-amber-400 text-slate-200 active:scale-[0.99]'
              )}
            >
              <div className={cn('p-2 rounded-lg shrink-0', isDone ? 'bg-emerald-900/80 text-emerald-300' : 'bg-slate-950 text-amber-400')}>
                {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Icon className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className={cn('text-xs sm:text-sm font-black uppercase tracking-wider font-sans truncate', isDone && 'line-through text-emerald-400')}>
                  {step.label}
                </span>
                <span className="text-[10px] sm:text-xs font-medium opacity-80 truncate leading-tight mt-0.5">
                  {step.desc}
                </span>
              </div>

              {isDone && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase px-2 py-0.5 rounded bg-emerald-950 border border-emerald-400 shrink-0">
                  PASSED ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Completion Banner */}
      {isFinished && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-3 bg-emerald-950/95 border-2 border-emerald-400 rounded-xl text-center flex flex-col items-center gap-1 shadow-[0_0_25px_rgba(16,185,129,0.5)]"
        >
          <span className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-300">
            RESCUE DRILL COMPLETED IN {elapsedSeconds} SECONDS!
          </span>
          <span className="text-xs font-mono font-bold text-emerald-200">
            Final Safety Score: {score} / 1000 XP — Power isolated safely before contact.
          </span>
        </motion.div>
      )}
    </div>
  );
};
