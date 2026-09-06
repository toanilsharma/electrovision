import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

interface LOTOMachineryVisualEngineProps {
  step: number; // 0 to 5
  isCompleted: boolean;
  color: string;
}

export function LOTOMachineryVisualEngine({ step, isCompleted, color }: LOTOMachineryVisualEngineProps) {
  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center select-none bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-lg p-1">
      {/* Background Precision Grid */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
          backgroundSize: '16px 16px'
        }}
      />

      {/* Render Active Machinery Scene */}
      {step === 0 && <Step0PlantMappingScene isCompleted={isCompleted} />}
      {step === 1 && <Step1MotorShutdownScene isCompleted={isCompleted} />}
      {step === 2 && <Step2PhysicalIsolationScene isCompleted={isCompleted} />}
      {step === 3 && <Step3LockoutTagoutScene isCompleted={isCompleted} />}
      {step === 4 && <Step4StoredEnergyBleedScene isCompleted={isCompleted} />}
      {step === 5 && <Step5ZeroEnergyVerifyScene isCompleted={isCompleted} />}

      {/* Persistent Industrial HUD Overlay Bar */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color }} />
        <span className="text-[9px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700/80 text-slate-300 backdrop-blur-sm">
          LOTO SIMULATOR · OSHA 1910.147
        </span>
      </div>

      {isCompleted && (
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/80 text-emerald-400 font-mono text-[9px] font-black uppercase tracking-wider backdrop-blur-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
          <span>✓ VERIFIED COMPLETE</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STEP 1 (Index 0): MULTI-ENERGY INDUSTRIAL PLANT MAPPING
// ============================================================================
function Step0PlantMappingScene({ isCompleted }: { isCompleted: boolean }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => (p + 1) % 6), 900);
    return () => clearInterval(t);
  }, []);

  const energySources = [
    { id: "ELEC", name: "480V 3-Phase", val: "ACTIVE 68A", color: "#f59e0b", icon: "⚡", x: 60, y: 50 },
    { id: "PNEU", name: "Air Supply", val: "120 PSI", color: "#06b6d4", icon: "💨", x: 240, y: 50 },
    { id: "HYDR", name: "Hydraulic Ram", val: "2500 PSI", color: "#3b82f6", icon: "💧", x: 60, y: 155 },
    { id: "THERM", name: "Steam Jacket", val: "85°C", color: "#ef4444", icon: "🔥", x: 240, y: 155 },
    { id: "MECH", name: "Gravity Ram", val: "2.0 TONS", color: "#8b5cf6", icon: "⚙️", x: 150, y: 35 },
    { id: "CHEM", name: "Acid Reagent", val: "ISOLATED", color: "#10b981", icon: "☣️", x: 150, y: 170 },
  ];

  return (
    <svg viewBox="0 0 320 220" className="w-full h-full max-h-[260px] object-contain">
      <defs>
        <radialGradient id="plantGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Central Industrial Processing Machine Silhouette */}
      <circle cx="150" cy="105" r="75" fill="url(#plantGlow)" />
      <rect x="110" y="65" width="80" height="75" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.8" />
      <rect x="120" y="75" width="60" height="28" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
      <text x="150" y="92" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="900" fontFamily="monospace">
        MACHINE UNIT #4
      </text>
      <text x="150" y="125" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
        6 ENERGY SOURCES
      </text>

      {/* Animated Red Laser Isolation Perimeter */}
      <ellipse cx="150" cy="105" rx="135" ry="85" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="5 4" opacity="0.8">
        <animate attributeName="stroke-dashoffset" from="0" to="36" dur="3s" repeatCount="indefinite" />
      </ellipse>
      <text x="150" y="205" textAnchor="middle" fill="#ef4444" fontSize="7.5" fontWeight="bold" fontFamily="monospace" letterSpacing="1">
        LOTO BOUNDARY PERIMETER · NOTIFY AFFECTED CREW
      </text>

      {/* Energy Source Nodes and Interconnecting Traces */}
      {energySources.map((es, idx) => {
        const isFocused = pulse === idx;
        return (
          <g key={es.id}>
            {/* Connecting bus line to central unit */}
            <line
              x1={es.x}
              y1={es.y}
              x2="150"
              y2="105"
              stroke={isFocused ? es.color : "#334155"}
              strokeWidth={isFocused ? 2 : 1}
              strokeDasharray={isFocused ? "none" : "3 3"}
              opacity={isFocused ? 1 : 0.6}
            />
            {/* Node Card */}
            <rect
              x={es.x - 36}
              y={es.y - 15}
              width="72"
              height="30"
              rx="6"
              fill="#0f172a"
              stroke={isFocused ? es.color : "#475569"}
              strokeWidth={isFocused ? 2 : 1}
              filter={isFocused ? "url(#glow-amber)" : undefined}
            />
            <text x={es.x - 26} y={es.y + 4} fontSize="12">{es.icon}</text>
            <text x={es.x - 8} y={es.y - 3} fill={isFocused ? "#ffffff" : "#cbd5e1"} fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
              {es.name}
            </text>
            <text x={es.x - 8} y={es.y + 8} fill={es.color} fontSize="7" fontWeight="bold" fontFamily="monospace">
              {es.val}
            </text>
          </g>
        );
      })}

      {/* OSHA Standard Badge */}
      <rect x="6" y="196" width="90" height="18" rx="4" fill="#0f172a" stroke="#334155" />
      <text x="51" y="208" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold" fontFamily="monospace">
        OSHA 1910.147(c)(4)
      </text>
    </svg>
  );
}

