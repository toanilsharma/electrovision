import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { assessmentAudio } from "@/src/utils/assessmentSound";

// Web Audio sound synthesizer for mechanical & industrial sounds
class LOTOSoundEngine {
  private ctx: AudioContext | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private isHumPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public startAmbientHum() {
    try {
      this.initCtx();
      if (!this.ctx || this.isHumPlaying) return;
      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();
      
      this.humOsc.type = 'sawtooth';
      this.humOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.humGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      this.humOsc.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);

      this.humOsc.start();
      this.isHumPlaying = true;
    } catch (e) {}
  }

  public stopAmbientHum() {
    try {
      if (this.humGain && this.ctx) {
        this.humGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
      }
      setTimeout(() => {
        if (this.humOsc) {
          try { this.humOsc.stop(); } catch(e) {}
          this.humOsc.disconnect();
          this.humOsc = null;
        }
        this.isHumPlaying = false;
      }, 300);
    } catch (e) {
      this.isHumPlaying = false;
    }
  }

  public isHumming(): boolean {
    return this.isHumPlaying;
  }

  public playSwitchClack() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  public playPadlockSnap() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {}
  }

  public playAirHiss() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  }

  public playMeterBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  public playClick() {
    try {
      this.initCtx();
      if (!this.ctx) {
        assessmentAudio.playClick();
        return;
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch (e) {
      assessmentAudio.playClick();
    }
  }
}

export const lotoAudio = new LOTOSoundEngine();

interface LOTOMachineryVisualEngineProps {
  step: number; // 0 to 5
  isCompleted: boolean;
  color: string;
  onStepAccomplished?: (stepIndex: number) => void;
}

export function LOTOMachineryVisualEngine({
  step,
  isCompleted,
  color,
  onStepAccomplished
}: LOTOMachineryVisualEngineProps) {
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-between select-none bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl p-2.5 shadow-inner">
      {/* Precision Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1.5px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Persistent Industrial HUD Bar */}
      <div className="w-full shrink-0 flex items-center justify-between px-3 py-1.5 z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: color }} />
          <span className="text-[10px] md:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-950/90 border border-slate-700/80 text-slate-200 backdrop-blur-sm shadow-sm">
            INTERACTIVE MACHINERY SIMULATOR · OSHA 1910.147
          </span>
        </div>

        {isCompleted && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 font-mono text-[10px] md:text-xs font-black uppercase tracking-wider backdrop-blur-sm shadow-[0_0_12px_rgba(16,185,129,0.4)]">
            <span>✓ VERIFIED COMPLETE</span>
          </div>
        )}
      </div>

      {/* Main Interactive Canvas */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center relative overflow-hidden z-10 px-1 py-1">
        {step === 0 && <Step0InteractivePlant onComplete={() => onStepAccomplished?.(0)} />}
        {step === 1 && <Step1InteractiveMotor onComplete={() => onStepAccomplished?.(1)} />}
        {step === 2 && <Step2InteractiveIsolation onComplete={() => onStepAccomplished?.(2)} />}
        {step === 3 && <Step3InteractiveLockoutTagout onComplete={() => onStepAccomplished?.(3)} />}
        {step === 4 && <Step4InteractiveStoredEnergy onComplete={() => onStepAccomplished?.(4)} />}
        {step === 5 && <Step5InteractiveZeroVerify onComplete={() => onStepAccomplished?.(5)} />}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 1 (Index 0): INTERACTIVE PLANT ENERGY MAPPING
// User clicks each of the 6 energy sources to inspect and acknowledge them.
// ============================================================================
function Step0InteractivePlant({ onComplete }: { onComplete: () => void }) {
  const [inspected, setInspected] = useState<Set<string>>(new Set());

  const energySources = [
    { id: "ELEC", name: "480V 3-Phase", val: "ACTIVE 68A", color: "#f59e0b", icon: "⚡", x: 95, y: 75 },
    { id: "MECH", name: "Gravity Ram", val: "2.0 TONS", color: "#8b5cf6", icon: "⚙️", x: 260, y: 45 },
    { id: "PNEU", name: "Air Supply", val: "120 PSI", color: "#06b6d4", icon: "💨", x: 425, y: 75 },
    { id: "HYDR", name: "Hydraulic Ram", val: "2500 PSI", color: "#3b82f6", icon: "💧", x: 95, y: 245 },
    { id: "CHEM", name: "Acid Reagent", val: "ISOLATED", color: "#10b981", icon: "☣️", x: 260, y: 275 },
    { id: "THERM", name: "Steam Jacket", val: "85°C", color: "#ef4444", icon: "🔥", x: 425, y: 245 },
  ];

  const handleInspect = (id: string) => {
    lotoAudio.playClick();
    setInspected(prev => {
      const next = new Set([...prev, id]);
      if (next.size === energySources.length) {
        assessmentAudio.playCorrectChime();
        onComplete();
      }
      return next;
    });
  };

  const handleInspectAll = () => {
    lotoAudio.playClick();
    const all = new Set(energySources.map(e => e.id));
    setInspected(all);
    assessmentAudio.playCorrectChime();
    onComplete();
  };

  const allDone = inspected.size === energySources.length;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      <svg viewBox="0 0 520 320" className="w-full h-full object-contain filter drop-shadow-md">
        <defs>
          <radialGradient id="plantGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Center Glow Area */}
        <circle cx="260" cy="160" r="115" fill="url(#plantGlow)" />

        {/* Outer Laser Perimeter */}
        <ellipse cx="260" cy="160" rx="220" ry="135" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="8 6" opacity="0.85">
          <animate attributeName="stroke-dashoffset" from="0" to="56" dur="3s" repeatCount="indefinite" />
        </ellipse>

        {/* Center Machine Unit */}
        <rect x="195" y="105" width="130" height="110" rx="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
        <rect x="205" y="115" width="110" height="28" rx="6" fill="#0f172a" stroke="#334155" />
        <text x="260" y="134" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="900" fontFamily="monospace">
          MACHINE UNIT #4
        </text>
        <circle cx="260" cy="165" r="18" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
        <text x="260" y="170" textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="bold">🏭</text>
        <text x="260" y="202" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">
          {inspected.size}/6 MAPPED
        </text>

        {/* Energy Source Nodes */}
        {energySources.map(es => {
          const isDone = inspected.has(es.id);
          return (
            <g
              key={es.id}
              onClick={() => handleInspect(es.id)}
              className="cursor-pointer transition-transform hover:scale-105"
            >
              {/* Conduit Connection Line */}
              <line
                x1={es.x}
                y1={es.y}
                x2="260"
                y2="160"
                stroke={isDone ? "#22c55e" : es.color}
                strokeWidth={isDone ? 2.5 : 1.8}
                strokeDasharray={isDone ? "none" : "5 4"}
                opacity={isDone ? 1 : 0.8}
              />
              {/* Node Card Box */}
              <rect
                x={es.x - 65}
                y={es.y - 23}
                width="130"
                height="46"
                rx="8"
                fill={isDone ? "#064e3b" : "#0f172a"}
                stroke={isDone ? "#22c55e" : es.color}
                strokeWidth={isDone ? 2.5 : 1.8}
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
              />
              <text x={es.x - 48} y={es.y + 6} fontSize="18">{es.icon}</text>
              <text x={es.x - 22} y={es.y - 4} fill="#ffffff" fontSize="11.5" fontWeight="bold">
                {es.name}
              </text>
              <text
                x={es.x - 22}
                y={es.y + 13}
                fill={isDone ? "#86efac" : es.color}
                fontSize="10.5"
                fontWeight="black"
                fontFamily="monospace"
              >
                {isDone ? "✓ IDENTIFIED" : es.val}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-950/90 border-t border-slate-800 rounded-b-xl shrink-0">
        <span className="text-xs md:text-sm text-amber-300 font-mono font-bold flex items-center gap-1.5">
          <span>👉</span> {allDone ? "✓ All 6 Energy Sources Mapped & Identified!" : "Click each energy node to verify identification"}
        </span>
        {!allDone && (
          <button
            onClick={handleInspectAll}
            className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/60 text-amber-300 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Identify All
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 2 (Index 1): INTERACTIVE MOTOR SHUTDOWN
// User clicks the red industrial STOP button on the MCC starter.
// ============================================================================
function Step1InteractiveMotor({ onComplete }: { onComplete: () => void }) {
  const [stopped, setStopped] = useState(false);
  const [rpm, setRpm] = useState(1750);
  const [amps, setAmps] = useState(68);

  const handleStopPress = () => {
    if (stopped) return;
    setStopped(true);
    lotoAudio.playSwitchClack();

    const interval = setInterval(() => {
      setRpm(r => {
        if (r <= 40) {
          clearInterval(interval);
          assessmentAudio.playCorrectChime();
          onComplete();
          return 0;
        }
        return Math.floor(r * 0.72);
      });
      setAmps(a => (a <= 2 ? 0 : Math.floor(a * 0.65)));
    }, 120);
  };

  const rotorRotation = stopped ? 0 : 360;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      <svg viewBox="0 0 520 320" className="w-full h-full object-contain filter drop-shadow-md">
        <defs>
          <radialGradient id="motorHousing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        {/* Left: Industrial MCC Starter Panel */}
        <rect x="25" y="15" width="220" height="280" rx="12" fill="#1e293b" stroke="#ef4444" strokeWidth="2.5" />
        <rect x="38" y="28" width="194" height="32" rx="6" fill="#090d16" stroke="#334155" />
        <text x="135" y="49" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="black" fontFamily="monospace">
          MCC STARTER #4 · 480V
        </text>

        {/* START Button (Inactive) */}
        <circle cx="85" cy="115" r="22" fill="#1e293b" stroke="#22c55e" strokeWidth="2.5" />
        <circle cx="85" cy="115" r="16" fill="#15803d" opacity={stopped ? 0.35 : 1} />
        <text x="85" y="148" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">START</text>

        {/* INTERACTIVE EMERGENCY STOP PUSH BUTTON */}
        <g onClick={handleStopPress} className="cursor-pointer group">
          <circle cx="175" cy="115" r="26" fill="#1e293b" stroke="#ef4444" strokeWidth={stopped ? 2.5 : 3.5} className="group-hover:scale-105 transition-transform" />
          <circle cx="175" cy="115" r={stopped ? 13 : 19} fill="#dc2626" className="transition-all" />
          {!stopped && (
            <circle cx="175" cy="115" r="32" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" className="animate-spin" />
          )}
          <text x="175" y="152" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="black">
            {stopped ? "STOPPED" : "CLICK STOP"}
          </text>
        </g>

        {/* High-Contrast Digital Ammeter */}
        <rect x="38" y="170" width="194" height="68" rx="8" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
        <text x="135" y="208" textAnchor="middle" fill={amps > 0 ? "#ef4444" : "#22c55e"} fontSize="28" fontWeight="black" fontFamily="monospace">
          {amps.toFixed(1)} <tspan fontSize="16">A</tspan>
        </text>
        <text x="135" y="226" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
          MOTOR LOAD CURRENT
        </text>

        {/* Feeder Status Bar */}
        <rect x="38" y="250" width="194" height="28" rx="6" fill="#0f172a" stroke="#334155" />
        <text x="135" y="268" textAnchor="middle" fill={stopped ? "#86efac" : "#fca5a5"} fontSize="10" fontWeight="bold" fontFamily="monospace">
          {stopped ? "✓ MOTOR DE-ENERGIZED" : "● RUNNING AT RATED LOAD"}
        </text>

        {/* Right: 3-Phase Induction Motor Cutaway */}
        <g transform="translate(265, 15)">
          <rect x="15" y="30" width="220" height="195" rx="20" fill="url(#motorHousing)" stroke="#64748b" strokeWidth="2.5" />
          {[48, 70, 92, 114, 136, 158, 180, 202].map((y, i) => (
            <line key={i} x1="5" y1={y} x2="15" y2={y} stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          ))}
          {/* Terminal Box */}
          <rect x="85" y="10" width="80" height="26" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
          <text x="125" y="27" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold">3~ 480V AC</text>

          {/* Stator & Rotor */}
          <circle cx="125" cy="128" r="56" fill="#0f172a" stroke={rpm > 0 ? "#ef4444" : "#22c55e"} strokeWidth="3.5" />
          <g transform={`rotate(${rotorRotation} 125 128)`}>
            {rpm > 0 && (
              <animateTransform attributeName="transform" type="rotate" from="0 125 128" to="360 125 128" dur="0.4s" repeatCount="indefinite" />
            )}
            <line x1="125" y1="80" x2="125" y2="176" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            <line x1="77" y1="128" x2="173" y2="128" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            <circle cx="125" cy="128" r="14" fill="#475569" />
          </g>

          {/* Tachometer Readout */}
          <rect x="15" y="238" width="220" height="42" rx="8" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
          <text x="125" y="265" textAnchor="middle" fill={rpm > 0 ? "#ef4444" : "#22c55e"} fontSize="15" fontWeight="black" fontFamily="monospace">
            {rpm} RPM {rpm === 0 ? "● SHAFT AT REST" : "● ROTATING"}
          </text>
        </g>
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-950/90 border-t border-slate-800 rounded-b-xl shrink-0">
        <span className="text-xs md:text-sm text-red-300 font-mono font-bold flex items-center gap-1.5">
          <span>👉</span> {stopped && rpm === 0 ? "✓ Motor completely stopped! Ready for positive isolation." : "Click the red STOP button on MCC Starter #4"}
        </span>
        {!stopped && (
          <button
            onClick={handleStopPress}
            className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Press STOP
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 3 (Index 2): INTERACTIVE ENERGY ISOLATION
// User pulls the 400A knife switch handle & turns the pneumatic valve 90°.
// ============================================================================
function Step2InteractiveIsolation({ onComplete }: { onComplete: () => void }) {
  const [switchOpen, setSwitchOpen] = useState(false);
  const [valveClosed, setValveClosed] = useState(false);

  const toggleSwitch = () => {
    lotoAudio.playSwitchClack();
    const next = !switchOpen;
    setSwitchOpen(next);
    if (next && valveClosed) {
      assessmentAudio.playCorrectChime();
      onComplete();
    }
  };

  const toggleValve = () => {
    lotoAudio.playAirHiss();
    const next = !valveClosed;
    setValveClosed(next);
    if (switchOpen && next) {
      assessmentAudio.playCorrectChime();
      onComplete();
    }
  };

  const handleIsolateAll = () => {
    lotoAudio.playSwitchClack();
    setSwitchOpen(true);
    setValveClosed(true);
    assessmentAudio.playCorrectChime();
    onComplete();
  };

  const allIsolated = switchOpen && valveClosed;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      <svg viewBox="0 0 520 320" className="w-full h-full object-contain filter drop-shadow-md">
        {/* Left: 400A Disconnect Knife Switch */}
        <g transform="translate(20, 15)">
          <rect x="0" y="0" width="225" height="285" rx="12" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2.5" />
          <text x="112" y="32" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="black" fontFamily="monospace">
            400A MAIN DISCONNECT
          </text>

          {/* Line Busbars (3-Phase L1, L2, L3) */}
          {[48, 112, 176].map((x, i) => (
            <g key={i}>
              <rect x={x - 7} y="44" width="14" height="34" fill="#ef4444" rx="3" />
              <circle cx={x} cy="78" r="7" fill="#1e293b" stroke="#ef4444" strokeWidth="2.5" />
            </g>
          ))}

          {/* Interactive Knife Switch Blades */}
          {[48, 112, 176].map((x, i) => (
            <g key={i} transform={`translate(${x}, 78)`}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="58"
                stroke={switchOpen ? "#a78bfa" : "#ef4444"}
                strokeWidth="5"
                strokeLinecap="round"
                transform={`rotate(${switchOpen ? -48 : 0})`}
                style={{ transition: "transform 0.4s ease, stroke 0.3s" }}
              />
            </g>
          ))}

          {/* Load Contacts */}
          {[48, 112, 176].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy="136" r="7" fill="#1e293b" stroke={switchOpen ? "#475569" : "#ef4444"} strokeWidth="2.5" />
              <rect x={x - 7} y="143" width="14" height="30" fill={switchOpen ? "#334155" : "#ef4444"} rx="3" />
            </g>
          ))}

          {/* Air Gap Verification Status */}
          <rect x="20" y="185" width="185" height="24" rx="5" fill="#090d16" stroke="#334155" />
          <text x="112" y="201" textAnchor="middle" fill={switchOpen ? "#86efac" : "#fca5a5"} fontSize="10" fontWeight="bold" fontFamily="monospace">
            {switchOpen ? "AIR GAP VISUALLY CONFIRMED" : "CONTACTS CLOSED (LIVE 480V)"}
          </text>

          {/* Interactive Handle Trigger Button */}
          <g onClick={toggleSwitch} className="cursor-pointer group">
            <rect x="20" y="220" width="185" height="48" rx="8" fill={switchOpen ? "#064e3b" : "#450a0a"} stroke={switchOpen ? "#22c55e" : "#ef4444"} strokeWidth="2" className="group-hover:opacity-90 transition-opacity" />
            <text x="112" y="249" textAnchor="middle" fill={switchOpen ? "#a7f3d0" : "#fca5a5"} fontSize="11" fontWeight="black" fontFamily="monospace">
              {switchOpen ? "✓ DISCONNECTED (OPEN)" : "👉 PULL LEVER TO OPEN"}
            </text>
          </g>
        </g>

        {/* Right: Quarter-Turn Pneumatic Ball Valve */}
        <g transform="translate(275, 15)">
          <rect x="0" y="0" width="225" height="285" rx="12" fill="#1e293b" stroke="#06b6d4" strokeWidth="2.5" />
          <text x="112" y="32" textAnchor="middle" fill="#06b6d4" fontSize="12" fontWeight="black" fontFamily="monospace">
            PNEUMATIC LINE ISOLATION
          </text>

          {/* Pipe Body */}
          <rect x="20" y="90" width="185" height="38" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
          <text x="40" y="114" fill="#06b6d4" fontSize="11" fontWeight="bold">120 PSI IN</text>

          {/* Valve Hub & Rotating Handle */}
          <circle cx="112" cy="109" r="30" fill="#1e293b" stroke="#06b6d4" strokeWidth="4" />
          <g transform={`translate(112, 109) rotate(${valveClosed ? 90 : 0})`} style={{ transition: "transform 0.4s ease" }}>
            <rect x="-8" y="-52" width="16" height="58" rx="5" fill="#ef4444" stroke="#fca5a5" strokeWidth="2" />
            <circle cx="0" cy="-40" r="4" fill="#ffffff" />
          </g>

          {/* Valve Status HUD */}
          <rect x="20" y="185" width="185" height="24" rx="5" fill="#090d16" stroke="#334155" />
          <text x="112" y="201" textAnchor="middle" fill={valveClosed ? "#86efac" : "#fca5a5"} fontSize="10" fontWeight="bold" fontFamily="monospace">
            {valveClosed ? "VALVE CLOSED (90° LOCKOUT)" : "VALVE IN-LINE (FLOW OPEN)"}
          </text>

          {/* Interactive Valve Trigger */}
          <g onClick={toggleValve} className="cursor-pointer group">
            <rect x="20" y="220" width="185" height="48" rx="8" fill={valveClosed ? "#064e3b" : "#450a0a"} stroke={valveClosed ? "#22c55e" : "#ef4444"} strokeWidth="2" className="group-hover:opacity-90 transition-opacity" />
            <text x="112" y="249" textAnchor="middle" fill={valveClosed ? "#a7f3d0" : "#fca5a5"} fontSize="11" fontWeight="black" fontFamily="monospace">
              {valveClosed ? "✓ VALVE CLOSED (90° OFF)" : "👉 TURN VALVE 90° (OFF)"}
            </text>
          </g>
        </g>
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-950/90 border-t border-slate-800 rounded-b-xl shrink-0">
        <span className="text-xs md:text-sm text-violet-300 font-mono font-bold flex items-center gap-1.5">
          <span>👉</span> {allIsolated ? "✓ Electrical & Pneumatic Isolation Complete!" : "Pull disconnect switch and turn pneumatic valve to positive OFF"}
        </span>
        {!allIsolated && (
          <button
            onClick={handleIsolateAll}
            className="px-3 py-1 rounded-lg bg-violet-500 hover:bg-violet-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Isolate Both
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 4 (Index 3): INTERACTIVE LOCKOUT / TAGOUT
// User equips hasp, snaps padlock, and attaches danger tag.
// ============================================================================
function Step3InteractiveLockoutTagout({ onComplete }: { onComplete: () => void }) {
  const [haspApplied, setHaspApplied] = useState(false);
  const [padlockApplied, setPadlockApplied] = useState(false);
  const [tagApplied, setTagApplied] = useState(false);

  const handleApplyHasp = () => {
    lotoAudio.playSwitchClack();
    setHaspApplied(true);
  };

  const handleApplyPadlock = () => {
    lotoAudio.playPadlockSnap();
    setPadlockApplied(true);
    if (tagApplied) {
      assessmentAudio.playCorrectChime();
      onComplete();
    }
  };

  const handleApplyTag = () => {
    lotoAudio.playClick();
    setTagApplied(true);
    if (padlockApplied) {
      assessmentAudio.playCorrectChime();
      onComplete();
    }
  };

  const handleApplyAll = () => {
    lotoAudio.playPadlockSnap();
    setHaspApplied(true);
    setPadlockApplied(true);
    setTagApplied(true);
    assessmentAudio.playCorrectChime();
    onComplete();
  };

  const allLocked = haspApplied && padlockApplied && tagApplied;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      <svg viewBox="0 0 520 320" className="w-full h-full object-contain filter drop-shadow-md">
        <defs>
          <linearGradient id="padlockBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>

        {/* Left: Disconnect Switch Fixture & Safety Lockout Device */}
        <g transform="translate(20, 15)">
          <rect x="0" y="0" width="225" height="285" rx="12" fill="#1e293b" stroke="#f97316" strokeWidth="2.5" />
          <text x="112" y="32" textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="black" fontFamily="monospace">
            SAFETY LOCKOUT FIXTURE
          </text>

          {/* Switch Lockout Bezel */}
          <rect x="25" y="50" width="175" height="155" rx="10" fill="#0f172a" stroke="#334155" />
          <text x="112" y="72" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">
            DISCONNECT HANDLE
          </text>

          {/* 6-Hole Steel Hasp */}
          {haspApplied ? (
            <g transform="translate(85, 80)">
              <path d="M 0 0 C 22 -26, 44 -26, 66 0 L 66 85 C 44 110, 22 110, 0 85 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2.5" />
              <circle cx="33" cy="22" r="7" fill="#0f172a" />
              <circle cx="33" cy="45" r="7" fill="#0f172a" />
              <circle cx="33" cy="68" r="7" fill="#0f172a" />
            </g>
          ) : (
            <g onClick={handleApplyHasp} className="cursor-pointer">
              <rect x="35" y="90" width="155" height="58" rx="8" fill="#0f172a" stroke="#f97316" strokeWidth="2" strokeDasharray="5 3" />
              <text x="112" y="125" textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="black">
                👉 1. EQUIP 6-HOLE HASP
              </text>
            </g>
          )}

          {/* Red Safety Master Padlock */}
          {padlockApplied ? (
            <g transform="translate(90, 135)">
              <path d="M 16 0 L 16 -36 C 16 -54, 48 -54, 48 -36 L 48 0" fill="none" stroke="#cbd5e1" strokeWidth="7" strokeLinecap="round" />
              <rect x="0" y="0" width="64" height="68" rx="10" fill="url(#padlockBodyGrad)" stroke="#fca5a5" strokeWidth="2" />
              <circle cx="32" cy="28" r="10" fill="#450a0a" />
              <path d="M 30 28 L 34 28 L 36 44 L 28 44 Z" fill="#450a0a" />
              <text x="32" y="58" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="black">MASTER LOCK</text>
            </g>
          ) : haspApplied ? (
            <g onClick={handleApplyPadlock} className="cursor-pointer">
              <rect x="35" y="145" width="155" height="50" rx="8" fill="#0f172a" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" />
              <text x="112" y="175" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="black">
                👉 2. SNAP MASTER LOCK
              </text>
            </g>
          ) : null}

          {/* Fixture Status Bar */}
          <rect x="20" y="225" width="185" height="42" rx="8" fill="#090d16" stroke="#334155" />
          <text x="112" y="250" textAnchor="middle" fill={haspApplied && padlockApplied ? "#86efac" : "#fca5a5"} fontSize="11" fontWeight="bold" fontFamily="monospace">
            {haspApplied && padlockApplied ? "✓ LOCKOUT FIXTURE LOCKED" : "AWAITING LOCK APPLICATION"}
          </text>
        </g>

        {/* Right: OSHA 1910.147 Compliant Danger Tag */}
        <g transform="translate(265, 15)">
          <rect x="0" y="0" width="235" height="285" rx="12" fill="#1e293b" stroke="#ef4444" strokeWidth="2.5" />
          <text x="117" y="32" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="black" fontFamily="monospace">
            STANDARDIZED DANGER TAG
          </text>

          {tagApplied ? (
            <g transform="translate(15, 45)">
              {/* Lanyard connection wire */}
              <path d="M -15 25 Q 0 10, 20 15" fill="none" stroke="#f97316" strokeWidth="3" />
              {/* Tag body */}
              <rect x="15" y="5" width="175" height="215" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2.5" />
              {/* Red Danger Header */}
              <path d="M 15 5 L 190 5 L 190 60 L 15 60 Z" fill="#dc2626" />
              <ellipse cx="102" cy="32" rx="48" ry="16" fill="#ffffff" />
              <text x="102" y="38" textAnchor="middle" fill="#dc2626" fontSize="15" fontWeight="900">DANGER</text>
              <text x="102" y="80" textAnchor="middle" fill="#0f172a" fontSize="11.5" fontWeight="900">DO NOT OPERATE</text>
              <line x1="28" y1="88" x2="176" y2="88" stroke="#dc2626" strokeWidth="2" />
              
              {/* Printed Fields */}
              <text x="28" y="106" fill="#334155" fontSize="9.5" fontWeight="bold">EQUIP: #4 MOTOR FEEDER</text>
              <text x="28" y="125" fill="#334155" fontSize="9.5" fontWeight="bold">TECH: A. SHARMA (#8841)</text>
              <text x="28" y="144" fill="#334155" fontSize="9.5" fontWeight="bold">DATE: 2026-09-12 · ACTIVE</text>
              <text x="28" y="163" fill="#334155" fontSize="9.5" fontWeight="bold">REASON: SCHEDULED PM</text>

              {/* Status Stamp */}
              <rect x="25" y="180" width="155" height="28" fill="#0f172a" rx="4" />
              <text x="102" y="198" textAnchor="middle" fill="#86efac" fontSize="9.5" fontWeight="black">
                ✓ SIGNED & APPLIED
              </text>
            </g>
          ) : (
            <g onClick={handleApplyTag} className="cursor-pointer">
              <rect x="20" y="55" width="195" height="205" rx="10" fill="#0f172a" stroke="#f97316" strokeWidth="2" strokeDasharray="6 4" />
              <text x="117" y="145" textAnchor="middle" fill="#f97316" fontSize="13" fontWeight="black">
                👉 3. ATTACH DANGER TAG
              </text>
              <text x="117" y="170" textAnchor="middle" fill="#94a3b8" fontSize="11">
                OSHA 1910.147 Authorized Tag
              </text>
            </g>
          )}
        </g>
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-950/90 border-t border-slate-800 rounded-b-xl shrink-0">
        <span className="text-xs md:text-sm text-orange-300 font-mono font-bold flex items-center gap-1.5">
          <span>👉</span> {allLocked ? "✓ Personal Lock & Danger Tag Positively Attached!" : "Equip Hasp, snap Master Lock, and attach Danger Tag"}
        </span>
        {!allLocked && (
          <button
            onClick={handleApplyAll}
            className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Apply All 3
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 5 (Index 4): INTERACTIVE STORED ENERGY RELEASE
// User vents pneumatic valve (120->0 PSI) & discharges VFD DC bus (680->0V).
// ============================================================================
function Step4InteractiveStoredEnergy({ onComplete }: { onComplete: () => void }) {
  const [psi, setPsi] = useState(120);
  const [voltsDC, setVoltsDC] = useState(680);
  const [bleedingAir, setBleedingAir] = useState(false);
  const [dischargingDC, setDischargingDC] = useState(false);

  const startBleedAir = () => {
    if (bleedingAir || psi === 0) return;
    setBleedingAir(true);
    lotoAudio.playAirHiss();

    const t = setInterval(() => {
      setPsi(p => {
        if (p <= 5) {
          clearInterval(t);
          if (voltsDC === 0) {
            assessmentAudio.playCorrectChime();
            onComplete();
          }
          return 0;
        }
        return p - 10;
      });
    }, 120);
  };

  const startDischargeDC = () => {
    if (dischargingDC || voltsDC === 0) return;
    setDischargingDC(true);
    lotoAudio.playSwitchClack();

    const t = setInterval(() => {
      setVoltsDC(v => {
        if (v <= 20) {
          clearInterval(t);
          if (psi === 0) {
            assessmentAudio.playCorrectChime();
            onComplete();
          }
          return 0;
        }
        return Math.floor(v * 0.75 - 5);
      });
    }, 120);
  };

  const handleBleedAll = () => {
    startBleedAir();
    startDischargeDC();
  };

  const needleAngle = -135 + (psi / 120) * 270;
  const allBled = psi === 0 && voltsDC === 0;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      <svg viewBox="0 0 520 320" className="w-full h-full object-contain filter drop-shadow-md">
        {/* Left: Pneumatic Accumulator Pressure Bleed */}
        <g transform="translate(20, 15)">
          <rect x="0" y="0" width="225" height="285" rx="12" fill="#1e293b" stroke="#06b6d4" strokeWidth="2.5" />
          <text x="112" y="32" textAnchor="middle" fill="#06b6d4" fontSize="12" fontWeight="black" fontFamily="monospace">
            PNEUMATIC STORED PRESSURE
          </text>

          {/* Large Analog Pressure Gauge */}
          <circle cx="112" cy="112" r="56" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <path d="M 72 144 A 44 44 0 1 1 152 144" fill="none" stroke="#475569" strokeWidth="5" />
          {/* Needle */}
          <g transform={`translate(112, 112) rotate(${needleAngle})`}>
            <line x1="0" y1="0" x2="0" y2="-42" stroke={psi > 10 ? "#ef4444" : "#22c55e"} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="5" fill="#ffffff" />
          </g>

          {/* Digital Readout */}
          <rect x="25" y="178" width="175" height="38" rx="6" fill="#090d16" stroke="#475569" />
          <text x="112" y="204" textAnchor="middle" fill={psi > 10 ? "#ef4444" : "#22c55e"} fontSize="22" fontWeight="black" fontFamily="monospace">
            {psi} PSI
          </text>

          {/* Interactive Bleed Button */}
          <g onClick={startBleedAir} className="cursor-pointer group">
            <rect x="20" y="224" width="185" height="48" rx="8" fill={psi === 0 ? "#064e3b" : "#0f172a"} stroke={psi === 0 ? "#22c55e" : "#06b6d4"} strokeWidth="2" className="group-hover:opacity-90" />
            <text x="112" y="253" textAnchor="middle" fill={psi === 0 ? "#a7f3d0" : "#06b6d4"} fontSize="11" fontWeight="black" fontFamily="monospace">
              {psi === 0 ? "✓ PRESSURE BLED (0 PSI)" : bleedingAir ? "VENTING AIR..." : "👉 VENT AIR VALVE"}
            </text>
          </g>
        </g>

        {/* Right: VFD DC Bus Stored Capacitor Discharge */}
        <g transform="translate(275, 15)">
          <rect x="0" y="0" width="225" height="285" rx="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
          <text x="112" y="32" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="black" fontFamily="monospace">
            VFD DC BUS STORED ENERGY
          </text>

          {/* Electrolytic Capacitor Graphics */}
          <rect x="42" y="52" width="56" height="74" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <rect x="126" y="52" width="56" height="74" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <text x="70" y="96" textAnchor="middle" fill="#f59e0b" fontSize="22">⚡</text>
          <text x="154" y="96" textAnchor="middle" fill="#f59e0b" fontSize="22">⚡</text>

          {/* Digital DC Voltage Meter */}
          <rect x="25" y="145" width="175" height="65" rx="8" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
          <text x="112" y="182" textAnchor="middle" fill={voltsDC > 15 ? "#ef4444" : "#22c55e"} fontSize="24" fontWeight="black" fontFamily="monospace">
            {voltsDC} V DC
          </text>
          <text x="112" y="200" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
            CAPACITOR STORED CHARGE
          </text>

          {/* Interactive Discharge Button */}
          <g onClick={startDischargeDC} className="cursor-pointer group">
            <rect x="20" y="224" width="185" height="48" rx="8" fill={voltsDC === 0 ? "#064e3b" : "#0f172a"} stroke={voltsDC === 0 ? "#22c55e" : "#f59e0b"} strokeWidth="2" className="group-hover:opacity-90" />
            <text x="112" y="253" textAnchor="middle" fill={voltsDC === 0 ? "#a7f3d0" : "#f59e0b"} fontSize="11" fontWeight="black" fontFamily="monospace">
              {voltsDC === 0 ? "✓ 0V SAFE GROUND" : dischargingDC ? "DISCHARGING..." : "👉 ENGAGE BLEED RESISTOR"}
            </text>
          </g>
        </g>
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-950/90 border-t border-slate-800 rounded-b-xl shrink-0">
        <span className="text-xs md:text-sm text-cyan-300 font-mono font-bold flex items-center gap-1.5">
          <span>👉</span> {allBled ? "✓ Stored pneumatic & electrical energy safely dissipated!" : "Vent air pressure to 0 PSI and discharge capacitor to 0V"}
        </span>
        {!allBled && (
          <button
            onClick={handleBleedAll}
            className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Purge Both
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 6 (Index 5): NFPA 70E "LIVE-DEAD-LIVE" THREE-POINT TEST & TRY STEP
// User probes: 1. Live (230V) -> 2. Dead (0.00V) -> 3. Re-test Live (230V) -> 4. TRY
// ============================================================================
function Step5InteractiveZeroVerify({ onComplete }: { onComplete: () => void }) {
  const [testPhase, setTestPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  // 0 = Idle, 1 = Live1 (230V), 2 = Dead (0.00V), 3 = Live2 (230V), 4 = Tried
  const [voltage, setVoltage] = useState(0);

  const probeLive1 = () => {
    lotoAudio.playMeterBeep();
    setVoltage(230.4);
    setTestPhase(1);
  };

  const probeDead = () => {
    lotoAudio.playMeterBeep();
    setVoltage(0.0);
    setTestPhase(2);
  };

  const probeLive2 = () => {
    lotoAudio.playMeterBeep();
    setVoltage(230.1);
    setTestPhase(3);
  };

  const pressTry = () => {
    lotoAudio.playSwitchClack();
    setTestPhase(4);
    assessmentAudio.playCorrectChime();
    onComplete();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      <svg viewBox="0 0 520 320" className="w-full h-full object-contain filter drop-shadow-md">
        {/* Left: Industrial True-RMS Multimeter */}
        <g transform="translate(20, 15)">
          <rect x="0" y="0" width="185" height="285" rx="14" fill="#1e293b" stroke="#eab308" strokeWidth="3" />
          <rect x="15" y="16" width="155" height="80" rx="6" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
          <text
            x="92"
            y="65"
            textAnchor="middle"
            fill={testPhase === 2 ? "#22c55e" : testPhase === 0 ? "#475569" : "#ef4444"}
            fontSize="28"
            fontWeight="black"
            fontFamily="monospace"
          >
            {voltage.toFixed(1)}
          </text>
          <text x="92" y="86" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
            {testPhase === 2 ? "VOLTS AC (ZERO ENERGY)" : "VOLTS AC (TRUE RMS)"}
          </text>

          {/* Rotary Selector Knob */}
          <circle cx="92" cy="148" r="26" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="92" y1="148" x2="92" y2="128" stroke="#eab308" strokeWidth="4" strokeLinecap="round" />
          <text x="92" y="190" textAnchor="middle" fill="#eab308" fontSize="10" fontWeight="black">V~ AC RANGE</text>

          {/* Input Jacks */}
          <circle cx="65" cy="220" r="9" fill="#ef4444" />
          <circle cx="120" cy="220" r="9" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
          <text x="65" y="240" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">V/Ω</text>
          <text x="120" y="240" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontWeight="bold">COM</text>

          {/* Safety Rating Badge */}
          <rect x="25" y="252" width="135" height="22" rx="4" fill="#090d16" stroke="#334155" />
          <text x="92" y="267" textAnchor="middle" fill="#eab308" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
            CAT IV 600V TESTED
          </text>
        </g>

        {/* Right: Live-Dead-Live Probing Panel */}
        <g transform="translate(225, 15)">
          <rect x="0" y="0" width="275" height="285" rx="12" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
          <text x="137" y="25" textAnchor="middle" fill="#86efac" fontSize="11" fontWeight="black" fontFamily="monospace">
            NFPA 70E LIVE-DEAD-LIVE & TRY PROTOCOL
          </text>

          {/* Phase 1: Known Live Source Socket */}
          <g onClick={testPhase === 0 ? probeLive1 : undefined} className={testPhase === 0 ? "cursor-pointer" : ""}>
            <rect x="15" y="36" width="245" height="52" rx="8" fill={testPhase >= 1 ? "#064e3b" : "#0f172a"} stroke={testPhase === 0 ? "#ef4444" : testPhase >= 1 ? "#22c55e" : "#475569"} strokeWidth={testPhase === 0 ? 2.5 : 1.5} />
            <text x="28" y="66" fill={testPhase >= 1 ? "#86efac" : "#ffffff"} fontSize="11" fontWeight="bold">
              1. KNOWN LIVE SOURCE (230V)
            </text>
            <text x="245" y="66" textAnchor="end" fill={testPhase >= 1 ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="black">
              {testPhase >= 1 ? "✓ 230V" : "👉 TEST"}
            </text>
          </g>

          {/* Phase 2: De-Energized Equipment Terminals */}
          <g onClick={testPhase === 1 ? probeDead : undefined} className={testPhase === 1 ? "cursor-pointer" : ""}>
            <rect x="15" y="96" width="245" height="52" rx="8" fill={testPhase >= 2 ? "#064e3b" : "#0f172a"} stroke={testPhase === 1 ? "#22c55e" : testPhase >= 2 ? "#22c55e" : "#475569"} strokeWidth={testPhase === 1 ? 2.5 : 1.5} />
            <text x="28" y="126" fill={testPhase >= 2 ? "#86efac" : "#ffffff"} fontSize="11" fontWeight="bold">
              2. MACHINE TERMINALS (L1-L2-L3)
            </text>
            <text x="245" y="126" textAnchor="end" fill={testPhase >= 2 ? "#22c55e" : "#f59e0b"} fontSize="12" fontWeight="black">
              {testPhase >= 2 ? "✓ 0.00V" : testPhase === 1 ? "👉 TEST" : "🔒 LOCK"}
            </text>
          </g>

          {/* Phase 3: Re-Verify Known Live Source */}
          <g onClick={testPhase === 2 ? probeLive2 : undefined} className={testPhase === 2 ? "cursor-pointer" : ""}>
            <rect x="15" y="156" width="245" height="52" rx="8" fill={testPhase >= 3 ? "#064e3b" : "#0f172a"} stroke={testPhase === 2 ? "#ef4444" : testPhase >= 3 ? "#22c55e" : "#475569"} strokeWidth={testPhase === 2 ? 2.5 : 1.5} />
            <text x="28" y="186" fill={testPhase >= 3 ? "#86efac" : "#ffffff"} fontSize="11" fontWeight="bold">
              3. RE-VERIFY LIVE SOURCE
            </text>
            <text x="245" y="186" textAnchor="end" fill={testPhase >= 3 ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="black">
              {testPhase >= 3 ? "✓ 230V" : testPhase === 2 ? "👉 TEST" : "🔒 LOCK"}
            </text>
          </g>

          {/* Phase 4: Physical TRY Bump Test */}
          <g onClick={testPhase === 3 ? pressTry : undefined} className={testPhase === 3 ? "cursor-pointer" : ""}>
            <rect x="15" y="216" width="245" height="54" rx="8" fill={testPhase === 4 ? "#064e3b" : "#0f172a"} stroke={testPhase === 3 ? "#22c55e" : testPhase === 4 ? "#22c55e" : "#475569"} strokeWidth={testPhase === 3 ? 2.5 : 1.5} />
            <circle cx="38" cy="243" r="14" fill="#15803d" />
            <text x="38" y="247" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="black">TRY</text>
            <text x="62" y="247" fill={testPhase === 4 ? "#86efac" : "#ffffff"} fontSize="11" fontWeight="bold">
              4. PHYSICAL TRY BUMP TEST
            </text>
            <text x="245" y="247" textAnchor="end" fill={testPhase === 4 ? "#22c55e" : "#22c55e"} fontSize="12" fontWeight="black">
              {testPhase === 4 ? "✓ 0 RPM / 0A" : testPhase === 3 ? "👉 TRY" : "🔒 LOCK"}
            </text>
          </g>
        </g>
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-950/90 border-t border-slate-800 rounded-b-xl shrink-0">
        <span className="text-xs md:text-sm text-emerald-300 font-mono font-bold flex items-center gap-1.5">
          <span>👉</span>
          {testPhase === 0 && "Step 1: Probe Known Live Source (Confirm meter is working)"}
          {testPhase === 1 && "Step 2: Probe Locked-Out Load Terminals (Verify 0.00V)"}
          {testPhase === 2 && "Step 3: Re-probe Live Source (Prove meter did not fail in dead test)"}
          {testPhase === 3 && "Step 4: Press green TRY push-button (Prove machine cannot restart)"}
          {testPhase === 4 && "✓ Zero energy verified & try test passed! Equipment 100% safe."}
        </span>
        {testPhase < 4 && (
          <button
            onClick={() => {
              if (testPhase === 0) probeLive1();
              else if (testPhase === 1) probeDead();
              else if (testPhase === 2) probeLive2();
              else if (testPhase === 3) pressTry();
            }}
            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Execute Next Test
          </button>
        )}
      </div>
    </div>
  );
}
