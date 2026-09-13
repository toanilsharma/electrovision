/**
 * RCCB Toroidal Core (Zero-Phase Current Transformer) Visual Simulator
 * 
 * Demonstrates 100% Electrically & Physically Correct Operation of IEC 61008-1:
 * - 100% Full-Viewport Visual Simulator: No cluttered bottom panels or tall headers.
 * - Center Area dedicated entirely to the animated RCCB mechanism.
 * - Live Current Difference:
 *     I_GOING (Live) - I_RECEIVING (Neutral) = I_DIFFERENCE (Residual Leakage to Earth)
 * - Electromagnetic Action:
 *     - Balanced: Dual opposing flux fields cancel perfectly (Φ_net = 0).
 *     - Leakage: Net circulating magnetic flux wave Φ_Δ in Mumetal core.
 *     - Faraday Induction: Copper search coil induces voltage e = -N*(dΦ/dt).
 *     - Polarized Relay: Counter-field cancels permanent holding magnet; spring SNAPS contacts open in ≤30ms!
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRCD } from '@/src/core/physics/rcdEngine';
import { defaultSoundKit } from '@/src/core/ui/audio/soundKit';
import { cn } from '@/src/lib/utils';
import {
  Zap,
  Activity,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export interface ToroidCoreVisualizerProps {
  leakageMA?: number;
  initialLeakageMA?: number;
  rccbRatingMA?: number;
  isExternalTripped?: boolean;
  isTripped?: boolean;
  onTrip?: () => void;
  onReset?: () => void;
  className?: string;
  compact?: boolean;
}

export const ToroidCoreVisualizer: React.FC<ToroidCoreVisualizerProps> = ({
  leakageMA: controlledLeakageMA,
  initialLeakageMA = 0,
  rccbRatingMA = 30,
  isExternalTripped,
  isTripped: controlledIsTripped,
  onTrip,
  onReset,
  className,
  compact = false
}) => {
  // Support both controlled and uncontrolled usage
  const [internalLeakageMA, setInternalLeakageMA] = useState<number>(initialLeakageMA);
  const [internalIsTripped, setInternalIsTripped] = useState<boolean>(false);

  const activeLeakageMA = controlledLeakageMA !== undefined ? controlledLeakageMA : internalLeakageMA;
  const isBreakerTripped = controlledIsTripped !== undefined
    ? controlledIsTripped
    : isExternalTripped !== undefined
    ? isExternalTripped
    : internalIsTripped;

  const [simElapsedMs, setSimElapsedMs] = useState<number>(0);
  const [acWavePhase, setAcWavePhase] = useState<number>(0);
  const [tripFlash, setTripFlash] = useState<boolean>(false);

  // Sync initial leakage if changed
  useEffect(() => {
    if (controlledLeakageMA === undefined) {
      setInternalLeakageMA(initialLeakageMA);
    }
  }, [initialLeakageMA, controlledLeakageMA]);

  // Core physics engine instance for exact IEC 61008 trip time
  const rcdEngine = useMemo(() => {
    return createRCD({ iDeltaN: rccbRatingMA });
  }, [rccbRatingMA]);

  const tripEval = useMemo(() => {
    return rcdEngine.evaluate(activeLeakageMA);
  }, [rcdEngine, activeLeakageMA]);

  const targetTripTimeMs = tripEval.tripTimeMs; // e.g. 28ms for 35mA, 25ms for 150mA
  const willTrip = tripEval.shouldTrip;

  // Animation Loop for live current flow and trip timing
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const soundFiredRef = useRef<boolean>(false);

  // Reset sound flag when armed
  useEffect(() => {
    if (!isBreakerTripped) {
      soundFiredRef.current = false;
      setSimElapsedMs(0);
    }
  }, [isBreakerTripped, activeLeakageMA]);

  useEffect(() => {
    const loop = (now: number) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Continuous AC wave motion
      setAcWavePhase(prev => (prev + dt * 0.18) % 360);

      // If fault is active and breaker is armed, advance countdown
      if (!isBreakerTripped && activeLeakageMA > 0) {
        setSimElapsedMs(prev => {
          const next = prev + dt;
          if (willTrip && next >= targetTripTimeMs) {
            // Trigger physical trip!
            setTripFlash(true);
            setTimeout(() => setTripFlash(false), 350);

            if (!soundFiredRef.current) {
              defaultSoundKit.playTrip(false);
              soundFiredRef.current = true;
            }

            if (controlledIsTripped === undefined) {
              setInternalIsTripped(true);
            }
            if (onTrip) onTrip();
            return targetTripTimeMs;
          }
          return next;
        });
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isBreakerTripped, activeLeakageMA, willTrip, targetTripTimeMs, onTrip, controlledIsTripped]);

  // Nominal household load current
  const nominalLoadMA = 10000; // 10.000 A (10,000 mA)

  // Real-time currents through CT:
  const currentGoingMA = isBreakerTripped ? 0 : nominalLoadMA;
  const currentLeakageMA = isBreakerTripped ? 0 : activeLeakageMA;
  const currentReceivingMA = isBreakerTripped ? 0 : Math.max(0, nominalLoadMA - currentLeakageMA);
  const currentDifferenceMA = isBreakerTripped ? 0 : currentGoingMA - currentReceivingMA;

  // Magnetic flux in microWebers (Φ = μ * N * I / l)
  const netFluxMicroWb = (currentDifferenceMA * 0.14).toFixed(1);
  const inducedVolts = currentDifferenceMA > 0 ? ((currentDifferenceMA / 30) * 4.8).toFixed(1) : '0.0';

  return (
    <div className={cn(
      "flex flex-col h-full w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden font-mono text-slate-100 select-none relative",
      className
    )}>
      {/* 1. ULTRA-COMPACT FLOATING HUD: REAL-TIME CURRENT DIFFERENCE */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 z-10">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Going */}
          <span className="flex items-center gap-1 font-bold text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span>Going: {(currentGoingMA / 1000).toFixed(3)}A</span>
          </span>

          <span className="text-slate-500 font-black">−</span>

          {/* Receiving */}
          <span className="flex items-center gap-1 font-bold text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Receiving: {(currentReceivingMA / 1000).toFixed(3)}A</span>
          </span>

          <span className="text-slate-500 font-black">=</span>

          {/* Difference */}
          <span className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black transition-colors",
            currentDifferenceMA >= 30
              ? "bg-rose-500/20 text-rose-300 border border-rose-500 animate-pulse"
              : currentDifferenceMA > 0
              ? "bg-amber-500/20 text-amber-300 border border-amber-500"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500"
          )}>
            <span>Difference (IΔ): {currentDifferenceMA} mA</span>
          </span>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {isBreakerTripped ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/60 flex items-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>TRIPPED ({targetTripTimeMs}ms)</span>
            </span>
          ) : currentDifferenceMA >= 30 ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/60 flex items-center gap-1 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>DEMAGNETIZING...</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>BALANCED (Φ = 0)</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. CENTER AREA: 100% FULL-HEIGHT VISUAL SIMULATOR */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-gradient-to-b from-slate-950 via-[#070e1a] to-slate-950 flex items-center justify-center p-1 sm:p-2 overflow-hidden">
        
        {/* Arc flash overlay on trip */}
        {tripFlash && (
          <div className="absolute inset-0 bg-cyan-400/30 z-20 pointer-events-none animate-ping" />
        )}

        <svg
          viewBox="0 0 860 430"
          className="w-full h-full max-h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="mumetalGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="65%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
            <radialGradient id="apertureWindowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="100%" stopColor="#0b1329" />
            </radialGradient>
            <filter id="fluxGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ============================================================== */}
          {/* TOROIDAL MUMETAL CORE RING                                     */}
          {/* ============================================================== */}
          <g transform="translate(280, 215)">
            {/* Outer Donut Ring */}
            <circle cx="0" cy="0" r="105" fill="url(#mumetalGrad)" stroke="#475569" strokeWidth="4" />
            <circle cx="0" cy="0" r="100" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="10 5" opacity="0.5" />
            {/* Inner Window Aperture */}
            <circle cx="0" cy="0" r="55" fill="url(#apertureWindowGrad)" stroke="#334155" strokeWidth="3" />
            
            <text x="0" y="-88" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" letterSpacing="0.05em">
              MUMETAL CORE (ZCT)
            </text>

            {/* FLUX ANIMATION INSIDE TOROID */}
            {currentDifferenceMA === 0 ? (
              // BALANCED: Both fields cancel out
              <g>
                {/* Clockwise Live Flux */}
                <path
                  d="M -42 -22 A 48 48 0 0 1 42 -22"
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                />
                <polygon points="42,-22 36,-28 37,-17" fill="#ea580c" />
                <text x="0" y="-30" fill="#fb923c" fontSize="8" textAnchor="middle" fontWeight="bold">
                  B_Going (Clockwise)
                </text>

                {/* Counter-CW Neutral Flux */}
                <path
                  d="M 42 22 A 48 48 0 0 1 -42 22"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                />
                <polygon points="-42,22 -36,16 -37,27" fill="#0284c7" />
                <text x="0" y="34" fill="#38bdf8" fontSize="8" textAnchor="middle" fontWeight="bold">
                  B_Receiving (Counter-CW)
                </text>

                {/* Center Vector Sum: Zero */}
                <circle cx="0" cy="0" r="20" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="0" y="-2" fill="#34d399" fontSize="8.5" textAnchor="middle" fontWeight="black">
                  ΣB = 0
                </text>
                <text x="0" y="8" fill="#a7f3d0" fontSize="7" textAnchor="middle">
                  Φ_net = 0
                </text>
              </g>
            ) : (
              // UNBALANCED: Swirling circulating magnetic flux wave
              <g filter="url(#fluxGlow)">
                <circle
                  cx="0"
                  cy="0"
                  r="80"
                  fill="none"
                  stroke={currentDifferenceMA >= 30 ? "#ef4444" : "#f59e0b"}
                  strokeWidth="6"
                  strokeDasharray="20 12"
                  strokeDashoffset={-acWavePhase * 2.5}
                  opacity={isBreakerTripped ? 0.2 : 0.95}
                />
                <circle
                  cx="0"
                  cy="0"
                  r="80"
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="2.5"
                  strokeDasharray="8 20"
                  strokeDashoffset={-acWavePhase * 3.5}
                  opacity={isBreakerTripped ? 0.1 : 0.9}
                />
                {/* Center Imbalance Flux Value */}
                <circle cx="0" cy="0" r="26" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                <text x="0" y="-5" fill="#fca5a5" fontSize="9" textAnchor="middle" fontWeight="black">
                  Φ_Δ ≠ 0
                </text>
                <text x="0" y="8" fill="#fef08a" fontSize="8.5" textAnchor="middle" fontWeight="black">
                  {netFluxMicroWb} µWb
                </text>
              </g>
            )}

            {/* SECONDARY SENSING COIL (Faraday Induction Windings) */}
            <g>
              {[-35, -25, -15, -5, 5, 15, 25, 35].map((angle, idx) => {
                const radAngle = (angle - 90) * (Math.PI / 180);
                const x1 = Math.cos(radAngle) * 55;
                const y1 = Math.sin(radAngle) * 55;
                const x2 = Math.cos(radAngle) * 105;
                const y2 = Math.sin(radAngle) * 105;
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={currentDifferenceMA >= 30 && !isBreakerTripped ? "#fbbf24" : "#d97706"}
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                );
              })}
              <text x="0" y="-115" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">
                FARADAY SENSING COIL: e = -N(dΦ/dt)
              </text>
            </g>
          </g>

          {/* ============================================================== */}
          {/* PRIMARY CONDUCTORS: GOING (LIVE) & RECEIVING (NEUTRAL)         */}
          {/* ============================================================== */}
          
          {/* GOING CURRENT: LIVE WIRE (Red / Orange) */}
          <g>
            <path
              d="M 30 170 L 240 170 C 260 170, 270 180, 280 195 C 290 210, 300 220, 330 220 L 530 220"
              fill="none"
              stroke="#ea580c"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Animated particles */}
            {!isBreakerTripped && (
              <path
                d="M 30 170 L 240 170 C 260 170, 270 180, 280 195 C 290 210, 300 220, 330 220 L 530 220"
                fill="none"
                stroke="#fed7aa"
                strokeWidth="3"
                strokeDasharray="8 12"
                strokeDashoffset={-acWavePhase * 2}
              />
            )}
            <text x="35" y="155" fill="#ea580c" fontSize="11" fontWeight="black">
              GOING (I_GOING): {(currentGoingMA / 1000).toFixed(3)} A ➔
            </text>
          </g>

          {/* RECEIVING CURRENT: NEUTRAL WIRE (Cyan / Blue) */}
          <g>
            <path
              d="M 530 260 L 330 260 C 300 260, 290 250, 280 235 C 270 220, 260 210, 240 210 L 30 210"
              fill="none"
              stroke="#0284c7"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Animated neutral return particles */}
            {!isBreakerTripped && (
              <path
                d="M 530 260 L 330 260 C 300 260, 290 250, 280 235 C 270 220, 260 210, 240 210 L 30 210"
                fill="none"
                stroke="#bae6fd"
                strokeWidth="3"
                strokeDasharray="8 12"
                strokeDashoffset={acWavePhase * 2}
              />
            )}
            <text x="35" y="235" fill="#38bdf8" fontSize="11" fontWeight="black">
              RECEIVING (I_REC): {(currentReceivingMA / 1000).toFixed(3)} A ⬅
            </text>
          </g>

          {/* FAULT LEAKAGE PATH TO GROUND */}
          {activeLeakageMA > 0 && (
            <g>
              <path
                d="M 410 220 L 410 340 L 410 370"
                fill="none"
                stroke="#ef4444"
                strokeWidth="4"
                strokeDasharray="6 4"
                strokeDashoffset={isBreakerTripped ? 0 : -acWavePhase * 2}
                opacity={isBreakerTripped ? 0.2 : 1}
              />
              {/* Ground Pit */}
              <g transform="translate(410, 370)">
                <line x1="-20" y1="0" x2="20" y2="0" stroke="#22c55e" strokeWidth="4" />
                <line x1="-12" y1="6" x2="12" y2="6" stroke="#22c55e" strokeWidth="3" />
                <line x1="-5" y1="12" x2="5" y2="12" stroke="#22c55e" strokeWidth="2" />
                <text x="0" y="24" textAnchor="middle" fill="#4ade80" fontSize="8.5" fontWeight="bold">
                  EARTH GROUND PIT
                </text>
              </g>

              {/* Missing Leakage Badge */}
              <rect x="420" y="285" width="130" height="34" rx="6" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
              <text x="485" y="300" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">
                ⚠️ ESCAPED TO EARTH
              </text>
              <text x="485" y="312" textAnchor="middle" fill="#fef08a" fontSize="9.5" fontWeight="black">
                {currentLeakageMA} mA Missing!
              </text>
            </g>
          )}

          {/* ============================================================== */}
          {/* SECONDARY SENSING LEADS TO TRIP SOLENOID                       */}
          {/* ============================================================== */}
          <g>
            <path
              d="M 275 110 L 275 60 L 575 60 L 575 110"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray={currentDifferenceMA >= 30 && !isBreakerTripped ? "6 4" : undefined}
              strokeDashoffset={-acWavePhase * 2}
            />
            <path
              d="M 285 110 L 285 70 L 565 70 L 565 110"
              fill="none"
              stroke="#b45309"
              strokeWidth="3"
            />
            {currentDifferenceMA >= 30 && !isBreakerTripped && (
              <text x="425" y="52" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="black" className="animate-pulse">
                ⚡ INDUCED VOLTAGE ({inducedVolts}V) ENERGIZING TRIP COIL
              </text>
            )}
          </g>

          {/* ============================================================== */}
          {/* POLARIZED RELAY & KNIFE CONTACT BLADES                         */}
          {/* ============================================================== */}
          <g transform="translate(550, 110)">
            <rect x="0" y="0" width="270" height="230" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <text x="135" y="22" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="black">
              POLARIZED DEMAGNETIZING TRIP RELAY
            </text>

            {/* Permanent Holding Magnet (N-S) */}
            <g transform="translate(25, 40)">
              <rect x="0" y="0" width="28" height="42" rx="4" fill="#dc2626" stroke="#ef4444" />
              <text x="14" y="26" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="black">N</text>
              <rect x="28" y="0" width="28" height="42" rx="4" fill="#2563eb" stroke="#3b82f6" />
              <text x="42" y="26" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="black">S</text>
              <text x="28" y="54" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                PERM. MAGNET
              </text>
            </g>

            {/* Trip Solenoid Coil */}
            <g transform="translate(95, 40)">
              <rect
                x="0"
                y="0"
                width="40"
                height="42"
                rx="5"
                fill={currentDifferenceMA >= 30 && !isBreakerTripped ? "#b45309" : "#78350f"}
                stroke="#d97706"
                strokeWidth="2"
              />
              {currentDifferenceMA >= 30 && !isBreakerTripped && (
                <rect x="0" y="0" width="40" height="42" rx="5" fill="#f59e0b" opacity="0.4" className="animate-pulse" />
              )}
              <text x="20" y="20" textAnchor="middle" fill="#fef3c7" fontSize="8.5" fontWeight="bold">TRIP</text>
              <text x="20" y="32" textAnchor="middle" fill="#fef3c7" fontSize="8.5" fontWeight="bold">COIL</text>
              <text x="20" y="54" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="bold">
                {inducedVolts}V
              </text>
            </g>

            {/* Tension Spring */}
            <g transform="translate(150, 40)">
              <path
                d={isBreakerTripped
                  ? "M 15 0 L 5 10 L 25 20 L 5 30 L 15 42"
                  : "M 15 0 L 8 6 L 22 12 L 8 18 L 22 24 L 8 30 L 15 36"
                }
                fill="none"
                stroke={isBreakerTripped ? "#ef4444" : "#22c55e"}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <text x="15" y="54" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                SPRING
              </text>
            </g>

            {/* Double-Pole Knife Contact Blades */}
            <g transform="translate(25, 110)">
              <rect x="0" y="0" width="220" height="100" rx="8" fill="#1e293b" stroke="#334155" />
              
              {/* Fixed Terminals */}
              <circle cx="20" cy="30" r="5" fill="#ea580c" />
              <circle cx="20" cy="70" r="5" fill="#0284c7" />
              <circle cx="160" cy="30" r="5" fill="#ea580c" />
              <circle cx="160" cy="70" r="5" fill="#0284c7" />

              {/* Phase Knife Blade */}
              <line
                x1="20"
                y1="30"
                x2={isBreakerTripped ? "135" : "160"}
                y2={isBreakerTripped ? "10" : "30"}
                stroke={isBreakerTripped ? "#ef4444" : "#10b981"}
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Neutral Knife Blade */}
              <line
                x1="20"
                y1="70"
                x2={isBreakerTripped ? "135" : "160"}
                y2={isBreakerTripped ? "50" : "70"}
                stroke={isBreakerTripped ? "#ef4444" : "#10b981"}
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Electrical Arc on trip */}
              {isBreakerTripped && (
                <g transform="translate(145, 20)">
                  <polygon points="0,0 6,-8 2,-4 8,-4 0,8 2,2 -4,4" fill="#67e8f9" />
                  <text x="10" y="0" fill="#67e8f9" fontSize="8" fontWeight="bold">ARC CUT</text>
                </g>
              )}

              {/* Status Message */}
              <text
                x="110"
                y="92"
                textAnchor="middle"
                fill={isBreakerTripped ? "#f87171" : "#34d399"}
                fontSize="9"
                fontWeight="black"
              >
                {isBreakerTripped
                  ? `⚡ CONTACTS SNAPPED OPEN (TRIPPED IN ${targetTripTimeMs}ms)`
                  : '🔒 CLOSED: CURRENT FLOWING SAFELY'}
              </text>
            </g>
          </g>

          {/* Outgoing to Household Load */}
          <g transform="translate(795, 175)">
            <rect x="0" y="0" width="55" height="90" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x="27" y="40" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">HOME</text>
            <text x="27" y="55" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">LOAD</text>
            <text x="27" y="70" textAnchor="middle" fill={isBreakerTripped ? "#f87171" : "#34d399"} fontSize="8" fontWeight="black">
              {isBreakerTripped ? '0V CUT' : '230V'}
            </text>
          </g>
        </svg>

        {/* Sleek Tripped Notice Badge in Top-Right Corner (Never covers diagram) */}
        {isBreakerTripped && (
          <div className="absolute top-3 right-3 bg-rose-950/90 border border-rose-500/80 rounded-xl px-3 py-1.5 flex items-center gap-2 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-right-2 duration-150 z-20">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <div className="text-left">
              <div className="text-[11px] font-black text-rose-200 uppercase tracking-wide">
                🛡️ POWER CUT IN {targetTripTimeMs}ms!
              </div>
              <div className="text-[9px] text-slate-300 font-sans">
                Contacts open • Reset lever on left sidebar
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