// ============================================================================
// STEP 2 (Index 1): NORMAL EQUIPMENT SHUTDOWN (DECELERATION & CONTACTOR BREAK)
// ============================================================================
function Step1MotorShutdownScene({ isCompleted }: { isCompleted: boolean }) {
  const [rpm, setRpm] = useState(1750);
  const [amps, setAmps] = useState(68);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStopped(true);
      const interval = setInterval(() => {
        setRpm(r => {
          if (r <= 50) { clearInterval(interval); return 0; }
          return Math.floor(r * 0.75);
        });
        setAmps(a => {
          if (a <= 3) return 0;
          return Math.floor(a * 0.7);
        });
      }, 150);
      return () => clearInterval(interval);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const rotorRotation = stopped ? 0 : 360;

  return (
    <svg viewBox="0 0 320 220" className="w-full h-full max-h-[260px] object-contain">
      <defs>
        <radialGradient id="motorHousing" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>

      {/* Left: Industrial Motor Control Center (MCC) Panel */}
      <rect x="25" y="28" width="115" height="165" rx="8" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
      <rect x="35" y="38" width="95" height="24" rx="4" fill="#090d16" stroke="#334155" />
      <text x="82" y="53" textAnchor="middle" fill="#ef4444" fontSize="8.5" fontWeight="black" fontFamily="monospace">
        MCC STARTER #4
      </text>

      {/* Push Buttons */}
      <circle cx="58" cy="88" r="14" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
      <circle cx="58" cy="88" r="10" fill="#15803d" />
      <text x="58" y="112" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="bold">START</text>

      {/* Active STOP Push Button (Depressed) */}
      <circle cx="106" cy="88" r="14" fill="#1e293b" stroke="#ef4444" strokeWidth="2.5" />
      <circle cx="106" cy="88" r={stopped ? 8 : 10} fill="#dc2626">
        {stopped && <animate attributeName="r" values="10;7;8" dur="0.3s" fill="freeze" />}
      </circle>
      <text x="106" y="112" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="black">STOP</text>

      {/* Digital Ammeter Display */}
      <rect x="40" y="130" width="85" height="38" rx="5" fill="#0f172a" stroke="#475569" />
      <text x="82" y="146" textAnchor="middle" fill={amps > 0 ? "#ef4444" : "#22c55e"} fontSize="14" fontWeight="black" fontFamily="monospace">
        {amps.toFixed(1)} <tspan fontSize="9">A</tspan>
      </text>
      <text x="82" y="160" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
        LOAD CURRENT
      </text>

      {/* Right: 3-Phase Induction Motor Cutaway */}
      <g transform="translate(160, 30)">
        {/* Motor Frame */}
        <rect x="20" y="30" width="115" height="110" rx="16" fill="url(#motorHousing)" stroke="#64748b" strokeWidth="2" />
        
        {/* Cooling Fins */}
        {[38, 52, 66, 80, 94, 108, 122].map((y, i) => (
          <line key={i} x1="14" y1={y} x2="20" y2={y} stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
        ))}

        {/* Terminal Box */}
        <rect x="55" y="14" width="45" height="18" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="77" y="26" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold">3~ 480V</text>

        {/* Rotating Shaft & Rotor */}
        <circle cx="77" cy="85" r="32" fill="#0f172a" stroke={rpm > 0 ? "#ef4444" : "#22c55e"} strokeWidth="2.5" />
        <g transform={`rotate(${rotorRotation} 77 85)`}>
          {rpm > 0 && (
            <animateTransform attributeName="transform" type="rotate" from="0 77 85" to="360 77 85" dur="0.4s" repeatCount="indefinite" />
          )}
          <line x1="77" y1="58" x2="77" y2="112" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="85" x2="104" y2="85" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="77" cy="85" r="8" fill="#475569" />
        </g>

        {/* Live RPM Readout */}
        <rect x="35" y="150" width="85" height="24" rx="4" fill="#0f172a" stroke="#334155" />
        <text x="77" y="165" textAnchor="middle" fill={rpm > 0 ? "#ef4444" : "#22c55e"} fontSize="10" fontWeight="black" fontFamily="monospace">
          {rpm} <tspan fontSize="7">RPM</tspan> {rpm === 0 ? "● AT REST" : "● ROTATING"}
        </text>
      </g>

      {/* Safety Directive Banner */}
      <rect x="25" y="200" width="270" height="16" rx="4" fill="#450a0a" stroke="#ef4444" strokeWidth="0.8" />
      <text x="160" y="211" textAnchor="middle" fill="#fca5a5" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
        {stopped && rpm === 0 ? "✓ MOTION ARRESTED — PROCEED TO POSITIVE ENERGY ISOLATION" : "⚠ WAITING FOR MECHANICAL INERTIA TO DISSIPATE..."}
      </text>
    </svg>
  );
}

