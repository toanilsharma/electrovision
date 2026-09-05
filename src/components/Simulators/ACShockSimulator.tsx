import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MobileActionButton } from '../MobileActionButton';
import { HumanBodyTwin } from '../HumanBodyTwin';
import { EmergencyResponse } from '../EmergencyResponse';
import { DiagnosticScope } from '../DiagnosticScope';
import { Activity, Droplets, Zap, Clock, UserSquare2, TrendingUp, AlertTriangle, BookOpen, RotateCcw, ShieldCheck, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ShockEffectLevel, PPEItem, UserConfig } from '@/src/types';
import { PPESelectionCard } from '../PPESelectionCard';
import { PPEValidator } from '../PPEValidator';
import { useAudioHaptics } from '../useAudioHaptics';
import { motion } from 'motion/react';
import { InfoTooltip } from '../InfoTooltip';
import { UpgradedDebriefModal } from '../UpgradedDebriefModal';
import { DebriefTriggerCard } from '../DebriefTriggerCard';
import { HazardOverlay } from '../HazardOverlay';
import { SafetyLessonModal } from '../SafetyLessonModal';
import { EmergencyBystanderDock } from '../EmergencyBystanderDock';
import { SeverityHeaderBanner } from '../SeverityHeaderBanner';
import { calculateIECImpedance } from '@/src/utils/iec60479Impedance';
import { calculateRCDTripTime } from '@/src/utils/iec61008RCD';
import { IECZoneChart } from '../IECZoneChart';
import { MiniVitalsHUD } from '../MiniVitalsHUD';
import { triggerHaptic, HAPTIC_PATTERNS } from '@/src/utils/haptics';
import { Volume2, VolumeX, Smartphone, Sparkles, Users } from 'lucide-react';

// IEC 60479-1 AC Touch Voltage Reference Levels (Residential capped ≤415V AC)
const ALL_AC_VOLTAGES = [
  { value: 50, label: '50V (SELV Limit / Safe Touch Voltage)' },
  { value: 120, label: '120V (Low Voltage Nominal)' },
  { value: 230, label: '230V (Single-Phase AC Mains)' },
  { value: 415, label: '415V (3-Phase Residential/Commercial AC)' },
  { value: 700, label: '700V (Elevated Industrial Voltage)', industrialOnly: true },
  { value: 1000, label: '1000V (IEC 60479-1 Upper Limit)', industrialOnly: true },
];

export interface DisasterPreset {
  id: string;
  name: string;
  icon: string;
  badge: string;
  desc: string;
  voltage: number;
  path: 'hand-to-hand' | 'hand-to-foot';
  skinCondition: 'dry' | 'wet';
  rcdType: 'off' | 'rcbo_30ma' | 'rcd_10ma' | 'rcd_100ma';
}

export const AC_DISASTER_PRESETS: DisasterPreset[] = [
  {
    id: 'kitchen_wet',
    name: 'Wet Kitchen Floor',
    icon: '🍳',
    badge: '230V Wet · Fatal',
    desc: '230V AC · Wet feet (1328Ω) · Direct heart path (F_H 1.0) · No RCD',
    voltage: 230,
    path: 'hand-to-foot',
    skinCondition: 'wet',
    rcdType: 'off',
  },
  {
    id: 'dry_bench',
    name: 'Dry Tool Bench',
    icon: '🔧',
    badge: '230V Dry · 27mA',
    desc: '230V AC · Dry skin (8280Ω) · Hand-to-Hand (F_H 0.4) · Let-go hazard',
    voltage: 230,
    path: 'hand-to-hand',
    skinCondition: 'dry',
    rcdType: 'off',
  },
  {
    id: 'industrial_415',
    name: 'Industrial 415V Phase',
    icon: '🏭',
    badge: '415V · Severe Arc',
    desc: '415V AC 3-Phase · Wet · Lethal current >310mA · Instant V-Fib',
    voltage: 415,
    path: 'hand-to-foot',
    skinCondition: 'wet',
    rcdType: 'off',
  },
  {
    id: 'shower_rcbo',
    name: 'Shower + 30mA RCBO',
    icon: '🛡️',
    badge: '30mA RCBO · Safe',
    desc: '230V AC · Wet skin · RCBO cuts power in 24ms · 100% V-Fib Protected',
    voltage: 230,
    path: 'hand-to-foot',
    skinCondition: 'wet',
    rcdType: 'rcbo_30ma',
  },
];

