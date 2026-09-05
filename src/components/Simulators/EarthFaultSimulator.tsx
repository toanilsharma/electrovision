import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Zap, AlertTriangle, ShieldCheck, ShieldAlert, Activity, 
  Info, Sliders, Settings, RotateCcw, Shield, CheckCircle2, Flame, HeartPulse, Gauge, Clock
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { HazardOverlay } from '../HazardOverlay';
import { HumanBodyTwin } from '../HumanBodyTwin';
import { SafetyLessonModal } from '../SafetyLessonModal';
import { DebriefTriggerCard } from '../DebriefTriggerCard';
import { useAudioHaptics } from '../useAudioHaptics';

// IEC 60479-1 Earth Fault System Voltage Reference Levels
const ALL_EARTH_VOLTAGES = [
  { value: 50, label: '50V (SELV Safe Touch Voltage Limit)' },
  { value: 120, label: '120V (Low Voltage Nominal)' },
  { value: 230, label: '230V (Single-Phase AC Mains)' },
  { value: 415, label: '415V (3-Phase Residential/Commercial AC)' },
  { value: 700, label: '700V (Elevated Industrial System)', industrialOnly: true },
  { value: 1000, label: '1000V (IEC 60479-1 Upper LV Limit)', industrialOnly: true },
];