// ============================================================================
// STEP 3 (Index 2): ENERGY ISOLATION (400A DISCONNECT & PNEUMATIC BALL VALVE)
// ============================================================================
function Step2PhysicalIsolationScene({ isCompleted }: { isCompleted: boolean }) {
  const [isolated, setIsolated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsolated(true), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <svg viewBox="0 0 320 220" className="w-full h-full max-h-[260px] object-contain">
      <defs>
        <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Left: 400A 3-Phase Rotary Knife Switch Disconnect */}
      <g transform="translate(20, 20)">
        <rect x="0" y="0" width="130" height="175" rx="10" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
        <text x="65" y="20" textAnchor="middle" fill="#8b5cf6" fontSize="8.5" fontWeight="black" fontFamily="monospace">
          400A MAIN DISCONNECT
        </text>

        {/* Incoming Line Busbars (Energized Red) */}
        {[30, 65, 100].map((x, i) => (
          <g key={i}>
            <rect x={x - 4} y="32" width="8" height="28" fill="#ef4444" rx="2" />
            <circle cx={x} cy="60" r="5" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
          </g>
        ))}

        {/* Movable Knife Switch Blades (Animated Opening) */}
        {[30, 65, 100].map((x, i) => {
          const bladeAngle = isolated ? -48 : 0;
          return (
            <g key={i} transform={`translate(${x}, 60)`}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="42"
                stroke={isolated ? "#a78bfa" : "#ef4444"}
                strokeWidth="4"
                strokeLinecap="round"
                transform={`rotate(${bladeAngle})`}
                style={{ transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.4s" }}
              />
            </g>
          );
        })}

        {/* Outgoing Load Contacts */}
        {[30, 65, 100].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy="102" r="5" fill="#1e293b" stroke={isolated ? "#475569" : "#ef4444"} strokeWidth="2" />
            <rect x={x - 4} y="107" width="8" height="25" fill={isolated ? "#334155" : "#ef4444"} rx="2" />
          </g>
        ))}

        {/* Dielectric Air Gap Indicator */}
        {isolated && (
          <g>
            <rect x="20" y="138" width="90" height="24" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
            <text x="65" y="153" textAnchor="middle" fill="#22c55e" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
              ✓ PHYSICAL AIR GAP
            </text>
          </g>
        )}
      </g>

      {/* Right: Pneumatic Quarter-Turn Ball Valve */}
      <g transform="translate(170, 20)">
        <rect x="0" y="0" width="130" height="175" rx="10" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
        <text x="65" y="20" textAnchor="middle" fill="#06b6d4" fontSize="8.5" fontWeight="black" fontFamily="monospace">
          MAIN PNEUMATIC ISOLATION
        </text>

        {/* High-Pressure Pipe */}
        <rect x="15" y="75" width="100" height="26" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        <text x="32" y="91" fill="#06b6d4" fontSize="8" fontWeight="bold">120 PSI IN</text>

        {/* Ball Valve Body */}
        <circle cx="65" cy="88" r="22" fill="#1e293b" stroke="#06b6d4" strokeWidth="3" />
        
        {/* Quarter-Turn Handle (Rotates 90 deg from Parallel to Perpendicular) */}
        <g transform={`translate(65, 88) rotate(${isolated ? 90 : 0})`} style={{ transition: "transform 0.6s ease" }}>
          <rect x="-6" y="-38" width="12" height="42" rx="4" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.5" />
          <circle cx="0" cy="-30" r="3" fill="#ffffff" />
        </g>

        {/* Valve Status Readout */}
        <rect x="15" y="138" width="100" height="24" rx="4" fill="#0f172a" stroke={isolated ? "#22c55e" : "#ef4444"} strokeWidth="1" />
        <text x="65" y="153" textAnchor="middle" fill={isolated ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="bold" fontFamily="monospace">
          {isolated ? "CLOSED (OFF) 90°" : "OPEN (FLOWING)"}
        </text>
      </g>

      {/* Positive Verification Banner */}
      <rect x="20" y="200" width="280" height="16" rx="4" fill={isolated ? "#064e3b" : "#450a0a"} stroke={isolated ? "#10b981" : "#ef4444"} strokeWidth="0.8" />
      <text x="160" y="211" textAnchor="middle" fill={isolated ? "#a7f3d0" : "#fca5a5"} fontSize="7.5" fontWeight="bold" fontFamily="monospace">
        {isolated ? "✓ MULTI-ENERGY POSITIVE DISCONNECTION COMPLETE" : "OPERATING ISOLATING DEVICES..."}
      </text>
    </svg>
  );
}

