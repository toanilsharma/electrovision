import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  RotateCcw,
  Play,
  Pause,
  SlidersHorizontal,
  BarChart3,
  Flame,
  Magnet,
  ShieldCheck,
  Info,
  Layers,
  Volume2,
  VolumeX,
  AlertTriangle,
  Activity,
  Check,
  Sparkles,
  FlaskConical,
  Award,
  Clock,
  FastForward,
  RefreshCw,
  Camera,
  HelpCircle,
  X
} from 'lucide-react';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { mcbSoundSystem } from '../../utils/mcbSoundPack';

import { MCBSimulator } from '../../mcb/MCBSimulator';
import { BimetalThermalModel } from '../../mcb/BimetalThermalModel';
import { SingleLineDiagram } from './SingleLineDiagram';
import { BreakerCutaway } from './BreakerCutaway';
import { CutawayView3D } from './3DCutawayView';
import { ExperimentBenchSLD, LoadType, FaultLocation } from './ExperimentBenchSLD';
import { DINRailMCBFaceplate } from './DINRailMCBFaceplate';
import { GSAPTripVerdictStamp } from './GSAPTripVerdictStamp';
import { MultiplierGauge } from './MultiplierGauge';
import { MissionCardsLab } from './MissionCardsLab';
import { MCBHazardConsole } from './MCBHazardConsole';
import { CanvasOscilloscope } from './CanvasOscilloscope';
import { CanvasTCCChart } from './CanvasTCCChart';
import { StandardsProofModal } from './StandardsProofModal';
import { EXPERIMENT_LAB_PRESETS, ExperimentPreset } from './ExperimentLabPresets';

import { useHaptics } from '../../hooks/useHaptics';
import { useArcFlash } from '../../hooks/useArcFlash';
import { useAudioTrip } from '../../hooks/useAudioTrip';
import { useMCBWorker } from '../../hooks/useMCBWorker';

import {
  MCBState,
  MCBTrippingCurve,
  SimulationSnapshot,
  TripCause,
  SystemType,
  CurrentType,
  FaultType
} from '../../mcb/types';
import { cn } from '@/src/lib/utils';

export interface QuickPreset {
  id: string;
  label: string;
  In: number;
  curve: MCBTrippingCurve;
  ambientTemp: number;
  faultCurrent: number;
  systemType: SystemType;
  currentType: CurrentType;
  faultType: FaultType;
  speed: number;
  description: string;
}

export const QUICK_PRESETS: QuickPreset[] = [
  { id: '1.13x_hold', label: '1.13x HOLD', In: 16, curve: 'C', ambientTemp: 30, faultCurrent: 18.08, systemType: '1ph_230v', currentType: 'ac', faultType: 'L-N', speed: 100, description: 'Conventional non-tripping current (1.13x In) holds indefinitely.' },
  { id: '1.45x_trip', label: '1.45x TRIP', In: 16, curve: 'C', ambientTemp: 30, faultCurrent: 23.2, systemType: '1ph_230v', currentType: 'ac', faultType: 'L-N', speed: 100, description: 'Conventional tripping current (1.45x In) trips bimetal in <=3600s.' },
  { id: '2.55x_band', label: '2.55x BAND', In: 16, curve: 'C', ambientTemp: 30, faultCurrent: 40.8, systemType: '1ph_230v', currentType: 'ac', faultType: 'L-N', speed: 10, description: 'High overload (2.55x In) trips bimetal within 1s to 60s.' },
  { id: 'inrush_c', label: 'INRUSH C', In: 16, curve: 'C', ambientTemp: 30, faultCurrent: 112.0, systemType: '1ph_230v', currentType: 'ac', faultType: 'L-N', speed: 1, description: 'Motor starting inrush (7x In decaying) holds without nuisance trip.' },
  { id: 'ln_short_12.5x', label: 'L-N SHORT 12.5x', In: 16, curve: 'C', ambientTemp: 30, faultCurrent: 200.0, systemType: '1ph_230v', currentType: 'ac', faultType: 'L-N', speed: 1, description: 'Instantaneous short-circuit fault clears in <10ms.' },
  { id: '3ph_bolted', label: '3Ø BOLTED', In: 16, curve: 'C', ambientTemp: 30, faultCurrent: 250.0, systemType: '3ph_400v', currentType: 'ac', faultType: '3ph_bolted', speed: 1, description: 'Symmetrical 3-phase bolted fault tripping all 3 poles.' },
  { id: 'dc_fault', label: 'DC FAULT', In: 16, curve: 'C', ambientTemp: 30, faultCurrent: 150.0, systemType: '1ph_230v', currentType: 'dc', faultType: 'L-N', speed: 1, description: 'DC inductive circuit interruption with L·di/dt voltage spike.' }
];

