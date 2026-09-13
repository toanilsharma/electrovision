/**
 * HomeGuardSimulator.tsx
 * 
 * ONE Physics Engine with THREE Presentation Layers:
 * - 🏠 SIMPLE (Housewives / Children): Warm light theme, Nunito, full-bleed 2.5D house, story carousel, spotlight system, smiley gauge, 12-word narration bar, >=56px tap targets.
 * - 🎓 LEARN (Students / Homeowners): Clean pedagogical UI with "Why did it trip?" lesson overlays and guided missions.
 * - 👷 EXPERT (Engineers / Technicians): Today's full 3-column cockpit unchanged (all views, µWb, Ra, points).
 * 
 * Toggled top-right and persisted in localStorage: 'homeguard_presentation_mode'.
 */

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useHomeGuardEngine } from './hooks/useHomeGuardEngine';
import { HomeGuardSimpleShell } from './components/HomeGuardSimpleShell';
import { HomeGuardLearnShell } from './components/HomeGuardLearnShell';
import { HomeGuardExpertShell } from './components/HomeGuardExpertShell';

// Lazy-loaded modals for performance (CLS=0, faster initial paint)
const VELCBComparisonModal = lazy(() => import('./components/VELCBComparisonModal').then(m => ({ default: m.VELCBComparisonModal })));
const HomeSafetyAuditModal = lazy(() => import('./components/HomeSafetyAuditModal').then(m => ({ default: m.HomeSafetyAuditModal })));
const ScavengerHuntModal = lazy(() => import('./components/ScavengerHuntModal').then(m => ({ default: m.ScavengerHuntModal })));
const ShockRescueDrillModal = lazy(() => import('./components/ShockRescueDrillModal').then(m => ({ default: m.ShockRescueDrillModal })));
const FamilyCertificateModal = lazy(() => import('./components/FamilyCertificateModal').then(m => ({ default: m.FamilyCertificateModal })));
import { HomeGuardTourModal } from './components/HomeGuardTourModal';
import { CurrentBalanceGauge } from './components/CurrentBalanceGauge';
import { WhatJustHappenedCard } from './components/WhatJustHappenedCard';
import { calculatePowerBreakdown } from './data/homeguardAppliances';
import { homeguardAudio } from './utils/homeguardAudio';
import { HOMEGUARD_PRESETS, HomeGuardPreset } from './data/homeguardPresets';
import { RESIDENTIAL_SCENARIOS } from './data/residentialProfile';
import {
  parseHomeGuardUrlParams,
  updateHomeGuardUrl,
  buildHomeGuardShareableUrl,
  BreakerConfigurationMode
} from './data/auditReportData';
import {
  loadAssessmentState,
  recordMissionPassed,
  resetAssessmentState,
  MissionAssessmentState
} from './data/assessmentStorage';
import { MCBState, TripCause } from '@/src/mcb/types';
import { cn } from '@/src/lib/utils';
import {
  Home,
  RotateCcw,
  Volume2,
  VolumeX,
  Share2,
  Check
} from 'lucide-react';

export type PresentationMode = 'simple' | 'learn' | 'expert';