// ============================================================================
// STEP 4 (Index 3): LOCKOUT / TAGOUT (MASTER LOCK PADLOCK & OSHA DANGER TAG)
// ============================================================================
function Step3LockoutTagoutScene({ isCompleted }: { isCompleted: boolean }) {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLocked(true), 650);
    return () => clearTimeout(t);
  }, []);

  return (
    <svg viewBox="0 0 320 220" className="w-full h-full max-h-[260px] object-contain">
      <defs>
        <linearGradient id="brassKey" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id="padlockBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <filter id="metalSheen" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Disconnect Switch Handle Fixture (Background) */}
      <rect x="35" y="45" width="80" height="135" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
      <rect x="55" y="70" width="40" height="75" rx="4" fill="#0f172a" stroke="#334155" />
      <text x="75" y="62" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
        HASP MOUNT
      </text>

      {/* 6-Hole Heavy-Duty Steel Lockout Hasp */}
      <g transform="translate(68, 75)">
        <path d="M 0 0 C 15 -20, 30 -20, 45 0 L 45 60 C 30 80, 15 80, 0 60 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="22" cy="15" r="5" fill="#0f172a" />
        <circle cx="22" cy="30" r="5" fill="#0f172a" />
        <circle cx="22" cy="45" r="5" fill="#0f172a" />
      </g>

      {/* Master Lock 410 Dielectric Red Safety Padlock (Snaps into Hasp) */}
      <g 
        transform={`translate(75, ${locked ? 115 : 65})`} 
        filter="url(#metalSheen)"
        style={{ transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        {/* Hardened Steel Shackle */}
        <path 
          d="M 12 0 L 12 -28 C 12 -42, 38 -42, 38 -28 L 38 0" 
          fill="none" 
          stroke="#cbd5e1" 
          strokeWidth="6" 
          strokeLinecap="round" 
        />
        {/* Red Padlock Xenoy Body */}
        <rect x="0" y="0" width="50" height="60" rx="8" fill="url(#padlockBody)" stroke="#fca5a5" strokeWidth="1.5" />
        {/* Keyhole and Engravings */}
        <circle cx="25" cy="24" r="8" fill="#450a0a" />
        <path d="M 23 24 L 27 24 L 28 36 L 22 36 Z" fill="#450a0a" />
        <text x="25" y="50" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="black" fontFamily="sans-serif">
          MASTER LOCK
        </text>
      </g>

      {/* OSHA 1910.147 Compliant Danger Tag */}
      <g 
        transform="translate(165, 30)" 
        filter="url(#metalSheen)"
        style={{ opacity: locked ? 1 : 0.2, transition: "opacity 0.6s ease" }}
      >
        {/* Eyelet Cord */}
        <path d="M -15 35 Q 0 20, 15 25" fill="none" stroke="#f97316" strokeWidth="2.5" />
        {/* Tag Body */}
        <path d="M 15 25 L 30 10 L 125 10 L 125 160 L 15 160 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="30" cy="25" r="4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />

        {/* DANGER Header Strip */}
        <path d="M 30 10 L 125 10 L 125 50 L 15 50 L 15 25 Z" fill="#dc2626" />
        <ellipse cx="70" cy="30" rx="35" ry="12" fill="#ffffff" />
        <text x="70" y="34" textAnchor="middle" fill="#dc2626" fontSize="10" fontWeight="black" fontFamily="sans-serif">
          DANGER
        </text>

        {/* Tag Directives */}
        <text x="70" y="65" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="black" fontFamily="sans-serif">
          DO NOT OPERATE
        </text>
        <line x1="25" y1="72" x2="115" y2="72" stroke="#dc2626" strokeWidth="1.5" />

        {/* Form Fields */}
        <text x="25" y="85" fill="#475569" fontSize="6.5" fontWeight="bold">EQUIPMENT: #4 FEEDER</text>
        <text x="25" y="100" fill="#475569" fontSize="6.5" fontWeight="bold">LOCKED BY: A. SHARMA</text>
        <text x="25" y="115" fill="#475569" fontSize="6.5" fontWeight="bold">DEPT: ELECTRICAL SAFE</text>
        <text x="25" y="130" fill="#475569" fontSize="6.5" fontWeight="bold">DATE: 2026-09-06</text>

        {/* Bottom Warning */}
        <rect x="20" y="140" width="100" height="15" fill="#0f172a" rx="2" />
        <text x="70" y="151" textAnchor="middle" fill="#fca5a5" fontSize="6" fontWeight="bold">
          DO NOT REMOVE THIS TAG
        </text>
      </g>

      {/* Bottom Status Bar */}
      <rect x="25" y="196" width="270" height="18" rx="4" fill="#0f172a" stroke="#334155" />
      <text x="160" y="208" textAnchor="middle" fill={locked ? "#22c55e" : "#f59e0b"} fontSize="8" fontWeight="black" fontFamily="monospace">
        {locked ? "🔒 PERSONAL PADLOCK & DANGER TAG POSITIVELY ATTACHED" : "APPLYING LOCKOUT DEVICE..."}
      </text>
    </svg>
  );
}

// ============================================================================
// STEP 5 (Index 4): STORED ENERGY RELEASE (PNEUMATIC PLUME & VFD DC BUS BLEED)
// ============================================================================
function Step4StoredEnergyBleedScene({ isCompleted }: { isCompleted: boolean }) {
  const [psi, setPsi] = useState(120);
  const [voltsDC, setVoltsDC] = useState(680);

  useEffect(() => {
    const timer = setInterval(() => {
      setPsi(p => Math.max(0, p - 6));
      setVoltsDC(v => Math.max(0, Math.floor(v * 0.88 - 4)));
    }, 180);
    return () => clearInterval(timer);
  }, []);

  const needleAngle = -135 + (psi / 120) * 270;
  const isBled = psi === 0 && voltsDC === 0;

  return (
    <svg viewBox="0 0 320 220" className="w-full h-full max-h-[260px] object-contain">
      <defs>
        <linearGradient id="gaugeFace" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Left: Pneumatic Accumulator Exhaust & Pressure Gauge */}
      <g transform="translate(20, 20)">
        <rect x="0" y="0" width="130" height="170" rx="8" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
        <text x="65" y="18" textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="black" fontFamily="monospace">
          PRESSURE BLEED VALVE
        </text>

        {/* Circular Glycerine Pressure Gauge */}
        <circle cx="65" cy="72" r="42" fill="url(#gaugeFace)" stroke="#334155" strokeWidth="3" />
        {/* Scale Arc */}
        <path d="M 35 95 A 35 35 0 1 1 95 95" fill="none" stroke="#475569" strokeWidth="4" />
        {/* Needle */}
        <g transform={`translate(65, 72) rotate(${needleAngle})`}>
          <line x1="0" y1="0" x2="0" y2="-32" stroke={psi > 10 ? "#ef4444" : "#22c55e"} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="4" fill="#ffffff" />
        </g>
        {/* Digital Value */}
        <text x="65" y="100" textAnchor="middle" fill={psi > 10 ? "#ef4444" : "#22c55e"} fontSize="12" fontWeight="black" fontFamily="monospace">
          {psi} <tspan fontSize="7">PSI</tspan>
        </text>

        {/* Venting Valve with Animated Exhaust Plume Particles */}
        <rect x="45" y="122" width="40" height="18" rx="3" fill="#0f172a" stroke="#06b6d4" />
        <text x="65" y="134" textAnchor="middle" fill="#06b6d4" fontSize="7" fontWeight="bold">
          VENT VALVE
        </text>
        {psi > 0 && (
          <g opacity="0.8">
            <line x1="65" y1="140" x2="65" y2="160" stroke="#06b6d4" strokeWidth="3" strokeDasharray="3 2">
              <animate attributeName="stroke-dashoffset" from="0" to="10" dur="0.2s" repeatCount="indefinite" />
            </line>
            <circle cx="60" cy="155" r="3" fill="#06b6d4" opacity="0.5" />
            <circle cx="70" cy="150" r="2.5" fill="#06b6d4" opacity="0.6" />
          </g>
        )}
      </g>

      {/* Right: VFD DC Bus Stored Capacitance Bleed */}
      <g transform="translate(170, 20)">
        <rect x="0" y="0" width="130" height="170" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
        <text x="65" y="18" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="black" fontFamily="monospace">
          VFD DC BUS CAPACITOR
        </text>

        {/* High Voltage Capacitors */}
        <rect x="25" y="32" width="35" height="50" rx="5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
        <rect x="70" y="32" width="35" height="50" rx="5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="42" y="58" textAnchor="middle" fill="#f59e0b" fontSize="14">⚡</text>
        <text x="87" y="58" textAnchor="middle" fill="#f59e0b" fontSize="14">⚡</text>

        {/* Residual Voltage Display */}
        <rect x="18" y="92" width="94" height="32" rx="4" fill="#090d16" stroke="#475569" />
        <text x="65" y="108" textAnchor="middle" fill={voltsDC > 15 ? "#ef4444" : "#22c55e"} fontSize="13" fontWeight="black" fontFamily="monospace">
          {voltsDC} <tspan fontSize="8">V DC</tspan>
        </text>
        <text x="65" y="120" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">
          STORED CHARGE
        </text>

        {/* Discharge Resistor & Grounding Clamp */}
        <rect x="25" y="132" width="80" height="25" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
        <text x="65" y="145" textAnchor="middle" fill="#22c55e" fontSize="7" fontWeight="bold">
          BLEEDER RESISTOR
        </text>
        <text x="65" y="153" textAnchor="middle" fill="#86efac" fontSize="6" fontFamily="monospace">
          {voltsDC === 0 ? "✓ 0V SAFE GROUND" : "DISSIPATING..."}
        </text>
      </g>

      {/* Status Directive Banner */}
      <rect x="20" y="196" width="280" height="18" rx="4" fill={isBled ? "#064e3b" : "#450a0a"} stroke={isBled ? "#10b981" : "#ef4444"} strokeWidth="0.8" />
      <text x="160" y="208" textAnchor="middle" fill={isBled ? "#a7f3d0" : "#fca5a5"} fontSize="7.5" fontWeight="bold" fontFamily="monospace">
        {isBled ? "✓ ALL STORED MECHANICAL & RESIDUAL ELECTRICAL ENERGY VENTED" : "⚠ PURGING STORED ENERGY (WAIT UNTIL PRESSURE & VOLTAGE = 0)"}
      </text>
    </svg>
  );
}