export function ACShockSimulator({ config }: { config?: UserConfig }) {
  const isResidential = config?.environment === 'residential';
  const maxVoltageLimit = isResidential ? 415 : 1000;
  
  const [voltage, setVoltage] = useState<number>(isResidential ? 230 : 230);
  const [duration, setDuration] = useState<number>(0);
  const [percentile, setPercentile] = useState<5 | 50 | 95>(50);
  const [contactArea, setContactArea] = useState<'large' | 'medium' | 'small'>('large');
  const [skinCondition, setSkinCondition] = useState<'dry' | 'wet'>('dry');
  const [path, setPath] = useState<'hand-to-hand' | 'hand-to-foot'>('hand-to-foot');
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isPPESafe, setIsPPESafe] = useState(false);
  const [activePPENames, setActivePPENames] = useState<string[]>([]);
  const [showSafetyLesson, setShowSafetyLesson] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  // ELCB / RCBO (Residual Current Device) Protection State
  const [rcdType, setRcdType] = useState<'off' | 'rcbo_30ma' | 'rcd_10ma' | 'rcd_100ma'>('off');
  const [rcdTripped, setRcdTripped] = useState<boolean>(false);
  const [rcdTripTimeMs, setRcdTripTimeMs] = useState<number | null>(null);
  const rcdTripTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lastActiveShockData, setLastActiveShockData] = useState<{
    currentMA: number;
    durationMs: number;
    skinCondition: 'dry' | 'wet';
    path: 'hand-to-hand' | 'hand-to-foot';
    voltage: number;
    isPPESafe: boolean;
    activePPENames: string[];
    rcdTripped?: boolean;
    rcdTripTimeMs?: number | null;
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
  const [rescueSuccess, setRescueSuccess] = useState(false);
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

  const handleApplyPreset = (preset: DisasterPreset) => {
    if (isMuscleLocked) return;
    setActivePresetId(preset.id);
    setVoltage(preset.voltage);
    setPath(preset.path);
    setSkinCondition(preset.skinCondition);
    setRcdType(preset.rcdType);
    setRcdTripped(false);
    setRcdTripTimeMs(null);
    setIsSimulating(false);
    setDuration(0);
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
  };

  const handleResetSimulator = () => {
    if (rcdTripTimerRef.current) {
      clearTimeout(rcdTripTimerRef.current);
      rcdTripTimerRef.current = null;
    }
    setIsSimulating(false);
    setHasSimulated(false);
    setIsMuscleLocked(false);
    setRescueSuccess(false);
    setRcdTripped(false);
    setRcdTripTimeMs(null);
    setRcdType('off');
    setShowSafetyLesson(false);
    setShowAAR(false);
    stopHum();
    setVoltage(230);
    setDuration(0);
    setPercentile(50);
    setContactArea('large');
    setSkinCondition('dry');
    setPath('hand-to-foot');
    setIsPPESafe(false);
    setActivePPENames([]);
    setActivePresetId(null);
    setLastActiveShockData({
      currentMA: 0,
      durationMs: 0,
      skinCondition: 'dry',
      path: 'hand-to-foot',
      voltage: 230,
      isPPESafe: false,
      activePPENames: []
    });
  };

  // Scaled Duration Timer (respects TIME SCALE SLOW-MO)
  const hasTriggeredVFibHaptic = useRef(false);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSimulating) {
      interval = setInterval(() => {
        setDuration(prev => Math.min(prev + Math.round(50 * timeScale), 10000));
      }, 50);
    } else {
      hasTriggeredVFibHaptic.current = false;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, timeScale]);

  // Continuous Muscle Lock Pulse ([50, 50, 50, 50]) during let-go failure
  useEffect(() => {
    let vibInterval: ReturnType<typeof setInterval>;
    if (isMuscleLocked && isSimulating) {
      triggerHaptic(HAPTIC_PATTERNS.MUSCLE_LOCK);
      vibInterval = setInterval(() => {
        triggerHaptic(HAPTIC_PATTERNS.MUSCLE_LOCK);
      }, 400);
    }
    return () => {
      if (vibInterval) clearInterval(vibInterval);
    };
  }, [isMuscleLocked, isSimulating]);

  const getResistance = () => {
    let profileMultiplier = 1.0;
    if (config?.profile === 'child') profileMultiplier = 0.60;
    else if (config?.profile === 'teenager') profileMultiplier = 0.75;
    else if (config?.profile === 'adult_female') profileMultiplier = 0.85;
    else if (config?.profile === 'electrician') profileMultiplier = 1.15;

    const iecData = calculateIECImpedance(voltage, {
      percentile,
      contactArea,
      skinCondition,
      path,
      profileMultiplier
    });
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
    
    if (!isSimulating && !rcdTripped) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, internalZ, skinZ, citation, level: 0 as ShockEffectLevel, severity: 'SAFE (NO CONTACT)', intensity: 0, heartFactor };
    }
    if (isPPESafe) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, internalZ, skinZ, citation, level: 0 as ShockEffectLevel, severity: 'SAFE: PPE INSULATION ACTIVE', intensity: 0, heartFactor };
    }
    if (rcdTripped) {
       return { currentMA: currentMA, effectiveHeartCurrent: effectiveHeartCurrent, r, internalZ, skinZ, citation, level: 1 as ShockEffectLevel, severity: `SAFE: ISOLATED IN ${rcdTripTimeMs}ms BY RCBO`, intensity: 0.05, heartFactor };
    }
    
    let level: ShockEffectLevel = 1;
    let severity = 'Level 1: Slight Tingling (Perception)';
    
    const c1 = getC1Threshold(duration);
    const c2 = c1 * 1.5;
    const c3 = c1 * 2.5;
    
    if (effectiveHeartCurrent > 0.5) { level = 2; severity = 'Zone AC-2: Muscle Twitching'; }
    if (effectiveHeartCurrent > 10) { level = 3; severity = 'Zone AC-3: Muscle Lock (Cannot Let Go)'; }
    if (effectiveHeartCurrent > 30) { level = 4; severity = 'Zone AC-3: Respiratory Cramps & Arrhythmia'; }
    
    if (duration > 0) {
       if (effectiveHeartCurrent > c1) { level = 7; severity = 'Zone AC-4.1: High Danger to Heart (<5% V-Fib)'; }
       if (effectiveHeartCurrent > c2) { level = 8; severity = 'Zone AC-4.2: Extreme Heart Danger (<50% V-Fib)'; }
       if (effectiveHeartCurrent > c3) { level = 9; severity = 'Zone AC-4.3: Fatal Heart Arrest (>50% V-Fib)'; }
    }
    
    const i2t = Math.pow(currentAmp, 2) * (duration / 1000);
    const intensityCurrent = Math.min(effectiveHeartCurrent / 100, 1) * 0.5;
    const intensityEnergy = Math.min(i2t / 0.05, 1) * 0.5;
    const intensity = Math.min(intensityCurrent + intensityEnergy, 1.0);
    
    return { currentMA, effectiveHeartCurrent, r, internalZ, skinZ, citation, level, severity, intensity, heartFactor };
  };

  const results = calculateResults();

  // Cardiac VF / Asystole Haptic Alert ([200, 100, 200, 100, 1000])
  useEffect(() => {
    if (isSimulating && !isPPESafe && results.level >= 7 && !hasTriggeredVFibHaptic.current) {
      hasTriggeredVFibHaptic.current = true;
      triggerHaptic(HAPTIC_PATTERNS.VF_ASYSTOLE);
    }
  }, [isSimulating, isPPESafe, results.level]);

  const handleStart = () => {
    if (rcdTripTimerRef.current) {
      clearTimeout(rcdTripTimerRef.current);
      rcdTripTimerRef.current = null;
    }

    setRescueSuccess(false);
    setRcdTripped(false);
    setRcdTripTimeMs(null);
    setIsSimulating(true);
    setHasSimulated(true);
    setDuration(0);
    startHum(60);
    
    // Initial Shock Haptic: [80] (sharp jolt)
    triggerHaptic(HAPTIC_PATTERNS.INITIAL_SHOCK);

    const { r, heartFactor } = getResistance();
    const prospectiveCurrentMA = (voltage / r) * 1000;

    // Check if RCD/RCBO protection is enabled and should trip (IEC 61008-1)
    if (!isPPESafe && rcdType !== 'off') {
      const rcdResult = calculateRCDTripTime(prospectiveCurrentMA, rcdType);

      if (rcdResult.shouldTrip) {
        const tripMs = rcdResult.tripTimeMs;
        // Schedule RCD trip with IEC 61008-1 timeline delay before current cutoff
        const scaledTripTime = Math.max(15, Math.round(tripMs / timeScale));
        rcdTripTimerRef.current = setTimeout(() => {
          setIsSimulating(false);
          setIsMuscleLocked(false);
          setRcdTripped(true);
          setRcdTripTimeMs(tripMs);
          setDuration(tripMs);
          stopHum();
          // Breaker Trip Haptic: [30] (light click)
          triggerHaptic(HAPTIC_PATTERNS.BREAKER_TRIP);
          setLastActiveShockData({
            currentMA: prospectiveCurrentMA,
            durationMs: tripMs,
            skinCondition,
            path,
            voltage,
            isPPESafe: false,
            activePPENames,
            rcdTripped: true,
            rcdTripTimeMs: tripMs
          });
        }, scaledTripTime);
        return;
      }
    }

    // If unprotected and no RCD trips and current > 10mA -> Muscle Lock (Continuous Latch!)
    if (!isPPESafe && prospectiveCurrentMA >= 10) {
      setIsMuscleLocked(true);
    }
  };

  const handleStop = () => {
    if (isMuscleLocked && isSimulating) {
      triggerHaptic(HAPTIC_PATTERNS.MUSCLE_LOCK);
      return; // Impossible to let go! Muscle tetanization locks fingers on conductor.
    }
    if (rcdTripTimerRef.current) {
      clearTimeout(rcdTripTimerRef.current);
      rcdTripTimerRef.current = null;
    }
    setIsSimulating(false);
    setIsMuscleLocked(false);
    stopHum();
  };

  const handleEmergencyCutoff = () => {
    if (rcdTripTimerRef.current) {
      clearTimeout(rcdTripTimerRef.current);
      rcdTripTimerRef.current = null;
    }
    setIsSimulating(false);
    setIsMuscleLocked(false);
    stopHum();
    // Breaker Trip Haptic: [30] (light click)
    triggerHaptic(HAPTIC_PATTERNS.BREAKER_TRIP);
    setRescueSuccess(true);
  };

  const [mobileTab, setMobileTab] = useState<'controls' | 'twin' | 'charts'>('controls');

  return (
    <motion.div 
      className="flex flex-col lg:flex-row h-full gap-2.5 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0 relative"
      animate={{ x: isSimulating ? [-2, 2, -3, 3, -1, 1, 0] : 0 }}
      transition={{ duration: 0.2, repeat: isSimulating ? Infinity : 0, ease: "linear" }}
    >
      {/* Top Tactical Status HUD: Continuous Shock / Tetany Lock */}
      {isMuscleLocked && isSimulating && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-[300] w-[94%] max-w-xl bg-red-950/95 border-2 border-red-500 text-white px-3 py-2 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.9)] backdrop-blur-2xl flex items-center justify-between gap-3 pointer-events-auto"
        >
          <div className="flex items-center gap-2 min-w-0 font-mono">
            <div className="p-1.5 bg-red-500/20 rounded-lg border border-red-400 text-red-400 shrink-0 animate-pulse">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-red-100 uppercase tracking-wider">
                  ⚠️ TETANY LOCK ACTIVE
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-red-900/80 border border-red-500/60 rounded text-red-200 font-bold">
                  {results.currentMA.toFixed(1)} mA &gt; 10mA
                </span>
              </div>
              <span className="text-[10px] font-mono text-red-300/90 font-semibold truncate mt-0.5">
                Flexors seized on conductor · Standby must isolate switch
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEmergencyCutoff}
            className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shrink-0 shadow-[0_0_20px_rgba(250,204,21,0.7)] border border-yellow-200 active:scale-95 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950 animate-bounce" />
            <span>CUT SWITCH</span>
          </button>
        </motion.div>
      )}

      {/* Top Tactical Status HUD: Rescue Success Banner */}
      {rescueSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-[300] w-[94%] max-w-lg bg-emerald-950/95 border-2 border-emerald-400 text-white px-3 py-2 rounded-xl shadow-[0_0_35px_rgba(16,185,129,0.8)] backdrop-blur-2xl flex items-center justify-between gap-2.5 pointer-events-auto font-mono"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                POWER ISOLATED (0.0 mA)
              </span>
              <span className="text-[10px] text-emerald-100 font-bold">
                Victim released safely
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRescueSuccess(false)}
            className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase rounded-md shrink-0 cursor-pointer transition-colors"
          >
            DISMISS
          </button>
        </motion.div>
      )}

      {/* Mobile Viewport Tab Switcher (Hidden on Desktop lg:) */}
      <div className="flex lg:hidden items-center justify-between p-1 bg-slate-950/95 border border-slate-800 rounded-xl mb-1 shrink-0 z-20">
        <button
          type="button"
          onClick={() => setMobileTab('controls')}
          className={cn(
            "flex-1 py-1.5 px-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer",
            mobileTab === 'controls' ? "bg-orange-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          ⚙️ Controls
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('twin')}
          className={cn(
            "flex-1 py-1.5 px-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer",
            mobileTab === 'twin' ? "bg-orange-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          👤 Human Twin
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('charts')}
          className={cn(
            "flex-1 py-1.5 px-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer",
            mobileTab === 'charts' ? "bg-orange-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          📊 Charts
        </button>
      </div>

      {/* Column 1: Left Controls Panel (Compact High-Density, Zero-Scroll Fit to Screen) */}
      <div className={cn(
        "w-full lg:w-[310px] xl:w-[330px] shrink-0 p-1.5 sm:p-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col h-auto lg:h-full justify-between order-1 lg:order-1 overflow-hidden",
        mobileTab !== 'controls' && "hidden lg:flex"
      )}>
        <div className="space-y-1 flex-1 flex flex-col justify-between overflow-hidden min-h-0">
          
          {/* Header & Single Unified Master Reset */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-0.5 shrink-0">
            <h3 className="flex items-center gap-1.5 text-[11px] font-black tracking-[0.15em] uppercase text-orange-400 border-l-3 border-orange-500 pl-1.5">
              <Zap className="w-3.5 h-3.5 text-orange-400" /> AC Parameters
            </h3>
            <button
              type="button"
              onClick={handleResetSimulator}
              className="py-0.5 px-2 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/80 hover:border-rose-400 font-black text-[9.5px] uppercase tracking-wider rounded shadow-[0_0_10px_rgba(244,63,94,0.3)] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
              title="Master Reset all inputs, outputs, and body twin diagram to baseline state"
            >
              <RotateCcw className="w-2.5 h-2.5 text-rose-400 stroke-[3]" />
              <span>MASTER RESET</span>
            </button>
          </div>

          {/* 1-Click Real-World Disaster Presets */}
          <div className="p-1 bg-slate-950/80 border border-slate-800 rounded-lg shrink-0">
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
              <span className="flex items-center gap-1 text-amber-400"><Sparkles className="w-2.5 h-2.5" /> 1-Click Scenarios</span>
              <span className="text-[7.5px] text-slate-500 font-mono">Real-World Faults</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {AC_DISASTER_PRESETS.map((p) => {
                const isSelected = activePresetId === p.id || (
                  voltage === p.voltage &&
                  path === p.path &&
                  skinCondition === p.skinCondition &&
                  rcdType === p.rcdType
                );
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    disabled={isMuscleLocked}
                    title={p.desc}
                    className={cn(
                      "py-0.5 px-1 rounded border text-left flex items-center gap-1 transition-all cursor-pointer select-none",
                      isSelected
                        ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                    )}
                  >
                    <span className="text-[11px] leading-none shrink-0">{p.icon}</span>
                    <div className="min-w-0 flex-1 leading-none">
                      <div className="text-[8.5px] font-black truncate">{p.name}</div>
                      <div className="text-[7px] text-slate-400 font-mono truncate">{p.badge}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Voltage Selector */}
          <div className="space-y-0.5 p-1 bg-slate-950 border border-orange-500/50 rounded-lg shadow-sm shrink-0">
            <label className="flex justify-between items-center text-[10px] font-bold text-slate-200 uppercase tracking-wider">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-orange-400" /> Voltage (V_t)</span>
              <span className="text-orange-300 font-black font-mono px-1 py-0.2 rounded bg-orange-500/10 border border-orange-500/30 text-[11px] leading-none">
                {voltage} V AC
              </span>
            </label>

            <select
              value={dropdownValue}
              onChange={handleDropdownChange}
              disabled={isMuscleLocked}
              className="w-full bg-slate-950 border border-orange-500/60 hover:border-orange-400 focus:border-orange-400 text-slate-100 text-[11px] font-mono font-bold rounded px-1.5 py-0.5 cursor-pointer disabled:opacity-50 transition-colors"
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

            <input
              type="range"
              min="50"
              max={maxVoltageLimit}
              step="10"
              value={voltage}
              onChange={(e) => setVoltage(Number(e.target.value))}
              disabled={isMuscleLocked}
              className="w-full accent-orange-500 cursor-pointer disabled:opacity-50 mt-0.5 h-1"
            />
          </div>

          {/* Shock Path & Skin Condition */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <div className="space-y-0.5">
              <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Shock Path</span>
                <span className="text-[8px] font-mono text-orange-400">({path === 'hand-to-hand' ? 'F_h 0.4' : 'F_h 1.0'})</span>
              </label>
              <div className="grid grid-cols-2 gap-0.5">
                <button
                  type="button"
                  onClick={() => !isMuscleLocked && setPath('hand-to-hand')}
                  className={cn(
                    "py-0.5 text-[9.5px] font-black rounded border uppercase tracking-wider transition-all cursor-pointer select-none text-center",
                    path === 'hand-to-hand'
                      ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-sm font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  )}
                  title="Hand-to-Hand Path (IEC 60479-1 Heart Factor = 0.4)"
                >
                  Hand-Hand
                </button>
                <button
                  type="button"
                  onClick={() => !isMuscleLocked && setPath('hand-to-foot')}
                  className={cn(
                    "py-0.5 text-[9.5px] font-black rounded border uppercase tracking-wider transition-all cursor-pointer select-none text-center",
                    path === 'hand-to-foot'
                      ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-sm font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  )}
                  title="Hand-to-Foot Path (IEC 60479-1 Heart Factor = 1.0 - Directly crosses heart)"
                >
                  Hand-Foot
                </button>
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Skin State</span>
                <span className="text-[8px] font-mono text-cyan-400">({skinCondition === 'dry' ? '8280Ω' : '1328Ω'})</span>
              </label>
              <div className="grid grid-cols-2 gap-0.5">
                <button
                  type="button"
                  onClick={() => !isMuscleLocked && setSkinCondition('dry')}
                  className={cn(
                    "py-0.5 text-[9.5px] font-black rounded border uppercase tracking-wider transition-all cursor-pointer select-none text-center",
                    skinCondition === 'dry'
                      ? 'bg-orange-500/25 border-orange-400 text-orange-200 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  )}
                  title="Dry Intact Skin (IEC 60479-1 8,280Ω nominal at 230V)"
                >
                  Dry Skin
                </button>
                <button
                  type="button"
                  onClick={() => !isMuscleLocked && setSkinCondition('wet')}
                  className={cn(
                    "py-0.5 text-[9.5px] font-black rounded border uppercase tracking-wider transition-all cursor-pointer select-none text-center",
                    skinCondition === 'wet'
                      ? 'bg-blue-500/30 border-blue-400 text-blue-200 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  )}
                  title="Wet / Perspiring Skin (IEC 60479-1 1,328Ω nominal - High shock hazard)"
                >
                  Wet Skin
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Dielectric PPE Selection Suite (Prominently Positioned) */}
          <PPESelectionCard
            voltage={voltage}
            isPPESafe={isPPESafe}
            activePPENames={activePPENames}
            onSafetyChange={handleSafetyChange}
            disabled={isMuscleLocked}
          />

          {/* ELCB / RCBO (Residual Current Protection) Control */}
          <div className="space-y-0.5 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className={cn("w-3 h-3", rcdType !== 'off' ? "text-emerald-400" : "text-slate-400")} />
                <span>RCD Protection</span>
              </label>
              <span className={cn("text-[8px] font-mono font-black px-1.5 py-0.2 rounded border leading-none", 
                rcdType !== 'off' ? "bg-emerald-950 text-emerald-300 border-emerald-500" : "bg-red-950 text-rose-300 border-rose-600"
              )}>
                {rcdType === 'off' ? 'NO RCD' : rcdType === 'rcbo_30ma' ? '30mA RCBO' : rcdType === 'rcd_10ma' ? '10mA RCD' : '100mA'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => !isMuscleLocked && setRcdType('off')}
                className={cn(
                  "py-0.5 text-[9px] font-black uppercase rounded border transition-all cursor-pointer truncate text-center select-none",
                  rcdType === 'off'
                    ? "bg-red-950/90 text-rose-300 border-rose-500 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                )}
                title="Unprotected circuit (Continuous Muscle Lock shock risk)"
              >
                OFF (No RCD)
              </button>
              <button
                type="button"
                onClick={() => !isMuscleLocked && setRcdType('rcbo_30ma')}
                className={cn(
                  "py-0.5 text-[9px] font-black uppercase rounded border transition-all cursor-pointer truncate text-center select-none",
                  rcdType === 'rcbo_30ma'
                    ? "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                )}
                title="30mA Standard Life Protection (IEC 61008/61009 - Trips in ≤30ms)"
              >
                30mA RCBO
              </button>
              <button
                type="button"
                onClick={() => !isMuscleLocked && setRcdType('rcd_10ma')}
                className={cn(
                  "py-0.5 text-[9px] font-black uppercase rounded border transition-all cursor-pointer truncate text-center select-none",
                  rcdType === 'rcd_10ma'
                    ? "bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                )}
                title="10mA High Sensitivity (Medical / Wet Location - Trips in ≤20ms)"
              >
                10mA Sens
              </button>
            </div>
          </div>

          {/* IEC 60479-1 Impedance Parameters: Percentile & Contact Area */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950/60 border border-slate-850 rounded-lg shrink-0">
            <div className="space-y-0.5">
              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Population %ile</label>
              <div className="grid grid-cols-3 gap-0.5">
                {[5, 50, 95].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => !isMuscleLocked && setPercentile(p as 5 | 50 | 95)}
                    className={cn(
                      "py-0.2 text-[8.5px] font-black rounded border uppercase tracking-wider transition-all cursor-pointer select-none",
                      percentile === p
                        ? "bg-orange-500/20 border-orange-500/60 text-orange-300 shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Contact Area</label>
              <div className="grid grid-cols-3 gap-0.5">
                {(['large', 'medium', 'small'] as const).map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => !isMuscleLocked && setContactArea(area)}
                    className={cn(
                      "py-0.2 text-[8px] font-black rounded border uppercase tracking-wider transition-all cursor-pointer select-none",
                      contactArea === area
                        ? "bg-orange-500/20 border-orange-500/60 text-orange-300 shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    {area === 'large' ? 'Lrg' : area === 'medium' ? 'Med' : 'Sml'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Prominent HOLD TO SHOCK Button */}
        <div className="hidden lg:block pt-1 shrink-0">
          <motion.button
            type="button"
            onPointerDown={(e) => {
              if (isMuscleLocked) return;
              e.preventDefault();
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch (_) {}
              handleStart();
            }}
            onPointerUp={(e) => {
              if (isMuscleLocked) return;
              handleStop();
            }}
            onPointerCancel={() => {
              if (isMuscleLocked) return;
              handleStop();
            }}
            onLostPointerCapture={() => {
              if (isMuscleLocked) return;
              handleStop();
            }}
            onContextMenu={(e) => e.preventDefault()}
            disabled={isMuscleLocked}
            animate={isMuscleLocked ? { x: [-3, 3, -2, 2, 0], y: [-2, 2, -1, 1, 0] } : {}}
            transition={{ duration: 0.125, repeat: isMuscleLocked ? Infinity : 0 }}
            style={{
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            className={cn(
              "w-full py-2 px-2 text-xs font-black tracking-widest uppercase transition-all rounded-xl flex flex-col items-center justify-center gap-0.5 select-none border-2 shadow-xl",
              isMuscleLocked
                ? "bg-red-950/95 border-red-500 text-red-200 shadow-[0_0_35px_rgba(239,68,68,0.8)] cursor-not-allowed opacity-95 animate-pulse"
                : isSimulating
                  ? "bg-red-600 border-red-400 text-white shadow-[0_0_35px_rgba(239,68,68,0.8)] animate-pulse cursor-pointer active:scale-95"
                  : "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 border-amber-300 text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] cursor-pointer active:scale-95"
            )}
            aria-live="polite"
          >
            <div className="flex items-center gap-1.5 text-center">
              <Zap className={cn("w-3.5 h-3.5 fill-current shrink-0", (isSimulating || isMuscleLocked) && "animate-bounce")} />
              <span>
                {isMuscleLocked
                  ? "🔒 MUSCLES LOCKED (CANNOT LET GO)"
                  : isSimulating
                    ? "⚡ SHOCK ACTIVE..."
                    : "⚡ HOLD TO SHOCK"}
              </span>
            </div>
            <span className="text-[8px] font-bold font-mono tracking-normal opacity-90 leading-none">
              {isMuscleLocked ? "STANDBY MUST DE-ENERGISE CIRCUIT" : "PRESS & HOLD BUTTON DOWN"}
            </span>
          </motion.button>
        </div>

        {/* Mobile Action Button with Persistent MiniVitalsHUD on <768px */}
        <MobileActionButton>
          <div className="flex flex-col gap-1.5 w-full">
            <MiniVitalsHUD
              isSimulating={isSimulating}
              currentMA={results.currentMA}
              voltage={voltage}
              path={path}
              skinCondition={skinCondition}
              isPPESafe={isPPESafe}
              isMuscleLocked={isMuscleLocked}
            />

            <motion.button
              type="button"
              onPointerDown={(e) => {
                if (isMuscleLocked) return;
                e.preventDefault();
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch (_) {}
                handleStart();
              }}
              onPointerUp={(e) => {
                if (isMuscleLocked) return;
                handleStop();
              }}
              onPointerCancel={() => {
                if (isMuscleLocked) return;
                handleStop();
              }}
              onLostPointerCapture={() => {
                if (isMuscleLocked) return;
                handleStop();
              }}
              onContextMenu={(e) => e.preventDefault()}
              disabled={isMuscleLocked}
              animate={isMuscleLocked ? { x: [-3, 3, -2, 2, 0], y: [-2, 2, -1, 1, 0] } : {}}
              transition={{ duration: 0.125, repeat: isMuscleLocked ? Infinity : 0 }}
              style={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
              className={cn(
                "w-full py-4 px-3 text-sm font-black tracking-widest uppercase transition-all rounded-2xl border-2 flex flex-col items-center justify-center gap-1 select-none shadow-2xl",
                isMuscleLocked
                  ? "bg-red-950/95 border-red-500 text-red-200 shadow-[0_0_35px_rgba(239,68,68,0.8)] cursor-not-allowed opacity-95 animate-pulse"
                  : "bg-gradient-to-r from-orange-500 to-amber-500 border-amber-300 text-slate-950 active:scale-95 cursor-pointer"
              )}
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-center">
                <Zap className="w-5 h-5 fill-current shrink-0" />
                <span>
                  {isMuscleLocked
                    ? "🔒 MUSCLES LOCKED (CANNOT LET GO)"
                    : isSimulating
                      ? "⚡ SHOCK ACTIVE..."
                      : "⚡ HOLD TO SHOCK"}
                </span>
              </div>
              <span className="text-[9px] font-bold font-mono tracking-normal opacity-90">
                {isMuscleLocked
                  ? "LET-GO EXCEEDED (>10mA) — PERSON LOST CONTROL"
                  : isSimulating
                    ? "RELEASE TO DISCONNECT"
                    : "PRESS & HOLD BUTTON DOWN"}
              </span>
            </motion.button>
          </div>
        </MobileActionButton>
      </div>

      {/* Column 2: Center Panel (IEC 60479-1 Time/Current Zone Chart & Impedance Breakdown) */}
      <div className={cn(
        "flex-1 min-w-[280px] xl:min-w-[340px] p-1.5 sm:p-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col h-auto lg:h-full overflow-hidden order-3 lg:order-2 gap-1.5 justify-between min-h-0",
        mobileTab !== 'charts' && "hidden lg:flex"
      )}>
        
        {/* RCD Tripped Hero Banner (if tripped) */}
        {rcdTripped && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 sm:p-2.5 bg-emerald-950/95 border border-emerald-400 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-between gap-2.5 font-mono shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                  {rcdType === 'rcbo_30ma' ? '30mA RCBO' : rcdType === 'rcd_10ma' ? '10mA RCD' : '100mA RCD'} TRIPPED
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.2 bg-emerald-900/80 border border-emerald-500/60 rounded text-emerald-200">
                  {rcdTripTimeMs} ms
                </span>
                <span className="text-[9.5px] text-emerald-200/90 font-bold truncate">
                  Cleared {results.currentMA.toFixed(1)}mA Earth Leakage · V-Fib Prevented
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSafetyLesson(true)}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg shrink-0 cursor-pointer shadow-md active:scale-95"
            >
              Debrief
            </button>
          </motion.div>
        )}

        <div className="flex items-center justify-between border-b border-slate-800 pb-1 shrink-0">
          <h3 className="flex items-center gap-1.5 text-xs font-black tracking-[0.15em] uppercase text-orange-400 border-l-3 border-orange-500 pl-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> IEC 60479-1 Telemetry
          </h3>
          <div className="flex items-center gap-1.5 font-mono text-[9px]">
            <span className="text-slate-400">Heart Vector:</span>
            <span className="font-black text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/40">
              {results.effectiveHeartCurrent.toFixed(1)} mA
            </span>
          </div>
        </div>
        
        {/* 4 Metric Cards Grid with Live Impedance Breakdown */}
        <div className="grid grid-cols-2 gap-1.5 shrink-0">
          <div className="p-1.5 sm:p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between relative group hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Impedance (Z_T)</span>
              <span className="text-amber-400 cursor-help font-mono" title={results.citation}>IEC 60479</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-black font-mono text-white">{results.r.toFixed(0)} Ω</span>
            </div>
            <div className="flex items-center gap-1 text-[8px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-900">
              <span className="text-cyan-400">Skin: {results.skinZ}Ω</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">Internal: {results.internalZ}Ω</span>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Heart Factor (F_H)</span>
              <span className="text-cyan-400 font-mono text-[8px]">{path === 'hand-to-foot' ? '1.0' : '0.4'}</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-black font-mono text-white">{results.heartFactor.toFixed(1)} F_H</span>
            </div>
            <div className="flex items-center gap-1 text-[8px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-900 truncate">
              {path === 'hand-to-foot' ? '⚡ Direct Thoracic Axis' : '⚡ Transverse Arm Axis'}
            </div>
          </div>

          <div className="p-1.5 sm:p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Body Current</span>
              {results.currentMA >= 100 && <span className="text-[7.5px] px-1 bg-red-950 text-red-300 rounded border border-red-500 font-bold uppercase animate-pulse">V-Fib Risk</span>}
              {results.currentMA >= 30 && results.currentMA < 100 && <span className="text-[7.5px] px-1 bg-amber-950 text-amber-300 rounded border border-amber-500 font-bold uppercase">Asphyxia</span>}
              {results.currentMA >= 10 && results.currentMA < 30 && <span className="text-[7.5px] px-1 bg-orange-950 text-orange-300 rounded border border-orange-500 font-bold uppercase">Let-Go</span>}
              {results.currentMA >= 0.5 && results.currentMA < 10 && <span className="text-[7.5px] px-1 bg-yellow-950 text-yellow-300 rounded border border-yellow-500 font-bold uppercase">Tingle</span>}
              {results.currentMA < 0.5 && <span className="text-[7.5px] px-1 bg-emerald-950 text-emerald-300 rounded border border-emerald-500 font-bold uppercase">Safe</span>}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={cn("text-sm font-black font-mono", isSimulating ? 'text-orange-400 drop-shadow' : 'text-white')}>
                {results.currentMA.toFixed(1)} mA
              </span>
            </div>
            <div className="flex items-center gap-1 text-[8px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-900">
              <span>Eq. Thoracic:</span>
              <span className="text-orange-300 font-bold">{results.effectiveHeartCurrent.toFixed(1)} mA</span>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Hazard Severity</span>
              <span className="text-slate-400 font-mono text-[8px]">Zone Level</span>
            </div>
            <div className="mt-0.5 truncate">
              <span className={cn("inline-block text-[10px] font-black uppercase tracking-wider rounded px-1.5 py-0.5 border shadow-sm truncate max-w-full", 
                results.level === 0 ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60' :
                results.level >= 7 ? 'bg-red-950 text-white border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse' : 
                results.level >= 3 ? 'bg-orange-950 text-amber-200 border border-orange-500/60' : 'bg-amber-950 text-yellow-300 border border-amber-500/50'
              )}>
                {results.severity}
              </span>
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-900">
              <span>IEC Zone:</span>
              <span className="text-amber-400 font-bold">
                {results.level >= 7 ? 'AC-4 (Fatal)' : results.level >= 3 ? 'AC-3 (Let-go)' : results.level >= 2 ? 'AC-2 (Twitch)' : 'AC-1 (Safe)'}
              </span>
            </div>
          </div>
        </div>

        {/* IEC 60479-1 Log-Log Time/Current Zone Chart */}
        <IECZoneChart
          currentMA={results.currentMA}
          durationMs={duration}
          isSimulating={isSimulating}
          shockPath={path}
        />
      </div>

      {/* Column 3: Human Section & Scopes (Full-Body Maximized) */}
      <div className={cn("w-full lg:w-[480px] xl:w-[540px] shrink-0 flex flex-col gap-1.5 h-auto lg:h-full overflow-hidden order-2 lg:order-3 relative z-10 bg-slate-950/95 backdrop-blur-md pb-1 lg:pb-0 border-b border-slate-800 lg:border-b-0 shadow-xl", mobileTab !== 'twin' && "hidden lg:flex")}>
        {/* Dual A/B Header Bar */}
        <div className="flex items-center justify-between px-2 py-0.5 border border-slate-800 rounded-lg bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 truncate">
              {isCompareMode ? "Split-Screen A/B Compare" : "Human Digital Twin Telemetry"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              triggerHaptic(HAPTIC_PATTERNS.CLICK);
            }}
            className={cn(
              "px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded border flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95 shrink-0",
              isCompareMode
                ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                : "bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
            )}
            title="Toggle Split-Screen A/B Compare Mode: observe side-by-side what happens without protection vs with PPE/RCBO"
          >
            <Users className="w-2.5 h-2.5" />
            <span>{isCompareMode ? "Single View" : "👥 A/B Compare"}</span>
          </button>
        </div>

        {/* Human Body Twin Container (100% Full Body Head-to-Toes Visible) */}
        <div className="flex-1 min-h-0 w-full relative border border-slate-800 rounded-xl bg-slate-950 shadow-inner overflow-hidden flex flex-col">
          {isCompareMode ? (
            <div className="grid grid-cols-2 gap-1 h-full w-full p-0.5">
              {/* Twin A: Unprotected Fault */}
              <div className="h-full border border-rose-900/60 rounded-lg overflow-hidden relative bg-slate-950/70">
                <HumanBodyTwin 
                  shockPath={path} 
                  intensity={results.intensity}
                  currentMA={results.currentMA}
                  durationMs={duration} 
                  isAnimating={isSimulating} 
                  profile={config?.profile}
                  isPPESafe={false}
                  activePPENames={[]}
                  compareLabel="TWIN A: UNPROTECTED"
                  isCompactDual={true}
                  onMasterReset={handleResetSimulator}
                />
              </div>

              {/* Twin B: Protected / Mitigated */}
              <div className="h-full border border-emerald-900/60 rounded-lg overflow-hidden relative bg-slate-950/70">
                <HumanBodyTwin 
                  shockPath={path} 
                  intensity={isPPESafe || rcdTripped ? 0 : (rcdType !== 'off' ? Math.min(results.intensity * 0.1, 0.15) : 0)}
                  currentMA={isPPESafe ? 0 : (rcdTripped ? 0 : (rcdType !== 'off' ? Math.min(results.currentMA, 30) : 0))}
                  durationMs={rcdTripped && rcdTripTimeMs ? rcdTripTimeMs : (isPPESafe ? 0 : Math.min(duration, 25))}
                  isAnimating={isSimulating && !isPPESafe && !rcdTripped} 
                  profile={config?.profile}
                  isPPESafe={true}
                  activePPENames={isPPESafe ? activePPENames : [rcdType !== 'off' ? `${rcdType === 'rcbo_30ma' ? '30mA RCBO' : '10mA RCD'} Active` : 'Class 0 Dielectric Gloves']}
                  compareLabel={isPPESafe ? "TWIN B: DIELECTRIC PPE" : (rcdType !== 'off' ? `TWIN B: ${rcdType === 'rcbo_30ma' ? '30mA RCBO' : '10mA RCD'}` : "TWIN B: 30mA RCBO")}
                  isCompactDual={true}
                  onMasterReset={handleResetSimulator}
                />
              </div>
            </div>
          ) : (
            <HumanBodyTwin 
              shockPath={path} 
              intensity={results.intensity}
              currentMA={results.currentMA}
              durationMs={duration} 
              isAnimating={isSimulating} 
              profile={config?.profile}
              isPPESafe={isPPESafe}
              activePPENames={activePPENames}
              onMasterReset={handleResetSimulator}
            />
          )}
        </div>
        
        {/* Side-by-Side Diagnostic Scopes Grid (Compact High-Density 64px) */}
        <div className="grid grid-cols-2 gap-1.5 h-16 lg:h-18 shrink-0 w-full">
          <div className="h-full w-full border border-slate-800 rounded-xl p-1.5 bg-slate-950 flex flex-col shadow-inner overflow-hidden">
             <span className="text-[9.5px] font-black tracking-wider text-orange-400 uppercase mb-0.5 flex justify-between items-center shrink-0">
               <span>ECG Diagnostics</span>
               {isSimulating && <span className="text-emerald-400 animate-pulse font-mono text-[8.5px]">LIVE ECG</span>}
             </span>
             <div className="flex-1 overflow-hidden rounded-lg">
               <DiagnosticScope
                 type="ecg"
                 isActive={isSimulating}
                 intensity={results.intensity}
                 voltage={voltage}
                 currentMA={results.currentMA}
                 skinCondition={skinCondition}
                 path={path}
                 isPPESafe={isPPESafe}
                 durationMs={duration}
               />
             </div>
          </div>

          <div className="h-full w-full border border-slate-800 rounded-xl p-1.5 bg-slate-950 flex flex-col shadow-inner overflow-hidden">
             <span className="text-[9.5px] font-black tracking-wider text-orange-400 uppercase mb-0.5 flex justify-between items-center shrink-0">
               <span>AC Waveform</span>
               {isSimulating && <span className="text-orange-400 animate-pulse font-mono text-[8.5px]">{voltage}V AC</span>}
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
        currentMA={results.currentMA}
        voltage={voltage}
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
        rcdTripped={rcdTripped || lastActiveShockData.rcdTripped}
        rcdType={rcdType}
        rcdTripTimeMs={rcdTripTimeMs || lastActiveShockData.rcdTripTimeMs}
      />
    </motion.div>
  );
}
