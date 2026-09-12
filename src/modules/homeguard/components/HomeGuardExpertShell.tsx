/**
 * HomeGuardExpertShell.tsx
 * 
 * Presentation Layer 3: EXPERT MODE (👷 EXPERT)
 * Today's full engineering cockpit 100% unchanged:
 * - 3-Column Layout: Left Controls & Scenarios, Center Stage (House/Toroid/DeathRace/DB), Right Telemetry & Status
 * - All technical units: µWb flux imbalance, mA leakage, kA²s, points assessment, safety audit modals
 * - Zero compromises for electrical engineers and technicians
 */

import React, { useState, useMemo } from 'react';
import { IsometricHouseView } from './IsometricHouseView';
import { DistributionBoard } from './DistributionBoard';
import { DeathRaceView } from './DeathRaceView';
import { ToroidCoreVisualizer } from './ToroidCoreVisualizer';
import { HomeGuardValidationTable } from './HomeGuardValidationTable';
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
  FileText,
  MapPin,
  Award,
  HelpCircle,
  Eye,
  ShieldCheck,
  ShieldAlert,
  ClipboardCheck
} from 'lucide-react';

export type HomeGuardVisualMode = 'house' | 'toroid' | 'death_race' | 'db_box';

export interface HomeGuardExpertShellProps {
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
  habitTip: { type: 'warn' | 'success'; text: string } | null;
  livingCountdownSec: number;
  leakageCurrentMA: number;
  onOpenAuditModal: () => void;
  onOpenScavengerModal: () => void;
  onOpenShockDrillModal: () => void;
  onOpenCertificateModal: () => void;
}

