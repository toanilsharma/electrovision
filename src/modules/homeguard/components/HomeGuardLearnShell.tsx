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
import { ApplianceControlDock } from './ApplianceControlDock';
import { ApplianceDiscoveryCue } from './ApplianceDiscoveryCue';
import { HousePowerStatusBanner } from './HousePowerStatusBanner';
import { DistributionBoardDrawer } from './DistributionBoardDrawer';
import { HOMEGUARD_APPLIANCES } from '../data/homeguardAppliances';
import { HOMEGUARD_PRESETS, HomeGuardPreset } from '../data/homeguardPresets';
import { BreakerConfigurationMode } from '../data/auditReportData';
import { MissionAssessmentState } from '../data/assessmentStorage';
import { CircuitStates, ScenarioProfile } from '../types/homeguard';
import { HomeGuardKirchhoffTelemetry } from './HomeGuardKirchhoffTelemetry';
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
  Minimize2,
  RotateCcw
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
  const [isDBDrawerOpen, setIsDBDrawerOpen] = useState<boolean>(false);
  const [toroidLeakageMA, setToroidLeakageMA] = useState<number>(0);
  const [leftTab, setLeftTab] = useState<'all' | 'presets' | 'appliances'>('all');
  const [applianceRoomFilter, setApplianceRoomFilter] = useState<'all' | 'living' | 'kitchen' | 'bathroom' | 'bedroom'>('all');

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
      
      {/* Real-Life Safety Habit Feedback Banner (Rendered in FIXED floating overlay slot on top-right) */}
      {habitTip && (
        <div className="absolute top-2 right-4 sm:right-6 z-50 pointer-events-none">
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
        
        {/* Left Column: All Controls & Inputs (Presets + Appliance Switchboard + Breakers) */}
        <aside className={cn(
          "shrink-0 h-full overflow-hidden bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between select-none transition-all duration-300 z-20",
          isLeftCollapsed
            ? "w-0 p-0 border-r-0 opacity-0 pointer-events-none"
            : "w-full lg:w-72 xl:w-80 p-2 sm:p-2.5"
        )}>
          {viewMode === 'toroid' ? (
            /* ============================================================== */
            /* SMART RCCB CONTROLLER (NO SCROLLERS, CLEAN & FOCUSED)          */
            /* ============================================================== */
            <div className="flex-1 flex flex-col justify-between space-y-2 select-none overflow-hidden">
              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex items-center gap-2 px-1 pb-1.5 border-b border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">RCCB CONTROLLER</h4>
                    <span className="text-[10px] text-slate-400">Inject fault & test trip</span>
                  </div>
                </div>

                {/* Breaker State Lever */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    BREAKER SWITCH LEVER
                  </span>
                  {rccbState.state !== 'CLOSED' ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSafeRecloseBreaker('c2_living_sockets');
                        setToroidLeakageMA(0);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 animate-bounce cursor-pointer shadow-lg shadow-emerald-500/40"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>⬆ PUSH LEVER UP (RESET)</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ARMED [I] (CLOSED)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setToroidLeakageMA(35);
                          onSafeTestTripRCCB();
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 font-black text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Internal test button across 3.3kΩ resistor"
                      >
                        <Zap className="w-3 h-3 text-rose-400" />
                        <span>TEST 'T'</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Fault Injection (4 Smart Buttons) */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    INJECT EARTH LEAKAGE (IΔ)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setToroidLeakageMA(0);
                        if (rccbState.state !== 'CLOSED') onSafeRecloseBreaker('c2_living_sockets');
                      }}
                      className={cn(
                        "p-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer text-center",
                        toroidLeakageMA === 0 && rccbState.state === 'CLOSED'
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                      )}
                    >
                      🟢 0 mA (Normal)
                    </button>

                    <button
                      type="button"
                      onClick={() => setToroidLeakageMA(15)}
                      className={cn(
                        "p-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer text-center",
                        toroidLeakageMA === 15 && rccbState.state === 'CLOSED'
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                      )}
                      title="15mA leakage below 30mA threshold - safe no-trip"
                    >
                      🟡 15 mA (Safe)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setToroidLeakageMA(35);
                        if (rccbState.state !== 'CLOSED') onSafeRecloseBreaker('c2_living_sockets');
                      }}
                      className={cn(
                        "p-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer text-center",
                        toroidLeakageMA === 35
                          ? "bg-rose-600 text-white border-rose-500 font-black shadow-[0_0_12px_rgba(225,29,72,0.5)]"
                          : "bg-slate-900 text-rose-300 border-rose-900/60 hover:bg-slate-800"
                      )}
                      title="35mA human contact - causes 28ms magnetic trip"
                    >
                      🔴 35 mA (Trip!)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setToroidLeakageMA(150);
                        if (rccbState.state !== 'CLOSED') onSafeRecloseBreaker('c2_living_sockets');
                      }}
                      className={cn(
                        "p-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer text-center",
                        toroidLeakageMA === 150
                          ? "bg-purple-600 text-white border-purple-500 font-black shadow"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                      )}
                      title="150mA direct bolted contact"
                    >
                      ⚡ 150 mA (Direct)
                    </button>
                  </div>

                  {/* Slider Control */}
                  <div className="pt-1 flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="5"
                      value={toroidLeakageMA}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setToroidLeakageMA(val);
                      }}
                      className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <span className={cn(
                      "font-mono font-bold text-[11px] min-w-[50px] text-right",
                      toroidLeakageMA >= 30 ? "text-rose-400" : toroidLeakageMA > 0 ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {toroidLeakageMA} mA
                    </span>
                  </div>
                </div>
              </div>

              {/* Physics Principle Card */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 space-y-1">
                <div className="font-bold text-cyan-400 uppercase tracking-wide">HOW IT WORKS</div>
                <p className="leading-snug text-slate-400 font-sans">
                  The toroid ring compares Going current with Return current. When the difference is ≥ 30mA, the trip coil cancels the holding magnet and snaps power open in ≤ 0.03s!
                </p>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* STANDARD HOMEGUARD PRESETS & APPLIANCES (NO SCROLLERS)         */
            /* ============================================================== */
            /* ============================================================== */
            /* STANDARD HOMEGUARD ALL CONTROLS (ZERO SCROLLERS, SMART LAYOUT) */
            /* ============================================================== */
            <div className="flex flex-col flex-1 min-h-0 justify-between space-y-1 overflow-hidden">
              
              {/* Top View Filter Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold shrink-0 shadow-inner">
                <button
                  type="button"
                  onClick={() => setLeftTab('all')}
                  className={cn(
                    "flex-1 py-1 px-1 rounded transition-all cursor-pointer flex items-center justify-center gap-1 text-[9.5px]",
                    leftTab === 'all' ? "bg-cyan-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  <span>🎛️ All Inputs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab('presets')}
                  className={cn(
                    "flex-1 py-1 px-1 rounded transition-all cursor-pointer flex items-center justify-center gap-1 text-[9.5px]",
                    leftTab === 'presets' ? "bg-cyan-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  <span>🎯 Presets (6)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab('appliances')}
                  className={cn(
                    "flex-1 py-1 px-1 rounded transition-all cursor-pointer flex items-center justify-center gap-1 text-[9.5px]",
                    leftTab === 'appliances' ? "bg-cyan-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  <span>🔌 Loads ({activeApplianceIds.length})</span>
                </button>
              </div>

              {/* ── MODE 1: ALL-IN-ONE COMPACT CONSOLE (NO SCROLLING) ── */}
              {leftTab === 'all' && (
                <div className="flex-1 min-h-0 flex flex-col justify-between space-y-1 overflow-hidden">
                  {/* Section 1: Scenarios Compact 2x3 Grid */}
                  <div className="space-y-0.5 shrink-0">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400">
                        1. SCENARIOS (6)
                      </span>
                      <span className="text-[8px] font-mono text-amber-400">
                        {assessmentState.completedPresetIds.length}/5 Passed
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {HOMEGUARD_PRESETS.map((preset, idx) => {
                        const isSelected = selectedPreset.id === preset.id;
                        const isPassed = assessmentState.completedPresetIds.includes(preset.id);
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => onSelectPreset(preset)}
                            className={cn(
                              "w-full text-left py-1 px-1.5 rounded-md border transition-all cursor-pointer flex items-center justify-between gap-1",
                              isSelected
                                ? "bg-cyan-500/25 border-cyan-400 text-white font-bold ring-1 ring-cyan-400"
                                : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-[10px]">
                                {preset.chipLabel === 'NORMAL' && '🛡️'}
                                {preset.chipLabel === 'OVERLOAD' && '🔥'}
                                {preset.chipLabel === 'SHORT' && '⚡'}
                                {preset.chipLabel === 'CHILD SHOCK' && '👶'}
                                {preset.chipLabel === 'WET BATH' && '💧'}
                                {preset.chipLabel === 'BROKEN EARTH' && '⚠️'}
                              </span>
                              <span className="text-[9px] font-bold truncate">
                                {idx + 1}. {preset.chipLabel}
                              </span>
                            </div>
                            {isSelected ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                            ) : isPassed ? (
                              <span className="text-[8px] text-emerald-400 font-black shrink-0">✓</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Room Filter + Appliances Grid */}
                  <div className="flex-1 min-h-0 flex flex-col justify-between space-y-0.5 overflow-hidden">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400">
                        2. APPLIANCES ({activeApplianceIds.length} ACTIVE)
                      </span>
                      <span className="text-[8px] font-mono text-cyan-400">
                        {livingRoomWatts}W ({livingRoomCurrent.toFixed(1)}A)
                      </span>
                    </div>

                    {/* Compact Room Filter */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                      {(['all', 'living', 'kitchen', 'bathroom', 'bedroom'] as const).map(room => (
                        <button
                          key={room}
                          type="button"
                          onClick={() => setApplianceRoomFilter(room)}
                          className={cn(
                            "px-1.5 py-0.2 rounded text-[8px] font-bold capitalize transition-all cursor-pointer whitespace-nowrap",
                            applianceRoomFilter === room
                              ? "bg-cyan-500 text-slate-950 font-black"
                              : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                          )}
                        >
                          {room === 'all' ? 'All (10)' : room}
                        </button>
                      ))}
                    </div>

                    {/* 2-Column Compact Appliances Grid */}
                    <div className="grid grid-cols-2 gap-1 flex-1 min-h-0 overflow-hidden">
                      {HOMEGUARD_APPLIANCES
                        .filter(app => applianceRoomFilter === 'all' || app.room === applianceRoomFilter)
                        .slice(0, applianceRoomFilter === 'all' ? 10 : 6)
                        .map(app => {
                          const isActive = activeApplianceIds.includes(app.id);
                          return (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => onToggleAppliance(app.id)}
                              className={cn(
                                "py-0.5 px-1.5 rounded-md border text-left transition-all cursor-pointer flex items-center justify-between gap-1",
                                isActive
                                  ? "bg-slate-900 border-emerald-500/80 text-white shadow-xs ring-1 ring-emerald-500/40"
                                  : "bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-700"
                              )}
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="text-xs shrink-0">{app.icon}</span>
                                <div className="min-w-0 leading-none">
                                  <div className="text-[8.5px] font-bold text-slate-200 truncate">
                                    {app.shortName}
                                  </div>
                                  <span className="text-[7.5px] text-slate-400 font-mono">
                                    {app.watts}W
                                  </span>
                                </div>
                              </div>
                              <span className={cn(
                                "text-[7.5px] px-1 py-0.2 rounded font-black shrink-0",
                                isActive ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                              )}>
                                {isActive ? 'ON' : 'OFF'}
                              </span>
                            </button>
                          );
                        })}
                    </div>

                    {/* Compact Extension Strip Button */}
                    <button
                      type="button"
                      onClick={onToggleDaisyChain}
                      className={cn(
                        "w-full px-2 py-0.5 rounded-md border text-left transition-all cursor-pointer flex items-center justify-between text-[9px] font-bold shrink-0",
                        isDaisyChainActive
                          ? "bg-rose-950/70 border-rose-500 text-rose-200"
                          : "bg-slate-950/60 border-slate-800 text-slate-400"
                      )}
                    >
                      <div className="flex items-center gap-1 truncate">
                        <span>🔌 Multi-Plug Strip:</span>
                        <span className={isDaisyChainActive ? "text-rose-300 font-black" : "text-slate-500"}>
                          {isDaisyChainActive ? 'PLUGGED IN' : 'UNPLUGGED'}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono text-amber-400 shrink-0">
                        {isDaisyChainActive ? '⚠️ TRAP' : 'TEST TRAP'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── MODE 2: FOCUSED PRESETS (EXPANDED DESCRIPTIONS) ── */}
              {leftTab === 'presets' && (
                <div className="flex-1 min-h-0 flex flex-col justify-between space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between px-1 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      GUIDED FAULT MISSIONS
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8.5px] font-bold text-amber-400 font-mono">
                        {assessmentState.totalScore}/500 PTS
                      </span>
                      {assessmentState.completedPresetIds.length > 0 && onResetProgress && (
                        <button
                          type="button"
                          onClick={onResetProgress}
                          className="text-[8.5px] text-slate-400 hover:text-rose-300 underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1 flex-1 min-h-0 overflow-hidden">
                    {HOMEGUARD_PRESETS.map((preset, idx) => {
                      const isSelected = selectedPreset.id === preset.id;
                      const isPassed = assessmentState.completedPresetIds.includes(preset.id);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onSelectPreset(preset)}
                          className={cn(
                            "w-full text-left p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-1.5",
                            isSelected
                              ? "bg-cyan-500/25 border-cyan-400 text-white shadow-xs ring-1 ring-cyan-400"
                              : "bg-slate-950/60 border-slate-800 hover:border-slate-750 text-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center shrink-0">
                              {preset.chipLabel === 'NORMAL' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                              {preset.chipLabel === 'OVERLOAD' && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                              {preset.chipLabel === 'SHORT' && <Zap className="w-3.5 h-3.5 text-rose-400" />}
                              {preset.chipLabel === 'CHILD SHOCK' && <HeartPulse className="w-3.5 h-3.5 text-rose-400" />}
                              {preset.chipLabel === 'WET BATH' && <Droplets className="w-3.5 h-3.5 text-cyan-400" />}
                              {preset.chipLabel === 'BROKEN EARTH' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                            </div>
                            <div className="min-w-0 leading-tight">
                              <div className="text-[9.5px] font-bold truncate">
                                {idx + 1}. {preset.chipLabel}
                              </div>
                              <div className="text-[8px] text-slate-400 font-sans truncate">
                                {preset.id === 'preset_normal' && 'Standard Everyday Power (Safe)'}
                                {preset.id === 'preset_overload' && 'Too Many Heaters (145%)'}
                                {preset.id === 'preset_short' && 'Damaged Wire Touching'}
                                {preset.id === 'preset_child_shock' && 'Baby Socket Touch (230mA)'}
                                {preset.id === 'preset_wet_bath' && 'Wet Bathroom Leakage'}
                                {preset.id === 'preset_broken_earth' && 'Broken Green Wire Trap'}
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-cyan-400 text-slate-950 uppercase shrink-0">
                              ACTIVE
                            </span>
                          ) : isPassed ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shrink-0">
                              ✓ Done
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── MODE 3: FOCUSED SWITCHBOARD (EXPANDED APPLIANCES) ── */}
              {leftTab === 'appliances' && (
                <div className="flex-1 min-h-0 flex flex-col justify-between space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between px-1 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      ROOM APPLIANCES ({activeApplianceIds.length} ACTIVE)
                    </span>
                    <span className="text-[8.5px] font-mono text-cyan-400">
                      10 Total
                    </span>
                  </div>

                  {/* Room Filters */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                    {(['all', 'living', 'kitchen', 'bathroom', 'bedroom'] as const).map(room => (
                      <button
                        key={room}
                        type="button"
                        onClick={() => setApplianceRoomFilter(room)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[8.5px] font-bold capitalize transition-all cursor-pointer whitespace-nowrap",
                          applianceRoomFilter === room
                            ? "bg-cyan-500 text-slate-950 font-black shadow-xs"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                        )}
                      >
                        {room === 'all' ? 'All (10)' : room}
                      </button>
                    ))}
                  </div>

                  {/* 2-Column Grid */}
                  <div className="grid grid-cols-2 gap-1 flex-1 min-h-0 overflow-hidden">
                    {HOMEGUARD_APPLIANCES
                      .filter(app => applianceRoomFilter === 'all' || app.room === applianceRoomFilter)
                      .slice(0, applianceRoomFilter === 'all' ? 10 : 6)
                      .map(app => {
                        const isActive = activeApplianceIds.includes(app.id);
                        return (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => onToggleAppliance(app.id)}
                            className={cn(
                              "p-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1",
                              isActive
                                ? "bg-slate-900 border-emerald-500/80 text-white shadow-xs ring-1 ring-emerald-500/40"
                                : "bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-700"
                            )}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-base shrink-0">{app.icon}</span>
                              <div className="min-w-0 leading-tight">
                                <div className="text-[9px] font-bold text-slate-200 truncate">{app.shortName}</div>
                                <span className="text-[8px] font-mono text-slate-400">{app.watts}W</span>
                              </div>
                            </div>
                            <span className={cn(
                              "text-[8px] px-1 py-0.2 rounded font-black shrink-0",
                              isActive ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                            )}>
                              {isActive ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        );
                      })}
                  </div>

                  {/* Multi-Plug Extension Strip */}
                  <button
                    type="button"
                    onClick={onToggleDaisyChain}
                    className={cn(
                      "w-full px-2 py-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-[9.5px] font-bold shrink-0",
                      isDaisyChainActive
                        ? "bg-rose-950/70 border-rose-500 text-rose-200 shadow-xs"
                        : "bg-slate-950/60 border-slate-800 text-slate-400"
                    )}
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span>🔌 Multi-Plug Strip:</span>
                      <span className={isDaisyChainActive ? "text-rose-300 font-black" : "text-slate-500"}>
                        {isDaisyChainActive ? 'PLUGGED IN' : 'UNPLUGGED'}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-amber-400 shrink-0">
                      {isDaisyChainActive ? 'TRAP ACTIVE' : 'TEST TRAP'}
                    </span>
                  </button>
                </div>
              )}

              {/* ── SECTION 3: DB PANEL SAFETY SWITCH (PERMANENT, ZERO SCROLL) ── */}
              <div className="pt-1 border-t border-slate-800 space-y-0.5 shrink-0">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 block px-0.5">
                  3. DB PANEL SAFETY SWITCH
                </span>

                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'rccb_mcb', label: 'Modern RCCB', note: 'Safe' },
                    { id: 'mcb_only', label: 'MCB Only', note: 'No Shock' },
                    { id: 'velcb', label: '1980s v-ELCB', note: 'Trap' }
                  ].map(cfg => (
                    <button
                      key={cfg.id}
                      type="button"
                      onClick={() => onChangeBreakerMode(cfg.id as BreakerConfigurationMode)}
                      className={cn(
                        "text-center py-1 px-1 rounded-md border text-[9px] transition-all cursor-pointer flex flex-col items-center justify-center leading-none",
                        breakerMode === cfg.id
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-xs"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                      )}
                    >
                      <span className="truncate w-full">{cfg.label}</span>
                      <span className="text-[7.5px] opacity-80 truncate mt-0.5">{cfg.note}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── SECTION 4: MANUAL BREAKER ACTIONS (PERMANENT, ZERO SCROLL) ── */}
              <div className="pt-0.5 border-t border-slate-800 space-y-0.5 shrink-0">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 block px-0.5">
                  4. MANUAL BREAKER ACTIONS
                </span>

                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => onSafeRecloseBreaker('c2_living_sockets')}
                    className={cn(
                      "py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer font-black text-[9.5px] flex flex-col items-center justify-center border shadow-xs leading-none",
                      isTripped
                        ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 animate-pulse"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    )}
                  >
                    <span>⬆ RESET POWER</span>
                    <span className="text-[7.5px] font-sans font-normal opacity-90 mt-0.5">Push Switch UP</span>
                  </button>

                  <button
                    type="button"
                    onClick={onSafeTestTripRCCB}
                    className="py-1 px-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[9.5px] text-center transition-all cursor-pointer flex flex-col items-center justify-center border border-amber-400 shadow-xs leading-none"
                  >
                    <span>🟡 TEST 'T' BUTTON</span>
                    <span className="text-[7.5px] font-sans font-normal opacity-90 mt-0.5">Test Tripping</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </aside>

        {/* Center: Stage with Mode Toggle (Maximized Viewport) */}
        <main className="flex-1 h-full min-w-0 flex flex-col bg-slate-950 relative overflow-hidden">
          {/* Closed-Loop House Power Status Banner (Rec 11) */}
          <HousePowerStatusBanner
            circuitStates={circuitStates}
            onOpenDBBox={() => setIsDBDrawerOpen(true)}
          />

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
          <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden flex flex-col items-center justify-center p-0.5">
            {/* Discovery Coachmark Beacon (Auto-dismissed once tapped) */}
            {viewMode === 'house' && (
              <div className="absolute top-2 right-4 z-30 max-w-sm">
                <ApplianceDiscoveryCue />
              </div>
            )}

            <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden flex items-center justify-center">
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
                  onOpenDBBox={() => setIsDBDrawerOpen(true)}
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
                    leakageMA={toroidLeakageMA}
                    isTripped={rccbState.state !== 'CLOSED'}
                    onTrip={onSafeTestTripRCCB}
                    onReset={() => {
                      onSafeRecloseBreaker('c2_living_sockets');
                      setToroidLeakageMA(0);
                    }}
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
          </div>
        </main>

        {/* Right: Lesson Overlays ("Why did it trip?") - Collapsible to Maximize Visuals */}
        <aside className={cn(
          "shrink-0 h-full overflow-y-auto custom-scrollbar bg-slate-900/95 border-l border-slate-800 flex flex-col justify-between select-none transition-all duration-300 z-20",
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

            {/* Live Kirchhoff Flow & Output Telemetry */}
            <HomeGuardKirchhoffTelemetry
              circuitStates={circuitStates}
              activeApplianceIds={activeApplianceIds}
              scenarioId={selectedScenario.id}
            />

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

      {/* Synchronized DB Fuse Box Drawer (Rec 12) */}
      <DistributionBoardDrawer
        isOpen={isDBDrawerOpen}
        onClose={() => setIsDBDrawerOpen(false)}
        circuitStates={circuitStates}
        onSafeRecloseBreaker={onSafeRecloseBreaker}
        onSafeTestTripRCCB={onSafeTestTripRCCB}
      />
    </div>
  );
};
