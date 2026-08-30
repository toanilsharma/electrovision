import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, AlertTriangle, Clock, TrendingUp, Cpu, Sliders, Settings, 
  Play, RotateCcw, Flame, ShieldAlert, Activity, BookOpen, ShieldCheck, Square, Info,
  ChevronDown, ChevronUp, Layers, HelpCircle, CheckCircle2, XCircle, Gauge
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
import { EventTimelineScrubber } from './EventTimelineScrubber';
import { CoordinationChartCard } from './CoordinationChartCard';

export function ShortCircuitSimulator({ config }: { config?: UserConfig }) {
  // Primary UI Controls (Default 3 Relay Modes & 2 Fault Types)
  const [protectionSpeed, setProtectionSpeed] = useState<'fast' | 'delayed' | 'fail'>('fast');
  const [faultType, setFaultType] = useState<'three_phase' | 'line_ground'>('three_phase');

  // Engineer Details Collapsible & Advanced IEC 60909 Parameters
  const [showEngineerDetails, setShowEngineerDetails] = useState<boolean>(false);
  const [transformerKVA, setTransformerKVA] = useState<number>(630);
  const [ukPercent, setUkPercent] = useState<number>(6.0);
  const [cableLengthM, setCableLengthM] = useState<number>(0);
  const [cableSizeMm2, setCableSizeMm2] = useState<number>(16);
  const [z0z1Ratio, setZ0z1Ratio] = useState<number>(1.7);
  const [isLimitingBreaker, setIsLimitingBreaker] = useState<boolean>(false);

  // Time Scale Control (1X Normal, 0.5X, 0.25X Slow-Mo)
  const [timeScale, setTimeScale] = useState<number>(1);

  // Active Tooltip Target
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Simulation Dials
  const [time, setTime] = useState<number>(0); // simulated time (0 to 100ms)
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);
  const [isPPESafe, setIsPPESafe] = useState<boolean>(false);

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

  // Evaluate instant current, tripped state, let-through energy, and wire heat
  const { faultCurrent, tripped, letThroughEnergy, heatLevel } = useMemo(() => {
    let current = nominalLoadCurrent;
    let isTripped = false;
    let energy = 0;
    let heat = 0;

    if (time > 0) {
      if (time < faultIgnitionTime) {
        current = nominalLoadCurrent;
        energy = 0;
        heat = 0;
      } else if (tripTime === Infinity || time <= faultIgnitionTime + tripTime) {
        // Fault active
        const ramp = Math.min(1, (time - faultIgnitionTime) / 4);
        current = nominalLoadCurrent + (prospectiveFaultCurrent - nominalLoadCurrent) * ramp;

        // Energy = I^2 * t
        const activeSec = (time - faultIgnitionTime) / 1000;
        const uncappedEnergy = Math.pow(current / 1000, 2) * activeSec; // kA²s
        
        if (isLimitingBreaker && tripTime !== Infinity) {
          const capTarget = 0.6 * Math.pow(current / 15000, 2);
          energy = Math.min(uncappedEnergy, Math.max(0.1, capTarget));
        } else {
          energy = uncappedEnergy;
        }

        // Heat level normalized relative to cable withstand energy (k²S² in kA²s)
        const withstandCapacity = iecResults.withstandEnergy_kA2s;
        heat = Math.min(1.8, energy / (withstandCapacity || 3.4));
      } else {
        // Breaker tripped
        isTripped = true;
        current = 0;

        energy = iecResults.letThroughEnergy_kA2s;
        const withstandCapacity = iecResults.withstandEnergy_kA2s;
        const finalHeat = Math.min(1.8, energy / (withstandCapacity || 3.4));

        const coolingDuration = time - (faultIgnitionTime + tripTime);
        heat = Math.max(0, finalHeat - coolingDuration / 50);
      }
    }

    return {
      faultCurrent: current,
      tripped: isTripped,
      letThroughEnergy: energy,
      heatLevel: heat
    };
  }, [time, prospectiveFaultCurrent, tripTime, isLimitingBreaker, iecResults]);

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

  // Determine safety verdict based on Let-Through energy vs Cable Thermal Withstand (k²S²)
  const verdict = useMemo(() => {
    if (time === 0) {
      return { 
        status: 'idle', 
        label: 'STANDBY / OK', 
        color: 'text-slate-300 bg-slate-900 border-slate-700 shadow-md', 
        desc: 'Conductors armed. Nominal power flowing. Awaiting short-circuit trigger.' 
      };
    }
    if (!tripped) {
      if (time === 100) {
        return { 
          status: 'fail', 
          label: 'CRITICAL FAILURE: NO TRIP (MELT)', 
          color: 'text-red-400 bg-red-950/80 border-red-500/50 font-black animate-pulse shadow-md', 
          desc: `The relay failed to trip. Continuous fault current of ${iecResults.Ik_kA.toFixed(2)} kA exceeded cable thermal withstand limit (${iecResults.withstandEnergy_kA2s.toFixed(1)} kA²s), causing explosive conductor meltdown!` 
        };
      }
      return { 
        status: 'faulting', 
        label: 'SHORT-CIRCUIT IN PROGRESS', 
        color: 'text-red-400 bg-red-950/80 border-red-500/30 font-bold animate-pulse shadow-md', 
        desc: `Heavy ${faultType === 'three_phase' ? '3-Phase' : 'Line-to-Ground'} fault current is active. Peak making current ip = ${iecResults.ip_kA.toFixed(2)} kA.` 
      };
    }

    if (iecResults.isThermalPass) {
      return { 
        status: 'safe', 
        label: `VERDICT: PASS (CABLE COLD & SAFE)`, 
        color: 'text-green-400 bg-green-950/80 border-green-500/40 shadow-md', 
        desc: `Relay cleared fault in ${tripTime}ms (${iecResults.tRelayMs}ms relay + ${iecResults.tBreakerMs}ms CB + ${iecResults.tArcMs}ms arc). Let-through energy ${letThroughEnergy.toFixed(2)} kA²s is below ${cableSizeMm2}mm² Cu PVC withstand limit (${iecResults.withstandEnergy_kA2s.toFixed(2)} kA²s). S_min = ${iecResults.Smin.toFixed(1)} mm².` 
      };
    } else {
      return { 
        status: 'danger', 
        label: `VERDICT: MELT (CABLE THERMAL OVERLOAD)`, 
        color: 'text-red-400 bg-red-950/90 border-red-500/50 font-extrabold shadow-md', 
        desc: `Delayed trip (${tripTime}ms) allowed ${letThroughEnergy.toFixed(2)} kA²s let-through, exceeding ${cableSizeMm2}mm² Cu withstand limit (${iecResults.withstandEnergy_kA2s.toFixed(2)} kA²s). Cable insulation melted! Minimum required cable size S_min = ${iecResults.Smin.toFixed(1)} mm².` 
      };
    }
  }, [time, tripped, letThroughEnergy, tripTime, iecResults, faultType, cableSizeMm2]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-4 bg-transparent text-slate-100 overflow-x-hidden p-2 md:p-0">
      
      {/* LEFT COLUMN: Controls, Diagram (Mobile), Timeline Scrubber, Coordination Chart, Diagnostics */}
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto pr-0 lg:pr-2 pb-20 lg:pb-4 scrollbar-thin scrollbar-thumb-slate-800 order-2 lg:order-1 gap-3">
        
        {/* Core Controls Panel (1. Controls Card) */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> Simulator Controls (IEC 60909 Engine)
            </h3>
            <span className="text-[11px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 tabular-nums">
              c = 1.05 | {systemVoltage}V
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
            {/* Protection Speed Toggle (3 Primary Modes) */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wide flex items-center justify-between">
                <span>1. Relay Protection Speed</span>
                <span className="text-[11px] text-cyan-400 font-mono tabular-nums">
                  {tripTime === Infinity ? 'No Trip' : `${tripTime} ms Total`}
                </span>
              </span>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-750">
                <button
                  onClick={() => { setTime(0); setProtectionSpeed('fast'); }}
                  className={cn(
                    "py-2.5 text-[11px] font-bold rounded transition-all cursor-pointer border min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none", 
                    protectionSpeed === 'fast' 
                      ? 'bg-green-600 text-slate-950 border-green-400 font-extrabold shadow-sm' 
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  Fast Trip (14ms)
                </button>
                <button
                  onClick={() => { setTime(0); setProtectionSpeed('delayed'); }}
                  className={cn(
                    "py-2.5 text-[11px] font-bold rounded transition-all cursor-pointer border min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none", 
                    protectionSpeed === 'delayed' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' 
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  Delayed (76ms)
                </button>
                <button
                  onClick={() => { setTime(0); setProtectionSpeed('fail'); }}
                  className={cn(
                    "py-2.5 text-[11px] font-bold rounded transition-all cursor-pointer border min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none", 
                    protectionSpeed === 'fail' 
                      ? 'bg-red-600 text-slate-100 border-red-400 font-extrabold shadow-sm' 
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  No Trip (∞)
                </button>
              </div>
            </div>

            {/* Short Circuit Type Toggle (2 Fault Types) */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wide flex items-center justify-between">
                <span>2. Fault Current Type</span>
                <span className="text-[11px] text-orange-400 font-mono font-bold tabular-nums">
                  Ik = {iecResults.Ik_kA.toFixed(2)} kA
                </span>
              </span>
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-750">
                <button
                  onClick={() => { setTime(0); setFaultType('three_phase'); }}
                  className={cn(
                    "py-2.5 text-xs font-bold rounded-md transition-all cursor-pointer border min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none", 
                    faultType === 'three_phase' 
                      ? 'bg-red-600 text-white border-red-500 font-extrabold shadow-sm' 
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  3-Phase (Ik3 ≈ {iecResults.Ik3_kA.toFixed(1)}kA)
                </button>
                <button
                  onClick={() => { setTime(0); setFaultType('line_ground'); }}
                  className={cn(
                    "py-2.5 text-xs font-bold rounded-md transition-all cursor-pointer border min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none", 
                    faultType === 'line_ground' 
                      ? 'bg-red-600 text-white border-red-500 font-extrabold shadow-sm' 
                      : 'bg-slate-950/60 text-slate-350 border-slate-800 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  Line-to-Ground (Ik1 ≈ {iecResults.Ik1_kA.toFixed(1)}kA)
                </button>
              </div>
            </div>
          </div>

          {/* Desktop IGNITE & RESET SCENARIO Action Buttons */}
          <div className="hidden lg:flex gap-2 mt-2">
            {isAutoPlaying ? (
              <button 
                onClick={() => setIsAutoPlaying(false)}
                className="flex-1 py-3 font-bold text-xs uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white border border-red-500 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-red-400 min-h-[44px]"
              >
                <Square className="w-4 h-4 fill-white" /> STOP FAULT SIMULATION
              </button>
            ) : (
              <button 
                onClick={() => {
                  if (time >= 100) setTime(0);
                  setIsAutoPlaying(true);
                }}
                className="flex-1 py-3 font-bold text-xs uppercase tracking-widest bg-green-600 hover:bg-green-700 text-slate-950 border border-green-500 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md font-black focus-visible:ring-2 focus-visible:ring-green-400 min-h-[44px]"
              >
                <Play className="w-4 h-4 fill-slate-950 animate-pulse" /> IGNITE SHORT-CIRCUIT FAULT
              </button>
            )}

            <button 
              onClick={() => {
                setIsAutoPlaying(false);
                setTime(0);
              }}
              className="px-4 py-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" /> RESET SCENARIO
            </button>
          </div>
        </div>

        {/* TEACHING INSTRUMENT 1: EVENT TIMELINE SCRUBBER */}
        <EventTimelineScrubber
          time={time}
          setTime={setTime}
          isAutoPlaying={isAutoPlaying}
          setIsAutoPlaying={setIsAutoPlaying}
          protectionSpeed={protectionSpeed}
          tRelayMs={iecResults.tRelayMs}
          tBreakerMs={iecResults.tBreakerMs}
          tArcMs={iecResults.tArcMs}
          tTotalMs={tripTime}
          tripped={tripped}
        />

        {/* Live Diagnostics Card (3 cards wrap cleanly) */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Live Diagnostics & Formula Tooltips
            </h3>
            {isLimitingBreaker && (
              <span className="bg-cyan-950 text-cyan-300 text-[11px] font-bold px-2 py-0.5 rounded border border-cyan-700 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Current Limiting Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            {/* Fault Current Readout */}
            <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50 text-center relative group">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Fault Current (Ik)</span>
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'Ik' ? null : 'Ik')}
                  className="text-slate-400 hover:text-cyan-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className={cn(
                "text-xl md:text-2xl font-black tabular-nums",
                time >= faultIgnitionTime && !tripped ? "text-red-500" : "text-slate-100"
              )}>
                {(faultCurrent / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">kA</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {faultType === 'three_phase' ? '3-Phase (Ik3)' : 'Line-Ground (Ik1)'}
              </span>

              {/* Formula Tooltip */}
              {activeTooltip === 'Ik' && (
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 bg-slate-900 border border-cyan-500 rounded-lg text-left text-[11px] text-slate-200 z-50 shadow-2xl font-sans">
                  <strong className="text-cyan-400 block mb-1">IEC 60909 Fault Current Equations:</strong>
                  <p className="font-mono text-[11px] text-amber-300 tabular-nums">Ik3 = c · Un / (√3 · Z1)</p>
                  <p className="font-mono text-[11px] text-amber-300 tabular-nums">Ik1 = √3 · c · Un / (2·Z1 + Z0)</p>
                  <p className="mt-1 text-[11px] text-slate-300">c=1.05, Un={systemVoltage}V, Z1={(iecResults.Z1*1000).toFixed(1)}mΩ, Z0/Z1={z0z1Ratio}</p>
                </div>
              )}
            </div>

            {/* Peak Making Current ip */}
            <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50 text-center relative group">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Peak Making (ip)</span>
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'ip' ? null : 'ip')}
                  className="text-slate-400 hover:text-cyan-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xl md:text-2xl font-black text-orange-400 tabular-nums">
                {iecResults.ip_kA.toFixed(2)} <span className="text-xs font-normal text-slate-400">kA</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5 tabular-nums">
                κ = {iecResults.kappa.toFixed(3)}
              </span>

              {/* Formula Tooltip */}
              {activeTooltip === 'ip' && (
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 bg-slate-900 border border-orange-500 rounded-lg text-left text-[11px] text-slate-200 z-50 shadow-2xl font-sans">
                  <strong className="text-orange-400 block mb-1">Peak Making Current Equation:</strong>
                  <p className="font-mono text-[11px] text-amber-300 tabular-nums">ip = κ · √2 · Ik</p>
                  <p className="font-mono text-[11px] text-amber-300 tabular-nums">κ = 1.02 + 0.98 · e^(-3R/X)</p>
                  <p className="mt-1 text-[11px] text-slate-300">Accounts for asymmetrical DC component offset at fault inception.</p>
                </div>
              )}
            </div>

            {/* Let-Through Energy (I²t) */}
            <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50 text-center relative group">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Let-Through (I²t)</span>
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'I2t' ? null : 'I2t')}
                  className="text-slate-400 hover:text-cyan-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xl md:text-2xl font-black text-amber-400 tabular-nums">
                {letThroughEnergy.toFixed(2)} <span className="text-xs font-normal text-slate-400">kA²s</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5 tabular-nums">
                {isLimitingBreaker ? 'Energy Capped' : `t = ${tripTime} ms`}
              </span>

              {/* Formula Tooltip */}
              {activeTooltip === 'I2t' && (
                <div className="absolute right-0 bottom-full mb-2 w-64 p-2.5 bg-slate-900 border border-amber-500 rounded-lg text-left text-[11px] text-slate-200 z-50 shadow-2xl font-sans">
                  <strong className="text-amber-400 block mb-1">Let-Through Thermal Energy:</strong>
                  <p className="font-mono text-[11px] text-amber-300 tabular-nums">I²t = (Ik)² · t_clearing</p>
                  <p className="mt-1 text-[11px] text-slate-300">Total thermal stress delivered to downstream equipment during fault clearing.</p>
                </div>
              )}
            </div>

            {/* Cable Withstand Capacity (k²S²) */}
            <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50 text-center relative group">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Withstand (k²S²)</span>
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'k2s2' ? null : 'k2s2')}
                  className="text-slate-400 hover:text-cyan-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xl md:text-2xl font-black text-cyan-400 tabular-nums">
                {iecResults.withstandEnergy_kA2s.toFixed(2)} <span className="text-xs font-normal text-slate-400">kA²s</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5 tabular-nums">
                {cableSizeMm2}mm² (k=115)
              </span>

              {/* Formula Tooltip */}
              {activeTooltip === 'k2s2' && (
                <div className="absolute right-0 bottom-full mb-2 w-64 p-2.5 bg-slate-900 border border-cyan-500 rounded-lg text-left text-[11px] text-slate-200 z-50 shadow-2xl font-sans">
                  <strong className="text-cyan-400 block mb-1">IEC 60364-4-43 Cable Thermal Capacity:</strong>
                  <p className="font-mono text-[11px] text-amber-300 tabular-nums">k²S² = (115 · {cableSizeMm2})²</p>
                  <p className="font-mono text-[11px] text-amber-300 tabular-nums">S_min = √(I²t) / k</p>
                  <p className="mt-1 text-[11px] text-slate-300">Maximum permissible thermal stress before conductor insulation breakdown.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TEACHING INSTRUMENT 2: PROTECTION COORDINATION CHART CARD */}
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
        />

        {/* ENGINEER DETAILS COLLAPSIBLE SECTION */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden shrink-0">
          <button
            onClick={() => setShowEngineerDetails(prev => !prev)}
            className="w-full p-3.5 bg-slate-850 hover:bg-slate-750 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-700/60 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Engineer Details (IEC 60909 Parameters)
              </span>
              <span className="text-[11px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-750 font-mono tabular-nums">
                {transformerKVA} kVA | {cableSizeMm2} mm² | {cableLengthM}m
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-cyan-400 font-semibold">
              <span>{showEngineerDetails ? "Hide" : "Expand"}</span>
              {showEngineerDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showEngineerDetails && (
            <div className="p-4 space-y-4 bg-slate-900/60 border-t border-slate-750 text-xs">
              
              {/* Transformer & System Source Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Transformer kVA */}
                <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>Transformer Rating</span>
                    <span className="text-cyan-400 font-mono tabular-nums">{transformerKVA} kVA</span>
                  </div>
                  <select
                    value={transformerKVA}
                    onChange={(e) => { setTime(0); setTransformerKVA(Number(e.target.value)); }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
                  >
                    {[100, 250, 400, 630, 800, 1000, 1250, 1600, 2000, 2500].map(kva => (
                      <option key={kva} value={kva}>{kva} kVA</option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400 block">Default: 630 kVA (c=1.05, 415V)</span>
                </div>

                {/* Transformer uk% */}
                <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>Impedance Voltage uk%</span>
                    <span className="text-cyan-400 font-mono tabular-nums">{ukPercent.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="2.0" max="10.0" step="0.5"
                    value={ukPercent}
                    onChange={(e) => { setTime(0); setUkPercent(Number(e.target.value)); }}
                    className="w-full accent-cyan-500 cursor-pointer h-2"
                  />
                  <span className="text-[11px] text-slate-400 block tabular-nums">ZT = {iecResults.Z_T.toFixed(4)} Ω</span>
                </div>

                {/* Cable Length (m) */}
                <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>Cable Length</span>
                    <span className="text-cyan-400 font-mono tabular-nums">{cableLengthM} m</span>
                  </div>
                  <input
                    type="range"
                    min="0" max="50" step="5"
                    value={cableLengthM}
                    onChange={(e) => { setTime(0); setCableLengthM(Number(e.target.value)); }}
                    className="w-full accent-cyan-500 cursor-pointer h-2"
                  />
                  <span className="text-[11px] text-slate-400 block tabular-nums">RC = {iecResults.R_C.toFixed(4)} Ω</span>
                </div>
              </div>

              {/* Cable Size & Z0/Z1 Ratio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Cable Size Selector */}
                <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between font-bold text-slate-300 mb-1">
                    <span>Cable Cross Section (S)</span>
                    <span className="text-orange-400 font-mono tabular-nums">{cableSizeMm2} mm² Cu</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[6, 10, 16, 25, 35, 50, 70].map(sz => (
                      <button
                        key={sz}
                        onClick={() => { setTime(0); setCableSizeMm2(sz); }}
                        className={cn(
                          "py-2 text-[11px] font-bold rounded border font-mono transition-all min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
                          cableSizeMm2 === sz 
                            ? 'bg-orange-500 text-slate-950 border-orange-400' 
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        )}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Z0 / Z1 Ratio Slider */}
                <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>Z0/Z1 Ratio (Zero Sequence)</span>
                    <span className="text-cyan-400 font-mono tabular-nums">{z0z1Ratio.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0" max="4.0" step="0.1"
                    value={z0z1Ratio}
                    onChange={(e) => { setTime(0); setZ0z1Ratio(Number(e.target.value)); }}
                    className="w-full accent-cyan-500 cursor-pointer h-2"
                  />
                  <span className="text-[11px] text-slate-400 block tabular-nums">Default 1.7 → Ik1 ≈ {(iecResults.Ik1 / iecResults.Ik3).toFixed(2)}×Ik3</span>
                </div>

                {/* Current Limiting Breaker Mode Toggle */}
                <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between font-bold text-slate-300">
                    <span>Current-Limiting Breaker</span>
                    <button
                      onClick={() => { setTime(0); setIsLimitingBreaker(prev => !prev); }}
                      className={cn(
                        "px-3 py-2 rounded text-[11px] font-bold border cursor-pointer transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
                        isLimitingBreaker 
                          ? "bg-cyan-600 text-slate-950 border-cyan-400" 
                          : "bg-slate-900 text-slate-300 border-slate-750"
                      )}
                    >
                      {isLimitingBreaker ? "ENABLED (Class 3)" : "DISABLED"}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    Caps let-through energy to ≤0.6 kA²s at 15 kA prospective fault.
                  </span>
                </div>
              </div>

              {/* Calculated Impedance Summary */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300 grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase">Positive Impedance Z1</span>
                  <span className="font-bold text-cyan-400 tabular-nums">{(iecResults.Z1 * 1000).toFixed(2)} mΩ</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase">System X/R Ratio</span>
                  <span className="font-bold text-cyan-400 tabular-nums">{iecResults.systemXR.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase">Peak Factor κ</span>
                  <span className="font-bold text-orange-400 tabular-nums">{iecResults.kappa.toFixed(3)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase">Peak Making ip</span>
                  <span className="font-bold text-red-400 tabular-nums">{iecResults.ip_kA.toFixed(2)} kA</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Dynamic Safety Outcome Card (COORDINATION STATUS REPORT with aria-live="polite") */}
        <div 
          aria-live="polite"
          className={cn("p-4 rounded-xl border shadow-md flex flex-col gap-2 transition-all", verdict.color)}
        >
          <span className="text-xs font-black tracking-widest uppercase opacity-80 flex items-center justify-between">
            <span>IEC 60909 Coordination & Thermal Report</span>
            {tripped && (
              <span className="font-mono tabular-nums">
                {iecResults.isThermalPass ? 'PASS ✓' : 'FAIL ✗'}
              </span>
            )}
          </span>
          <div className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mt-0.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {verdict.label}
          </div>
          <p className="text-sm leading-relaxed font-semibold mt-1">
            {verdict.desc}
          </p>
        </div>

        {/* Protection relay classroom math & safety lessons */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col gap-3">
          <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 border-b border-slate-700 pb-2">
            📖 IEC 60909 Short-Circuit & Cable Thermal Safety Lessons
          </h3>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              <strong className="text-amber-400 block font-bold mb-1">1. 3-Phase vs Line-to-Ground Fault Currents (IEC 60909)</strong>
              3-Phase bolted faults yield maximum symmetrical current <code className="text-cyan-300 font-mono tabular-nums">Ik3 = c·Un / (√3·Z1)</code> (~15.3 kA). Single Line-to-Ground faults involve zero-sequence impedance <code className="text-cyan-300 font-mono tabular-nums">Ik1 = √3·c·Un / (2·Z1 + Z0)</code> (~12.4 kA for Z0/Z1 = 1.7).
            </p>
            <p>
              <strong className="text-amber-400 block font-bold mb-1">2. Peak Making Current (ip) Dynamic Impact</strong>
              The maximum peak current occurs during the first half-cycle due to asymmetrical DC offset: <code className="text-orange-300 font-mono tabular-nums">ip = κ·√2·Ik</code>. High X/R ratios increase peak factor κ up to 2.0, subjecting switchgear busbars to extreme electrodynamic mechanical forces.
            </p>
            <p>
              <strong className="text-amber-400 block font-bold mb-1">3. Cable Thermal Adiabatic Criterion (IEC 60364-4-43)</strong>
              Conductor safety requires let-through energy <code className="text-amber-300 font-mono tabular-nums">I²t ≤ k²S²</code>. For a 16 mm² Cu PVC conductor (k=115), maximum withstand is <code className="text-cyan-300 font-mono tabular-nums">3.39 kA²s</code>. Fast clearing (14ms) delivers ~3.3 kA²s (PASS), while delayed clearing (76ms) delivers ~17.8 kA²s, vaporizing cable insulation!
            </p>
          </div>
        </div>

        {/* Safety Drill modules */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col gap-2.5">
          <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 border-b border-slate-700 pb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" /> PPE & Arc Flash Drills
          </h3>
          <div>
            <EmergencyResponse 
              isSimulating={time >= faultIgnitionTime && !tripped && !isPPESafe} 
              hasSimulated={hasSimulated} 
              type="short_circuit" 
            />
            <div className="mt-2 shrink-0">
              <PPEValidator hazardType="shock_ac" hazardMagnitude={systemVoltage} onSafetyChange={setIsPPESafe} />
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Premium Animated Vector Single Line Diagram (55vh Mobile / Panel Desktop) */}
      <div className="w-full lg:w-[480px] xl:w-[540px] shrink-0 h-[55vh] min-h-[480px] lg:h-full order-1 lg:order-2 flex flex-col relative shadow-2xl">
        <IndustrialGridDiagram
          time={time}
          isFaultActive={time >= faultIgnitionTime && !tripped}
          tripped={tripped}
          faultType={faultType}
          protectionSpeed={protectionSpeed}
          faultCurrent={faultCurrent}
          faultCurrentKA={iecResults.Ik_kA}
          peakCurrentKA={iecResults.ip_kA}
          letThroughEnergyKA2s={letThroughEnergy}
          withstandCapacityKA2s={iecResults.withstandEnergy_kA2s}
          cableSizeMm2={cableSizeMm2}
          transformerKVA={transformerKVA}
          ukPercent={ukPercent}
          tripTime={tripTime}
          isThermalPass={iecResults.isThermalPass}
          timeScale={timeScale}
          setTimeScale={setTimeScale}
        />
      </div>

      {/* STICKY BOTTOM ACTION BAR FOR MOBILE (360x740 One-Handed Control with 44px Touch Targets) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 p-2.5 px-3 flex gap-2 backdrop-blur shadow-2xl">
        {isAutoPlaying ? (
          <button 
            onClick={() => setIsAutoPlaying(false)}
            className="flex-1 py-3 font-bold text-xs uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white border border-red-500 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-red-400 min-h-[44px]"
          >
            <Square className="w-4 h-4 fill-white" /> STOP FAULT
          </button>
        ) : (
          <button 
            onClick={() => {
              if (time >= 100) setTime(0);
              setIsAutoPlaying(true);
            }}
            className="flex-1 py-3 font-bold text-xs uppercase tracking-widest bg-green-600 hover:bg-green-700 text-slate-950 border border-green-500 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md font-black focus-visible:ring-2 focus-visible:ring-green-400 min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-slate-950 animate-pulse" /> IGNITE FAULT
          </button>
        )}

        <button 
          onClick={() => {
            setIsAutoPlaying(false);
            setTime(0);
          }}
          className="px-4 py-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4 text-cyan-400" /> RESET SCENARIO
        </button>
      </div>

      {/* Full screen flash hazard overlay with Dynamic kA Fault readout */}
      <HazardOverlay 
        isActive={time >= faultIgnitionTime && !tripped}
        hazardType="short_circuit"
        dangerLevel={letThroughEnergy > (iecResults.withstandEnergy_kA2s || 3.4) ? "critical" : "warning"}
        magnitude={`${(faultCurrent/1000).toFixed(1)} kA TRANSIENT FAULT (${faultType === 'three_phase' ? '3-Phase' : 'Line-Ground'})`}
      />

    </div>
  );
}
