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
import { AfterActionReportModal, IncidentReport } from '../AfterActionReportModal';
import { HazardOverlay } from '../HazardOverlay';
import { SafetyLessonModal } from '../SafetyLessonModal';

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
  const [lastReport, setLastReport] = useState<IncidentReport | null>(null);

  const [isMuscleLocked, setIsMuscleLocked] = useState(false);

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

  // Record active AC shock parameters while simulating
  useEffect(() => {
    if (isSimulating) {
      const baseR = skinCondition === 'dry'
        ? (voltage <= 50 ? 3200 : voltage <= 120 ? 2200 : voltage <= 230 ? 1300 : voltage <= 400 ? 900 : 700)
        : (voltage <= 50 ? 1500 : voltage <= 120 ? 1100 : voltage <= 230 ? 850 : voltage <= 400 ? 700 : 600);
      const r = config?.profile === 'child' ? baseR * 0.7 : baseR;
      const currentMA = (voltage / r) * 1000;
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
  }, [isSimulating, voltage, duration, skinCondition, path, isPPESafe, activePPENames, config]);

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
    let r = 0;
    if (skinCondition === 'dry') {
       if (voltage <= 50) r = 3200;
       else if (voltage <= 120) r = 2200;
       else if (voltage <= 230) r = 1300;
       else if (voltage <= 400) r = 900;
       else r = 700; 
    } else {
       if (voltage <= 50) r = 1500;
       else if (voltage <= 120) r = 1100;
       else if (voltage <= 230) r = 850;
       else if (voltage <= 400) r = 700;
       else r = 600;
    }
    
    const heartFactor = path === 'hand-to-foot' ? 1.0 : 0.4;
    
    // IEC 60479-1 / IEEE 80 Persona Resistance & Body Mass Scaling
    let profileMultiplier = 1.0;
    if (config?.profile === 'child') profileMultiplier = 0.60;
    else if (config?.profile === 'teenager') profileMultiplier = 0.75;
    else if (config?.profile === 'adult_female') profileMultiplier = 0.85;
    else if (config?.profile === 'electrician') profileMultiplier = 1.15;

    r = Math.round(r * profileMultiplier);

    return { r, heartFactor };
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
    let severity = 'AC-1 (Perception)';
    
    const c1 = getC1Threshold(duration);
    const c2 = c1 * 1.5;
    const c3 = c1 * 2.5;
    
    if (effectiveHeartCurrent > 0.5) { level = 2; severity = 'AC-2 (Involuntary Contractions)'; }
    if (effectiveHeartCurrent > 10) { level = 3; severity = 'AC-3 (Let-go impossible, cramping)'; }
    
    if (duration > 0) {
       if (effectiveHeartCurrent > c1) { level = 7; severity = 'AC-4.1 (<5% V-Fib Prob)'; }
       if (effectiveHeartCurrent > c2) { level = 8; severity = 'AC-4.2 (<50% V-Fib Prob)'; }
       if (effectiveHeartCurrent > c3) { level = 9; severity = 'AC-4.3 (>50% V-Fib Prob)'; }
    }
    
    const i2t = Math.pow(currentAmp, 2) * (duration / 1000);
    const intensityCurrent = Math.min(effectiveHeartCurrent / 100, 1) * 0.5;
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
      if (results.level >= 6 || (!isPPESafe && results.level >= 3)) {
        setLastReport({
          hazardType: 'AC Electrical Shock',
          severity: results.severity,
          intensity: results.intensity,
          ppeWorn: isPPESafe,
          fatal: results.level >= 8,
          description: results.level >= 8 ? 'Lethal Ventricular Fibrillation occurred due to extended exposure above threshold C2. Severe tissue burning at entry/exit points.' : 'Muscle tetanization and possible respiratory distress observed. Patient requires immediate medical evaluation.',
          preventativeMeasures: [
            'De-energize equipment before working (LOTO)',
            'Verify isolation using a rated test instrument',
            'Wear appropriately rated insulating gloves (ASTM D120)',
            'Use dielectric footwear in industrial environments'
          ]
        });
        setShowAAR(true);
      }
    }
    prevSimulating.current = isSimulating;
  }, [isSimulating, hasSimulated, results, isPPESafe]);

  return (
    <motion.div 
      className="flex flex-col lg:flex-row h-full gap-2.5 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0"
      animate={{ x: isSimulating ? [-2, 2, -3, 3, -1, 1, 0] : 0 }}
      transition={{ duration: 0.2, repeat: isSimulating ? Infinity : 0, ease: "linear" }}
    >
      {/* Column 1: Left Controls Panel */}
      <div className="w-full lg:w-[310px] xl:w-[330px] shrink-0 p-3 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-lg flex flex-col h-[40vh] lg:h-full overflow-y-auto order-1 lg:order-1 justify-between">
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 shrink-0">
            <h3 className="flex items-center gap-2 text-xs font-black tracking-[0.2em] uppercase text-orange-400 border-l-3 border-orange-500 pl-2">
              <Zap className="w-4 h-4 text-orange-400" /> AC Parameters
            </h3>
            {/* Distinct Rose Reset Button */}
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

          {/* Shock Duration Display */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400"/> Shock Duration
            </span>
            <span className="text-base font-black font-mono text-orange-400">{duration} ms</span>
          </div>

          {/* Skin Condition Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Skin Condition</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => !isMuscleLocked && setSkinCondition('dry')}
                className={cn("px-2.5 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all cursor-pointer", skinCondition === 'dry' ? 'bg-orange-500/20 border-orange-500/60 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Dry Skin
              </button>
              <button
                type="button"
                onClick={() => !isMuscleLocked && setSkinCondition('wet')}
                className={cn("px-2.5 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all cursor-pointer", skinCondition === 'wet' ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Wet / Perspired
              </button>
            </div>
          </div>

          {/* Current Path Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Current Path</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => !isMuscleLocked && setPath('hand-to-hand')}
                className={cn("px-2.5 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all cursor-pointer", path === 'hand-to-hand' ? 'bg-orange-500/20 border-orange-500/60 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
              >
                Hand - Hand
              </button>
              <button
                type="button"
                onClick={() => !isMuscleLocked && setPath('hand-to-foot')}
                className={cn("px-2.5 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all cursor-pointer", path === 'hand-to-foot' ? 'bg-orange-500/20 border-orange-500/60 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
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
                Hand flexor muscles locked! You cannot release the hold button. Wait for someone to trip the breaker.
              </p>
              <button
                type="button"
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
                  : "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 border-amber-300 text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)]"
            )}
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-center">
              <Zap className={cn("w-5 h-5 fill-current shrink-0", (isSimulating || isMuscleLocked) && "animate-bounce")} />
              <span>
                {isMuscleLocked
                  ? "MUSCLE LOCK: YOU CANNOT LET GO"
                  : isSimulating
                    ? "⚡ SHOCK ACTIVE..."
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
          {isMuscleLocked ? (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950 border-2 border-amber-400 rounded-xl animate-pulse">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-black text-amber-200 uppercase tracking-widest leading-tight">
                  Muscle Lock — You cannot let go!
                </span>
              </div>
              <button
                type="button"
                onClick={handleEmergencyCutoff}
                className="w-full py-4 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.6)] border-2 border-amber-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Zap className="w-5 h-5 fill-current" />
                ⚡ BYSTANDER: SWITCH OFF POWER
              </button>
            </div>
          ) : (
            <button
              onPointerDown={(e) => handleStart()}
              onPointerUp={(e) => handleStop()}
              onPointerLeave={handleStop}
              onPointerCancel={handleStop}
              onContextMenu={(e) => e.preventDefault()}
              style={{ touchAction: 'none' }}
              className="w-full py-4 text-base tracking-widest font-black uppercase transition-all rounded-2xl border-2 flex items-center justify-center gap-2 select-none shadow-[0_15px_30px_rgba(0,0,0,0.8)] bg-gradient-to-r from-orange-500 to-amber-500 border-amber-300 text-slate-950 active:scale-95"
              aria-live="polite"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>HOLD TO SHOCK</span>
            </button>
          )}
        </MobileActionButton>
      </div>

      {/* Column 2: Center Panel (IEC 60479-1 Analysis & Multi-Select PPE Dropdown Component) */}
      <div className="flex-1 min-w-[280px] xl:min-w-[340px] p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col h-auto lg:h-full overflow-y-auto order-3 lg:order-2 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 shrink-0">
          <h3 className="flex items-center gap-2 text-xs font-black tracking-[0.2em] uppercase text-orange-400 border-l-3 border-orange-500 pl-2">
            <TrendingUp className="w-4 h-4 text-orange-400" /> IEC 60479-1 Analysis
          </h3>
          <span className="text-[9.5px] font-mono font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
            Eq. Heart: {results.effectiveHeartCurrent.toFixed(1)} mA
          </span>
        </div>
        
        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-1.5 shrink-0">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Impedance (Z_T)</span>
            <span className="text-xs sm:text-sm font-black font-mono text-white">{results.r.toFixed(0)} Ω</span>
          </div>
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Heart Factor</span>
            <span className="text-xs sm:text-sm font-black font-mono text-white">{results.heartFactor.toFixed(1)} F</span>
          </div>
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Prospective Current</span>
            <span className={cn("text-xs sm:text-sm font-black font-mono", isSimulating ? 'text-orange-400 drop-shadow' : 'text-white')}>
              {results.currentMA.toFixed(1)} mA
            </span>
          </div>
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Shock Severity</span>
            <span className={cn("text-[10.5px] font-black uppercase truncate", 
              results.level === 0 ? 'text-emerald-400' :
              results.level > 6 ? 'text-rose-400' : 
              results.level > 3 ? 'text-orange-300' : 'text-amber-300'
            )}>
              {results.severity}
            </span>
          </div>
        </div>

        {/* Multi-Select PPE Dropdown Component (Domain-Filtered for Residential vs Industrial) */}
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
    
      {showAAR && lastReport && <AfterActionReportModal report={lastReport} onClose={() => setShowAAR(false)} />}

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
        hazardType="ac"
      />
    </motion.div>
  );
}
