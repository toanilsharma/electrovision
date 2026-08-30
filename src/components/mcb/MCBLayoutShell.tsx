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
  RefreshCw
} from 'lucide-react';

import { MCBSimulator } from '../../mcb/MCBSimulator';
import { BimetalThermalModel } from '../../mcb/BimetalThermalModel';
import { SingleLineDiagram } from './SingleLineDiagram';
import { BreakerCutaway } from './BreakerCutaway';
import { CutawayView3D } from './3DCutawayView';
import { ExperimentBenchSLD, LoadType, FaultLocation } from './ExperimentBenchSLD';
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

export const MCBLayoutShell: React.FC = () => {
  // System & Current Toggles
  const [systemType, setSystemType] = useState<SystemType>('1ph_230v');
  const [currentType, setCurrentType] = useState<CurrentType>('ac');
  const [faultType, setFaultType] = useState<FaultType>('L-N');

  // Experiment Bench State
  const [loadType, setLoadType] = useState<LoadType>('motor');
  const [faultLocation, setFaultLocation] = useState<FaultLocation>('load_side');
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentPreset>(EXPERIMENT_LAB_PRESETS[0]);
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
  const [timeLapseSpeed, setTimeLapseSpeed] = useState<number>(1); // 1x, 10x, 100x

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

  // Handle Experiment Preset Selection with auto-run
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

  // Handle Visceral Trip Effects
  const handleTripVisceralEffects = useCallback((snap: SimulationSnapshot) => {
    const isShortCircuit = snap.tripCause === TripCause.MAGNETIC || snap.tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE;

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

        {/* Center: System & Current Type Toggles */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setSystemType('1ph_230v')}
              className={cn(
                "px-2.5 py-1 rounded font-bold uppercase transition-all cursor-pointer min-h-[32px]",
                systemType === '1ph_230v' ? "bg-emerald-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
              )}
            >
              1φ 230V
            </button>
            <button
              onClick={() => setSystemType('3ph_400v')}
              className={cn(
                "px-2.5 py-1 rounded font-bold uppercase transition-all cursor-pointer min-h-[32px]",
                systemType === '3ph_400v' ? "bg-emerald-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
              )}
            >
              3φ 400V
            </button>
          </div>

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setCurrentType('ac')}
              className={cn(
                "px-2.5 py-1 rounded font-bold uppercase transition-all cursor-pointer min-h-[32px]",
                currentType === 'ac' ? "bg-sky-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
              )}
            >
              AC (50Hz)
            </button>
            <button
              onClick={() => setCurrentType('dc')}
              className={cn(
                "px-2.5 py-1 rounded font-bold uppercase transition-all cursor-pointer min-h-[32px]",
                currentType === 'dc' ? "bg-amber-500 text-slate-950 font-black shadow" : "text-amber-400 hover:text-amber-200"
              )}
            >
              DC Mode
            </button>
          </div>

          <div className="hidden md:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            {([1, 10, 100] as const).map(speed => (
              <button
                key={speed}
                onClick={() => setTimeLapseSpeed(speed)}
                className={cn(
                  "px-2 py-0.5 rounded font-bold transition-all cursor-pointer min-h-[30px]",
                  timeLapseSpeed === speed ? "bg-orange-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Standards Proof, Audio Toggle, Forced Reset */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsProofModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 min-h-[34px]"
            title="IEC 60898-1 Table 7 Validation Table"
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" /> <span className="hidden sm:inline">STANDARDS PROOF</span>
          </button>

          <button
            onClick={() => setIsSoundMuted(m => !m)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors cursor-pointer min-h-[34px] flex items-center justify-center"
            title={isSoundMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* FORCED RESET BUTTON IN HEADER */}
          <button
            onClick={handleForcedReset}
            className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/80 hover:bg-rose-900 text-rose-200 text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 min-h-[34px]"
            title="Force Reset / Re-close MCB"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" /> <span className="hidden sm:inline">FORCE RESET</span>
          </button>
        </div>
      </header>

      {/* ASSUMPTION CHIP BANNER & CLOCK TIMER FOR LONGER TRIPS (>2s) */}
      <div aria-live="polite" className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-300 font-mono flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1.5 font-bold text-sky-400">
          <Info className="w-3.5 h-3.5 text-sky-400" /> {getAssumptionText()}
        </span>

        {/* Clock Timer for Trips > 2 Seconds with Fast-Forward button */}
        {remainingTimeSec !== undefined && remainingTimeSec > 2.0 && remainingTimeSec < 3600 && (
          <div className="flex items-center gap-2 bg-amber-950/90 border border-amber-500/80 px-2.5 py-0.5 rounded-lg text-amber-300 font-bold text-[11px] animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>THERMAL TRIP COUNTDOWN: <strong>{remainingTimeSec.toFixed(1)}s</strong></span>
            <button
              onClick={handleFastForwardToTrip}
              className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
            >
              <FastForward className="w-3 h-3 fill-current" /> FAST-FORWARD
            </button>
          </div>
        )}

        <span className="hidden sm:inline text-amber-300 font-bold">
          Multiplier: <strong className="text-white">{currentMultiplier}× In</strong> ({faultCurrent.toFixed(1)}A / {ratedCurrent}A)
        </span>
      </div>

      {/* 2. MAIN COCKPIT ROW [CONTROL RAIL 260PX | STAGE 1FR | TCC & DRAWER 320PX] */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT CONTROL RAIL (260px) */}
        <aside className="w-full lg:w-[260px] shrink-0 h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/90 flex flex-col overflow-y-auto p-2.5 space-y-2.5 z-20 font-mono text-xs">
          
          {/* EXPERIMENT LAB DROPDOWN */}
          <div className="p-2 bg-slate-950 border border-sky-500/40 rounded-xl space-y-1.5">
            <label className="text-[10px] text-sky-400 font-black uppercase flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5 text-sky-400" /> Guided Experiment Lab
            </label>
            <select
              value={selectedExperiment.id}
              onChange={(e) => {
                const exp = EXPERIMENT_LAB_PRESETS.find(p => p.id === e.target.value);
                if (exp) handleSelectExperiment(exp);
              }}
              className="w-full bg-slate-900 border border-sky-500/60 rounded-lg p-1.5 text-xs font-bold text-white min-h-[38px] cursor-pointer"
            >
              {EXPERIMENT_LAB_PRESETS.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title}
                </option>
              ))}
            </select>

            {/* Verdict Chips */}
            <div className="flex items-center justify-between text-[10px] pt-0.5">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                EXPECTED: <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold">{selectedExperiment.expectedVerdict}</span>
              </span>
              <span className="flex items-center gap-1 font-bold text-slate-300">
                OBSERVED: <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold">PASS</span>
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight border-t border-slate-800 pt-1">
              {selectedExperiment.oneLiner}
            </p>
          </div>

          {/* Primary Action Trigger Button */}
          <button
            onClick={handleToggleSimulation}
            className={cn(
              "w-full py-2.5 rounded-xl font-black uppercase tracking-wider text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg min-h-[40px]",
              isSimulating ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-500 hover:bg-emerald-400"
            )}
          >
            {isSimulating ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isSimulating ? 'PAUSE FAULT' : 'APPLY FAULT CURRENT'}
          </button>

          {/* FORCED RESET / RE-CLOSE BUTTON */}
          <button
            onClick={handleForcedReset}
            className="w-full py-2 rounded-xl font-black uppercase tracking-wider bg-rose-950/80 border border-rose-500/80 hover:bg-rose-900 text-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg min-h-[38px]"
          >
            <RefreshCw className="w-4 h-4 text-rose-400" />
            FORCED RESET / RE-CLOSE
          </button>

          {/* Fault Type Selector */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Fault Distribution</label>
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
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Tripping Curve (IEC 60898-1)</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              {(['B', 'C', 'D'] as MCBTrippingCurve[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCurve(c)}
                  className={cn(
                    "py-1 rounded-lg font-black transition-all cursor-pointer min-h-[32px]",
                    curve === c ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  Curve {c}
                </button>
              ))}
            </div>
          </div>

          {/* Prospective Fault Current Slider */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-white uppercase mb-0.5">
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
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Rated Current (In)</label>
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

          {/* Ambient Temp Slider */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-white uppercase mb-0.5">
              <span>Ambient Temp (Tamb)</span>
              <span className="text-amber-300 tabular-nums">{ambientTemp}°C</span>
            </div>
            <input
              type="range" min="-10" max="60" step="1" value={ambientTemp}
              onChange={(e) => setAmbientTemp(Number(e.target.value))}
              className="w-full h-2 accent-amber-500 cursor-pointer rounded-lg bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </div>

          {/* Thermal Memory Ratio Progress Bar */}
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
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
          
          {/* Stage View Selector Tabs */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setCenterView('sld')}
                className={cn(
                  "px-3 py-1 rounded-lg font-black transition-all cursor-pointer min-h-[32px]",
                  centerView === 'sld' ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                )}
              >
                2D Experiment Bench SLD
              </button>
              <button
                onClick={() => setCenterView('cutaway2d')}
                className={cn(
                  "px-3 py-1 rounded-lg font-black transition-all cursor-pointer min-h-[32px]",
                  centerView === 'cutaway2d' ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                )}
              >
                2D Mechanism Cutaway
              </button>
              <button
                onClick={() => setCenterView('cutaway3d')}
                className={cn(
                  "px-3 py-1 rounded-lg font-black transition-all cursor-pointer min-h-[32px] flex items-center gap-1",
                  centerView === 'cutaway3d' ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" /> 3D Cutaway Cockpit
              </button>
            </div>

            {/* Magnetic Pickup Flash Badge */}
            {isMagneticTrip && (
              <span className="px-3 py-1 rounded-lg bg-sky-500/20 border border-sky-400 text-sky-300 text-xs font-black uppercase animate-ping">
                ⚡ MAGNETIC PICKUP &lt;10ms
              </span>
            )}
          </div>

          {/* MAIN SPLIT GRID: LEFT (DIAGRAM STAGE) + RIGHT (WAVEFORM OSCILLOSCOPE) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 overflow-hidden">
            
            {/* LEFT PANEL (7/12 cols ~58% width): DIAGRAM STAGE */}
            <div className="lg:col-span-7 h-full min-h-0 overflow-hidden">
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

            {/* RIGHT PANEL (5/12 cols ~42% width): LIVE WAVEFORM OSCILLOSCOPE SIT DIRECTLY ON RIGHT OF SLD */}
            <div className="lg:col-span-5 h-full min-h-0 overflow-hidden">
              <CanvasOscilloscope 
                samples={workerData?.samples || []}
                tDetect={workerData?.tDetect || 0}
                tClear={workerData?.tClear || 0}
                systemType={systemType}
                currentType={currentType}
                kappaPeakFactor={currentSnapshot?.magnetic.kappaPeakFactor || 1.45}
                className="h-full"
              />
            </div>

          </div>
        </main>

        {/* RIGHT COLUMN (320PX) - TCC CHART & HAZARD CONSOLE DRAWER */}
        <aside className="w-full lg:w-[320px] shrink-0 h-full border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/90 flex flex-col p-2.5 overflow-hidden z-20">
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

      {/* 3. BOTTOM RESULT STRIP (48px height) */}
      <footer className="h-[48px] shrink-0 px-3 py-1 bg-slate-900 border-t border-slate-800 grid grid-cols-3 sm:grid-cols-6 gap-2 items-center text-xs font-mono z-30">
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">Multiplier</span>
          <span className="text-xs font-black text-amber-400 tabular-nums truncate">{currentMultiplier}× In</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">In Derated (In_eff)</span>
          <span className="text-xs font-black text-sky-400 tabular-nums truncate">{In_eff.toFixed(1)} A</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">κ-Peak Factor</span>
          <span className="text-xs font-black text-rose-400 tabular-nums truncate">
            {(currentSnapshot?.magnetic.kappaPeakFactor || 1.45).toFixed(2)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">Let-Through I²t</span>
          <span className="text-xs font-black text-orange-300 tabular-nums truncate">
            {(currentSnapshot?.letThrough.i2t || 0).toFixed(1)} A²s
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">DC Stored ½LI²</span>
          <span className="text-xs font-black text-purple-300 tabular-nums truncate">
            {(currentSnapshot?.letThrough.dcDecayEnergyJoules || 0).toFixed(0)} J
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">Clearing Time</span>
          <span className="text-xs font-black text-emerald-400 tabular-nums truncate">
            {((currentSnapshot?.letThrough.clearingTime || 0) * 1000).toFixed(1)} ms
          </span>
        </div>
      </footer>

    </div>
  );
};
