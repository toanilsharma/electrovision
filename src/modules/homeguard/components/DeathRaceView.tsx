/**
 * Death Race View Component (HG5)
 * 
 * Split-screen comparative race:
 * - Two independent physics engine instances (R5 instance-safe).
 * - One synchronized master clock.
 * - Same fault: Child touches live wire, wet skin -> 230mA prospective touch current (IEC 60479).
 * - Left House: MCB-Only (16A C-Curve) -> bimetal ignores 230mA (0.014x In), timer enters VF-zone (lethal).
 * - Right House: RCCB (30mA Type A) + MCB -> trips at core RCD time (<= 40ms), child survives.
 * - Verdict stamps via core alerts.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createMCB, MCBEngineInstance } from '@/src/core/physics/mcbEngine';
import { createRCD, RCDEngineInstance } from '@/src/core/physics/rcdEngine';
import { classifyIECZone, getC3Threshold, IECZoneResult } from '@/src/core/physics/bodyCurrent';
import { MCBState } from '@/src/mcb/types';
import { ModularDeviceFaceplate } from '@/src/core/ui/faceplates/ModularDeviceFaceplate';
import { VerdictStamp } from './VerdictStamp';
import { defaultSoundKit } from '@/src/core/ui/audio/soundKit';
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
  Info
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
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.25); // Default 0.25x Slow-Mo for high-detail electrophysiology!

  // Fault parameters (Child touch, wet skin, 230V TN-S)
  const touchVoltage = 230; // 230V RMS
  const bodyCurrentMA = 230; // 230mA prospective body current per IEC 60479
  const bodyCurrentA = bodyCurrentMA / 1000; // 0.23A

  // 1. Two Independent Engine Instances (R5 Instance-Safe)
  const leftMCBRef = useRef<MCBEngineInstance>(createMCB({ In: 16, curve: 'C', ambientTemp: 30 }));
  const rightRCCBRef = useRef<RCDEngineInstance>(createRCD({ iDeltaN: 30 }));
  const rightMCBRef = useRef<MCBEngineInstance>(createMCB({ In: 16, curve: 'C', ambientTemp: 30 }));

  // Tripping states
  const [leftMCBState, setLeftMCBState] = useState<MCBState>(MCBState.CLOSED);
  const [rightRCCBState, setRightRCCBState] = useState<MCBState>(MCBState.CLOSED);
  const [rightTripTimeMs, setRightTripTimeMs] = useState<number | null>(null);

  // Sound triggered flags to prevent repeated audio on frames
  const rightTripSoundFiredRef = useRef<boolean>(false);
  const leftVFSoundFiredRef = useRef<boolean>(false);

  // Reset function
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setElapsedMs(0);
    leftMCBRef.current = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    rightRCCBRef.current = createRCD({ iDeltaN: 30 });
    rightMCBRef.current = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    setLeftMCBState(MCBState.CLOSED);
    setRightRCCBState(MCBState.CLOSED);
    setRightTripTimeMs(null);
    rightTripSoundFiredRef.current = false;
    leftVFSoundFiredRef.current = false;
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

          // 1. Right House Engine Logic: Trips at targetRightTripMs
          if (next >= targetRightTripMs && rightRCCBState === MCBState.CLOSED) {
            setRightRCCBState(MCBState.OPEN_CLEARED);
            setRightTripTimeMs(Math.round(targetRightTripMs));
            if (!rightTripSoundFiredRef.current) {
              defaultSoundKit.playTrip(false);
              rightTripSoundFiredRef.current = true;
            }
          }

          // 2. Left House Engine Logic: MCB steps with 0.23A load (0.014x In)
          // 0.23A is far below 1.13x In non-tripping current -> stays CLOSED forever!
          if (next < 2500) {
            leftMCBRef.current.step(simDtMs / 1000, bodyCurrentA);
          }

          // Cap at 1500ms for full educational demonstration
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

  // Curve c3 VF threshold at current duration
  const currentC3MA = getC3Threshold(leftDurationSec);

  // Left house VF probability
  let leftVFProb = 0;
  if (leftZone.zone === 'AC-4.1') leftVFProb = 5;
  else if (leftZone.zone === 'AC-4.2') leftVFProb = 50;
  else if (leftZone.zone === 'AC-4.3') leftVFProb = 95;

  // Left house verdict active when entering lethal zone (t >= 254ms or zone AC-4.1+)
  const isLeftLethal = elapsedMs >= 254 || leftZone.zone.startsWith('AC-4');
  const isRightSurvived = rightRCCBState !== MCBState.CLOSED;

  // Real-time body currents flowing
  const activeLeftCurrentMA = bodyCurrentMA; // Continuous lethal flow!
  const activeRightCurrentMA = isRightSurvived ? 0 : bodyCurrentMA; // Collapses to 0mA upon RCCB trip

  return (
    <div className={cn(
      "flex flex-col h-full w-full bg-slate-950 text-slate-100 font-mono select-none overflow-hidden relative",
      className
    )}>
      {/* 1. MASTER SYNCHRONIZED CONTROLLER HEADER */}
      <header className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm sm:text-base tracking-wider">
                DEATH RACE: MCB-ONLY vs RCCB+MCB
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-800">
                IEC 60479-1 SHOCK LAB
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Child touches live element with wet skin (230mA touch current)
            </p>
          </div>
        </div>

        {/* Center: Synced Clock & Controls */}
        <div className="flex items-center gap-2">
          {/* Master Start / Pause */}
          <button
            type="button"
            onClick={() => {
              if (elapsedMs >= 1500) handleReset();
              setIsRunning(r => !r);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg",
              isRunning
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                : "bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.4)] animate-pulse"
            )}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? "PAUSE CLOCK" : elapsedMs > 0 ? "RESUME RACE" : "TRIGGER 230mA SHOCK RACE"}</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer transition-colors"
            title="Reset Race"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selection */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <span className="text-slate-500 font-bold px-1 hidden sm:inline">SPEED:</span>
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
        </div>

        {/* Master Synchronized Timer Display */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-750 px-3 py-1 rounded-xl shadow-inner font-mono">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400">SYNCED TIME:</span>
          <span className="text-sm font-black text-cyan-300 min-w-[70px] text-right">
            {elapsedMs.toFixed(1)} ms
          </span>
        </div>
      </header>

      {/* Item 8: Electrophysiology Story Banner for Parents & Kids */}
      <div className="mx-3 mt-2 p-2.5 bg-gradient-to-r from-rose-950/70 via-slate-900 to-emerald-950/70 border border-slate-750 rounded-xl text-xs font-sans flex flex-wrap items-center justify-between gap-2 text-slate-200 shrink-0">
        <div className="flex items-center gap-2 max-w-3xl">
          <span className="text-base shrink-0">💓</span>
          <p className="leading-snug">
            <strong className="text-white font-bold">The 0.05-Second Race:</strong> A normal heart beats rhythmically (lub-dub). When a 230mA electric shock enters the chest, it scrambles heart signals into chaotic vibrating jelly (Ventricular Fibrillation), stopping blood flow in 0.05s! Can the RCCB snap off faster than a single heartbeat?
          </p>
        </div>
        <div className="text-[11px] text-amber-300 font-mono font-bold shrink-0">
          ⚡ 0.23A Shock vs Heart Rhythm
        </div>
      </div>

      {/* 2. SPLIT SCREEN COMPARISON STAGE */}
      <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 overflow-hidden">
        
        {/* ========================================================= */}
        {/* LEFT VIEWPORT: UNPROTECTED HOUSE (MCB ONLY - 16A C-CURVE) */}
        {/* ========================================================= */}
        <div className="flex flex-col bg-slate-900 border-2 border-rose-900/60 rounded-2xl p-3.5 relative overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-950/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-rose-500/20 border border-rose-500/50 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-rose-300 uppercase tracking-wide">
                  HOUSE A: MCB ONLY (NO RCD)
                </h4>
                <div className="text-[10px] text-slate-400 font-sans">
                  Protected only by standard 16A C-Curve Breaker
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-400 border border-rose-800">
              UNPROTECTED
            </span>
          </div>

          {/* Breaker Physical State & Bimetal Heat Display */}
          <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
            {/* Breaker Faceplate & Lever */}
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 mb-1 font-bold uppercase">Breaker Contacts</span>
              <div className="px-3 py-1 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 font-black text-xs">
                STILL CLOSED [I]
              </div>
              <span className="text-[9px] text-slate-500 mt-1 text-center font-sans">
                Never trips: 0.23A &lt;&lt; 18.1A trip threshold
              </span>
            </div>

            {/* Bimetal Temperature */}
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 mb-1 font-bold uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" /> Bimetal Strip
              </span>
              <div className="text-base font-black text-slate-300 font-mono">
                30.0 °C
              </div>
              <span className="text-[9px] text-amber-400/80 mt-1 text-center font-sans">
                Cold: ignoring 230mA completely
              </span>
            </div>
          </div>

          {/* Child Contact Diagram & Live Current Path */}
          <div className="flex-1 min-h-[140px] bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Shock Flow (Child Hand-to-Foot):</span>
              </span>
              <span className="font-mono font-black text-rose-400 text-sm animate-pulse">
                {activeLeftCurrentMA} mA (CONTINUOUS)
              </span>
            </div>

            {/* Visual Human Electrocution Pulse */}
            <div className="my-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <HeartPulse className={cn(
                  "w-6 h-6",
                  elapsedMs >= 254 ? "text-rose-500 animate-ping" : "text-amber-400 animate-bounce"
                )} />
                <div>
                  <div className="font-bold text-rose-300">
                    {elapsedMs >= 570 ? "💀 CARDIAC ARREST (Heart vibrating like jelly!)" :
                     elapsedMs >= 254 ? "⚠️ CHAOTIC FIBRILLATION (Blood stopped pumping!)" :
                     "⚡ SEVERE MUSCLE LOCK (Child cannot let go!)"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    Standard 16A switch ignores 0.23A shock (only trips at 16A+)
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-xs text-rose-400">
                VF Risk: {leftVFProb}%
              </div>
            </div>

            {/* IEC 60479 Physiological Zone Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
                <span>IEC 60479 Zone: <strong className="text-rose-400">{leftZone.zone}</strong></span>
                <span>Threshold c3: 254ms</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                {/* 254ms Marker line */}
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

        {/* =========================================================== */}
        {/* RIGHT VIEWPORT: PROTECTED HOUSE (RCCB 30mA + 16A C-CURVE)  */}
        {/* =========================================================== */}
        <div className="flex flex-col bg-slate-900 border-2 border-emerald-900/60 rounded-2xl p-3.5 relative overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-950/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                  HOUSE B: RCCB + MCB (MODERN)
                </h4>
                <div className="text-[10px] text-slate-400 font-sans">
                  Protected by 40A 30mA Type A RCCB (IEC 61008-1)
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
              LIFE-SAVING RCD
            </span>
          </div>

          {/* Breaker Physical State & Toroid Core Sensed */}
          <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
            {/* Breaker Faceplate & Lever */}
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 mb-1 font-bold uppercase">RCCB Contacts</span>
              <div className={cn(
                "px-3 py-1 rounded font-black text-xs transition-colors",
                isRightSurvived
                  ? "bg-rose-950 text-rose-400 border border-rose-500 animate-pulse"
                  : "bg-emerald-950 text-emerald-400 border border-emerald-500"
              )}>
                {isRightSurvived ? "TRIPPED [O] (SAFE)" : "ARMED [I]"}
              </div>
              <span className="text-[9px] text-emerald-400/90 mt-1 text-center font-sans font-bold">
                {isRightSurvived ? `Cleared in ${rightTripTimeMs}ms` : 'Sensing toroid flux...'}
              </span>
            </div>

            {/* Toroid Net Flux Detection */}
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 mb-1 font-bold uppercase flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" /> Toroid Sense Coil
              </span>
              <div className="text-base font-black text-cyan-300 font-mono">
                {isRightSurvived ? "0 µWb (CUT)" : "32.2 µWb"}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 text-center font-sans">
                {isRightSurvived ? "Power Disconnected" : "Net Flux Detected!"}
              </span>
            </div>
          </div>

          {/* Child Contact Diagram & Rapid Clearance */}
          <div className="flex-1 min-h-[140px] bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Shock Flow (Child Hand-to-Foot):</span>
              </span>
              <span className={cn(
                "font-mono font-black text-sm",
                isRightSurvived ? "text-emerald-400" : "text-amber-400 animate-pulse"
              )}>
                {activeRightCurrentMA} mA {isRightSurvived && "(CLEARED!)"}
              </span>
            </div>

            {/* Visual Human Electrocution Pulse */}
            <div className="my-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="font-bold text-emerald-300">
                    {isRightSurvived ? "🛡️ SAVED! Power Cut in 0.03s (Faster than 1 Heartbeat!)" : "SENSING RESIDUAL CURRENT..."}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    Shock cleared in {rightDurationMs.toFixed(0)} ms | Heart rhythm remains completely safe!
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-xs text-emerald-400">
                VF Risk: 0%
              </div>
            </div>

            {/* IEC 60479 Physiological Zone Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
                <span>IEC 60479 Zone: <strong className="text-emerald-400">{rightZone.zone} (Safe)</strong></span>
                <span>Trip Time: {rightTripTimeMs ?? targetRightTripMs}ms</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
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

      {/* 3. SCIENTIFIC TAKEAWAY FOOTER BAR */}
      <footer className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-sans shrink-0">
        <div className="flex items-center gap-2 text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>The Vital Lesson:</strong> A 16A circuit breaker (MCB) protects <em>wires from catching fire</em>.
            A human is killed by just 0.05A (50mA). Only an <strong>RCD / RCCB</strong> can detect tiny shock currents and trip fast enough to save a life.
          </span>
        </div>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors cursor-pointer"
          >
            Return to 2.5D House
          </button>
        )}
      </footer>
    </div>
  );
};
