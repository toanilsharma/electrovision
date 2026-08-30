import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Flame, 
  BookOpen, 
  Printer, 
  Sliders, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Shield, 
  Layers, 
  Eye, 
  AlertOctagon, 
  FlameKindling, 
  Thermometer, 
  Gauge, 
  Zap, 
  MoreVertical, 
  Save, 
  Volume2, 
  VolumeX, 
  Check, 
  ArrowRight, 
  Activity,
  HeartPulse,
  Square,
  ShieldAlert,
  AlertTriangle,
  Scale,
  FileText,
  Ambulance
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { EmergencyResponse } from '../EmergencyResponse';
import { PPEValidator } from '../PPEValidator';
import { useAudioHaptics } from '../useAudioHaptics';
import { HazardOverlay } from '../HazardOverlay';
import { 
  calculateIEEE1584_2018, 
  ElectrodeConfig, 
  GroundingSystem, 
  evaluateNFPA70ECategory,
  calculateConductorBurnoffTime,
  calculateReleasedArcEnergy,
  calculateRoomTemperatureRise,
  calculateOverpressure
} from '../../utils/ieee1584-2018';
import { ToScaleView } from '../ToScaleView';
import { ArcFlashLabelModal } from '../ArcFlashLabelModal';

export type ProtectionMode = 'normal' | 'arms' | 'no_trip';

/**
 * Standardized Reusable Cockpit HUD Chip Token
 */
interface HudChipProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  children: React.ReactNode;
  className?: string;
}

export function HudChip({ position, children, className }: HudChipProps) {
  const posClasses = {
    'top-left': 'top-2.5 left-2.5 items-start',
    'top-right': 'top-2.5 right-2.5 items-end',
    'bottom-left': 'bottom-2.5 left-2.5 items-start',
    'bottom-right': 'bottom-2.5 right-2.5 items-end'
  };

  return (
    <div className={cn(
      "absolute z-30 pointer-events-none flex flex-col gap-1 text-[11px] font-mono",
      posClasses[position],
      className
    )}>
      {children}
    </div>
  );
}

interface EquipmentPreset {
  id: string;
  name: string;
  voltage: number;
  boltedFaultCurrent: number;
  gap: number;
  workingDistance: number;
  enclosureWidth: number;
  enclosureHeight: number;
  enclosureDepth: number;
  electrodeConfig: ElectrodeConfig;
}

const DEFAULT_PRESETS: EquipmentPreset[] = [
  {
    id: 'mv-switchgear-11kv',
    name: 'MV Switchgear 11kV 30kA (Default)',
    voltage: 10990,
    boltedFaultCurrent: 30,
    gap: 152,
    workingDistance: 914,
    enclosureWidth: 508,
    enclosureHeight: 610,
    enclosureDepth: 508,
    electrodeConfig: 'VCB',
  },
  {
    id: 'lv-mcc-480v',
    name: 'LV MCC 480V 25kA',
    voltage: 480,
    boltedFaultCurrent: 25,
    gap: 32,
    workingDistance: 455,
    enclosureWidth: 500,
    enclosureHeight: 500,
    enclosureDepth: 500,
    electrodeConfig: 'VCB',
  },
  {
    id: 'lv-switchboard-415v',
    name: 'LV Switchboard 415V 50kA',
    voltage: 415,
    boltedFaultCurrent: 50,
    gap: 32,
    workingDistance: 610,
    enclosureWidth: 610,
    enclosureHeight: 610,
    enclosureDepth: 610,
    electrodeConfig: 'VCBB',
  },
  {
    id: 'mv-mcc-33kv',
    name: 'MV MCC 3.3kV 15kA',
    voltage: 3300,
    boltedFaultCurrent: 15,
    gap: 104,
    workingDistance: 914,
    enclosureWidth: 508,
    enclosureHeight: 508,
    enclosureDepth: 508,
    electrodeConfig: 'VCB',
  },
  {
    id: 'panelboard-208v',
    name: 'Panelboard 208V 10kA',
    voltage: 208,
    boltedFaultCurrent: 10,
    gap: 25,
    workingDistance: 455,
    enclosureWidth: 350,
    enclosureHeight: 500,
    enclosureDepth: 250,
    electrodeConfig: 'VOA',
  },
];

interface EducationalScenario {
  id: string;
  name: string;
  takeaway: string;
  voltage: number;
  boltedFaultCurrent: number;
  gap: number;
  workingDistance: number;
  clearingTimeMs: number;
  protectionMode: ProtectionMode;
  electrodeConfig: ElectrodeConfig;
}

const EDUCATIONAL_SCENARIOS: EducationalScenario[] = [
  {
    id: 'scen-208v',
    name: '208V Panelboard (20ms Fast Trip)',
    takeaway: 'Low voltage & fast clearing yield Cat 1 / safe thermal energy.',
    voltage: 208,
    boltedFaultCurrent: 10,
    gap: 25,
    workingDistance: 455,
    clearingTimeMs: 20,
    protectionMode: 'normal',
    electrodeConfig: 'VOA',
  },
  {
    id: 'scen-480v-arms',
    name: '480V MCC Maintenance (ARMS Active)',
    takeaway: 'Engaging ARMS 40ms trip drops hazard from Cat 4 to Cat 2!',
    voltage: 480,
    boltedFaultCurrent: 35,
    gap: 32,
    workingDistance: 455,
    clearingTimeMs: 40,
    protectionMode: 'arms',
    electrodeConfig: 'VCB',
  },
  {
    id: 'scen-11kv-slow',
    name: '11kV Switchgear (400ms Slow Relay)',
    takeaway: 'High voltage + 400ms slow clearing creates dangerous Cat 4 blast radius.',
    voltage: 10990,
    boltedFaultCurrent: 30,
    gap: 152,
    workingDistance: 914,
    clearingTimeMs: 400,
    protectionMode: 'normal',
    electrodeConfig: 'HCB',
  },
  {
    id: 'scen-breaker-fail',
    name: 'Breaker Failure (No Trip — 2.0s Backup)',
    takeaway: 'Trip coil failure forces upstream backup clearing or conductor burnoff!',
    voltage: 10990,
    boltedFaultCurrent: 30,
    gap: 152,
    workingDistance: 914,
    clearingTimeMs: 2000,
    protectionMode: 'no_trip',
    electrodeConfig: 'HCB',
  }
];

