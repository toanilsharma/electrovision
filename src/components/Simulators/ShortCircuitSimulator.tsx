import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, AlertTriangle, Clock, TrendingUp, Cpu, Sliders, Settings, 
  Play, RotateCcw, Flame, ShieldAlert, Activity, BookOpen, ShieldCheck, Square, Info,
  ChevronDown, ChevronUp, Layers, HelpCircle, CheckCircle2, XCircle, Gauge, Camera,
  Volume2, VolumeX, FileText, Check, Shield, Radio, Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { EmergencyResponse } from '../EmergencyResponse';
import { HazardOverlay } from '../HazardOverlay';
import { PPEValidator } from '../PPEValidator';
import { useAudioHaptics } from '../useAudioHaptics';
import { 
  calculateIEC60909, 
  IEC60909Result, 
  getKFactor 
} from '@/src/utils/iec60909';
import { IndustrialGridDiagram } from './IndustrialGridDiagram';
import { CoordinationChartCard } from './CoordinationChartCard';
import { DisasterReplayModal } from '../DisasterReplayModal';

type SimulatorViewTab = 'simulation' | 'coordination' | 'math';

export function ShortCircuitSimulator({ config }: { config?: UserConfig }) {
  // Navigation View Tab
  const [activeTab, setActiveTab] = useState<SimulatorViewTab>('simulation');

  // Primary UI Controls (Default 3 Relay Modes & 2 Fault Types)
  const [protectionSpeed, setProtectionSpeed] = useState<'fast' | 'delayed' | 'fail'>('fast');
  const [faultType, setFaultType] = useState<'three_phase' | 'line_ground'>('three_phase');

  // Grid & Cable Parameters
  const [transformerKVA, setTransformerKVA] = useState<number>(630);
  const [ukPercent, setUkPercent] = useState<number>(6.0);
  const [cableLengthM, setCableLengthM] = useState<number>(0);
  const [cableSizeMm2, setCableSizeMm2] = useState<number>(16);
  const [z0z1Ratio, setZ0z1Ratio] = useState<number>(1.7);
  const [isLimitingBreaker, setIsLimitingBreaker] = useState<boolean>(false);

  // Time Scale Control (1X Normal, 0.5X, 0.25X Slow-Mo)
  const [timeScale, setTimeScale] = useState<number>(1);

  // Simulation Dials
  const [time, setTime] = useState<number>(0); // simulated time (0 to 100ms)
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);
  const [isPPESafe, setIsPPESafe] = useState<boolean>(false);

  // Modals state
  const [isDisasterReplayOpen, setIsDisasterReplayOpen] = useState<boolean>(false);
  const [isPPEModalOpen, setIsPPEModalOpen] = useState<boolean>(false);
  const [isMathModalOpen, setIsMathModalOpen] = useState<boolean>(false);

  const { playArcBlast } = useAudioHaptics();
  const lastTimeRef = useRef(0);

  const isIndustrial = config?.environment === 'industrial';
  const systemVoltage = isIndustrial ? 415 : 230;
  const faultIgnitionTime = 10; // fault occurs at 10ms
  const nominalLoadCurrent = 150; // nominal load current (A)

  // Full IEC 60909 Physics Engine Calculation
  const iecResults: IEC60909Result = useMemo(() => {
    return calculateIEC60909({
      transformerKVA,
      ukPercent,
      voltageUn: systemVoltage,
      voltageFactorC: 1.05,
      cableLengthM,
      cableSizeMm2,
      cableMaterial: 'Cu',
      cableInsulation: 'PVC',
      z0z1Ratio,
      faultType,
      protectionSpeed,
      isLimitingBreaker
    });
  }, [
    transformerKVA, ukPercent, systemVoltage, cableLengthM, 
    cableSizeMm2, z0z1Ratio, faultType, protectionSpeed, isLimitingBreaker
  ]);

  const prospectiveFaultCurrent = iecResults.Ik; // Current selected fault Ik (A)
  const tripTime = iecResults.tTotalMs; // Total clearing time (ms)

  // Real physics: Timeline calculation of events
  // 1. Breaker clearing timeline
  const breakerTripTimeline = tripTime === Infinity ? Infinity : (faultIgnitionTime + tripTime);
  // 2. Conductor physical melting & vaporization timeline (Onderdonk equation)
  const conductorMeltTimeline = faultIgnitionTime + iecResults.tFusingMs;
  // 3. Blowout arc extinction timeline (arc lasts ~3ms as gap widens in air)
  const arcExtinguishTimeline = conductorMeltTimeline + 3;

  // Evaluate instant current, tripped state, conductor vaporization, let-through energy, and wire heat
  const { 
    faultCurrent, 
    tripped, 
    conductorMelted, 
    arcExtinct, 
    letThroughEnergy, 
    heatLevel 
  } = useMemo(() => {
    let current = nominalLoadCurrent;
    let isTripped = false;
    let isMelted = false;
    let isArcExt = false;
    let energy = 0;
    let heat = 0;

    if (time > 0) {
      if (time < faultIgnitionTime) {
        current = nominalLoadCurrent;
        energy = 0;
        heat = 0;
      } else {
        const isPastMelt = time >= conductorMeltTimeline;
        const isPastArcExtinct = time >= arcExtinguishTimeline;
        const isPastBreakerTrip = breakerTripTimeline !== Infinity && time >= breakerTripTimeline;

        if (isPastBreakerTrip && breakerTripTimeline <= conductorMeltTimeline) {
          // Breaker tripped BEFORE conductor melted
          isTripped = true;
          current = 0;
          energy = iecResults.letThroughEnergy_kA2s;
          const withstandCapacity = iecResults.withstandEnergy_kA2s;
          const finalHeat = Math.min(1.8, energy / (withstandCapacity || 3.4));
          const coolingDuration = time - breakerTripTimeline;
          heat = Math.max(0, finalHeat - coolingDuration / 50);
        } else if (isPastArcExtinct) {
          // Conductor physically melted & vaporized, blowout arc extinguished!
          // PHYSICAL OPEN CIRCUIT: CURRENT DROPS TO 0 A (CANNOT FLOW THROUGH AIR GAP)
          isMelted = true;
          isArcExt = true;
          isTripped = isPastBreakerTrip;
          current = 0; // ZERO CURRENT! Galvanic path broken!
          energy = iecResults.letThroughEnergy_kA2s; // Energy frozen at fusing point
          heat = 2.0; // Charred & destroyed
        } else if (isPastMelt) {
          // Conductor is melting and arcing during 3ms blowout
          isMelted = true;
          isArcExt = false;
          isTripped = isPastBreakerTrip;
          const arcDecay = Math.max(0, 1 - (time - conductorMeltTimeline) / 3);
          current = prospectiveFaultCurrent * arcDecay;
          energy = iecResults.letThroughEnergy_kA2s;
          heat = 2.0;
        } else {
          // Fault active (neither breaker tripped nor cable melted yet)
          const ramp = Math.min(1, (time - faultIgnitionTime) / 4);
          current = nominalLoadCurrent + (prospectiveFaultCurrent - nominalLoadCurrent) * ramp;

          const activeSec = (time - faultIgnitionTime) / 1000;
          const uncappedEnergy = Math.pow(current / 1000, 2) * activeSec; // kA²s
          
          if (isLimitingBreaker && tripTime !== Infinity) {
            const capTarget = 0.6 * Math.pow(current / 15000, 2);
            energy = Math.min(uncappedEnergy, Math.max(0.1, capTarget));
          } else {
            energy = uncappedEnergy;
          }

          const withstandCapacity = iecResults.withstandEnergy_kA2s;
          heat = Math.min(2.0, energy / (withstandCapacity || 3.4));
        }
      }
    }

    return {
      faultCurrent: current,
      tripped: isTripped,
      conductorMelted: isMelted,
      arcExtinct: isArcExt,
      letThroughEnergy: energy,
      heatLevel: heat
    };
  }, [time, nominalLoadCurrent, prospectiveFaultCurrent, breakerTripTimeline, conductorMeltTimeline, arcExtinguishTimeline, isLimitingBreaker, tripTime, iecResults]);

  // Audio blast trigger at fault ignition
  useEffect(() => {
    if (time >= faultIgnitionTime && lastTimeRef.current < faultIgnitionTime) {
      playArcBlast();
    }
    lastTimeRef.current = time;
  }, [time, playArcBlast]);

  // Auto-play interval runner (synced with timeScale)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAutoPlaying) {
      const stepMs = Math.round(40 / timeScale);
      interval = setInterval(() => {
        setTime((prev) => {
          if (prev >= 100) {
            setIsAutoPlaying(false);
            return 100;
          }
          return Math.min(100, prev + 2);
        });
      }, stepMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, timeScale]);

  useEffect(() => {
    if (time > 0) {
      setHasSimulated(true);
    }
  }, [time]);

  // Electrodynamic Lorentz mechanical force on busbars (kN/m)
  // Drop to zero when circuit current ceases
  const lorentzForceKNm = useMemo(() => {
    if (faultCurrent <= nominalLoadCurrent) return 0;
    const currentKA = faultCurrent / 1000;
    const dMeters = 0.1;
    const forceNm = (0.2 * Math.pow(currentKA * (iecResults.kappa * Math.sqrt(2)), 2)) / dMeters;
    return forceNm / 1000;
  }, [faultCurrent, nominalLoadCurrent, iecResults.kappa]);

  // Determine safety verdict
  const verdict = useMemo(() => {
    if (time === 0) {
      return { 
        status: 'idle', 
        label: 'STANDBY / ARMED', 
        color: 'bg-slate-900 border-slate-700 text-slate-300', 
        desc: 'Conductors healthy · 150A nominal load · Awaiting fault trigger.' 
      };
    }

    if (conductorMelted) {
      const breakerStateText = tripped 
        ? `Breaker opened late at ${tripTime}ms after cable was already destroyed.`
        : `Breaker contacts remained CLOSED (protection failed to operate).`;

      return { 
        status: 'fail', 
        label: 'CRITICAL: CONDUCTOR VAPORIZED (OPEN-CIRCUIT)', 
        color: 'bg-red-950/90 border-red-500/80 text-red-200 font-black shadow-[0_0_20px_rgba(239,68,68,0.5)]', 
        desc: `Sustained ${iecResults.Ik_kA.toFixed(1)} kA exceeded ${cableSizeMm2}mm² fusing energy (${iecResults.fusingEnergy_kA2s.toFixed(1)} kA²s) at t = ${conductorMeltTimeline.toFixed(0)}ms. Conductor physically melted & vaporized, breaking the circuit path (fault current dropped to 0 A). ${breakerStateText}` 
      };
    }

    if (!tripped) {
      return { 
        status: 'faulting', 
        label: 'SHORT-CIRCUIT IN PROGRESS', 
        color: 'bg-red-950/80 border-red-500/50 text-red-300 font-bold animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]', 
        desc: `Heavy ${faultType === 'three_phase' ? '3-Phase' : 'Line-to-Ground'} fault active · Fault current ${(faultCurrent / 1000).toFixed(1)} kA · Peak ip = ${iecResults.ip_kA.toFixed(1)} kA.` 
      };
    }

    if (iecResults.isThermalPass) {
      return { 
        status: 'safe', 
        label: `VERDICT: PASS (CABLE PROTECTED)`, 
        color: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]', 
        desc: `Cleared by VCB breaker in ${tripTime}ms (${iecResults.tRelayMs}ms relay + ${iecResults.tBreakerMs}ms CB + ${iecResults.tArcMs}ms arc). Let-through ${letThroughEnergy.toFixed(2)} kA²s < ${cableSizeMm2}mm² Cu limit (${iecResults.withstandEnergy_kA2s.toFixed(1)} kA²s). S_min = ${iecResults.Smin.toFixed(1)}mm².` 
      };
    } else {
      return { 
        status: 'danger', 
        label: `VERDICT: FAIL (INSULATION DAMAGED)`, 
        color: 'bg-amber-950/90 border-amber-500/70 text-amber-200 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]', 
        desc: `Delayed trip (${tripTime}ms) allowed ${letThroughEnergy.toFixed(2)} kA²s let-through, exceeding ${cableSizeMm2}mm² insulation limit (${iecResults.withstandEnergy_kA2s.toFixed(1)} kA²s). Conductor survived but insulation charred! Required S_min = ${iecResults.Smin.toFixed(1)}mm².` 
      };
    }
  }, [time, conductorMelted, tripped, letThroughEnergy, tripTime, iecResults, faultType, cableSizeMm2, faultCurrent, conductorMeltTimeline]);

  // Reset scenario
  const handleResetScenario = () => {
    setIsAutoPlaying(false);
    setTime(0);
  };

  // Preset handlers
  const handleApplyPreset = (preset: 'main_bus' | 'sub_panel' | 'melt_trap') => {
    handleResetScenario();
    if (preset === 'main_bus') {
      setTransformerKVA(630);
      setCableLengthM(0);
      setCableSizeMm2(16);
      setProtectionSpeed('fast');
      setFaultType('three_phase');
    } else if (preset === 'sub_panel') {
      setTransformerKVA(630);
      setCableLengthM(50);
      setCableSizeMm2(16);
      setProtectionSpeed('delayed');
      setFaultType('three_phase');
    } else if (preset === 'melt_trap') {
      setTransformerKVA(1000);
      setCableLengthM(0);
      setCableSizeMm2(16);
      setProtectionSpeed('fail');
      setFaultType('three_phase');
    }
  };

  const isFaultActive = time >= faultIgnitionTime && !tripped;

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 overflow-hidden text-slate-100 relative select-none">
      
      {/* ════════════════════════════════════════════════════════════════════════
          1. COCKPIT HEADER BAR (42px)
      ════════════════════════════════════════════════════════════════════════ */}
      <header className="h-[42px] shrink-0 px-2 sm:px-3 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-1 text-xs font-bold font-mono z-30">
        {/* Left: Brand Title & Standards Tag */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1 leading-none">
              SHORT-CIRCUIT PRO™
              <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                IEC 60909 · IEC 60364-4-43
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[10px] sm:text-xs shrink-0">
          <button
            onClick={() => setActiveTab('simulation')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center gap-1",
              activeTab === 'simulation' ? "bg-amber-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <Activity className="w-3 h-3" />
            <span>Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('coordination')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center gap-1",
              activeTab === 'coordination' ? "bg-amber-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <TrendingUp className="w-3 h-3" />
            <span>TCC Curve</span>
          </button>
          <button
            onClick={() => setIsMathModalOpen(true)}
            className="px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer text-slate-400 hover:text-white flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3" />
            <span className="hidden sm:inline">IEC Math</span>
          </button>
        </div>

        {/* Right: Quick Tools (1000 FPS, Reset) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsDisasterReplayOpen(true)}
            className="px-2 py-1 rounded-lg border border-red-500/60 bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            title="Launch 1000 FPS Super Slow-Mo Camera Replay"
          >
            <Camera className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="hidden md:inline">1000 FPS Replay</span>
          </button>

          <button
            onClick={handleResetScenario}
            className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            title="Reset Scenario to Standby"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span className="hidden lg:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════════
          2. MAIN CONTENT AREA (ZERO SCROLLBARS)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 w-full h-full overflow-hidden relative">
        <AnimatePresence mode="wait">

          {/* ────────────────────────────────────────────────────────────────
              A. SIMULATOR VIEW: STRICT 3-COLUMN ARCHITECTURE
          ──────────────────────────────────────────────────────────────── */}
          {activeTab === 'simulation' && (
            <motion.div
              key="simulation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col lg:flex-row overflow-hidden select-none"
            >
              {/* ────────────────────────────────────────────────────────────
                  LEFT COLUMN: INPUTS & CONTROLS (ZERO SCROLLBARS)
              ──────────────────────────────────────────────────────────── */}
              <aside className="w-full lg:w-72 xl:w-76 shrink-0 h-full overflow-hidden p-2 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between select-none">
                
                {/* Section 1: Main Ignition Trigger & Scrubber */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      1. FAULT INCEPTION TRIGGER
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-400">
                      {time} ms / 100 ms
                    </span>
                  </div>

                  {/* Big Ignition Button */}
                  {isAutoPlaying ? (
                    <button
                      onClick={() => setIsAutoPlaying(false)}
                      className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 animate-pulse"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>⏹ STOP FAULT SIMULATION</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (time >= 100) setTime(0);
                        setIsAutoPlaying(true);
                      }}
                      className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current animate-pulse" />
                      <span>⚡ IGNITE SHORT-CIRCUIT FAULT</span>
                    </button>
                  )}

                  {/* Compact Time Timeline Scrubber */}
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                      <span>0ms: Load</span>
                      <span className="text-red-400 font-bold">10ms: Fault</span>
                      <span className="text-cyan-400 font-bold">{tripTime === Infinity ? 'No Trip' : `${faultIgnitionTime + tripTime}ms: Clear`}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={time}
                      onChange={(e) => {
                        setIsAutoPlaying(false);
                        setTime(Number(e.target.value));
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                {/* Section 2: Protection Relay Setting */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      2. RELAY PROTECTION SPEED
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400 font-bold">
                      {tripTime === Infinity ? 'No Trip' : `${tripTime} ms`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'fast', label: 'Fast (14ms)', note: 'VCB' },
                      { id: 'delayed', label: 'Delayed (76ms)', note: 'O/C Delay' },
                      { id: 'fail', label: 'No Trip (∞)', note: 'Melt Trap' }
                    ].map(spd => (
                      <button
                        key={spd.id}
                        onClick={() => {
                          setTime(0);
                          setProtectionSpeed(spd.id as any);
                        }}
                        className={cn(
                          "py-1.5 px-0.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                          protectionSpeed === spd.id
                            ? spd.id === 'fast'
                              ? "bg-emerald-500 text-slate-950 border-emerald-300 font-black shadow-sm"
                              : spd.id === 'delayed'
                              ? "bg-amber-500 text-slate-950 border-amber-300 font-black shadow-sm"
                              : "bg-red-600 text-white border-red-400 font-black shadow-sm animate-pulse"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                        <span className="text-[9.5px] font-bold">{spd.label}</span>
                        <span className="text-[7.5px] opacity-80">{spd.note}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 3: Fault Type Selector */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      3. SHORT-CIRCUIT FAULT TYPE
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-400">
                      Ik = {iecResults.Ik_kA.toFixed(1)} kA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => { setTime(0); setFaultType('three_phase'); }}
                      className={cn(
                        "py-1.5 px-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                        faultType === 'three_phase'
                          ? "bg-red-600 text-white border-red-400 font-black shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      )}
                    >
                      <span>3-Phase Bolted</span>
                      <span className="text-[8px] opacity-85 font-mono">Ik3 ≈ {iecResults.Ik3_kA.toFixed(1)} kA</span>
                    </button>

                    <button
                      onClick={() => { setTime(0); setFaultType('line_ground'); }}
                      className={cn(
                        "py-1.5 px-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                        faultType === 'line_ground'
                          ? "bg-red-600 text-white border-red-400 font-black shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      )}
                    >
                      <span>Line-to-Ground</span>
                      <span className="text-[8px] opacity-85 font-mono">Ik1 ≈ {iecResults.Ik1_kA.toFixed(1)} kA</span>
                    </button>
                  </div>
                </div>

                {/* Section 4: Grid & Cable Physical Specifications */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    4. GRID TRANSFORMER & CABLE SPEC
                  </span>

                  {/* Transformer kVA */}
                  <div className="flex items-center justify-between text-[9.5px]">
                    <span className="text-slate-400">Transformer:</span>
                    <div className="flex items-center gap-1">
                      {[630, 1000, 1600].map(k => (
                        <button
                          key={k}
                          onClick={() => { setTime(0); setTransformerKVA(k); }}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[8.5px] font-bold border transition-all cursor-pointer font-mono",
                            transformerKVA === k ? "bg-amber-500 text-slate-950 border-amber-300 font-black" : "bg-slate-950 border-slate-800 text-slate-400"
                          )}
                        >
                          {k}kVA
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cable Size */}
                  <div className="flex items-center justify-between text-[9.5px]">
                    <span className="text-slate-400">Cable Size:</span>
                    <div className="flex items-center gap-1">
                      {[16, 25, 50, 95].map(s => (
                        <button
                          key={s}
                          onClick={() => { setTime(0); setCableSizeMm2(s); }}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[8.5px] font-bold border transition-all cursor-pointer font-mono",
                            cableSizeMm2 === s ? "bg-cyan-500 text-slate-950 border-cyan-300 font-black" : "bg-slate-950 border-slate-800 text-slate-400"
                          )}
                        >
                          {s}mm²
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cable Length */}
                  <div className="flex items-center justify-between text-[9.5px]">
                    <span className="text-slate-400">Fault Location:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { len: 0, label: '0m Bus' },
                        { len: 25, label: '25m' },
                        { len: 50, label: '50m' },
                        { len: 100, label: '100m' }
                      ].map(l => (
                        <button
                          key={l.len}
                          onClick={() => { setTime(0); setCableLengthM(l.len); }}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[8.5px] font-bold border transition-all cursor-pointer font-mono",
                            cableLengthM === l.len ? "bg-cyan-500 text-slate-950 border-cyan-300 font-black" : "bg-slate-950 border-slate-800 text-slate-400"
                          )}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Limiting Breaker Toggle */}
                  <button
                    onClick={() => setIsLimitingBreaker(v => !v)}
                    className={cn(
                      "w-full py-1 px-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-[9px] font-bold",
                      isLimitingBreaker
                        ? "bg-cyan-950/80 border-cyan-500 text-cyan-200"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    )}
                  >
                    <span>Current Limiting (Class 3):</span>
                    <span className={cn("font-black font-mono", isLimitingBreaker ? "text-cyan-400" : "text-slate-500")}>
                      {isLimitingBreaker ? "ACTIVE (≤0.6 kA²s)" : "OFF"}
                    </span>
                  </button>
                </div>

                {/* Section 5: Presets Footer */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    5. QUICK FAULT SCENARIO PRESETS
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleApplyPreset('main_bus')}
                      className="py-1 px-0.5 rounded text-[8.5px] font-bold border bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/60 transition-all cursor-pointer truncate"
                    >
                      Factory Bus
                    </button>
                    <button
                      onClick={() => handleApplyPreset('sub_panel')}
                      className="py-1 px-0.5 rounded text-[8.5px] font-bold border bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/60 transition-all cursor-pointer truncate"
                    >
                      50m Sub-Panel
                    </button>
                    <button
                      onClick={() => handleApplyPreset('melt_trap')}
                      className="py-1 px-0.5 rounded text-[8.5px] font-bold border bg-red-950/60 border-red-800 text-red-300 hover:bg-red-900 transition-all cursor-pointer truncate"
                    >
                      Melt Trap 💀
                    </button>
                  </div>
                </div>
              </aside>

              {/* ────────────────────────────────────────────────────────────
                  CENTER COLUMN: SIMULATOR & ANIMATIONS (MAXIMIZED CANVAS)
              ──────────────────────────────────────────────────────────── */}
              <main className="flex-1 min-w-0 h-full flex flex-col bg-slate-950 p-1.5 sm:p-2 overflow-hidden relative">
                
                {/* Center Grid Status Sub-Bar */}
                <div className="shrink-0 flex items-center justify-between px-2 py-1 bg-slate-900/90 border border-slate-800 rounded-lg mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: conductorMelted ? '#ef4444' : isFaultActive ? '#f97316' : tripped ? '#10b981' : '#38bdf8' }} />
                    <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-wider truncate">
                      SUBSTATION {transformerKVA}kVA · {systemVoltage}V {faultType === 'three_phase' ? '3-PHASE' : '1-PHASE'} FEEDER
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] px-2 py-0.5 rounded font-mono font-black uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
                      {cableSizeMm2} mm² Cu · {cableLengthM}m
                    </span>
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border shrink-0",
                      conductorMelted ? "text-red-300 border-red-500 bg-red-950/80 animate-pulse" : isFaultActive ? "text-orange-300 border-orange-500/60 bg-orange-950/60 animate-pulse" : tripped ? "text-emerald-300 border-emerald-500/60 bg-emerald-950/60" : "text-cyan-300 border-cyan-500/60 bg-cyan-950/60"
                    )}>
                      {conductorMelted ? "CABLE VAPORIZED · 0 A" : isFaultActive ? "FAULT IN PROGRESS" : tripped ? "CLEARED" : "STANDBY"}
                    </span>
                  </div>
                </div>

                {/* Pure Animation Stage - Fills 100% of Center Column */}
                <div className="flex-1 w-full min-h-0 relative overflow-hidden bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center shadow-inner">
                  <IndustrialGridDiagram
                    time={time}
                    isFaultActive={isFaultActive}
                    tripped={tripped}
                    isConductorMelted={conductorMelted}
                    faultType={faultType}
                    protectionSpeed={protectionSpeed}
                    faultCurrent={faultCurrent}
                    faultCurrentKA={faultCurrent / 1000}
                    peakCurrentKA={faultCurrent > 0 ? iecResults.ip_kA : 0}
                    letThroughEnergyKA2s={letThroughEnergy}
                    withstandCapacityKA2s={iecResults.withstandEnergy_kA2s}
                    cableSizeMm2={cableSizeMm2}
                    transformerKVA={transformerKVA}
                    ukPercent={ukPercent}
                    tripTime={tripTime}
                    isThermalPass={iecResults.isThermalPass}
                    timeScale={timeScale}
                    setTimeScale={setTimeScale}
                    className="w-full h-full"
                  />
                </div>

                {/* Bottom Timeline Progress Bar */}
                <div className="shrink-0 mt-1.5 px-2.5 py-1 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>⚡ Fault Ik: <strong className={faultCurrent > 0 ? "text-red-400" : "text-slate-300"}>{(faultCurrent/1000).toFixed(2)} kA</strong></span>
                    <span>Peak ip: <strong className={faultCurrent > 0 ? "text-orange-400" : "text-slate-400"}>{faultCurrent > 0 ? `${iecResults.ip_kA.toFixed(2)} kA` : "0.00 kA"}</strong></span>
                    <span>Energy I²t: <strong className="text-cyan-400">{letThroughEnergy.toFixed(2)} kA²s</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    {conductorMelted && (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        CABLE SEVERED (OPEN)
                      </span>
                    )}
                    <span>Trip: <strong className="text-emerald-400">{tripTime === Infinity ? 'None' : `${tripTime}ms`}</strong></span>
                  </div>
                </div>
              </main>

              {/* ────────────────────────────────────────────────────────────
                  RIGHT COLUMN: OUTPUTS, RESULTS & OTHER INFO (ZERO SCROLLBARS)
              ──────────────────────────────────────────────────────────── */}
              <aside className="w-full lg:w-72 xl:w-78 shrink-0 h-full overflow-hidden p-2 bg-slate-900/95 border-l border-slate-800 flex flex-col justify-between select-none">
                
                {/* Section 1: Live Coordination & Thermal Verdict Banner */}
                <div className={cn("p-2.5 rounded-xl border flex flex-col gap-1 transition-all", verdict.color)}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      COORDINATION VERDICT
                    </span>
                    <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 border border-white/20">
                      IEC 60909
                    </span>
                  </div>
                  <div className="text-xs font-black leading-tight">
                    {verdict.label}
                  </div>
                  <div className="text-[9.5px] opacity-90 leading-tight">
                    {verdict.desc}
                  </div>
                </div>

                {/* Section 2: 4 Live IEC 60909 Readout Gauges */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    LIVE IEC 60909 TELEMETRY GAUGES
                  </span>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Symmetrical Fault Current */}
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono text-slate-400 uppercase">Fault Current (Ik)</span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className={cn("text-base font-black font-mono", isFaultActive ? "text-red-400" : conductorMelted ? "text-amber-400" : "text-slate-100")}>
                          {(faultCurrent / 1000).toFixed(2)} <span className="text-[10px]">kA</span>
                        </span>
                        <span className={cn("text-[8px] font-black px-1 rounded", conductorMelted ? "bg-amber-950 text-amber-300" : "bg-slate-900 text-slate-300")}>
                          {conductorMelted ? "OPEN" : "RMS"}
                        </span>
                      </div>
                    </div>

                    {/* Peak Making Current */}
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono text-slate-400 uppercase">Peak Making (ip)</span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className={cn("text-base font-black font-mono", faultCurrent > 0 ? "text-orange-400" : "text-slate-400")}>
                          {faultCurrent > 0 ? iecResults.ip_kA.toFixed(2) : "0.00"} <span className="text-[10px]">kA</span>
                        </span>
                        <span className="text-[8px] font-black px-1 rounded bg-orange-950 text-orange-300 font-mono">
                          κ={iecResults.kappa.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Let-Through Energy */}
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono text-slate-400 uppercase">Let-Through (I²t)</span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className={cn("text-base font-black font-mono", letThroughEnergy > iecResults.withstandEnergy_kA2s ? "text-red-400" : "text-amber-400")}>
                          {letThroughEnergy.toFixed(2)} <span className="text-[10px]">kA²s</span>
                        </span>
                        <span className={cn("text-[8px] font-black px-1 rounded", letThroughEnergy > iecResults.withstandEnergy_kA2s ? "bg-red-950 text-red-300" : "bg-amber-950 text-amber-300")}>
                          {letThroughEnergy > iecResults.withstandEnergy_kA2s ? "EXCEEDED" : "OK"}
                        </span>
                      </div>
                    </div>

                    {/* Cable Withstand Capacity */}
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono text-slate-400 uppercase">Withstand (k²S²)</span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className="text-base font-black font-mono text-cyan-400">
                          {iecResults.withstandEnergy_kA2s.toFixed(2)} <span className="text-[10px]">kA²s</span>
                        </span>
                        <span className="text-[8px] font-black px-1 rounded bg-cyan-950 text-cyan-300">
                          {cableSizeMm2}mm²
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Electrodynamic & Cable Stress Indicators */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-400">Lorentz Busbar Force:</span>
                      <strong className={cn(lorentzForceKNm > 12 ? "text-red-400" : "text-amber-400")}>
                        {lorentzForceKNm.toFixed(1)} kN/m {lorentzForceKNm > 12 ? "⚠️" : ""}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-400">Min Cable Size Required:</span>
                      <strong className="text-cyan-400">S_min = {iecResults.Smin.toFixed(1)} mm²</strong>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-400">Total Clearing Time:</span>
                      <strong className="text-white">{tripTime === Infinity ? 'None (Fail)' : `${tripTime} ms (${iecResults.tRelayMs}r + ${iecResults.tBreakerMs}b + ${iecResults.tArcMs}a)`}</strong>
                    </div>
                  </div>
                </div>

                {/* Section 4: Safety Tools & Action Modals (2x2 Grid) */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    SAFETY TOOLS & DIAGNOSTIC MODALS
                  </span>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* 1000 FPS Replay */}
                    <button
                      onClick={() => setIsDisasterReplayOpen(true)}
                      className="p-1.5 rounded-lg border border-red-500/50 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                      <Camera className="w-3 h-3 text-red-400" />
                      <span>1000 FPS Replay</span>
                    </button>

                    {/* TCC Coordination Curve */}
                    <button
                      onClick={() => setActiveTab('coordination')}
                      className="p-1.5 rounded-lg border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-white text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                      <TrendingUp className="w-3 h-3 text-amber-400" />
                      <span>TCC Curve</span>
                    </button>

                    {/* PPE Validator */}
                    <button
                      onClick={() => setIsPPEModalOpen(true)}
                      className="p-1.5 rounded-lg border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-white text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                      <ShieldAlert className="w-3 h-3 text-cyan-400" />
                      <span>PPE Drill</span>
                    </button>

                    {/* IEC Math */}
                    <button
                      onClick={() => setIsMathModalOpen(true)}
                      className="p-1.5 rounded-lg border border-violet-500/50 bg-violet-950/40 hover:bg-violet-900/60 text-violet-300 hover:text-white text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                      <BookOpen className="w-3 h-3 text-violet-400" />
                      <span>IEC Math</span>
                    </button>
                  </div>
                </div>
              </aside>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────────────
              B. COORDINATION CHART (TCC) FULL VIEW
          ──────────────────────────────────────────────────────────────── */}
          {activeTab === 'coordination' && (
            <motion.div
              key="coordination"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col p-2 sm:p-3 overflow-hidden bg-slate-950"
            >
              <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      Time-Current Coordination Chart (TCC Curve)
                    </h2>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Relay Clearing vs Cable Thermal Damage Curve (IEC 60364-4-43)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('simulation')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase cursor-pointer"
                >
                  Back to Simulator ➔
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <CoordinationChartCard
                  time={time}
                  faultCurrentKA={iecResults.Ik_kA}
                  faultCurrentA={iecResults.Ik}
                  protectionSpeed={protectionSpeed}
                  tRelayMs={iecResults.tRelayMs}
                  tBreakerMs={iecResults.tBreakerMs}
                  tArcMs={iecResults.tArcMs}
                  tTotalMs={tripTime}
                  cableSizeMm2={cableSizeMm2}
                  withstandEnergyA2s={iecResults.withstandEnergy}
                  withstandEnergyKA2s={iecResults.withstandEnergy_kA2s}
                  letThroughEnergyKA2s={letThroughEnergy}
                  tripped={tripped}
                  className="h-full w-full"
                />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          3. MODAL DIALOGS
      ════════════════════════════════════════════════════════════════════════ */}
      
      {/* 1,000 FPS Disaster Replay Modal */}
      <DisasterReplayModal
        isOpen={isDisasterReplayOpen}
        onClose={() => setIsDisasterReplayOpen(false)}
        initialVoltage={systemVoltage}
        initialCurrentKA={Number((prospectiveFaultCurrent / 1000).toFixed(1))}
        faultType="mcb_short_circuit"
      />

      {/* PPE Validator Modal */}
      <AnimatePresence>
        {isPPEModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-750 rounded-2xl p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    PPE & Arc Flash Safety Validation Drill
                  </h3>
                </div>
                <button
                  onClick={() => setIsPPEModalOpen(false)}
                  className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <EmergencyResponse 
                isSimulating={time >= faultIgnitionTime && !tripped && !isPPESafe} 
                hasSimulated={hasSimulated} 
                type="short_circuit" 
              />
              <PPEValidator hazardType="shock_ac" hazardMagnitude={systemVoltage} onSafetyChange={setIsPPESafe} />

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsPPEModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IEC Math & Equations Modal */}
      <AnimatePresence>
        {isMathModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-750 rounded-2xl p-4 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    IEC 60909 Short-Circuit Physics Equations
                  </h3>
                </div>
                <button
                  onClick={() => setIsMathModalOpen(false)}
                  className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="font-bold text-amber-400 uppercase mb-1">1. 3-Phase Bolted Fault Current (Ik3)</h4>
                  <p className="font-mono text-cyan-300 text-sm mb-1">Ik3 = c · Un / (√3 · Z1)</p>
                  <p>Maximum symmetrical fault current. c = 1.05 voltage factor, Un = {systemVoltage}V, Z1 = positive sequence impedance.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="font-bold text-orange-400 uppercase mb-1">2. Peak Making Current (ip)</h4>
                  <p className="font-mono text-orange-300 text-sm mb-1">ip = κ · √2 · Ik</p>
                  <p className="font-mono text-xs text-slate-400 mb-1">κ = 1.02 + 0.98 · e^(-3R/X)</p>
                  <p>Represents the absolute dynamic electromagnetic peak current occurring during the first 10ms cycle due to DC offset.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="font-bold text-cyan-400 uppercase mb-1">3. Cable Thermal Withstand (IEC 60364-4-43)</h4>
                  <p className="font-mono text-cyan-300 text-sm mb-1">I²t ≤ k²S²  ⟹  S_min = √(I²t) / k</p>
                  <p>For Cu PVC conductor, k = 115. Prevents conductor temperature from exceeding 160°C breakdown threshold.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsMathModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full screen flash hazard overlay */}
      <HazardOverlay 
        isActive={isFaultActive}
        hazardType="short_circuit"
        dangerLevel={letThroughEnergy > (iecResults.withstandEnergy_kA2s || 3.4) ? "critical" : "warning"}
        magnitude={`${(faultCurrent/1000).toFixed(1)} kA FAULT (${faultType === 'three_phase' ? '3-Phase' : 'Line-Ground'})`}
      />
    </div>
  );
}
