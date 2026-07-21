import React, { useState, useEffect } from 'react';
import { MobileActionButton } from '../MobileActionButton';
import { ShieldAlert, Zap, AlertTriangle, Flame, BookOpen, Info, CheckCircle2, ShieldCheck, ArrowRight, Sliders, Box, HelpCircle, ToggleLeft, ToggleRight, Save, Printer, ArrowDown, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { EmergencyResponse } from '../EmergencyResponse';
import { PPEValidator } from '../PPEValidator';
import { useAudioHaptics } from '../useAudioHaptics';
import { HazardOverlay } from '../HazardOverlay';
import { calculateIEEE1584_2018, ElectrodeConfig, GroundingSystem } from '../../utils/ieee1584-2018';
import { ChartsPanel } from '../ChartsPanel';
import { ToScaleView } from '../ToScaleView';
import { ArcFlashLabelModal } from '../ArcFlashLabelModal';

// Equipment Preset Interface
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

export function ArcFlashSimulator({ config }: { config?: UserConfig }) {
  const [showInfoScreen, setShowInfoScreen] = useState<boolean>(true); // Welcome Landing Modal
  const [showTheoryModal, setShowTheoryModal] = useState<boolean>(false); // Separate Theory & Standards Guide Modal
  const [showCalculationTrace, setShowCalculationTrace] = useState<boolean>(false);
  const [showLabelModal, setShowLabelModal] = useState<boolean>(false);
  
  // Phase 3 Features: Comparison, Maintenance Switch, Unit Toggle
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [isMaintenanceSwitchOn, setIsMaintenanceSwitchOn] = useState<boolean>(false);
  const [unit, setUnit] = useState<'cal' | 'joules'>('cal');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('mv-switchgear-11kv');
  const [customPreset, setCustomPreset] = useState<EquipmentPreset | null>(null);

  // IEEE 61850 & Electrical Inputs
  const [voltage, setVoltage] = useState<number>(10990);
  const [opticalTime, setOpticalTime] = useState<number>(10.0);
  const [gooseLatency, setGooseLatency] = useState<number>(15.0);
  const [breakerTime, setBreakerTime] = useState<number>(120);
  const [boltedFaultCurrent, setBoltedFaultCurrent] = useState<number>(30);
  
  // IEEE 1584-2018 Full Parameters
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

  // Load custom preset from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('electrovision_custom_preset');
      if (saved) {
        setCustomPreset(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Handle Preset Selection
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

  // Save Custom Preset to localStorage
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

  // =========================================================================
  // IEEE 1584-2018 Real Standard Calculation Execution
  // =========================================================================
  const effectiveBreakerTime = isMaintenanceSwitchOn ? 40 : breakerTime;
  const clearingTimeMs = opticalTime + gooseLatency + effectiveBreakerTime;
  const clearingTimeSec = clearingTimeMs / 1000;
  const voltagekV = voltage / 1000;

  const ieeeResult = calculateIEEE1584_2018({
    voltage,
    boltedFaultCurrent,
    gap,
    workingDistance,
    clearingTimeMs,
    electrodeConfig,
    enclosureWidth,
    enclosureHeight,
    enclosureDepth,
    grounding
  });

  const conventionalResult = calculateIEEE1584_2018({
    voltage,
    boltedFaultCurrent,
    gap,
    workingDistance,
    clearingTimeMs: 400,
    electrodeConfig,
    enclosureWidth,
    enclosureHeight,
    enclosureDepth,
    grounding
  });

  const { arcingCurrent, incidentEnergy, boundaryRadius, cf, isValid, validationMessages, trace } = ieeeResult;
  const incidentEnergyJoules = incidentEnergy * 4.184;

  const isDangerous = incidentEnergy > 1.2;

  // Dynamic Energy Color coding
  let energyColorClass = "text-green-400";
  if (incidentEnergy >= 25) {
    energyColorClass = "text-red-400 animate-pulse";
  } else if (incidentEnergy >= 8) {
    energyColorClass = "text-orange-400";
  } else if (incidentEnergy >= 4) {
    energyColorClass = "text-yellow-400";
  }

  // NFPA 70E HRC / PPE Category Levels
  let hrcLevel = 0;
  let hrcRecommendation = 'Category 0: Non-melting clothing required (< 1.2 cal/cm²)';
  if (incidentEnergy >= 40) {
    hrcLevel = 5;
    hrcRecommendation = 'DANGER: EXTREME ARC ENERGY (>40 cal/cm²). LIVE WORK STRICTLY PROHIBITED!';
  } else if (incidentEnergy >= 25) {
    hrcLevel = 4;
    hrcRecommendation = 'Category 4: Requires minimum 40 cal/cm² Arc Flash Hood & Suit';
  } else if (incidentEnergy >= 8) {
    hrcLevel = 3;
    hrcRecommendation = 'Category 3: Requires minimum 25 cal/cm² Arc Flash Suit & Hood';
  } else if (incidentEnergy >= 4) {
    hrcLevel = 2;
    hrcRecommendation = 'Category 2: Requires minimum 8 cal/cm² AR shirt/pants + Face shield';
  } else if (incidentEnergy >= 1.2) {
    hrcLevel = 1;
    hrcRecommendation = 'Category 1: Requires minimum 4 cal/cm² arc-rated clothing';
  }

  const handleInitiate = () => {
    setIsSimulating(true);
    setHasSimulated(true);
    playArcBlast();
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-slate-950">
      
      {/* Header Bar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-slate-900/95 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-white leading-tight">Arc Flash Simulator</h2>
            <p className="text-[10px] md:text-xs text-slate-300 font-mono">IEEE 1584-2018 · NFPA 70E Standard</p>
          </div>
        </div>

        {/* Action Controls & Unit Toggle */}
        <div className="flex items-center gap-2">
          
          {/* Unit Toggle Button */}
          <button
            onClick={() => setUnit(prev => prev === 'cal' ? 'joules' : 'cal')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold font-mono text-orange-300 transition-all cursor-pointer shadow-sm"
            title="Toggle Energy Units (1 cal/cm² = 4.184 J/cm²)"
          >
            <span>UNIT: {unit === 'cal' ? 'cal/cm²' : 'J/cm²'}</span>
          </button>

          {/* Printable Label Generator Button */}
          <button 
            onClick={() => setShowLabelModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/25 hover:bg-sky-500/35 border border-sky-500/50 text-sky-300 text-xs font-bold uppercase tracking-wide transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Arc Flash Label</span>
          </button>

          {/* Standards & Theory Info Button */}
          <button 
            onClick={() => setShowTheoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/25 hover:bg-orange-500/35 border border-orange-500/50 text-orange-300 text-xs font-bold uppercase tracking-wide transition-all cursor-pointer shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Theory &amp; Standards</span>
            <span className="sm:hidden">Theory</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden relative p-2 md:p-3">
        <motion.div 
          className="flex flex-col lg:flex-row h-full gap-3 pb-24 lg:pb-0"
          animate={{ x: isSimulating ? [-5, 5, -8, 8, -3, 3, 0] : 0, y: isSimulating ? [-2, 2, -4, 4, -1, 1, 0] : 0 }}
          transition={{ duration: 0.4, ease: "linear" }}
        >
          {/* Controls & Diagnostics Column */}
          <div className="flex flex-col flex-1 gap-3 shrink-0 overflow-y-auto pr-1">
            
            {/* Range Validation Warning Banner */}
            {!isValid && (
              <div className="p-3 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-bold flex items-start gap-2.5 shadow-lg shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black uppercase tracking-wider text-red-400 text-sm">Outside IEEE 1584-2018 Valid Range</div>
                  <div className="text-xs font-mono text-red-300 font-normal mt-0.5">{validationMessages.join(' · ')}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
              
              {/* Inputs Panel (IEEE 1584 + System Parameters) */}
              <div className="p-3.5 md:p-4 rounded-xl bg-slate-900 border border-slate-750 shadow-lg flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  
                  {/* PRESET LIBRARY & MAINTENANCE SWITCH */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-white uppercase">
                      <span className="text-orange-400 font-black">Equipment Preset Library</span>
                      <button
                        onClick={handleSaveCustomPreset}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 font-mono font-bold transition-all cursor-pointer"
                      >
                        <Save className="w-3 h-3 text-orange-400" />
                        <span>Save Custom</span>
                      </button>
                    </div>
                    
                    <select
                      value={selectedPresetId}
                      onChange={(e) => handleSelectPreset(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-orange-300 focus:border-orange-500 focus:outline-none cursor-pointer"
                    >
                      {DEFAULT_PRESETS.map(preset => (
                        <option key={preset.id} value={preset.id}>{preset.name}</option>
                      ))}
                      {customPreset && (
                        <option value="custom">⭐ {customPreset.name}</option>
                      )}
                    </select>

                    {/* MAINTENANCE SWITCH (ARMS) */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                          <span>Maintenance Switch (ARMS)</span>
                          {isMaintenanceSwitchOn && (
                            <span className="px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[9px] font-mono font-bold">
                              40ms Fast Trip
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">Forces mechanical breaker trip to 40ms during live work</div>
                      </div>

                      <button
                        onClick={() => setIsMaintenanceSwitchOn(prev => !prev)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 border",
                          isMaintenanceSwitchOn ? "bg-green-500 border-green-400" : "bg-slate-800 border-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform shadow-md",
                          isMaintenanceSwitchOn ? "translate-x-6" : "translate-x-0"
                        )} />
                      </button>
                    </div>
                  </div>

                  {/* SECTION 1: IEEE 1584 PARAMETERS */}
                  <div className="border-b border-white/10 pb-3">
                    <h3 className="mb-2 text-xs md:text-sm font-black tracking-wider uppercase text-orange-400 border-l-3 border-orange-500 pl-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Sliders className="w-4 h-4" /> IEEE 1584 PARAMETERS</span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">2018 Standard</span>
                    </h3>

                    <div className="space-y-2.5">
                      {/* Electrode Configuration Dropdown */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-white uppercase mb-1">
                          <span>Electrode Configuration</span>
                          <span className="text-orange-300 font-mono font-black">{electrodeConfig}</span>
                        </div>
                        <select
                          value={electrodeConfig}
                          onChange={(e) => setElectrodeConfig(e.target.value as ElectrodeConfig)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-100 focus:border-orange-500 focus:outline-none cursor-pointer"
                        >
                          <option value="VCB">VCB - Vertical Conductors in Box</option>
                          <option value="VCBB">VCBB - Vertical with Barrier in Box (Higher Energy)</option>
                          <option value="HCB">HCB - Horizontal in Box (Highest Energy)</option>
                          <option value="VOA">VOA - Vertical in Open Air</option>
                          <option value="HOA">HOA - Horizontal in Open Air</option>
                        </select>
                      </div>

                      {/* Bolted Fault Current Slider */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-white uppercase mb-1">
                          <span>Bolted Fault Current (Ibf)</span>
                          <span className="text-orange-300 font-black">{boltedFaultCurrent} kA</span>
                        </div>
                        <input
                          type="range"
                          min="0.5" max="106" step="0.5"
                          value={boltedFaultCurrent}
                          onChange={(e) => setBoltedFaultCurrent(Number(e.target.value))}
                          className="w-full h-2 accent-orange-500 cursor-pointer rounded-lg bg-slate-800"
                        />
                      </div>

                      {/* Slider Gap G */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-white uppercase mb-1">
                          <span>Electrode Gap (G)</span>
                          <span className="text-orange-300 font-black">{gap} mm</span>
                        </div>
                        <input
                          type="range"
                          min="6" max="250" step="1"
                          value={gap}
                          onChange={(e) => setGap(Number(e.target.value))}
                          className="w-full h-2 accent-orange-500 cursor-pointer rounded-lg bg-slate-800"
                        />
                      </div>

                      {/* Slider Working Distance D & Presets */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-white uppercase mb-1">
                          <span>Working Distance (D)</span>
                          <span className="text-orange-300 font-black">{workingDistance} mm</span>
                        </div>
                        <input
                          type="range"
                          min="300" max="1800" step="5"
                          value={workingDistance}
                          onChange={(e) => setWorkingDistance(Number(e.target.value))}
                          className="w-full h-2 accent-orange-500 cursor-pointer rounded-lg bg-slate-800"
                        />
                      </div>

                      {/* Enclosure Dimensions W / H / D */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-white uppercase mb-1">
                          <span>Enclosure Size (W × H × D)</span>
                          <span className="px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-mono font-bold">
                            CF: {cf.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <label className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Width (mm)</label>
                            <input
                              type="number"
                              min="200" max="2000" step="10"
                              value={enclosureWidth}
                              onChange={(e) => setEnclosureWidth(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs font-bold text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Height (mm)</label>
                            <input
                              type="number"
                              min="200" max="2000" step="10"
                              value={enclosureHeight}
                              onChange={(e) => setEnclosureHeight(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs font-bold text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Depth (mm)</label>
                            <input
                              type="number"
                              min="200" max="2000" step="10"
                              value={enclosureDepth}
                              onChange={(e) => setEnclosureDepth(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs font-bold text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* SECTION 2: SYSTEM PARAMETERS (IEEE 61850) */}
                  <div>
                    <h3 className="mb-2 text-xs md:text-sm font-black tracking-wider uppercase text-orange-400 border-l-3 border-orange-500 pl-2">
                      SYSTEM PARAMETERS (IEEE 61850)
                    </h3>
                    
                    <div className="space-y-2.5">
                      {/* Voltage Slider */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-white uppercase mb-1">
                          <span>System Voltage</span>
                          <span className="text-orange-300 font-black text-sm">{voltage} V ({voltagekV.toFixed(3)} kV)</span>
                        </div>
                        <input
                          type="range"
                          min="208" max="15000" step="25"
                          value={voltage}
                          onChange={(e) => setVoltage(Number(e.target.value))}
                          className="w-full h-2 accent-orange-500 cursor-pointer rounded-lg bg-slate-800"
                        />
                      </div>

                      {/* Optical Detection Slider with Tooltip */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-white uppercase mb-0.5">
                          <span className="flex items-center gap-1 cursor-help" title="IEC 61850 GAPC logical node: Photodiode light detection within 1-10ms">
                            Optical Arc Sensor (GAPC1) <HelpCircle className="w-3 h-3 text-orange-400 inline" />
                          </span>
                          <span className="text-orange-300 font-black">{opticalTime.toFixed(1)} ms</span>
                        </div>
                        <input
                          type="range"
                          min="1.0" max="25.0" step="0.5"
                          value={opticalTime}
                          onChange={(e) => setOpticalTime(Number(e.target.value))}
                          className="w-full h-2 accent-orange-500 cursor-pointer rounded-lg bg-slate-800"
                        />
                      </div>

                      {/* GOOSE Network Latency with Tooltip */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-white uppercase mb-0.5">
                          <span className="flex items-center gap-1 cursor-help" title="IEC 61850 GOOSE Type 1A: High-speed publisher on substation Ethernet (1-15ms latency)">
                            GOOSE Trip Latency <HelpCircle className="w-3 h-3 text-orange-400 inline" />
                          </span>
                          <span className="text-orange-300 font-black">{gooseLatency.toFixed(1)} ms</span>
                        </div>
                        <input
                          type="range"
                          min="1.0" max="30.0" step="0.5"
                          value={gooseLatency}
                          onChange={(e) => setGooseLatency(Number(e.target.value))}
                          className="w-full h-2 accent-orange-500 cursor-pointer rounded-lg bg-slate-800"
                        />
                      </div>

                      {/* Breaker Opening Time with Tooltip */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-white uppercase mb-0.5">
                          <span className="flex items-center gap-1 cursor-help" title="IEC 61850 XCBR: Mechanical breaker contact separation and arc quenching time">
                            Breaker Trip Time (XCBR) <HelpCircle className="w-3 h-3 text-orange-400 inline" />
                          </span>
                          <span className="text-orange-300 font-black">
                            {effectiveBreakerTime} ms {isMaintenanceSwitchOn && '(ARMS Active)'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20" max="200" step="5"
                          disabled={isMaintenanceSwitchOn}
                          value={effectiveBreakerTime}
                          onChange={(e) => setBreakerTime(Number(e.target.value))}
                          className={cn("w-full h-2 accent-orange-500 cursor-pointer rounded-lg bg-slate-800", isMaintenanceSwitchOn && "opacity-50 cursor-not-allowed")}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Desktop initiate button */}
                <div className="hidden lg:block w-full mt-4">
                  <button 
                    onPointerDown={() => handleInitiate()}
                    onPointerUp={() => setIsSimulating(false)}
                    onPointerLeave={() => setIsSimulating(false)}
                    onPointerCancel={() => setIsSimulating(false)}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ touchAction: 'none' }}
                    className="w-full py-3.5 font-black text-sm uppercase tracking-wider text-slate-950 transition-all rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 flex items-center justify-center gap-2 select-none shadow-lg cursor-pointer"
                  >
                    <Flame className="w-5 h-5 fill-current" />
                    HOLD TO INITIATE ARC
                  </button>
                </div>
              </div>
              
              {/* Results & Diagnostics Panel */}
              <div className="p-3.5 md:p-4 rounded-xl bg-slate-900 border border-slate-750 shadow-lg flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs md:text-sm font-black tracking-wider uppercase text-orange-400 border-l-3 border-orange-500 pl-2">
                      IEEE 1584 Incident Energy Results
                    </h3>

                    {/* Comparison Toggle Button */}
                    <button
                      onClick={() => setShowComparison(prev => !prev)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all border cursor-pointer flex items-center gap-1",
                        showComparison ? "bg-orange-500 border-orange-400 text-slate-950" : "bg-slate-800 border-slate-700 text-orange-300 hover:bg-slate-750"
                      )}
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{showComparison ? 'Hide Comparison' : 'Compare 400ms vs Fast'}</span>
                    </button>
                  </div>

                  {/* COMPARISON VIEW IF TOGGLED ON */}
                  {showComparison ? (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Conventional 400ms Relay */}
                      <div className="p-2.5 border border-red-500/50 bg-red-950/40 rounded-xl">
                        <span className="text-[10px] font-black uppercase text-red-300 block mb-1">Conventional 400ms Relay</span>
                        <div className="text-xl md:text-2xl font-black font-mono text-red-400">
                          {unit === 'cal' ? `${conventionalResult.incidentEnergy.toFixed(1)} cal` : `${(conventionalResult.incidentEnergy * 4.184).toFixed(0)} J`}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-1">Clearing Time: 400ms</div>
                      </div>

                      {/* Fast GAPC+GOOSE Trip */}
                      <div className="p-2.5 border border-green-500/50 bg-green-950/40 rounded-xl">
                        <span className="text-[10px] font-black uppercase text-green-300 block mb-1">Fast GAPC+GOOSE ({clearingTimeMs}ms)</span>
                        <div className="text-xl md:text-2xl font-black font-mono text-green-400">
                          {unit === 'cal' ? `${incidentEnergy.toFixed(1)} cal` : `${incidentEnergyJoules.toFixed(0)} J`}
                        </div>
                        <div className="text-[9px] text-green-300 font-mono font-bold mt-1 flex items-center gap-0.5">
                          <ArrowDown className="w-3 h-3" />
                          <span>
                            {Math.round(((conventionalResult.incidentEnergy - incidentEnergy) / conventionalResult.incidentEnergy) * 100)}% Energy Reduction
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Main Incident Energy Card */
                    <div className="p-3 border border-slate-700 rounded-xl bg-slate-950 shadow-inner relative overflow-hidden">
                      <div className="text-xs font-bold tracking-wider text-slate-300 uppercase mb-1 flex justify-between items-center">
                        <span>Calculated Incident Energy</span>
                        {!isSimulating ? (
                          <span className="text-green-400 text-xs font-mono font-bold px-2 py-0.5 rounded bg-green-500/15 border border-green-500/40">CALCULATED</span>
                        ) : (
                          <span className="text-orange-400 text-xs font-mono font-black animate-pulse px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/50">ARC FLASH ACTIVE</span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2 my-1">
                        <span className={cn("text-3xl md:text-4xl font-black font-mono tracking-tighter", energyColorClass)}>
                          {unit === 'cal' ? incidentEnergy.toFixed(2) : incidentEnergyJoules.toFixed(1)}
                        </span>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                          {unit === 'cal' ? 'cal/cm²' : 'J/cm²'}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-slate-300 flex justify-between border-t border-white/10 pt-1.5 mt-1">
                        <span>Arcing Current (Ia): <strong className="text-white">{arcingCurrent.toFixed(2)} kA</strong></span>
                        <span>Bolted Fault (Ibf): <strong className="text-white">{boltedFaultCurrent} kA</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Maintenance Switch Savings Alert Banner */}
                  {isMaintenanceSwitchOn && (
                    <div className="p-2.5 mt-2 rounded-xl bg-green-950/80 border border-green-500 text-green-300 text-xs font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="w-5 h-5 text-green-400 shrink-0" />
                        <div>
                          <div className="font-black uppercase">ARMS Maintenance Mode Engaged</div>
                          <div className="text-[10px] font-mono text-slate-300 font-normal">Breaker trip forced to 40ms for technician safety</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Clearing Time */}
                  <div className="p-2.5 border border-slate-700 rounded-xl bg-slate-950 shadow-inner flex justify-between items-center mt-2">
                    <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">Total Clearing Time</span>
                    <span className="text-base md:text-lg font-bold font-mono text-white">
                      {clearingTimeMs.toFixed(1)} ms <span className="text-xs text-slate-400 font-normal">({clearingTimeSec.toFixed(3)}s)</span>
                    </span>
                  </div>

                  {/* Arc Boundary */}
                  <div className="p-2.5 border border-slate-700 rounded-xl bg-slate-950 shadow-inner flex justify-between items-center mt-2">
                    <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">IEEE 1584 Arc Boundary</span>
                    <span className="text-base md:text-lg font-bold font-mono text-white">
                      {boundaryRadius.toFixed(2)} meters
                    </span>
                  </div>

                  {/* NFPA 70E Level */}
                  <div className={cn("p-2.5 border rounded-xl shadow-inner text-left mt-2", hrcLevel === 5 ? "bg-red-950/80 border-red-500/60" : "bg-orange-950/50 border-orange-500/50")}>
                    <span className="text-xs font-black tracking-wider text-orange-300 uppercase block mb-0.5">NFPA 70E PPE Category</span>
                    <span className={cn("text-xs md:text-sm font-mono font-bold leading-relaxed block", hrcLevel === 5 ? "text-red-300" : "text-slate-100")}>
                      {hrcRecommendation}
                    </span>
                  </div>

                  {/* Collapsible Calculation Trace Panel Button */}
                  <button 
                    onClick={() => setShowCalculationTrace(prev => !prev)}
                    className="w-full mt-2.5 py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-orange-400" /> Show Calculation Trace (IEEE 1584 Math)</span>
                    {showCalculationTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Collapsible Calculation Trace Card Body */}
                <AnimatePresence>
                  {showCalculationTrace && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-left font-mono text-xs overflow-hidden shrink-0"
                    >
                      <div className="text-orange-400 font-bold uppercase tracking-wider border-b border-white/10 pb-1 text-[11px]">
                        Step-by-Step IEEE 1584-2018 Calculation Trace
                      </div>

                      <div className="space-y-1.5 text-slate-300 text-[10.5px]">
                        <div>
                          <span className="text-slate-400 block font-bold">1. Inputs Summary:</span>
                          <span className="text-white">Voc={voltage}V | Ibf={boltedFaultCurrent}kA | Gap={gap}mm | D={workingDistance}mm | Config={electrodeConfig}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block font-bold">2. Reference Arcing Current Models (Iarc):</span>
                          <div>• Iarc_600 = <span className="text-orange-300 font-bold">{trace.Iarc_600.toFixed(2)} kA</span></div>
                          <div>• Iarc_2700 = <span className="text-orange-300 font-bold">{trace.Iarc_2700.toFixed(2)} kA</span></div>
                          <div>• Iarc_14300 = <span className="text-orange-300 font-bold">{trace.Iarc_14300.toFixed(2)} kA</span></div>
                          <div>• Interpolated Iarc (at Voc) = <span className="text-green-400 font-bold">{arcingCurrent.toFixed(2)} kA</span></div>
                        </div>

                        <div>
                          <span className="text-slate-400 block font-bold">3. Enclosure Correction Factor (CF):</span>
                          <span>CF = 1.0 + (508-W)/2000 + ... = <strong className="text-white">{cf.toFixed(3)}</strong></span>
                        </div>

                        <div>
                          <span className="text-slate-400 block font-bold">4. Normalized Incident Energy (En at 0.2s, 610mm):</span>
                          <span>lg(En) = k1 + k2 + logCoeff * lg(Iarc) + 0.0011 * G</span>
                          <div className="text-orange-300 font-bold">En = {trace.En.toFixed(3)} cal/cm²</div>
                        </div>

                        <div>
                          <span className="text-slate-400 block font-bold">5. Incident Energy at Working Distance D ({workingDistance}mm):</span>
                          <span>E = 4.184 * CF * En * (t/0.2) * (610/D)^{trace.xFactor.toFixed(3)}</span>
                          <div className="text-red-400 font-bold text-sm">E = {incidentEnergy.toFixed(2)} cal/cm²</div>
                        </div>

                        <div>
                          <span className="text-slate-400 block font-bold">6. Arc Flash Boundary (Db at 1.2 cal/cm²):</span>
                          <span>Db = 610 * ((4.184 * CF * En * (t/0.2)) / 1.2)^(1/x)</span>
                          <div className="text-sky-300 font-bold">Db = {boundaryRadius.toFixed(2)} meters</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Charts Panel (Tab A: Energy vs Time, Tab B: Energy vs Distance) */}
            <ChartsPanel 
              voltage={voltage}
              boltedFaultCurrent={boltedFaultCurrent}
              gap={gap}
              workingDistance={workingDistance}
              clearingTimeMs={clearingTimeMs}
              electrodeConfig={electrodeConfig}
              enclosureWidth={enclosureWidth}
              enclosureHeight={enclosureHeight}
              enclosureDepth={enclosureDepth}
              grounding={grounding}
              currentIncidentEnergy={incidentEnergy}
              currentBoundaryRadius={boundaryRadius}
            />

            {/* Interactive Safety Verification Engine */}
            <div className="shrink-0">
              <PPEValidator hazardType="arc_flash" hazardMagnitude={incidentEnergy} onSafetyChange={setIsPPESafe} />
              <div className="mt-2 text-left">
                <EmergencyResponse isSimulating={isSimulating && !isPPESafe} hasSimulated={hasSimulated} type="arc_flash" />
              </div>
            </div>
          </div>
          
          {/* Right Column: To-Scale Boundary View & GOOSE Log */}
          <div className="lg:w-[420px] xl:w-[460px] shrink-0 h-auto lg:h-full min-h-[380px] order-2 lg:order-3 z-10">
            <ToScaleView 
              workingDistanceMeters={Number((workingDistance / 1000).toFixed(2))}
              boundaryRadiusMeters={boundaryRadius}
              isSimulating={isSimulating}
              clearingTimeMs={clearingTimeMs}
              opticalTimeMs={opticalTime}
              gooseLatencyMs={gooseLatency}
              breakerTimeMs={effectiveBreakerTime}
              electrodeConfig={electrodeConfig}
            />
          </div>

          <HazardOverlay 
            isActive={isSimulating}
            hazardType="arc_flash"
            dangerLevel={isPPESafe ? 'safe' : (incidentEnergy >= 40 ? 'critical' : 'warning')}
            magnitude={isPPESafe ? "Protected (0 cal/cm² received)" : `${incidentEnergy.toFixed(2)} cal/cm²`}
          />
        </motion.div>
      </div>

      {/* Mobile Floating Initiate Button */}
      <MobileActionButton>
        <button 
          onPointerDown={() => handleInitiate()}
          onPointerUp={() => setIsSimulating(false)}
          onPointerLeave={() => setIsSimulating(false)}
          onPointerCancel={() => setIsSimulating(false)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: 'none' }}
          className="w-full py-4 font-black text-base uppercase tracking-wider text-slate-950 transition-all rounded-2xl bg-orange-500 hover:bg-orange-400 active:scale-95 flex items-center justify-center gap-2 select-none shadow-[0_10px_30px_rgba(249,115,22,0.5)] cursor-pointer"
        >
          <Flame className="w-5 h-5 fill-current" />
          HOLD TO INITIATE ARC
        </button>
      </MobileActionButton>

      {/* Printable Arc Flash Warning Label Modal */}
      <ArcFlashLabelModal 
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        voltage={voltage}
        boltedFaultCurrent={boltedFaultCurrent}
        incidentEnergy={incidentEnergy}
        incidentEnergyJoules={incidentEnergyJoules}
        boundaryRadius={boundaryRadius}
        workingDistance={workingDistance}
        clearingTimeMs={clearingTimeMs}
        electrodeConfig={electrodeConfig}
        hrcLevel={hrcLevel}
        unit={unit}
      />

      {/* ========================================================================= */}
      {/* 1. FIRST SCREEN WELCOME LANDING MODAL (COMPACT - ZERO SCROLL FIT) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showInfoScreen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 md:p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
            >
              {/* Header */}
              <div className="p-3.5 border-b border-white/10 bg-slate-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wide text-white leading-tight">
                      ElectroLive Arc Flash Simulator
                    </h2>
                    <p className="text-[11px] text-orange-300 font-bold">IEEE 1584-2018 Learning &amp; Safety Tool</p>
                  </div>
                </div>
              </div>

              {/* Compact Body - Fits Screen Immediately */}
              <div className="p-3.5 md:p-4 space-y-2.5 text-left">
                
                {/* What Tool Does */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <Zap className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-0.5">What This Tool Does &amp; Utility</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Simulates explosive arc thermal energy (<strong className="text-white">cal/cm²</strong>), flash boundaries (<strong className="text-white">meters</strong>), and NFPA 70E PPE categories. Demonstrates how <strong className="text-sky-300">IEC 61850 GAPC + GOOSE fast-tripping</strong> cuts incident energy compared to conventional 400ms relays.
                    </p>
                  </div>
                </div>

                {/* PROMINENT ENGINEERING DISCLAIMER BOX (IMMEDIATELY VISIBLE) */}
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/60 text-amber-200">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                    EDUCATIONAL SCOPE &amp; DISCLAIMER
                  </h4>
                  <ul className="text-[11px] space-y-1 text-amber-100 font-normal leading-normal list-disc list-inside">
                    <li>
                      <strong>Working Scope:</strong> IEEE 1584-2018 empirical models apply to 3-phase AC systems from <strong className="text-white">208V to 15,000V (15kV)</strong> with fault currents up to 106kA.
                    </li>
                    <li>
                      <strong>Exclusions:</strong> Higher voltage transmission levels (<strong className="text-amber-300 font-bold">6.6kV heavy industrial, 33kV, 132kV+ EHV</strong>) fall outside standard empirical models; actual field arc energy at these levels can be far greater and requires specialized plasma software.
                    </li>
                    <li>
                      <strong>Training Only:</strong> Not valid for live site work permits or official studies.
                    </li>
                  </ul>
                </div>

                {/* How to Operate Quick Guide */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-0.5">How To Operate (Quick 3 Steps)</h4>
                    <ol className="text-[11px] text-slate-300 space-y-0.5 list-decimal list-inside font-medium">
                      <li>Select Equipment Preset or adjust voltage/fault parameters.</li>
                      <li>Equip required NFPA 70E Arc PPE.</li>
                      <li>Press &amp; Hold <strong className="text-orange-300 font-bold">"HOLD TO INITIATE ARC"</strong> to simulate.</li>
                    </ol>
                  </div>
                </div>

              </div>

              {/* Action Buttons Footer */}
              <div className="p-3.5 border-t border-white/10 bg-slate-950 flex flex-col gap-2 shrink-0">
                <button 
                  onClick={() => setShowInfoScreen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xl active:scale-98"
                >
                  <span>ENTER SIMULATOR TOOL</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setShowInfoScreen(false);
                    setShowTheoryModal(true);
                  }}
                  className="text-[11px] text-slate-400 hover:text-orange-300 font-bold uppercase tracking-wider py-1 flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                  <span>Read Detailed IEEE 1584 Theory &amp; Standards Manual</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. DEDICATED THEORY & STANDARDS MANUAL MODAL (Opened from Tool Info) */}
      {/* ========================================================================= */}
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
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-slate-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-black uppercase tracking-wide text-white leading-tight">
                      IEEE 1584 &amp; NFPA 70E Standards Reference Guide
                    </h2>
                    <p className="text-xs text-orange-300 font-bold">Engineering Theory &amp; Substation Fast Tripping</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowTheoryModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theory Content Body */}
              <div className="p-4 md:p-6 space-y-4 text-left overflow-y-auto">
                
                {/* 1. What is IEEE 1584-2018? */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <h4 className="text-sm font-black text-orange-400 uppercase tracking-wide flex items-center gap-2">
                    <Zap className="w-4 h-4" /> 1. What is IEEE 1584-2018?
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    IEEE 1584-2018 provides empirical mathematical models to calculate arcing fault current (Ia), incident thermal energy exposure (E in cal/cm²), and the Arc Flash Boundary radius (Db). It evaluates 5 electrode orientations (VCB, VCBB, HCB, VOA, HOA) and enclosure dimensions across 208V to 15kV systems.
                  </p>
                </div>

                {/* 2. What is GAPC & GOOSE Fast Tripping? */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <h4 className="text-sm font-black text-sky-400 uppercase tracking-wide flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> 2. What is GAPC &amp; GOOSE Fast Tripping?
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>GAPC (Generic Automatic Process Control)</strong> is an optical photodiode sensor inside switchgear that detects arc plasma light flash in under 1.5ms.<br />
                    <strong>GOOSE (Generic Object Oriented Substation Events)</strong> is an IEC 61850 high-speed publisher on substation LAN Ethernet (Type 1A fast trip within 2.5ms). Together with modern breakers, total clearing time drops from 400ms down to 35-145ms, drastically cutting incident energy!
                  </p>
                </div>

                {/* 3. NFPA 70E Approach Boundaries */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <h4 className="text-sm font-black text-yellow-400 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> 3. NFPA 70E Approach Boundaries
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    • <strong>Arc Flash Boundary (AFB):</strong> Distance at which energy equals 1.2 cal/cm² (onset of 2nd-degree burns).<br />
                    • <strong>Limited Approach Boundary:</strong> Minimum shock protection boundary for unqualified personnel.<br />
                    • <strong>Restricted Approach Boundary:</strong> Boundary where insulated tools and gloves are required for qualified electricians.
                  </p>
                </div>

                {/* Technical Scope Disclaimer */}
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/60 space-y-1 text-amber-200">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                    Engineering Limitation Notice
                  </h4>
                  <p className="text-[11px] text-amber-100 leading-relaxed">
                    Higher distribution and grid transmission voltage levels (such as <strong>6.6kV heavy industrial, 33kV, 132kV, or EHV substations</strong>) fall outside IEEE 1584 empirical boundaries and require specialized theoretical plasma arc modeling (e.g. Ralph Lee methods or EMTP software).
                  </p>
                </div>

              </div>

              {/* Close Button */}
              <div className="p-4 border-t border-white/10 bg-slate-950 flex shrink-0">
                <button 
                  onClick={() => setShowTheoryModal(false)}
                  className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-black text-sm uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  <span>CLOSE THEORY MANUAL</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