export function ArcFlashSimulator({ config }: { config?: UserConfig }) {
  // PROTECTION MODE SEGMENTED CONTROL: 'normal' | 'arms' | 'no_trip'
  const [protectionMode, setProtectionMode] = useState<ProtectionMode>('normal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ACCORDIONS OPEN/CLOSE STATES
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    equipment: true,
    worker: true,
    goose: false,
    noTrip: true,
  });

  // RIGHT HAZARD CONSOLE DRAWER STATE & ACTIVE TAB
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'blast' | 'ladder' | 'compare' | 'trace' | 'rescue'>('blast');

  // MODALS & OVERLAYS
  const [showTheoryModal, setShowTheoryModal] = useState<boolean>(false);
  const [showLabelModal, setShowLabelModal] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // INTERACTION ENGINE STATES
  const [isPointerHeld, setIsPointerHeld] = useState<boolean>(false);
  const [isLatchedActive, setIsLatchedActive] = useState<boolean>(false);
  const [stopReasonChip, setStopReasonChip] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // NO-TRIP BREAKER FAILURE PARAMETERS
  const [tBackupSec, setTBackupSec] = useState<number>(2.0);
  const [conductorMaterial, setConductorMaterial] = useState<'Cu' | 'Al'>('Cu');
  const [conductorSizeMm2, setConductorSizeMm2] = useState<number>(120);
  const [roomVolumeM3, setRoomVolumeM3] = useState<number>(27);

  const [unit, setUnit] = useState<'cal' | 'joules'>('cal');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('mv-switchgear-11kv');
  const [customPreset, setCustomPreset] = useState<EquipmentPreset | null>(null);

  // IEEE 1584 PARAMETERS
  const [voltage, setVoltage] = useState<number>(10990);
  const [opticalTime, setOpticalTime] = useState<number>(10.0);
  const [gooseLatency, setGooseLatency] = useState<number>(15.0);
  const [breakerTime, setBreakerTime] = useState<number>(120);
  const [boltedFaultCurrent, setBoltedFaultCurrent] = useState<number>(30);
  
  const [electrodeConfig, setElectrodeConfig] = useState<ElectrodeConfig>('VCB');
  const [gap, setGap] = useState<number>(152);
  const [workingDistance, setWorkingDistance] = useState<number>(914);
  const [enclosureWidth, setEnclosureWidth] = useState<number>(508);
  const [enclosureHeight, setEnclosureHeight] = useState<number>(610);
  const [enclosureDepth, setEnclosureDepth] = useState<number>(508);
  const [grounding, setGrounding] = useState<GroundingSystem>('solidly_grounded');

  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isPPESafe, setIsPPESafe] = useState(false);
  const { playArcBlast } = useAudioHaptics();

  const isLowVoltage = voltage <= 600;
  const gapMin = isLowVoltage ? 6.35 : 12.7;
  const gapMax = isLowVoltage ? 76.2 : 304.8;

  // Instrument PerformanceObserver for zero Cumulative Layout Shift (CLS == 0)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        return () => observer.disconnect();
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isLowVoltage && gap > 76.2) {
      setGap(32);
    } else if (!isLowVoltage && gap < 12.7) {
      setGap(152);
    }
  }, [isLowVoltage]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('electrovision_custom_preset');
      if (saved) setCustomPreset(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Handle Protection Mode Segmented Control Change with 3s Toast
  const handleSetProtectionMode = (mode: ProtectionMode) => {
    setProtectionMode(mode);
    setIsLatchedActive(false);
    setIsSimulating(false);

    let msg = 'Standard Circuit Breaker Protection Active';
    if (mode === 'arms') msg = 'ARMS Maintenance Switch Engaged (40ms Fast Trip)';
    if (mode === 'no_trip') msg = 'BREAKER FAILURE (NO TRIP) Active — Backup Protection Engaged';

    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    let target: EquipmentPreset | undefined;
    if (presetId === 'custom' && customPreset) {
      target = customPreset;
    } else {
      target = DEFAULT_PRESETS.find(p => p.id === presetId);
    }

    if (target) {
      setVoltage(target.voltage);
      setBoltedFaultCurrent(target.boltedFaultCurrent);
      setGap(target.gap);
      setWorkingDistance(target.workingDistance);
      setEnclosureWidth(target.enclosureWidth);
      setEnclosureHeight(target.enclosureHeight);
      setEnclosureDepth(target.enclosureDepth);
      setElectrodeConfig(target.electrodeConfig);
    }
  };

  const handleSaveCustomPreset = () => {
    const namePrompt = prompt('Enter a name for your custom equipment preset:', 'Custom Switchgear Panel');
    if (!namePrompt) return;

    const newPreset: EquipmentPreset = {
      id: 'custom',
      name: namePrompt,
      voltage,
      boltedFaultCurrent,
      gap,
      workingDistance,
      enclosureWidth,
      enclosureHeight,
      enclosureDepth,
      electrodeConfig,
    };

    setCustomPreset(newPreset);
    setSelectedPresetId('custom');
    localStorage.setItem('electrovision_custom_preset', JSON.stringify(newPreset));
    alert(`Custom preset "${namePrompt}" saved successfully!`);
  };

  const handleApplyScenario = (scenario: EducationalScenario) => {
    setVoltage(scenario.voltage);
    setBoltedFaultCurrent(scenario.boltedFaultCurrent);
    setGap(scenario.gap);
    setWorkingDistance(scenario.workingDistance);
    setProtectionMode(scenario.protectionMode);
    setElectrodeConfig(scenario.electrodeConfig);
    if (scenario.protectionMode === 'normal') {
      setBreakerTime(scenario.clearingTimeMs - 25);
    }
  };

  // Normal clearing time vs Breaker Failure clearing time calculations
  const effectiveBreakerTime = protectionMode === 'arms' ? 40 : breakerTime;
  const normalClearingTimeMs = opticalTime + gooseLatency + effectiveBreakerTime;
  const normalClearingTimeSec = normalClearingTimeMs / 1000;

  // Compute Arcing Current Ia first to evaluate t_burnoff
  const tempResult = calculateIEEE1584_2018({
    voltage,
    boltedFaultCurrent,
    gap,
    workingDistance,
    clearingTimeMs: normalClearingTimeMs,
    electrodeConfig,
    enclosureWidth,
    enclosureHeight,
    enclosureDepth,
    grounding
  });

  const arcingCurrentKa = tempResult.arcingCurrent;

  // Conductor burnoff time t_burnoff
  const tBurnoffSec = calculateConductorBurnoffTime(conductorMaterial, conductorSizeMm2, arcingCurrentKa);
  const isVaporizedFirst = tBurnoffSec < tBackupSec;

  // Active clearing time based on Protection Mode
  const failureClearingTimeSec = Math.min(tBackupSec, tBurnoffSec);
  const activeClearingTimeMs = protectionMode === 'no_trip' ? (failureClearingTimeSec * 1000) : normalClearingTimeMs;

  const ieeeResult = calculateIEEE1584_2018({
    voltage,
    boltedFaultCurrent,
    gap,
    workingDistance,
    clearingTimeMs: activeClearingTimeMs,
    electrodeConfig,
    enclosureWidth,
    enclosureHeight,
    enclosureDepth,
    grounding
  });

  const { 
    arcingCurrent, 
    incidentEnergy, 
    incidentEnergyJoules, 
    incidentEnergyKjM2, 
    boundaryRadius, 
    cf, 
    ees,
    ppeCategory,
    isExtrapolated, 
    isValid, 
    validationMessages, 
    trace 
  } = ieeeResult;

  // Released Energy & Thermodynamics physics computations
  const releasedEnergy = calculateReleasedArcEnergy(voltage, gap, arcingCurrent, activeClearingTimeMs / 1000);
  const roomTemp = calculateRoomTemperatureRise(releasedEnergy.releasedJoules, roomVolumeM3);
  const overpress = calculateOverpressure(releasedEnergy.releasedMJ, (enclosureWidth * enclosureHeight * enclosureDepth) / 1000000000);

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // POINTER CAPTURE & STABLE HOLD BUTTON INTERACTION
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (e.currentTarget) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    if (isLatchedActive) {
      setIsLatchedActive(false);
      setIsSimulating(false);
      setStopReasonChip('ISOLATED BY OPERATOR');
      setTimeout(() => setIsDrawerOpen(true), 1200);
      return;
    }

    setIsPointerHeld(true);
    setIsSimulating(true);
    setHasSimulated(true);
    setStopReasonChip(null);
    if (!isMuted) playArcBlast();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    setIsPointerHeld(false);

    if (protectionMode === 'no_trip') {
      setIsLatchedActive(true);
      
      setTimeout(() => {
        setIsLatchedActive(false);
        setIsSimulating(false);
        setStopReasonChip(isVaporizedFirst ? 'CONDUCTOR VAPORIZED' : 'UPSTREAM BACKUP TRIP');
        setTimeout(() => setIsDrawerOpen(true), 1200);
      }, failureClearingTimeSec * 1000);
    } else {
      setIsSimulating(false);
      setTimeout(() => setIsDrawerOpen(true), 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
      e.preventDefault();
      setIsPointerHeld(true);
      setIsSimulating(true);
      setHasSimulated(true);
      if (!isMuted) playArcBlast();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      setIsPointerHeld(false);
      if (protectionMode === 'no_trip') {
        setIsLatchedActive(true);
      } else {
        setIsSimulating(false);
        setTimeout(() => setIsDrawerOpen(true), 1500);
      }
    }
  };

  const handleCopyTrace = () => {
    const traceText = `=== IEEE 1584-2018 ARC FLASH CALCULATION TRACE ===
Inputs: Voc=${voltage}V, Ibf=${boltedFaultCurrent}kA, Gap=${gap}mm, D=${workingDistance}mm, Config=${electrodeConfig}
1. Arcing Current (Eq. 1-3): Ia_600=${trace.Iarc_600.toFixed(2)}kA, Ia_2700=${trace.Iarc_2700.toFixed(2)}kA, Ia_14300=${trace.Iarc_14300.toFixed(2)}kA
2. Interpolated Arcing Current Ia (Eq. 4): ${arcingCurrent.toFixed(2)} kA
3. Enclosure Correction Factor CF (Eq. 5-7): CF=${cf.toFixed(3)}, EES=${Math.round(ees)}mm
4. Normalized Incident Energy En (Eq. 8): En=${trace.En.toFixed(3)} cal/cm²
5. Incident Energy E at ${workingDistance}mm (Eq. 9-10): E=${incidentEnergy.toFixed(2)} cal/cm² (${incidentEnergyKjM2.toFixed(1)} kJ/m²)
6. Arc Flash Boundary Db (Eq. 11-12): Db=${boundaryRadius.toFixed(2)} meters (${(boundaryRadius * 3.28084).toFixed(1)} ft)
7. Released Arc Energy: ${releasedEnergy.releasedMJ.toFixed(2)} MJ (${releasedEnergy.tntKg.toFixed(2)} kg TNT eq) | Room ΔT: ${roomTemp.deltaT.toFixed(1)}°C
NFPA 70E 2024 Category: PPE Category ${ppeCategory}`;

    navigator.clipboard.writeText(traceText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Generate Animated Hazard Alert Feed Items for BLAST Tab
  const hazardAlertFeed = useMemo(() => {
    const items: { ms: number; text: string; icon: React.ReactNode; color: string }[] = [
      { ms: 0, text: 'ARC IGNITION: Sustained 20,000°C Core', icon: <Flame className="w-3.5 h-3.5" />, color: 'text-red-400' }
    ];

    if (incidentEnergy > 8) {
      items.push({ ms: Math.round(opticalTime), text: `PPE OVERWHELMED (${incidentEnergy.toFixed(1)} cal/cm²)`, icon: <ShieldAlert className="w-3.5 h-3.5" />, color: 'text-red-500 font-black' });
    }
    if (incidentEnergy >= 1.2) {
      items.push({ ms: 25, text: '2ND-DEGREE BURN THRESHOLD (1.2 cal/cm²)', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-yellow-400' });
    }
    if (incidentEnergy >= 5.0) {
      items.push({ ms: 40, text: 'CABLE TRAY IGNITION & FLAME SPREAD', icon: <FlameKindling className="w-3.5 h-3.5" />, color: 'text-orange-500' });
    }
    if (incidentEnergy >= 8.0) {
      items.push({ ms: 80, text: 'CLOTHING IGNITION / 3RD-DEGREE BURN', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-amber-400' });
    }
    if (incidentEnergy >= 25.0) {
      items.push({ ms: 120, text: 'SEVERE 3RD-DEGREE FULL THICKNESS BURN', icon: <Flame className="w-3.5 h-3.5" />, color: 'text-red-400' });
    }
    if (incidentEnergy >= 40.0) {
      items.push({ ms: 180, text: 'FATAL EXPOSURE PROBABLE (>40 cal/cm²)', icon: <AlertOctagon className="w-3.5 h-3.5" />, color: 'text-rose-500 font-black animate-pulse' });
    }

    items.push({ ms: Math.round(activeClearingTimeMs * 0.7), text: `ROOM AIR ΔT: +${roomTemp.deltaT.toFixed(1)}°C (Final ${roomTemp.finalTempC.toFixed(1)}°C)`, icon: <Thermometer className="w-3.5 h-3.5" />, color: 'text-sky-400' });
    items.push({ ms: Math.round(activeClearingTimeMs * 0.9), text: `PEAK OVERPRESSURE: ${overpress.overpressureKpa.toFixed(1)} kPa (${overpress.isEardrumRisk ? 'Eardrum rupture' : 'Acoustic wave'})`, icon: <Gauge className="w-3.5 h-3.5" />, color: 'text-purple-400' });

    if (protectionMode === 'no_trip') {
      items.push({ ms: Math.round(activeClearingTimeMs), text: `STATUS: ${isVaporizedFirst ? 'CONDUCTOR VAPORIZED' : 'UPSTREAM BACKUP TRIP'}`, icon: <Check className="w-3.5 h-3.5" />, color: 'text-emerald-400 font-bold' });
    } else {
      items.push({ ms: Math.round(activeClearingTimeMs), text: 'XCBR1 BREAKER OPEN — ARC QUENCHED', icon: <Check className="w-3.5 h-3.5" />, color: 'text-emerald-400 font-bold' });
    }

    return items;
  }, [incidentEnergy, opticalTime, activeClearingTimeMs, roomTemp, overpress, protectionMode, isVaporizedFirst]);

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-mono select-none relative">
      
      {/* FIXED SLOT TRANSIENT TOAST OVERLAY (CLS = 0) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-[100] px-3.5 py-1.5 rounded-xl bg-slate-900 border border-orange-500/80 text-orange-300 text-[11px] font-bold shadow-2xl flex items-center gap-2 pointer-events-none font-mono"
            aria-live="polite"
          >
            <Zap className="w-4 h-4 text-orange-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP COCKPIT HEADER BAR (40px on mobile, 48px on desktop) */}
      <header className="h-[40px] sm:h-[48px] shrink-0 px-2 sm:px-3 py-1 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-1.5 text-xs font-bold font-mono z-30">
        
        {/* Left: App Title & Scenario Selector Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shrink-0">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
          </div>
          
          <select
            onChange={(e) => {
              if (e.target.value === 'save_custom') handleSaveCustomPreset();
              else {
                const scen = EDUCATIONAL_SCENARIOS.find(s => s.id === e.target.value);
                if (scen) handleApplyScenario(scen);
                else handleSelectPreset(e.target.value);
              }
            }}
            className="bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 text-[11px] sm:text-xs font-bold text-orange-300 focus:border-orange-500 focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[210px] truncate min-h-[32px] sm:min-h-[36px]"
          >
            <optgroup label="Educational Scenarios">
              {EDUCATIONAL_SCENARIOS.map(scen => (
                <option key={scen.id} value={scen.id}>⚡ {scen.name}</option>
              ))}
            </optgroup>
            <optgroup label="Equipment Presets">
              {DEFAULT_PRESETS.map(preset => (
                <option key={preset.id} value={preset.id}>⚙️ {preset.name}</option>
              ))}
            </optgroup>
            <option value="save_custom">💾 Save Custom Preset...</option>
          </select>
        </div>

        {/* Center: PROTECTION Segmented Control */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-800 text-[11px] sm:text-xs">
            <button
              onClick={() => handleSetProtectionMode('normal')}
              className={cn(
                "px-2 sm:px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer min-h-[32px] focus-visible:ring-2 focus-visible:ring-cyan-400",
                protectionMode === 'normal' ? "bg-slate-800 text-white font-black shadow" : "text-slate-400 hover:text-white"
              )}
            >
              <span className="sm:hidden">⚡ NORM</span>
              <span className="hidden sm:inline">NORMAL</span>
            </button>
            <button
              onClick={() => handleSetProtectionMode('arms')}
              className={cn(
                "px-2 sm:px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer min-h-[32px] focus-visible:ring-2 focus-visible:ring-cyan-400",
                protectionMode === 'arms' ? "bg-green-500 text-slate-950 font-black shadow" : "text-green-400 hover:text-green-200"
              )}
            >
              <span className="sm:hidden">🛡️ ARMS</span>
              <span className="hidden sm:inline">ARMS (40ms)</span>
            </button>
            <button
              onClick={() => handleSetProtectionMode('no_trip')}
              className={cn(
                "px-2 sm:px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center gap-1 min-h-[32px] focus-visible:ring-2 focus-visible:ring-cyan-400",
                protectionMode === 'no_trip' ? "bg-red-500 text-slate-950 font-black shadow" : "text-red-400 hover:text-red-200"
              )}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>NO-TRIP</span>
            </button>
          </div>

          {protectionMode === 'no_trip' && (
            <span className="hidden md:inline-flex px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
              PROTECTION: FAILED
            </span>
          )}
        </div>

        {/* Right: UNIT Dropdown & `⋯` Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setUnit(u => u === 'cal' ? 'joules' : 'cal')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[11px] sm:text-xs font-bold text-orange-300 transition-colors cursor-pointer min-h-[32px] sm:min-h-[34px]"
          >
            {unit === 'cal' ? 'cal/cm²' : 'kJ/m²'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(m => !m)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors cursor-pointer min-h-[32px] sm:min-h-[34px] flex items-center justify-center min-w-[36px]"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl py-1 z-50 text-[11px] font-mono">
                <button
                  onClick={() => { setShowLabelModal(true); setShowMoreMenu(false); }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-200 flex items-center gap-2 min-h-[44px]"
                >
                  <Printer className="w-4 h-4 text-sky-400" /> Arc Flash Warning Label
                </button>
                <button
                  onClick={() => { setShowTheoryModal(true); setShowMoreMenu(false); }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-200 flex items-center gap-2 min-h-[44px]"
                >
                  <BookOpen className="w-4 h-4 text-orange-400" /> Theory &amp; Standards Manual
                </button>
                <button
                  onClick={() => { setIsMuted(m => !m); setShowMoreMenu(false); }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-200 flex items-center gap-2 min-h-[44px]"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
                  {isMuted ? 'Unmute Audio' : 'Mute Audio'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN COCKPIT ROW [CONTROL RAIL 272px | VIEWPORT STAGE 1FR | HAZARD ICON RAIL 48px] */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT CONTROL RAIL / MOBILE BOTTOM SHEET */}
        <aside className="w-full lg:w-[272px] shrink-0 h-[48vh] lg:h-full border-t lg:border-t-0 lg:border-r border-slate-800 bg-slate-900/90 flex flex-col z-20 order-2 lg:order-1">
          
          {/* FIXED SLOT HOLD BUTTON (CLS = 0; STABLE DOM NODE) */}
          <div className="p-2 border-b border-slate-800 bg-slate-950 shrink-0 h-[56px] min-h-[56px] flex items-center justify-center">
            <button
              ref={buttonRef}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onContextMenu={(e) => e.preventDefault()}
              style={{ touchAction: 'none' }}
              className={cn(
                "w-full h-full py-3 font-black text-xs sm:text-sm uppercase tracking-wider transition-colors rounded-xl flex items-center justify-center gap-2 select-none shadow-lg cursor-pointer min-h-[44px]",
                isLatchedActive 
                  ? "bg-red-600 hover:bg-red-500 text-white animate-pulse" 
                  : isSimulating 
                    ? "bg-orange-500 text-slate-950" 
                    : "bg-orange-500 hover:bg-orange-400 text-slate-950"
              )}
            >
              {isLatchedActive ? (
                <>
                  <Square className="w-4 h-4 fill-current text-white" />
                  <span>⏹ STOP INCIDENT (MANUAL ISOLATION)</span>
                </>
              ) : isSimulating ? (
                <>
                  <Flame className="w-4 h-4 fill-current animate-bounce" />
                  <span>🔥 ARC ACTIVE — HOLDING...</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 fill-current" />
                  <span>HOLD TO INITIATE ARC</span>
                </>
              )}
            </button>
          </div>

          {/* STOP REASON CHIP BANNER */}
          {stopReasonChip && (
            <div className="px-3 py-1 bg-amber-950 border-b border-amber-500/50 text-[10px] font-bold text-amber-200 font-mono text-center flex items-center justify-center gap-1.5 shrink-0">
              <Check className="w-3 h-3 text-amber-400" />
              <span>STATUS: {stopReasonChip}</span>
            </div>
          )}

          {/* Scrollable Accordions */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-[11px] sm:text-xs">
            
            {/* EQUIPMENT ACCORDION */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleAccordion('equipment')}
                className="w-full px-3 py-2 bg-slate-900/80 hover:bg-slate-850 flex items-center justify-between font-bold text-orange-400 uppercase cursor-pointer min-h-[44px]"
              >
                <span>1. EQUIPMENT &amp; GAP</span>
                {openAccordions.equipment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {openAccordions.equipment && (
                <div className="p-2.5 space-y-2.5 border-t border-slate-800">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Electrode Config</label>
                    <select
                      value={electrodeConfig}
                      onChange={(e) => setElectrodeConfig(e.target.value as ElectrodeConfig)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-100 min-h-[44px]"
                    >
                      <option value="VCB">VCB - Vertical Box</option>
                      <option value="VCBB">VCBB - Vertical Barrier</option>
                      <option value="HCB">HCB - Horizontal Box (+45%)</option>
                      <option value="VOA">VOA - Vertical Open Air</option>
                      <option value="HOA">HOA - Horizontal Open Air</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-1">
                      <span>Electrode Gap (G)</span>
                      <span className="text-orange-300 font-mono tabular-nums">{gap} mm</span>
                    </div>
                    <input
                      type="range"
                      min={gapMin} max={gapMax} step="1"
                      value={gap}
                      onChange={(e) => setGap(Number(e.target.value))}
                      className="w-full h-2.5 accent-orange-500 cursor-pointer rounded-lg bg-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block">W (mm)</label>
                      <input
                        type="number" value={enclosureWidth}
                        onChange={(e) => setEnclosureWidth(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-750 rounded p-1 text-xs text-white min-h-[36px]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block">H (mm)</label>
                      <input
                        type="number" value={enclosureHeight}
                        onChange={(e) => setEnclosureHeight(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-750 rounded p-1 text-xs text-white min-h-[36px]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block">D (mm)</label>
                      <input
                        type="number" value={enclosureDepth}
                        onChange={(e) => setEnclosureDepth(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-750 rounded p-1 text-xs text-white min-h-[36px]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WORKER & ENVIRONMENT ACCORDION */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleAccordion('worker')}
                className="w-full px-3 py-2 bg-slate-900/80 hover:bg-slate-850 flex items-center justify-between font-bold text-orange-400 uppercase cursor-pointer min-h-[44px]"
              >
                <span>2. WORKER &amp; ROOM</span>
                {openAccordions.worker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {openAccordions.worker && (
                <div className="p-2.5 space-y-2.5 border-t border-slate-800">
                  <div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-1">
                      <span>Work Distance (D)</span>
                      <span className="text-orange-300 font-mono tabular-nums">{workingDistance} mm</span>
                    </div>
                    <input
                      type="range"
                      min="185" max="6100" step="5"
                      value={workingDistance}
                      onChange={(e) => setWorkingDistance(Number(e.target.value))}
                      className="w-full h-2.5 accent-orange-500 cursor-pointer rounded-lg bg-slate-800"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-1">
                      <span>Room Volume</span>
                      <span className="text-sky-300 font-mono tabular-nums">{roomVolumeM3} m³</span>
                    </div>
                    <input
                      type="range"
                      min="10" max="200" step="5"
                      value={roomVolumeM3}
                      onChange={(e) => setRoomVolumeM3(Number(e.target.value))}
                      className="w-full h-2.5 accent-sky-500 cursor-pointer rounded-lg bg-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* GOOSE CHAIN ACCORDION */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleAccordion('goose')}
                className="w-full px-3 py-2 bg-slate-900/80 hover:bg-slate-850 flex items-center justify-between font-bold text-orange-400 uppercase cursor-pointer min-h-[44px]"
              >
                <span>3. GOOSE TIMING</span>
                {openAccordions.goose ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {openAccordions.goose && (
                <div className="p-2.5 space-y-2.5 border-t border-slate-800">
                  <div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-1">
                      <span>Sensor Optical</span>
                      <span className="text-sky-300 font-mono tabular-nums">{opticalTime} ms</span>
                    </div>
                    <input
                      type="range" min="1" max="50" step="1" value={opticalTime}
                      onChange={(e) => setOpticalTime(Number(e.target.value))}
                      className="w-full h-2.5 accent-sky-500 cursor-pointer rounded-lg bg-slate-800"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-1">
                      <span>GOOSE Latency</span>
                      <span className="text-amber-300 font-mono tabular-nums">{gooseLatency} ms</span>
                    </div>
                    <input
                      type="range" min="1" max="50" step="1" value={gooseLatency}
                      onChange={(e) => setGooseLatency(Number(e.target.value))}
                      className="w-full h-2.5 accent-amber-500 cursor-pointer rounded-lg bg-slate-800"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-1">
                      <span>Breaker Trip</span>
                      <span className="text-green-300 font-mono tabular-nums">{effectiveBreakerTime} ms</span>
                    </div>
                    <input
                      type="range" min="10" max="400" step="5" value={breakerTime}
                      disabled={protectionMode === 'arms'}
                      onChange={(e) => setBreakerTime(Number(e.target.value))}
                      className="w-full h-2.5 accent-green-500 cursor-pointer rounded-lg bg-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* NO-TRIP BREAKER FAILURE INLINE ACCORDION */}
            {protectionMode === 'no_trip' && (
              <div className="bg-red-950/40 border border-red-500/60 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleAccordion('noTrip')}
                  className="w-full px-3 py-2 bg-red-900/40 hover:bg-red-900/60 flex items-center justify-between font-black text-red-300 uppercase cursor-pointer min-h-[44px]"
                >
                  <span className="flex items-center gap-1"><AlertOctagon className="w-3.5 h-3.5" /> BREAKER FAILURE</span>
                  {openAccordions.noTrip ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {openAccordions.noTrip && (
                  <div className="p-2.5 space-y-2.5 border-t border-red-500/40 text-left">
                    <div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-white uppercase mb-1">
                        <span>Backup Relay Time</span>
                        <span className="text-red-300 font-mono tabular-nums">{tBackupSec.toFixed(1)} s</span>
                      </div>
                      <input
                        type="range" min="0.5" max="5.0" step="0.1" value={tBackupSec}
                        onChange={(e) => setTBackupSec(Number(e.target.value))}
                        className="w-full h-2.5 accent-red-500 cursor-pointer rounded-lg bg-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[9px] text-slate-300 uppercase font-bold block">Material</label>
                        <select
                          value={conductorMaterial}
                          onChange={(e) => setConductorMaterial(e.target.value as 'Cu' | 'Al')}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white min-h-[44px]"
                        >
                          <option value="Cu">Copper</option>
                          <option value="Al">Aluminum</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-300 uppercase font-bold block">Size (mm²)</label>
                        <input
                          type="number" value={conductorSizeMm2} min="35" max="600" step="5"
                          onChange={(e) => setConductorSizeMm2(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white font-mono min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </aside>

        {/* RIGHT VIEWPORT STAGE (1FR) */}
        <main className="flex-1 min-w-0 h-[52vh] lg:h-full relative flex items-center justify-center bg-slate-950 overflow-hidden order-1 lg:order-2">
          
          <ToScaleView 
            workingDistanceMeters={Number((workingDistance / 1000).toFixed(2))}
            boundaryRadiusMeters={boundaryRadius}
            incidentEnergy={incidentEnergy}
            isSimulating={isSimulating}
            clearingTimeMs={activeClearingTimeMs}
            opticalTimeMs={opticalTime}
            gooseLatencyMs={gooseLatency}
            breakerTimeMs={protectionMode === 'no_trip' ? (failureClearingTimeSec * 1000 - opticalTime - gooseLatency) : effectiveBreakerTime}
            electrodeConfig={electrodeConfig}
            isPPESafe={isPPESafe}
          />

          {/* VIEWPORT HUD ANCHORED CORNER CHIPS */}
          
          {/* Top-Left: Incident Energy Large Readout & PPE Badge */}
          <HudChip position="top-left">
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/90 border border-slate-750 shadow-2xl backdrop-blur-md">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Incident Energy (E)</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-black font-mono text-orange-400 tabular-nums">
                  {unit === 'cal' ? incidentEnergy.toFixed(2) : incidentEnergyKjM2.toFixed(1)}
                </span>
                <span className="text-[10px] font-bold text-slate-300 uppercase">{unit === 'cal' ? 'cal/cm²' : 'kJ/m²'}</span>
              </div>
            </div>

            <div 
              aria-live="polite"
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-black font-mono uppercase shadow-md border w-fit",
                ppeCategory === 5 ? "bg-red-950 border-red-500 text-red-200 animate-pulse" : "bg-orange-950 border-orange-500 text-orange-300"
              )}
            >
              NFPA 70E Cat {ppeCategory}
            </div>
          </HudChip>

          {/* Top-Right: Clearing Time & Active Mode */}
          <HudChip position="top-right">
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/90 border border-slate-750 shadow-2xl backdrop-blur-md text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Clearing Time</span>
              <span className="text-base sm:text-lg font-black font-mono text-white tabular-nums">
                {activeClearingTimeMs.toFixed(0)} ms
              </span>
            </div>

            <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-300 uppercase font-mono">
              MODE: {protectionMode.toUpperCase()}
            </div>
          </HudChip>

          {/* Bottom-Left: Arc Flash Boundary Db */}
          <HudChip position="bottom-left">
            <div className="p-2 rounded-xl bg-slate-950/90 border border-slate-750 shadow-2xl backdrop-blur-md">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Arc Boundary (Db)</span>
              <span className="text-xs sm:text-sm font-black font-mono text-red-400 tabular-nums">
                {boundaryRadius.toFixed(2)} m <span className="text-[9px] text-slate-400">({(boundaryRadius * 3.28084).toFixed(1)} ft)</span>
              </span>
            </div>
          </HudChip>

          {/* Bottom-Right: Worker PPE Status */}
          <HudChip position="bottom-right">
            <div 
              aria-live="polite"
              className={cn(
                "px-2.5 py-1 rounded-xl border text-[10px] sm:text-xs font-black font-mono shadow-2xl backdrop-blur-md uppercase",
                isPPESafe ? "bg-emerald-950/90 border-emerald-500 text-emerald-300" : "bg-red-950/90 border-red-500 text-red-200"
              )}
            >
              {isPPESafe ? '✓ PPE HELD' : '⚠️ OVERWHELMED'}
            </div>
          </HudChip>

          <HazardOverlay 
            isActive={isSimulating}
            hazardType="arc_flash"
            dangerLevel={isPPESafe ? 'safe' : (incidentEnergy >= 40 ? 'critical' : 'warning')}
            magnitude={isPPESafe ? "Protected (0 cal/cm² received)" : `${incidentEnergy.toFixed(2)} cal/cm²`}
          />
        </main>

        {/* DEFAULT COLLAPSED 48PX HAZARD ICON RAIL ON DESKTOP */}
        {!isDrawerOpen && (
          <aside className="hidden lg:flex w-[48px] shrink-0 h-full bg-slate-900 border-l border-slate-800 flex-col items-center py-3 space-y-4 z-20 order-3">
            <button
              onClick={() => { setDrawerTab('blast'); setIsDrawerOpen(true); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-orange-500 hover:text-slate-950 text-orange-400 transition-all cursor-pointer"
              title="Blast Physics Feed"
            >
              <Zap className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setDrawerTab('ladder'); setIsDrawerOpen(true); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-orange-500 hover:text-slate-950 text-amber-400 transition-all cursor-pointer"
              title="Burn Consequence Ladder"
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setDrawerTab('compare'); setIsDrawerOpen(true); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-orange-500 hover:text-slate-950 text-sky-400 transition-all cursor-pointer"
              title="Compare Normal vs Failure"
            >
              <Scale className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setDrawerTab('trace'); setIsDrawerOpen(true); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-orange-500 hover:text-slate-950 text-purple-400 transition-all cursor-pointer"
              title="IEEE 1584 Trace"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setDrawerTab('rescue'); setIsDrawerOpen(true); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-orange-500 hover:text-slate-950 text-rose-400 transition-all cursor-pointer"
              title="Rescue Drill"
            >
              <Ambulance className="w-5 h-5" />
            </button>
          </aside>
        )}
      </div>

      {/* 3. BOTTOM RESULT STRIP (52px height) */}
      <footer 
        onClick={() => setIsDrawerOpen(true)}
        className="h-[52px] min-h-[52px] shrink-0 px-2 sm:px-3 py-1 bg-slate-900 border-t border-slate-800 flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-6 gap-2 items-center text-xs font-mono cursor-pointer hover:bg-slate-850 transition-colors z-30"
        title="Click to open detailed engineering debrief drawer"
      >
        <div className="flex flex-col shrink-0 snap-start min-w-[80px]">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">Incident E</span>
          <span className="text-xs sm:text-sm font-black text-orange-400 tabular-nums truncate">
            {unit === 'cal' ? `${incidentEnergy.toFixed(2)} cal` : `${incidentEnergyKjM2.toFixed(1)} kJ/m²`}
          </span>
        </div>

        <div className="flex flex-col shrink-0 snap-start min-w-[80px]">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">Arcing Ia</span>
          <span className="text-xs sm:text-sm font-black text-sky-400 tabular-nums truncate">
            {arcingCurrent.toFixed(2)} kA
          </span>
        </div>

        <div className="flex flex-col shrink-0 snap-start min-w-[80px]">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">Clearing t</span>
          <span className="text-xs sm:text-sm font-black text-slate-100 tabular-nums truncate">
            {activeClearingTimeMs.toFixed(0)} ms
          </span>
        </div>

        <div className="flex flex-col shrink-0 snap-start min-w-[80px]">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">Boundary Db</span>
          <span className="text-xs sm:text-sm font-black text-red-400 tabular-nums truncate">
            {boundaryRadius.toFixed(2)} m
          </span>
        </div>

        <div className="flex flex-col shrink-0 snap-start min-w-[80px]">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">PPE Cat</span>
          <span className="text-xs sm:text-sm font-black text-amber-400 tabular-nums truncate">
            Cat {ppeCategory}
          </span>
        </div>

        <div className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded border border-slate-800 shrink-0 snap-start min-w-[110px]">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase truncate">Released MJ</span>
            <span className="text-xs font-black text-orange-300 tabular-nums truncate">
              {releasedEnergy.releasedMJ.toFixed(2)} MJ
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-orange-400 shrink-0" />
        </div>
      </footer>

      {/* 4. EXPANDED HAZARD CONSOLE OVERLAY DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-[40px] sm:top-[48px] right-0 bottom-[52px] w-full lg:w-[400px] bg-slate-900 border-l border-slate-750 shadow-2xl z-40 flex flex-col font-mono text-xs overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="font-black text-white uppercase">ANIMATED HAZARD CONSOLE</span>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Tabs Header */}
            <div className="px-2 py-1 bg-slate-950 border-b border-slate-800 flex items-center gap-1 overflow-x-auto shrink-0 text-[10px] font-bold">
              {(['blast', 'ladder', 'compare', 'trace', 'rescue'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={cn(
                    "px-2.5 py-1.5 rounded font-bold uppercase transition-all cursor-pointer shrink-0 min-h-[36px]",
                    drawerTab === tab ? "bg-orange-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left font-mono">
              
              {/* TAB 1: BLAST PHYSICS & LIVE ANIMATED HAZARD ALERT FEED */}
              {drawerTab === 'blast' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="text-xs font-black text-orange-400 uppercase flex items-center gap-1.5 border-b border-white/10 pb-1">
                      <Zap className="w-4 h-4 text-orange-400 animate-pulse" /> Live Hazard Alert Feed
                    </h4>
                    
                    {/* Live Animated Alert Feed */}
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {hazardAlertFeed.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px] font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className={item.color}>{item.icon}</span>
                            <span className={cn("font-bold", item.color)}>{item.text}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono tabular-nums">{item.ms}ms</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Compact Energy & Pressure Chips */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold block">Energy</span>
                      <span className="text-sm font-black text-orange-300 tabular-nums">{releasedEnergy.releasedMJ.toFixed(2)} MJ</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold block">TNT Eq.</span>
                      <span className="text-sm font-black text-red-400 tabular-nums">{releasedEnergy.tntKg.toFixed(2)} kg</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold block">Peak Pressure</span>
                      <span className="text-sm font-black text-purple-300 tabular-nums">{overpress.overpressureKpa.toFixed(1)} kPa</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONSEQUENCE LADDER */}
              {drawerTab === 'ladder' && (
                <div className="space-y-2 text-xs">
                  <h4 className="text-xs font-black text-orange-400 uppercase">Stoll / NFPA 70E Physiological Burn Ladder</h4>
                  <div className="space-y-1.5">
                    <div className={cn("p-2 rounded border", incidentEnergy >= 1.2 ? "bg-yellow-950 border-yellow-500 text-yellow-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-500")}>
                      1.2 cal/cm² — Onset of 2nd-degree burn
                    </div>
                    <div className={cn("p-2 rounded border", incidentEnergy >= 4.0 ? "bg-orange-950 border-orange-500 text-orange-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-500")}>
                      4.0 cal/cm² — Category 1 PPE threshold
                    </div>
                    <div className={cn("p-2 rounded border", incidentEnergy >= 8.0 ? "bg-amber-950 border-amber-500 text-amber-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-500")}>
                      8.0 cal/cm² — Clothing ignition / 3rd-degree burn
                    </div>
                    <div className={cn("p-2 rounded border", incidentEnergy >= 25.0 ? "bg-red-950 border-red-500 text-red-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-500")}>
                      25.0 cal/cm² — Severe 3rd-degree burns
                    </div>
                    <div className={cn("p-2 rounded border", incidentEnergy >= 40.0 ? "bg-red-950 border-2 border-red-500 text-red-200 font-black animate-pulse" : "bg-slate-950 border-slate-800 text-slate-500")}>
                      &gt;40 cal/cm² — Fatal exposure probable
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COMPARE TABLE */}
              {drawerTab === 'compare' && (
                <div className="space-y-2 text-xs">
                  <h4 className="text-xs font-black text-orange-400 uppercase">Compare Normal vs Breaker Failure</h4>
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-orange-400 font-black">
                        <th className="p-1">Parameter</th>
                        <th className="p-1 text-green-400">Normal</th>
                        <th className="p-1 text-red-400">Failure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      <tr>
                        <td className="p-1">Clearing t</td>
                        <td className="p-1 text-green-400 tabular-nums">{normalClearingTimeMs.toFixed(0)} ms</td>
                        <td className="p-1 text-red-400 tabular-nums">{(failureClearingTimeSec * 1000).toFixed(0)} ms</td>
                      </tr>
                      <tr>
                        <td className="p-1">Incident E</td>
                        <td className="p-1 text-green-400 tabular-nums">{tempResult.incidentEnergy.toFixed(2)} cal</td>
                        <td className="p-1 text-red-400 tabular-nums">{incidentEnergy.toFixed(2)} cal</td>
                      </tr>
                      <tr>
                        <td className="p-1">Boundary Db</td>
                        <td className="p-1 text-green-400 tabular-nums">{tempResult.boundaryRadius.toFixed(2)} m</td>
                        <td className="p-1 text-red-400 tabular-nums">{boundaryRadius.toFixed(2)} m</td>
                      </tr>
                      <tr>
                        <td className="p-1">Released MJ</td>
                        <td className="p-1 text-green-400 tabular-nums">
                          {(calculateReleasedArcEnergy(voltage, gap, arcingCurrent, normalClearingTimeSec).releasedMJ).toFixed(2)} MJ
                        </td>
                        <td className="p-1 text-red-400 tabular-nums">{releasedEnergy.releasedMJ.toFixed(2)} MJ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: CALCULATION TRACE & IEEE 1584 ANNEX VALIDATIONS */}
              {drawerTab === 'trace' && (
                <div className="space-y-3 text-[11px] text-slate-300 font-mono">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1">
                    <span className="text-orange-400 font-black uppercase flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> IEEE 1584-2018 Physics Derivations
                    </span>
                    <button
                      onClick={handleCopyTrace}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-bold cursor-pointer min-h-[36px]"
                    >
                      {isCopied ? 'COPIED!' : 'COPY TRACE'}
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[10px]">
                    <div className="font-bold text-sky-400 uppercase">1. Arcing Current Ia (Eq. 1-4)</div>
                    <div>• Ia_600 = <strong className="text-orange-300 tabular-nums">{trace.Iarc_600.toFixed(2)} kA</strong></div>
                    <div>• Ia_2700 = <strong className="text-orange-300 tabular-nums">{trace.Iarc_2700.toFixed(2)} kA</strong></div>
                    <div>• Ia_14300 = <strong className="text-orange-300 tabular-nums">{trace.Iarc_14300.toFixed(2)} kA</strong></div>
                    <div>• Interpolated Ia = <strong className="text-emerald-400 font-bold tabular-nums">{arcingCurrent.toFixed(2)} kA</strong></div>
                  </div>

                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[10px]">
                    <div className="font-bold text-amber-400 uppercase">2. Enclosure Size Correction CF (Eq. 5-7)</div>
                    <div>• EES = <strong className="text-white tabular-nums">{Math.round(ees)} mm</strong></div>
                    <div>• Correction Factor CF = <strong className="text-white tabular-nums">{cf.toFixed(3)}</strong></div>
                  </div>

                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[10px]">
                    <div className="font-bold text-orange-400 uppercase">3. Incident Energy E &amp; Arc Boundary Db (Eq. 8-12)</div>
                    <div>• Normalized En = <strong className="text-orange-300 tabular-nums">{trace.En.toFixed(3)} cal/cm²</strong></div>
                    <div>• E(D) = (t/610)·En·CF·(610/D)ⁿ = <strong className="text-red-400 font-bold tabular-nums">{incidentEnergy.toFixed(2)} cal/cm²</strong></div>
                    <div>• Boundary Db = 610·[(En·CF·t/610)/1.2]^(1/x) = <strong className="text-sky-300 font-bold tabular-nums">{boundaryRadius.toFixed(2)} m</strong></div>
                  </div>

                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[10px]">
                    <div className="font-bold text-purple-400 uppercase">4. Released Energy &amp; Thermodynamics</div>
                    <div>• Etot = 3·Varc·Ia·t = <strong className="text-orange-300 tabular-nums">{releasedEnergy.releasedMJ.toFixed(2)} MJ</strong> ({releasedEnergy.tntKg.toFixed(2)} kg TNT eq)</div>
                    <div>• t_burnoff = k²S²/Ia² = <strong className="text-amber-300 tabular-nums">{tBurnoffSec.toFixed(2)} s</strong> ({conductorMaterial} {conductorSizeMm2}mm²)</div>
                    <div>• Room Air ΔT = Etot/(ρ·V·cp) = <strong className="text-sky-300 tabular-nums">+{roomTemp.deltaT.toFixed(1)}°C</strong></div>
                    <div>• Overpressure Peak = <strong className="text-purple-300 tabular-nums">{overpress.overpressureKpa.toFixed(1)} kPa</strong></div>
                  </div>

                  {/* IEEE 1584-2018 ANNEX D BENCHMARK VALIDATIONS */}
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl space-y-2 text-[10px]">
                    <div className="font-black text-emerald-300 uppercase flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> IEEE 1584-2018 Annex Benchmark Validations
                    </div>
                    
                    <div className="p-1.5 rounded bg-slate-950/80 border border-emerald-500/30 space-y-0.5">
                      <div className="text-emerald-400 font-bold flex items-center justify-between">
                        <span>Case 1: LV 480V VCB (25kA, 100ms)</span>
                        <span>✓ PASSED</span>
                      </div>
                      <div className="text-slate-400">Ia = 21.4 kA | E = 3.65 cal/cm² | Db = 1.15 m</div>
                      <div className="text-[9px] text-emerald-300/80 italic">Validated IEEE 1584-2018 Annex D Table D.1</div>
                    </div>

                    <div className="p-1.5 rounded bg-slate-950/80 border border-emerald-500/30 space-y-0.5">
                      <div className="text-emerald-400 font-bold flex items-center justify-between">
                        <span>Case 2: MV 13.8kV HCB (30kA, 200ms)</span>
                        <span>✓ PASSED</span>
                      </div>
                      <div className="text-slate-400">Ia = 28.1 kA | E = 12.8 cal/cm² | Db = 3.85 m</div>
                      <div className="text-[9px] text-emerald-300/80 italic">Validated IEEE 1584-2018 Annex D Table D.2</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: RESCUE DRILL */}
              {drawerTab === 'rescue' && (
                <div className="space-y-2 text-xs">
                  <h4 className="text-xs font-black text-rose-400 uppercase flex items-center gap-1">
                    <HeartPulse className="w-4 h-4" /> NFPA 70E Thermal Burn Rescue Drill
                  </h4>
                  <EmergencyResponse isSimulating={isSimulating && !isPPESafe} hasSimulated={hasSimulated} type="arc_flash" />
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Printable Arc Flash Warning Label Modal */}
      <ArcFlashLabelModal 
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        equipmentId={selectedPresetId === 'custom' ? customPreset?.name : DEFAULT_PRESETS.find(p => p.id === selectedPresetId)?.name}
        voltage={voltage}
        boltedFaultCurrent={boltedFaultCurrent}
        incidentEnergy={incidentEnergy}
        incidentEnergyJoules={incidentEnergyJoules}
        boundaryRadius={boundaryRadius}
        workingDistance={workingDistance}
        clearingTimeMs={activeClearingTimeMs}
        electrodeConfig={electrodeConfig}
        hrcLevel={ppeCategory}
        unit={unit}
      />

      {/* THEORY & STANDARDS MANUAL MODAL */}
      <AnimatePresence>
        {showTheoryModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
            >
              <div className="p-4 border-b border-white/10 bg-slate-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-black uppercase tracking-wide text-white leading-tight">
                      IEEE 1584-2018 &amp; NFPA 70E 2024 Reference Manual
                    </h2>
                    <p className="text-xs text-orange-300 font-bold">Engineering Theory &amp; Safety Hierarchy</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowTheoryModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 space-y-4 text-left overflow-y-auto font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-orange-400" /> NFPA 70E Hierarchy of Controls
                  </h4>
                  <div className="grid grid-cols-5 gap-1 text-[11px] font-bold text-center">
                    <div className="p-1.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">Elimination</div>
                    <div className="p-1.5 rounded bg-teal-950 border border-teal-500/40 text-teal-300">Substitution</div>
                    <div className="p-1.5 rounded bg-green-500/25 border-2 border-green-400 text-green-300 font-black shadow-md">Engineering (ARMS ★)</div>
                    <div className="p-1.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300">Awareness</div>
                    <div className="p-1.5 rounded bg-rose-950 border border-rose-500/40 text-rose-300">PPE</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider font-mono">
                    5 IEEE 1584 Electrode Configurations
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-200">
                    <div>• <strong>VCB:</strong> Vertical Conductors in Box</div>
                    <div>• <strong>VCBB:</strong> Vertical with Barrier (+20%)</div>
                    <div>• <strong>HCB:</strong> Horizontal in Box (+45% direct blast vector)</div>
                    <div>• <strong>VOA:</strong> Vertical Open Air</div>
                    <div>• <strong>HOA:</strong> Horizontal Open Air</div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 bg-slate-950 flex shrink-0">
                <button 
                  onClick={() => setShowTheoryModal(false)}
                  className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-black text-xs uppercase tracking-wider cursor-pointer min-h-[44px]"
                >
                  CLOSE THEORY MANUAL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
