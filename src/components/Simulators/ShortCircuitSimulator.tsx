import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, AlertTriangle, Clock, TrendingUp, Cpu, Sliders, Settings, 
  Play, RotateCcw, Flame, ShieldAlert, Activity, BookOpen, ShieldCheck, Square, Info
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { EmergencyResponse } from '../EmergencyResponse';
import { HazardOverlay } from '../HazardOverlay';
import { PPEValidator } from '../PPEValidator';
import { useAudioHaptics } from '../useAudioHaptics';

export function ShortCircuitSimulator({ config }: { config?: UserConfig }) {
  // Simulator Toggles
  const [protectionSpeed, setProtectionSpeed] = useState<'fast' | 'delayed' | 'fail'>('fast');
  const [faultType, setFaultType] = useState<'three_phase' | 'line_ground'>('three_phase');

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

  // Calculations: Fault current based on phase type and environment
  const prospectiveFaultCurrent = useMemo(() => {
    if (isIndustrial) {
      return faultType === 'three_phase' ? 15000 : 8000;
    } else {
      return faultType === 'three_phase' ? 3500 : 1500;
    }
  }, [isIndustrial, faultType]);

  // Trip time in ms based on selection
  const tripTime = useMemo(() => {
    if (protectionSpeed === 'fast') return 14; // fast clearing speed (ms)
    if (protectionSpeed === 'delayed') return 76; // delayed coordination (ms)
    return Infinity; // fails to trip!
  }, [protectionSpeed]);

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
      } else if (time <= faultIgnitionTime + tripTime) {
        // Fault active
        const ramp = Math.min(1, (time - faultIgnitionTime) / 4);
        current = nominalLoadCurrent + (prospectiveFaultCurrent - nominalLoadCurrent) * ramp;

        // Energy = I^2 * t (kA^2s)
        const activeSec = (time - faultIgnitionTime) / 1000;
        energy = Math.pow(current / 1000, 2) * activeSec;
        
        // Heat level ranges 0 to 1.5. 15.0 kA^2s starts insulation damage
        heat = Math.min(1.5, energy / 12.0);
      } else {
        // Breaker tripped
        isTripped = true;
        current = 0;

        const activeSec = tripTime / 1000;
        energy = Math.pow(prospectiveFaultCurrent / 1000, 2) * activeSec;

        const finalHeat = Math.min(1.5, energy / 12.0);
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
  }, [time, prospectiveFaultCurrent, tripTime]);

  // Audio blast trigger at fault ignition
  useEffect(() => {
    if (time >= faultIgnitionTime && lastTimeRef.current < faultIgnitionTime) {
      playArcBlast();
    }
    lastTimeRef.current = time;
  }, [time, playArcBlast]);

  // Auto-play interval runner
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setTime((prev) => {
          if (prev >= 100) {
            setIsAutoPlaying(false);
            return 100;
          }
          return Math.min(100, prev + 2);
        });
      }, 40); // 100ms simulated time in ~2 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying]);

  useEffect(() => {
    if (time > 0) {
      setHasSimulated(true);
    }
  }, [time]);

  // Determine safety verdict based on Let-Through energy
  const verdict = useMemo(() => {
    if (time === 0) {
      return { 
        status: 'idle', 
        label: 'STANDBY / OK', 
        color: 'text-slate-350 bg-slate-900 border-slate-700/60 shadow-md', 
        desc: 'Conductors armed. Nominal power flowing. Awaiting short-circuit trigger.' 
      };
    }
    if (!tripped) {
      if (time === 100) {
        return { 
          status: 'fail', 
          label: 'CRITICAL FAILURE: NO TRIP', 
          color: 'text-red-400 bg-red-955/80 border-red-500/50 font-black animate-pulse shadow-md', 
          desc: 'The relay failed to trip the breaker. Massive continuous energy has melted the copper conductors, causing structural fire.' 
        };
      }
      return { 
        status: 'faulting', 
        label: 'SHORT-CIRCUIT IN PROGRESS', 
        color: 'text-red-400 bg-red-950/80 border-red-500/30 font-bold animate-pulse shadow-md', 
        desc: 'Insulation breakdown has occurred. Heavy fault current is loading the wires with extreme thermal stress.' 
      };
    }

    if (letThroughEnergy < 3.5) {
      return { 
        status: 'safe', 
        label: 'OPTIMAL PROTECTION', 
        color: 'text-green-400 bg-green-950/80 border-green-500/30 shadow-md', 
        desc: `Relay tripped breaker in ${tripTime}ms. Let-through energy was kept to ${letThroughEnergy.toFixed(1)} kA²s. Cables remain cold and safe.` 
      };
    } else {
      return { 
        status: 'danger', 
        label: 'CATASTROPHIC CABLE DAMAGE', 
        color: 'text-red-550 bg-red-955/90 border-red-500/50 font-extrabold shadow-md', 
        desc: `Delayed trip (${tripTime}ms) allowed a massive ${letThroughEnergy.toFixed(1)} kA²s to pass. Cable insulation melted, producing toxic smoke and explosive sparks.` 
      };
    }
  }, [time, tripped, letThroughEnergy, tripTime]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-4 bg-transparent text-slate-100 overflow-hidden p-2 md:p-0">
      
      {/* LEFT COLUMN: Simplified Controls, Diagnostics, and Lessons */}
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto pr-0 lg:pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-800 order-2 lg:order-1 gap-3">
        
        {/* Core Controls Panel */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col gap-3 shrink-0">
          <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-2 border-b border-slate-700 pb-2">
            <Sliders className="w-4 h-4 text-cyan-400" /> Simulator Controls
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
            {/* Protection Speed Toggle */}
            <div>
              <span className="text-xs font-bold text-slate-350 block mb-2 uppercase tracking-wide">
                1. Relay Protection Speed
              </span>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-750">
                <button
                  onClick={() => { setTime(0); setProtectionSpeed('fast'); }}
                  className={cn(
                    "py-2 text-[10px] font-bold rounded transition-all cursor-pointer border", 
                    protectionSpeed === 'fast' 
                      ? 'bg-green-600 text-slate-950 border-green-400 font-extrabold shadow-sm' 
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  Fast Trip
                </button>
                <button
                  onClick={() => { setTime(0); setProtectionSpeed('delayed'); }}
                  className={cn(
                    "py-2 text-[10px] font-bold rounded transition-all cursor-pointer border", 
                    protectionSpeed === 'delayed' 
                      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                      : 'bg-slate-955/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  Delayed
                </button>
                <button
                  onClick={() => { setTime(0); setProtectionSpeed('fail'); }}
                  className={cn(
                    "py-2 text-[10px] font-bold rounded transition-all cursor-pointer border", 
                    protectionSpeed === 'fail' 
                      ? 'bg-red-600 text-slate-100 border-red-400 font-extrabold shadow-sm' 
                      : 'bg-slate-955/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  No Trip
                </button>
              </div>
            </div>

            {/* Short Circuit Type Toggle */}
            <div>
              <span className="text-xs font-bold text-slate-350 block mb-2 uppercase tracking-wide">
                2. Fault Current Type
              </span>
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-750">
                <button
                  onClick={() => { setTime(0); setFaultType('three_phase'); }}
                  className={cn(
                    "py-2 text-xs font-bold rounded-md transition-all cursor-pointer border", 
                    faultType === 'three_phase' 
                      ? 'bg-red-650 text-white border-red-500 font-extrabold shadow-sm' 
                      : 'bg-slate-955/60 text-slate-350 border-slate-800 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  3-Phase (Bolted)
                </button>
                <button
                  onClick={() => { setTime(0); setFaultType('line_ground'); }}
                  className={cn(
                    "py-2 text-xs font-bold rounded-md transition-all cursor-pointer border", 
                    faultType === 'line_ground' 
                      ? 'bg-red-650 text-white border-red-500 font-extrabold shadow-sm' 
                      : 'bg-slate-955/60 text-slate-350 border-slate-800 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  Line-to-Ground
                </button>
              </div>
            </div>
          </div>

          {/* Trigger Play Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <div className="flex gap-2">
              {isAutoPlaying ? (
                <button 
                  onClick={() => setIsAutoPlaying(false)}
                  className="flex-1 py-3 font-bold text-xs uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white border border-red-500 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Square className="w-4 h-4 fill-white" /> STOP
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (time >= 100) setTime(0);
                    setIsAutoPlaying(true);
                  }}
                  className="flex-1 py-3 font-bold text-xs uppercase tracking-widest bg-green-600 hover:bg-green-700 text-slate-950 border border-green-500 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md font-black"
                >
                  <Play className="w-4 h-4 fill-slate-950 animate-pulse" /> IGNITE
                </button>
              )}
              <button 
                onClick={() => {
                  setIsAutoPlaying(false);
                  setTime(0);
                }}
                className="px-4 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl hover:bg-slate-900 hover:border-slate-750 flex items-center justify-center cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Slider to scan manually */}
            <div className="flex flex-col justify-center px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase mb-0.5">
                <span>Manual Sweep scan</span>
                <span className="text-orange-400 font-mono font-black">{time} ms</span>
              </div>
              <input
                type="range"
                min="0" max="100" step="2"
                value={time}
                onChange={(e) => {
                  setIsAutoPlaying(false);
                  setTime(Number(e.target.value));
                }}
                className="w-full accent-orange-500 cursor-pointer h-1"
              />
            </div>
          </div>
        </div>

        {/* Live Diagnostics Card (Big numbers, standard units) */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col gap-3">
          <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-2 border-b border-slate-700 pb-2">
            <Activity className="w-4 h-4" /> Live Diagnostics
          </h3>

          <div className="grid grid-cols-3 gap-3 font-mono">
            <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50 text-center">
              <span className="text-[10px] font-bold text-slate-550 uppercase block tracking-wider mb-1">Fault Current</span>
              <div className={cn(
                "text-2xl font-black",
                time >= faultIgnitionTime && !tripped ? "text-red-500" : "text-slate-100"
              )}>
                {faultCurrent.toFixed(0)} <span className="text-sm font-normal text-slate-500">A</span>
              </div>
            </div>

            <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50 text-center">
              <span className="text-[10px] font-bold text-slate-550 uppercase block tracking-wider mb-1">Clearing Delay</span>
              <div className="text-2xl font-black text-slate-100">
                {tripTime === Infinity ? "∞" : `${tripTime}`} <span className="text-sm font-normal text-slate-500">ms</span>
              </div>
            </div>

            <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50 text-center">
              <span className="text-[10px] font-bold text-slate-550 uppercase block tracking-wider mb-1">Let-Through (I²t)</span>
              <div className="text-2xl font-black text-orange-400">
                {letThroughEnergy.toFixed(1)} <span className="text-sm font-normal text-slate-500">kA²s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Safety Outcome Card */}
        <div className={cn("p-4 rounded-xl border shadow-md flex flex-col gap-2 transition-all", verdict.color)}>
          <span className="text-xs font-black tracking-widest uppercase opacity-75">
            Coordination Status Report
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
            📖 Wires Meltdown Safety Lessons
          </h3>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              <strong className="text-amber-400 block font-bold mb-1">1. What is the danger in a Short Circuit?</strong>
              When phase lines contact directly, current jumps from a few Amps to <strong className="text-red-400 font-bold">thousands of Amps (kA)</strong>. This current generates heat at a rate proportional to the <strong className="text-orange-400">Square of Current (I²)</strong>. Wires melt instantly if the energy is not cut off.
            </p>
            <p>
              <strong className="text-amber-400 block font-bold mb-1">2. How do Relay Speeds control damage?</strong>
              Safety is measured in <strong className="text-cyan-400">Let-Through Energy (I²t)</strong>. If the relay trips the breaker in 14ms (Fast), the thermal stress is tiny and wires stay cool. If it delays to 80ms (Delayed), the let-through energy increases by <strong className="text-orange-400">over 500%</strong>, causing insulation to catch fire.
            </p>
            <p>
              <strong className="text-amber-400 block font-bold mb-1">3. The danger of desensitized protection (No Trip)</strong>
              If the pickup current dial is set too high (e.g. Ground Fault is 1500A, but pickup is set to 2000A), the relay fails to detect the fault, the breaker <strong className="text-red-400 font-bold">remains closed (never opens)</strong>, leading to explosive copper terminal meltdown.
            </p>
          </div>
        </div>

        {/* Safety Drill modules */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col gap-2.5">
          <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 border-b border-slate-700 pb-2">
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

      {/* RIGHT COLUMN: Switchgear Schematic panel */}
      {/* Sticky sidebar on desktop, top banner on mobile */}
      <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 h-[240px] lg:h-full order-1 lg:order-2 bg-slate-900 border border-slate-750 lg:rounded-2xl overflow-hidden flex flex-col relative shadow-2xl">
        <div className="absolute top-2.5 left-3 z-30 flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded shadow">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[9px] font-mono font-bold tracking-wider text-slate-200 uppercase">
            {isIndustrial ? "415V Industrial Grid" : "230V Secondary Grid"}
          </span>
        </div>

        {renderSubstationSchematic()}
      </div>

      {/* Full screen flash hazard overlay */}
      <HazardOverlay 
        isActive={time >= faultIgnitionTime && !tripped}
        hazardType="short_circuit"
        dangerLevel={letThroughEnergy > 15.0 ? "critical" : "warning"}
        magnitude={`${(faultCurrent/1000).toFixed(1)} kA TRANSIENT FAULT`}
      />

    </div>
  );

  // High-Fidelity switchgear schematic visualizer
  function renderSubstationSchematic() {
    const isFaultActive = time >= faultIgnitionTime && !tripped;
    
    // Relay display screen variables
    let lcdBackground = "fill-[#14532d]"; // normal green
    let lcdText1 = `I_f: ${faultCurrent.toFixed(0)}A`;
    let lcdText2 = "STATUS: SAFE MONITORING";
    let isPUPulsing = false;
    let isTripActive = false;

    if (isFaultActive) {
      lcdBackground = "fill-[#7f1d1d] animate-pulse"; // flashing red
      lcdText1 = `I_f: ${(faultCurrent/1000).toFixed(1)}kA FAULT`;
      lcdText2 = "STATUS: RELAY PICKUP";
      isPUPulsing = true;
    } else if (tripped) {
      lcdBackground = "fill-[#7c2d12]"; // orange/amber
      lcdText1 = `I_t: ${tripTime}ms`;
      lcdText2 = "STATUS: CB OPEN/SAFE";
      isTripActive = true;
    } else if (protectionSpeed === 'fail') {
      lcdBackground = "fill-[#7f1d1d] animate-pulse";
      lcdText1 = `I_f: ${(faultCurrent/1000).toFixed(1)}kA`;
      lcdText2 = "STATUS: OVERCURRENT";
      isPUPulsing = true;
    }

    // Breaker contact swivel angle
    const cbAngle = tripped ? -40 : 0;

    // Cable coloring based on heat Level
    let cableStroke = '#475569'; // cool slate gray
    let cableGlow = 'none';
    let cableWidth = 2.5;

    if (time > 0) {
      if (time >= faultIgnitionTime) {
        if (tripped) {
          // Cooled down state
          cableStroke = `rgb(${Math.round(71 + heatLevel * 100)}, ${Math.round(85 + heatLevel * 50)}, ${Math.round(105 + heatLevel * 20)})`;
          cableWidth = 2.5 + heatLevel * 2;
        } else {
          // Heat active glow transitions yellow -> orange -> white
          const r = Math.min(255, Math.round(180 + heatLevel * 100));
          const g = Math.max(0, Math.min(255, Math.round(200 - heatLevel * 220)));
          const b = Math.max(0, Math.min(255, Math.round(50 - heatLevel * 50)));
          cableStroke = `rgb(${r}, ${g}, ${b})`;
          cableWidth = 2.5 + heatLevel * 4;
          if (heatLevel > 0.3) {
            cableGlow = `drop-shadow(0 0 ${4 + heatLevel * 10}px ${cableStroke})`;
          }
        }
      }
    }

    return (
      <div className="flex-1 w-full relative flex items-center justify-center p-2">
        <svg viewBox="0 0 200 250" className="w-full h-full max-h-[350px]">
          <defs>
            <radialGradient id="auraglow_sc" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="plasma" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#ea580c" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* BACKGROUND AURA DURING CRITICAL FAULT */}
          {isFaultActive && (
            <circle cx="120" cy="150" r="60" fill="url(#auraglow_sc)" />
          )}

          {/* GRID BUS CONNECTIONS AND WIRES */}
          <line x1="100" y1="42" x2="100" y2="70" stroke="#64748b" strokeWidth="2.5" />
          <line x1="100" y1="92" x2="100" y2="150" stroke={cableStroke} strokeWidth={cableWidth} style={{ filter: cableGlow }} />
          <line x1="100" y1="150" x2="100" y2="195" stroke={tripped ? "#334155" : "#475569"} strokeWidth="2.5" />
          <line x1="100" y1="150" x2="140" y2="150" stroke={cableStroke} strokeWidth={cableWidth} style={{ filter: cableGlow }} />

          {/* TRANSFORMER SUBSTATION BLOCK */}
          <g transform="translate(65, 8)">
            <rect x="0" y="0" width="70" height="34" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            {/* Cooling fins details */}
            {[-2, 12, 26, 40, 54, 68].map((fx, idx) => (
              <line key={idx} x1={fx} y1="-3" x2={fx} y2="0" stroke="#334155" strokeWidth="1.5" />
            ))}
            {/* Windings symbols */}
            <circle cx="27" cy="17" r="9" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="43" cy="17" r="9" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* Text details */}
            <text x="35" y="7" textAnchor="middle" fill="#94a3b8" fontSize="4.5" fontFamily="monospace">TRANSFORMER</text>
            <text x="35" y="31" textAnchor="middle" fill="#cbd5e1" fontSize="5" fontWeight="bold" fontFamily="monospace">
              {systemVoltage}V Source
            </text>
          </g>

          {/* PROTECTION RELAY MODULE 51 */}
          <g transform="translate(12, 60)">
            <rect x="0" y="0" width="60" height="42" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" className="shadow" />
            <text x="30" y="6" textAnchor="middle" fill="#38bdf8" fontSize="5" fontWeight="black" fontFamily="monospace">RELAY 51 (O/C)</text>
            
            {/* Digital Display Screen */}
            <rect x="4" y="9" width="52" height="17" rx="1.5" fill={lcdBackground} className="transition-all duration-300" />
            <text x="6" y="16" fill="#f8fafc" fontSize="4.5" fontFamily="monospace" fontWeight="bold">{lcdText1}</text>
            <text x="6" y="23" fill="#cbd5e1" fontSize="3.8" fontFamily="monospace">{lcdText2}</text>
            
            {/* Status indicators LEDs */}
            <circle cx="10" cy="34" r="2.2" fill="#22c55e" />
            <text x="14" y="36" fill="#94a3b8" fontSize="3.5" fontFamily="monospace">PWR</text>

            <circle 
              cx="28" cy="34" r="2.2" 
              fill={isPUPulsing ? "#f97316" : "#334155"} 
              className={cn(isPUPulsing && "animate-pulse")}
            />
            <text x="32" y="36" fill="#94a3b8" fontSize="3.5" fontFamily="monospace">P/U</text>

            <circle 
              cx="46" cy="34" r="2.2" 
              fill={isTripActive ? "#ef4444" : "#334155"} 
            />
            <text x="50" y="36" fill="#94a3b8" fontSize="3.5" fontFamily="monospace">TRIP</text>
          </g>

          {/* DASH CONTROL WIRE RELAY TO CB */}
          <path 
            d="M72, 80 L88, 80" 
            stroke={isTripActive ? "#ef4444" : isPUPulsing ? "#f97316" : "#38bdf8"} 
            strokeWidth="1.5" 
            strokeDasharray="2 2"
            className={cn(isPUPulsing && "animate-pulse")}
          />

          {/* VACUUM CIRCUIT BREAKER (VCB) */}
          <g transform="translate(85, 68)">
            <rect x="0" y="0" width="30" height="24" rx="3.5" fill="#0f172a" stroke={tripped ? "#22c55e" : "#ef4444"} strokeWidth="1.8" />
            <text x="15" y="7" textAnchor="middle" fill="#64748b" fontSize="4.5" fontFamily="monospace">VCB-CB1</text>
            
            {/* Contacts points */}
            <circle cx="15" cy="7" r="1.5" fill="#94a3b8" />
            <circle cx="15" cy="22" r="1.5" fill="#94a3b8" />

            {/* Rotating Swivel Breaker Arm */}
            <g transform={`rotate(${cbAngle}, 15, 7)`} className="transition-transform duration-300">
              <line x1="15" y1="7" x2="15" y2="22" stroke={tripped ? "#22c55e" : "#ef4444"} strokeWidth="3" />
            </g>
          </g>

          {/* LOAD SYSTEM (INDUSTRIAL MOTOR) */}
          <g transform="translate(75, 195)">
            <rect x="0" y="0" width="50" height="38" rx="4" fill="#1e293b" stroke={tripped ? "#475569" : "#22c55e"} strokeWidth="1.5" />
            <text x="25" y="8" textAnchor="middle" fill="#94a3b8" fontSize="4.5" fontFamily="monospace">MOTOR LOAD</text>
            
            {/* Rotating Fan visual indicator */}
            <circle cx="25" cy="24" r="8" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <motion.g 
              cx="25" cy="24" 
              style={{ originX: '25px', originY: '24px' }}
              animate={{ rotate: (time === 0 || (!tripped)) ? 360 : 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            >
              {/* Fan blades */}
              <line x1="25" y1="16" x2="25" y2="32" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="17" y1="24" x2="33" y2="24" stroke="#cbd5e1" strokeWidth="1.5" />
            </motion.g>
          </g>

          {/* ANIMATED NOMINAL ELECTRON POWER FLOW LINES */}
          {(time === 0 || (!tripped)) && (
            <>
              {/* Dash flows down conductor */}
              <motion.line 
                x1="100" y1="42" x2="100" y2="195" 
                stroke="#22c55e" strokeWidth="1.2" 
                strokeDasharray="4 8"
                animate={{ strokeDashoffset: [-24, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </>
          )}

          {/* SHORT CIRCUIT FAULT EXPLOSION INCEPTION POINT */}
          <>
            {/* Ground connection block */}
            <line x1="140" y1="150" x2="140" y2="170" stroke="#cbd5e1" strokeWidth="2.5" />
            {/* Ground Symbol */}
            <line x1="132" y1="170" x2="148" y2="170" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="135" y1="174" x2="145" y2="174" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="138" y1="178" x2="142" y2="178" stroke="#cbd5e1" strokeWidth="1" />

            {/* Active Short circuit explosions */}
            {isFaultActive && (
              <g>
                {/* Glowing plasma halo */}
                <motion.circle 
                  cx="120" cy="150" 
                  initial={{ r: 10 }}
                  animate={{ r: [15, 24, 17] }} 
                  transition={{ duration: 0.1, repeat: Infinity }}
                  fill="url(#plasma)" 
                />

                {/* Jagged electric arc flicker */}
                <AnimatePresence>
                  {time % 4 === 0 ? (
                    <path d="M 100 150 L 110 142 L 115 156 L 125 144 L 140 150" fill="none" stroke="#ffffff" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 5px #fbbf24)' }} />
                  ) : (
                    <path d="M 100 150 L 108 158 L 120 143 L 130 155 L 140 150" fill="none" stroke="#38bdf8" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 6px #38bdf8)' }} />
                  )}
                </AnimatePresence>

                {/* Radiating Spark Particles */}
                {[
                  { dx: -20, dy: -25, del: 0 },
                  { dx: 25, dy: -18, del: 0.05 },
                  { dx: -5, dy: -35, del: 0.1 },
                  { dx: 32, dy: -5, del: 0.03 },
                  { dx: -22, dy: 10, del: 0.08 },
                  { dx: 15, dy: -30, del: 0.12 },
                ].map((spark, idx) => (
                  <motion.circle
                    key={idx}
                    cx="120" cy="150"
                    r="1.8"
                    fill="#fbbf24"
                    animate={{ 
                      x: [0, spark.dx], 
                      y: [0, spark.dy],
                      opacity: [1, 0],
                      scale: [1, 0.2]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity, 
                      delay: spark.del,
                      ease: "easeOut"
                    }}
                  />
                ))}

                {/* Rising Smoke rings */}
                {[
                  { sx: -10, del: 0 },
                  { sx: 8, del: 0.25 },
                  { sx: -2, del: 0.5 },
                ].map((smoke, idx) => (
                  <motion.circle
                    key={idx}
                    cx="120" cy="150"
                    r="4"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1"
                    animate={{
                      y: [0, -45],
                      x: [0, smoke.sx],
                      opacity: [0.5, 0],
                      scale: [0.8, 2.2]
                    }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      delay: smoke.del,
                      ease: "linear"
                    }}
                  />
                ))}
                
                {/* Red short circuit warning flashing label */}
                <text x="120" y="130" textAnchor="middle" fill="#ef4444" fontSize="6.5" fontWeight="black" fontFamily="sans-serif" className="animate-ping font-extrabold uppercase">
                  SHORT CIRCUIT!
                </text>
              </g>
            )}
          </>

          {/* SAFE TRIPPED FEEDBACK TEXT */}
          {tripped && (
            <text x="100" y="112" textAnchor="middle" fill="#22c55e" fontSize="5.5" fontWeight="black" fontFamily="monospace" className="animate-pulse">
              BREAKER TRIPPED SAFELY
            </text>
          )}
        </svg>
      </div>
    );
  }
}