export const HomeGuardSimulator: React.FC = () => {
  // Presentation Layer Mode: persisted in localStorage (DEFAULT IS LEARN)
  const [presentationMode, setPresentationMode] = useState<PresentationMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('homeguard_presentation_mode');
      if (saved === 'simple' || saved === 'learn' || saved === 'expert') {
        return saved;
      }
    }
    return 'learn';
  });

  const handleModeChange = (mode: PresentationMode) => {
    setPresentationMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homeguard_presentation_mode', mode);
    }
  };

  // Shared Simulator States
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
    'air_conditioner',
    'refrigerator'
  ]);

  // Multi-branch Circuit Power Breakdown (100% Physics Synced: I = P / V)
  const powerBreakdown = useMemo(() => calculatePowerBreakdown(activeApplianceIds), [activeApplianceIds]);
  const dynamicC2Amps = powerBreakdown.c2Amps;
  const dynamicC3Amps = powerBreakdown.c3Amps;

  // New Modals (Rec 6 & 7 & 8)
  const [isTourModalOpen, setIsTourModalOpen] = useState<boolean>(false);
  const [isBalanceGaugeOpen, setIsBalanceGaugeOpen] = useState<boolean>(false);
  const [isWhatHappenedDismissed, setIsWhatHappenedDismissed] = useState<boolean>(false);

  // SINGLE PHYSICS ENGINE INSTANCE (Multi-Branch C2 + C3)
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
  } = useHomeGuardEngine('normal_living', dynamicC2Amps, dynamicC3Amps);

  // Sync audio mute state
  useEffect(() => {
    homeguardAudio.setMuted(isMuted);
  }, [isMuted]);

  const c2State = circuitStates.c2_living_sockets;
  const rccbState = circuitStates.main_rccb;
  const isTripped = c2State.state !== 'CLOSED' || rccbState.state !== 'CLOSED';
  const isShortCircuit = selectedScenario.faultType === 'short_circuit' && !isTripped;

  // Audio + Haptic: play trip sound when circuit breaker trips
  useEffect(() => {
    if (isTripped) {
      homeguardAudio.playBreakerTripSound();
      // Haptic feedback on trip (mobile)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
    }
  }, [isTripped]);

  // Audio: play arc sizzle on short circuit
  useEffect(() => {
    if (isShortCircuit) {
      homeguardAudio.playArcSizzleSound();
    }
  }, [isShortCircuit]);

  // Audio: play subtle wire hum warning when current approaches rated capacity (>14.4A on 16A branch)
  useEffect(() => {
    if (!isTripped && (dynamicC2Amps > 14.4 || dynamicC3Amps > 14.4)) {
      const humInterval = setInterval(() => {
        homeguardAudio.playWireHumWarningSound();
      }, 3500);
      return () => clearInterval(humInterval);
    }
  }, [isTripped, dynamicC2Amps, dynamicC3Amps]);

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

  // Record score when passed + play success chime + haptic
  useEffect(() => {
    if (isMissionActivePassed) {
      homeguardAudio.playSuccessChime();
      // Haptic feedback on save/mission pass (mobile)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 30, 50, 30, 100]);
      }
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

  // Determine Trip Type for "What Just Happened?" 3-Beat Card (Rec 8)
  const tripType = useMemo(() => {
    if (!isTripped) return null;
    if (selectedScenario.faultType === 'thermal_overload') return 'overload';
    if (selectedScenario.faultType === 'short_circuit') return 'short_circuit';
    if (selectedScenario.faultType === 'child_shock') return 'child_shock';
    if (selectedScenario.faultType === 'earth_leakage') return 'water_leak';
    if (rccbState.tripCause === 'TEST_TRIP') return 'test_trip';
    if (c2State.state !== MCBState.CLOSED) return 'overload';
    if (rccbState.state !== MCBState.CLOSED) return 'water_leak';
    return null;
  }, [isTripped, selectedScenario.faultType, rccbState.tripCause, c2State.state, rccbState.state]);

  // Reset What Happened card dismissal on new trip
  useEffect(() => {
    if (isTripped) {
      setIsWhatHappenedDismissed(false);
    }
  }, [isTripped]);

  // Quick Fix helper action (Unplug heavy loads and safely restore)
  const handleQuickFixReset = () => {
    setActiveApplianceIds(prev => prev.filter(id => id !== 'space_heater' && id !== 'kettle'));
    setTimeout(() => {
      handleRecloseBreaker('c1_lighting');
      handleRecloseBreaker('c2_living_sockets');
      handleRecloseBreaker('c3_kitchen_sockets');
      handleRecloseBreaker('main_rccb');
      homeguardAudio.playBreakerResetSound();
      homeguardAudio.playSuccessChime();
      setIsWhatHappenedDismissed(true);
      setHabitTip({
        type: 'success',
        text: '✨ Heavy loads unplugged & switches safely reset! Power restored.'
      });
      setTimeout(() => setHabitTip(null), 4000);
    }, 150);
  };

  // Safe reclose breaker logic (Rec 10: Real-life bounce-back enforcement)
  const handleSafeRecloseBreaker = (circuitId: string) => {
    const isOverloadStillPlugged = activeApplianceIds.includes('space_heater') && activeApplianceIds.includes('kettle');
    const isShortStillActive = selectedScenario.faultType === 'short_circuit';

    if (circuitId === 'c2_living_sockets' && (isOverloadStillPlugged || isShortStillActive)) {
      // Simulate real-life bounce-back: loud arc flash sound & trip sound!
      homeguardAudio.playArcSizzleSound();
      homeguardAudio.playBreakerTripSound();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 150]);
      }
      setHabitTip({
        type: 'warn',
        text: isShortStillActive
          ? '⚠️ BREAKER BOUNCED BACK! Crushed shorted wire is still connected. In real life, resetting into a short causes an explosive flash!'
          : '⚠️ UNPLUG HEATER FIRST! Breaker bounced back! In real life, turning on into a 23A overload causes an electric spark in your face!'
      });
      setTimeout(() => setHabitTip(null), 6000);
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
    if (preset.id === 'preset_normal') {
      handleScenarioChange('normal_living');
      setActiveApplianceIds(['tv_console', 'air_conditioner', 'refrigerator']);
      handleRecloseBreaker('c1_lighting');
      handleRecloseBreaker('c2_living_sockets');
      handleRecloseBreaker('c3_kitchen_sockets');
      handleRecloseBreaker('main_rccb');
      setHabitTip(null);
    } else if (preset.id === 'preset_overload') {
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

  // Master Reset: Full return to Normal Safe Condition
  const handleMasterReset = () => {
    const normalPreset = HOMEGUARD_PRESETS[0]; // preset_normal
    setSelectedPreset(normalPreset);
    handleScenarioChange('normal_living');
    setActiveApplianceIds(['tv_console', 'air_conditioner', 'refrigerator']);
    handleRecloseBreaker('c1_lighting');
    handleRecloseBreaker('c2_living_sockets');
    handleRecloseBreaker('c3_kitchen_sockets');
    handleRecloseBreaker('main_rccb');
    setTimeLapseSpeed(1);
    setIsDaisyChainActive(false);
    setBreakerMode('rccb_mcb');
    setHabitTip({
      type: 'success',
      text: '🔄 Simulator Reset: Returned to Normal Safe Condition. All switches ON.'
    });
    setTimeout(() => setHabitTip(null), 3500);
  };

  // Reset mission progress / score
  const handleResetProgress = () => {
    const cleared = resetAssessmentState();
    setAssessmentState(cleared);
    setHabitTip({
      type: 'success',
      text: '✨ Learning progress reset. Ready for a new run!'
    });
    setTimeout(() => setHabitTip(null), 3000);
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
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 select-none overflow-hidden relative">
      
      {/* ── TOP-RIGHT PERSISTED PRESENTATION LAYER CONTROLLER BAR (40px) ── */}
      <header className={cn(
        "h-10 shrink-0 px-3 flex items-center justify-between gap-2 text-xs z-40 border-b transition-colors",
        presentationMode === 'simple'
          ? "bg-amber-100/95 border-amber-300/80 text-amber-950"
          : "bg-slate-900 border-slate-800 text-slate-200"
      )}>
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center font-bold text-sm",
            presentationMode === 'simple'
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-orange-500/20 border border-orange-500/40 text-orange-400"
          )}>
            <Home className="w-3.5 h-3.5" />
          </div>
          <span className="font-black uppercase tracking-wider text-xs">
            HOMEGUARD™
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold hidden sm:inline",
            presentationMode === 'simple'
              ? "bg-amber-200/80 text-amber-900 border border-amber-300"
              : "bg-cyan-950 text-cyan-300 border border-cyan-800"
          )}>
            ⚡ 230V Physics Engine
          </span>
        </div>

        {/* Center/Right: THREE PRESENTATION LAYERS TOGGLE [🏠 SIMPLE | 🎓 LEARN | 👷 EXPERT] */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={cn(
            "flex items-center p-0.5 rounded-xl border font-bold text-xs shadow-inner",
            presentationMode === 'simple'
              ? "bg-amber-200/60 border-amber-300 text-amber-950"
              : "bg-slate-950 border-slate-800 text-slate-300"
          )}>
            <button
              type="button"
              id="mode-simple-btn"
              onClick={() => handleModeChange('simple')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 min-h-[30px]",
                presentationMode === 'simple'
                  ? "bg-amber-500 text-white font-black shadow-md"
                  : "hover:text-amber-500"
              )}
            >
              <span>🏠 SIMPLE</span>
            </button>

            <button
              type="button"
              id="mode-learn-btn"
              onClick={() => handleModeChange('learn')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 min-h-[30px]",
                presentationMode === 'learn'
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md"
                  : "hover:text-cyan-400"
              )}
            >
              <span>🎓 LEARN</span>
            </button>

            <button
              type="button"
              id="mode-expert-btn"
              onClick={() => handleModeChange('expert')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 min-h-[30px]",
                presentationMode === 'expert'
                  ? "bg-orange-500 text-slate-950 font-black shadow-md"
                  : "hover:text-orange-400"
              )}
            >
              <span>👷 EXPERT</span>
            </button>
          </div>

          {/* Quick Action Tools (Labeled for accessibility & clarity) */}
          <div className="flex items-center gap-1.5">
            {/* 30-Second Guided Tour Button (Rec 6) */}
            <button
              type="button"
              onClick={() => setIsTourModalOpen(true)}
              className={cn(
                "px-2 py-1 rounded-lg border transition-all cursor-pointer min-h-[30px] flex items-center gap-1 text-[11px] font-black",
                presentationMode === 'simple'
                  ? "bg-amber-400 text-amber-950 border-amber-500 shadow-sm"
                  : "bg-cyan-950 border-cyan-700 text-cyan-300 hover:bg-cyan-900"
              )}
              title="Open 30-Second Interactive Guided Tour"
            >
              <span className="text-xs">🚀</span>
              <span className="hidden lg:inline">30s Tour</span>
            </button>

            {/* Current Balance Gauge Button (Rec 7) */}
            <button
              type="button"
              onClick={() => setIsBalanceGaugeOpen(true)}
              className={cn(
                "px-2 py-1 rounded-lg border transition-all cursor-pointer min-h-[30px] flex items-center gap-1 text-[11px] font-bold",
                presentationMode === 'simple'
                  ? "bg-white border-amber-300 text-amber-900 hover:bg-amber-50"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-300"
              )}
              title="Open Water-Balance Flow Meter (Kirchhoff's Law)"
            >
              <span className="text-xs">⚖️</span>
              <span className="hidden md:inline">Balance</span>
            </button>

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
              className={cn(
                "px-2 py-1 rounded-lg border transition-colors cursor-pointer min-h-[30px] flex items-center gap-1 text-[11px] font-bold",
                presentationMode === 'simple'
                  ? "bg-white border-amber-300 text-amber-900 hover:bg-amber-50"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-purple-300"
              )}
              title="Share Simulator URL"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMuted(m => !m)}
              className={cn(
                "px-2 py-1 rounded-lg border transition-colors cursor-pointer min-h-[30px] flex items-center gap-1 text-[11px] font-bold",
                presentationMode === 'simple'
                  ? "bg-white border-amber-300 text-amber-900 hover:bg-amber-50"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              )}
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-500" />}
              <span className="hidden md:inline">{isMuted ? 'Muted' : 'Sound'}</span>
            </button>

            <button
              type="button"
              id="master-reset-btn"
              onClick={handleMasterReset}
              className={cn(
                "px-2.5 py-1 rounded-lg border transition-colors cursor-pointer min-h-[30px] flex items-center gap-1.5 text-xs font-bold",
                presentationMode === 'simple'
                  ? "bg-white border-amber-300 text-rose-600 hover:bg-rose-50"
                  : "bg-slate-800 border-rose-500/50 text-rose-300 hover:bg-rose-900"
              )}
              title="Master Reset: Return to Normal Safe Condition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Share Toast */}
      {shareToast && (
        <div className="bg-purple-950 text-purple-200 px-4 py-1 text-xs font-bold text-center border-b border-purple-700 flex items-center justify-center gap-2 animate-in fade-in duration-150 z-50">
          <Check className="w-3.5 h-3.5 text-purple-300" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* ── ACTIVE PRESENTATION LAYER (100% Shared Physics Engine) ── */}
      <div className="flex-1 min-h-0 w-full h-full relative overflow-hidden flex flex-col">
        {presentationMode === 'simple' && (
          <HomeGuardSimpleShell
            circuitStates={circuitStates}
            selectedScenario={selectedScenario}
            onSelectScenarioId={handleScenarioChange}
            activeApplianceIds={activeApplianceIds}
            onToggleAppliance={handleToggleAppliance}
            isXRay={isXRay}
            onToggleXRay={() => setIsXRay(v => !v)}
            isDaisyChainActive={isDaisyChainActive}
            onToggleDaisyChain={() => setIsDaisyChainActive(v => !v)}
            onSafeRecloseBreaker={handleSafeRecloseBreaker}
            onSafeTestTripRCCB={handleSafeTestTripRCCB}
            timeLapseSpeed={timeLapseSpeed}
            onSpeedChange={setTimeLapseSpeed}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(m => !m)}
          />
        )}

        {presentationMode === 'learn' && (
          <HomeGuardLearnShell
            circuitStates={circuitStates}
            selectedScenario={selectedScenario}
            selectedPreset={selectedPreset}
            onSelectPreset={handleSelectPreset}
            breakerMode={breakerMode}
            onChangeBreakerMode={handleUpdateBreakerMode}
            activeApplianceIds={activeApplianceIds}
            onToggleAppliance={handleToggleAppliance}
            isXRay={isXRay}
            onToggleXRay={() => setIsXRay(v => !v)}
            isDaisyChainActive={isDaisyChainActive}
            onToggleDaisyChain={() => setIsDaisyChainActive(v => !v)}
            onSafeRecloseBreaker={handleSafeRecloseBreaker}
            onSafeTestTripRCCB={handleSafeTestTripRCCB}
            assessmentState={assessmentState}
            onResetProgress={handleResetProgress}
            habitTip={habitTip}
            livingCountdownSec={livingCountdownSec}
            leakageCurrentMA={leakageCurrentMA}
            onOpenCertificateModal={() => setIsCertificateOpen(true)}
          />
        )}

        {presentationMode === 'expert' && (
          <HomeGuardExpertShell
            circuitStates={circuitStates}
            selectedScenario={selectedScenario}
            selectedPreset={selectedPreset}
            onSelectPreset={handleSelectPreset}
            breakerMode={breakerMode}
            onChangeBreakerMode={handleUpdateBreakerMode}
            activeApplianceIds={activeApplianceIds}
            onToggleAppliance={handleToggleAppliance}
            isXRay={isXRay}
            onToggleXRay={() => setIsXRay(v => !v)}
            isDaisyChainActive={isDaisyChainActive}
            onToggleDaisyChain={() => setIsDaisyChainActive(v => !v)}
            onSafeRecloseBreaker={handleSafeRecloseBreaker}
            onSafeTestTripRCCB={handleSafeTestTripRCCB}
            assessmentState={assessmentState}
            onResetProgress={handleResetProgress}
            habitTip={habitTip}
            livingCountdownSec={livingCountdownSec}
            leakageCurrentMA={leakageCurrentMA}
            onOpenAuditModal={() => setIsAuditModalOpen(true)}
            onOpenScavengerModal={() => setIsScavengerModalOpen(true)}
            onOpenShockDrillModal={() => setIsShockDrillOpen(true)}
            onOpenCertificateModal={() => setIsCertificateOpen(true)}
          />
        )}
      </div>

      {/* MODALS (Lazy-loaded with Suspense for performance) */}
      <Suspense fallback={null}>
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
            onOpenDBBoxView={() => {}}
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

        {/* 30-Second Guided Tour Modal (Rec 6) */}
        <HomeGuardTourModal
          isOpen={isTourModalOpen}
          onClose={() => setIsTourModalOpen(false)}
        />

        {/* Water-In vs Water-Out Balance Meter Modal (Rec 7) */}
        <CurrentBalanceGauge
          liveAmps={c2State.currentAmps + circuitStates.c3_kitchen_sockets.currentAmps + 1.5}
          neutralAmps={isTripped ? 0 : (c2State.currentAmps + circuitStates.c3_kitchen_sockets.currentAmps + 1.5 - (leakageCurrentMA / 1000))}
          leakageCurrentMA={leakageCurrentMA}
          isTripped={isTripped}
          isOpen={isBalanceGaugeOpen}
          onClose={() => setIsBalanceGaugeOpen(false)}
        />

        {/* "What Just Happened?" 3-Beat Trip Explanation Card (Rec 8) */}
        {tripType && !isWhatHappenedDismissed && (
          <WhatJustHappenedCard
            tripType={tripType}
            onQuickFixReset={handleQuickFixReset}
            onDismiss={() => setIsWhatHappenedDismissed(true)}
          />
        )}
      </Suspense>

    </div>
  );
};
