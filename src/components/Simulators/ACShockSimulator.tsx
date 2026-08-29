import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MobileActionButton } from '../MobileActionButton';
import { HumanBodyTwin } from '../HumanBodyTwin';
import { EmergencyResponse } from '../EmergencyResponse';
import { DiagnosticScope } from '../DiagnosticScope';
import { Activity, Droplets, Zap, Clock, UserSquare2, TrendingUp, AlertTriangle, BookOpen, RotateCcw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ShockEffectLevel, PPEItem, UserConfig } from '@/src/types';
import { PPEValidator } from '../PPEValidator';
import { useAudioHaptics } from '../useAudioHaptics';
import { motion } from 'motion/react';
import { InfoTooltip } from '../InfoTooltip';
import { UpgradedDebriefModal } from '../UpgradedDebriefModal';
import { HazardOverlay } from '../HazardOverlay';
import { SafetyLessonModal } from '../SafetyLessonModal';
import { EmergencyBystanderDock } from '../EmergencyBystanderDock';
import { SeverityHeaderBanner } from '../SeverityHeaderBanner';
import { calculateIECImpedance } from '@/src/utils/iec60479Impedance';
import { IECZoneChart } from '../IECZoneChart';
import { useShockAudioEngine } from '@/src/hooks/useShockAudioEngine';
import { useShockHaptics } from '@/src/hooks/useShockHaptics';
import { Volume2, VolumeX, Smartphone } from 'lucide-react';

// IEC 60479-1 AC Touch Voltage Reference Levels (Residential capped ≤415V AC)
const ALL_AC_VOLTAGES = [
  { value: 50, label: '50V (SELV Limit / Safe Touch Voltage)' },
  { value: 120, label: '120V (Low Voltage Nominal)' },
  { value: 230, label: '230V (Single-Phase AC Mains)' },
  { value: 415, label: '415V (3-Phase Residential/Commercial AC)' },
  { value: 700, label: '700V (Elevated Industrial Voltage)', industrialOnly: true },
  { value: 1000, label: '1000V (IEC 60479-1 Upper Limit)', industrialOnly: true },
];

