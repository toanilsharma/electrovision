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
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-between select-none bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-lg p-1.5">
      {/* Precision Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
          backgroundSize: '16px 16px'
        }}
      />

      {/* Persistent Industrial HUD Bar */}
      <div className="w-full shrink-0 flex items-center justify-between px-2 py-1 z-20 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color }} />
          <span className="text-[9px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700/80 text-slate-300 backdrop-blur-sm">
            INTERACTIVE SIMULATOR · OSHA 1910.147
          </span>
        </div>

        {isCompleted && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/80 text-emerald-400 font-mono text-[9px] font-black uppercase tracking-wider backdrop-blur-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
            <span>✓ VERIFIED COMPLETE</span>
          </div>
        )}
      </div>

      {/* Main Interactive Canvas */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center relative overflow-hidden z-10">
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
    { id: "ELEC", name: "480V 3-Phase", val: "ACTIVE 68A", color: "#f59e0b", icon: "⚡", x: 60, y: 50 },
    { id: "PNEU", name: "Air Supply", val: "120 PSI", color: "#06b6d4", icon: "💨", x: 240, y: 50 },
    { id: "HYDR", name: "Hydraulic Ram", val: "2500 PSI", color: "#3b82f6", icon: "💧", x: 60, y: 155 },
    { id: "THERM", name: "Steam Jacket", val: "85°C", color: "#ef4444", icon: "🔥", x: 240, y: 155 },
    { id: "MECH", name: "Gravity Ram", val: "2.0 TONS", color: "#8b5cf6", icon: "⚙️", x: 150, y: 35 },
    { id: "CHEM", name: "Acid Reagent", val: "ISOLATED", color: "#10b981", icon: "☣️", x: 150, y: 170 },
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
      <svg viewBox="0 0 320 205" className="w-full h-full max-h-[240px] object-contain">
        <defs>
          <radialGradient id="plantGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="150" cy="105" r="75" fill="url(#plantGlow)" />
        <rect x="110" y="65" width="80" height="75" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.8" />
        <text x="150" y="92" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="900" fontFamily="monospace">
          MACHINE UNIT #4
        </text>
        <text x="150" y="125" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
          {inspected.size}/6 MAPPED
        </text>

        {/* Animated Laser Perimeter */}
        <ellipse cx="150" cy="105" rx="135" ry="85" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="5 4" opacity="0.8">
          <animate attributeName="stroke-dashoffset" from="0" to="36" dur="3s" repeatCount="indefinite" />
        </ellipse>

        {/* Energy Source Nodes */}
        {energySources.map(es => {
          const isDone = inspected.has(es.id);
          return (
            <g
              key={es.id}
              onClick={() => handleInspect(es.id)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <line
                x1={es.x}
                y1={es.y}
                x2="150"
                y2="105"
                stroke={isDone ? "#22c55e" : es.color}
                strokeWidth={isDone ? 2 : 1}
                strokeDasharray={isDone ? "none" : "3 3"}
              />
              <rect
                x={es.x - 36}
                y={es.y - 15}
                width="72"
                height="30"
                rx="6"
                fill={isDone ? "#064e3b" : "#0f172a"}
                stroke={isDone ? "#22c55e" : es.color}
                strokeWidth={isDone ? 2 : 1}
              />
              <text x={es.x - 26} y={es.y + 4} fontSize="12">{es.icon}</text>
              <text x={es.x - 8} y={es.y - 3} fill="#ffffff" fontSize="7.5" fontWeight="bold">
                {es.name}
              </text>
              <text x={es.x - 8} y={es.y + 8} fill={isDone ? "#86efac" : es.color} fontSize="7" fontWeight="bold" fontFamily="monospace">
                {isDone ? "✓ IDENTIFIED" : es.val}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-950/90 border-t border-slate-800 rounded-b-lg">
        <span className="text-[10px] text-amber-300 font-mono font-bold flex items-center gap-1">
          <span>👉</span> {allDone ? "✓ All 6 Energy Sources Mapped!" : "Click each energy node to verify identification"}
        </span>
        {!allDone && (
          <button
            onClick={handleInspectAll}
            className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/60 text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
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
      <svg viewBox="0 0 320 205" className="w-full h-full max-h-[240px] object-contain">
        <defs>
          <radialGradient id="motorHousing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        {/* Left: Industrial MCC Panel */}
        <rect x="25" y="20" width="115" height="165" rx="8" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
        <rect x="35" y="30" width="95" height="24" rx="4" fill="#090d16" stroke="#334155" />
        <text x="82" y="45" textAnchor="middle" fill="#ef4444" fontSize="8.5" fontWeight="black" fontFamily="monospace">
          MCC STARTER #4
        </text>

        {/* START Button (Inactive) */}
        <circle cx="58" cy="80" r="14" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
        <circle cx="58" cy="80" r="10" fill="#15803d" opacity={stopped ? 0.4 : 1} />
        <text x="58" y="104" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="bold">START</text>

        {/* INTERACTIVE STOP PUSH BUTTON */}
        <g onClick={handleStopPress} className="cursor-pointer group">
          <circle cx="106" cy="80" r="16" fill="#1e293b" stroke="#ef4444" strokeWidth={stopped ? 2 : 3} className="group-hover:scale-105 transition-transform" />
          <circle cx="106" cy="80" r={stopped ? 8 : 12} fill="#dc2626" className="transition-all" />
          {!stopped && (
            <circle cx="106" cy="80" r="18" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" className="animate-spin" />
          )}
          <text x="106" y="104" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="black">
            {stopped ? "STOPPED" : "CLICK STOP"}
          </text>
        </g>

        {/* Digital Ammeter */}
        <rect x="40" y="122" width="85" height="38" rx="5" fill="#0f172a" stroke="#475569" />
        <text x="82" y="138" textAnchor="middle" fill={amps > 0 ? "#ef4444" : "#22c55e"} fontSize="14" fontWeight="black" fontFamily="monospace">
          {amps.toFixed(1)} <tspan fontSize="9">A</tspan>
        </text>
        <text x="82" y="152" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
          LOAD CURRENT
        </text>

        {/* Right: 3-Phase Induction Motor Cutaway */}
        <g transform="translate(160, 22)">
          <rect x="20" y="30" width="115" height="110" rx="16" fill="url(#motorHousing)" stroke="#64748b" strokeWidth="2" />
          {[38, 52, 66, 80, 94, 108, 122].map((y, i) => (
            <line key={i} x1="14" y1={y} x2="20" y2={y} stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
          ))}
          <rect x="55" y="14" width="45" height="18" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="77" y="26" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold">3~ 480V</text>

          {/* Rotor */}
          <circle cx="77" cy="85" r="32" fill="#0f172a" stroke={rpm > 0 ? "#ef4444" : "#22c55e"} strokeWidth="2.5" />
          <g transform={`rotate(${rotorRotation} 77 85)`}>
            {rpm > 0 && (
              <animateTransform attributeName="transform" type="rotate" from="0 77 85" to="360 77 85" dur="0.4s" repeatCount="indefinite" />
            )}
            <line x1="77" y1="58" x2="77" y2="112" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="85" x2="104" y2="85" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="77" cy="85" r="8" fill="#475569" />
          </g>

          <rect x="35" y="148" width="85" height="24" rx="4" fill="#0f172a" stroke="#334155" />
          <text x="77" y="163" textAnchor="middle" fill={rpm > 0 ? "#ef4444" : "#22c55e"} fontSize="10" fontWeight="black" fontFamily="monospace">
            {rpm} RPM {rpm === 0 ? "● AT REST" : "● RUNNING"}
          </text>
        </g>
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-950/90 border-t border-slate-800 rounded-b-lg">
        <span className="text-[10px] text-red-300 font-mono font-bold flex items-center gap-1">
          <span>👉</span> {stopped && rpm === 0 ? "✓ Motor completely stopped! Ready for positive isolation." : "Click the red STOP button on MCC Starter #4"}
        </span>
        {!stopped && (
          <button
            onClick={handleStopPress}
            className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-400 text-slate-950 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
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
      <svg viewBox="0 0 320 205" className="w-full h-full max-h-[240px] object-contain">
        {/* Left: 400A Disconnect Knife Switch */}
        <g transform="translate(20, 15)">
          <rect x="0" y="0" width="130" height="170" rx="10" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
          <text x="65" y="18" textAnchor="middle" fill="#8b5cf6" fontSize="8.5" fontWeight="black" fontFamily="monospace">
            400A MAIN DISCONNECT
          </text>

          {/* Line Busbars */}
          {[30, 65, 100].map((x, i) => (
            <g key={i}>
              <rect x={x - 4} y="28" width="8" height="26" fill="#ef4444" rx="2" />
              <circle cx={x} cy="54" r="5" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
            </g>
          ))}

          {/* Interactive Knife Switch Blades */}
          {[30, 65, 100].map((x, i) => (
            <g key={i} transform={`translate(${x}, 54)`}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="42"
                stroke={switchOpen ? "#a78bfa" : "#ef4444"}
                strokeWidth="4"
                strokeLinecap="round"
                transform={`rotate(${switchOpen ? -48 : 0})`}
                style={{ transition: "transform 0.4s ease, stroke 0.3s" }}
              />
            </g>
          ))}

          {/* Load Contacts */}
          {[30, 65, 100].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy="96" r="5" fill="#1e293b" stroke={switchOpen ? "#475569" : "#ef4444"} strokeWidth="2" />
              <rect x={x - 4} y="101" width="8" height="24" fill={switchOpen ? "#334155" : "#ef4444"} rx="2" />
            </g>
          ))}

          {/* Interactive Handle Trigger Button */}
          <g onClick={toggleSwitch} className="cursor-pointer group">
            <rect x="15" y="132" width="100" height="26" rx="5" fill={switchOpen ? "#064e3b" : "#450a0a"} stroke={switchOpen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" className="group-hover:opacity-90" />
            <text x="65" y="148" textAnchor="middle" fill={switchOpen ? "#a7f3d0" : "#fca5a5"} fontSize="8" fontWeight="black" fontFamily="monospace">
              {switchOpen ? "✓ DISCONNECTED (OPEN)" : "👉 PULL TO DISCONNECT"}
            </text>
          </g>
        </g>

        {/* Right: Quarter-Turn Pneumatic Ball Valve */}
        <g transform="translate(170, 15)">
          <rect x="0" y="0" width="130" height="170" rx="10" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
          <text x="65" y="18" textAnchor="middle" fill="#06b6d4" fontSize="8.5" fontWeight="black" fontFamily="monospace">
            PNEUMATIC ISOLATION
          </text>

          <rect x="15" y="70" width="100" height="26" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <text x="32" y="86" fill="#06b6d4" fontSize="8" fontWeight="bold">120 PSI IN</text>

          <circle cx="65" cy="83" r="22" fill="#1e293b" stroke="#06b6d4" strokeWidth="3" />
          <g transform={`translate(65, 83) rotate(${valveClosed ? 90 : 0})`} style={{ transition: "transform 0.4s ease" }}>
            <rect x="-6" y="-36" width="12" height="40" rx="4" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.5" />
            <circle cx="0" cy="-28" r="3" fill="#ffffff" />
          </g>

          {/* Interactive Valve Trigger */}
          <g onClick={toggleValve} className="cursor-pointer group">
            <rect x="15" y="132" width="100" height="26" rx="5" fill={valveClosed ? "#064e3b" : "#450a0a"} stroke={valveClosed ? "#22c55e" : "#ef4444"} strokeWidth="1.5" className="group-hover:opacity-90" />
            <text x="65" y="148" textAnchor="middle" fill={valveClosed ? "#a7f3d0" : "#fca5a5"} fontSize="8" fontWeight="black" fontFamily="monospace">
              {valveClosed ? "✓ VALVE CLOSED (90°)" : "👉 TURN VALVE 90°"}
            </text>
          </g>
        </g>
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-950/90 border-t border-slate-800 rounded-b-lg">
        <span className="text-[10px] text-violet-300 font-mono font-bold flex items-center gap-1">
          <span>👉</span> {allIsolated ? "✓ Electrical & Pneumatic Isolation Complete!" : "Pull disconnect switch and turn pneumatic valve to positive OFF"}
        </span>
        {!allIsolated && (
          <button
            onClick={handleIsolateAll}
            className="px-2 py-0.5 rounded bg-violet-500 hover:bg-violet-400 text-slate-950 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
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
      <svg viewBox="0 0 320 205" className="w-full h-full max-h-[240px] object-contain">
        <defs>
          <linearGradient id="padlockBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>

        {/* Disconnect Switch Fixture */}
        <rect x="35" y="35" width="80" height="145" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <rect x="55" y="60" width="40" height="75" rx="4" fill="#0f172a" stroke="#334155" />
        <text x="75" y="52" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
          LOTO HASP
        </text>

        {/* 6-Hole Steel Hasp */}
        {haspApplied ? (
          <g transform="translate(68, 65)">
            <path d="M 0 0 C 15 -20, 30 -20, 45 0 L 45 60 C 30 80, 15 80, 0 60 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="22" cy="15" r="5" fill="#0f172a" />
            <circle cx="22" cy="30" r="5" fill="#0f172a" />
            <circle cx="22" cy="45" r="5" fill="#0f172a" />
          </g>
        ) : (
          <g onClick={handleApplyHasp} className="cursor-pointer">
            <rect x="58" y="75" width="35" height="50" rx="6" fill="#0f172a" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2" />
            <text x="75" y="104" textAnchor="middle" fill="#f97316" fontSize="7" fontWeight="black">SNAP HASP</text>
          </g>
        )}

        {/* Red Padlock */}
        {padlockApplied ? (
          <g transform="translate(75, 105)">
            <path d="M 12 0 L 12 -28 C 12 -42, 38 -42, 38 -28 L 38 0" fill="none" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
            <rect x="0" y="0" width="50" height="58" rx="8" fill="url(#padlockBodyGrad)" stroke="#fca5a5" strokeWidth="1.5" />
            <circle cx="25" cy="24" r="8" fill="#450a0a" />
            <path d="M 23 24 L 27 24 L 28 36 L 22 36 Z" fill="#450a0a" />
            <text x="25" y="48" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="black">MASTER LOCK</text>
          </g>
        ) : haspApplied ? (
          <g onClick={handleApplyPadlock} className="cursor-pointer">
            <rect x="75" y="105" width="48" height="52" rx="6" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
            <text x="99" y="134" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="black">SNAP LOCK</text>
          </g>
        ) : null}

        {/* OSHA Danger Tag */}
        {tagApplied ? (
          <g transform="translate(165, 25)">
            <path d="M -15 35 Q 0 20, 15 25" fill="none" stroke="#f97316" strokeWidth="2.5" />
            <path d="M 15 25 L 30 10 L 125 10 L 125 155 L 15 155 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
            <path d="M 30 10 L 125 10 L 125 48 L 15 48 L 15 25 Z" fill="#dc2626" />
            <ellipse cx="70" cy="28" rx="35" ry="12" fill="#ffffff" />
            <text x="70" y="32" textAnchor="middle" fill="#dc2626" fontSize="10" fontWeight="black">DANGER</text>
            <text x="70" y="62" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="black">DO NOT OPERATE</text>
            <line x1="25" y1="68" x2="115" y2="68" stroke="#dc2626" strokeWidth="1.5" />
            <text x="25" y="82" fill="#475569" fontSize="6.5" fontWeight="bold">EQUIP: #4 FEEDER</text>
            <text x="25" y="96" fill="#475569" fontSize="6.5" fontWeight="bold">TECH: A. SHARMA</text>
            <text x="25" y="110" fill="#475569" fontSize="6.5" fontWeight="bold">DATE: 2026-09-06</text>
            <rect x="20" y="125" width="100" height="18" fill="#0f172a" rx="2" />
            <text x="70" y="137" textAnchor="middle" fill="#86efac" fontSize="6.5" fontWeight="bold">✓ SIGNED & ATTACHED</text>
          </g>
        ) : (
          <g onClick={handleApplyTag} className="cursor-pointer">
            <rect x="165" y="25" width="110" height="145" rx="6" fill="#0f172a" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="220" y="95" textAnchor="middle" fill="#f97316" fontSize="9" fontWeight="black">👉 ATTACH DANGER TAG</text>
            <text x="220" y="110" textAnchor="middle" fill="#94a3b8" fontSize="7">Signed OSHA Warning</text>
          </g>
        )}
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-950/90 border-t border-slate-800 rounded-b-lg">
        <span className="text-[10px] text-orange-300 font-mono font-bold flex items-center gap-1">
          <span>👉</span> {allLocked ? "✓ Personal Lock & Danger Tag Positively Attached!" : "Equip Hasp, snap Master Lock, and attach Danger Tag"}
        </span>
        {!allLocked && (
          <button
            onClick={handleApplyAll}
            className="px-2 py-0.5 rounded bg-orange-500 hover:bg-orange-400 text-slate-950 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
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
      <svg viewBox="0 0 320 205" className="w-full h-full max-h-[240px] object-contain">
        {/* Left: Pneumatic Accumulator */}
        <g transform="translate(20, 15)">
          <rect x="0" y="0" width="130" height="170" rx="8" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
          <text x="65" y="18" textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="black" fontFamily="monospace">
            PRESSURE BLEED
          </text>

          <circle cx="65" cy="68" r="38" fill="#0f172a" stroke="#334155" strokeWidth="3" />
          <path d="M 38 90 A 30 30 0 1 1 92 90" fill="none" stroke="#475569" strokeWidth="4" />
          <g transform={`translate(65, 68) rotate(${needleAngle})`}>
            <line x1="0" y1="0" x2="0" y2="-28" stroke={psi > 10 ? "#ef4444" : "#22c55e"} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
          </g>
          <text x="65" y="96" textAnchor="middle" fill={psi > 10 ? "#ef4444" : "#22c55e"} fontSize="12" fontWeight="black" fontFamily="monospace">
            {psi} PSI
          </text>

          {/* Interactive Bleed Button */}
          <g onClick={startBleedAir} className="cursor-pointer group">
            <rect x="15" y="128" width="100" height="28" rx="4" fill={psi === 0 ? "#064e3b" : "#0f172a"} stroke={psi === 0 ? "#22c55e" : "#06b6d4"} strokeWidth="1.5" />
            <text x="65" y="145" textAnchor="middle" fill={psi === 0 ? "#a7f3d0" : "#06b6d4"} fontSize="8" fontWeight="black" fontFamily="monospace">
              {psi === 0 ? "✓ PRESSURE BLED" : bleedingAir ? "VENTING..." : "👉 VENT AIR VALVE"}
            </text>
          </g>
        </g>

        {/* Right: VFD DC Bus Stored Capacitor */}
        <g transform="translate(170, 15)">
          <rect x="0" y="0" width="130" height="170" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
          <text x="65" y="18" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="black" fontFamily="monospace">
            VFD DC CAPACITOR
          </text>

          <rect x="25" y="30" width="35" height="45" rx="5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
          <rect x="70" y="30" width="35" height="45" rx="5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="42" y="56" textAnchor="middle" fill="#f59e0b" fontSize="14">⚡</text>
          <text x="87" y="56" textAnchor="middle" fill="#f59e0b" fontSize="14">⚡</text>

          <rect x="18" y="85" width="94" height="30" rx="4" fill="#090d16" stroke="#475569" />
          <text x="65" y="100" textAnchor="middle" fill={voltsDC > 15 ? "#ef4444" : "#22c55e"} fontSize="12" fontWeight="black" fontFamily="monospace">
            {voltsDC} V DC
          </text>
          <text x="65" y="111" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">
            STORED CHARGE
          </text>

          {/* Interactive Discharge Button */}
          <g onClick={startDischargeDC} className="cursor-pointer group">
            <rect x="15" y="128" width="100" height="28" rx="4" fill={voltsDC === 0 ? "#064e3b" : "#0f172a"} stroke={voltsDC === 0 ? "#22c55e" : "#f59e0b"} strokeWidth="1.5" />
            <text x="65" y="145" textAnchor="middle" fill={voltsDC === 0 ? "#a7f3d0" : "#f59e0b"} fontSize="8" fontWeight="black" fontFamily="monospace">
              {voltsDC === 0 ? "✓ 0V SAFE GROUND" : dischargingDC ? "DISCHARGING..." : "👉 ENGAGE BLEEDER"}
            </text>
          </g>
        </g>
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-950/90 border-t border-slate-800 rounded-b-lg">
        <span className="text-[10px] text-cyan-300 font-mono font-bold flex items-center gap-1">
          <span>👉</span> {allBled ? "✓ Stored pneumatic & electrical energy safely dissipated!" : "Vent air pressure to 0 PSI and discharge capacitor to 0V"}
        </span>
        {!allBled && (
          <button
            onClick={handleBleedAll}
            className="px-2 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
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
      <svg viewBox="0 0 320 205" className="w-full h-full max-h-[240px] object-contain">
        {/* Left: Multimeter */}
        <g transform="translate(20, 15)">
          <rect x="0" y="0" width="115" height="155" rx="10" fill="#1e293b" stroke="#eab308" strokeWidth="2.5" />
          <rect x="10" y="12" width="95" height="52" rx="4" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
          <text x="57" y="44" textAnchor="middle" fill={testPhase === 2 ? "#22c55e" : testPhase === 0 ? "#475569" : "#ef4444"} fontSize="17" fontWeight="black" fontFamily="monospace">
            {voltage.toFixed(1)}
          </text>
          <text x="57" y="58" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
            {testPhase === 2 ? "VOLTS AC (ZERO ENERGY)" : "VOLTS AC"}
          </text>

          <circle cx="57" cy="92" r="16" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="57" y1="92" x2="57" y2="80" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />

          <circle cx="40" cy="130" r="5" fill="#ef4444" />
          <circle cx="74" cy="130" r="5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
        </g>

        {/* Right: Live-Dead-Live Probing Panel */}
        <g transform="translate(150, 15)">
          {/* Phase 1: Known Live Source Socket */}
          <g onClick={testPhase === 0 ? probeLive1 : undefined} className={testPhase === 0 ? "cursor-pointer" : ""}>
            <rect x="0" y="0" width="150" height="36" rx="6" fill={testPhase >= 1 ? "#064e3b" : "#1e293b"} stroke={testPhase === 0 ? "#ef4444" : testPhase >= 1 ? "#22c55e" : "#475569"} strokeWidth={testPhase === 0 ? 2 : 1} />
            <text x="15" y="22" fill={testPhase >= 1 ? "#86efac" : "#ffffff"} fontSize="8" fontWeight="bold">
              1. KNOWN LIVE SOURCE (230V)
            </text>
            <text x="135" y="22" textAnchor="end" fill={testPhase >= 1 ? "#22c55e" : "#ef4444"} fontSize="9" fontWeight="black">
              {testPhase >= 1 ? "✓ OK" : "TEST"}
            </text>
          </g>

          {/* Phase 2: De-Energized Equipment Terminals */}
          <g onClick={testPhase === 1 ? probeDead : undefined} className={testPhase === 1 ? "cursor-pointer" : ""}>
            <rect x="0" y="44" width="150" height="36" rx="6" fill={testPhase >= 2 ? "#064e3b" : "#1e293b"} stroke={testPhase === 1 ? "#22c55e" : testPhase >= 2 ? "#22c55e" : "#475569"} strokeWidth={testPhase === 1 ? 2 : 1} />
            <text x="15" y="66" fill={testPhase >= 2 ? "#86efac" : "#ffffff"} fontSize="8" fontWeight="bold">
              2. MACHINE TERMINALS (L1-L2)
            </text>
            <text x="135" y="66" textAnchor="end" fill={testPhase >= 2 ? "#22c55e" : "#f59e0b"} fontSize="9" fontWeight="black">
              {testPhase >= 2 ? "✓ 0.0V" : testPhase === 1 ? "TEST" : "LOCK"}
            </text>
          </g>

          {/* Phase 3: Re-Verify Known Live Source */}
          <g onClick={testPhase === 2 ? probeLive2 : undefined} className={testPhase === 2 ? "cursor-pointer" : ""}>
            <rect x="0" y="88" width="150" height="36" rx="6" fill={testPhase >= 3 ? "#064e3b" : "#1e293b"} stroke={testPhase === 2 ? "#ef4444" : testPhase >= 3 ? "#22c55e" : "#475569"} strokeWidth={testPhase === 2 ? 2 : 1} />
            <text x="15" y="110" fill={testPhase >= 3 ? "#86efac" : "#ffffff"} fontSize="8" fontWeight="bold">
              3. RE-VERIFY LIVE SOURCE
            </text>
            <text x="135" y="110" textAnchor="end" fill={testPhase >= 3 ? "#22c55e" : "#ef4444"} fontSize="9" fontWeight="black">
              {testPhase >= 3 ? "✓ 230V" : testPhase === 2 ? "TEST" : "LOCK"}
            </text>
          </g>

          {/* Phase 4: Physical TRY Bump Test */}
          <g onClick={testPhase === 3 ? pressTry : undefined} className={testPhase === 3 ? "cursor-pointer" : ""}>
            <rect x="0" y="132" width="150" height="36" rx="6" fill={testPhase === 4 ? "#064e3b" : "#1e293b"} stroke={testPhase === 3 ? "#22c55e" : testPhase === 4 ? "#22c55e" : "#475569"} strokeWidth={testPhase === 3 ? 2 : 1} />
            <circle cx="20" cy="150" r="10" fill="#15803d" />
            <text x="20" y="153" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="black">TRY</text>
            <text x="40" y="153" fill={testPhase === 4 ? "#86efac" : "#ffffff"} fontSize="8" fontWeight="bold">
              4. PRESS TRY (0 RPM)
            </text>
            <text x="135" y="153" textAnchor="end" fill={testPhase === 4 ? "#22c55e" : "#22c55e"} fontSize="9" fontWeight="black">
              {testPhase === 4 ? "✓ 0A" : testPhase === 3 ? "TRY" : "LOCK"}
            </text>
          </g>
        </g>
      </svg>

      {/* Interactive Guidance Bar */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-950/90 border-t border-slate-800 rounded-b-lg">
        <span className="text-[10px] text-emerald-300 font-mono font-bold flex items-center gap-1">
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
            className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            Execute Next Test
          </button>
        )}
      </div>
    </div>
  );
}