export const MCBLayoutShell: React.FC = () => {
  // Mobile Shell State
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(false);
  const [isMobileTCCOpen, setIsMobileTCCOpen] = useState<boolean>(false);
  const [isMobile3DOpen, setIsMobile3DOpen] = useState<boolean>(false);

  // System & Current Toggles
  const [systemType, setSystemType] = useState<SystemType>('1ph_230v');
  const [currentType, setCurrentType] = useState<CurrentType>('ac');
  const [faultType, setFaultType] = useState<FaultType>('L-N');

  // Experiment Bench State
  const [loadType, setLoadType] = useState<LoadType>('motor');
  const [faultLocation, setFaultLocation] = useState<FaultLocation>('load_side');
  
  // Preset and Mission selection
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentPreset>(EXPERIMENT_LAB_PRESETS[0]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(new Set());
  const [isProofModalOpen, setIsProofModalOpen] = useState<boolean>(false);

  // View Stage State: 'sld' | 'cutaway2d' | 'cutaway3d'
  const [centerView, setCenterView] = useState<'sld' | 'cutaway2d' | 'cutaway3d'>('sld');
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);

  // Simulator configuration state
  const [ratedCurrent, setRatedCurrent] = useState<number>(16);
  const [curve, setCurve] = useState<MCBTrippingCurve>('C');
  const [ambientTemp, setAmbientTemp] = useState<number>(30);
  const [faultCurrent, setFaultCurrent] = useState<number>(23.2); // ~1.45x In
  const [xrRatio, setXrRatio] = useState<number>(5);
  const [inceptionAngleDeg, setInceptionAngleDeg] = useState<number>(45);
  const [timeLapseSpeed, setTimeLapseSpeed] = useState<number>(1); // 0.25x, 1x, 10x, 100x

  // Simulation execution state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentSnapshot, setCurrentSnapshot] = useState<SimulationSnapshot | null>(null);

  // Visceral Animation & Sound State
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Visceral Feedback Hooks
  const { triggerOverloadHaptic, triggerShortCircuitHaptic } = useHaptics();
  const { triggerArcFlash, ArcFlashOverlay } = useArcFlash();
  const { playTripAudio } = useAudioTrip();

  // High-Performance Web Worker Pipeline Hook
  const { data: workerData, calculateWaveform } = useMCBWorker();

  // Simulator instance ref
  const simulatorRef = useRef<MCBSimulator>(
    new MCBSimulator(BimetalThermalModel.createCalibratedSpec(16, 'C', 30), 30)
  );

  const previousStateRef = useRef<MCBState>(MCBState.CLOSED);

  // Reset Simulation helper
  const resetSimulation = useCallback(() => {
    setIsSimulating(false);
    previousStateRef.current = MCBState.CLOSED;
    simulatorRef.current.reset(ambientTemp);
    simulatorRef.current.setFaultWaveform({
      I_rms: faultCurrent,
      frequency: currentType === 'dc' ? 0 : 50,
      inceptionAngle: (inceptionAngleDeg * Math.PI) / 180,
      xrRatio: xrRatio,
      systemType,
      currentType,
      faultType
    });
    const initialSnap = simulatorRef.current.step(0, faultCurrent);
    setCurrentSnapshot(initialSnap);
  }, [ambientTemp, faultCurrent, inceptionAngleDeg, xrRatio, systemType, currentType, faultType]);

  // FORCED RESET BUTTON HANDLER
  const handleForcedReset = () => {
    setIsSimulating(false);
    previousStateRef.current = MCBState.CLOSED;
    simulatorRef.current.reset(ambientTemp);
    simulatorRef.current.setFaultWaveform({
      I_rms: faultCurrent,
      frequency: currentType === 'dc' ? 0 : 50,
      inceptionAngle: (inceptionAngleDeg * Math.PI) / 180,
      xrRatio: xrRatio,
      systemType,
      currentType,
      faultType
    });
    const resetSnap = simulatorRef.current.step(0, faultCurrent);
    setCurrentSnapshot(resetSnap);
  };

  // Fast-Forward to Instant of Trip (For long thermal tests > 2s)
  const handleFastForwardToTrip = () => {
    if (!currentSnapshot) return;
    const spec = simulatorRef.current.getSpec();
    const tripTime = simulatorRef.current.getThermalModel().calculateTheoreticalTripTime(faultCurrent, ambientTemp);

    if (tripTime > 0 && tripTime < Infinity) {
      // Step simulation by exact theoretical trip time
      const snap = simulatorRef.current.step(tripTime, faultCurrent);
      setCurrentSnapshot(snap);
      setIsSimulating(false);
    }
  };

  const [isHighlightingControls, setIsHighlightingControls] = useState<boolean>(false);

  // Sync Master Audio Mute with MCBSoundSystem
  useEffect(() => {
    mcbSoundSystem.setMuted(isSoundMuted);
  }, [isSoundMuted]);

  // Continuous Electromagnetic Hum Proportional to Current
  useEffect(() => {
    mcbSoundSystem.updateCurrentHum(faultCurrent / ratedCurrent, isSimulating);
  }, [faultCurrent, ratedCurrent, isSimulating]);

  // Driver.js 5-Stop Guided Tour
  const handleStartTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      steps: [
        {
          element: '[data-tour="timewarp"]',
          popover: {
            title: '1. TIME WARP (1x / 10x / 100x)',
            description: 'Accelerate simulation speed to fast-forward prolonged thermal countdowns.'
          }
        },
        {
          element: '[data-tour="apply-fault"]',
          popover: {
            title: '2. APPLY FAULT CURRENT',
            description: 'Execute live IEC 60898-1 physics engine and trigger real-time bimetal/solenoid response.'
          }
        },
        {
          element: '[data-tour="tcc-chart"]',
          popover: {
            title: '3. TCC OPERATING POINT',
            description: 'Interactive log-log characteristic with real-time animated operating dot and fading trail.'
          }
        },
        {
          element: '[data-tour="oscilloscope"]',
          popover: {
            title: '4. 60FPS OSCILLOSCOPE',
            description: 'Continuous waveform trace with pre-fault load current and vertical trip markers.'
          }
        },
        {
          element: '[data-tour="stage-tabs"]',
          popover: {
            title: '5. MECHANISM & 3D COCKPIT',
            description: 'Switch between 2D SLD particle flow, 2D mechanism kinematics, and genuine 3D WebGL model.'
          }
        }
      ]
    });
    driverObj.drive();
  }, []);

  // Auto-launch tour on first visit
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('mcb_tour_completed')) {
      localStorage.setItem('mcb_tour_completed', 'true');
      setTimeout(handleStartTour, 600);
    }
  }, [handleStartTour]);

  // Assessment Score Calculation
  useEffect(() => {
    if (currentSnapshot?.state === MCBState.OPEN_CLEARED || currentSnapshot?.state === MCBState.UNLATCHED || (selectedExperiment.id === 'exp1_limits' && currentSnapshot?.state === MCBState.CLOSED)) {
      setCompletedMissionIds(prev => new Set([...prev, selectedExperiment.id]));
    }
  }, [currentSnapshot?.state, selectedExperiment.id]);

  const assessmentScore = Math.round((completedMissionIds.size / EXPERIMENT_LAB_PRESETS.length) * 100);

  // Handle Quick Preset 1-Tap Loading & URL Sharing
  const handleLoadQuickPreset = useCallback((preset: QuickPreset) => {
    setActivePresetId(preset.id);
    setRatedCurrent(preset.In);
    setCurve(preset.curve);
    setAmbientTemp(preset.ambientTemp);
    setFaultCurrent(preset.faultCurrent);
    setSystemType(preset.systemType);
    setCurrentType(preset.currentType);
    setFaultType(preset.faultType);
    setTimeLapseSpeed(preset.speed);

    // 400ms Highlight Ring on Changed Controls
    setIsHighlightingControls(true);
    setTimeout(() => setIsHighlightingControls(false), 400);

    // URL-Shareable Parameter Update
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('preset', preset.id);
      window.history.replaceState(null, '', url.toString());
    }

    // Arm Simulation in One Tap
    setTimeout(() => {
      resetSimulation();
      setIsSimulating(true);
    }, 50);
  }, [resetSimulation]);

  // Load Preset from URL on cold start
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get('preset');
    if (presetParam) {
      const matched = QUICK_PRESETS.find(p => p.id === presetParam);
      if (matched) {
        handleLoadQuickPreset(matched);
      }
    }
  }, [handleLoadQuickPreset]);

  // Handle Experiment Preset Selection (with 400ms control highlight pulse)
  const handleSelectExperiment = (exp: ExperimentPreset) => {
    setSelectedExperiment(exp);
    setRatedCurrent(exp.params.In);
    setCurve(exp.params.curve);
    setAmbientTemp(exp.params.ambientTemp);
    setFaultCurrent(exp.params.faultCurrent);
    setSystemType(exp.params.systemType);
    setCurrentType(exp.params.currentType);
    setFaultType(exp.params.faultType);
    setTimeLapseSpeed(exp.params.timeLapseSpeed);

    // 400ms Highlight Ring on Changed Controls
    setIsHighlightingControls(true);
    setTimeout(() => setIsHighlightingControls(false), 400);

    setTimeout(() => {
      resetSimulation();
      setIsSimulating(true);
    }, 50);
  };

  // Toggle or start fault simulation
  const handleToggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
    } else {
      if (currentSnapshot?.state === MCBState.OPEN_CLEARED || currentSnapshot?.state === MCBState.UNLATCHED) {
        resetSimulation();
      }
      setIsSimulating(true);
    }
  };

  // Ensure default faultType matches systemType
  useEffect(() => {
    if (systemType === '3ph_400v' && (faultType === 'L-N' || faultType === 'L-G')) {
      setFaultType('3ph_bolted');
    } else if (systemType === '1ph_230v' && (faultType === '3ph_bolted' || faultType === 'L-L')) {
      setFaultType('L-N');
    }
  }, [systemType, faultType]);

  // Re-initialize simulator and compute background worker waveform when parameters change
  useEffect(() => {
    const spec = BimetalThermalModel.createCalibratedSpec(ratedCurrent, curve, ambientTemp);
    simulatorRef.current = new MCBSimulator(spec, ambientTemp);

    calculateWaveform({
      In: ratedCurrent,
      curve,
      ambientTemp,
      faultCurrent,
      xrRatio,
      inceptionAngleDeg,
      systemType,
      currentType,
      faultType
    });

    resetSimulation();
  }, [ratedCurrent, curve, ambientTemp, faultCurrent, xrRatio, inceptionAngleDeg, systemType, currentType, faultType, calculateWaveform, resetSimulation]);

  // Handle Visceral Trip Effects & Audio
  const handleTripVisceralEffects = useCallback((snap: SimulationSnapshot) => {
    const isShortCircuit = snap.tripCause === TripCause.MAGNETIC || snap.tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE;

    // Howler synthesized audio triggers
    mcbSoundSystem.playRelayClick();
    mcbSoundSystem.playTripClack();
    if (isShortCircuit) {
      mcbSoundSystem.playArcHiss(0.08);
    }

    if (!isSoundMuted) {
      playTripAudio(isShortCircuit);
    }

    if (isShortCircuit) {
      triggerShortCircuitHaptic();
      triggerArcFlash();
    } else {
      triggerOverloadHaptic();
    }

    setTimeout(() => {
      setIsConsoleOpen(true);
    }, 1200);
  }, [isSoundMuted, playTripAudio, triggerShortCircuitHaptic, triggerOverloadHaptic, triggerArcFlash]);

  // Step Simulation Loop (Adaptive time step)
  useEffect(() => {
    if (!isSimulating) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const deltaSec = (time - lastTime) / 1000;
      lastTime = time;

      let magLower = 5;
      if (curve === 'B') magLower = 3;
      if (curve === 'D') magLower = 10;
      const isMagneticFault = (faultCurrent / ratedCurrent) >= magLower;

      let dt = 0.0003;
      if (!isMagneticFault) {
        dt = Math.min(2.5, deltaSec * timeLapseSpeed * 12.0);
      }

      const snap = simulatorRef.current.step(dt);
      setCurrentSnapshot(snap);

      if (previousStateRef.current === MCBState.CLOSED && snap.state !== MCBState.CLOSED) {
        handleTripVisceralEffects(snap);
      }
      previousStateRef.current = snap.state;

      if (snap.state !== MCBState.OPEN_CLEARED) {
        animId = requestAnimationFrame(loop);
      } else {
        setIsSimulating(false);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, timeLapseSpeed, faultCurrent, ratedCurrent, curve, handleTripVisceralEffects]);

  // Cumulative Layout Shift (CLS) PerformanceObserver Tracker
  const [clsScore, setClsScore] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    try {
      let cumulativeScore = 0;
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const shiftEntry = entry as unknown as { hadRecentInput: boolean; value: number };
          if (!shiftEntry.hadRecentInput) {
            cumulativeScore += shiftEntry.value;
            setClsScore(cumulativeScore);
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      return () => observer.disconnect();
    } catch {
      // Observer fallback
    }
  }, []);

  // Compute Live Reverse Countdown Timer
  const calculateRemainingTripTime = () => {
    if (!currentSnapshot || currentSnapshot.state === MCBState.OPEN_CLEARED) return 0;

    let magLower = 5;
    if (curve === 'B') magLower = 3;
    if (curve === 'D') magLower = 10;

    if (faultCurrent >= magLower * ratedCurrent) {
      return 0.0035; // 3.5 ms magnetic trip
    }

    const spec = simulatorRef.current.getSpec();
    const currentTemp = currentSnapshot.thermal.temperature;
    const T_ss = ambientTemp + (faultCurrent * faultCurrent * spec.R_th);
    const T_trip = 130;

    if (T_ss <= T_trip) {
      return Infinity; // Will never trip (1.13x In)
    }

    const ratio = (T_ss - T_trip) / Math.max(0.001, T_ss - currentTemp);
    if (ratio <= 0) return 0;
    return Math.max(0, spec.C_th * Math.log(1 / Math.max(1e-6, ratio)));
  };

  const remainingTimeSec = calculateRemainingTripTime();
  const In_eff = ratedCurrent * (1 - 0.005 * (ambientTemp - 30));
  const currentMultiplier = (faultCurrent / ratedCurrent).toFixed(2);
  const isMagneticTrip = currentSnapshot?.tripCause === TripCause.MAGNETIC || currentSnapshot?.tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE;

  const getAssumptionText = () => {
    if (currentType === 'dc') return 'Assumption: Pure DC Fault (L·di/dt Overvoltage Spike & Exponential Decay)';
    if (systemType === '3ph_400v') {
      if (faultType === '3ph_bolted') return 'Assumption: Balanced 3-Phase Fault (Ia, Ib, Ic 120° apart)';
      if (faultType === 'L-L') return 'Assumption: Line-to-Line Fault (Phase A & B anti-phase, 86.6% mag)';
      return 'Assumption: Line-to-Ground Fault (Phase A carries 100% fault current)';
    }
    return 'Assumption: Single Phase 230V Fault (Phase A to Neutral / Ground)';
  };

  // EXPORT SNAPSHOT COMPOSITE GENERATOR
  const handleExportSnapshot = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark canvas background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 1280, 720);

    // Top Header Banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1280, 70);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 1280, 70);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('ELECTROLIVE • IEC 60898-1 MCB COCKPIT REPORT', 30, 44);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`Curve: ${curve}${ratedCurrent} | Fault: ${faultCurrent.toFixed(1)}A (${currentMultiplier}x In) | System: ${systemType === '3ph_400v' ? '3Ø 400V' : '1Ø 230V'} ${currentType.toUpperCase()}`, 680, 44);

    // Grid Borders for Instruments
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(30, 90, 600, 390); // Scope Box
    ctx.fillRect(650, 90, 600, 390); // TCC Box
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(30, 90, 600, 390);
    ctx.strokeRect(650, 90, 600, 390);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('60fps Waveform Oscilloscope [uPlot]', 45, 120);
    ctx.fillText(`D3 Time-Current Characteristic (Curve ${curve})`, 665, 120);

    // Draw Verdict Stamp Banner
    const isTrip = currentSnapshot?.state !== MCBState.CLOSED;
    ctx.fillStyle = isTrip ? '#991b1b' : '#065f46';
    ctx.fillRect(30, 500, 1220, 130);
    ctx.strokeStyle = isTrip ? '#ef4444' : '#10b981';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 500, 1220, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    const verdictMsg = isTrip 
      ? `VERDICT: TRIPPED (${currentSnapshot?.tripCause || 'FAULT'}) • Clearing Time: ${((currentSnapshot?.letThrough.clearingTime || 0.0085) * 1000).toFixed(1)} ms`
      : 'VERDICT: CLOSED & ENERGIZED (Continuous Normal Operation)';
    ctx.fillText(verdictMsg, 50, 550);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Let-Through I²t: ${(currentSnapshot?.letThrough.i2t || 0).toFixed(1)} A²s | Peak Ip: ${(currentSnapshot?.letThrough.peakLetThroughCurrent || ratedCurrent * 1.414).toFixed(1)} A | κ-Factor: ${(currentSnapshot?.magnetic.kappaPeakFactor || 1.45).toFixed(2)} | Ambient: ${ambientTemp}°C`, 50, 595);

    // Footer Metadata
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText(`Generated: ${new Date().toISOString()} • IEC 60898-1 Compliance Suite`, 30, 685);

    // Trigger Instant Download
    const link = document.createElement('a');
    link.download = `MCB_${curve}${ratedCurrent}_${faultCurrent.toFixed(0)}A_Snapshot.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [curve, ratedCurrent, faultCurrent, currentMultiplier, systemType, currentType, currentSnapshot, ambientTemp]);

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-mono select-none relative">
      <ArcFlashOverlay />
      <StandardsProofModal isOpen={isProofModalOpen} onClose={() => setIsProofModalOpen(false)} />

      {/* 1. TOP HEADER BAR (48px) - Fit-to-screen Grid Header */}
      <header className="h-[48px] shrink-0 px-3 py-1 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-2 text-xs font-bold z-30">
        
        {/* Left: App Title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-black text-white uppercase tracking-wider text-sm hidden sm:inline">
            IEC 60898-1 MCB Cockpit
          </span>
        </div>

        {/* Center: System, Current Type, and Unified Segmented TIME WARP */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar whitespace-nowrap">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] shrink-0">
            <button
              onClick={() => setSystemType('1ph_230v')}
              className={cn(
                "px-2.5 py-1 rounded font-bold uppercase transition-all cursor-pointer min-h-[32px] shrink-0",
                systemType === '1ph_230v' ? "bg-emerald-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
              )}
            >
              1φ 230V
            </button>
            <button
              onClick={() => setSystemType('3ph_400v')}
              className={cn(
                "px-2.5 py-1 rounded font-bold uppercase transition-all cursor-pointer min-h-[32px] shrink-0",
                systemType === '3ph_400v' ? "bg-emerald-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
              )}
            >
              3φ 400V
            </button>
          </div>

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] shrink-0">
            <button
              onClick={() => setCurrentType('ac')}
              className={cn(
                "px-2.5 py-1 rounded font-bold uppercase transition-all cursor-pointer min-h-[32px] shrink-0",
                currentType === 'ac' ? "bg-sky-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
              )}
            >
              AC (50Hz)
            </button>
            <button
              onClick={() => setCurrentType('dc')}
              className={cn(
                "px-2.5 py-1 rounded font-bold uppercase transition-all cursor-pointer min-h-[32px] shrink-0",
                currentType === 'dc' ? "bg-amber-500 text-slate-950 font-black shadow" : "text-amber-400 hover:text-amber-200"
              )}
            >
              DC Mode
            </button>
          </div>

          {/* ONE UNIFIED TIME WARP SEGMENTED CONTROL (0.25x / 1x / 10x / 100x) */}
          <div data-tour="timewarp" className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] shrink-0 gap-0.5">
            <span className="text-slate-400 font-bold px-1.5 hidden md:inline">TIME WARP:</span>
            {([0.25, 1, 10, 100] as const).map(speed => (
              <button
                key={speed}
                onClick={() => setTimeLapseSpeed(speed)}
                className={cn(
                  "px-2 py-0.5 rounded font-black transition-all cursor-pointer min-h-[30px] shrink-0",
                  timeLapseSpeed === speed ? "bg-orange-500 text-slate-950 shadow font-black" : "text-slate-400 hover:text-white"
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Tour, Export Snapshot, Standards Proof, Audio Toggle, Forced Reset */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* INTERACTIVE COACH-MARKS TOUR LAUNCHER */}
          <button
            onClick={handleStartTour}
            className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/60 hover:bg-sky-900 text-sky-300 text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 min-h-[34px] shrink-0"
            title="Start Guided Coach-Marks Tour"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> <span className="hidden sm:inline">TOUR</span>
          </button>

          {/* EXPORT SNAPSHOT BUTTON */}
          <button
            onClick={handleExportSnapshot}
            className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/60 hover:bg-sky-900 text-sky-300 text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 min-h-[34px] shrink-0"
            title="Export High-Resolution Snapshot (TCC + Scope + Stamp)"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" /> <span className="hidden sm:inline">EXPORT SNAPSHOT</span>
          </button>

          <button
            onClick={() => setIsProofModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 min-h-[34px] shrink-0"
            title="IEC 60898-1 Table 7 Validation Table"
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" /> <span className="hidden sm:inline">STANDARDS PROOF</span>
          </button>

          <button
            onClick={() => setIsSoundMuted(m => !m)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors cursor-pointer min-h-[34px] flex items-center justify-center shrink-0"
            title={isSoundMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* FORCED RESET BUTTON IN HEADER */}
          <button
            onClick={handleForcedReset}
            className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/80 hover:bg-rose-900 text-rose-200 text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 min-h-[34px] shrink-0"
            title="Force Reset / Re-close MCB"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" /> <span className="hidden sm:inline">FORCE RESET</span>
          </button>
        </div>
      </header>

      {/* 2. PRESET CHIPS ROW & ASSESSMENT SCORE BANNER */}
      <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[11px] font-mono flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar whitespace-nowrap">
        {/* Quick Preset Chips Row */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> PRESETS:
          </span>
          {QUICK_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleLoadQuickPreset(preset)}
                className={cn(
                  "px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer shrink-0 border min-h-[28px]",
                  isActive 
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]" 
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                )}
                title={preset.description}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Assessment Score Badge & Countdown Timer */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-[11px] shadow">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>ASSESSMENT SCORE: <strong>{completedMissionIds.size} / {EXPERIMENT_LAB_PRESETS.length} ({assessmentScore}%)</strong></span>
          </div>

          {/* Clock Timer for Trips > 2 Seconds with Fast-Forward button */}
          {remainingTimeSec !== undefined && remainingTimeSec > 2.0 && remainingTimeSec < 3600 && (
            <div className="flex items-center gap-2 bg-amber-950/90 border border-amber-500/80 px-2 py-0.5 rounded-lg text-amber-300 font-bold text-[11px] animate-pulse shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>COUNTDOWN: <strong>{remainingTimeSec.toFixed(1)}s</strong></span>
              <button
                onClick={handleFastForwardToTrip}
                className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <FastForward className="w-3 h-3 fill-current" /> FAST-FORWARD
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN COCKPIT CONTAINER - DESKTOP (≥1024px) LOCKED + MOBILE (<1024px) SHELL */}
      
      {/* DESKTOP VIEW (≥1024px): 3-COLUMN COCKPIT GRID LOCKED */}
      <div className="hidden lg:flex flex-1 min-h-0 flex-row overflow-hidden relative">
        
        {/* LEFT CONTROL RAIL (260px) */}
        <aside className="w-[260px] shrink-0 h-full border-r border-slate-800 bg-slate-900/90 flex flex-col overflow-y-auto p-2.5 space-y-2.5 z-20 font-mono text-xs">
          
          {/* DIN RAIL PHOTOREALISTIC BRAND-NEUTRAL MCB FACEPLATE */}
          <DINRailMCBFaceplate
            In={ratedCurrent}
            curve={curve}
            state={currentSnapshot?.state || MCBState.CLOSED}
            tripCause={currentSnapshot?.tripCause || TripCause.NONE}
            onReclose={handleForcedReset}
          />

          {/* MISSION CARDS WITH SEQUENTIAL PROGRESS DOTS */}
          <MissionCardsLab
            selectedExperiment={selectedExperiment}
            onSelectExperiment={handleSelectExperiment}
            state={currentSnapshot?.state || MCBState.CLOSED}
            tripCause={currentSnapshot?.tripCause || TripCause.NONE}
            className={isHighlightingControls ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 transition-all duration-300" : ""}
          />

          {/* Primary Action Trigger Button */}
          <button
            data-tour="apply-fault"
            onClick={handleToggleSimulation}
            className={cn(
              "w-full py-2.5 rounded-xl font-black uppercase tracking-wider text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg min-h-[40px] shrink-0",
              isSimulating ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-500 hover:bg-emerald-400",
              isHighlightingControls ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950" : ""
            )}
          >
            {isSimulating ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isSimulating ? 'PAUSE FAULT' : 'APPLY FAULT CURRENT'}
          </button>

          {/* FORCED RESET / RE-CLOSE BUTTON */}
          <button
            onClick={handleForcedReset}
            className="w-full py-2 rounded-xl font-black uppercase tracking-wider bg-rose-950/80 border border-rose-500/80 hover:bg-rose-900 text-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg min-h-[38px] shrink-0"
          >
            <RefreshCw className="w-4 h-4 text-rose-400" />
            FORCED RESET / RE-CLOSE
          </button>

          {/* Fault Type Selector */}
          <div className={isHighlightingControls ? "ring-2 ring-cyan-400 p-0.5 rounded-lg" : ""}>
            <label className="text-[11px] text-slate-400 font-bold uppercase block mb-0.5">Fault Distribution</label>
            <select
              value={faultType}
              onChange={(e) => setFaultType(e.target.value as FaultType)}
              className="w-full bg-slate-950 border border-slate-750 rounded-lg p-1.5 text-xs font-bold text-white min-h-[38px]"
            >
              {systemType === '3ph_400v' ? (
                <>
                  <option value="3ph_bolted">3-Phase Bolted Fault</option>
                  <option value="L-L">Line-to-Line Fault (L-L)</option>
                  <option value="L-G">Line-to-Ground Fault (L-G)</option>
                </>
              ) : (
                <>
                  <option value="L-N">Line-to-Neutral Fault (L-N)</option>
                  <option value="L-G">Line-to-Ground Fault (L-G)</option>
                </>
              )}
            </select>
          </div>

          {/* Curve Selection (B, C, D) */}
          <div className={isHighlightingControls ? "ring-2 ring-cyan-400 p-0.5 rounded-xl" : ""}>
            <label className="text-[11px] text-slate-400 font-bold uppercase block mb-0.5">Tripping Curve (IEC 60898-1)</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              {(['B', 'C', 'D'] as MCBTrippingCurve[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCurve(c)}
                  className={cn(
                    "py-1 rounded-lg font-black transition-all cursor-pointer min-h-[32px] shrink-0",
                    curve === c ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  Curve {c}
                </button>
              ))}
            </div>
          </div>

          {/* MULTIPLIER GAUGE WITH IEC 60898-1 COLOUR ZONES */}
          <MultiplierGauge
            multiplier={Number(currentMultiplier)}
            curve={curve}
            ratedCurrent={ratedCurrent}
            faultCurrent={faultCurrent}
          />

          {/* Prospective Fault Current Slider */}
          <div className={isHighlightingControls ? "ring-2 ring-cyan-400 p-1 rounded-lg" : ""}>
            <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-0.5">
              <span>Fault Current (I)</span>
              <span className="text-emerald-400 tabular-nums">{faultCurrent.toFixed(1)} A</span>
            </div>
            <input
              type="range" min="1" max="1000" step="1" value={faultCurrent}
              onChange={(e) => setFaultCurrent(Number(e.target.value))}
              className="w-full h-2 accent-emerald-500 cursor-pointer rounded-lg bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </div>

          {/* Rated Current Dropdown */}
          <div className={isHighlightingControls ? "ring-2 ring-cyan-400 p-0.5 rounded-lg" : ""}>
            <label className="text-[11px] text-slate-400 font-bold uppercase block mb-0.5">Rated Current (In)</label>
            <select
              value={ratedCurrent}
              onChange={(e) => setRatedCurrent(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-750 rounded-lg p-1.5 text-xs font-bold text-white min-h-[38px]"
            >
              <option value="6">6 Amperes</option>
              <option value="16">16 Amperes (Standard)</option>
              <option value="25">25 Amperes</option>
              <option value="32">32 Amperes</option>
              <option value="63">63 Amperes</option>
            </select>
          </div>

          {/* Ambient Temp Slider (-5°C to +40°C per IEC 60898-1) */}
          <div className={isHighlightingControls ? "ring-2 ring-cyan-400 p-1 rounded-lg" : ""}>
            <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-0.5">
              <span>Ambient Temp (Tamb)</span>
              <span className="text-amber-300 tabular-nums">{ambientTemp}°C</span>
            </div>
            <input
              type="range" min="-5" max="40" step="1" value={ambientTemp}
              onChange={(e) => setAmbientTemp(Number(e.target.value))}
              className="w-full h-2 accent-amber-500 cursor-pointer rounded-lg bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </div>

          {/* Thermal Memory Ratio Progress Bar */}
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-300 uppercase">
              <span>Thermal Memory Bar</span>
              <span className="text-amber-400 tabular-nums">{((currentSnapshot?.thermal.thermalMemoryRatio || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-2 transition-all duration-200" 
                style={{ width: `${(currentSnapshot?.thermal.thermalMemoryRatio || 0) * 100}%` }}
              />
            </div>
          </div>
        </aside>

        {/* CENTER MAIN VIEWPORT (1FR) - SPLIT INTO SLD DIAGRAM (LEFT 58%) + WAVEFORM OSCILLOSCOPE (RIGHT 42%) */}
        <main className="flex-1 min-w-0 h-full flex flex-col p-2.5 bg-slate-950 overflow-hidden space-y-2 z-10">
          
          {/* Stage View Selector Tabs (Single-line, no wrapping) */}
          <div data-tour="stage-tabs" className="flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar whitespace-nowrap">
            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-bold shrink-0">
              <button
                onClick={() => setCenterView('sld')}
                className={cn(
                  "px-3 py-1 rounded-lg font-black transition-all cursor-pointer min-h-[32px] shrink-0",
                  centerView === 'sld' ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                )}
              >
                2D Experiment Bench SLD
              </button>
              <button
                onClick={() => setCenterView('cutaway2d')}
                className={cn(
                  "px-3 py-1 rounded-lg font-black transition-all cursor-pointer min-h-[32px] shrink-0",
                  centerView === 'cutaway2d' ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                )}
              >
                2D Mechanism Cutaway
              </button>
              <button
                onClick={() => setCenterView('cutaway3d')}
                className={cn(
                  "px-3 py-1 rounded-lg font-black transition-all cursor-pointer min-h-[32px] flex items-center gap-1 shrink-0",
                  centerView === 'cutaway3d' ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" /> 3D Cutaway Cockpit
              </button>
            </div>

            {/* Magnetic Pickup Flash Badge */}
            {isMagneticTrip && (
              <span className="px-3 py-1 rounded-lg bg-sky-500/20 border border-sky-400 text-sky-300 text-xs font-black uppercase animate-ping shrink-0">
                ⚡ MAGNETIC PICKUP &lt;10ms
              </span>
            )}
          </div>

          {/* MAIN SPLIT GRID: LEFT (DIAGRAM STAGE) + RIGHT (WAVEFORM OSCILLOSCOPE) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 overflow-hidden">
            
            {/* LEFT PANEL (7/12 cols ~58% width): DIAGRAM STAGE + GSAP TRIP STAMP */}
            <div className="lg:col-span-7 h-full min-h-0 overflow-hidden relative">
              
              {/* GSAP TRIP VERDICT STAMP OVERLAY */}
              <GSAPTripVerdictStamp
                state={currentSnapshot?.state || MCBState.CLOSED}
                tripCause={currentSnapshot?.tripCause || TripCause.NONE}
                clearingTimeMs={(currentSnapshot?.letThrough.clearingTime || 0.0085) * 1000}
                multiplier={Number(currentMultiplier)}
              />

              {centerView === 'sld' ? (
                <ExperimentBenchSLD
                  current={currentSnapshot?.current || 0}
                  In={ratedCurrent}
                  state={currentSnapshot?.state || MCBState.CLOSED}
                  tripCause={currentSnapshot?.tripCause || TripCause.NONE}
                  bimetalTemp={currentSnapshot?.thermal.temperature || ambientTemp}
                  bimetalTripTemp={130}
                  isToleranceZone={currentSnapshot?.magnetic.isToleranceZone || false}
                  remainingTimeSec={remainingTimeSec}
                  systemType={systemType}
                  currentType={currentType}
                  faultLocation={faultLocation}
                  onFaultLocationChange={setFaultLocation}
                  loadType={loadType}
                  onLoadTypeChange={setLoadType}
                />
              ) : centerView === 'cutaway2d' ? (
                <BreakerCutaway 
                  temperature={currentSnapshot?.thermal.temperature || ambientTemp}
                  bimetalTripTemp={130}
                  state={currentSnapshot?.state || MCBState.CLOSED}
                  tripCause={currentSnapshot?.tripCause || TripCause.NONE}
                  current={currentSnapshot?.current || 0}
                  In={ratedCurrent}
                  timeLapseSpeed={timeLapseSpeed}
                  remainingTimeSec={remainingTimeSec}
                />
              ) : (
                <CutawayView3D 
                  temperature={currentSnapshot?.thermal.temperature || ambientTemp}
                  bimetalTripTemp={130}
                  state={currentSnapshot?.state || MCBState.CLOSED}
                  tripCause={currentSnapshot?.tripCause || TripCause.NONE}
                  current={currentSnapshot?.current || 0}
                  remainingTimeSec={remainingTimeSec}
                />
              )}
            </div>

            {/* RIGHT PANEL (5/12 cols ~42% width): LIVE WAVEFORM OSCILLOSCOPE */}
            <div data-tour="oscilloscope" className="lg:col-span-5 h-full min-h-0 overflow-hidden">
              <CanvasOscilloscope 
                samples={workerData?.samples || []}
                tDetect={workerData?.tDetect || 0}
                tClear={workerData?.tClear || 0}
                systemType={systemType}
                currentType={currentType}
                kappaPeakFactor={currentSnapshot?.magnetic.kappaPeakFactor || 1.45}
                ratedCurrent={ratedCurrent}
                faultCurrent={faultCurrent}
                isSimulating={isSimulating}
                className="h-full"
              />
            </div>

          </div>
        </main>

        {/* RIGHT COLUMN (320PX) - TCC CHART */}
        <aside data-tour="tcc-chart" className="w-[320px] shrink-0 h-full border-l border-slate-800 bg-slate-900/90 flex flex-col p-2.5 overflow-hidden z-20">
          <CanvasTCCChart 
            ratedCurrent={ratedCurrent}
            faultCurrent={faultCurrent}
            activeCurve={curve}
            bimetalTemp={currentSnapshot?.thermal.temperature || ambientTemp}
            isTripped={currentSnapshot?.state === MCBState.OPEN_CLEARED}
            className="h-full"
          />
        </aside>

        {/* HAZARD CONSOLE OVERLAY DRAWER */}
        <MCBHazardConsole 
          snapshot={currentSnapshot}
          In={ratedCurrent}
          curve={curve}
          faultCurrent={faultCurrent}
          ambientTemp={ambientTemp}
          isOpen={isConsoleOpen}
          onToggleOpen={() => setIsConsoleOpen(o => !o)}
        />
      </div>

      {/* MOBILE VIEW (<1024px): MOBILE SHELL ARCHITECTURE */}
      <div className="flex lg:hidden flex-1 min-h-0 flex-col overflow-hidden relative bg-slate-950">
        
        {/* MOBILE STAGE = SLD + TRIP STAMP + MULTIPLIER GAUGE + FLOATING 3D/TCC CHIPS + 120PX SCOPE STRIP */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-slate-950">
          
          {/* TOP SLD SECTION */}
          <div className="flex-1 relative min-h-0 overflow-hidden flex flex-col">
            
            {/* FLOATING ACTION CHIPS ON STAGE */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-30 pointer-events-auto">
              {/* TCC MODAL TRIGGER */}
              <button
                onClick={() => setIsMobileTCCOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/70 text-emerald-300 font-black text-[11px] shadow-lg flex items-center gap-1 cursor-pointer active:scale-95 transition-transform backdrop-blur"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> TCC CHART
              </button>

              {/* 3D CUTAWAY MODAL TRIGGER */}
              <button
                onClick={() => setIsMobile3DOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/90 border border-cyan-500/70 text-cyan-300 font-black text-[11px] shadow-lg flex items-center gap-1 cursor-pointer active:scale-95 transition-transform backdrop-blur"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 3D COCKPIT
              </button>
            </div>

            {/* GSAP TRIP VERDICT STAMP OVERLAY */}
            <GSAPTripVerdictStamp
              state={currentSnapshot?.state || MCBState.CLOSED}
              tripCause={currentSnapshot?.tripCause || TripCause.NONE}
              clearingTimeMs={(currentSnapshot?.letThrough.clearingTime || 0.0085) * 1000}
              multiplier={Number(currentMultiplier)}
            />

            {/* 2D EXPERIMENT BENCH SLD */}
            <div className="flex-1 min-h-0">
              <ExperimentBenchSLD
                current={currentSnapshot?.current || 0}
                In={ratedCurrent}
                state={currentSnapshot?.state || MCBState.CLOSED}
                tripCause={currentSnapshot?.tripCause || TripCause.NONE}
                bimetalTemp={currentSnapshot?.thermal.temperature || ambientTemp}
                bimetalTripTemp={130}
                isToleranceZone={currentSnapshot?.magnetic.isToleranceZone || false}
                remainingTimeSec={remainingTimeSec}
                systemType={systemType}
                currentType={currentType}
                faultLocation={faultLocation}
                onFaultLocationChange={setFaultLocation}
                loadType={loadType}
                onLoadTypeChange={setLoadType}
              />
            </div>
          </div>

          {/* COMPACT MULTIPLIER GAUGE STRIP */}
          <div className="px-2 py-0.5 bg-slate-900/90 border-t border-slate-800 shrink-0">
            <MultiplierGauge
              multiplier={Number(currentMultiplier)}
              curve={curve}
              ratedCurrent={ratedCurrent}
              faultCurrent={faultCurrent}
            />
          </div>

          {/* 120PX SCOPE STRIP PINNED TO STAGE BOTTOM */}
          <div className="h-[120px] shrink-0 border-t border-slate-800 bg-[#090d16] overflow-hidden">
            <CanvasOscilloscope 
              samples={workerData?.samples || []}
              tDetect={workerData?.tDetect || 0}
              tClear={workerData?.tClear || 0}
              systemType={systemType}
              currentType={currentType}
              kappaPeakFactor={currentSnapshot?.magnetic.kappaPeakFactor || 1.45}
              ratedCurrent={ratedCurrent}
              faultCurrent={faultCurrent}
              isSimulating={isSimulating}
              className="h-full"
            />
          </div>
        </div>

        {/* MOBILE STICKY ACTION BAR (56PX) */}
        <div className="h-[56px] shrink-0 px-2.5 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 z-40">
          {/* PRIMARY 56PX ACTION TRIGGER */}
          <button
            onClick={handleToggleSimulation}
            className={cn(
              "flex-1 h-full rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95",
              isSimulating ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-500 hover:bg-emerald-400"
            )}
          >
            {isSimulating ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isSimulating ? 'PAUSE' : 'APPLY FAULT'}
          </button>

          {/* FORCED RESET BUTTON */}
          <button
            onClick={handleForcedReset}
            className="h-full px-3 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            title="Force Reset Breaker"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" /> RESET
          </button>

          {/* BOTTOM SHEET MISSIONS & CONTROLS TRIGGER */}
          <button
            onClick={() => setIsMobileSheetOpen(o => !o)}
            className="h-full px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            title="Open Missions & Breaker Controls Sheet"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> CONTROLS
          </button>
        </div>

        {/* MOBILE SLIDE-UP BOTTOM SHEET (MISSIONS + FAULT CONTROLS) */}
        {isMobileSheetOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsMobileSheetOpen(false)}
            />
            <div className="relative max-h-[80vh] w-full bg-slate-900 border-t-2 border-cyan-500/60 rounded-t-3xl p-4 overflow-y-auto shadow-2xl flex flex-col space-y-3 font-mono text-xs z-10 animate-in slide-in-from-bottom duration-300">
              
              {/* Sheet Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-black text-white text-sm flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" /> MISSIONS & BREAKER CONTROLS
                </span>
                <button
                  onClick={() => setIsMobileSheetOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DIN Rail Faceplate */}
              <DINRailMCBFaceplate
                In={ratedCurrent}
                curve={curve}
                state={currentSnapshot?.state || MCBState.CLOSED}
                tripCause={currentSnapshot?.tripCause || TripCause.NONE}
                onReclose={handleForcedReset}
              />

              {/* Mission Cards */}
              <MissionCardsLab
                selectedExperiment={selectedExperiment}
                onSelectExperiment={(exp) => {
                  handleSelectExperiment(exp);
                  setIsMobileSheetOpen(false);
                }}
                state={currentSnapshot?.state || MCBState.CLOSED}
                tripCause={currentSnapshot?.tripCause || TripCause.NONE}
              />

              {/* Curve Selection */}
              <div>
                <label className="text-[11px] text-slate-400 font-bold uppercase block mb-1">Tripping Curve</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                  {(['B', 'C', 'D'] as MCBTrippingCurve[]).map(c => (
                    <button
                      key={c}
                      onClick={() => setCurve(c)}
                      className={cn(
                        "py-1.5 rounded-lg font-black transition-all cursor-pointer",
                        curve === c ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                      )}
                    >
                      Curve {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fault Current Slider */}
              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-1">
                  <span>Fault Current (I)</span>
                  <span className="text-emerald-400 tabular-nums">{faultCurrent.toFixed(1)} A</span>
                </div>
                <input
                  type="range" min="1" max="1000" step="1" value={faultCurrent}
                  onChange={(e) => setFaultCurrent(Number(e.target.value))}
                  className="w-full h-2.5 accent-emerald-500 cursor-pointer rounded-lg bg-slate-800"
                />
              </div>

              {/* Rated Current Dropdown */}
              <div>
                <label className="text-[11px] text-slate-400 font-bold uppercase block mb-1">Rated Current (In)</label>
                <select
                  value={ratedCurrent}
                  onChange={(e) => setRatedCurrent(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-750 rounded-lg p-2 text-xs font-bold text-white min-h-[38px]"
                >
                  <option value="6">6 Amperes</option>
                  <option value="16">16 Amperes (Standard)</option>
                  <option value="25">25 Amperes</option>
                  <option value="32">32 Amperes</option>
                  <option value="63">63 Amperes</option>
                </select>
              </div>

              {/* Ambient Temperature Slider */}
              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-1">
                  <span>Ambient Temp (Tamb)</span>
                  <span className="text-amber-300 tabular-nums">{ambientTemp}°C</span>
                </div>
                <input
                  type="range" min="-5" max="40" step="1" value={ambientTemp}
                  onChange={(e) => setAmbientTemp(Number(e.target.value))}
                  className="w-full h-2.5 accent-amber-500 cursor-pointer rounded-lg bg-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* MOBILE TCC MODAL DIALOG */}
        {isMobileTCCOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full h-[85vh] max-w-lg bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-black text-emerald-400 text-sm flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> D3 LOG-LOG TCC CHARACTERISTIC
                </span>
                <button
                  onClick={() => setIsMobileTCCOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 pt-2">
                <CanvasTCCChart 
                  ratedCurrent={ratedCurrent}
                  faultCurrent={faultCurrent}
                  activeCurve={curve}
                  bimetalTemp={currentSnapshot?.thermal.temperature || ambientTemp}
                  isTripped={currentSnapshot?.state === MCBState.OPEN_CLEARED}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* MOBILE 3D CUTAWAY MODAL DIALOG */}
        {isMobile3DOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full h-[85vh] max-w-lg bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-black text-cyan-400 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> 3D WEBGL BREAKER COCKPIT
                </span>
                <button
                  onClick={() => setIsMobile3DOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 pt-2">
                <CutawayView3D 
                  temperature={currentSnapshot?.thermal.temperature || ambientTemp}
                  bimetalTripTemp={130}
                  state={currentSnapshot?.state || MCBState.CLOSED}
                  tripCause={currentSnapshot?.tripCause || TripCause.NONE}
                  current={currentSnapshot?.current || 0}
                  remainingTimeSec={remainingTimeSec}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM RESULT STRIP (48px height) - DESKTOP ONLY */}
      <footer className="hidden lg:grid h-[48px] shrink-0 px-3 py-1 bg-slate-900 border-t border-slate-800 grid-cols-3 sm:grid-cols-6 gap-2 items-center text-xs font-mono z-30">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-bold uppercase truncate">Multiplier</span>
          <span className="text-xs font-black text-amber-400 tabular-nums truncate">{currentMultiplier}× In</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-bold uppercase truncate">In Derated (In_eff)</span>
          <span className="text-xs font-black text-sky-400 tabular-nums truncate">{In_eff.toFixed(1)} A</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-bold uppercase truncate">κ-Peak Factor</span>
          <span className="text-xs font-black text-rose-400 tabular-nums truncate">
            {(currentSnapshot?.magnetic.kappaPeakFactor || 1.45).toFixed(2)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-bold uppercase truncate">Let-Through I²t</span>
          <span className="text-xs font-black text-orange-300 tabular-nums truncate">
            {(currentSnapshot?.letThrough.i2t || 0).toFixed(1)} A²s
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-bold uppercase truncate">DC Stored ½LI²</span>
          <span className="text-xs font-black text-purple-300 tabular-nums truncate">
            {(currentSnapshot?.letThrough.dcDecayEnergyJoules || 0).toFixed(0)} J
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-bold uppercase truncate">Clearing Time</span>
          <span className="text-xs font-black text-emerald-400 tabular-nums truncate">
            {((currentSnapshot?.letThrough.clearingTime || 0) * 1000).toFixed(1)} ms
          </span>
        </div>
      </footer>

    </div>
  );
};
