import React, { useState, useEffect, useRef } from 'react';
import { MobileActionButton } from '../MobileActionButton';
import { HumanBodyTwin } from '../HumanBodyTwin';
import { EmergencyResponse } from '../EmergencyResponse';
import { DiagnosticScope } from '../DiagnosticScope';
import { Battery, Droplets, Zap, TrendingUp, AlertTriangle, BookOpen, Clock } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ShockEffectLevel, PPEItem, UserConfig } from '@/src/types';
import { PPEValidator } from '../PPEValidator';
import { useAudioHaptics } from '../useAudioHaptics';
import { motion } from 'motion/react';
import { HazardOverlay } from '../HazardOverlay';
import { SafetyLessonModal } from '../SafetyLessonModal';

export function DCShockSimulator({ config }: { config?: UserConfig }) {
  const [voltage, setVoltage] = useState<number>(300);
  const [duration, setDuration] = useState<number>(0);
  const [skinCondition, setSkinCondition] = useState<'dry' | 'wet'>('dry');
  const [path, setPath] = useState<'hand-to-hand' | 'hand-to-foot'>('hand-to-hand');
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isPPESafe, setIsPPESafe] = useState(false);
  const [activePPENames, setActivePPENames] = useState<string[]>([]);
  const [isMuscleLocked, setIsMuscleLocked] = useState(false);
  const [showSafetyLesson, setShowSafetyLesson] = useState(false);
  const [lastActiveShockData, setLastActiveShockData] = useState<{
    currentMA: number;
    durationMs: number;
    skinCondition: 'dry' | 'wet';
    path: 'hand-to-hand' | 'hand-to-foot';
    voltage: number;
    isPPESafe: boolean;
    activePPENames: string[];
  }>({
    currentMA: 0,
    durationMs: 0,
    skinCondition: 'dry',
    path: 'hand-to-foot',
    voltage: 300,
    isPPESafe: false,
    activePPENames: []
  });
  const { startHum, stopHum, triggerMuscleLockVibration } = useAudioHaptics();

  useEffect(() => {
    if (config?.environment === 'industrial') {
      setVoltage(600);
    } else {
      setVoltage(120);
    }
  }, [config]);

  // Record active DC shock parameters while simulating
  useEffect(() => {
    if (isSimulating) {
      const rawBodyImpedance = skinCondition === 'dry' ? 2500 : 700;
      const currentMA = (voltage / rawBodyImpedance) * 1000;
      setLastActiveShockData({
        currentMA,
        durationMs: duration,
        skinCondition,
        path,
        voltage,
        isPPESafe,
        activePPENames
      });
    }
  }, [isSimulating, voltage, duration, skinCondition, path, isPPESafe, activePPENames]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSimulating) {
      interval = setInterval(() => {
        setDuration(prev => Math.min(prev + 50, 10000));
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating]);

  useEffect(() => {
    let vibInterval: ReturnType<typeof setInterval>;
    if (isMuscleLocked && isSimulating) {
      triggerMuscleLockVibration();
      vibInterval = setInterval(() => {
        triggerMuscleLockVibration();
      }, 300);
    }
    return () => {
      if (vibInterval) clearInterval(vibInterval);
    };
  }, [isMuscleLocked, isSimulating, triggerMuscleLockVibration]);

  const handleStart = () => {
    setIsSimulating(true);
    setHasSimulated(true);
    setDuration(0);
    startHum(30); 
  };

  const handleStop = () => {
    if (isMuscleLocked && isSimulating) {
      triggerMuscleLockVibration();
      return; // Muscle tetanization locked
    }
    setIsSimulating(false);
    setIsMuscleLocked(false);
    stopHum();
  };

  const handleEmergencyCutoff = () => {
    setIsSimulating(false);
    setIsMuscleLocked(false);
    stopHum();
  };

  const getResistance = () => {
    let r = 0;
    if (skinCondition === 'dry') {
       if (voltage <= 50) r = 3800;
       else if (voltage <= 120) r = 2500;
       else if (voltage <= 230) r = 1500;
       else if (voltage <= 400) r = 1000;
       else r = 750; 
    } else {
       if (voltage <= 50) r = 1600;
       else if (voltage <= 120) r = 1200;
       else if (voltage <= 230) r = 900;
       else if (voltage <= 400) r = 750;
       else r = 650;
    }
    
    const heartFactor = path === 'hand-to-foot' ? 1.0 : 0.4;
    
    if (config?.profile === 'child') {
      r = r * 0.7;
    }

    return { r, heartFactor };
  };

  const getC1Threshold = (tMs: number) => {
    const table = [
      [0, 800], [10, 800], [20, 600], [50, 400], [100, 280], [200, 200], [500, 160], [1000, 120], [10000, 120]
    ];
    if (tMs <= table[0][0]) return table[0][1];
    if (tMs >= table[table.length - 1][0]) return table[table.length - 1][1];
    for (let i = 0; i < table.length - 1; i++) {
      if (tMs >= table[i][0] && tMs <= table[i+1][0]) {
        const t1 = table[i][0];
        const i1 = table[i][1];
        const t2 = table[i+1][0];
        const i2 = table[i+1][1];
        return i1 + ((tMs - t1) / (t2 - t1)) * (i2 - i1);
      }
    }
    return 120;
  };

  const calculateResults = () => {
    const { r, heartFactor } = getResistance();
    const currentAmp = voltage / r;
    const currentMA = currentAmp * 1000;
    const effectiveHeartCurrent = currentMA * heartFactor;
    
    if (!isSimulating) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, level: 0 as ShockEffectLevel, severity: 'SAFE (NO CONTACT)', intensity: 0, heartFactor };
    }
    if (isPPESafe) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, level: 0 as ShockEffectLevel, severity: 'SAFE: PPE INSULATION ACTIVE', intensity: 0, heartFactor };
    }
    
    let level: ShockEffectLevel = 1;
    let severity = 'DC-1 (Perception)';
    
    const c1 = getC1Threshold(duration);
    const c2 = c1 * 1.5;
    const c3 = c1 * 2.5;
    
    if (effectiveHeartCurrent > 2) { level = 2; severity = 'DC-2 (Involuntary Contractions)'; }
    if (effectiveHeartCurrent > 30) { level = 3; severity = 'DC-3 (Strong muscular reactions)'; }
    
    if (duration > 0) {
       if (effectiveHeartCurrent > c1) { level = 7; severity = 'DC-4.1 (<5% V-Fib Prob)'; }
       if (effectiveHeartCurrent > c2) { level = 8; severity = 'DC-4.2 (<50% V-Fib Prob)'; }
       if (effectiveHeartCurrent > c3) { level = 9; severity = 'DC-4.3 (>50% V-Fib Prob)'; }
    }
    
    const i2t = Math.pow(currentAmp, 2) * (duration / 1000);
    const intensityCurrent = Math.min(effectiveHeartCurrent / 300, 1) * 0.5;
    const intensityEnergy = Math.min(i2t / 0.05, 1) * 0.5;
    const intensity = Math.min(intensityCurrent + intensityEnergy, 1.0);
    
    return { currentMA, effectiveHeartCurrent, r, level, severity, intensity, heartFactor };
  };

  const results = calculateResults();

  // Instant trigger for Muscle Lock when current > 20mA
  useEffect(() => {
    if (isSimulating && !isPPESafe && results.currentMA > 20) {
      if (!isMuscleLocked) {
        setIsMuscleLocked(true);
      }
    } else if (isMuscleLocked && (!isSimulating || isPPESafe || results.currentMA <= 20)) {
      setIsMuscleLocked(false);
    }
  }, [isSimulating, isPPESafe, results.currentMA, isMuscleLocked]);

  const prevSimulating = useRef(isSimulating);
  useEffect(() => {
    if (prevSimulating.current && !isSimulating && hasSimulated) {
      setShowSafetyLesson(true);
    }
    prevSimulating.current = isSimulating;
  }, [isSimulating, hasSimulated]);

  return (
    <motion.div 
      className="flex flex-col lg:flex-row h-full gap-2.5 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0"
      animate={{ x: isSimulating ? [-1, 1, -2, 2, -1, 1, 0] : 0 }}
      transition={{ duration: 0.15, repeat: isSimulating ? Infinity : 0, ease: "linear" }}
    >
      {/* Column 1: Controls & Prominent HOLD TO SHOCK Button */}
      <div className="w-full lg:w-[310px] xl:w-[330px] shrink-0 p-3 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-lg flex flex-col h-[40vh] lg:h-full overflow-y-auto lg:overflow-y-auto order-1 lg:order-1 justify-between">
        <div className="space-y-3 flex-1 flex flex-col">
          <h3 className="flex items-center gap-2 text-xs font-black tracking-[0.2em] uppercase text-teal-400 border-l-3 border-teal-500 pl-2 shrink-0">
            <Battery className="w-4 h-4 text-teal-400" /> DC Parameters
          </h3>
          
          <div>
            <label className="flex justify-between mb-1 text-xs font-bold text-white uppercase tracking-wider">
              <span>DC Voltage (V)</span>
              <span className="text-teal-400 font-black">{voltage} V DC</span>
            </label>
            <input
              type="range"
              min="50" max="1500" step="10"
              value={voltage}
              onChange={(e) => setVoltage(Number(e.target.value))}
              disabled={isMuscleLocked}
              className="w-full accent-teal-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-teal-400"/> Shock Duration</span>
            <span className="text-base font-black font-mono text-teal-400">{duration} ms</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Skin Condition</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => !isMuscleLocked && setSkinCondition('dry')}
                className={cn("px-2.5 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all cursor-pointer", skinCondition === 'dry' ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Dry Skin
              </button>
              <button
                onClick={() => !isMuscleLocked && setSkinCondition('wet')}
                className={cn("px-2.5 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all cursor-pointer", skinCondition === 'wet' ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Wet / Perspired
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Current Path</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => !isMuscleLocked && setPath('hand-to-hand')}
                className={cn("px-2.5 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all cursor-pointer", path === 'hand-to-hand' ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Hand - Hand
              </button>
              <button
                onClick={() => !isMuscleLocked && setPath('hand-to-foot')}
                className={cn("px-2.5 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all cursor-pointer", path === 'hand-to-foot' ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Hand - Foot
              </button>
            </div>
          </div>

          {/* Bystander Emergency Power Cutoff when Muscle Locked */}
          {isMuscleLocked && (
            <div className="mt-2 p-3 bg-amber-950 border-2 border-amber-400 rounded-xl shadow-2xl space-y-2 animate-pulse">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-widest">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Tetanization (&gt;20mA)</span>
              </div>
              <p className="text-[11px] font-bold text-amber-100 leading-tight">
                Flexor muscles locked! You cannot release the DC contact electrode. Wait for someone to trip the breaker.
              </p>
              <button
                onClick={handleEmergencyCutoff}
                className="w-full py-2.5 px-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 font-black text-xs uppercase tracking-widest rounded-lg shadow-lg border-2 border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current text-slate-900" />
                <span>⚡ BYSTANDER: SWITCH OFF POWER</span>
              </button>
            </div>
          )}
        </div>

        {/* Desktop Large Prominent HOLD TO SHOCK Button */}
        <div className="hidden lg:block pt-3 shrink-0">
          <button
            onPointerDown={(e) => handleStart()}
            onPointerUp={(e) => handleStop()}
            onPointerLeave={handleStop}
            onPointerCancel={handleStop}
            onContextMenu={(e) => e.preventDefault()}
            style={{ touchAction: 'none' }}
            className={cn(
              "w-full py-4 px-3 text-sm md:text-base font-black tracking-widest uppercase transition-all rounded-2xl flex flex-col items-center justify-center gap-1 select-none border-2 cursor-pointer shadow-xl active:scale-95",
              isMuscleLocked
                ? "bg-red-700 border-red-400 text-white shadow-[0_0_45px_rgba(239,68,68,1)] animate-muscle-shake"
                : isSimulating
                  ? "bg-red-600 border-red-400 text-white shadow-[0_0_35px_rgba(239,68,68,0.8)] animate-pulse"
                  : "bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 border-teal-200 text-slate-950 shadow-[0_0_25px_rgba(20,184,166,0.4)] hover:shadow-[0_0_40px_rgba(20,184,166,0.6)]"
            )}
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-center">
              <Zap className={cn("w-5 h-5 fill-current shrink-0", (isSimulating || isMuscleLocked) && "animate-bounce")} />
              <span>
                {isMuscleLocked
                  ? "MUSCLE LOCK: YOU CANNOT LET GO"
                  : isSimulating
                    ? "⚡ DC SHOCK ACTIVE..."
                    : "⚡ HOLD TO SHOCK"}
              </span>
            </div>
            <span className="text-[9px] font-bold font-mono tracking-normal opacity-90">
              {isMuscleLocked
                ? "WAIT FOR BYSTANDER TO SWITCH OFF"
                : isSimulating
                  ? "RELEASE TO DISCONNECT"
                  : "PRESS & HOLD BUTTON DOWN"}
            </span>
          </button>
        </div>

        {/* Mobile Action Button */}
        <MobileActionButton>
          <button
            onPointerDown={(e) => handleStart()}
            onPointerUp={(e) => handleStop()}
            onPointerLeave={handleStop}
            onPointerCancel={handleStop}
            onContextMenu={(e) => e.preventDefault()}
            style={{ touchAction: 'none' }}
            className={cn(
              "w-full py-4 text-base tracking-widest font-black uppercase transition-all rounded-2xl border-2 flex items-center justify-center gap-2 select-none shadow-[0_15px_30px_rgba(0,0,0,0.8)]",
              isMuscleLocked
                ? "bg-red-700 border-red-400 text-white shadow-[0_0_45px_rgba(239,68,68,1)] animate-muscle-shake"
                : "bg-gradient-to-r from-teal-400 to-cyan-400 border-teal-200 text-slate-950 active:scale-95"
            )}
            aria-live="polite"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>
              {isMuscleLocked ? "MUSCLE LOCK: YOU CANNOT LET GO" : "HOLD TO SHOCK"}
            </span>
          </button>
        </MobileActionButton>
      </div>

      {/* Column 2: Analysis & PPE */}
      <div className="flex-1 min-w-[280px] xl:min-w-[320px] p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-lg flex flex-col h-auto lg:h-full overflow-y-auto order-3 lg:order-2 justify-between space-y-2">
        <h3 className="flex items-center gap-2 mb-1.5 text-xs font-black tracking-[0.2em] uppercase text-teal-400 border-l-3 border-teal-500 pl-2 shrink-0">
          <TrendingUp className="w-4 h-4 text-teal-400" /> IEC 60479-1 DC Analysis
        </h3>
        
        <div className="flex-1 flex flex-col justify-between space-y-2 min-h-0">
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">Impedance (Z_T)</span>
              <span className="text-base font-black font-mono text-white">{results.r.toFixed(0)} Ω</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">Heart Factor</span>
              <span className="text-base font-black font-mono text-white">{results.heartFactor.toFixed(1)} F</span>
            </div>
          </div>

          <div className="flex justify-between items-end p-2.5 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            <div>
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-0.5 block">Prospective Current</span>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-xl font-black font-mono tracking-tighter", isSimulating ? 'text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]' : 'text-white')}>
                  {results.currentMA.toFixed(1)}
                </span>
                <span className="text-slate-400 font-mono text-[9px] uppercase">mA</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold tracking-widest text-amber-300 uppercase mb-0.5 block">Eq. Heart Current</span>
              <span className="text-base font-black font-mono text-yellow-300 drop-shadow">{results.effectiveHeartCurrent.toFixed(1)} mA</span>
            </div>
          </div>
          
          <div className="flex flex-col shrink-0 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">Shock Severity (Level {results.level}/9)</span>
            <span className={cn("text-xs font-black uppercase tracking-wider leading-tight", 
              results.level === 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' :
              results.level > 6 ? 'text-yellow-300 bg-red-950/90 px-2 py-1 rounded border border-red-500 shadow-lg' : 
              results.level > 3 ? 'text-orange-300' : 'text-amber-300'
            )}>
              {results.severity}
            </span>
          </div>
          
          <div className="mt-2 shrink-0">
            <PPEValidator hazardType="shock_dc" hazardMagnitude={voltage} onSafetyChange={(safe, names) => { setIsPPESafe(safe); if (names) setActivePPENames(names); }} />
            <EmergencyResponse isSimulating={isSimulating && !isPPESafe} hasSimulated={hasSimulated} type="shock" />
          </div>
        </div>
      </div>

      {/* Column 3: Human Section & Always-Visible Scopes Area (Zero Scrolling Required) */}
      <div className="w-full lg:w-[480px] xl:w-[540px] shrink-0 flex flex-col gap-2 h-[45vh] lg:h-full overflow-hidden order-2 lg:order-3 relative z-10 bg-slate-950/95 backdrop-blur-md pb-3 lg:pb-0 border-b border-slate-800 lg:border-b-0 shadow-xl">
        {/* Human Body Twin Container - Dynamically scales with flex-1 min-h-0 */}
        <div className="flex-1 min-h-0 w-full relative border border-slate-800 rounded-xl bg-slate-950 shadow-inner overflow-hidden flex flex-col">
          <HumanBodyTwin 
            shockPath={path} 
            intensity={results.intensity}
            currentMA={results.currentMA}
            durationMs={duration} 
            isAnimating={isSimulating} 
            profile={config?.profile}
            isPPESafe={isPPESafe}
            activePPENames={activePPENames}
          />
        </div>
        
        {/* Side-by-Side Diagnostic Scopes Grid (100% ALWAYS VISIBLE AT BOTTOM - ZERO SCROLLING) */}
        <div className="grid grid-cols-2 gap-2 h-24 lg:h-26 shrink-0 w-full">
          <div className="h-full w-full border border-slate-800 rounded-xl p-2 bg-slate-950 flex flex-col shadow-inner overflow-hidden">
             <span className="text-[10px] font-black tracking-wider text-teal-400 uppercase mb-0.5 flex justify-between items-center shrink-0">
               <span>ECG Diagnostics</span>
               {isSimulating && <span className="text-emerald-400 font-mono text-[9px]">LIVE ECG</span>}
             </span>
             <div className="flex-1 overflow-hidden rounded-lg">
               <DiagnosticScope
                 type="ecg"
                 isActive={isSimulating}
                 intensity={results.intensity}
                 voltage={voltage}
                 skinCondition={skinCondition}
                 path={path}
               />
             </div>
          </div>

          <div className="h-full w-full border border-slate-800 rounded-xl p-2 bg-slate-950 flex flex-col shadow-inner overflow-hidden">
             <span className="text-[10px] font-black tracking-wider text-teal-400 uppercase mb-0.5 flex justify-between items-center shrink-0">
               <span>DC Source Scope</span>
               {isSimulating && <span className="text-teal-400 animate-pulse font-mono text-[9px]">{voltage}V DC</span>}
             </span>
             <div className="flex-1 overflow-hidden rounded-lg">
               <DiagnosticScope type="dc" isActive={isSimulating} intensity={results.intensity} voltage={voltage} />
             </div>
          </div>
        </div>
      </div>

      <HazardOverlay 
        isActive={isSimulating && !isPPESafe}
        hazardType="dc_shock"
        dangerLevel={results.level >= 6 ? 'critical' : results.level >= 3 ? 'warning' : 'safe'}
        magnitude={`${results.currentMA.toFixed(1)} mA Body Current`}
      />

      <SafetyLessonModal
        isOpen={showSafetyLesson}
        onClose={() => setShowSafetyLesson(false)}
        currentMA={lastActiveShockData.currentMA}
        durationMs={lastActiveShockData.durationMs}
        skinCondition={lastActiveShockData.skinCondition}
        path={lastActiveShockData.path}
        voltage={lastActiveShockData.voltage}
        isPPESafe={lastActiveShockData.isPPESafe}
        equippedPPENames={lastActiveShockData.activePPENames}
        hazardType="dc"
      />
    </motion.div>
  );
}
