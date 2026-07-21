import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, AlertTriangle, ShieldCheck, ShieldAlert, Activity, 
  Info, Sliders, Settings, RotateCcw, Shield
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { HazardOverlay } from '../HazardOverlay';

export function EarthFaultSimulator({ config }: { config?: UserConfig }) {
  // Simulator Dials
  const [scenario, setScenario] = useState<'solid' | 'broken'>('solid');
  const [ppeEnabled, setPpeEnabled] = useState<boolean>(false);
  const [faultActive, setFaultActive] = useState<boolean>(false);
  const [breakerTripped, setBreakerTripped] = useState<boolean>(false);

  const isIndustrial = config?.environment === 'industrial';
  const systemVoltage = isIndustrial ? 415 : 230;

  // Upstream breaker automatic protective trip on Solid Ground Fault
  useEffect(() => {
    if (faultActive && scenario === 'solid') {
      const timeout = setTimeout(() => {
        setBreakerTripped(true);
      }, 350); // trips in 350ms to show the transient transition
      return () => clearTimeout(timeout);
    }
  }, [faultActive, scenario]);

  // Reset breaker when fault is cleared
  useEffect(() => {
    if (!faultActive) {
      setBreakerTripped(false);
    }
  }, [faultActive]);

  // ----------------------------------------------------
  // PHYSICS ENGINE CALCULATIONS
  // ----------------------------------------------------
  const physics = useMemo(() => {
    // Body resistance (standard human body touch path)
    const rBody = 1000; // ohms (as per IEC 60479-1 standard human touch path)
    
    // Footwear & Gloves isolation resistance
    // Dielectric safety boots + rubber safety gloves = high impedance path
    const rShoes = ppeEnabled ? 1000000 : 1500; // 1M ohms or 1.5k ohms (standard shoes)
    const rGloves = ppeEnabled ? 1000000 : 0; // 1M ohms or 0 ohms (bare hands)
    const rTotal = rBody + rShoes + rGloves;

    // Ground rod resistance
    const rEarth = 2; // ohms

    let bodyCurrent = 0; // mA
    let groundCurrent = 0; // A
    let touchVoltage = 0; // V

    if (faultActive && !breakerTripped) {
      if (scenario === 'solid') {
        // Current flows through earth rod, touch voltage shunted to safe low limits
        groundCurrent = systemVoltage / rEarth; // e.g. 230V / 2 = 115A
        touchVoltage = 2; // shunted to minimal levels (near 0V)
        bodyCurrent = (touchVoltage / (rBody + rShoes)) * 1000; // in mA
      } else {
        // Broken grounding wire! Enclosure is live at system voltage
        groundCurrent = 0;
        touchVoltage = systemVoltage; // full voltage
        bodyCurrent = (touchVoltage / rTotal) * 1000; // in mA
      }
    }

    return {
      rTotal,
      bodyCurrent,
      groundCurrent,
      touchVoltage
    };
  }, [faultActive, breakerTripped, scenario, ppeEnabled, systemVoltage]);

  // IEC 60479-1 Shock Hazard Severity Analysis
  const shockAnalysis = useMemo(() => {
    const current = physics.bodyCurrent;
    
    if (breakerTripped) {
      return {
        level: 'safe',
        label: 'FAULT CLEARED',
        color: 'text-green-400 bg-green-950/80 border-green-500/30 shadow-md shadow-green-500/5',
        heartColor: '#22c55e', // safe green
        heartRate: 1.2,
        desc: 'Upstream protective breaker detected the ground fault and tripped instantly (15ms). Touch voltage cleared.'
      };
    }

    if (!faultActive) {
      return { 
        level: 'none', 
        label: 'STANDBY / OK', 
        color: 'text-slate-300 bg-slate-900 border-slate-700/60 shadow-md', 
        heartColor: '#10b981', 
        heartRate: 1.2, 
        desc: 'System is operating normally. Winding insulation is intact. Casing is safe to touch.' 
      };
    }

    if (current === 0) {
      return { 
        level: 'safe', 
        label: 'GROUND SHUNT PROTECTED', 
        color: 'text-green-400 bg-green-950/80 border-green-500/30 shadow-md', 
        heartColor: '#10b981', 
        heartRate: 1.2, 
        desc: 'Ground wire shunts 100% of touch current to earth. Casing voltage is shunted to 0V. Safe.' 
      };
    }

    if (current < 1) {
      return { 
        level: 'insulated', 
        label: 'PPE PROTECTED (INSULATED)', 
        color: 'text-green-400 bg-green-950/80 border-green-500/30 shadow-md', 
        heartColor: '#10b981', 
        heartRate: 1.2, 
        desc: 'Leakage voltage is active on casing, but insulated rubber gloves and dielectric safety boots block the current. Safe.' 
      };
    }

    if (current < 30) {
      return { 
        level: 'contraction', 
        label: 'PAINFUL MUSCLE SHOCK', 
        color: 'text-orange-400 bg-orange-950/80 border-orange-500/30 shadow-md', 
        heartColor: '#fbbf24', 
        heartRate: 0.8, 
        desc: `Touch current of ${current.toFixed(1)} mA causes involuntary muscle contractions. Extremely painful shock, but can let go.` 
      };
    }

    if (current < 100) {
      return { 
        level: 'suffocation', 
        label: 'RESPIRATORY PARALYSIS HAZARD', 
        color: 'text-red-400 bg-red-950/80 border-red-500/30 font-bold shadow-md', 
        heartColor: '#f97316', 
        heartRate: 0.5, 
        desc: `Shock current of ${current.toFixed(1)} mA contracts chest muscles. Breathing stops. Danger of asphyxiation if not disconnected.` 
      };
    }

    return { 
      level: 'fibrillation', 
      label: 'LETHAL SHOCK (CARDIAC ARREST)', 
      color: 'text-red-400 bg-red-950/90 border-red-500/50 font-black animate-pulse shadow-md', 
      heartColor: '#ef4444', 
      heartRate: 0.2, 
      desc: `Lethal current of ${current.toFixed(1)} mA triggers ventricular fibrillation. Heart stop occurs within seconds.` 
    };
  }, [faultActive, breakerTripped, physics.bodyCurrent]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-4 bg-transparent text-slate-100 overflow-hidden p-2 md:p-0">
      
      {/* LEFT COLUMN: Simplified Controls, Meters, and Lessons */}
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto pr-0 lg:pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-800 order-2 lg:order-1 gap-3">
        
        {/* Core Controls Panel */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col gap-3 shrink-0">
          <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-2 border-b border-slate-700 pb-2">
            <Sliders className="w-4 h-4 text-cyan-400" /> Simulator Controls
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
            {/* Earthing Toggle */}
            <div>
              <span className="text-xs font-bold text-slate-350 block mb-2 uppercase tracking-wide">
                1. System Earthing
              </span>
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-750">
                <button
                  onClick={() => { setScenario('solid'); }}
                  className={cn(
                    "py-2 text-xs font-bold rounded-md transition-all cursor-pointer border", 
                    scenario === 'solid' 
                      ? 'bg-green-600 text-slate-950 border-green-400 font-extrabold shadow-md shadow-green-500/10' 
                      : 'bg-slate-950/60 text-slate-350 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                  )}
                >
                  Solid Earth
                </button>
                <button
                  onClick={() => { setScenario('broken'); }}
                  className={cn(
                    "py-2 text-xs font-bold rounded-md transition-all cursor-pointer border", 
                    scenario === 'broken' 
                      ? 'bg-red-600 text-slate-100 border-red-400 font-extrabold shadow-md shadow-red-500/10' 
                      : 'bg-slate-950/60 text-slate-350 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                  )}
                >
                  Broken Earth
                </button>
              </div>
            </div>

            {/* PPE Toggle */}
            <div>
              <span className="text-xs font-bold text-slate-350 block mb-2 uppercase tracking-wide">
                2. Wear Safety Gear (PPE)
              </span>
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-750">
                <button
                  onClick={() => setPpeEnabled(false)}
                  className={cn(
                    "py-2 text-xs font-bold rounded-md transition-all cursor-pointer border", 
                    !ppeEnabled 
                      ? 'bg-red-600 text-slate-100 border-red-400 font-extrabold shadow-md shadow-red-500/10' 
                      : 'bg-slate-950/60 text-slate-350 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                  )}
                >
                  No PPE
                </button>
                <button
                  onClick={() => setPpeEnabled(true)}
                  className={cn(
                    "py-2 text-xs font-bold rounded-md transition-all cursor-pointer border", 
                    ppeEnabled 
                      ? 'bg-green-600 text-slate-950 border-green-400 font-extrabold shadow-md shadow-green-500/10' 
                      : 'bg-slate-950/60 text-slate-350 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                  )}
                >
                  Gloves & Boots
                </button>
              </div>
            </div>
          </div>

          {/* Trigger Button */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => setFaultActive(!faultActive)}
              className={cn(
                "py-3 font-bold text-xs uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 select-none shadow-md border cursor-pointer",
                faultActive
                  ? "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900 hover:border-slate-750"
                  : "bg-orange-500 text-slate-950 border-orange-400 hover:bg-orange-400 shadow-orange-500/25 font-black"
              )}
            >
              <Zap className="w-4 h-4 fill-current animate-pulse" />
              {faultActive ? "RESET SIMULATOR" : "TRIGGER INSULATION FAULT"}
            </button>

            {/* Quick reset status indicator */}
            <div className="flex items-center gap-2 px-3 border border-slate-850 rounded-xl bg-slate-950/70 text-xs font-mono text-slate-300 shadow-inner">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{faultActive ? "Insulation breakdown simulated!" : "Awaiting fault initiation."}</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Telemetry Panel (Big Fonts, Standard Units) */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col gap-3">
          <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-2 border-b border-slate-700 pb-2">
            <Activity className="w-4 h-4" /> Live Diagnostics
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Touch Voltage</span>
              <div className="text-2xl font-black font-mono text-slate-100">
                {physics.touchVoltage.toFixed(0)} <span className="text-sm font-normal text-slate-500">V</span>
              </div>
            </div>

            <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Body Current</span>
              <div className={cn(
                "text-2xl font-black font-mono",
                physics.bodyCurrent >= 30 ? "text-red-500" : physics.bodyCurrent > 0 ? "text-yellow-400" : "text-green-400"
              )}>
                {physics.bodyCurrent.toFixed(1)} <span className="text-sm font-normal text-slate-500">mA</span>
              </div>
            </div>

            <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Breaker Status</span>
              <div className={cn(
                "text-sm font-black mt-1 uppercase",
                breakerTripped ? "text-green-400" : faultActive ? "text-red-400 animate-pulse" : "text-slate-400"
              )}>
                {breakerTripped ? "TRIPPED" : "CLOSED (LIVE)"}
              </div>
            </div>
          </div>
        </div>

        {/* Hazard Evaluation & Outcome Report */}
        <div className={cn("p-4 rounded-xl border shadow-md flex flex-col gap-2 transition-all", shockAnalysis.color)}>
          <span className="text-xs font-black tracking-widest uppercase opacity-75">
            Hazard Assessment Report
          </span>
          <div className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mt-0.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {shockAnalysis.label}
          </div>
          <p className="text-sm leading-relaxed font-semibold mt-1">
            {shockAnalysis.desc}
          </p>
        </div>

        {/* Simple grounding classroom lessons */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col gap-3">
          <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 border-b border-slate-700 pb-2">
            📖 The Grounding Safety Rulebook
          </h3>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              <strong className="text-amber-400 block font-bold mb-1">1. Why does Earthing protect you?</strong>
              Earthing creates a solid copper shunting path (2 ohms) back to the source. If insulation fails, the current flows through the earth rod instead of the human body (1000 ohms). This huge current immediately trips the upstream circuit breaker.
            </p>
            <p>
              <strong className="text-amber-400 block font-bold mb-1">2. What happens if Earthing is broken?</strong>
              If the earth connection is severed, there is no return path to cause overcurrent. The circuit breaker <strong className="text-red-400 font-bold">remains closed (does not trip)</strong>. The motor shell stays energized. Touching the shell completes the circuit to ground through your body, leading to severe shock or cardiac arrest.
            </p>
            <p>
              <strong className="text-amber-400 block font-bold mb-1">3. How does PPE help?</strong>
              Insulating safety gloves and boots introduce extreme electrical resistance (1,000,000 ohms) in the circuit path, restricting body touch currents to harmless fractions of a milliamp.
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Realistic Visual SVG Schematic */}
      {/* Sticky side panel on desktop, top banner on mobile */}
      <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 h-[300px] lg:h-full order-1 lg:order-2 bg-slate-900 border border-slate-750 lg:rounded-2xl overflow-hidden flex flex-col relative shadow-2xl">
        {renderSubstationVisual()}
      </div>

      {/* Hazard color overlay alerts */}
      <HazardOverlay 
        isActive={faultActive && !breakerTripped && !ppeEnabled && scenario === 'broken'}
        hazardType="earth_fault"
        dangerLevel={physics.bodyCurrent > 100 ? "critical" : "warning"}
        magnitude={`${physics.bodyCurrent.toFixed(0)} mA Touch Shock`}
      />

    </div>
  );

  // High-Fidelity SVG visual renderer
  function renderSubstationVisual() {
    const isCasingCharged = faultActive && !breakerTripped && scenario === 'broken';
    const isFaultActive = faultActive && !breakerTripped;

    // Heart pulsing rate depending on current
    const heartScale = [1, 1];
    let heartRate = 1.0;
    if (isCasingCharged && !ppeEnabled) {
      heartRate = physics.bodyCurrent > 100 ? 0.2 : 0.5;
    }

    return (
      <div className="flex-1 w-full h-full relative flex items-center justify-center p-2">
        <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
          <defs>
            <radialGradient id="auraglow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Shock danger background glow */}
          {isCasingCharged && !ppeEnabled && (
            <circle cx="155" cy="150" r="50" fill="url(#auraglow)" />
          )}

          {/* High Voltage Source Line */}
          <line x1="20" y1="20" x2="180" y2="20" stroke="#f59e0b" strokeWidth="3" />
          <text x="100" y="13" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold" fontFamily="monospace">
            POWER GRID SOURCE ({systemVoltage}V)
          </text>

          {/* Upstream Breaker connection */}
          <line x1="60" y1="20" x2="60" y2="45" stroke={breakerTripped ? "#475569" : "#f59e0b"} strokeWidth="2" />
          <line x1="60" y1="70" x2="60" y2="135" stroke={breakerTripped ? "#475569" : "#f59e0b"} strokeWidth="2" />

          {/* CIRCUIT BREAKER DRAWING */}
          <g transform="translate(60, 45)">
            <rect x="-8" y="0" width="16" height="25" rx="2" fill="#0f172a" stroke={breakerTripped ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <text x="12" y="14" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">BREAKER</text>
            <circle cx="0" cy="4" r="1.5" fill="#cbd5e1" />
            <circle cx="0" cy="21" r="1.5" fill="#cbd5e1" />
            
            {/* Breaker arm animation */}
            {breakerTripped ? (
              <line x1="0" y1="4" x2="-8" y2="18" stroke="#22c55e" strokeWidth="2.5" />
            ) : (
              <line x1="0" y1="4" x2="0" y2="21" stroke="#ef4444" strokeWidth="2.5" />
            )}
          </g>

          {/* MOTOR ENCLOSURE */}
          <g transform="translate(25, 135)">
            <rect 
              x="0" y="0" width="65" height="50" rx="6" 
              fill="#1e293b" 
              stroke={isCasingCharged ? "#ef4444" : isFaultActive && scenario === 'solid' ? "#38bdf8" : "#475569"} 
              strokeWidth="2.5" 
              className={cn("transition-colors duration-300", isCasingCharged && "animate-pulse")}
            />
            <text x="32" y="27" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">MOTOR</text>
            
            {/* Winding symbol inside */}
            <path d="M12,18 Q20,10 20,18 T28,18 T36,18 T44,18" fill="none" stroke="#64748b" strokeWidth="1.5" />
            
            {/* Spark leakage to casing */}
            {isFaultActive && (
              <motion.g animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.1, repeat: Infinity }}>
                <path d="M25,18 L15,30 L22,28 L10,40" fill="none" stroke="#fbbf24" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 3px #fbbf24)' }} />
              </motion.g>
            )}
          </g>

          {/* GROUNDING PATH LINE */}
          <line 
            x1="90" y1="160" x2="135" y2="160" 
            stroke={scenario === 'solid' ? "#22c55e" : "#475569"} 
            strokeWidth="2" 
            strokeDasharray={scenario === 'solid' ? "none" : "2 3"} 
          />
          
          {/* Ground rod electrode */}
          <g transform="translate(135, 160)">
            <line x1="0" y1="-8" x2="0" y2="8" stroke={scenario === 'solid' ? "#22c55e" : "#ef4444"} strokeWidth="2" />
            {scenario === 'solid' ? (
              <g>
                <line x1="0" y1="0" x2="8" y2="0" stroke="#22c55e" strokeWidth="1.8" />
                <line x1="4" y1="-4" x2="4" y2="4" stroke="#22c55e" strokeWidth="1.8" />
                {isFaultActive && (
                  // Flowing green electrons to ground
                  <motion.circle 
                    cx="0" cy="0" r="2.5" fill="#22c55e"
                    animate={{ x: [0, 4], y: [-8, 8], opacity: [1, 0] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  />
                )}
              </g>
            ) : (
              <g transform="translate(0, 0)">
                <line x1="-3" y1="-3" x2="3" y2="3" stroke="#ef4444" strokeWidth="1.5" />
                <line x1="3" y1="-3" x2="-3" y2="3" stroke="#ef4444" strokeWidth="1.5" />
                <text x="6" y="-3" fill="#ef4444" fontSize="5" fontWeight="bold" fontFamily="monospace">BROKEN</text>
              </g>
            )}
          </g>

          {/* OPERATOR DIGITAL TWIN */}
          <g transform="translate(115, 100)">
            {/* Operator Body Silhouette */}
            <path 
              d="M18 12 C18 7, 24 7, 24 12 C24 18, 24 20, 22 23 C28 24, 34 26, 34 32 L38 65 L32 65 L29 36 L27 75 C27 82, 31 90, 31 100 L27 100 L25 72 C25 85, 21 100, 21 100 L17 100 C17 82, 21 72, 21 72 L20 36 L10 24 C8 22, 10 20, 12 20 L20 31 Z" 
              fill={ppeEnabled ? "#10b981" : "#cbd5e1"} 
              stroke={ppeEnabled ? "#10b981" : "#475569"} 
              strokeWidth="1.2" 
            />

            {/* Left Arm touching motor casing */}
            {isFaultActive ? (
              <line 
                x1="10" y1="24" x2="-25" y2="60" 
                stroke={isCasingCharged && !ppeEnabled ? "#ef4444" : ppeEnabled ? "#10b981" : "#cbd5e1"} 
                strokeWidth="2.2" 
              />
            ) : (
              <line x1="10" y1="24" x2="-25" y2="60" stroke="#cbd5e1" strokeWidth="1.8" />
            )}

            {/* PULSING HUMAN HEART VISUAL */}
            <g transform="translate(20, 22)">
              <motion.path 
                d="M12 5 C10 1.5, 6 1.5, 4 3.5 C2 5.5, 2 9.5, 6 13.5 L12 19 L18 13.5 C22 9.5, 22 5.5, 20 3.5 C18 1.5, 14 1.5, 12 5 Z" 
                fill={shockAnalysis.heartColor}
                animate={isCasingCharged && !ppeEnabled ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={isCasingCharged && !ppeEnabled 
                  ? { duration: heartRate, repeat: Infinity, ease: "easeInOut" } 
                  : { duration: 1.5 }
                }
                style={{ originX: '12px', originY: '12px' }}
              />
            </g>

            {/* ELECTRICAL SHOCK PATH ANIMATION (Jagged current) */}
            {isCasingCharged && !ppeEnabled && (
              <AnimatePresence>
                <motion.path 
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                  d="M-25, 60 L-10, 48 L10, 24 L16, 26 L21, 40 L21, 72 L21, 100" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="2" 
                  style={{ filter: 'drop-shadow(0 0 5px #ef4444)' }}
                />
              </AnimatePresence>
            )}

            {/* GREEN SAFETY SHIELD ON PPE ENABLED */}
            {isFaultActive && ppeEnabled && (
              <g transform="translate(18, 5)">
                <circle cx="0" cy="0" r="14" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" />
                <path d="M-4,-2 L0,2 L6,-4" fill="none" stroke="#10b981" strokeWidth="2" />
              </g>
            )}
          </g>

          {/* SAFE TRIPPED FEEDBACK TEXT OR STATUS */}
          {breakerTripped && (
            <g>
              <rect x="35" y="102" width="130" height="15" rx="3" fill="#14532d" stroke="#22c55e" strokeWidth="1" />
              <text x="100" y="112" textAnchor="middle" fill="#22c55e" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
                BREAKER TRIPPED SAFELY (15ms)
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  }
}