export function EarthFaultSimulator({ config }: { config?: UserConfig }) {
  const isResidential = config?.environment === 'residential';
  const maxVoltageLimit = isResidential ? 415 : 1000;

  // Simulator Dials & Voltage State
  const [voltage, setVoltage] = useState<number>(isResidential ? 230 : 230);
  const [scenario, setScenario] = useState<'solid' | 'broken'>('solid');
  const [ppeEnabled, setPpeEnabled] = useState<boolean>(false);
  const [faultActive, setFaultActive] = useState<boolean>(false);
  const [breakerTripped, setBreakerTripped] = useState<boolean>(false);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [showSafetyLesson, setShowSafetyLesson] = useState<boolean>(false);
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);

  const [lastActiveFaultData, setLastActiveFaultData] = useState<{
    currentMA: number;
    durationMs: number;
    voltage: number;
    isPPESafe: boolean;
    activePPENames: string[];
  }>({
    currentMA: 0,
    durationMs: 0,
    voltage: 230,
    isPPESafe: false,
    activePPENames: []
  });

  const standardVoltages = useMemo(() => {
    return ALL_EARTH_VOLTAGES.filter(v => !isResidential || !v.industrialOnly);
  }, [isResidential]);

  useEffect(() => {
    if (isResidential && voltage > 415) {
      setVoltage(415);
    }
  }, [isResidential, voltage]);

  // Synchronized voltage dropdown binding
  const isStandardVoltage = standardVoltages.some(item => item.value === voltage);
  const dropdownValue = isStandardVoltage ? voltage.toString() : 'custom';

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val !== 'custom') {
      setVoltage(Number(val));
    }
  };

  const [workerDistance, setWorkerDistance] = useState<number>(2.0);
  const { playBreakerTripSound, playArcCrackle, startHum, stopHum } = useAudioHaptics();

  // Duration timer while fault is active
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (faultActive && !breakerTripped) {
      interval = setInterval(() => {
        setDurationMs(prev => Math.min(prev + 50, 10000));
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [faultActive, breakerTripped]);

  // Upstream protective breaker trip simulation on Solid Ground Fault
  useEffect(() => {
    if (faultActive && scenario === 'solid') {
      const timeout = setTimeout(() => {
        setBreakerTripped(true);
        playBreakerTripSound();
      }, 350); // Trips in 350ms to demonstrate transient shunting & breaker trip
      return () => clearTimeout(timeout);
    }
  }, [faultActive, scenario, playBreakerTripSound]);

  // Sound effect on fault trigger
  useEffect(() => {
    if (faultActive && !breakerTripped) {
      playArcCrackle(300);
      startHum(60);
    } else {
      stopHum();
    }
  }, [faultActive, breakerTripped, playArcCrackle, startHum, stopHum]);

  // Reset breaker when fault is cleared
  useEffect(() => {
    if (!faultActive) {
      setBreakerTripped(false);
      setDurationMs(0);
    }
  }, [faultActive]);

  const handleResetSimulator = () => {
    setFaultActive(false);
    setHasSimulated(false);
    setShowSafetyLesson(false);
    setBreakerTripped(false);
    setScenario('solid');
    setPpeEnabled(false);
    setVoltage(isResidential ? 230 : 415);
    setDurationMs(0);
    setWorkerDistance(2.0);
    stopHum();
  };

  // ----------------------------------------------------
  // PHYSICS ENGINE CALCULATIONS (APPROVED IEC 60479-1 / IEEE 80 STANDARDS)
  // ----------------------------------------------------
  const physics = useMemo(() => {
    const rBody = 1000; // Ohms (IEC 60479-1 human touch path)
    
    // PPE Isolation resistances
    const rShoes = ppeEnabled ? 1000000 : 1500; // 1MΩ dielectric boots vs 1.5kΩ standard
    const rGloves = ppeEnabled ? 1000000 : 0; // 1MΩ rubber gloves vs 0Ω bare skin
    const rTotalBodyPath = rBody + rShoes + rGloves;

    // Ground electrode resistance
    const rEarth = 2.0; // Ohms (Standard copper earth rod)

    let bodyCurrent = 0; // mA
    let groundCurrent = 0; // A
    let touchVoltage = 0; // V
    let gprVolts = 0;
    let stepVoltage = 0;
    let stepCurrentMA = 0;

    if (faultActive && !breakerTripped) {
      if (scenario === 'solid') {
        // Solid Earthing: Low resistance copper ground wire shunts fault current
        groundCurrent = voltage / rEarth; // e.g. 230V / 2Ω = 115A
        touchVoltage = 2.0; // Shunted to safe low touch voltage (< 50V SELV limit)
        bodyCurrent = (touchVoltage / (rBody + rShoes)) * 1000; // in mA
        gprVolts = groundCurrent * rEarth; // GPR rises to line potential at rod center

        // IEEE 80 Step potential across 1.0m stride at workerDistance x
        const r0 = 0.5; // grounding hemisphere radius
        const vAtFeet1 = gprVolts * (r0 / (workerDistance + r0));
        const vAtFeet2 = gprVolts * (r0 / (workerDistance + 1.0 + r0));
        stepVoltage = Math.max(0, vAtFeet1 - vAtFeet2);
        stepCurrentMA = (stepVoltage / (rBody + 2 * rShoes)) * 1000;
      } else {
        // Broken Earthing (Severed PE conductor): Casing energized at full line potential!
        groundCurrent = 0; // No ground return current -> Breaker DOES NOT TRIP!
        touchVoltage = voltage; // Full line potential on metal shell
        bodyCurrent = (touchVoltage / rTotalBodyPath) * 1000; // in mA
        gprVolts = 0;
        stepVoltage = 0;
        stepCurrentMA = 0;
      }
    }

    const intensity = Math.min(bodyCurrent / 100, 1.0);
    const isPPESafe = ppeEnabled || (scenario === 'solid' && bodyCurrent < 1);

    return {
      rTotalBodyPath,
      bodyCurrent,
      groundCurrent,
      touchVoltage,
      gprVolts,
      stepVoltage,
      stepCurrentMA,
      intensity,
      isPPESafe
    };
  }, [faultActive, breakerTripped, scenario, ppeEnabled, voltage, workerDistance]);

  // Track active fault parameters for SafetyLessonModal analysis
  useEffect(() => {
    if (faultActive && !breakerTripped) {
      setHasSimulated(true);
      setLastActiveFaultData({
        currentMA: physics.bodyCurrent,
        durationMs: durationMs,
        voltage,
        isPPESafe: physics.isPPESafe,
        activePPENames: ppeEnabled ? ['Class 00 Rubber Gloves (500V)', 'Dielectric EH Boots (ASTM F2413)'] : []
      });
    }
  }, [faultActive, breakerTripped, physics.bodyCurrent, durationMs, voltage, physics.isPPESafe, ppeEnabled]);

  const prevFaultActive = useRef(faultActive);
  useEffect(() => {
    prevFaultActive.current = faultActive;
  }, [faultActive]);

  // IEC 60479-1 Shock Hazard Severity Analysis
  const shockAnalysis = useMemo(() => {
    const current = physics.bodyCurrent;
    
    if (breakerTripped) {
      return {
        level: 'safe',
        label: 'PROTECTIVE BREAKER TRIPPED (SAFE)',
        color: 'bg-emerald-950 border-2 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
        heartColor: '#10b981',
        heartRate: 1.2,
        desc: 'Upstream protective breaker detected high ground fault current and tripped in 30ms. Touch voltage cleared.'
      };
    }

    if (!faultActive) {
      return { 
        level: 'none', 
        label: 'SYSTEM STANDBY / INSULATION OK', 
        color: 'bg-slate-900 border-2 border-slate-700 text-slate-200 shadow-md', 
        heartColor: '#10b981', 
        heartRate: 1.2, 
        desc: 'System operating normally. Motor winding insulation intact. Metal casing safe to touch.' 
      };
    }

    if (current < 0.5) {
      return { 
        level: 'safe', 
        label: 'SOLID GROUND SHUNT PROTECTED', 
        color: 'bg-emerald-950 border-2 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)]', 
        heartColor: '#10b981', 
        heartRate: 1.2, 
        desc: 'Ground conductor shunts 99.9% of fault current to earth. Casing touch voltage shunted to <2V (Safe).' 
      };
    }

    if (ppeEnabled) {
      return { 
        level: 'insulated', 
        label: 'PPE PROTECTED (INSULATED)', 
        color: 'bg-emerald-950 border-2 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)]', 
        heartColor: '#10b981', 
        heartRate: 1.2, 
        desc: 'Leakage voltage active on casing, but Class 00 gloves & dielectric boots isolate body path 100%. Safe.' 
      };
    }

    if (current < 30) {
      return { 
        level: 'contraction', 
        label: 'LEVEL 2: MUSCLE TWITCHING / SHOCK', 
        color: 'bg-amber-950 border-2 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.4)]', 
        heartColor: '#f59e0b', 
        heartRate: 0.8, 
        desc: `Touch current of ${current.toFixed(1)} mA causes painful involuntary muscle spasms. Can release hold.` 
      };
    }

    if (current < 100) {
      return { 
        level: 'suffocation', 
        label: 'LEVEL 3: MUSCLE LOCK (CANNOT LET GO)', 
        color: 'bg-orange-950 border-2 border-orange-500 text-orange-100 font-bold shadow-[0_0_25px_rgba(249,115,22,0.5)]', 
        heartColor: '#f97316', 
        heartRate: 0.5, 
        desc: `Touch current of ${current.toFixed(1)} mA locks hand flexor muscles. Victim trapped on live casing. Chest spasms impede breathing.` 
      };
    }

    return { 
      level: 'fibrillation', 
      label: 'LEVEL 4: FATAL HEART ARREST (V-FIB)', 
      color: 'bg-red-950 border-2 border-red-500 text-white font-black animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.8)]', 
      heartColor: '#ef4444', 
      heartRate: 0.2, 
      desc: `Lethal current of ${current.toFixed(1)} mA passes through chest to earth. Ventricular fibrillation & heart stop within seconds.` 
    };
  }, [faultActive, breakerTripped, physics.bodyCurrent, ppeEnabled]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-3 bg-transparent text-slate-100 overflow-y-auto lg:overflow-hidden p-2 md:p-0 pb-20 lg:pb-0">
      
      {/* LEFT COLUMN: Controls, Settable Voltage Dropdown & Telemetry */}
      <div className="flex flex-col w-full lg:w-[360px] xl:w-[390px] shrink-0 h-auto lg:h-full overflow-y-auto order-1 lg:order-1 gap-3">
        
        {/* Core Controls Panel */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-black tracking-[0.2em] uppercase text-cyan-400 border-l-3 border-cyan-500 pl-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> Simulator Controls
            </h3>

            {/* Distinct Rose Reset Button */}
            <button
              type="button"
              onClick={handleResetSimulator}
              className="px-2.5 py-1 text-[11px] font-mono font-black rounded-lg bg-rose-950/80 hover:bg-rose-900/90 border border-rose-500/60 hover:border-rose-400 text-rose-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-md"
              title="Reset Earth Fault simulator parameters to baseline defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Synchronized Voltage Dropdown & Slider (IEC 60479-1 Voltage Levels) */}
            <div className="space-y-1.5 p-2.5 bg-slate-950 border border-cyan-500/50 rounded-xl shadow-md">
              <label className="flex justify-between items-center text-xs font-bold text-slate-200 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-cyan-400" /> Voltage (V_t)</span>
                <span className="text-cyan-300 font-black font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                  {voltage} V AC
                </span>
              </label>

              {/* High Contrast Voltage Select Dropdown */}
              <select
                value={dropdownValue}
                onChange={handleDropdownChange}
                className="w-full bg-slate-950 border border-cyan-500/60 hover:border-cyan-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 text-slate-100 text-xs font-mono font-bold rounded-xl px-3 py-2 cursor-pointer transition-colors"
              >
                {standardVoltages.map(v => (
                  <option key={v.value} value={v.value} className="bg-slate-950 text-slate-200 font-bold">
                    {v.label}
                  </option>
                ))}
                <option value="custom" className="bg-slate-950 text-cyan-400 font-bold">
                  Custom Voltage ({voltage}V)
                </option>
              </select>

              {/* Synchronized Slider Range Input */}
              <input
                type="range"
                min="50"
                max={maxVoltageLimit}
                step="10"
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer mt-1"
              />
            </div>

            {/* Earthing System Toggle */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                1. Protective Earthing System
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setScenario('solid')}
                  className={cn(
                    "py-2 px-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border", 
                    scenario === 'solid' 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  )}
                >
                  🟢 Solid Earth (TN-S/TT)
                </button>
                <button
                  type="button"
                  onClick={() => setScenario('broken')}
                  className={cn(
                    "py-2 px-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border", 
                    scenario === 'broken' 
                      ? 'bg-red-950 text-rose-200 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  )}
                >
                  🔴 Broken Earth (PE Severed)
                </button>
              </div>
            </div>

            {/* PPE Toggle */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                2. Wear Safety Gear (PPE)
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPpeEnabled(false)}
                  className={cn(
                    "py-2 px-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border", 
                    !ppeEnabled 
                      ? 'bg-red-950 text-rose-200 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  )}
                >
                  ⚠️ Unprotected (No PPE)
                </button>
                <button
                  type="button"
                  onClick={() => setPpeEnabled(true)}
                  className={cn(
                    "py-2 px-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border", 
                    ppeEnabled 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  )}
                >
                  🛡️ Gloves & EH Boots
                </button>
              </div>
            </div>
          </div>

          {/* Fault Trigger Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setFaultActive(!faultActive)}
              className={cn(
                "w-full py-3.5 px-4 font-black text-xs sm:text-sm uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 select-none border-2 cursor-pointer shadow-xl active:scale-95",
                faultActive
                  ? "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-900"
                  : "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-slate-950 border-amber-300 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)]"
              )}
            >
              <Zap className={cn("w-5 h-5 fill-current", faultActive && "animate-bounce text-orange-400")} />
              <span>{faultActive ? "CLEAR FAULT / RESET" : "⚡ TRIGGER INSULATION FAULT"}</span>
            </button>
          </div>

          {/* EMBEDDED DEBRIEF & LEARNINGS CARD */}
          <DebriefTriggerCard
            onOpen={() => setShowSafetyLesson(true)}
            hasSimulated={hasSimulated}
            isSimulating={faultActive}
            variant="embedded"
          />
        </div>

        {/* Live Diagnostics Telemetry Cards */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col gap-2.5">
          <h3 className="text-xs font-black tracking-[0.2em] uppercase text-cyan-400 border-l-3 border-cyan-500 pl-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Live Telemetry & Gauges
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-center flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Touch Voltage</span>
              <div className="text-base sm:text-lg font-black font-mono text-white">
                {physics.touchVoltage.toFixed(0)} <span className="text-xs font-normal text-slate-400">V</span>
              </div>
            </div>

            <div className="p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-center flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Body Current</span>
              <div className={cn(
                "text-base sm:text-lg font-black font-mono",
                physics.bodyCurrent >= 30 ? "text-red-400" : physics.bodyCurrent > 0 ? "text-amber-300" : "text-emerald-400"
              )}>
                {physics.bodyCurrent.toFixed(1)} <span className="text-xs font-normal text-slate-400">mA</span>
              </div>
            </div>

            <div className="p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-center flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Breaker Status</span>
              <div className={cn(
                "text-xs font-black uppercase font-mono truncate",
                breakerTripped ? "text-emerald-400" : faultActive ? "text-red-400 animate-pulse" : "text-slate-400"
              )}>
                {breakerTripped ? "TRIPPED (SAFE)" : faultActive ? "LIVE (CLOSED)" : "NORMAL"}
              </div>
            </div>
          </div>
        </div>

        {/* Visual GPR & Step/Touch Telemetry Matrix (No Long Paragraphs) */}
        <div className={cn("p-2.5 rounded-2xl border flex flex-col gap-1.5 transition-all shadow-xl", shockAnalysis.color)}>
          <div className="flex items-center justify-between border-b border-white/10 pb-1">
            <span className="text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {shockAnalysis.label}
            </span>
            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 border border-white/20">
              {voltage}V AC Grid
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 pt-0.5 font-mono text-[10px]">
            <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 flex flex-col">
              <span className="text-[8px] text-slate-400 font-bold uppercase">Touch Vector (E_touch)</span>
              <span className={cn("text-xs font-black", physics.touchVoltage > 50 ? "text-red-400" : "text-emerald-400")}>
                {physics.touchVoltage.toFixed(0)} V
              </span>
              <span className="text-[7.5px] text-slate-400">Path: Enclosure to Foot</span>
            </div>

            <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 flex flex-col">
              <span className="text-[8px] text-slate-400 font-bold uppercase">Step Vector (E_step 1m)</span>
              <span className={cn("text-xs font-black", physics.stepVoltage > 50 ? "text-amber-400" : "text-emerald-400")}>
                {physics.stepVoltage.toFixed(1)} V
              </span>
              <span className="text-[7.5px] text-slate-400">At X = {workerDistance.toFixed(1)}m from rod</span>
            </div>

            <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 flex flex-col">
              <span className="text-[8px] text-slate-400 font-bold uppercase">Ground Fault Current</span>
              <span className="text-xs font-black text-cyan-300">{physics.groundCurrent.toFixed(0)} A</span>
              <span className="text-[7.5px] text-slate-400">Shunted through R_E 2.0Ω</span>
            </div>

            <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 flex flex-col">
              <span className="text-[8px] text-slate-400 font-bold uppercase">Ground Potential Rise</span>
              <span className="text-xs font-black text-amber-300">{physics.gprVolts.toFixed(0)} V</span>
              <span className="text-[7.5px] text-slate-400">Peak GPR at Soil Center</span>
            </div>
          </div>
        </div>

      </div>

      {/* CENTER COLUMN: Human Body Twin Component (Shows All Probable Effects) */}
      <div className="w-full lg:w-[460px] xl:w-[500px] shrink-0 flex flex-col gap-2 h-[45vh] lg:h-full overflow-hidden order-2 lg:order-2 relative z-10 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 lg:border-b-0 shadow-xl">
        <div className="flex-1 min-h-0 w-full relative border border-slate-800 rounded-2xl bg-slate-950 shadow-inner overflow-hidden flex flex-col">
          <HumanBodyTwin 
            shockPath="hand-to-foot" 
            intensity={physics.intensity}
            currentMA={physics.bodyCurrent}
            durationMs={durationMs} 
            isAnimating={faultActive && !breakerTripped} 
            profile={config?.profile}
            isPPESafe={physics.isPPESafe}
            activePPENames={ppeEnabled ? ['Class 00 Rubber Gloves (500V)', 'Dielectric EH Boots (ASTM F2413)'] : []}
          />
        </div>
      </div>

      {/* RIGHT COLUMN: Substation Schematic Visual Canvas */}
      <div className="flex-1 min-w-[280px] w-full h-[350px] sm:h-[400px] lg:h-full order-3 lg:order-3 bg-slate-950 border-2 border-slate-800 lg:rounded-2xl overflow-hidden flex flex-col relative shadow-2xl">
        {renderProfessionalSubstationVisual()}
      </div>

      {/* Hazard Color Overlay Alert Banner */}
      <HazardOverlay 
        isActive={faultActive && !breakerTripped && !ppeEnabled && scenario === 'broken'}
        hazardType="earth_fault"
        dangerLevel={physics.bodyCurrent > 100 ? "critical" : "warning"}
        magnitude={`${physics.bodyCurrent.toFixed(0)} mA Touch Current`}
      />

      {/* Post-Shock Hazard Analysis Card (Same Size & Layout as AC/DC Simulators) */}
      <SafetyLessonModal
        isOpen={showSafetyLesson}
        onClose={() => setShowSafetyLesson(false)}
        currentMA={lastActiveFaultData.currentMA}
        durationMs={lastActiveFaultData.durationMs}
        skinCondition="dry"
        path="hand-to-foot"
        voltage={lastActiveFaultData.voltage}
        isPPESafe={lastActiveFaultData.isPPESafe}
        equippedPPENames={lastActiveFaultData.activePPENames}
        hazardType="ac"
      />

    </div>
  );

  // High-Fidelity Professional Interactive Visual Canvas Renderer
  function renderProfessionalSubstationVisual() {
    const isCasingCharged = faultActive && !breakerTripped && scenario === 'broken';
    const isFaultActive = faultActive && !breakerTripped;
    const isSolidEarth = scenario === 'solid';

    // Worker dynamic screen coordinates (rod center at X=260, ground surface at Y=270)
    const rodX = 260;
    const groundY = 270;
    const workerX = Math.min(440, Math.max(rodX + 35, rodX + Math.round(workerDistance * 24)));
    const stepSpanPx = 22; // 1.0m human stride scale

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden bg-[radial-gradient(ellipse_at_top,#0f172a,#020617)] select-none">
        {/* Substation Grid Medical Scan Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:35px_35px] opacity-[0.04] pointer-events-none"></div>

        {/* Top Telemetry Header Overlay Badge */}
        <div className="w-full p-2 z-30 flex flex-wrap items-center justify-between gap-1.5 shrink-0 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn(
              "px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider rounded-lg border shadow-md flex items-center gap-1.5 truncate",
              breakerTripped
                ? "bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : isCasingCharged
                  ? "bg-red-950 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse"
                  : isFaultActive && isSolidEarth
                    ? "bg-emerald-950 border-emerald-400 text-emerald-300"
                    : "bg-slate-900/90 border-slate-700 text-slate-300"
            )}>
              {breakerTripped ? "🟢 BREAKER TRIPPED (350ms)" : isCasingCharged ? `🚨 CASING CHARGED: ${voltage}V` : isFaultActive ? "⚡ GPR SURGE ACTIVE" : "⚡ NORMAL STANDBY"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9.5px] font-mono font-black text-cyan-300 bg-slate-900 border border-slate-700 rounded-md">
              GPR: {physics.gprVolts.toFixed(0)}V
            </span>
            <span className="px-2 py-0.5 text-[9.5px] font-mono font-black text-amber-300 bg-slate-900 border border-slate-700 rounded-md">
              ΔV_step: {physics.stepVoltage.toFixed(1)}V
            </span>
          </div>
        </div>

        {/* Main Interactive High-Fidelity SVG Diagram */}
        <div className="relative flex-1 w-full min-h-0 flex items-center justify-center p-1">
          <svg viewBox="0 0 500 370" className="w-full h-full drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-visible">
            <defs>
              <radialGradient id="gprGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="dangerAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
                <stop offset="70%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>

              {/* Equipotential Soil Shell Gradient */}
              <radialGradient id="soilShellGrad" cx="50%" cy="0%" r="90%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={isFaultActive && isSolidEarth ? 0.35 : 0.08} />
                <stop offset="40%" stopColor="#0284c7" stopOpacity={isFaultActive && isSolidEarth ? 0.25 : 0.04} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Ground Soil Sub-Surface Layer */}
            <rect x="0" y={groundY} width="500" height="100" fill="#060911" stroke="#1e293b" strokeWidth="2" />
            <line x1="0" y1={groundY} x2="500" y2={groundY} stroke="#334155" strokeWidth="3" />
            <text x="15" y={groundY + 16} fill="#475569" fontSize="9" fontWeight="bold" fontFamily="monospace">
              SOIL MATRIX (R_E = 2.0Ω · ρ = 100Ω·m)
            </text>

            {/* ==================================================================== */}
            {/* 3D HEMISPHERICAL VOLTAGE DECAY SHELLS V(x) = (ρ·If)/(2πx)            */}
            {/* ==================================================================== */}
            <g transform={`translate(${rodX}, ${groundY})`}>
              {/* Shell 4: 15% GPR Contours */}
              <ellipse cx="0" cy="0" rx="170" ry="75" fill="none" stroke="#0284c7" strokeWidth="1.2" strokeDasharray="6 4" opacity={isFaultActive && isSolidEarth ? 0.7 : 0.2} />
              {isFaultActive && isSolidEarth && (
                <text x="145" y="32" fill="#38bdf8" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                  {(physics.gprVolts * 0.15).toFixed(0)}V (15%)
                </text>
              )}

              {/* Shell 3: 35% GPR Contours */}
              <ellipse cx="0" cy="0" rx="120" ry="54" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5 3" opacity={isFaultActive && isSolidEarth ? 0.8 : 0.25} />
              {isFaultActive && isSolidEarth && (
                <text x="100" y="24" fill="#38bdf8" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                  {(physics.gprVolts * 0.35).toFixed(0)}V (35%)
                </text>
              )}

              {/* Shell 2: 60% GPR Contours */}
              <ellipse cx="0" cy="0" rx="75" ry="34" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="4 2" opacity={isFaultActive && isSolidEarth ? 0.9 : 0.3} />
              {isFaultActive && isSolidEarth && (
                <text x="62" y="16" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  {(physics.gprVolts * 0.60).toFixed(0)}V (60%)
                </text>
              )}

              {/* Shell 1: 90% Core GPR Contours */}
              <ellipse cx="0" cy="0" rx="35" ry="16" fill="url(#soilShellGrad)" stroke="#ef4444" strokeWidth="2" opacity={isFaultActive && isSolidEarth ? 1.0 : 0.4} />
              {isFaultActive && isSolidEarth && (
                <text x="30" y="10" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  {(physics.gprVolts * 0.90).toFixed(0)}V (90%)
                </text>
              )}

              {/* Animated Voltage Wave Ripple when Fault Active */}
              {isFaultActive && isSolidEarth && (
                <g>
                  <motion.ellipse
                    cx="0" cy="0"
                    rx="15" ry="8"
                    fill="none" stroke="#38bdf8" strokeWidth="2.5"
                    animate={{ rx: [20, 160], ry: [10, 72], opacity: [0.9, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.ellipse
                    cx="0" cy="0"
                    rx="15" ry="8"
                    fill="none" stroke="#f59e0b" strokeWidth="2"
                    animate={{ rx: [20, 160], ry: [10, 72], opacity: [0.9, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.5, ease: 'easeOut' }}
                  />
                </g>
              )}
            </g>

            {/* 1. POWER GRID SOURCE BUSBAR */}
            <g transform="translate(35, 30)">
              <rect x="0" y="0" width="430" height="12" rx="4" fill="#f59e0b" className="drop-shadow-[0_0_10px_#f59e0b]" />
              <text x="215" y="-6" textAnchor="middle" fill="#f59e0b" fontSize="10.5" fontWeight="black" fontFamily="monospace">
                HIGH VOLTAGE POWER GRID FEEDER ({voltage}V AC)
              </text>
            </g>

            {/* Feeder Connection Wire down to Breaker */}
            <line x1="100" y1="42" x2="100" y2="70" stroke={breakerTripped ? "#475569" : "#f59e0b"} strokeWidth="4" />

            {/* 2. PROTECTIVE CIRCUIT BREAKER (PANEL ENCLOSURE) */}
            <g transform="translate(70, 70)">
              <rect x="0" y="0" width="60" height="46" rx="6" fill="#0f172a" stroke={breakerTripped ? "#10b981" : "#ef4444"} strokeWidth="2" className="shadow-2xl" />
              <text x="30" y="13" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="black" fontFamily="monospace">BREAKER</text>
              
              <circle cx="30" cy="22" r="2.5" fill="#cbd5e1" />
              <circle cx="30" cy="36" r="2.5" fill="#cbd5e1" />

              {breakerTripped ? (
                <line x1="30" y1="22" x2="14" y2="32" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
              ) : (
                <line x1="30" y1="22" x2="30" y2="36" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              )}
              
              <text x="30" y="43" textAnchor="middle" fill={breakerTripped ? "#10b981" : "#ef4444"} fontSize="7" fontWeight="bold" fontFamily="monospace">
                {breakerTripped ? "OPEN" : "CLOSED"}
              </text>
            </g>

            {/* Feeder Wire from Breaker to Motor */}
            <line x1="100" y1="116" x2="100" y2="165" stroke={breakerTripped ? "#475569" : "#f59e0b"} strokeWidth="4" />

            {/* 3. INDUSTRIAL MOTOR APPARATUS ENCLOSURE */}
            <g transform="translate(45, 165)">
              <rect 
                x="0" y="0" width="110" height="80" rx="10" 
                fill="#1e293b" 
                stroke={isCasingCharged ? "#ef4444" : isFaultActive && isSolidEarth ? "#38bdf8" : "#475569"} 
                strokeWidth="3" 
                className={cn("transition-colors duration-300 shadow-2xl", isCasingCharged && "animate-pulse")}
                style={{ filter: isCasingCharged ? "drop-shadow(0 0 22px #ef4444)" : undefined }}
              />
              
              <line x1="12" y1="12" x2="12" y2="68" stroke="#334155" strokeWidth="2.5" />
              <line x1="20" y1="12" x2="20" y2="68" stroke="#334155" strokeWidth="2.5" />
              <line x1="28" y1="12" x2="28" y2="68" stroke="#334155" strokeWidth="2.5" />
              
              <circle cx="70" cy="40" r="22" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
              <path d="M56,40 Q70,24 84,40 T110,40" fill="none" stroke="#f59e0b" strokeWidth="2" />
              <text x="70" y="44" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontWeight="black" fontFamily="monospace">MOTOR</text>
              <text x="55" y="-6" fill="#94a3b8" fontSize="9" fontWeight="black" fontFamily="monospace">APPARATUS ENCLOSURE</text>

              {/* Insulation Fault Spark Arc Inside Motor */}
              {isFaultActive && (
                <motion.g animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.08, repeat: Infinity }}>
                  <path d="M70,28 L88,14 L82,18 L105,0" fill="none" stroke="#fbbf24" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px #fbbf24)' }} />
                  <circle cx="105" cy="0" r="4" fill="#ff0000" className="animate-ping" />
                </motion.g>
              )}
            </g>

            {/* 4. GROUNDING PE CONDUCTOR & GROUND ROD */}
            <g transform="translate(155, 205)">
              <line 
                x1="0" y1="0" x2="105" y2="0" 
                stroke={isSolidEarth ? "#10b981" : "#ef4444"} 
                strokeWidth="3.5" 
                strokeDasharray={isSolidEarth ? "none" : "4 4"}
              />
              
              <text x="52" y="-7" textAnchor="middle" fill={isSolidEarth ? "#10b981" : "#ef4444"} fontSize="8" fontWeight="black" fontFamily="monospace">
                {isSolidEarth ? "PE BOND CONDUCTOR" : "❌ SEVERED PE"}
              </text>

              <g transform="translate(105, 0)">
                <line x1="0" y1="0" x2="0" y2="65" stroke={isSolidEarth ? "#10b981" : "#ef4444"} strokeWidth="4" />
                
                <line x1="-12" y1="45" x2="12" y2="45" stroke={isSolidEarth ? "#10b981" : "#ef4444"} strokeWidth="2.5" />
                <line x1="-8" y1="52" x2="8" y2="52" stroke={isSolidEarth ? "#10b981" : "#ef4444"} strokeWidth="2" />
                <line x1="-4" y1="58" x2="4" y2="58" stroke={isSolidEarth ? "#10b981" : "#ef4444"} strokeWidth="1.5" />

                {isFaultActive && isSolidEarth && (
                  <text x="0" y="80" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    {physics.groundCurrent.toFixed(0)}A FAULT SURGE
                  </text>
                )}
              </g>
            </g>

            {/* ==================================================================== */}
            {/* 5. WORKER DIGITAL TWIN, STEP-SPAN VECTOR & TOUCH VECTOR              */}
            {/* ==================================================================== */}
            <g transform={`translate(${workerX}, ${groundY - 120})`}>
              {isCasingCharged && !ppeEnabled && (
                <circle cx="20" cy="65" r="60" fill="url(#dangerAura)" />
              )}

              {/* Operator Body Silhouette */}
              <path 
                d="M16 16 C16 8, 24 8, 24 16 C24 24, 22 28, 20 32 C28 34, 36 36, 36 44 L40 80 L32 80 L28 46 L26 88 C26 96, 30 108, 30 120 L24 120 L21 86 C21 100, 16 120, 16 120 L10 120 C10 100, 15 86, 15 86 L14 46 L2 34 C-1 30, 2 28, 4 28 L14 40 Z" 
                fill={ppeEnabled ? "#10b981" : isCasingCharged ? "#ef4444" : "#cbd5e1"} 
                stroke={ppeEnabled ? "#34d399" : isCasingCharged ? "#f87171" : "#475569"} 
                strokeWidth="2"
                className="transition-colors duration-300"
                style={{ filter: isCasingCharged && !ppeEnabled ? "drop-shadow(0 0 16px #ef4444)" : undefined }}
              />

              <text x="20" y="2" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontWeight="black" fontFamily="monospace">
                OPERATOR ({workerDistance.toFixed(1)}m)
              </text>

              {/* Heart Pulse Icon */}
              <g transform="translate(20, 34)">
                <motion.path 
                  d="M10 4 C8 1, 5 1, 3 3 C1 5, 1 8, 5 11 L10 16 L15 11 C19 8, 19 5, 17 3 C15 1, 12 1, 10 4 Z" 
                  fill={shockAnalysis.heartColor}
                  animate={isCasingCharged && !ppeEnabled ? { scale: [1, 1.4, 0.9, 1.2, 1] } : { scale: [1, 1.1, 1] }}
                  transition={isCasingCharged && !ppeEnabled 
                    ? { duration: shockAnalysis.heartRate, repeat: Infinity } 
                    : { duration: 1.5, repeat: Infinity }
                  }
                  style={{ originX: '10px', originY: '10px' }}
                />
              </g>

              {/* Touch Potential Connection Line (Motor Casing to Hand) */}
              <line 
                x1="2" y1="34" 
                x2={155 - workerX} y2={205 - (groundY - 120)} 
                stroke={isCasingCharged && !ppeEnabled ? "#ef4444" : ppeEnabled ? "#10b981" : "#64748b"} 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeDasharray={isCasingCharged ? "none" : "3 3"}
              />

              {/* 1.0m Human Step Stride Dimension Vector */}
              <g transform="translate(0, 120)">
                {/* Left foot to Right foot dimension span */}
                <line x1="10" y1="0" x2="30" y2="0" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
                <line x1="10" y1="-4" x2="10" y2="4" stroke="#f59e0b" strokeWidth="2" />
                <line x1="30" y1="-4" x2="30" y2="4" stroke="#f59e0b" strokeWidth="2" />
                <text x="20" y="12" textAnchor="middle" fill="#f59e0b" fontSize="7.5" fontWeight="black" fontFamily="monospace">
                  1.0m STEP: {physics.stepVoltage.toFixed(1)}V
                </text>
              </g>

              {/* Touch Current Spark */}
              {isCasingCharged && !ppeEnabled && (
                <circle cx="2" cy="34" r="5" fill="#ff0000" className="animate-ping" />
              )}
            </g>
          </svg>
        </div>

        {/* Bottom Interactive Step Distance Slider & Topology Footer */}
        <div className="w-full p-2 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 z-30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Worker Position:
            </span>
            <input 
              type="range"
              min="1.0"
              max="6.0"
              step="0.5"
              value={workerDistance}
              onChange={(e) => setWorkerDistance(Number(e.target.value))}
              className="w-24 sm:w-32 accent-amber-500 cursor-pointer h-1.5"
              title="Drag worker closer or farther from ground rod to observe Step Potential decay"
            />
            <span className="text-[10px] font-mono font-black text-amber-300">
              {workerDistance.toFixed(1)}m from rod
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[9px]">
            <span className="text-slate-400">Topology:</span>
            <span className="font-bold text-slate-200">
              {scenario === 'solid' ? 'TN-S/TT Bonded (R=2Ω)' : 'Broken PE (Floating Enclosure)'}
            </span>
          </div>
        </div>
      </div>
    );
  }
}