export function ACShockSimulator({ config }: { config?: UserConfig }) {
  const isResidential = config?.environment === 'residential';
  const maxVoltageLimit = isResidential ? 415 : 1000;
  
  const [voltage, setVoltage] = useState<number>(isResidential ? 230 : 230);
  const [duration, setDuration] = useState<number>(0);
  const [skinCondition, setSkinCondition] = useState<'dry' | 'wet'>('dry');
  const [path, setPath] = useState<'hand-to-hand' | 'hand-to-foot'>('hand-to-foot');
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isPPESafe, setIsPPESafe] = useState(false);
  const [activePPENames, setActivePPENames] = useState<string[]>([]);
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
    voltage: 230,
    isPPESafe: false,
    activePPENames: []
  });

  const [showAAR, setShowAAR] = useState(false);
  const [isMuscleLocked, setIsMuscleLocked] = useState(false);
  const [timeScale, setTimeScale] = useState<number>(1.0);

  const { startHum, stopHum, triggerMuscleLockVibration } = useAudioHaptics();

  const standardVoltages = useMemo(() => {
    return ALL_AC_VOLTAGES.filter(v => !isResidential || !v.industrialOnly);
  }, [isResidential]);

  useEffect(() => {
    if (isResidential) {
      if (voltage > 415) setVoltage(415);
    }
  }, [isResidential, voltage]);

  // Synchronized voltage dropdown state binding (strictly IEC 60479-1 levels)
  const isStandardVoltage = standardVoltages.some(item => item.value === voltage);
  const dropdownValue = isStandardVoltage ? voltage.toString() : 'custom';

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val !== 'custom') {
      setVoltage(Number(val));
    }
  };

  const handleSafetyChange = useCallback((safe: boolean, names?: string[]) => {
    setIsPPESafe(safe);
    if (names) setActivePPENames(names);
  }, []);

  const handleResetSimulator = () => {
    setIsSimulating(false);
    setIsMuscleLocked(false);
    stopHum();
    setVoltage(isResidential ? 230 : 415);
    setDuration(0);
    setSkinCondition('dry');
    setPath('hand-to-foot');
    setIsPPESafe(false);
    setActivePPENames([]);
  };

  // Scaled Duration Timer (respects TIME SCALE SLOW-MO)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSimulating) {
      interval = setInterval(() => {
        setDuration(prev => Math.min(prev + Math.round(50 * timeScale), 10000));
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, timeScale]);

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
    startHum(60);
  };

  const handleStop = () => {
    if (isMuscleLocked && isSimulating) {
      triggerMuscleLockVibration();
      return; // Impossible to let go! Muscle tetanization locks fingers on conductor.
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
    let profileMultiplier = 1.0;
    if (config?.profile === 'child') profileMultiplier = 0.60;
    else if (config?.profile === 'teenager') profileMultiplier = 0.75;
    else if (config?.profile === 'adult_female') profileMultiplier = 0.85;
    else if (config?.profile === 'electrician') profileMultiplier = 1.15;

    const iecData = calculateIECImpedance(voltage, skinCondition, profileMultiplier);
    const heartFactor = path === 'hand-to-foot' ? 1.0 : 0.4;

    return {
      r: iecData.totalZ,
      internalZ: iecData.internalZ,
      skinZ: iecData.skinZ,
      citation: iecData.tableCitation,
      heartFactor
    };
  };

  const getC1Threshold = (tMs: number) => {
    const table = [
      [0, 200], [10, 200], [20, 150], [50, 100], [100, 70], [200, 50], [500, 40], [1000, 30], [10000, 30]
    ];
    let baseThreshold = 30;
    if (tMs <= table[0][0]) baseThreshold = table[0][1];
    else if (tMs >= table[table.length - 1][0]) baseThreshold = table[table.length - 1][1];
    else {
      for (let i = 0; i < table.length - 1; i++) {
        if (tMs >= table[i][0] && tMs <= table[i+1][0]) {
          const t1 = table[i][0];
          const i1 = table[i][1];
          const t2 = table[i+1][0];
          const i2 = table[i+1][1];
          baseThreshold = i1 + ((tMs - t1) / (t2 - t1)) * (i2 - i1);
          break;
        }
      }
    }

    // IEC 60479-1 Clause 4.3 Fibrillation Threshold Scaling by Body Mass
    let thresholdMultiplier = 1.0;
    if (config?.profile === 'child') thresholdMultiplier = 0.50;
    else if (config?.profile === 'teenager') thresholdMultiplier = 0.70;
    else if (config?.profile === 'adult_female') thresholdMultiplier = 0.80;

    return baseThreshold * thresholdMultiplier;
  };

  const calculateResults = () => {
    const { r, internalZ, skinZ, citation, heartFactor } = getResistance();
    const currentAmp = voltage / r;
    const currentMA = currentAmp * 1000;
    const effectiveHeartCurrent = currentMA * heartFactor;
    
    if (!isSimulating) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, internalZ, skinZ, citation, level: 0 as ShockEffectLevel, severity: 'SAFE (NO CONTACT)', intensity: 0, heartFactor };
    }
    if (isPPESafe) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, internalZ, skinZ, citation, level: 0 as ShockEffectLevel, severity: 'SAFE: PPE INSULATION ACTIVE', intensity: 0, heartFactor };
    }
    
    let level: ShockEffectLevel = 1;
    let severity = 'Level 1: Slight Tingling (Perception)';
    
    const c1 = getC1Threshold(duration);
    const c2 = c1 * 1.5;
    const c3 = c1 * 2.5;
    
    if (effectiveHeartCurrent > 0.5) { level = 2; severity = 'Level 2: Muscle Twitching'; }
    if (effectiveHeartCurrent > 10) { level = 3; severity = 'Level 3: Muscle Lock (Cannot Let Go)'; }
    
    if (duration > 0) {
       if (effectiveHeartCurrent > c1) { level = 7; severity = 'Level 4.1: High Danger to Heart (<5% V-Fib)'; }
       if (effectiveHeartCurrent > c2) { level = 8; severity = 'Level 4.2: Extreme Heart Danger (<50% V-Fib)'; }
       if (effectiveHeartCurrent > c3) { level = 9; severity = 'Level 4.3: Fatal Heart Arrest (>50% V-Fib)'; }
    }
    
    const i2t = Math.pow(currentAmp, 2) * (duration / 1000);
    const intensityCurrent = Math.min(effectiveHeartCurrent / 100, 1) * 0.5;
    const intensityEnergy = Math.min(i2t / 0.05, 1) * 0.5;
    const intensity = Math.min(intensityCurrent + intensityEnergy, 1.0);
    
    return { currentMA, effectiveHeartCurrent, r, internalZ, skinZ, citation, level, severity, intensity, heartFactor };
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
      if (results.level >= 6 || (!isPPESafe && results.level >= 3)) {
        setShowAAR(true);
      }
    }
    prevSimulating.current = isSimulating;
  }, [isSimulating, hasSimulated, results.level, isPPESafe]);

  return (
    <motion.div 
      className="flex flex-col lg:flex-row h-full gap-2.5 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0"
      animate={{ x: isSimulating ? [-2, 2, -3, 3, -1, 1, 0] : 0 }}
      transition={{ duration: 0.2, repeat: isSimulating ? Infinity : 0, ease: "linear" }}
    >
      {/* Column 1: Left Controls Panel (Compact, Zero Scroll, Hold Button Always Visible) */}
      <div className="w-full lg:w-[310px] xl:w-[330px] shrink-0 p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col h-auto lg:h-full justify-between order-1 lg:order-1 overflow-hidden">
        <div className="space-y-2 flex-1 flex flex-col overflow-y-auto lg:overflow-visible">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 shrink-0">
            <h3 className="flex items-center gap-2 text-xs font-black tracking-[0.2em] uppercase text-orange-400 border-l-3 border-orange-500 pl-2">
              <Zap className="w-4 h-4 text-orange-400" /> AC Parameters
            </h3>
            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetSimulator}
              className="px-2 py-1 text-[10.5px] font-mono font-black rounded-lg bg-rose-950/80 hover:bg-rose-900/90 border border-rose-500/60 hover:border-rose-400 text-rose-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-md"
              title="Reset AC simulator parameters to baseline defaults"
            >
              <RotateCcw className="w-3 h-3 text-rose-400 stroke-[3]" />
              <span>Reset</span>
            </button>
          </div>
          
          {/* Synchronized Voltage Section: Dropdown + Slider */}
          <div className="space-y-1.5 p-2.5 bg-slate-950 border border-orange-500/50 rounded-xl shadow-md">
            <label className="flex justify-between items-center text-xs font-bold text-slate-200 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-orange-400" /> Voltage (V_t)</span>
              <span className="text-orange-300 font-black font-mono px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30">
                {voltage} V AC
              </span>
            </label>

            {/* High Contrast Voltage Dropdown Select */}
            <select
              value={dropdownValue}
              onChange={handleDropdownChange}
              disabled={isMuscleLocked}
              className="w-full bg-slate-950 border border-orange-500/60 hover:border-orange-400 focus:border-orange-400 focus:ring-1 focus:ring-orange-500/50 text-slate-100 text-xs font-mono font-bold rounded-xl px-3 py-2 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {standardVoltages.map(v => (
                <option key={v.value} value={v.value} className="bg-slate-950 text-slate-200 font-bold">
                  {v.label}
                </option>
              ))}
              <option value="custom" className="bg-slate-950 text-orange-400 font-bold">
                Custom Voltage ({voltage}V)
              </option>
            </select>

            {/* Synchronized Slider Range Input (Capped to 415V in Residential mode) */}
            <input
              type="range"
              min="50"
              max={maxVoltageLimit}
              step="10"
              value={voltage}
              onChange={(e) => setVoltage(Number(e.target.value))}
              disabled={isMuscleLocked}
              className="w-full accent-orange-500 cursor-pointer disabled:opacity-50 mt-1"
            />
          </div>

          {/* Shock Duration & TIME SCALE (SLOW-MO) Control */}
          <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400"/> Shock Duration
              </span>
              <span className="text-base font-black font-mono text-orange-400">{duration} ms</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TIME SCALE (SLOW-MO)</span>
              <div className="flex items-center gap-1">
                {[0.25, 0.5, 1.0].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => !isMuscleLocked && setTimeScale(scale)}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center",
                      timeScale === scale
                        ? "bg-orange-500/25 border-orange-400 text-orange-300 shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    {scale}X
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Skin Condition Input (Compact 50% Height) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Skin Condition</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => !isMuscleLocked && setSkinCondition('dry')}
                className={cn("px-2 py-1 text-[10.5px] font-black rounded-lg border uppercase tracking-wider transition-all cursor-pointer min-h-[30px]", skinCondition === 'dry' ? 'bg-orange-500/20 border-orange-500/60 text-orange-300 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Dry Skin
              </button>
              <button
                type="button"
                onClick={() => !isMuscleLocked && setSkinCondition('wet')}
                className={cn("px-2 py-1 text-[10.5px] font-black rounded-lg border uppercase tracking-wider transition-all cursor-pointer min-h-[30px]", skinCondition === 'wet' ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Wet / Perspired
              </button>
            </div>
          </div>

          {/* Current Path Input (Compact 50% Height) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Current Path</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => !isMuscleLocked && setPath('hand-to-hand')}
                className={cn("px-2 py-1 text-[10.5px] font-black rounded-lg border uppercase tracking-wider transition-all cursor-pointer min-h-[30px]", path === 'hand-to-hand' ? 'bg-orange-500/20 border-orange-500/60 text-orange-300 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Hand - Hand
              </button>
              <button
                type="button"
                onClick={() => !isMuscleLocked && setPath('hand-to-foot')}
                className={cn("px-2 py-1 text-[10.5px] font-black rounded-lg border uppercase tracking-wider transition-all cursor-pointer min-h-[30px]", path === 'hand-to-foot' ? 'bg-orange-500/20 border-orange-500/60 text-orange-300 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Hand - Foot
              </button>
            </div>
          </div>

        </div>

        {/* Desktop Large Prominent HOLD TO SHOCK Button with In-Place Morph */}
        <div className="hidden lg:block pt-3 shrink-0">
          <motion.button
            type="button"
            onPointerDown={(e) => !isMuscleLocked && handleStart()}
            onPointerUp={(e) => !isMuscleLocked && handleStop()}
            onPointerLeave={() => !isMuscleLocked && handleStop()}
            onPointerCancel={() => !isMuscleLocked && handleStop()}
            onContextMenu={(e) => e.preventDefault()}
            disabled={isMuscleLocked}
            animate={isMuscleLocked ? { x: [-3, 3, -2, 2, 0], y: [-2, 2, -1, 1, 0] } : {}}
            transition={{ duration: 0.125, repeat: isMuscleLocked ? Infinity : 0 }}
            style={{ touchAction: 'none' }}
            className={cn(
              "w-full py-4 px-3 text-sm md:text-base font-black tracking-widest uppercase transition-all rounded-2xl flex flex-col items-center justify-center gap-1 select-none border-2 shadow-xl",
              isMuscleLocked
                ? "bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_35px_rgba(239,68,68,0.7)] cursor-not-allowed opacity-95"
                : isSimulating
                  ? "bg-red-600 border-red-400 text-white shadow-[0_0_35px_rgba(239,68,68,0.8)] animate-pulse cursor-pointer active:scale-95"
                  : "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 border-amber-300 text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] cursor-pointer active:scale-95"
            )}
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-center">
              <Zap className={cn("w-5 h-5 fill-current shrink-0", (isSimulating || isMuscleLocked) && "animate-bounce")} />
              <span>
                {isMuscleLocked
                  ? "MUSCLE LOCKED — CANNOT LET GO"
                  : isSimulating
                    ? "⚡ SHOCK ACTIVE..."
                    : "⚡ HOLD TO SHOCK"}
              </span>
            </div>
            <span className="text-[9px] font-bold font-mono tracking-normal opacity-90">
              {isMuscleLocked
                ? "TETANIZATION ACTIVE (>10mA) — CANNOT RELEASE"
                : isSimulating
                  ? "RELEASE TO DISCONNECT"
                  : "PRESS & HOLD BUTTON DOWN"}
            </span>
          </motion.button>
        </div>

        {/* Mobile Action Button with In-Place Morph */}
        <MobileActionButton>
          <motion.button
            type="button"
            onPointerDown={(e) => !isMuscleLocked && handleStart()}
            onPointerUp={(e) => !isMuscleLocked && handleStop()}
            onPointerLeave={() => !isMuscleLocked && handleStop()}
            onPointerCancel={() => !isMuscleLocked && handleStop()}
            onContextMenu={(e) => e.preventDefault()}
            disabled={isMuscleLocked}
            animate={isMuscleLocked ? { x: [-3, 3, -2, 2, 0], y: [-2, 2, -1, 1, 0] } : {}}
            transition={{ duration: 0.125, repeat: isMuscleLocked ? Infinity : 0 }}
            style={{ touchAction: 'none' }}
            className={cn(
              "w-full py-4 px-3 text-sm font-black tracking-widest uppercase transition-all rounded-2xl border-2 flex flex-col items-center justify-center gap-1 select-none shadow-2xl",
              isMuscleLocked
                ? "bg-red-950/95 border-red-500 text-red-200 shadow-[0_0_35px_rgba(239,68,68,0.8)] cursor-not-allowed opacity-95"
                : "bg-gradient-to-r from-orange-500 to-amber-500 border-amber-300 text-slate-950 active:scale-95 cursor-pointer"
            )}
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-center">
              <Zap className="w-5 h-5 fill-current shrink-0" />
              <span>
                {isMuscleLocked
                  ? "MUSCLE LOCKED — CANNOT LET GO"
                  : isSimulating
                    ? "⚡ SHOCK ACTIVE..."
                    : "⚡ HOLD TO SHOCK"}
              </span>
            </div>
            <span className="text-[9px] font-bold font-mono tracking-normal opacity-90">
              {isMuscleLocked
                ? "TETANIZATION ACTIVE (>10mA) — CANNOT RELEASE"
                : isSimulating
                  ? "RELEASE TO DISCONNECT"
                  : "PRESS & HOLD BUTTON DOWN"}
            </span>
          </motion.button>
        </MobileActionButton>
      </div>

      {/* Column 2: Center Panel (IEC 60479-1 Time/Current Zone Chart & Impedance Breakdown) */}
      <div className="flex-1 min-w-[280px] xl:min-w-[340px] p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col h-auto lg:h-full overflow-y-auto order-3 lg:order-2 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 shrink-0">
          <h3 className="flex items-center gap-2 text-xs font-black tracking-[0.2em] uppercase text-orange-400 border-l-3 border-orange-500 pl-2">
            <TrendingUp className="w-4 h-4 text-orange-400" /> IEC 60479-1 Analysis
          </h3>
          <span className="text-[9.5px] font-mono font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
            Eq. Heart: {results.effectiveHeartCurrent.toFixed(1)} mA
          </span>
        </div>
        
        {/* 4 Metric Cards Grid with Live Impedance Breakdown */}
        <div className="grid grid-cols-2 gap-1.5 shrink-0">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center relative group">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex justify-between">
              <span>Impedance (Z_T)</span>
              <span className="text-amber-400 cursor-help font-bold" title={results.citation}>ℹ️</span>
            </span>
            <span className="text-xs sm:text-sm font-black font-mono text-white">{results.r.toFixed(0)} Ω</span>
            <span className="text-[8px] font-mono text-slate-400 mt-0.5">
              Skin: {results.skinZ}Ω | Organs: {results.internalZ}Ω
            </span>
          </div>

          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Heart Factor (F_H)</span>
            <span className="text-xs sm:text-sm font-black font-mono text-white">{results.heartFactor.toFixed(1)} F</span>
            <span className="text-[8px] font-mono text-slate-400 mt-0.5">
              {path === 'hand-to-foot' ? 'Hand-Foot Path (1.0)' : 'Hand-Hand Path (0.4)'}
            </span>
          </div>

          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Prospective Current</span>
            <span className={cn("text-xs sm:text-sm font-black font-mono flex items-center gap-1", isSimulating ? 'text-orange-400 drop-shadow' : 'text-white')}>
              <span>{results.currentMA.toFixed(1)} mA</span>
              {results.currentMA >= 10 && <span className="text-[8px] px-1 bg-red-950 text-red-300 rounded border border-red-500">let-go</span>}
              {results.currentMA >= 0.5 && results.currentMA < 10 && <span className="text-[8px] px-1 bg-yellow-950 text-yellow-300 rounded border border-yellow-500">tingle</span>}
            </span>
          </div>

          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Shock Severity</span>
            <span className={cn("text-xs sm:text-sm font-black uppercase tracking-wider rounded-lg px-2 py-1 border shadow-sm truncate", 
              results.level === 0 ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60' :
              results.level >= 7 ? 'bg-red-950 text-white border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse' : 
              results.level >= 3 ? 'bg-orange-950 text-amber-200 border-2 border-orange-500/60' : 'bg-amber-950 text-yellow-300 border border-amber-500/50'
            )}>
              {results.severity}
            </span>
          </div>
        </div>

        {/* IEC 60479-1 Log-Log Time/Current Zone Chart */}
        <IECZoneChart
          currentMA={results.currentMA}
          durationMs={duration}
          isSimulating={isSimulating}
          shockPath={path}
        />

        {/* PPE Validator & Emergency Response */}
        <div className="flex-1 flex flex-col min-h-0 justify-between space-y-3">
          <PPEValidator
            hazardType="shock_ac"
            hazardMagnitude={voltage}
            environment={config?.environment}
            onSafetyChange={handleSafetyChange}
          />

          <EmergencyResponse isSimulating={isSimulating && !isPPESafe} hasSimulated={hasSimulated} type="shock" />
        </div>
      </div>

      {/* Column 3: Human Section & Scopes */}
      <div className="w-full lg:w-[480px] xl:w-[540px] shrink-0 flex flex-col gap-2 h-[45vh] lg:h-full overflow-hidden order-2 lg:order-3 relative z-10 bg-slate-950/95 backdrop-blur-md pb-3 lg:pb-0 border-b border-slate-800 lg:border-b-0 shadow-xl">
        {/* Dedicated Severity Header Banner (announced via aria-live=assertive inside right panel header) */}
        <SeverityHeaderBanner
          isSimulating={isSimulating}
          isPPESafe={isPPESafe}
          level={results.level}
          severity={results.severity}
          currentMA={results.currentMA}
          voltage={voltage}
        />

        {/* Human Body Twin Container */}
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
        
        {/* Side-by-Side Diagnostic Scopes Grid */}
        <div className="grid grid-cols-2 gap-2 h-24 lg:h-26 shrink-0 w-full">
          <div className="h-full w-full border border-slate-800 rounded-xl p-2 bg-slate-950 flex flex-col shadow-inner overflow-hidden">
             <span className="text-[10px] font-black tracking-wider text-orange-400 uppercase mb-0.5 flex justify-between items-center shrink-0">
               <span>ECG Diagnostics</span>
               {isSimulating && <span className="text-emerald-400 animate-pulse font-mono text-[9px]">LIVE ECG</span>}
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
             <span className="text-[10px] font-black tracking-wider text-orange-400 uppercase mb-0.5 flex justify-between items-center shrink-0">
               <span>AC Waveform</span>
               {isSimulating && <span className="text-orange-400 animate-pulse font-mono text-[9px]">{voltage}V AC</span>}
             </span>
             <div className="flex-1 overflow-hidden rounded-lg">
               <DiagnosticScope type="ac" isActive={isSimulating} intensity={results.intensity} voltage={voltage} />
             </div>
          </div>
        </div>
      </div>

      <HazardOverlay 
        isActive={isSimulating && !isPPESafe}
        hazardType="ac_shock"
        dangerLevel={results.level >= 6 ? 'critical' : results.level >= 3 ? 'warning' : 'safe'}
        magnitude={`${results.currentMA.toFixed(1)} mA Body Current`}
      />

      {/* Fixed Emergency Bystander Dock (z-50, position: fixed, Esc/Space shortcut, 2s Power Isolated chip) */}
      <EmergencyBystanderDock
        isMuscleLocked={isMuscleLocked}
        isSimulating={isSimulating}
        onSwitchOffPower={handleEmergencyCutoff}
      />
    
      {/* Upgraded Incident Debrief Modal (Zone Replay, Twin A/B PPE Comparison, Rescue Drill & 3-Question Micro-Quiz) */}
      <UpgradedDebriefModal
        isOpen={showSafetyLesson || showAAR}
        onClose={() => {
          setShowSafetyLesson(false);
          setShowAAR(false);
        }}
        voltage={lastActiveShockData.voltage || voltage}
        currentMA={lastActiveShockData.currentMA || results.currentMA}
        durationMs={lastActiveShockData.durationMs || duration}
        shockPath={lastActiveShockData.path || path}
        skinCondition={lastActiveShockData.skinCondition || skinCondition}
        isPPESafe={lastActiveShockData.isPPESafe || isPPESafe}
      />
    </motion.div>
  );
}
