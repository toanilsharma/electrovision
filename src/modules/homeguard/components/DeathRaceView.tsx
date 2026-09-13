/**
 * Death Race View Component (HG5) - Visual Simulator Edition
 * 
 * Split-screen comparative race focused on BIG, DYNAMIC VISUAL ANIMATIONS:
 * - Two independent physics engine instances (R5 instance-safe).
 * - One synchronized master clock.
 * - Same fault: Child touches live wire, wet skin -> 230mA touch current (IEC 60479).
 * - Large visual animations of human figure, electric shock current surge, live ECG monitor, and breaker mechanism.
 * - Drastically minimized text to maximize visual demonstration space.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createMCB, MCBEngineInstance } from '@/src/core/physics/mcbEngine';
import { createRCD, RCDEngineInstance } from '@/src/core/physics/rcdEngine';
import { classifyIECZone, getC3Threshold, IECZoneResult } from '@/src/core/physics/bodyCurrent';
import { MCBState } from '@/src/mcb/types';
import { VerdictStamp } from './VerdictStamp';
import { defaultSoundKit } from '@/src/core/ui/audio/soundKit';
import { generateECGSvgPath } from '@/src/utils/ecgSynthesizer';
import { cn } from '@/src/lib/utils';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  AlertTriangle,
  ShieldCheck,
  HeartPulse,
  Clock,
  Flame,
  ArrowLeft
} from 'lucide-react';

export interface DeathRaceViewProps {
  className?: string;
  onExit?: () => void;
}

export const DeathRaceView: React.FC<DeathRaceViewProps> = ({
  className,
  onExit
}) => {
  // Master Synced Clock State
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.25); // Default 0.25x Slow-Mo

  // Fault parameters (Child touch, wet skin, 230V TN-S)
  const bodyCurrentMA = 230; // 230mA prospective body current per IEC 60479
  const bodyCurrentA = bodyCurrentMA / 1000;

  // Two Independent Engine Instances (R5 Instance-Safe)
  const leftMCBRef = useRef<MCBEngineInstance>(createMCB({ In: 16, curve: 'C', ambientTemp: 30 }));
  const rightRCCBRef = useRef<RCDEngineInstance>(createRCD({ iDeltaN: 30 }));

  // Tripping states
  const [leftMCBState, setLeftMCBState] = useState<MCBState>(MCBState.CLOSED);
  const [rightRCCBState, setRightRCCBState] = useState<MCBState>(MCBState.CLOSED);
  const [rightTripTimeMs, setRightTripTimeMs] = useState<number | null>(null);
  const [rightArcFlash, setRightArcFlash] = useState<boolean>(false);

  // Sound flags
  const rightTripSoundFiredRef = useRef<boolean>(false);

  // Reset function
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setElapsedMs(0);
    leftMCBRef.current = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    rightRCCBRef.current = createRCD({ iDeltaN: 30 });
    setLeftMCBState(MCBState.CLOSED);
    setRightRCCBState(MCBState.CLOSED);
    setRightTripTimeMs(null);
    setRightArcFlash(false);
    rightTripSoundFiredRef.current = false;
  }, []);

  // Compute Core RCD Break Time for Right House
  const rcdEval = useMemo(() => {
    return rightRCCBRef.current.evaluate(bodyCurrentMA);
  }, [bodyCurrentMA]);

  const targetRightTripMs = rcdEval.tripTimeMs; // <= 40ms, typically 30ms

  // Master Synchronized Animation Loop
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = (now: number) => {
      const realDtMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (isRunning) {
        const simDtMs = realDtMs * speedMultiplier;

        setElapsedMs(prev => {
          const next = prev + simDtMs;

          // Right House Engine Logic: Trips at targetRightTripMs
          if (next >= targetRightTripMs && rightRCCBState === MCBState.CLOSED) {
            setRightRCCBState(MCBState.OPEN_CLEARED);
            setRightTripTimeMs(Math.round(targetRightTripMs));
            setRightArcFlash(true);
            setTimeout(() => setRightArcFlash(false), 350);
            if (!rightTripSoundFiredRef.current) {
              defaultSoundKit.playTrip(false);
              rightTripSoundFiredRef.current = true;
            }
          }

          // Left House Engine Logic: MCB steps with 0.23A load (0.014x In)
          if (next < 2500) {
            leftMCBRef.current.step(simDtMs / 1000, bodyCurrentA);
          }

          // Cap at 1500ms
          if (next >= 1500) {
            setIsRunning(false);
            return 1500;
          }

          return next;
        });
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, speedMultiplier, targetRightTripMs, rightRCCBState, bodyCurrentA]);

  // Physiological zone calculations using pure IEC 60479 physics
  const leftDurationSec = elapsedMs / 1000;
  const leftZone: IECZoneResult = useMemo(() => {
    return classifyIECZone(bodyCurrentMA, leftDurationSec, 'hand-to-foot');
  }, [bodyCurrentMA, leftDurationSec]);

  // Right house duration: clamped once RCCB trips
  const rightDurationMs = rightTripTimeMs ? rightTripTimeMs : Math.min(elapsedMs, targetRightTripMs);
  const rightDurationSec = rightDurationMs / 1000;
  const rightZone: IECZoneResult = useMemo(() => {
    return classifyIECZone(bodyCurrentMA, rightDurationSec, 'hand-to-foot');
  }, [bodyCurrentMA, rightDurationSec]);

  // Left house VF probability
  let leftVFProb = 0;
  if (leftZone.zone === 'AC-4.1') leftVFProb = 5;
  else if (leftZone.zone === 'AC-4.2') leftVFProb = 50;
  else if (leftZone.zone === 'AC-4.3') leftVFProb = 95;

  const isLeftLethal = elapsedMs >= 254 || leftZone.zone.startsWith('AC-4');
  const isRightSurvived = rightRCCBState !== MCBState.CLOSED;

  // Real-time body currents flowing
  const activeLeftCurrentMA = bodyCurrentMA; // Continuous lethal flow!
  const activeRightCurrentMA = isRightSurvived ? 0 : bodyCurrentMA; // Disappears upon trip

  // Dynamic ECG waveform paths
  const leftEcgRhythm = elapsedMs >= 600 ? 'asystole' : elapsedMs >= 254 ? 'coarse_vf' : elapsedMs >= 100 ? 'pvt' : 'sinus';
  const leftEcgPath = useMemo(() => {
    return generateECGSvgPath(300, 70, leftDurationSec, 1.2, { rhythm: leftEcgRhythm });
  }, [leftDurationSec, leftEcgRhythm]);

  const rightEcgPath = useMemo(() => {
    return generateECGSvgPath(300, 70, rightDurationSec, 1.2, { rhythm: 'sinus' });
  }, [rightDurationSec]);

  return (
    <div className={cn(
      "flex flex-col h-full w-full bg-slate-950 text-slate-100 font-mono select-none overflow-hidden relative",
      className
    )}>
      {/* 1. MASTER SYNCHRONIZED CONTROLLER HEADER (Compact & Sleek) */}
      <header className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
              title="Return to House View"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-xs sm:text-sm tracking-wider">
                DEATH RACE: 16A MCB vs 30mA RCCB
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-950 text-rose-300 border border-rose-800">
                230mA SHOCK
              </span>
            </div>
          </div>
        </div>

        {/* Master Synced Clock & Controls */}
        <div className="flex items-center gap-2">
          {/* Start / Pause */}
          <button
            type="button"
            onClick={() => {
              if (elapsedMs >= 1500) handleReset();
              setIsRunning(r => !r);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg",
              isRunning
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                : "bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.4)] animate-pulse"
            )}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? "PAUSE" : elapsedMs > 0 ? "RESUME" : "START 230mA RACE"}</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer"
            title="Reset Race"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selection */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            {[
              { label: '0.1×', val: 0.1 },
              { label: '0.25× Slow', val: 0.25 },
              { label: '1.0× Real', val: 1.0 }
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => setSpeedMultiplier(item.val)}
                className={cn(
                  "px-2 py-0.5 rounded font-bold transition-colors cursor-pointer",
                  speedMultiplier === item.val
                    ? "bg-cyan-500 text-slate-950 font-black"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Master Clock */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-750 px-2.5 py-1 rounded-xl shadow-inner font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-black text-cyan-300 min-w-[65px] text-right">
              {elapsedMs.toFixed(1)} ms
            </span>
          </div>
        </div>
      </header>

      {/* 2. SPLIT SCREEN COMPARISON STAGE (MAXIMIZED VISUAL ARENAS) */}
      <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-2.5 p-2 sm:p-3 overflow-hidden">
        
        {/* ========================================================= */}
        {/* LEFT ARENA: HOUSE A (MCB ONLY - 16A C-CURVE)             */}
        {/* ========================================================= */}
        <div className="flex flex-col bg-slate-900/90 border-2 border-rose-900/70 rounded-2xl p-2.5 sm:p-3 relative overflow-hidden shadow-2xl">
          
          {/* Header Badge (Minimalist) */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-rose-950/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h4 className="text-xs font-black text-rose-400 uppercase tracking-wide">
                HOUSE A: STANDARD 16A MCB ONLY
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-800">
              ⚡ 0.23A IGNORES 16A BREAKER
            </span>
          </div>

          {/* Central Visual Shock Arena: Tall SVG Graphics */}
          <div className="flex-1 min-h-[220px] bg-slate-950 border border-slate-800 rounded-xl p-2 relative overflow-hidden flex flex-col items-center justify-between">
            
            {/* Upper SVG: Breaker & Shock Delivery through Child Figure */}
            <svg
              viewBox="0 0 360 210"
              className="w-full h-full max-h-[240px] select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="shockGlowRed" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 230V Socket & 16A Breaker Box (Top-Left) */}
              <g transform="translate(20, 20)">
                <rect x="0" y="0" width="85" height="50" rx="6" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
                <text x="42" y="15" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="black">16A MCB</text>
                {/* Switch lever stuck UP [I] */}
                <rect x="34" y="22" width="16" height="20" rx="3" fill="#22c55e" />
                <text x="42" y="36" textAnchor="middle" fill="#022c22" fontSize="9" fontWeight="black">I</text>
                <text x="42" y="46" textAnchor="middle" fill="#94a3b8" fontSize="6.5">STILL CLOSED</text>
              </g>

              {/* Live Wire from Breaker to Outlet Terminal */}
              <path
                d="M 105 45 L 180 45"
                fill="none"
                stroke="#ef4444"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Energized terminal spark */}
              <circle cx="180" cy="45" r="4" fill="#fbbf24" className="animate-ping" />

              {/* Child Silhouette Touching Exposed Wire */}
              <g transform="translate(180, 25)">
                {/* Hand touching wire */}
                <circle cx="0" cy="20" r="5" fill="#f87171" />
                
                {/* Head */}
                <circle cx="35" cy="15" r="14" fill="#64748b" stroke={elapsedMs >= 254 ? "#ef4444" : "#94a3b8"} strokeWidth="2" />
                {/* Eyes - distress */}
                {elapsedMs >= 254 ? (
                  <g>
                    <text x="30" y="17" fill="#ef4444" fontSize="10" fontWeight="black">✕</text>
                    <text x="38" y="17" fill="#ef4444" fontSize="10" fontWeight="black">✕</text>
                  </g>
                ) : (
                  <circle cx="33" cy="14" r="2" fill="#ffffff" />
                )}

                {/* Torso */}
                <line x1="35" y1="29" x2="35" y2="85" stroke="#475569" strokeWidth="12" strokeLinecap="round" />

                {/* Arms */}
                <line x1="0" y1="20" x2="35" y2="40" stroke="#475569" strokeWidth="7" strokeLinecap="round" />
                <line x1="35" y1="40" x2="60" y2="55" stroke="#475569" strokeWidth="7" strokeLinecap="round" />

                {/* Heart Location in Chest */}
                <g transform="translate(35, 50)">
                  <circle cx="0" cy="0" r="8" fill="#ef4444" className={elapsedMs >= 254 ? "animate-ping" : "animate-bounce"} />
                  <HeartPulse className="w-4 h-4 text-white -translate-x-2 -translate-y-2" />
                </g>

                {/* Legs down to ground */}
                <line x1="35" y1="85" x2="20" y2="150" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
                <line x1="35" y1="85" x2="50" y2="150" stroke="#334155" strokeWidth="7" strokeLinecap="round" />

                {/* Ground plane & feet */}
                <line x1="0" y1="150" x2="80" y2="150" stroke="#64748b" strokeWidth="3" />
                <line x1="10" y1="155" x2="70" y2="155" stroke="#64748b" strokeWidth="2" />
                <line x1="25" y1="160" x2="55" y2="160" stroke="#64748b" strokeWidth="1" />

                {/* SURGING ELECTRIC SHOCK LIGHTNING BOLTS (PULSING THROUGH BODY) */}
                <g filter="url(#shockGlowRed)">
                  {/* Lightning through arm */}
                  <path
                    d="M 0 20 L 15 28 L 22 24 L 35 40"
                    fill="none"
                    stroke="#fee2e2"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  {/* Lightning through heart & chest */}
                  <path
                    d="M 35 40 L 40 55 L 30 65 L 35 85"
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  {/* Lightning through legs into ground */}
                  <path
                    d="M 35 85 L 25 115 L 20 150"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 35 85 L 45 115 L 50 150"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Ground sparks */}
                  <circle cx="20" cy="150" r="5" fill="#facc15" className="animate-ping" />
                  <circle cx="50" cy="150" r="5" fill="#facc15" className="animate-ping" />
                </g>
              </g>

              {/* Shock Metrics Readout Box (Top-Right) */}
              <g transform="translate(250, 20)">
                <rect x="0" y="0" width="100" height="55" rx="6" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
                <text x="50" y="16" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">SHOCK FLOW</text>
                <text x="50" y="32" textAnchor="middle" fill="#f87171" fontSize="13" fontWeight="black" className="animate-pulse">
                  230 mA
                </text>
                <text x="50" y="46" textAnchor="middle" fill="#fef08a" fontSize="7.5" fontWeight="bold">
                  CONTINUOUS (NO TRIP)
                </text>
              </g>
            </svg>

            {/* Real-time Oscilloscope ECG Monitor */}
            <div className="w-full bg-slate-900 border border-rose-950 rounded-lg p-2 flex flex-col gap-1 shrink-0">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <HeartPulse className="w-3.5 h-3.5 animate-ping" />
                  <span>HEART RHYTHM (ECG LEAD II):</span>
                </span>
                <span className="font-bold text-rose-300">
                  {elapsedMs >= 600 ? "💀 ASYSTOLE (FLATLINE)" :
                   elapsedMs >= 254 ? "⚠️ VENTRICULAR FIBRILLATION (VF)" :
                   elapsedMs >= 100 ? "⚡ TACHYCARDIA" : "NORMAL SINUS"}
                </span>
              </div>

              {/* Animated ECG SVG Path */}
              <div className="w-full h-12 bg-slate-950 rounded border border-slate-800 overflow-hidden relative flex items-center justify-center">
                {/* Oscilloscope grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:15px_15px] opacity-30" />
                <svg viewBox="0 0 300 70" className="w-full h-full" preserveAspectRatio="none">
                  <path
                    d={leftEcgPath}
                    fill="none"
                    stroke={elapsedMs >= 254 ? "#ef4444" : "#f59e0b"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Hazard Progress Bar (IEC 60479 Zone) */}
              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <span>IEC 60479 Zone: <strong className="text-rose-400">{leftZone.zone}</strong></span>
                <span>VF Lethal Threshold: 254ms</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                <div className="absolute top-0 bottom-0 left-[25.4%] w-0.5 bg-amber-400 z-10" />
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 transition-all duration-75"
                  style={{ width: `${Math.min(100, (elapsedMs / 1000) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Verdict Stamp Overlay when lethal threshold crossed */}
          {isLeftLethal && (
            <VerdictStamp
              verdict="LETHAL"
              durationMs={elapsedMs}
              bodyCurrentMA={bodyCurrentMA}
              vfProbabilityPercent={leftVFProb}
              zoneLabel={leftZone.zone}
            />
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT ARENA: HOUSE B (RCCB 30mA + MCB - SURVIVED)        */}
        {/* ========================================================= */}
        <div className="flex flex-col bg-slate-900/90 border-2 border-emerald-900/70 rounded-2xl p-2.5 sm:p-3 relative overflow-hidden shadow-2xl">
          
          {/* Header Badge (Minimalist) */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-emerald-950/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                HOUSE B: 30mA RCCB + MCB
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
              🛡️ CUTS POWER IN 0.03s
            </span>
          </div>

          {/* Central Visual Shock Arena: Tall SVG Graphics */}
          <div className="flex-1 min-h-[220px] bg-slate-950 border border-slate-800 rounded-xl p-2 relative overflow-hidden flex flex-col items-center justify-between">
            
            {/* Arc Flash on trip */}
            {rightArcFlash && (
              <div className="absolute inset-0 bg-cyan-400/30 z-20 pointer-events-none animate-ping" />
            )}

            {/* Upper SVG: RCCB Snap & Protective Forcefield */}
            <svg
              viewBox="0 0 360 210"
              className="w-full h-full max-h-[240px] select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="shieldGlowGreen" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 230V Socket & 30mA RCCB Unit (Top-Left) */}
              <g transform="translate(20, 20)">
                <rect
                  x="0"
                  y="0"
                  width="85"
                  height="50"
                  rx="6"
                  fill="#1e293b"
                  stroke={isRightSurvived ? "#10b981" : "#f59e0b"}
                  strokeWidth="2"
                />
                <text x="42" y="15" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="black">30mA RCCB</text>
                {/* Switch lever: Snaps DOWN [O] when tripped! */}
                <rect
                  x="34"
                  y={isRightSurvived ? 28 : 22}
                  width="16"
                  height="20"
                  rx="3"
                  fill={isRightSurvived ? "#ef4444" : "#22c55e"}
                />
                <text
                  x="42"
                  y={isRightSurvived ? 42 : 36}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="black"
                >
                  {isRightSurvived ? "O" : "I"}
                </text>
                <text x="42" y="46" textAnchor="middle" fill="#94a3b8" fontSize="6.5">
                  {isRightSurvived ? "TRIPPED IN 30ms" : "SENSING..."}
                </text>
              </g>

              {/* Live Wire from Breaker to Outlet Terminal */}
              <path
                d="M 105 45 L 180 45"
                fill="none"
                stroke={isRightSurvived ? "#475569" : "#ea580c"}
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Child Silhouette Protected */}
              <g transform="translate(180, 25)">
                {/* Hand touching wire */}
                <circle cx="0" cy="20" r="5" fill={isRightSurvived ? "#64748b" : "#f87171"} />
                
                {/* Head */}
                <circle cx="35" cy="15" r="14" fill="#64748b" stroke="#10b981" strokeWidth="2" />
                {/* Happy/Relieved eyes */}
                <circle cx="32" cy="14" r="2" fill="#10b981" />
                <circle cx="38" cy="14" r="2" fill="#10b981" />

                {/* Torso */}
                <line x1="35" y1="29" x2="35" y2="85" stroke="#475569" strokeWidth="12" strokeLinecap="round" />

                {/* Arms */}
                <line x1="0" y1="20" x2="35" y2="40" stroke="#475569" strokeWidth="7" strokeLinecap="round" />
                <line x1="35" y1="40" x2="60" y2="55" stroke="#475569" strokeWidth="7" strokeLinecap="round" />

                {/* Healthy Heart Location in Chest */}
                <g transform="translate(35, 50)">
                  <circle cx="0" cy="0" r="8" fill="#10b981" className="animate-pulse" />
                  <HeartPulse className="w-4 h-4 text-white -translate-x-2 -translate-y-2" />
                </g>

                {/* Legs down to ground */}
                <line x1="35" y1="85" x2="20" y2="150" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
                <line x1="35" y1="85" x2="50" y2="150" stroke="#334155" strokeWidth="7" strokeLinecap="round" />

                {/* Ground plane */}
                <line x1="0" y1="150" x2="80" y2="150" stroke="#64748b" strokeWidth="3" />
                <line x1="10" y1="155" x2="70" y2="155" stroke="#64748b" strokeWidth="2" />

                {/* PROTECTIVE FORCEFIELD DOME (WRAPS CHILD ON TRIP) */}
                {isRightSurvived && (
                  <g filter="url(#shieldGlowGreen)">
                    <ellipse
                      cx="35"
                      cy="80"
                      rx="48"
                      ry="80"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="3"
                      strokeDasharray="6 3"
                      className="animate-pulse"
                    />
                    <ellipse
                      cx="35"
                      cy="80"
                      rx="45"
                      ry="76"
                      fill="#10b981"
                      fillOpacity="0.12"
                    />
                  </g>
                )}
              </g>

              {/* Shock Status Readout Box (Top-Right) */}
              <g transform="translate(245, 20)">
                <rect
                  x="0"
                  y="0"
                  width="105"
                  height="55"
                  rx="6"
                  fill={isRightSurvived ? "#064e3b" : "#451a03"}
                  stroke={isRightSurvived ? "#10b981" : "#f59e0b"}
                  strokeWidth="1.5"
                />
                <text x="52" y="16" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontWeight="bold">
                  {isRightSurvived ? "SHOCK ISOLATED" : "SENSING FLUX"}
                </text>
                <text
                  x="52"
                  y="32"
                  textAnchor="middle"
                  fill={isRightSurvived ? "#34d399" : "#fef08a"}
                  fontSize="13"
                  fontWeight="black"
                >
                  {isRightSurvived ? "0 mA (CUT!)" : "230 mA"}
                </text>
                <text x="52" y="46" textAnchor="middle" fill="#6ee7b7" fontSize="7.5" fontWeight="bold">
                  {isRightSurvived ? "CLEARED IN 0.03s" : "TRIP IMMINENT"}
                </text>
              </g>
            </svg>

            {/* Real-time Oscilloscope ECG Monitor */}
            <div className="w-full bg-slate-900 border border-emerald-950 rounded-lg p-2 flex flex-col gap-1 shrink-0">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>HEART RHYTHM (ECG LEAD II):</span>
                </span>
                <span className="font-bold text-emerald-300">
                  💚 NORMAL SINUS RHYTHM (SAFE)
                </span>
              </div>

              {/* Animated ECG SVG Path */}
              <div className="w-full h-12 bg-slate-950 rounded border border-slate-800 overflow-hidden relative flex items-center justify-center">
                {/* Oscilloscope grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:15px_15px] opacity-30" />
                <svg viewBox="0 0 300 70" className="w-full h-full" preserveAspectRatio="none">
                  <path
                    d={rightEcgPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Safety Progress Bar */}
              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <span>IEC 60479 Zone: <strong className="text-emerald-400">{rightZone.zone} (Safe)</strong></span>
                <span>Power Cleared in: {rightTripTimeMs ?? 30}ms</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, (rightDurationMs / 1000) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Verdict Stamp Overlay when RCCB trips */}
          {isRightSurvived && (
            <VerdictStamp
              verdict="SURVIVED"
              tripTimeMs={rightTripTimeMs ?? 30}
              durationMs={rightDurationMs}
              bodyCurrentMA={bodyCurrentMA}
              vfProbabilityPercent={0}
              zoneLabel={rightZone.zone}
            />
          )}
        </div>
      </main>

      {/* 3. SCIENTIFIC TAKEAWAY FOOTER BAR (Single-Line Ultra Compact) */}
      <footer className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px] font-sans shrink-0">
        <span className="text-slate-300">
          <strong className="text-white font-bold">Key Takeaway:</strong> 16A MCB protects copper wires from catching fire. Only a <strong className="text-emerald-400">30mA RCCB</strong> can detect tiny shock currents and snap off in 0.03s to save human life!
        </span>
        <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">
          IEC 60479-1 / IEC 61008-1
        </span>
      </footer>
    </div>
  );
};
