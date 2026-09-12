/**
 * HomeGuardSimulator.tsx
 * 
 * ElectroLive™ Standard 3-Column Simulator Architecture:
 * - Left Panel: Inputs & Controls (Scenarios, Appliances, Breaker Mode, Switch Actions)
 * - Center Panel: Big Visual Simulator Stage (2.5D House, Toroid, Death Race, DB Box)
 * - Right Panel: Results & Live Telemetry (Status Verdict, Watts Speedometer, Story, Audit Tools)
 * - Fixed height (100% viewport), zero page scrollbars, effortless for a 10-year-old to understand.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useHomeGuardEngine } from './hooks/useHomeGuardEngine';
import { IsometricHouseView } from './components/IsometricHouseView';
import { DistributionBoard } from './components/DistributionBoard';
import { VELCBComparisonModal } from './components/VELCBComparisonModal';
import { DeathRaceView } from './components/DeathRaceView';
import { ToroidCoreVisualizer } from './components/ToroidCoreVisualizer';
import { HomeSafetyAuditModal } from './components/HomeSafetyAuditModal';
import { ScavengerHuntModal } from './components/ScavengerHuntModal';
import { ShockRescueDrillModal } from './components/ShockRescueDrillModal';
import { FamilyCertificateModal } from './components/FamilyCertificateModal';
import { homeguardAudio } from './utils/homeguardAudio';
import { HOMEGUARD_PRESETS, HomeGuardPreset } from './data/homeguardPresets';
import { RESIDENTIAL_SCENARIOS } from './data/residentialProfile';
import {
  parseHomeGuardUrlParams,
  updateHomeGuardUrl,
  buildHomeGuardShareableUrl,
  BreakerConfigurationMode
} from './data/auditReportData';
import { loadAssessmentState, recordMissionPassed, MissionAssessmentState } from './data/assessmentStorage';
import { TimeWarpBar } from '../../core/ui/controls/TimeWarpBar';
import { MCBState, TripCause } from '@/src/mcb/types';
import { cn } from '@/src/lib/utils';
import {
  Home,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  AlertTriangle,
  Flame,
  Droplets,
  HeartPulse,
  Layers,
  Activity,
  FileText,
  Share2,
  Check,
  Eye,
  Award,
  MapPin,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sliders,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export type HomeGuardVisualMode = 'house' | 'toroid' | 'death_race' | 'db_box';

export const HomeGuardSimulator: React.FC = () => {
  const [viewMode, setViewMode] = useState<HomeGuardVisualMode>('house');
  const [selectedPreset, setSelectedPreset] = useState<HomeGuardPreset>(HOMEGUARD_PRESETS[0]);
  const [breakerMode, setBreakerMode] = useState<BreakerConfigurationMode>('rccb_mcb');
  const [isXRay, setIsXRay] = useState<boolean>(true);
  const [isDaisyChainActive, setIsDaisyChainActive] = useState<boolean>(false);

  // Modals
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isScavengerModalOpen, setIsScavengerModalOpen] = useState<boolean>(false);
  const [isShockDrillOpen, setIsShockDrillOpen] = useState<boolean>(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);
  const [isVELCBLabOpen, setIsVELCBLabOpen] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const [assessmentState, setAssessmentState] = useState<MissionAssessmentState>(() => loadAssessmentState());

  const [activeApplianceIds, setActiveApplianceIds] = useState<string[]>([
    'tv_console',
    'space_heater',
    'kettle'
  ]);

  const {
    selectedScenario,
    selectScenario,
    circuitStates,
    livingCountdownSec,
    leakageCurrentMA,
    timeLapseSpeed,
    setTimeLapseSpeed,
    isMuted,
    setIsMuted,
    handleRecloseBreaker,
    handleTestTripRCCB
  } = useHomeGuardEngine('winter_overload_145');

  // Sync audio mute state
  useEffect(() => {
    homeguardAudio.setMuted(isMuted);
  }, [isMuted]);

  const c2State = circuitStates.c2_living_sockets;
  const rccbState = circuitStates.main_rccb;
  const isTripped = c2State.state !== 'CLOSED' || rccbState.state !== 'CLOSED';
  const isShortCircuit = selectedScenario.faultType === 'short_circuit' && !isTripped;
  const isOverloaded = selectedScenario.faultType === 'thermal_overload' && !isTripped;

  // Audio: play trip sound when circuit breaker trips
  useEffect(() => {
    if (isTripped) {
      homeguardAudio.playBreakerTripSound();
    }
  }, [isTripped]);

  // Audio: play arc sizzle on short circuit
  useEffect(() => {
    if (isShortCircuit) {
      homeguardAudio.playArcSizzleSound();
    }
  }, [isShortCircuit]);

  // Calculate live Living Room Wattage
  const livingRoomWatts = useMemo(() => {
    let total = 0;
    if (activeApplianceIds.includes('tv_console')) total += 150;
    if (activeApplianceIds.includes('space_heater')) total += 2000;
    if (activeApplianceIds.includes('kettle')) total += 2200;
    if (activeApplianceIds.includes('microwave')) total += 1200;
    return total;
  }, [activeApplianceIds]);

  const maxSafeWatts = 3680; // 16A * 230V
  const wattPercentage = Math.round((livingRoomWatts / maxSafeWatts) * 100);

  // Determine if active mission passed
  const isMissionActivePassed = useMemo(() => {
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

  // Record score when passed + play success chime
  useEffect(() => {
    if (isMissionActivePassed) {
      homeguardAudio.playSuccessChime();
      const updated = recordMissionPassed(selectedPreset.id, selectedPreset.pointsAwarded, selectedPreset.expectedStampText);
      setAssessmentState(updated);
    }
  }, [isMissionActivePassed, selectedPreset.id, selectedPreset.pointsAwarded, selectedPreset.expectedStampText]);

  const [habitTip, setHabitTip] = useState<{ type: 'warn' | 'success'; text: string } | null>(null);

  // Toggle individual appliance with real-life safety habit feedback
  const handleToggleAppliance = (applianceId: string) => {
    setActiveApplianceIds(prev => {
      const isRemoving = prev.includes(applianceId);
      const next = isRemoving ? prev.filter(id => id !== applianceId) : [...prev, applianceId];
      if (isTripped && isRemoving && (applianceId === 'space_heater' || applianceId === 'kettle')) {
        setHabitTip({
          type: 'success',
          text: '✅ Great job! Heavy heater unplugged. Safe to push breaker UP at the DB box.'
        });
        setTimeout(() => setHabitTip(null), 4000);
      }
      return next;
    });
  };

  // Safe reclose breaker logic (Item 7 safety habit)
  const handleSafeRecloseBreaker = (circuitId: string) => {
    const isOverloadStillPlugged = activeApplianceIds.includes('space_heater') && activeApplianceIds.includes('kettle');
    if (isOverloadStillPlugged && circuitId === 'c2_living_sockets') {
      setHabitTip({
        type: 'warn',
        text: '⚠️ UNPLUG HEATER FIRST! In real life, turning on a breaker with 23A of heaters still plugged in will cause a loud spark and trip right back in your face!'
      });
      setTimeout(() => setHabitTip(null), 5000);
      return;
    }
    setHabitTip({
      type: 'success',
      text: '✅ Breaker switch pushed UP! Power safely restored.'
    });
    setTimeout(() => setHabitTip(null), 3000);
    homeguardAudio.playBreakerResetSound();
    handleRecloseBreaker(circuitId);
  };

  const handleSafeTestTripRCCB = () => {
    homeguardAudio.playBreakerTripSound();
    handleTestTripRCCB();
  };

  const handleScenarioChange = (scenarioId: string) => {
    const sc = RESIDENTIAL_SCENARIOS.find(s => s.id === scenarioId);
    if (sc) {
      selectScenario(sc);
      setActiveApplianceIds(sc.appliancesActive);
      updateHomeGuardUrl(sc.id, breakerMode);
    }
  };

  const handleSelectPreset = (preset: HomeGuardPreset) => {
    setSelectedPreset(preset);
    if (preset.id === 'preset_overload') {
      handleScenarioChange('winter_overload_145');
    } else if (preset.id === 'preset_short') {
      handleScenarioChange('damaged_cord_short');
    } else if (preset.id === 'preset_child_shock') {
      handleScenarioChange('child_touch_shock');
    } else if (preset.id === 'preset_wet_bath') {
      handleScenarioChange('kettle_earth_leakage');
    } else if (preset.id === 'preset_broken_earth') {
      handleScenarioChange('broken_earth_velcb');
      updateHomeGuardUrl('broken_earth_velcb', breakerMode);
    }
  };

  const handleUpdateBreakerMode = (mode: BreakerConfigurationMode) => {
    setBreakerMode(mode);
    updateHomeGuardUrl(selectedScenario.id, mode);
  };

  // Initialize from Shareable URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = parseHomeGuardUrlParams(window.location.search);
    if (urlParams.breaker) {
      setBreakerMode(urlParams.breaker);
    }
    if (urlParams.scenario) {
      const matchPreset = HOMEGUARD_PRESETS.find(p => 
        p.id === urlParams.scenario || 
        p.faultType === urlParams.scenario ||
        (urlParams.scenario === 'winter_overload_145' && p.id === 'preset_overload') ||
        (urlParams.scenario === 'damaged_cord_short' && p.id === 'preset_short') ||
        (urlParams.scenario === 'child_touch_shock' && p.id === 'preset_child_shock') ||
        (urlParams.scenario === 'kettle_earth_leakage' && p.id === 'preset_wet_bath') ||
        (urlParams.scenario === 'broken_earth_velcb' && p.id === 'preset_broken_earth')
      );
      if (matchPreset) {
        handleSelectPreset(matchPreset);
      } else {
        handleScenarioChange(urlParams.scenario);
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 font-mono select-none overflow-hidden relative">
      
      {/* 1. SLIM CLEAN TOP BAR (38px) */}
      <header className="h-9.5 shrink-0 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 text-xs z-30">
        
        {/* Left: Brand & Earthing Tag */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Home className="w-3.5 h-3.5" />
          </div>
          <span className="font-black text-white uppercase tracking-wider text-xs">
            HOMEGUARD™
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 hidden sm:inline">
            🏠 3-Pin Earth Home (230V)
          </span>
        </div>

        {/* Right: Essential Global Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <TimeWarpBar
            speed={timeLapseSpeed}
            onSpeedChange={setTimeLapseSpeed}
            speeds={[0.25, 1, 10, 100]}
            label=""
          />

          <button
            type="button"
            onClick={() => {
              const url = buildHomeGuardShareableUrl(selectedScenario.id, breakerMode);
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                  setShareToast('Link Copied: ' + selectedScenario.title);
                  setTimeout(() => setShareToast(null), 2500);
                });
              }
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-purple-300 transition-colors cursor-pointer min-h-[28px] flex items-center justify-center"
            title="Share Simulator URL"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(m => !m)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors cursor-pointer min-h-[28px] flex items-center justify-center"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleScenarioChange(selectedScenario.id)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 border border-rose-500/50 text-rose-300 transition-colors cursor-pointer min-h-[28px] flex items-center justify-center"
            title="Reset active scenario"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Share Toast */}
      {shareToast && (
        <div className="bg-purple-950 text-purple-200 px-4 py-1 text-xs font-bold text-center border-b border-purple-700 flex items-center justify-center gap-2 animate-in fade-in duration-150 z-40">
          <Check className="w-3.5 h-3.5 text-purple-300" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Real-Life Safety Habit Feedback Banner */}
      {habitTip && (
        <div className={cn(
          "px-4 py-1.5 text-xs font-sans font-bold text-center border-b flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150 z-30 shadow-md shrink-0",
          habitTip.type === 'warn'
            ? "bg-amber-950 text-amber-200 border-amber-500"
            : "bg-emerald-950 text-emerald-200 border-emerald-500"
        )}>
          <span>{habitTip.text}</span>
        </div>
      )}

      {/* 2. MAIN 3-COLUMN LAYOUT CONTAINER (ZERO PAGE SCROLLBARS) */}
      <div className="flex-1 min-h-0 w-full h-full flex flex-col lg:flex-row overflow-hidden">
        
        {/* ── LEFT COLUMN: INPUTS & CONTROLS (ZERO SCROLLBARS) ── */}
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
                    onClick={() => handleSelectPreset(preset)}
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
                onClick={() => handleToggleAppliance('space_heater')}
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
                onClick={() => handleToggleAppliance('kettle')}
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
                onClick={() => handleToggleAppliance('tv_console')}
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
                onClick={() => handleToggleAppliance('microwave')}
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
              onClick={() => setIsDaisyChainActive(v => !v)}
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

          {/* Section 3: Consumer Unit Panel Type (3-Way Segmented Control) */}
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
                  onClick={() => handleUpdateBreakerMode(cfg.id as BreakerConfigurationMode)}
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

          {/* Section 4: Breaker Actions (Side by Side) */}
          <div className="pt-1 border-t border-slate-800 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
              4. MANUAL BREAKER ACTIONS
            </span>

            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handleSafeRecloseBreaker('c2_living_sockets')}
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
                onClick={handleSafeTestTripRCCB}
                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] text-center transition-all cursor-pointer flex flex-col items-center justify-center border border-amber-400 shadow-sm leading-tight"
              >
                <span>🟡 TEST 'T' BUTTON</span>
                <span className="text-[8px] font-sans font-normal opacity-90">Test Tripping</span>
              </button>
            </div>
          </div>

        </aside>

        {/* ── CENTER COLUMN: VISUAL SIMULATOR VIEWPORT (FLEX-1) ── */}
        <main className="flex-1 h-full min-w-0 flex flex-col bg-slate-950 relative overflow-hidden">
          
          {/* Slim Visual Stage Mode Tab Bar (34px) */}
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
                onClick={() => setIsXRay(v => !v)}
                className={cn(
                  "px-2 py-0.5 rounded text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 border",
                  isXRay ? "bg-cyan-950 text-cyan-300 border-cyan-700" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                )}
                title="Toggle wall peel to see hidden electrical conduits"
              >
                <Eye className="w-3 h-3" />
                <span>{isXRay ? 'X-Ray: ON' : 'X-Ray: OFF'}</span>
              </button>
            </div>
          </div>

          {/* PURE VISUAL ANIMATION CANVAS (FILLS 100% OF REMAINING HEIGHT WITH ZERO SCROLLBARS) */}
          <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden flex items-center justify-center p-1">
            
            {viewMode === 'house' && (
              <IsometricHouseView
                isXRay={isXRay}
                onToggleXRay={() => setIsXRay(v => !v)}
                circuitStates={circuitStates}
                activeApplianceIds={activeApplianceIds}
                onToggleAppliance={handleToggleAppliance}
                isTripped={isTripped}
                isShortCircuit={isShortCircuit}
                isOverloaded={isOverloaded}
                scenarioId={selectedScenario.id}
                onOpenDBBox={() => setViewMode('db_box')}
                isDaisyChainActive={isDaisyChainActive}
                onToggleDaisyChain={() => setIsDaisyChainActive(v => !v)}
                className="w-full h-full rounded-xl overflow-hidden"
              />
            )}

            {viewMode === 'toroid' && (
              <div className="w-full h-full p-1 overflow-hidden flex flex-col">
                <ToroidCoreVisualizer
                  initialLeakageMA={selectedScenario.leakageCurrentMA}
                  rccbRatingMA={30}
                  isExternalTripped={rccbState.state !== 'CLOSED'}
                  onTrip={handleSafeTestTripRCCB}
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
                  onRecloseBreaker={handleSafeRecloseBreaker}
                  onTestTripRCCB={handleSafeTestTripRCCB}
                  leakageCurrentMA={leakageCurrentMA}
                  className="flex-1 w-full h-full overflow-hidden"
                />
              </div>
            )}
          </div>

        </main>

        {/* ── RIGHT COLUMN: RESULTS, STATUS & SAFETY INFO (ZERO SCROLLBARS) ── */}
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
            <div className="flex items-center gap-1.5">
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
                ? `Hidden copper wire heating up (${livingCountdownSec.toFixed(0)}s countdown).`
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
                <strong className={cn(c2State.currentAmps > 16 ? "text-rose-400 font-black" : "text-slate-200")}>
                  {c2State.currentAmps.toFixed(1)}A / 16A
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

          {/* Section 3: "What Just Happened?" (Story for a 10-Year-Old) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 space-y-1">
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

            <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
              {/* Full Safety Audit Report */}
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(true)}
                className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/70 text-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5 truncate"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Safety Audit</span>
              </button>

              {/* Scavenger Hunt */}
              <button
                type="button"
                onClick={() => setIsScavengerModalOpen(true)}
                className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-850 border border-slate-800 text-orange-300 transition-colors cursor-pointer flex items-center gap-1.5 truncate"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">Find DB Box</span>
              </button>

              {/* Shock Rescue Drill */}
              <button
                type="button"
                onClick={() => setIsShockDrillOpen(true)}
                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-600/70 text-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 truncate"
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Shock Drill</span>
              </button>

              {/* Certificate & Fridge Checklist */}
              <button
                type="button"
                onClick={() => setIsCertificateOpen(true)}
                className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/70 text-amber-200 transition-colors cursor-pointer flex items-center gap-1.5 truncate"
              >
                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Certificate</span>
              </button>
            </div>
          </div>

        </aside>

      </div>

      {/* MODALS */}
      {isAuditModalOpen && (
        <HomeSafetyAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          selectedScenario={selectedScenario}
          circuitStates={circuitStates}
          livingCountdownSec={livingCountdownSec}
          leakageCurrentMA={leakageCurrentMA}
          breakerMode={breakerMode}
          onChangeBreakerMode={handleUpdateBreakerMode}
        />
      )}

      {isScavengerModalOpen && (
        <ScavengerHuntModal
          isOpen={isScavengerModalOpen}
          onClose={() => setIsScavengerModalOpen(false)}
          onOpenDBBoxView={() => setViewMode('db_box')}
        />
      )}

      {isShockDrillOpen && (
        <ShockRescueDrillModal
          isOpen={isShockDrillOpen}
          onClose={() => setIsShockDrillOpen(false)}
        />
      )}

      {isCertificateOpen && (
        <FamilyCertificateModal
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          totalScore={assessmentState.totalScore}
        />
      )}

      {isVELCBLabOpen && (
        <VELCBComparisonModal
          isOpen={isVELCBLabOpen}
          onClose={() => setIsVELCBLabOpen(false)}
        />
      )}

    </div>
  );
};
