import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MobileActionButton } from '../MobileActionButton';
import { HumanBodyTwin } from '../HumanBodyTwin';
import { EmergencyResponse } from '../EmergencyResponse';
import { DiagnosticScope } from '../DiagnosticScope';
import { BatteryCharging, Droplets, Zap, Clock, UserSquare2, TrendingUp, AlertTriangle, BookOpen, RotateCcw, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ShockEffectLevel, PPEItem, UserConfig } from '@/src/types';
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
import { Volume2, VolumeX, Smartphone } from 'lucide-react';

// IEC 60479-2 DC Touch Voltage Reference Levels (Residential capped ≤415V DC)
const ALL_DC_VOLTAGES = [
  { value: 60, label: '60V (DC Safety Extra-Low Voltage SELV)' },
  { value: 120, label: '120V (Safe DC Touch Limit - Dry)' },
  { value: 230, label: '230V (DC Traction / Battery Bank Nominal)' },
  { value: 415, label: '415V (Commercial Solar String / EV Fast Bus)' },
  { value: 750, label: '750V (DC Metro Rail Third Rail)', industrialOnly: true },
  { value: 1000, label: '1000V (Utility Solar PV Array Max)', industrialOnly: true },
];

export function DCShockSimulator({ config }: { config?: UserConfig }) {
  const isResidential = config?.environment === 'residential';
  const maxVoltageLimit = isResidential ? 415 : 1000;

  const [voltage, setVoltage] = useState<number>(isResidential ? 230 : 415);
  const [duration, setDuration] = useState<number>(0);
  const [skinCondition, setSkinCondition] = useState<'dry' | 'wet'>('dry');
  const [path, setPath] = useState<'hand-to-hand' | 'hand-to-foot'>('hand-to-foot');
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isPPESafe, setIsPPESafe] = useState(false);
  const [activePPENames, setActivePPENames] = useState<string[]>([]);
  const [showSafetyLesson, setShowSafetyLesson] = useState(false);

  // ELCB / DC-Sensitive RCD Type B Protection State
  const [rcdType, setRcdType] = useState<'off' | 'rcd_30ma_b' | 'rcd_10ma' | 'rcd_100ma'>('off');
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
    voltage: 415,
    isPPESafe: false,
    activePPENames: []
  });

  const [showAAR, setShowAAR] = useState(false);
  const [isMuscleLocked, setIsMuscleLocked] = useState(false);
  const [timeScale, setTimeScale] = useState<number>(1.0);

  const { startHum, stopHum, triggerMuscleLockVibration } = useAudioHaptics();

  const standardVoltages = useMemo(() => {
    return ALL_DC_VOLTAGES.filter(v => !isResidential || !v.industrialOnly);
  }, [isResidential]);

  useEffect(() => {
    if (isResidential) {
      if (voltage > 415) setVoltage(415);
    }
  }, [isResidential, voltage]);

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
    if (rcdTripTimerRef.current) {
      clearTimeout(rcdTripTimerRef.current);
      rcdTripTimerRef.current = null;
    }
    setIsSimulating(false);
    setHasSimulated(false);
    setIsMuscleLocked(false);
    setRcdTripped(false);
    setRcdTripTimeMs(null);
    setShowSafetyLesson(false);
    setShowAAR(false);
    stopHum();
    setVoltage(isResidential ? 230 : 415);
    setDuration(0);
    setSkinCondition('dry');
    setPath('hand-to-foot');
    setIsPPESafe(false);
    setActivePPENames([]);
    setLastActiveShockData({
      currentMA: 0,
      durationMs: 0,
      skinCondition: 'dry',
      path: 'hand-to-foot',
      voltage: 415,
      isPPESafe: false,
      activePPENames: []
    });
  };

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

  const getResistance = () => {
    let profileMultiplier = 1.0;
    if (config?.profile === 'child') profileMultiplier = 0.60;
    else if (config?.profile === 'teenager') profileMultiplier = 0.75;
    else if (config?.profile === 'adult_female') profileMultiplier = 0.85;
    else if (config?.profile === 'electrician') profileMultiplier = 1.15;

    // IEC 60479-2 Clause 3: DC body impedance is slightly higher than AC (skin capacitance acts as open circuit)
    const iecData = calculateIECImpedance(voltage, skinCondition, profileMultiplier * 1.15);
    const heartFactor = path === 'hand-to-foot' ? 1.0 : 0.4;

    return {
      r: iecData.totalZ,
      internalZ: iecData.internalZ,
      skinZ: iecData.skinZ,
      citation: 'IEC 60479-2:2019 Clause 3 (DC Body Impedance & Path)',
      heartFactor
    };
  };

  const getC1Threshold = (tMs: number) => {
    // IEC 60479-2 Figure 10: DC Fibrillation threshold (c1 curve) ~3.75x higher than AC
    const table = [
      [0, 750], [10, 750], [20, 560], [50, 375], [100, 260], [200, 190], [500, 150], [1000, 110], [10000, 110]
    ];
    let baseThreshold = 110;
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
       return { currentMA: currentMA, effectiveHeartCurrent: effectiveHeartCurrent, r, internalZ, skinZ, citation, level: 1 as ShockEffectLevel, severity: `SAFE: ISOLATED IN ${rcdTripTimeMs}ms BY TYPE B RCD`, intensity: 0.05, heartFactor };
    }
    
    let level: ShockEffectLevel = 1;
    let severity = 'Zone DC-1: Slight DC Perception Tingle';
    
    const c1 = getC1Threshold(duration);
    const c2 = c1 * 1.5;
    const c3 = c1 * 2.5;
    
    if (effectiveHeartCurrent > 2) { level = 2; severity = 'Zone DC-2: Slight Muscle Contractions'; }
    if (effectiveHeartCurrent > 30) { level = 3; severity = 'Zone DC-3: Strong Muscle Reaction (30mA+ Lock)'; }
    if (effectiveHeartCurrent > 100) { level = 4; severity = 'Zone DC-3: Severe Spasm & Respiratory Cramps'; }
    
    if (duration > 0) {
       if (effectiveHeartCurrent > c1) { level = 7; severity = 'Zone DC-4.1: High Danger to Heart (<5% V-Fib)'; }
       if (effectiveHeartCurrent > c2) { level = 8; severity = 'Zone DC-4.2: Extreme Heart Danger (<50% V-Fib)'; }
       if (effectiveHeartCurrent > c3) { level = 9; severity = 'Zone DC-4.3: Fatal Heart Arrest (>50% V-Fib)'; }
    }
    
    const i2t = Math.pow(currentAmp, 2) * (duration / 1000);
    const intensityCurrent = Math.min(effectiveHeartCurrent / 100, 1) * 0.5;
    const intensityEnergy = Math.min(i2t / 0.05, 1) * 0.5;
    const intensity = Math.min(intensityCurrent + intensityEnergy, 1.0);
    
    return { currentMA, effectiveHeartCurrent, r, internalZ, skinZ, citation, level, severity, intensity, heartFactor };
  };

  const results = calculateResults();

  const handleStart = () => {
    if (rcdTripTimerRef.current) {
      clearTimeout(rcdTripTimerRef.current);
      rcdTripTimerRef.current = null;
    }

    setRcdTripped(false);
    setRcdTripTimeMs(null);
    setIsSimulating(true);
    setHasSimulated(true);
    setDuration(0);
    startHum(0);

    const { r, heartFactor } = getResistance();
    const prospectiveCurrentMA = (voltage / r) * 1000;

    // Check if DC RCD Type B protection is enabled and should trip (IEC 62423 / IEC 61008-1)
    if (!isPPESafe && rcdType !== 'off') {
      const rcdResult = calculateRCDTripTime(prospectiveCurrentMA, rcdType);

      if (rcdResult.shouldTrip) {
        const tripMs = rcdResult.tripTimeMs;
        const scaledTripTime = Math.max(15, Math.round(tripMs / timeScale));
        rcdTripTimerRef.current = setTimeout(() => {
          setIsSimulating(false);
          setIsMuscleLocked(false);
          setRcdTripped(true);
          setRcdTripTimeMs(tripMs);
          setDuration(tripMs);
          stopHum();
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

    // DC Muscle Lock threshold is 30mA per IEC 60479-2
    if (!isPPESafe && prospectiveCurrentMA >= 30) {
      setIsMuscleLocked(true);
    }
  };

  const handleStop = () => {
    if (isMuscleLocked && isSimulating) {
      triggerMuscleLockVibration();
      return;
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
  };

  const [mobileTab, setMobileTab] = useState<'controls' | 'twin' | 'charts'>('controls');

  return (
    <motion.div 
      className="flex flex-col lg:flex-row h-full gap-2.5 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0"
      animate={{ x: isSimulating ? [-2, 2, -3, 3, -1, 1, 0] : 0 }}
      transition={{ duration: 0.2, repeat: isSimulating ? Infinity : 0, ease: "linear" }}
    >
      {/* Mobile Viewport Tab Switcher (Hidden on Desktop lg:) */}
      <div className="flex lg:hidden items-center justify-between p-1 bg-slate-950/95 border border-slate-800 rounded-xl mb-1 shrink-0 z-20">
        <button
          type="button"
          onClick={() => setMobileTab('controls')}
          className={cn(
            "flex-1 py-1.5 px-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer",
            mobileTab === 'controls' ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          ⚙️ Controls
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('twin')}
          className={cn(
            "flex-1 py-1.5 px-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer",
            mobileTab === 'twin' ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          👤 Human Twin
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('charts')}
          className={cn(
            "flex-1 py-1.5 px-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer",
            mobileTab === 'charts' ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          📊 Charts
        </button>
      </div>

      {/* Column 1: Left Controls Panel (Zero Scroll) */}
      <div className={cn(
        "w-full lg:w-[310px] xl:w-[330px] shrink-0 p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col h-auto lg:h-full justify-between order-1 lg:order-1 overflow-hidden",
        mobileTab !== 'controls' && "hidden lg:flex"
      )}>
        <div className="space-y-1.5 flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Header & Reset */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 shrink-0">
            <h3 className="flex items-center gap-1.5 text-xs font-black tracking-[0.2em] uppercase text-teal-400 border-l-3 border-teal-500 pl-2">
              <BatteryCharging className="w-4 h-4 text-teal-400" /> DC Parameters
            </h3>
            <button
              type="button"
              onClick={handleResetSimulator}
              className="py-1 px-2.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border-2 border-rose-500/80 hover:border-rose-400 font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
              title="Master Reset all inputs, outputs, and body twin diagram to baseline state"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
              <span>MASTER RESET</span>
            </button>
          </div>
          
          {/* Voltage Selector */}
          <div className="space-y-1 p-2 bg-slate-950 border border-teal-500/50 rounded-xl shadow-md shrink-0">
            <label className="flex justify-between items-center text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-teal-400" /> Voltage (V_dc)</span>
              <span className="text-teal-300 font-black font-mono px-1.5 py-0.2 rounded bg-teal-500/10 border border-teal-500/30 text-xs">
                {voltage} V DC
              </span>
            </label>

            <select
              value={dropdownValue}
              onChange={handleDropdownChange}
              disabled={isMuscleLocked}
              className="w-full bg-slate-950 border border-teal-500/60 hover:border-teal-400 focus:border-teal-400 text-slate-100 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {standardVoltages.map(v => (
                <option key={v.value} value={v.value} className="bg-slate-950 text-slate-200 font-bold">
                  {v.label}
                </option>
              ))}
              <option value="custom" className="bg-slate-950 text-teal-400 font-bold">
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
              className="w-full accent-teal-500 cursor-pointer disabled:opacity-50 mt-0.5"
            />
          </div>

          {/* DC-Sensitive RCD Type B Control */}
          <div className="space-y-1 p-2 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className={cn("w-3.5 h-3.5", rcdType !== 'off' ? "text-teal-400" : "text-slate-400")} />
                <span>DC RCD (Type B) Protection</span>
              </label>
              <span className={cn("text-[9px] font-mono font-black px-1.5 py-0.2 rounded border", 
                rcdType !== 'off' ? "bg-teal-950 text-teal-300 border-teal-500" : "bg-red-950 text-rose-300 border-rose-600"
              )}>
                {rcdType === 'off' ? 'DISABLED (NO RCD)' : rcdType === 'rcd_30ma_b' ? '30mA Type B' : rcdType === 'rcd_10ma' ? '10mA RCD' : '100mA RCD'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => !isMuscleLocked && setRcdType('off')}
                className={cn(
                  "py-1 text-[9.5px] font-black uppercase rounded-lg border transition-all cursor-pointer truncate",
                  rcdType === 'off'
                    ? "bg-red-950/90 text-rose-300 border-rose-500 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                )}
                title="Unprotected DC circuit (Continuous Muscle Lock shock risk)"
              >
                OFF (No RCD)
              </button>
              <button
                type="button"
                onClick={() => !isMuscleLocked && setRcdType('rcd_30ma_b')}
                className={cn(
                  "py-1 text-[9.5px] font-black uppercase rounded-lg border transition-all cursor-pointer truncate",
                  rcdType === 'rcd_30ma_b'
                    ? "bg-teal-950 text-teal-300 border-teal-500 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                )}
                title="30mA Type B DC RCD (IEC 62423 - Trips in ≤30ms on DC Earth Leakage)"
              >
                30mA Type B
              </button>
              <button
                type="button"
                onClick={() => !isMuscleLocked && setRcdType('rcd_10ma')}
                className={cn(
                  "py-1 text-[9.5px] font-black uppercase rounded-lg border transition-all cursor-pointer truncate",
                  rcdType === 'rcd_10ma'
                    ? "bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                )}
                title="10mA High Sensitivity (Medical / Battery - Trips in ≤20ms)"
              >
                10mA Sens
              </button>
            </div>
          </div>

          {/* Shock Duration & TIME SCALE Control */}
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-400"/> Shock Duration
              </span>
              <span className="text-sm font-black font-mono text-teal-400">{duration} ms</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-1 mt-0.5">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">TIME SCALE</span>
              <div className="flex items-center gap-1">
                {[0.25, 0.5, 1.0].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => !isMuscleLocked && setTimeScale(scale)}
                    className={cn(
                      "min-w-[44px] min-h-[44px] inline-flex items-center justify-center px-2 py-1 text-[10px] font-mono font-black rounded-lg border transition-all cursor-pointer select-none",
                      timeScale === scale
                        ? "bg-teal-500/25 border-teal-400 text-teal-300 shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    {scale}X
                  </button>
                ))}
              </div>
            </div>

            {/* EMBEDDED DEBRIEF & LEARNINGS CARD */}
            <DebriefTriggerCard
              onOpen={() => setShowSafetyLesson(true)}
              hasSimulated={hasSimulated}
              isSimulating={isSimulating}
              variant="embedded"
            />
          </div>

          {/* Skin Condition & Path Input */}
          <div className="grid grid-cols-2 gap-1.5 shrink-0">
            <div className="space-y-0.5">
              <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider">Skin Condition</label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => !isMuscleLocked && setSkinCondition('dry')}
                  className={cn("min-h-[44px] flex items-center justify-center py-2 text-xs font-black rounded-xl border uppercase tracking-wider transition-all cursor-pointer select-none", skinCondition === 'dry' ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
                >
                  Dry
                </button>
                <button
                  type="button"
                  onClick={() => !isMuscleLocked && setSkinCondition('wet')}
                  className={cn("min-h-[44px] flex items-center justify-center py-2 text-xs font-black rounded-xl border uppercase tracking-wider transition-all cursor-pointer select-none", skinCondition === 'wet' ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
                >
                  Wet
                </button>
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider">Shock Path</label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => !isMuscleLocked && setPath('hand-to-hand')}
                  className={cn("min-h-[44px] flex items-center justify-center py-2 text-xs font-black rounded-xl border uppercase tracking-wider transition-all cursor-pointer select-none", path === 'hand-to-hand' ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
                >
                  H-H
                </button>
                <button
                  type="button"
                  onClick={() => !isMuscleLocked && setPath('hand-to-foot')}
                  className={cn("min-h-[44px] flex items-center justify-center py-2 text-xs font-black rounded-xl border uppercase tracking-wider transition-all cursor-pointer select-none", path === 'hand-to-foot' ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')}
                >
                  H-F
                </button>
              </div>
            </div>
          </div>

          {/* PPE Protection Toggle */}
          <div className="flex items-center justify-between p-1.5 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className={cn("w-3.5 h-3.5", isPPESafe ? "text-emerald-400" : "text-slate-400")} />
              <span>PPE Rubber Gloves</span>
            </label>
            <button
              type="button"
              onClick={() => handleSafetyChange(!isPPESafe, !isPPESafe ? ['Class 0 Rubber Gloves (10kV Rated)'] : [])}
              className={cn(
                "px-2 py-0.5 text-[9.5px] font-black uppercase rounded-lg border transition-all cursor-pointer",
                isPPESafe
                  ? "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              )}
            >
              {isPPESafe ? '🛡️ ON (SAFE)' : 'OFF (NO PPE)'}
            </button>
          </div>

        </div>

        {/* Desktop Large Prominent HOLD TO SHOCK Button with In-Place Morph */}
        <div className="hidden lg:block pt-2 shrink-0">
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
              "w-full py-3.5 px-3 text-xs md:text-sm font-black tracking-widest uppercase transition-all rounded-2xl flex flex-col items-center justify-center gap-0.5 select-none border-2 shadow-xl",
              isMuscleLocked
                ? "bg-red-950/95 border-red-500 text-red-200 shadow-[0_0_35px_rgba(239,68,68,0.7)] cursor-not-allowed opacity-95 animate-pulse"
                : isSimulating
                  ? "bg-red-600 border-red-400 text-white shadow-[0_0_35px_rgba(239,68,68,0.8)] animate-pulse cursor-pointer active:scale-95"
                  : "bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 border-emerald-300 text-slate-950 shadow-[0_0_25px_rgba(20,184,166,0.4)] hover:shadow-[0_0_40px_rgba(20,184,166,0.6)] cursor-pointer active:scale-95"
            )}
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-center">
              <Zap className={cn("w-4 h-4 fill-current shrink-0", (isSimulating || isMuscleLocked) && "animate-bounce")} />
              <span>
                {isMuscleLocked
                  ? "🔒 MUSCLES LOCKED (CANNOT LET GO)"
                  : isSimulating
                    ? "⚡ SHOCK ACTIVE..."
                    : "⚡ HOLD TO SHOCK"}
              </span>
            </div>
            <span className="text-[8.5px] font-bold font-mono tracking-normal opacity-90">
              {isMuscleLocked
                ? "DC LET-GO EXCEEDED (>30mA) — USE BYSTANDER CUTOFF"
                : isSimulating
                  ? "RELEASE BUTTON TO DISCONNECT"
                  : "PRESS & HOLD BUTTON DOWN"}
            </span>
          </motion.button>
        </div>

        {/* Mobile Action Button with In-Place Morph */}
        <MobileActionButton>
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
                : "bg-gradient-to-r from-teal-500 to-emerald-500 border-teal-300 text-slate-950 active:scale-95 cursor-pointer"
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
                ? "DC LET-GO EXCEEDED (>30mA) — USE BYSTANDER CUTOFF"
                : isSimulating
                  ? "RELEASE TO DISCONNECT"
                  : "PRESS & HOLD BUTTON DOWN"}
            </span>
          </motion.button>
        </MobileActionButton>
      </div>

      {/* Column 2: Center Panel (IEC 60479-2 DC Zone Chart & Impedance Breakdown) */}
      <div className={cn(
        "flex-1 min-w-[280px] xl:min-w-[340px] p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col h-auto lg:h-full overflow-hidden order-3 lg:order-2 space-y-2",
        mobileTab !== 'charts' && "hidden lg:flex"
      )}>
        
        {/* RCD Tripped Hero Banner (if tripped) */}
        {rcdTripped && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-950/95 border-2 border-emerald-400 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.6)] flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 animate-bounce" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                  🛡️ LIFE SAVED BY {rcdType === 'rcd_30ma_b' ? '30mA TYPE B DC RCD' : rcdType === 'rcd_10ma' ? '10mA RCD' : '100mA RCD'}!
                </span>
                <span className="text-[11px] font-mono text-emerald-100 font-bold leading-tight mt-0.5">
                  Device detected {results.currentMA.toFixed(1)}mA DC earth leakage and tripped open in {rcdTripTimeMs}ms! Fault cleared before fatal cardiac fibrillation!
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSafetyLesson(true)}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-lg shrink-0 cursor-pointer shadow-md active:scale-95"
            >
              Debrief
            </button>
          </motion.div>
        )}

        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 shrink-0">
          <h3 className="flex items-center gap-2 text-xs font-black tracking-[0.2em] uppercase text-teal-400 border-l-3 border-teal-500 pl-2">
            <TrendingUp className="w-4 h-4 text-teal-400" /> IEC 60479-2 DC Analysis
          </h3>
          <span className="text-[9.5px] font-mono font-black text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/40">
            Eq. Heart: {results.effectiveHeartCurrent.toFixed(1)} mA
          </span>
        </div>
        
        {/* 4 Metric Cards Grid with Live Impedance Breakdown */}
        <div className="grid grid-cols-2 gap-1.5 shrink-0">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center relative group">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex justify-between">
              <span>Impedance (Z_T)</span>
              <span className="text-teal-400 cursor-help font-bold" title={results.citation}>ℹ️</span>
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
            <span className={cn("text-xs sm:text-sm font-black font-mono flex items-center gap-1", isSimulating ? 'text-teal-400 drop-shadow' : 'text-white')}>
              <span>{results.currentMA.toFixed(1)} mA</span>
              {results.currentMA >= 300 && <span className="text-[8px] px-1 bg-red-950 text-red-300 rounded border border-red-500 font-bold uppercase animate-pulse">dc v-fib risk</span>}
              {results.currentMA >= 100 && results.currentMA < 300 && <span className="text-[8px] px-1 bg-amber-950 text-amber-300 rounded border border-amber-500 font-bold uppercase">respiratory cramp</span>}
              {results.currentMA >= 30 && results.currentMA < 100 && <span className="text-[8px] px-1 bg-orange-950 text-orange-300 rounded border border-orange-500 font-bold uppercase">dc muscle lock</span>}
              {results.currentMA >= 2 && results.currentMA < 30 && <span className="text-[8px] px-1 bg-yellow-950 text-yellow-300 rounded border border-yellow-500 font-bold uppercase">dc tingle</span>}
              {results.currentMA < 2 && <span className="text-[8px] px-1 bg-emerald-950 text-emerald-300 rounded border border-emerald-500 font-bold uppercase">dc safe</span>}
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

        {/* IEC 60479-2 Log-Log Time/Current Zone Chart */}
        <IECZoneChart
          currentMA={results.currentMA}
          durationMs={duration}
          isSimulating={isSimulating}
          shockPath={path}
        />
      </div>

      {/* Column 3: Human Section & Scopes (Full-Body Maximized) */}
      <div className={cn(
        "w-full lg:w-[480px] xl:w-[540px] shrink-0 flex flex-col gap-1.5 h-auto lg:h-full overflow-hidden order-2 lg:order-3 relative z-10 bg-slate-950/95 backdrop-blur-md pb-1 lg:pb-0 border-b border-slate-800 lg:border-b-0 shadow-xl",
        mobileTab !== 'twin' && "hidden lg:flex"
      )}>
        {/* Human Body Twin Container (100% Full Body Head-to-Toes Visible) */}
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
            onMasterReset={handleResetSimulator}
          />
        </div>
        
        {/* Side-by-Side Diagnostic Scopes Grid (Compact High-Density 64px) */}
        <div className="grid grid-cols-2 gap-1.5 h-16 lg:h-18 shrink-0 w-full">
          <div className="h-full w-full border border-slate-800 rounded-xl p-1.5 bg-slate-950 flex flex-col shadow-inner overflow-hidden">
             <span className="text-[9.5px] font-black tracking-wider text-teal-400 uppercase mb-0.5 flex justify-between items-center shrink-0">
               <span>ECG Diagnostics</span>
               {isSimulating && <span className="text-emerald-400 animate-pulse font-mono text-[8.5px]">LIVE ECG</span>}
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

          <div className="h-full w-full border border-slate-800 rounded-xl p-1.5 bg-slate-950 flex flex-col shadow-inner overflow-hidden">
             <span className="text-[9.5px] font-black tracking-wider text-teal-400 uppercase mb-0.5 flex justify-between items-center shrink-0">
               <span>DC Potential Scope</span>
               {isSimulating && <span className="text-teal-400 animate-pulse font-mono text-[8.5px]">{voltage}V DC</span>}
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
        magnitude={`${results.currentMA.toFixed(1)} mA DC Current`}
      />

      {/* Fixed Emergency Bystander Dock */}
      <EmergencyBystanderDock
        isMuscleLocked={isMuscleLocked}
        isSimulating={isSimulating}
        onSwitchOffPower={handleEmergencyCutoff}
        currentMA={results.currentMA}
        voltage={voltage}
      />
    
      {/* Upgraded Incident Debrief Modal */}
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
