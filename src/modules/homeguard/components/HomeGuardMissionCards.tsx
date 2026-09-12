/**
 * HomeGuard Mission Cards Component (HG6)
 * 
 * Interactive Mission Card panel:
 * - Scenario chips: OVERLOAD, SHORT, CHILD SHOCK, WET BATH, BROKEN EARTH.
 * - EXPECTED / OBSERVED stamps for each mission.
 * - Score accumulation feeding into the assessment engine.
 * - Link to Residential Safety Certification Exam.
 */

import React, { useState, useEffect } from 'react';
import { HOMEGUARD_PRESETS, HomeGuardPreset } from '../data/homeguardPresets';
import { loadAssessmentState, recordMissionPassed, MissionAssessmentState } from '../data/assessmentStorage';
import { CircuitState } from '../hooks/useHomeGuardEngine';
import { MCBState, TripCause } from '@/src/mcb/types';
import { cn } from '@/src/lib/utils';
import {
  Target,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Award,
  Zap,
  GraduationCap,
  Clock,
  RotateCcw,
  Flame,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export interface HomeGuardMissionCardsProps {
  selectedPreset: HomeGuardPreset;
  onSelectPreset: (preset: HomeGuardPreset) => void;
  circuitStates: Record<string, CircuitState>;
  livingCountdownSec: number;
  timeLapseSpeed: number;
  onFastForward?: () => void;
  onOpenAssessmentExam?: () => void;
  className?: string;
}

export const HomeGuardMissionCards: React.FC<HomeGuardMissionCardsProps> = ({
  selectedPreset,
  onSelectPreset,
  circuitStates,
  livingCountdownSec,
  timeLapseSpeed,
  onFastForward,
  onOpenAssessmentExam,
  className
}) => {
  const [assessmentState, setAssessmentState] = useState<MissionAssessmentState>(() => loadAssessmentState());

  const c2State = circuitStates.c2_living_sockets;
  const rccbState = circuitStates.main_rccb;

  const currentIndex = HOMEGUARD_PRESETS.findIndex(p => p.id === selectedPreset.id);

  // Determine if active mission is currently completed / tripped
  const isMissionActivePassed = React.useMemo(() => {
    switch (selectedPreset.id) {
      case 'preset_overload':
        return c2State.state !== MCBState.CLOSED && c2State.tripCause === TripCause.THERMAL;
      case 'preset_short':
        return c2State.state !== MCBState.CLOSED && (c2State.tripCause === TripCause.MAGNETIC || c2State.tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE);
      case 'preset_child_shock':
        return rccbState.state !== MCBState.CLOSED;
      case 'preset_wet_bath':
        return rccbState.state !== MCBState.CLOSED;
      case 'preset_broken_earth':
        return rccbState.state !== MCBState.CLOSED;
      default:
        return false;
    }
  }, [selectedPreset.id, c2State.state, c2State.tripCause, rccbState.state]);

  // Compute live observed stamp text
  const observedStampText = React.useMemo(() => {
    if (isMissionActivePassed) {
      switch (selectedPreset.id) {
        case 'preset_overload':
          return 'OBSERVED: ✅ PASS (C16 Bimetal Tripped)';
        case 'preset_short':
          return 'OBSERVED: ✅ PASS (Magnetic Instantaneous Trip)';
        case 'preset_child_shock':
          return 'OBSERVED: ✅ PASS (30mA RCCB Tripped in ≤40ms)';
        case 'preset_wet_bath':
          return 'OBSERVED: ✅ PASS (45mA Leakage Cleared)';
        case 'preset_broken_earth':
          return 'OBSERVED: ✅ PASS (RCCB Protected Casing Fault)';
        default:
          return 'OBSERVED: ✅ PASS (Tripped)';
      }
    }

    // Still running / monitoring
    if (selectedPreset.id === 'preset_overload' && c2State.currentAmps > 16) {
      return `OBSERVED: ⏳ HEATING BIMETAL (${livingCountdownSec.toFixed(1)}s left)`;
    }

    return 'OBSERVED: STANDBY (READY)';
  }, [isMissionActivePassed, selectedPreset.id, c2State.currentAmps, livingCountdownSec]);

  // Automatically record mission score when passed
  useEffect(() => {
    if (isMissionActivePassed && !assessmentState.completedPresetIds.includes(selectedPreset.id)) {
      const updated = recordMissionPassed(selectedPreset.id, selectedPreset.pointsAwarded, observedStampText);
      setAssessmentState(updated);
    }
  }, [isMissionActivePassed, selectedPreset.id, selectedPreset.pointsAwarded, observedStampText, assessmentState.completedPresetIds]);

  const handleNextMission = () => {
    const nextIdx = (currentIndex + 1) % HOMEGUARD_PRESETS.length;
    onSelectPreset(HOMEGUARD_PRESETS[nextIdx]);
  };

  return (
    <div className={cn(
      "flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-100 shadow-xl select-none",
      className
    )}>
      {/* 1. SCENARIO CHIPS ROW */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px] uppercase">
            <Target className="w-3.5 h-3.5 text-cyan-400" /> SCENARIO PRESETS:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {HOMEGUARD_PRESETS.map((preset, idx) => {
              const isSelected = preset.id === selectedPreset.id;
              const isDone = assessmentState.completedPresetIds.includes(preset.id);

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer shrink-0 border flex items-center gap-1",
                    isSelected
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                      : isDone
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-600 hover:border-emerald-400"
                      : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                  )}
                >
                  {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  <span>{preset.chipLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assessment Score Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 text-[11px] font-bold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>SCORE: {assessmentState.totalScore} / {assessmentState.maxScore} PTS</span>
          </div>

          {onOpenAssessmentExam && (
            <button
              type="button"
              onClick={onOpenAssessmentExam}
              className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-colors shadow"
              title="Open the Residential Safety Certification Exam"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CERTIFICATION EXAM</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ACTIVE MISSION CARD */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
        {/* Title & Goal */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-black text-white flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
                MISSION {currentIndex + 1} OF 5
              </span>
              <span>{selectedPreset.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5 leading-relaxed">
              {selectedPreset.description}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
              +{selectedPreset.pointsAwarded} PTS
            </span>
          </div>
        </div>

        {/* EXPECTED vs OBSERVED STAMPS MATRIX */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          
          {/* EXPECTED STAMP */}
          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center shrink-0">
              <Target className="w-3 h-3 text-cyan-400" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-bold">Standard Criteria</div>
              <div className="text-xs font-black text-cyan-300 font-mono">
                {selectedPreset.expectedStampText}
              </div>
            </div>
          </div>

          {/* OBSERVED STAMP */}
          <div className={cn(
            "p-2 rounded-lg border flex items-center gap-2 transition-all",
            isMissionActivePassed
              ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              : "bg-slate-900/90 border-slate-800 text-slate-300"
          )}>
            <div className={cn(
              "w-5 h-5 rounded flex items-center justify-center shrink-0",
              isMissionActivePassed ? "bg-emerald-500/20 border border-emerald-400" : "bg-slate-800"
            )}>
              {isMissionActivePassed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Clock className="w-3 h-3 text-slate-400" />
              )}
            </div>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-bold">Live Simulation Result</div>
              <div className={cn(
                "text-xs font-black font-mono",
                isMissionActivePassed ? "text-emerald-300" : "text-amber-400"
              )}>
                {observedStampText}
              </div>
            </div>
          </div>
        </div>

        {/* Mission Action Buttons */}
        <div className="flex items-center justify-between pt-1 text-[11px] gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectPreset(selectedPreset)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 transition-all shadow cursor-pointer min-h-[32px]"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>LOAD & RUN MISSION</span>
            </button>

            {selectedPreset.id === 'preset_overload' && !isMissionActivePassed && onFastForward && (
              <button
                type="button"
                onClick={onFastForward}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer min-h-[32px]"
              >
                <span>Fast-Forward (100×)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-sans">
              Rank: <strong className="text-white">{assessmentState.rankTitle}</strong>
            </span>
            <button
              type="button"
              onClick={handleNextMission}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors min-h-[32px]"
            >
              <span>Next Mission</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