export const HomeGuardExpertShell: React.FC<HomeGuardExpertShellProps> = ({
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
  habitTip,
  livingCountdownSec,
  leakageCurrentMA,
  onOpenAuditModal,
  onOpenScavengerModal,
  onOpenShockDrillModal,
  onOpenCertificateModal
}) => {
  const [viewMode, setViewMode] = useState<HomeGuardVisualMode>('house');
  const [isValidationTableOpen, setIsValidationTableOpen] = useState<boolean>(false);

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
    <div className="flex-1 min-h-0 w-full h-full flex flex-col font-mono select-none overflow-hidden relative">
      
      {/* Real-Life Safety Habit Feedback Banner (Rendered in FIXED floating overlay slot so it NEVER pushes tabs) */}
      {habitTip && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className={cn(
            "px-4 py-1.5 text-xs font-sans font-bold text-center border rounded-full flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150 shadow-xl pointer-events-auto",
            habitTip.type === 'warn'
              ? "bg-amber-950/95 text-amber-200 border-amber-500 shadow-amber-950/50"
              : "bg-emerald-950/95 text-emerald-200 border-emerald-500 shadow-emerald-950/50"
          )}>
            <span>{habitTip.text}</span>
          </div>
        </div>
      )}

      {/* 3-COLUMN COCKPIT LAYOUT CONTAINER */}
      <div className="flex-1 min-h-0 w-full h-full flex flex-col lg:flex-row overflow-hidden">
        
        {/* ── LEFT COLUMN: INPUTS & CONTROLS ── */}
        <aside className="w-full lg:w-72 xl:w-76 shrink-0 h-full overflow-hidden p-2 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between select-none">
          
          {/* Section 1: Scenarios Picker */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                1. PICK A SCENARIO
              </span>
              <span className="text-[9px] font-bold text-amber-400 font-mono">
                {assessmentState.totalScore}/500 PTS
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1">
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
                        ? "bg-cyan-500/20 border-cyan-400 text-white shadow-sm"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-750 text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center shrink-0">
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
                        <div className="text-[8.5px] text-slate-400 font-sans truncate">
                          {preset.id === 'preset_overload' && 'Too Many Heaters (145%)'}
                          {preset.id === 'preset_short' && 'Damaged Wire Touching'}
                          {preset.id === 'preset_child_shock' && 'Baby Socket Touch (230mA)'}
                          {preset.id === 'preset_wet_bath' && 'Wet Bathroom Leakage'}
                          {preset.id === 'preset_broken_earth' && 'Broken Green Wire Trap'}
                        </div>
                      </div>
                    </div>

                    {isPassed && (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black flex items-center justify-center shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Room Appliances Switches */}
          <div className="pt-1 border-t border-slate-800 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
              2. ROOM APPLIANCES (TAP TO TOGGLE)
            </span>

            <div className="grid grid-cols-2 gap-1">
              {/* Space Heater */}
              <button
                type="button"
                onClick={() => onToggleAppliance('space_heater')}
                className={cn(
                  "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col",
                  activeApplianceIds.includes('space_heater')
                    ? "bg-orange-950/70 border-orange-500 text-orange-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                )}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span>Heater</span>
                  <span className={cn("text-[8px] px-1 rounded", activeApplianceIds.includes('space_heater') ? "bg-orange-500 text-slate-950 font-black" : "bg-slate-800")}>
                    {activeApplianceIds.includes('space_heater') ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="text-[8px] font-sans text-orange-400 truncate">2,000W Heavy 🔴</span>
              </button>

              {/* Electric Kettle */}
              <button
                type="button"
                onClick={() => onToggleAppliance('kettle')}
                className={cn(
                  "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col",
                  activeApplianceIds.includes('kettle')
                    ? "bg-sky-950/70 border-sky-500 text-sky-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                )}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span>Kettle</span>
                  <span className={cn("text-[8px] px-1 rounded", activeApplianceIds.includes('kettle') ? "bg-sky-500 text-slate-950 font-black" : "bg-slate-800")}>
                    {activeApplianceIds.includes('kettle') ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="text-[8px] font-sans text-sky-400 truncate">2,200W Heavy 🔴</span>
              </button>

              {/* TV Console */}
              <button
                type="button"
                onClick={() => onToggleAppliance('tv_console')}
                className={cn(
                  "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col",
                  activeApplianceIds.includes('tv_console')
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                )}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span>TV Unit</span>
                  <span className={cn("text-[8px] px-1 rounded", activeApplianceIds.includes('tv_console') ? "bg-emerald-500 text-slate-950 font-black" : "bg-slate-800")}>
                    {activeApplianceIds.includes('tv_console') ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="text-[8px] font-sans text-emerald-400 truncate">150W Light 🟢</span>
              </button>

              {/* Microwave */}
              <button
                type="button"
                onClick={() => onToggleAppliance('microwave')}
                className={cn(
                  "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col",
                  activeApplianceIds.includes('microwave')
                    ? "bg-amber-950/70 border-amber-500 text-amber-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                )}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span>Microwave</span>
                  <span className={cn("text-[8px] px-1 rounded", activeApplianceIds.includes('microwave') ? "bg-amber-500 text-slate-950 font-black" : "bg-slate-800")}>
                    {activeApplianceIds.includes('microwave') ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="text-[8px] font-sans text-amber-400 truncate">1,200W Med 🟡</span>
              </button>
            </div>

            {/* Multi-Plug Extension Strip Toggle */}
            <button
              type="button"
              onClick={onToggleDaisyChain}
              className={cn(
                "w-full px-2 py-1 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-[10px] font-bold",
                isDaisyChainActive
                  ? "bg-rose-950/70 border-rose-500 text-rose-200 shadow-sm"
                  : "bg-slate-950/60 border-slate-800 text-slate-400"
              )}
            >
              <div className="flex items-center gap-1 truncate">
                <span>🔌 Multi-Plug Strip:</span>
                <span className={isDaisyChainActive ? "text-rose-300 font-black" : "text-slate-500"}>
                  {isDaisyChainActive ? 'PLUGGED IN' : 'UNPLUGGED'}
                </span>
              </div>
              <span className="text-[8.5px] font-mono text-amber-400 shrink-0">
                {isDaisyChainActive ? 'TRAP ACTIVE' : 'TEST TRAP'}
              </span>
            </button>
          </div>

          {/* Section 3: Consumer Unit Panel Type */}
          <div className="pt-1 border-t border-slate-800 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
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
                    "text-center py-1 px-1 rounded-md border text-[9.5px] transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                    breakerMode === cfg.id
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                  )}
                >
                  <span className="truncate w-full">{cfg.label}</span>
                  <span className="text-[7.5px] opacity-80 truncate">{cfg.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Breaker Actions */}
          <div className="pt-1 border-t border-slate-800 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
              4. MANUAL BREAKER ACTIONS
            </span>

            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => onSafeRecloseBreaker('c2_living_sockets')}
                className={cn(
                  "p-1.5 rounded-lg text-center transition-all cursor-pointer font-black text-[10px] flex flex-col items-center justify-center border shadow-sm leading-tight",
                  isTripped
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 animate-pulse"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                )}
              >
                <span>⬆ RESET POWER</span>
                <span className="text-[8px] font-sans font-normal opacity-90">Push Switch UP</span>
              </button>

              <button
                type="button"
                onClick={onSafeTestTripRCCB}
                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] text-center transition-all cursor-pointer flex flex-col items-center justify-center border border-amber-400 shadow-sm leading-tight"
              >
                <span>🟡 TEST 'T' BUTTON</span>
                <span className="text-[8px] font-sans font-normal opacity-90">Test Tripping</span>
              </button>
            </div>
          </div>

        </aside>

        {/* ── CENTER COLUMN: VISUAL SIMULATOR VIEWPORT ── */}
        <main className="flex-1 h-full min-w-0 flex flex-col bg-slate-950 relative overflow-hidden">
          
          {/* Slim Visual Stage Mode Tab Bar */}
          <div className="h-8.5 shrink-0 px-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 text-xs z-20">
            <nav className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setViewMode('house')}
                className={cn(
                  "px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1",
                  viewMode === 'house' ? "bg-cyan-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
                )}
              >
                <Layers className="w-3 h-3" />
                <span>2.5D House</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('toroid')}
                className={cn(
                  "px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1",
                  viewMode === 'toroid' ? "bg-amber-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
                )}
              >
                <Activity className="w-3 h-3" />
                <span>🧲 Inside RCCB</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('death_race')}
                className={cn(
                  "px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1",
                  viewMode === 'death_race' ? "bg-rose-600 text-white font-black shadow" : "text-slate-400 hover:text-white"
                )}
              >
                <HeartPulse className="w-3 h-3" />
                <span>Death Race</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('db_box')}
                className={cn(
                  "px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1",
                  viewMode === 'db_box' ? "bg-orange-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
                )}
              >
                <Zap className="w-3 h-3" />
                <span>DB Fuse Box</span>
              </button>
            </nav>

            {/* Quick View Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleXRay}
                className={cn(
                  "px-2.5 py-1 rounded text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 border",
                  isXRay ? "bg-cyan-950 text-cyan-300 border-cyan-700 shadow-sm" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                )}
                title="Toggle wall peel to see hidden electrical conduits"
              >
                <span>See inside walls 👁</span>
              </button>
            </div>
          </div>

          {/* VISUAL ANIMATION CANVAS */}
          <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden flex items-center justify-center p-1">
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
                className="w-full h-full rounded-xl overflow-hidden"
              />
            )}

            {viewMode === 'toroid' && (
              <div className="w-full h-full p-1 overflow-hidden flex flex-col">
                <ToroidCoreVisualizer
                  initialLeakageMA={selectedScenario.leakageCurrentMA}
                  rccbRatingMA={30}
                  isExternalTripped={rccbState.state !== 'CLOSED'}
                  onTrip={onSafeTestTripRCCB}
                  className="flex-1 w-full h-full overflow-hidden"
                />
              </div>
            )}

            {viewMode === 'death_race' && (
              <div className="w-full h-full overflow-hidden flex flex-col">
                <DeathRaceView
                  onExit={() => setViewMode('house')}
                  className="h-full w-full overflow-hidden"
                />
              </div>
            )}

            {viewMode === 'db_box' && (
              <div className="w-full h-full p-1 overflow-hidden flex flex-col">
                <DistributionBoard
                  circuitStates={circuitStates}
                  onRecloseBreaker={onSafeRecloseBreaker}
                  onTestTripRCCB={onSafeTestTripRCCB}
                  leakageCurrentMA={leakageCurrentMA}
                  className="flex-1 w-full h-full overflow-hidden"
                />
              </div>
            )}
          </div>

        </main>

        {/* ── RIGHT COLUMN: RESULTS, STATUS & TELEMETRY ── */}
        <aside className="w-full lg:w-72 xl:w-78 shrink-0 h-full overflow-hidden p-2 bg-slate-900/95 border-l border-slate-800 flex flex-col justify-between select-none">
          
          {/* Section 1: Live Verdict Banner */}
          <div className={cn(
            "p-2 rounded-xl border flex flex-col gap-1 shadow-sm",
            isTripped
              ? "bg-rose-950/70 border-rose-500 text-rose-100"
              : isOverloaded
              ? "bg-amber-950/70 border-amber-500 text-amber-100"
              : "bg-emerald-950/70 border-emerald-500 text-emerald-100"
          )}>
            <div className="flex items-center gap-1.5" role="status" aria-live="polite">
              {isTripped ? (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <div className="font-black text-[11px] uppercase tracking-wider truncate">
                {isTripped
                  ? (selectedPreset.id === 'preset_child_shock'
                      ? '🛡️ CHILD SAVED IN 0.03s!'
                      : '🚨 BREAKER TRIPPED')
                  : isOverloaded
                  ? '⏳ WIRES HEATING UP...'
                  : '🛡️ CIRCUITS SAFE & ARMED'}
              </div>
            </div>

            <p className="text-[10px] font-sans text-slate-300 leading-tight">
              {isTripped
                ? (selectedPreset.id === 'preset_child_shock'
                    ? 'RCCB detected 230mA shock and snapped OFF faster than a heartbeat!'
                    : 'Switch opened contacts to stop copper wires from melting.')
                : isOverloaded
                ? (
                    <span className="flex items-center gap-1 flex-wrap">
                      <span>Hidden copper wire heating up ({livingCountdownSec.toFixed(0)}s).</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-950 text-amber-300 border border-amber-600">
                        TIME-LAPSE ×60
                      </span>
                    </span>
                  )
                : 'Current within safe 16A limit. Magnetic and thermal trip standing by.'}
            </p>
          </div>

          {/* Section 2: Live Socket Power Speedometer & Meters */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
              LIVE SOCKET LOAD & METERS
            </span>

            {/* Watts Progress Bar */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-sans">Power Load:</span>
                <span className={cn(
                  "font-black font-mono",
                  wattPercentage > 100 ? "text-rose-400" : wattPercentage > 65 ? "text-amber-300" : "text-emerald-400"
                )}>
                  {livingRoomWatts} W / 3,680 W
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    wattPercentage > 100
                      ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse"
                      : wattPercentage > 65
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  )}
                  style={{ width: `${Math.min(100, wattPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                <span>0W</span>
                <span>Safe Max (3,680W)</span>
                <span>{wattPercentage}%</span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-1 pt-0.5 text-[10px] font-mono">
              <div className="p-1 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-[8px] text-slate-500">Current</span>
                <strong className={cn(livingRoomCurrent > 16 ? "text-rose-400 font-black" : "text-slate-200")}>
                  {livingRoomCurrent.toFixed(1)}A / 16A
                </strong>
              </div>

              <div className="p-1 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-[8px] text-slate-500">Leakage</span>
                <strong className={cn(leakageCurrentMA > 0 ? "text-rose-400 font-black" : "text-emerald-400")}>
                  {leakageCurrentMA} mA
                </strong>
              </div>
            </div>
          </div>

          {/* Section 3: "What Just Happened?" (Replace-after-fade, no overlapping texts) */}
          <div key={selectedScenario.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 space-y-1 animate-in fade-in duration-200">
            <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              WHAT JUST HAPPENED?
            </span>

            <p className="text-[10px] font-sans text-slate-300 leading-snug">
              {selectedScenario.plainEnglishExplanation}
            </p>

            <div className="pt-1 border-t border-slate-800/80 text-[9px] font-mono text-amber-300 leading-tight">
              💡 <strong>Family Rule:</strong> {selectedScenario.recommendation}
            </div>
          </div>

          {/* Section 4: Action Tools (2x2 Grid) */}
          <div className="pt-1 border-t border-slate-800 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
              SAFETY TOOLS & BADGES
            </span>

            <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={onOpenAuditModal}
                className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/70 text-emerald-200 transition-colors cursor-pointer flex items-center gap-1 truncate"
              >
                <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">Audit</span>
              </button>

              <button
                type="button"
                onClick={onOpenScavengerModal}
                className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-850 border border-slate-800 text-orange-300 transition-colors cursor-pointer flex items-center gap-1 truncate"
              >
                <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                <span className="truncate">DB Box</span>
              </button>

              <button
                type="button"
                onClick={() => setIsValidationTableOpen(true)}
                className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-200 transition-colors cursor-pointer flex items-center gap-1.5 truncate"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">IEC Validation</span>
              </button>

              <button
                type="button"
                onClick={onOpenShockDrillModal}
                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-600/70 text-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 truncate"
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Shock Drill</span>
              </button>

              <button
                type="button"
                onClick={onOpenCertificateModal}
                className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/70 text-amber-200 transition-colors cursor-pointer flex items-center gap-1.5 truncate"
              >
                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Certificate</span>
              </button>
            </div>
          </div>

        </aside>

      </div>

      {/* IEC Standards Validation Table Modal */}
      <HomeGuardValidationTable
        isOpen={isValidationTableOpen}
        onClose={() => setIsValidationTableOpen(false)}
      />
    </div>
  );
};
