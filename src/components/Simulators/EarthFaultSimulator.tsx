import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Zap, AlertTriangle, ShieldCheck, ShieldAlert, Activity, 
  Info, Sliders, Settings, RotateCcw, Shield, CheckCircle2, Flame, HeartPulse, Gauge
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { HazardOverlay } from '../HazardOverlay';

export function EarthFaultSimulator({ config }: { config?: UserConfig }) {
  // Simulator State
  const [scenario, setScenario] = useState<'solid' | 'broken'>('solid');
  const [ppeEnabled, setPpeEnabled] = useState<boolean>(false);
  const [faultActive, setFaultActive] = useState<boolean>(false);
  const [breakerTripped, setBreakerTripped] = useState<boolean>(false);

  const isIndustrial = config?.environment === 'industrial';
  const systemVoltage = isIndustrial ? 415 : 230;

  // Upstream protective breaker trip simulation on Solid Ground Fault
  useEffect(() => {
    if (faultActive && scenario === 'solid') {
      const timeout = setTimeout(() => {
        setBreakerTripped(true);
      }, 350); // Trips in 350ms to demonstrate transient shunting & breaker trip
      return () => clearTimeout(timeout);
    }
  }, [faultActive, scenario]);

  // Reset breaker when fault is cleared or scenario changed
  useEffect(() => {
    if (!faultActive) {
      setBreakerTripped(false);
    }
  }, [faultActive, scenario]);

  const handleResetSimulator = () => {
    setFaultActive(false);
    setBreakerTripped(false);
    setScenario('solid');
    setPpeEnabled(false);
  };

  // ----------------------------------------------------
  // PHYSICS ENGINE CALCULATIONS (APPROVED IEC 60479-1 / IEEE 80 STANDARDS)
  // ----------------------------------------------------
  const physics = useMemo(() => {
    // Standard human body resistance for touch path (IEC 60479-1 Clause 4)
    const rBody = 1000; // Ohms
    
    // PPE Isolation resistances
    const rShoes = ppeEnabled ? 1000000 : 1500; // 1MΩ dielectric boots vs 1.5kΩ standard
    const rGloves = ppeEnabled ? 1000000 : 0; // 1MΩ rubber gloves vs 0Ω bare skin
    const rTotalBodyPath = rBody + rShoes + rGloves;

    // Ground electrode resistance
    const rEarth = 2.0; // Ohms (Standard grounding rod resistance)

    let bodyCurrent = 0; // mA
    let groundCurrent = 0; // A
    let touchVoltage = 0; // V

    if (faultActive && !breakerTripped) {
      if (scenario === 'solid') {
        // Solid Earthing: Low resistance copper ground wire shunts fault current
        groundCurrent = systemVoltage / rEarth; // e.g. 230V / 2Ω = 115A
        touchVoltage = 2.0; // Shunted to safe low touch voltage (< 50V SELV limit)
        bodyCurrent = (touchVoltage / (rBody + rShoes)) * 1000; // in mA
      } else {
        // Broken Earthing (Severed PE conductor): Casing energized at full line potential!
        groundCurrent = 0; // No ground return current -> Breaker DOES NOT TRIP!
        touchVoltage = systemVoltage; // Full 230V / 415V line potential on metal shell
        bodyCurrent = (touchVoltage / rTotalBodyPath) * 1000; // in mA
      }
    }

    return {
      rTotalBodyPath,
      bodyCurrent,
      groundCurrent,
      touchVoltage
    };
  }, [faultActive, breakerTripped, scenario, ppeEnabled, systemVoltage]);

  // IEC 60479-1 Shock Hazard Severity & Trauma Analysis
  const shockAnalysis = useMemo(() => {
    const current = physics.bodyCurrent;
    
    if (breakerTripped) {
      return {
        level: 'safe',
        label: 'PROTECTIVE BREAKER TRIPPED (SAFE)',
        color: 'bg-emerald-950 border-2 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
        heartColor: '#10b981',
        heartRate: 1.2,
        desc: 'Upstream protective breaker detected high ground fault current (115A) and tripped in 30ms. Touch voltage cleared.'
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
      
      {/* LEFT COLUMN: Controls, Telemetry Dials, and Educational Safety Lessons */}
      <div className="flex flex-col w-full lg:w-[380px] xl:w-[420px] shrink-0 h-auto lg:h-full overflow-y-auto order-1 lg:order-1 gap-3">
        
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

        {/* Hazard Assessment Report Box */}
        <div className={cn("p-4 rounded-2xl border flex flex-col gap-2 transition-all shadow-xl", shockAnalysis.color)}>
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {shockAnalysis.label}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/40 border border-white/20">
              {systemVoltage}V AC Grid
            </span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed font-bold">
            {shockAnalysis.desc}
          </p>
        </div>

        {/* Grounding Safety Rulebook */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-2.5">
          <h3 className="text-xs font-black tracking-wider uppercase text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            📖 Standard Protective Earthing Principles (IEC 60479-1)
          </h3>
          <div className="space-y-2 text-xs leading-relaxed text-slate-300 font-medium">
            <p>
              <strong className="text-emerald-400 block font-bold">1. How Solid Earthing Protects Human Life:</strong>
              Low-resistance copper ground wire (2 Ω) provides a path back to neutral. When winding insulation fails, a massive ground fault current (115A) flows to earth. This instantly trips the upstream circuit breaker in ≤ 30ms, clearing line voltage before human contact occurs!
            </p>
            <p>
              <strong className="text-rose-400 block font-bold">2. Why Broken Earthing is Deadly:</strong>
              If the protective earth conductor (PE) is severed, no ground current flows. The circuit breaker <strong className="text-red-400">DOES NOT TRIP</strong>. The metal enclosure remains energized at full grid voltage (230V). Touching the shell sends touch current (230mA) directly through the heart!
            </p>
            <p>
              <strong className="text-cyan-400 block font-bold">3. Role of Rated Insulating PPE:</strong>
              Dielectric boots & rubber gloves add 1,000,000 Ω resistance in series, blocking dangerous touch current down to safe microampere levels (less than 0.1 mA).
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Balanced Professional Visual Canvas at Original Position */}
      <div className="flex-1 min-w-[300px] w-full h-[380px] sm:h-[450px] lg:h-full order-2 lg:order-2 bg-slate-950 border-2 border-slate-800 lg:rounded-2xl overflow-hidden flex flex-col relative shadow-2xl">
        {renderProfessionalSubstationVisual()}
      </div>

      {/* Hazard Color Overlay Alert Banner */}
      <HazardOverlay 
        isActive={faultActive && !breakerTripped && !ppeEnabled && scenario === 'broken'}
        hazardType="earth_fault"
        dangerLevel={physics.bodyCurrent > 100 ? "critical" : "warning"}
        magnitude={`${physics.bodyCurrent.toFixed(0)} mA Touch Current`}
      />

    </div>
  );

  // High-Fidelity Professional Interactive Visual Canvas Renderer
  function renderProfessionalSubstationVisual() {
    const isCasingCharged = faultActive && !breakerTripped && scenario === 'broken';
    const isFaultActive = faultActive && !breakerTripped;
    const isSolidEarth = scenario === 'solid';

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,#0f172a,#020617)]">
        {/* Substation Grid Medical Scan Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:35px_35px] opacity-[0.04]"></div>

        {/* Top Telemetry Header Overlay Badge */}
        <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-3 py-1 text-xs font-mono font-black uppercase tracking-wider rounded-xl border-2 shadow-lg flex items-center gap-1.5",
              breakerTripped
                ? "bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                : isCasingCharged
                  ? "bg-red-950 border-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse"
                  : isFaultActive && isSolidEarth
                    ? "bg-emerald-950 border-emerald-400 text-emerald-300"
                    : "bg-slate-900/90 border-slate-700 text-slate-300"
            )}>
              {breakerTripped ? "🟢 BREAKER TRIPPED SAFELY" : isCasingCharged ? "🚨 ENCLOSURE CHARGED: 230V TOUCH HAZARD" : isFaultActive ? "⚡ FAULT ACTIVE: SOLID EARTH SHUNTING" : "⚡ SYSTEM NORMAL: INSULATION OK"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono font-black text-cyan-300 bg-slate-900/90 border border-slate-700 rounded-xl shadow-md">
              GRID: {systemVoltage}V AC
            </span>
          </div>
        </div>

        {/* Main Interactive High-Fidelity SVG Diagram */}
        <div className="relative w-full h-full flex items-center justify-center p-3">
          <svg viewBox="0 0 500 380" className="w-full h-full drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]">
            <defs>
              <radialGradient id="gprGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="dangerAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
                <stop offset="70%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Ground Soil Sub-Surface Layer */}
            <rect x="0" y="270" width="500" height="110" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
            <line x1="0" y1="270" x2="500" y2="270" stroke="#334155" strokeWidth="3" />
            <text x="20" y="285" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="monospace">SOIL / GROUND EARTH MATRIX (R_EARTH = 2.0 Ω)</text>

            {/* 1. POWER GRID SOURCE BUSBAR */}
            <g transform="translate(40, 40)">
              <rect x="0" y="0" width="420" height="12" rx="4" fill="#f59e0b" className="drop-shadow-[0_0_10px_#f59e0b]" />
              <text x="210" y="-8" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="black" fontFamily="monospace">
                HIGH VOLTAGE POWER GRID SUPPLY LINE ({systemVoltage}V AC)
              </text>
            </g>

            {/* Feeder Connection Wire down to Breaker */}
            <line x1="120" y1="52" x2="120" y2="85" stroke={breakerTripped ? "#475569" : "#f59e0b"} strokeWidth="4" />

            {/* 2. PROTECTIVE CIRCUIT BREAKER (PANEL ENCLOSURE) */}
            <g transform="translate(85, 85)">
              <rect x="0" y="0" width="70" height="50" rx="8" fill="#0f172a" stroke={breakerTripped ? "#10b981" : "#ef4444"} strokeWidth="2.5" className="shadow-2xl" />
              <text x="35" y="15" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="black" fontFamily="monospace">CIRCUIT BREAKER</text>
              
              {/* Breaker Contacts */}
              <circle cx="35" cy="24" r="3" fill="#cbd5e1" />
              <circle cx="35" cy="40" r="3" fill="#cbd5e1" />

              {/* Breaker Switch Arm Animation */}
              {breakerTripped ? (
                <line x1="35" y1="24" x2="15" y2="35" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />
              ) : (
                <line x1="35" y1="24" x2="35" y2="40" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
              )}
              
              <text x="35" y="47" textAnchor="middle" fill={breakerTripped ? "#10b981" : "#ef4444"} fontSize="7" fontWeight="bold" fontFamily="monospace">
                {breakerTripped ? "TRIPPED" : "CLOSED"}
              </text>
            </g>

            {/* Feeder Wire from Breaker to Motor */}
            <line x1="120" y1="135" x2="120" y2="185" stroke={breakerTripped ? "#475569" : "#f59e0b"} strokeWidth="4" />

            {/* 3. INDUSTRIAL MOTOR APPARATUS ENCLOSURE */}
            <g transform="translate(60, 185)">
              <rect 
                x="0" y="0" width="120" height="85" rx="12" 
                fill="#1e293b" 
                stroke={isCasingCharged ? "#ef4444" : isFaultActive && isSolidEarth ? "#38bdf8" : "#475569"} 
                strokeWidth="3.5" 
                className={cn("transition-colors duration-300 shadow-2xl", isCasingCharged && "animate-pulse")}
                style={{ filter: isCasingCharged ? "drop-shadow(0 0 25px #ef4444)" : undefined }}
              />
              
              {/* Motor Cooling Fins */}
              <line x1="15" y1="15" x2="15" y2="70" stroke="#334155" strokeWidth="3" />
              <line x1="25" y1="15" x2="25" y2="70" stroke="#334155" strokeWidth="3" />
              <line x1="35" y1="15" x2="35" y2="70" stroke="#334155" strokeWidth="3" />
              
              {/* Stator Winding Graphic */}
              <circle cx="75" cy="42" r="24" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
              <path d="M60,42 Q75,25 90,42 T120,42" fill="none" stroke="#f59e0b" strokeWidth="2" />
              <text x="75" y="46" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="black" fontFamily="monospace">STATOR WINDING</text>
              <text x="60" y="-8" fill="#94a3b8" fontSize="10" fontWeight="black" fontFamily="monospace">3-PHASE MOTOR APPARATUS</text>

              {/* Insulation Fault Spark Arc Inside Motor */}
              {isFaultActive && (
                <motion.g animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.08, repeat: Infinity }}>
                  <path d="M75,30 L95,15 L88,18 L115,0" fill="none" stroke="#fbbf24" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px #fbbf24)' }} />
                  <circle cx="115" cy="0" r="4" fill="#ff0000" className="animate-ping" />
                </motion.g>
              )}
            </g>

            {/* 4. GROUNDING PE CONDUCTOR & GROUND ROD */}
            <g transform="translate(180, 227)">
              <line 
                x1="0" y1="0" x2="80" y2="0" 
                stroke={isSolidEarth ? "#10b981" : "#ef4444"} 
                strokeWidth="4" 
                strokeDasharray={isSolidEarth ? "none" : "4 4"}
              />
              
              <text x="40" y="-8" textAnchor="middle" fill={isSolidEarth ? "#10b981" : "#ef4444"} fontSize="9" fontWeight="black" fontFamily="monospace">
                {isSolidEarth ? "PE GROUND CONDUCTOR (2.0 Ω)" : "❌ SEVERED BROKEN PE WIRE"}
              </text>

              <g transform="translate(80, 0)">
                <line x1="0" y1="0" x2="0" y2="70" stroke={isSolidEarth ? "#10b981" : "#ef4444"} strokeWidth="4" />
                
                <line x1="-15" y1="45" x2="15" y2="45" stroke={isSolidEarth ? "#10b981" : "#ef4444"} strokeWidth="3" />
                <line x1="-10" y1="53" x2="10" y2="53" stroke={isSolidEarth ? "#10b981" : "#ef4444"} strokeWidth="2.5" />
                <line x1="-5" y1="61" x2="5" y2="61" stroke={isSolidEarth ? "#10b981" : "#ef4444"} strokeWidth="2" />

                {isFaultActive && isSolidEarth && (
                  <g>
                    <circle cx="0" cy="45" r="45" fill="url(#gprGlow)" className="animate-pulse" />
                    <motion.circle 
                      cx="0" cy="45" r="25" fill="none" stroke="#38bdf8" strokeWidth="2"
                      animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <text x="0" y="80" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      115A GROUND FAULT CURRENT SHUNTED
                    </text>
                  </g>
                )}
              </g>
            </g>

            {/* 5. HUMAN BODY DIGITAL TWIN SILHOUETTE (OPERATOR) */}
            <g transform="translate(330, 130)">
              {isCasingCharged && !ppeEnabled && (
                <circle cx="50" cy="80" r="75" fill="url(#dangerAura)" />
              )}

              <path 
                d="M40 20 C40 10, 50 10, 50 20 C50 30, 48 35, 45 40 C55 42, 65 45, 65 55 L70 100 L60 100 L55 58 L52 110 C52 120, 58 135, 58 150 L50 150 L46 108 C46 125, 40 150, 40 150 L32 150 C32 125, 38 108, 38 108 L36 58 L22 42 C18 38, 22 35, 25 35 L36 50 Z" 
                fill={ppeEnabled ? "#10b981" : isCasingCharged ? "#ef4444" : "#cbd5e1"} 
                stroke={ppeEnabled ? "#34d399" : isCasingCharged ? "#f87171" : "#475569"} 
                strokeWidth="2.5"
                className="transition-colors duration-300"
                style={{ filter: isCasingCharged && !ppeEnabled ? "drop-shadow(0 0 18px #ef4444)" : undefined }}
              />

              <text x="45" y="2" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="black" fontFamily="monospace">
                OPERATOR DIGITAL TWIN
              </text>

              <line 
                x1="22" y1="42" x2="-150" y2="100" 
                stroke={isCasingCharged && !ppeEnabled ? "#ef4444" : ppeEnabled ? "#10b981" : "#cbd5e1"} 
                strokeWidth="4" 
                strokeLinecap="round"
              />

              <g transform="translate(45, 42)">
                <motion.path 
                  d="M12 5 C10 1.5, 6 1.5, 4 3.5 C2 5.5, 2 9.5, 6 13.5 L12 19 L18 13.5 C22 9.5, 22 5.5, 20 3.5 C18 1.5, 14 1.5, 12 5 Z" 
                  fill={shockAnalysis.heartColor}
                  animate={isCasingCharged && !ppeEnabled ? { scale: [1, 1.4, 0.9, 1.2, 1] } : { scale: [1, 1.1, 1] }}
                  transition={isCasingCharged && !ppeEnabled 
                    ? { duration: shockAnalysis.heartRate, repeat: Infinity } 
                    : { duration: 1.5, repeat: Infinity }
                  }
                  style={{ originX: '12px', originY: '12px' }}
                />
              </g>

              {isCasingCharged && !ppeEnabled && (
                <AnimatePresence>
                  <motion.path 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, repeat: Infinity, ease: 'linear' }}
                    d="M-150, 100 L22, 42 L45, 42 L46, 108 L40, 150" 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth="3.5" 
                    strokeDasharray="8 8"
                    style={{ filter: 'drop-shadow(0 0 10px #ef4444)' }}
                  />
                </AnimatePresence>
              )}

              {ppeEnabled && (
                <g transform="translate(45, 25)">
                  <circle cx="0" cy="0" r="20" fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" className="animate-spin" />
                  <path d="M-6,-2 L-1,3 L7,-5" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                  <text x="0" y="32" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="black" fontFamily="monospace">1MΩ PPE INSULATION</text>
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* Bottom Educational Substation Diagnostics Footer */}
        <div className="absolute bottom-3 left-3 right-3 z-30 p-2.5 px-4 bg-slate-900/95 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              System Topology:
            </span>
            <span className="text-xs font-mono font-black text-amber-300 uppercase">
              {scenario === 'solid' ? 'TN-S / TT Solid Earthing Rod (R=2Ω)' : 'Broken PE Conductor (Floating Casing)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              PPE Protection:
            </span>
            <span className={cn("text-xs font-mono font-black uppercase", ppeEnabled ? "text-emerald-400" : "text-amber-400")}>
              {ppeEnabled ? "1MΩ Gloves & Boots Equipped" : "Unprotected (0Ω)"}
            </span>
          </div>
        </div>
      </div>
    );
  }
}
