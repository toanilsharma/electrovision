/**
 * HomeGuardLearnShell.tsx
 * 
 * Presentation Layer 2: LEARN MODE (🎓 LEARN)
 * - Current UI minus Expert extras
 * - Guided lesson overlays: "Why did it trip?", "How RCCB saves lives", "The Copper Wire Rule"
 * - Clear pedagogical tips, no overwhelming engineering formulas
 */

import React, { useState, useMemo } from 'react';
import { IsometricHouseView } from './IsometricHouseView';
import { HomeGuardSLDView } from './HomeGuardSLDView';
import { DistributionBoard } from './DistributionBoard';
import { ToroidCoreVisualizer } from './ToroidCoreVisualizer';
import { DeathRaceView } from './DeathRaceView';
import { HOMEGUARD_PRESETS, HomeGuardPreset } from '../data/homeguardPresets';
import { BreakerConfigurationMode } from '../data/auditReportData';
import { MissionAssessmentState } from '../data/assessmentStorage';
import { CircuitStates, ScenarioProfile } from '../types/homeguard';
import { calculateCircuitPower } from '../utils/homeguardMeters';
import { cn } from '@/src/lib/utils';
import {
  Flame,
  Zap,
  Droplets,
  HeartPulse,
  AlertTriangle,
  Layers,
  Activity,
  Award,
  HelpCircle,
  Eye,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Lock,
  Unlock,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

export interface HomeGuardLearnShellProps {
  circuitStates: CircuitStates;
  selectedScenario: ScenarioProfile;
  selectedPreset: HomeGuardPreset;
  onSelectPreset: (preset: HomeGuardPreset) => void;
  breakerMode: BreakerConfigurationMode;
  onChangeBreakerMode: (mode: BreakerConfigurationMode) => void;
  activeApplianceIds: string[];
  onToggleAppliance: (applianceId: string) => void;
  isXRay: boolean;
  onToggleXRay: () => void;
  isDaisyChainActive: boolean;
  onToggleDaisyChain: () => void;
  onSafeRecloseBreaker: (circuitId: string) => void;
  onSafeTestTripRCCB: () => void;
  assessmentState: MissionAssessmentState;
  onResetProgress?: () => void;
  habitTip: { type: 'warn' | 'success'; text: string } | null;
  livingCountdownSec: number;
  leakageCurrentMA: number;
  onOpenCertificateModal: () => void;
}

export const HomeGuardLearnShell: React.FC<HomeGuardLearnShellProps> = ({
  circuitStates,
  selectedScenario,
  selectedPreset,
  onSelectPreset,
  breakerMode,
  onChangeBreakerMode,
  activeApplianceIds,
  onToggleAppliance,
  isXRay,
  onToggleXRay,
  isDaisyChainActive,
  onToggleDaisyChain,
  onSafeRecloseBreaker,
  onSafeTestTripRCCB,
  assessmentState,
  onResetProgress,
  habitTip,
  livingCountdownSec,
  leakageCurrentMA,
  onOpenCertificateModal
}) => {
  const [viewMode, setViewMode] = useState<'house' | 'sld' | 'toroid' | 'db_box' | 'death_race'>('house');
  const [activeLessonTab, setActiveLessonTab] = useState<'why_trip' | 'science' | 'prevention'>('why_trip');
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightOpen, setIsRightOpen] = useState<boolean>(false);

  // X-ray Vision Unlock: Death Race unlocks after lesson 4 (CHILD SHOCK), Inside-RCCB/DB after lesson 5 (WET BATH)
  const isDeathRaceUnlocked = assessmentState.completedPresetIds.includes('preset_child_shock');
  const isAdvancedViewsUnlocked = assessmentState.completedPresetIds.includes('preset_wet_bath');

  const c2State = circuitStates.c2_living_sockets;
  const rccbState = circuitStates.main_rccb;
  const isTripped = c2State.state !== 'CLOSED' || rccbState.state !== 'CLOSED';
  const isShortCircuit = selectedScenario.faultType === 'short_circuit' && !isTripped;
  const isOverloaded = selectedScenario.faultType === 'thermal_overload' && !isTripped;

  // Single Source of Truth for Electrical Calculations: I = P / V
  const metrics = useMemo(() => calculateCircuitPower(activeApplianceIds), [activeApplianceIds]);
  const livingRoomWatts = metrics.totalWatts;
  const livingRoomCurrent = isTripped ? 0 : metrics.currentAmps;
  const wattPercentage = metrics.percentage;

  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col font-sans select-none overflow-hidden relative dark:bg-slate-950 bg-slate-900 dark:text-slate-100 text-slate-100">
      
      {/* Real-Life Safety Habit Feedback Banner (Rendered in FIXED floating overlay slot so it NEVER pushes tabs) */}
      {habitTip && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className={cn(
            "px-4 py-1.5 text-xs font-bold text-center border rounded-full flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150 shadow-xl pointer-events-auto",
            habitTip.type === 'warn'
              ? "bg-amber-950/95 text-amber-200 border-amber-500 shadow-amber-950/50"
              : "bg-emerald-950/95 text-emerald-200 border-emerald-500 shadow-emerald-950/50"
          )}>
            <span>{habitTip.text}</span>
          </div>
        </div>
      )}

      {/* 3-Column Layout adapted for Students & Learners: Maximized Visuals */}
      <div className="flex-1 min-h-0 w-full h-full flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Column: 5 Guided Scenarios (Collapsible & Compact) */}
        <aside className={cn(
          "shrink-0 h-full overflow-hidden bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between select-none transition-all duration-300 z-20",
          isLeftCollapsed
            ? "w-0 p-0 border-r-0 opacity-0 pointer-events-none"
            : "w-full lg:w-56 p-1.5 sm:p-2"
        )}>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-cyan-400 flex items-center gap-1 uppercase tracking-wider">
                <BookOpen className="w-3 h-3" />
                MISSIONS
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded-full border border-amber-800">
                  {assessmentState.completedPresetIds.length}/5
                </span>
                {assessmentState.completedPresetIds.length > 0 && onResetProgress && (
                  <button
                    type="button"
                    onClick={onResetProgress}
                    className="text-[9px] text-slate-400 hover:text-rose-300 underline cursor-pointer"
                    title="Clear completed badges"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-220px)]">
              {HOMEGUARD_PRESETS.map((preset, idx) => {
                const isSelected = selectedPreset.id === preset.id;
                const isPassed = assessmentState.completedPresetIds.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    className={cn(
                      "w-full text-left p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1.5",
                      isSelected
                        ? "bg-cyan-950/90 border-cyan-400 text-white shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-750 text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                        {preset.chipLabel === 'NORMAL' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                        {preset.chipLabel === 'OVERLOAD' && <Flame className="w-3 h-3 text-amber-400" />}
                        {preset.chipLabel === 'SHORT' && <Zap className="w-3 h-3 text-rose-400" />}
                        {preset.chipLabel === 'CHILD SHOCK' && <HeartPulse className="w-3 h-3 text-rose-400" />}
                        {preset.chipLabel === 'WET BATH' && <Droplets className="w-3 h-3 text-cyan-400" />}
                        {preset.chipLabel === 'BROKEN EARTH' && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <div className="text-[10px] font-bold truncate">
                          {idx + 1}. {preset.chipLabel}
                        </div>
                        <div className="text-[8.5px] text-slate-400 truncate">
                          {preset.id === 'preset_normal' && 'Safe power flow'}
                          {preset.id === 'preset_overload' && 'Thermal overload'}
                          {preset.id === 'preset_short' && 'Instant trip'}
                          {preset.id === 'preset_child_shock' && '0.03s RCCB trip'}
                          {preset.id === 'preset_wet_bath' && 'Water leakage'}
                          {preset.id === 'preset_broken_earth' && 'Old ELCB trap'}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-cyan-400 text-slate-950 shrink-0 shadow-sm">
                        ACTIVE
                      </span>
                    ) : isPassed ? (
                      <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1 py-0.5 rounded shrink-0">
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Breaker Controls */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              Safety Switch Control
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onSafeRecloseBreaker('c2_living_sockets')}
                className={cn(
                  "p-2 rounded-xl text-center font-bold text-xs flex flex-col items-center justify-center border shadow-sm transition-all cursor-pointer",
                  isTripped
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 animate-pulse"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                )}
              >
                <span>Push Switch UP</span>
                <span className="text-[9px] font-normal opacity-80">Reset Power</span>
              </button>

              <button
                type="button"
                onClick={onSafeTestTripRCCB}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs text-center border border-amber-400 shadow-sm transition-all cursor-pointer flex flex-col items-center justify-center"
              >
                <span>Test 'T' Button</span>
                <span className="text-[9px] font-normal opacity-80">Check Monthly</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Center: Stage with Mode Toggle (Maximized Viewport) */}
        <main className="flex-1 h-full min-w-0 flex flex-col bg-slate-950 relative overflow-hidden">
          {/* Visual Mode Navigation Bar */}
          <div className="h-9 shrink-0 px-2 sm:px-3 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-1.5 z-20">
            {/* Left: Collapse Sidebar & Visual Mode Switchers */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsLeftCollapsed(v => !v)}
                className="p-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                title={isLeftCollapsed ? "Show Missions Rail" : "Hide Missions Rail (More Room for Visuals)"}
              >
                {isLeftCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5 text-cyan-400" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('house')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1",
                    viewMode === 'house' ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Layers className="w-3 h-3" />
                  <span>House View</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('sld')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1",
                    viewMode === 'sld' ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Zap className="w-3 h-3" />
                  <span>Flow SLD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('toroid')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1",
                    viewMode === 'toroid' ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Activity className="w-3 h-3" />
                  <span className="hidden sm:inline">Inside RCCB</span>
                </button>

                {/* Death Race — Unlocked after lesson 4 (Child Shock) */}
                <button
                  type="button"
                  onClick={() => isDeathRaceUnlocked && setViewMode('death_race')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                    !isDeathRaceUnlocked
                      ? "text-slate-600 cursor-not-allowed opacity-60"
                      : viewMode === 'death_race'
                      ? "bg-rose-600 text-white font-bold cursor-pointer"
                      : "text-slate-400 hover:text-white cursor-pointer"
                  )}
                  title={isDeathRaceUnlocked ? 'Death Race View' : '🔒 Complete Lesson 4 (Child Shock) to unlock'}
                >
                  {isDeathRaceUnlocked ? <Unlock className="w-2.5 h-2.5 text-emerald-400" /> : <Lock className="w-2.5 h-2.5" />}
                  <span className="hidden sm:inline">Death Race</span>
                </button>

                {/* DB Fuse Box — Unlocked after lesson 5 (Wet Bath) */}
                <button
                  type="button"
                  onClick={() => isAdvancedViewsUnlocked && setViewMode('db_box')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                    !isAdvancedViewsUnlocked
                      ? "text-slate-600 cursor-not-allowed opacity-60"
                      : viewMode === 'db_box'
                      ? "bg-orange-500 text-slate-950 font-bold cursor-pointer"
                      : "text-slate-400 hover:text-white cursor-pointer"
                  )}
                  title={isAdvancedViewsUnlocked ? 'DB Fuse Box View' : '🔒 Complete Lesson 5 (Wet Bath) to unlock'}
                >
                  {isAdvancedViewsUnlocked ? <Unlock className="w-2.5 h-2.5 text-emerald-400" /> : <Lock className="w-2.5 h-2.5" />}
                  <span className="hidden sm:inline">DB Box</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onToggleXRay}
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border",
                  isXRay ? "bg-cyan-950 text-cyan-300 border-cyan-700 shadow-sm" : "bg-slate-800 text-slate-400 border-slate-700"
                )}
                title="Toggle In-Wall Wires X-Ray"
              >
                <span>Wires 👁</span>
              </button>
            </div>

            {/* Center Status Pill */}
            <div className={cn(
              "hidden xl:flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
              isTripped ? "bg-rose-950/80 text-rose-300 border-rose-500 animate-pulse" :
              isOverloaded ? "bg-amber-950/80 text-amber-300 border-amber-500 animate-pulse" :
              "bg-emerald-950/80 text-emerald-300 border-emerald-500"
            )}>
              {isTripped ? <ShieldAlert className="w-3 h-3 text-rose-400" /> : <ShieldCheck className="w-3 h-3 text-emerald-400" />}
              <span>{isTripped ? "Tripped (Protected)" : isOverloaded ? "Overloaded" : "Power Safe"}</span>
            </div>

            {/* Right: Lesson Guide & Maximize Canvas Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsRightOpen(v => !v)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border shadow-sm",
                  isRightOpen
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-amber-950/40"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:text-amber-300 hover:border-slate-750"
                )}
                title="Toggle Lesson Guide & Deep Dive"
              >
                <BookOpen className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Lesson Guide</span>
                {isRightOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isLeftCollapsed || isRightOpen) {
                    setIsLeftCollapsed(true);
                    setIsRightOpen(false);
                  } else {
                    setIsLeftCollapsed(false);
                  }
                }}
                className={cn(
                  "p-1 rounded-lg border transition-colors cursor-pointer",
                  isLeftCollapsed && !isRightOpen
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                )}
                title={isLeftCollapsed && !isRightOpen ? "Restore Sidebars" : "Maximize Diagram (Full Screen Canvas)"}
              >
                {isLeftCollapsed && !isRightOpen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Visual Canvas: Maximum Real Estate */}
          <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden flex items-center justify-center p-0.5">
            {viewMode === 'house' && (
              <IsometricHouseView
                isXRay={isXRay}
                onToggleXRay={onToggleXRay}
                circuitStates={circuitStates}
                activeApplianceIds={activeApplianceIds}
                onToggleAppliance={onToggleAppliance}
                isTripped={isTripped}
                isShortCircuit={isShortCircuit}
                isOverloaded={isOverloaded}
                scenarioId={selectedScenario.id}
                onOpenDBBox={() => setViewMode('db_box')}
                isDaisyChainActive={isDaisyChainActive}
                onToggleDaisyChain={onToggleDaisyChain}
                className="w-full h-full rounded-2xl overflow-hidden"
              />
            )}

            {viewMode === 'sld' && (
              <div className="w-full h-full p-2 overflow-hidden flex flex-col">
                <HomeGuardSLDView
                  circuitStates={circuitStates}
                  activeApplianceIds={activeApplianceIds}
                  isTripped={isTripped}
                  isShortCircuit={isShortCircuit}
                  isOverloaded={isOverloaded}
                  scenarioId={selectedScenario.id}
                  onRecloseBreaker={onSafeRecloseBreaker}
                  onTestTripRCCB={onSafeTestTripRCCB}
                  className="flex-1 w-full h-full overflow-hidden"
                />
              </div>
            )}

            {viewMode === 'toroid' && (
              <div className="w-full h-full p-2 overflow-hidden flex flex-col">
                <ToroidCoreVisualizer
                  initialLeakageMA={selectedScenario.leakageCurrentMA}
                  rccbRatingMA={30}
                  isExternalTripped={rccbState.state !== 'CLOSED'}
                  onTrip={onSafeTestTripRCCB}
                  className="flex-1 w-full h-full overflow-hidden"
                />
              </div>
            )}

            {viewMode === 'db_box' && (
              <div className="w-full h-full p-2 overflow-hidden flex flex-col">
                <DistributionBoard
                  circuitStates={circuitStates}
                  onRecloseBreaker={onSafeRecloseBreaker}
                  onTestTripRCCB={onSafeTestTripRCCB}
                  leakageCurrentMA={leakageCurrentMA}
                  className="flex-1 w-full h-full overflow-hidden"
                />
              </div>
            )}

            {viewMode === 'death_race' && isDeathRaceUnlocked && (
              <div className="w-full h-full overflow-hidden flex flex-col">
                <DeathRaceView
                  onExit={() => setViewMode('house')}
                  className="h-full w-full overflow-hidden"
                />
              </div>
            )}
          </div>
        </main>

        {/* Right: Lesson Overlays ("Why did it trip?") - Collapsible to Maximize Visuals */}
        <aside className={cn(
          "shrink-0 h-full overflow-hidden bg-slate-900/95 border-l border-slate-800 flex flex-col justify-between select-none transition-all duration-300 z-20",
          !isRightOpen
            ? "w-0 p-0 border-l-0 opacity-0 pointer-events-none"
            : "w-full lg:w-72 xl:w-80 p-2.5 sm:p-3"
        )}>
          <div className="space-y-2.5">
            {/* Header with Close button */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                LESSON GUIDE
              </span>
              <button
                type="button"
                onClick={() => setIsRightOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                title="Close Lesson Guide (Maximize Visuals)"
              >
                ✕
              </button>
            </div>

            {/* Status Card */}
            <div className={cn(
              "p-2.5 rounded-xl border flex flex-col gap-1 shadow-md",
              isTripped
                ? "bg-rose-950/70 border-rose-500 text-rose-100"
                : isOverloaded
                ? "bg-amber-950/70 border-amber-500 text-amber-100"
                : "bg-emerald-950/70 border-emerald-500 text-emerald-100"
            )}>
              <div className="flex items-center gap-2" role="status" aria-live="polite">
                {isTripped ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <span className="font-black text-sm">
                  {isTripped ? '⚡ Breaker Tripped (Protected!)' : '🛡️ Safe Working State'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                {isTripped
                  ? 'The safety mechanism sensed the fault and broke the circuit before any fire or harm could occur.'
                  : 'Power is flowing normally. Live current is balanced and well below maximum capacity.'}
              </p>
            </div>

            {/* Guided Lesson Tabbed Box (Replace-after-fade, no overlapping texts) */}
            <div key={selectedScenario.id} className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  LESSON DEEP DIVE
                </span>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setActiveLessonTab('why_trip')}
                    className={cn("px-2 py-0.5 rounded cursor-pointer", activeLessonTab === 'why_trip' ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-400")}
                  >
                    Why Trip?
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLessonTab('science')}
                    className={cn("px-2 py-0.5 rounded cursor-pointer", activeLessonTab === 'science' ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-400")}
                  >
                    Physics
                  </button>
                </div>
              </div>

              {activeLessonTab === 'why_trip' && (
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="leading-relaxed">
                    {selectedScenario.plainEnglishExplanation}
                  </p>
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200">
                    <strong className="block text-amber-300 mb-0.5">Golden Safety Habit:</strong>
                    {selectedScenario.recommendation}
                  </div>
                </div>
              )}

              {activeLessonTab === 'science' && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  {selectedPreset.id === 'preset_overload' && (
                    <p>The bimetallic strip inside bends when hot. If 16A is exceeded, heat builds up slowly over seconds until the latch snaps open.</p>
                  )}
                  {selectedPreset.id === 'preset_short' && (
                    <p>A short circuit creates hundreds of amps in less than 3 milliseconds. A magnetic solenoid acts like a super-magnet that instantly fires the trip plunger.</p>
                  )}
                  {selectedPreset.id === 'preset_child_shock' && (
                    <p>The RCCB compares live current going into the house vs returning current. If even 30mA escapes into earth or a body, the magnetic core balance is broken and trips in 0.03 seconds.</p>
                  )}
                  {selectedPreset.id === 'preset_wet_bath' && (
                    <p>Water conducts stray electricity into flooring tiles. The RCCB senses this leak immediately, saving bathers from dangerous paralysis.</p>
                  )}
                  {selectedPreset.id === 'preset_broken_earth' && (
                    <p>Old 1980s v-ELCBs depended on the green ground wire. If that wire got severed, they could never trip! Modern RCCBs protect you regardless of broken grounds.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Badge / Award Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenCertificateModal}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-transform active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>View Family Electrical Safety Certificate</span>
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
};
