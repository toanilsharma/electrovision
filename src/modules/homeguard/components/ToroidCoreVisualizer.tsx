/**
 * RCCB Toroidal Core (Zero-Phase Current Transformer) Visualizer
 * 
 * Demonstrates the fundamental physics of IEC 61008-1 Residual Current Devices:
 * 1. Balanced State (IL = IN): Opposing magnetic fields cancel (Net Flux Φ = 0).
 *    No voltage induced in sense coil -> Trip relay remains unlatched.
 * 2. Earth Leakage (IL != IN): Net alternating magnetic flux circulates in ferrite ring.
 * 3. Sense Coil Induction: Faraday's law e = -N*(dΦ/dt) induces secondary voltage.
 * 4. Trip Actuator: Polarized relay fires, snapping main contacts open.
 * 
 * Synced directly to pure core RCD engine timing: createRCD(cfg).
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRCD } from '@/src/core/physics/rcdEngine';
import { cn } from '@/src/lib/utils';
import {
  Zap,
  RotateCcw,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  HelpCircle
} from 'lucide-react';

export interface ToroidCoreVisualizerProps {
  initialLeakageMA?: number;
  rccbRatingMA?: number;
  isExternalTripped?: boolean;
  onTrip?: () => void;
  className?: string;
  compact?: boolean;
}

export const ToroidCoreVisualizer: React.FC<ToroidCoreVisualizerProps> = ({
  initialLeakageMA = 0,
  rccbRatingMA = 30,
  isExternalTripped = false,
  onTrip,
  className,
  compact = false
}) => {
  const [leakageMA, setLeakageMA] = useState<number>(initialLeakageMA);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isTripped, setIsTripped] = useState<boolean>(isExternalTripped);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [fluxAngle, setFluxAngle] = useState<number>(0);

  // Sync external leakage prop if changed
  useEffect(() => {
    setLeakageMA(initialLeakageMA);
    if (initialLeakageMA > 0) {
      setElapsedMs(0);
      setIsTripped(false);
    }
  }, [initialLeakageMA]);

  // Sync external trip state
  useEffect(() => {
    if (isExternalTripped !== undefined) {
      setIsTripped(isExternalTripped);
    }
  }, [isExternalTripped]);

  // Pure RCD engine instance from core
  const rcdEngine = useMemo(() => {
    return createRCD({ iDeltaN: rccbRatingMA });
  }, [rccbRatingMA]);

  // Evaluate trip criteria from core
  const tripEval = useMemo(() => {
    return rcdEngine.evaluate(leakageMA);
  }, [rcdEngine, leakageMA]);

  const targetTripTimeMs = tripEval.tripTimeMs;
  const shouldTrip = tripEval.shouldTrip;

  // Real-time animation loop
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const loop = (now: number) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (isPlaying && !isTripped) {
        // Rotate magnetic flux particles if net flux exists
        if (leakageMA > 0) {
          const speed = Math.min(3.5, 0.5 + (leakageMA / 30) * 1.5);
          setFluxAngle(prev => (prev + dt * 0.15 * speed) % 360);

          // Advance elapsed trip countdown
          setElapsedMs(prev => {
            const next = prev + dt;
            if (shouldTrip && next >= targetTripTimeMs) {
              setIsTripped(true);
              if (onTrip) onTrip();
              return targetTripTimeMs;
            }
            return next;
          });
        } else {
          setElapsedMs(0);
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, isTripped, leakageMA, shouldTrip, targetTripTimeMs, onTrip]);

  // Live Electrical Calculations
  const nominalLoadA = 10.0; // 10A through phase
  const currentPhaseA = nominalLoadA;
  const currentNeutralA = Math.max(0, nominalLoadA - leakageMA / 1000);
  const netCurrentMA = leakageMA;

  // Net Magnetic flux in microWebers: Phi = (mu * N * I) / l
  // In balanced state, Phi_net = 0
  const netFluxMicroWb = (netCurrentMA * 0.14).toFixed(2);
  const inducedEmfVolts = leakageMA > 0 ? ((netCurrentMA / 30) * 4.8).toFixed(2) : '0.00';
  const tripProgress = shouldTrip && targetTripTimeMs > 0
    ? Math.min(100, (elapsedMs / targetTripTimeMs) * 100)
    : 0;

  const handleReset = () => {
    setIsTripped(false);
    setElapsedMs(0);
    setLeakageMA(0);
  };

  const handleApplyPreset = (ma: number) => {
    setLeakageMA(ma);
    setIsTripped(false);
    setElapsedMs(0);
  };

  return (
    <div className={cn(
      "flex flex-col bg-slate-900 border border-slate-750 rounded-xl overflow-hidden font-mono text-slate-100",
      className
    )}>
      {/* Header Bar */}
      <div className="px-3 py-2 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-1.5">
              <span>🍩 THE SAFETY DONUT (RCCB TOROID CORE)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-normal">
                IEC 61008-1
              </span>
            </div>
            {!compact && (
              <p className="text-[10px] text-slate-400 font-sans">
                The Magnetic Balance Ring that Detects Electric Shocks in 0.03 Seconds
              </p>
            )}
          </div>
        </div>

        {/* Trip State Status Badge */}
        <div className="flex items-center gap-2">
          {isTripped ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>TRIPPED ({targetTripTimeMs}ms)</span>
            </span>
          ) : netCurrentMA > 0 ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>SENSING LEAKAGE...</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>FLUX BALANCED (Φ=0)</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="Reset Toroid state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Family-Friendly Educational Banner */}
      {!compact && (
        <div className="px-3 py-2 bg-gradient-to-r from-amber-950/60 via-slate-900 to-cyan-950/60 border-b border-slate-800 text-[11px] font-sans flex flex-wrap items-center justify-between gap-2 text-slate-200 shrink-0">
          <div className="flex items-center gap-2 max-w-3xl">
            <span className="text-base shrink-0">🍩</span>
            <p className="leading-snug">
              <strong className="text-amber-300 font-bold">How does this safety donut work?</strong> Electricity flows out on the Live (Brown) wire and must return on the Neutral (Blue) wire. As long as incoming equals outgoing, magnetic forces cancel out (Φ = 0) and the switch stays ON. If even a tiny drop (30mA / 0.03A) leaks into a human body, this magnetic donut senses the imbalance and snaps power OFF in 0.03 seconds!
            </p>
          </div>
        </div>
      )}

      {/* Main Interactive Stage: Animated SVG Toroid */}
      <div className="relative flex-1 min-h-[220px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-3 flex flex-col items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 460 260"
          className="w-full h-full max-h-[260px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Ferrite Core Gradients */}
            <radialGradient id="toroidOuterGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
            <radialGradient id="toroidInnerGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="100%" stopColor="#090d16" />
            </radialGradient>

            {/* Glowing Flux Filters */}
            <filter id="fluxGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Marker Arrows */}
            <marker id="arrowPhase" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#ea580c" />
            </marker>
            <marker id="arrowNeutral" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#0284c7" />
            </marker>
          </defs>

          {/* BACKGROUND GRID */}
          <g opacity="0.15">
            <line x1="20" y1="130" x2="440" y2="130" stroke="#64748b" strokeDasharray="4 4" />
            <line x1="200" y1="20" x2="200" y2="240" stroke="#64748b" strokeDasharray="4 4" />
          </g>

          {/* 1. THE FERRITE TOROID RING (Zero-Phase Core) */}
          {/* Outer circle */}
          <circle
            cx="200"
            cy="130"
            r="82"
            fill="url(#toroidOuterGrad)"
            stroke="#475569"
            strokeWidth="4"
          />
          {/* Core Body depth shading */}
          <circle
            cx="200"
            cy="130"
            r="80"
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="8 4"
            opacity="0.4"
          />
          {/* Inner aperture cutaway */}
          <circle
            cx="200"
            cy="130"
            r="44"
            fill="url(#toroidInnerGrad)"
            stroke="#334155"
            strokeWidth="3"
          />

          {/* 2. PRIMARY CONDUCTORS PASSING THROUGH APERTURE */}
          {/* Phase Conductor (L - Brown) */}
          <path
            d="M 20 105 L 180 105 C 190 105, 195 108, 200 115 C 205 122, 210 125, 220 125 L 360 125"
            fill="none"
            stroke="#ea580c"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Phase Flow Particles */}
          <path
            d="M 20 105 L 180 105 C 190 105, 195 108, 200 115 C 205 122, 210 125, 220 125 L 360 125"
            fill="none"
            stroke="#fed7aa"
            strokeWidth="2"
            strokeDasharray="8 12"
            strokeDashoffset={-fluxAngle * 1.5}
            opacity={isTripped ? 0.2 : 0.9}
          />
          <text x="35" y="98" fill="#fb923c" fontSize="10" fontWeight="bold">
            Phase (L): {isTripped ? '0.0A' : `${currentPhaseA.toFixed(1)}A`} ➔
          </text>

          {/* Neutral Conductor (N - Blue) */}
          <path
            d="M 360 145 L 220 145 C 210 145, 205 142, 200 135 C 195 128, 190 125, 180 125 L 20 125"
            fill="none"
            stroke="#0284c7"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Neutral Return Flow Particles */}
          <path
            d="M 360 145 L 220 145 C 210 145, 205 142, 200 135 C 195 128, 190 125, 180 125 L 20 125"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="2"
            strokeDasharray="8 12"
            strokeDashoffset={fluxAngle * 1.5}
            opacity={isTripped ? 0.2 : 0.9}
          />
          <text x="35" y="160" fill="#38bdf8" fontSize="10" fontWeight="bold">
            Neutral (N): {isTripped ? '0.0A' : `${currentNeutralA.toFixed(2)}A`} ⬅
          </text>

          {/* 3. MAGNETIC FLUX CIRCULATION IN THE FERRITE RING */}
          {leakageMA === 0 ? (
            // BALANCED STATE: Opposing cancelation
            <g>
              <circle
                cx="200"
                cy="130"
                r="63"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 6"
                opacity="0.6"
              />
              <text x="200" y="133" fill="#34d399" fontSize="9" textAnchor="middle" fontWeight="bold">
                Φ_L + Φ_N = 0
              </text>
              <text x="200" y="145" fill="#a7f3d0" fontSize="8" textAnchor="middle">
                (FLUX BALANCED)
              </text>
            </g>
          ) : (
            // LEAKAGE STATE: Net Circulating Magnetic Flux
            <g filter="url(#fluxGlow)">
              <circle
                cx="200"
                cy="130"
                r="63"
                fill="none"
                stroke={netCurrentMA >= 30 ? "#ef4444" : "#f59e0b"}
                strokeWidth="4"
                strokeDasharray="14 10"
                strokeDashoffset={-fluxAngle * 2}
                opacity={isTripped ? 0.2 : 0.95}
              />
              <circle
                cx="200"
                cy="130"
                r="63"
                fill="none"
                stroke="#fef08a"
                strokeWidth="1.5"
                strokeDasharray="4 16"
                strokeDashoffset={-fluxAngle * 3}
                opacity={isTripped ? 0.1 : 0.8}
              />
              {/* Dynamic Center Flux Value */}
              <text x="200" y="128" fill="#fcd34d" fontSize="9" textAnchor="middle" fontWeight="bold">
                Φ_net ≠ 0
              </text>
              <text x="200" y="140" fill="#fef08a" fontSize="8" textAnchor="middle" fontWeight="bold">
                {netFluxMicroWb} µWb
              </text>
            </g>
          )}

          {/* 4. SECONDARY SENSE WINDING (Copper Coil on Toroid) */}
          <g transform="translate(200, 130)">
            {/* Multiple copper coil windings wrapped around top arc */}
            {[-35, -25, -15, -5, 5, 15, 25, 35].map((angle, i) => {
              const rad = (angle - 90) * (Math.PI / 180);
              const x1 = Math.cos(rad) * 44;
              const y1 = Math.sin(rad) * 44;
              const x2 = Math.cos(rad) * 82;
              const y2 = Math.sin(rad) * 82;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#d97706"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* Secondary Leads from Sense Winding to Relay Actuator */}
          <path
            d="M 195 48 L 195 28 L 380 28 L 380 75"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray={leakageMA > 0 && !isTripped ? "4 4" : "none"}
            strokeDashoffset={-fluxAngle}
          />
          <path
            d="M 205 48 L 205 34 L 372 34 L 372 75"
            fill="none"
            stroke="#b45309"
            strokeWidth="2"
          />

          {/* 5. TRIP ACTUATOR / POLARIZED SOLENOID RELAY */}
          <g transform="translate(360, 75)">
            {/* Solenoid Frame */}
            <rect
              x="0"
              y="0"
              width="50"
              height="65"
              rx="4"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Solenoid Coil Winding */}
            <rect
              x="6"
              y="10"
              width="38"
              height="28"
              rx="2"
              fill="#b45309"
              stroke="#d97706"
              strokeWidth="1"
            />
            {/* Induced EMF Spark effect */}
            {leakageMA > 0 && !isTripped && (
              <circle cx="25" cy="24" r="14" fill="#fbbf24" opacity="0.25" className="animate-ping" />
            )}
            <text x="25" y="27" fill="#fef3c7" fontSize="8" textAnchor="middle" fontWeight="bold">
              {inducedEmfVolts}V
            </text>

            {/* Armature Latch Contact Mechanism */}
            {isTripped ? (
              // Tripped: Lever unlatched & Open
              <g>
                <path d="M 25 42 L 42 58" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                <circle cx="42" cy="58" r="3" fill="#ef4444" />
                <text x="25" y="60" fill="#f87171" fontSize="7" fontWeight="bold">
                  TRIPPED
                </text>
              </g>
            ) : (
              // Latched: Lever securely closed
              <g>
                <path d="M 25 42 L 25 58" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                <circle cx="25" cy="58" r="3" fill="#10b981" />
                <text x="25" y="60" fill="#34d399" fontSize="7" fontWeight="bold">
                  LATCHED
                </text>
              </g>
            )}
          </g>
          <text x="385" y="70" fill="#94a3b8" fontSize="8" textAnchor="middle" fontWeight="bold">
            TRIP RELAY
          </text>
        </svg>

        {/* Live Trip Countdown Overlay during leakage */}
        {shouldTrip && !isTripped && (
          <div className="absolute bottom-2 left-3 right-3 bg-slate-900/90 border border-amber-500/60 rounded-lg p-2 flex items-center justify-between gap-3 text-xs backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 animate-spin" />
              <div>
                <span className="font-bold text-amber-300">CORE RCD TIMING ACTIVE: </span>
                <span className="text-slate-300">
                  {elapsedMs.toFixed(0)}ms / {targetTripTimeMs}ms target
                </span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="flex-1 max-w-[140px] h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-amber-500 transition-all duration-75"
                style={{ width: `${tripProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Physics Readout Dashboard Grid */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Residual (IΔn)</div>
          <div className={cn(
            "text-base font-black font-mono",
            netCurrentMA >= 30 ? "text-rose-400" : netCurrentMA > 0 ? "text-amber-400" : "text-emerald-400"
          )}>
            {netCurrentMA} mA
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Toroid Net Flux</div>
          <div className="text-base font-black font-mono text-cyan-300">
            {netFluxMicroWb} µWb
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Sense Coil EMF</div>
          <div className="text-base font-black font-mono text-amber-300">
            {inducedEmfVolts} V
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Break Time (IEC)</div>
          <div className="text-base font-black font-mono text-purple-300">
            {shouldTrip ? `${targetTripTimeMs} ms` : '∞ (Hold)'}
          </div>
        </div>
      </div>

      {/* Interactive Leakage Simulator Presets */}
      <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400">TEST LEAKAGE:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset(0)}
            className={cn(
              "px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer border",
              leakageMA === 0
                ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
            )}
          >
            0 mA (Balanced)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(15)}
            className={cn(
              "px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer border",
              leakageMA === 15
                ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
            )}
            title="Non-tripping threshold (0.5 * IΔn)"
          >
            15 mA (0.5×)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(30)}
            className={cn(
              "px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer border",
              leakageMA === 30
                ? "bg-rose-500 text-slate-950 border-rose-400 font-black"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
            )}
            title="1x IΔn standard trip threshold (<= 300ms)"
          >
            30 mA (1.0×)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(45)}
            className={cn(
              "px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer border",
              leakageMA === 45
                ? "bg-rose-600 text-white border-rose-500 font-black"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
            )}
            title="45mA Household Kettle leakage (268ms)"
          >
            45 mA (1.5×)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(150)}
            className={cn(
              "px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer border",
              leakageMA === 150
                ? "bg-purple-600 text-white border-purple-500 font-black"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
            )}
            title="5x IΔn instantaneous trip (<= 40ms)"
          >
            150 mA (5.0×)
          </button>
        </div>

        {/* Play/Pause control */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsPlaying(p => !p)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            <span className="text-[10px]">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