// ============================================================================
// STEP 6 (Index 5): ZERO-ENERGY VERIFICATION ("LIVE-DEAD-LIVE" & TRY-STEP)
// ============================================================================
function Step5ZeroEnergyVerifyScene({ isCompleted }: { isCompleted: boolean }) {
  const [reading, setReading] = useState(240);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setReading(v => Math.max(0, v - 15));
    }, 180);
    const tryTimer = setTimeout(() => setTried(true), 1200);
    return () => { clearInterval(timer); clearTimeout(tryTimer); };
  }, []);

  const isSafe = reading === 0;

  return (
    <svg viewBox="0 0 320 220" className="w-full h-full max-h-[260px] object-contain">
      <defs>
        <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Green Dielectric Zero-Energy Protective Aura */}
      {isSafe && (
        <rect x="15" y="15" width="290" height="175" rx="14" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 3" filter="url(#greenGlow)">
          <animate attributeName="stroke-dashoffset" from="0" to="36" dur="3s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Left: Calibrated Industrial Digital Multimeter */}
      <g transform="translate(25, 25)">
        {/* Multimeter Body (Rugged Yellow/Dark Grey Fluke Style) */}
        <rect x="0" y="0" width="110" height="155" rx="10" fill="#1e293b" stroke="#eab308" strokeWidth="2.5" />
        <rect x="10" y="12" width="90" height="52" rx="4" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
        
        {/* LCD Display */}
        <text x="55" y="44" textAnchor="middle" fill={isSafe ? "#22c55e" : "#ef4444"} fontSize="18" fontWeight="black" fontFamily="monospace">
          {reading.toFixed(1)}
        </text>
        <text x="55" y="58" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
          VOLTS AC (L1-L2)
        </text>

        {/* Rotary Function Dial */}
        <circle cx="55" cy="92" r="16" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="55" y1="92" x2="55" y2="80" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />

        {/* Jack Terminals */}
        <circle cx="38" cy="130" r="5" fill="#ef4444" stroke="#fca5a5" strokeWidth="1" />
        <circle cx="72" cy="130" r="5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
      </g>

      {/* Multimeter Probes Touching 3-Phase Terminals */}
      <g transform="translate(155, 25)">
        <rect x="0" y="0" width="135" height="95" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        <text x="67" y="18" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
          ISOLATED LOAD BUSBARS
        </text>

        {/* L1, L2, L3 Copper Lugs */}
        {[{ name: "L1", x: 25 }, { name: "L2", x: 67 }, { name: "L3", x: 110 }].map((lug, i) => (
          <g key={i}>
            <rect x={lug.x - 8} y="28" width="16" height="35" rx="2" fill="#ca8a04" stroke="#fef08a" strokeWidth="1" />
            <text x={lug.x} y="48" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="black">{lug.name}</text>
          </g>
        ))}

        {/* Red Probe touching L1 */}
        <path d="M -15 130 Q -5 90, 25 55" fill="none" stroke="#ef4444" strokeWidth="2.5" />
        <line x1="25" y1="55" x2="25" y2="40" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        <circle cx="25" cy="38" r="2.5" fill="#ffffff" />

        {/* Black Probe touching L2 */}
        <path d="M 20 130 Q 35 90, 67 55" fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="67" y1="55" x2="67" y2="40" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
        <circle cx="67" cy="38" r="2.5" fill="#ffffff" />

        {/* Safe Verification Badge */}
        <rect x="15" y="70" width="105" height="18" rx="3" fill="#0f172a" stroke={isSafe ? "#22c55e" : "#ef4444"} strokeWidth="1" />
        <text x="67" y="82" textAnchor="middle" fill={isSafe ? "#22c55e" : "#ef4444"} fontSize="7" fontWeight="black" fontFamily="monospace">
          {isSafe ? "✓ 0.00V TEST-BEFORE-TOUCH" : "TESTING VOLTAGE..."}
        </text>
      </g>

      {/* "TRY" Bump Test Button (Attempt to Restart) */}
      <g transform="translate(155, 130)">
        <rect x="0" y="0" width="135" height="50" rx="6" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
        <circle cx="30" cy="25" r="14" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
        <circle cx="30" cy="25" r="10" fill="#15803d" />
        <text x="30" y="28" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">TRY</text>

        <text x="82" y="20" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
          START ATTEMPT
        </text>
        <text x="82" y="34" textAnchor="middle" fill="#22c55e" fontSize="7" fontWeight="black" fontFamily="monospace">
          {tried ? "● ZERO PICKUP (0A)" : "DEPRESSING..."}
        </text>
      </g>

      {/* Bottom Summary Bar */}
      <rect x="20" y="196" width="280" height="18" rx="4" fill={isSafe ? "#064e3b" : "#450a0a"} stroke={isSafe ? "#10b981" : "#ef4444"} strokeWidth="0.8" />
      <text x="160" y="208" textAnchor="middle" fill={isSafe ? "#a7f3d0" : "#fca5a5"} fontSize="7.5" fontWeight="bold" fontFamily="monospace">
        {isSafe ? "✓ ZERO ENERGY CONDITION VERIFIED · SAFE FOR SERVICING" : "⚠ NEVER TOUCH EQUIPMENT BEFORE PROVING ZERO VOLTAGE"}
      </text>
    </svg>
  );
}
