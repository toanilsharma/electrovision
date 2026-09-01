import React, { useState } from 'react';
import { EXPERIMENT_LAB_PRESETS, ExperimentPreset } from './ExperimentLabPresets';
import { MCBState, TripCause } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { FlaskConical, CheckCircle2, ChevronRight, HelpCircle, Sparkles, Target, ArrowRight } from 'lucide-react';

interface MissionCardsLabProps {
  selectedExperiment: ExperimentPreset;
  onSelectExperiment: (exp: ExperimentPreset) => void;
  state: MCBState;
  tripCause: TripCause;
  className?: string;
}

export const MissionCardsLab: React.FC<MissionCardsLabProps> = ({
  selectedExperiment,
  onSelectExperiment,
  state,
  tripCause,
  className
}) => {
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>({});
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const currentIndex = EXPERIMENT_LAB_PRESETS.findIndex(p => p.id === selectedExperiment.id);
  const isTripped = state !== MCBState.CLOSED;

  // Check if current mission is completed
  React.useEffect(() => {
    if (isTripped || (selectedExperiment.id === 'exp1_limits' && state === MCBState.CLOSED)) {
      setCompletedMissions(prev => ({ ...prev, [selectedExperiment.id]: true }));
    }
  }, [isTripped, state, selectedExperiment.id]);

  const handleNextMission = () => {
    const nextIdx = (currentIndex + 1) % EXPERIMENT_LAB_PRESETS.length;
    onSelectExperiment(EXPERIMENT_LAB_PRESETS[nextIdx]);
  };

  const handlePrevMission = () => {
    const prevIdx = (currentIndex - 1 + EXPERIMENT_LAB_PRESETS.length) % EXPERIMENT_LAB_PRESETS.length;
    onSelectExperiment(EXPERIMENT_LAB_PRESETS[prevIdx]);
  };

  return (
    <div className={cn("p-2.5 bg-slate-950 border border-sky-500/40 rounded-xl space-y-2 font-mono text-xs select-none", className)}>
      
      {/* Header & Progress Dots */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-sky-400 font-black uppercase">
          <Target className="w-3.5 h-3.5 text-sky-400" />
          <span>Mission Lab ({currentIndex + 1}/{EXPERIMENT_LAB_PRESETS.length})</span>
        </div>

        {/* Micro-Tooltip Help Icon */}
        <div className="relative">
          <button
            onClick={() => setShowTooltip(t => !t)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-sky-400 p-0.5 cursor-pointer"
            title="Mission Guidance Info"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {showTooltip && (
            <div className="absolute right-0 top-6 z-50 w-56 p-2 rounded-lg bg-slate-900 border border-sky-500 text-[10px] text-sky-200 shadow-2xl pointer-events-none">
              Load automated test missions to verify IEC 60898-1 breaker performance curves and limits in seconds.
            </div>
          )}
        </div>
      </div>

      {/* Progress Dots Track */}
      <div className="flex items-center justify-between gap-1 px-1">
        {EXPERIMENT_LAB_PRESETS.map((exp, idx) => {
          const isSelected = exp.id === selectedExperiment.id;
          const isDone = completedMissions[exp.id];

          return (
            <button
              key={exp.id}
              onClick={() => onSelectExperiment(exp)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all cursor-pointer",
                isSelected
                  ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                  : isDone
                  ? "bg-emerald-500"
                  : "bg-slate-800 hover:bg-slate-700"
              )}
              title={exp.title}
            />
          );
        })}
      </div>

      {/* Active Mission Card */}
      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
        <div className="text-[11px] font-black text-white leading-tight">
          {selectedExperiment.title}
        </div>

        <div className="text-[10px] text-slate-400 leading-snug">
          {selectedExperiment.oneLiner}
        </div>

        {/* Expected vs Observed Verdict Badges */}
        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
          <span className="flex items-center gap-1 font-bold text-slate-300">
            EXPECTED: <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold">{selectedExperiment.expectedVerdict}</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-slate-300">
            OBSERVED: <span className={cn("px-1.5 py-0.5 rounded font-extrabold", isTripped ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400")}>
              {isTripped ? 'TRIPPED' : 'PASS'}
            </span>
          </span>
        </div>
      </div>

      {/* Navigation Buttons: LOAD MISSION / NEXT MISSION */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onSelectExperiment(selectedExperiment)}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer min-h-[34px]"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          LOAD MISSION
        </button>

        <button
          onClick={handleNextMission}
          className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-750 hover:bg-slate-800 text-slate-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[34px]"
          title="Next Mission"
        >
          <span>Next</span> <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
