import React, { useState, useEffect } from 'react';
import { MobileActionButton } from '../MobileActionButton';
import { HumanBodyTwin } from '../HumanBodyTwin';
import { EmergencyResponse } from '../EmergencyResponse';
import { DiagnosticScope } from '../DiagnosticScope';
import { Activity, Droplets, Zap, Clock, UserSquare2, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ShockEffectLevel, PPEItem, UserConfig } from '@/src/types';
import { PPEValidator } from '../PPEValidator';
import { useAudioHaptics } from '../useAudioHaptics';
import { motion } from 'motion/react';
import { InfoTooltip } from '../InfoTooltip';
import { AfterActionReportModal, IncidentReport } from '../AfterActionReportModal';
import { HazardOverlay } from '../HazardOverlay';

export function ACShockSimulator({ config }: { config?: UserConfig }) {
  const [voltage, setVoltage] = useState<number>(230);
  const [duration, setDuration] = useState<number>(0);
  const [skinCondition, setSkinCondition] = useState<'dry' | 'wet'>('dry');
  const [path, setPath] = useState<'hand-to-hand' | 'hand-to-foot'>('hand-to-foot');
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isPPESafe, setIsPPESafe] = useState(false);

  const [showAAR, setShowAAR] = useState(false);
  const [lastReport, setLastReport] = useState<IncidentReport | null>(null);

  const { startHum, stopHum } = useAudioHaptics();

  useEffect(() => {
    if (config?.environment === 'industrial') {
      setVoltage(415);
    } else {
      setVoltage(230);
    }
  }, [config]);

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

  const handleStart = () => {
    setIsSimulating(true);
    setHasSimulated(true);
    setDuration(0);
    // 50Hz or 60Hz depending on region, let's just use 60
    startHum(60);
  };

  const handleStop = () => {
    setIsSimulating(false);
    stopHum();
  };

  // IEC 60479-1 Alignment: Touch resistance is non-linear based on voltage.
  // Using simplified approximations of the 5th percentile values for total body impedance (Z_T)
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
    
    // Heart Current Factor (F_path) per IEC 60479-1 Figure 20
    // L-to-R hand ~ 0.4
    // L-hand to foot/feet ~ 1.0 (assuming left hand to simplify worst case)
    const heartFactor = path === 'hand-to-foot' ? 1.0 : 0.4;
    
    if (config?.profile === 'child') {
      r = r * 0.7; // Lower impedance
    }

    return { r, heartFactor };
  };

  // Exact IEC 60479-1 C1 Curve Approximation (Fibrillation Threshold)
  const getC1Threshold = (tMs: number) => {
    const table = [
      [0, 200], [10, 200], [20, 150], [50, 100], [100, 70], [200, 50], [500, 40], [1000, 30], [10000, 30]
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
    return 30;
  };

  const calculateResults = () => {
    const { r, heartFactor } = getResistance();
    const currentAmp = voltage / r;
    const currentMA = currentAmp * 1000;
    const effectiveHeartCurrent = currentMA * heartFactor; // I_eq
    
    if (!isSimulating) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, level: 0 as ShockEffectLevel, severity: 'SAFE (NO CONTACT)', intensity: 0, heartFactor };
    }
    if (isPPESafe) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, level: 0 as ShockEffectLevel, severity: 'SAFE: PPE INSULATION ACTIVE', intensity: 0, heartFactor };
    }
    
    let level: ShockEffectLevel = 1;
    let severity = 'AC-1 (Perception)';
    
    const c1 = getC1Threshold(duration);
    const c2 = c1 * 1.5; // Roughly Curve C2
    const c3 = c1 * 2.5; // Roughly Curve C3
    
    if (effectiveHeartCurrent > 0.5) { level = 2; severity = 'AC-2 (Involuntary Contractions)'; }
    if (effectiveHeartCurrent > 10) { level = 3; severity = 'AC-3 (Let-go impossible, cramping)'; }
    
    if (duration > 0) {
       if (effectiveHeartCurrent > c1) { level = 7; severity = 'AC-4.1 (<5% V-Fib Prob)'; }
       if (effectiveHeartCurrent > c2) { level = 8; severity = 'AC-4.2 (<50% V-Fib Prob)'; }
       if (effectiveHeartCurrent > c3) { level = 9; severity = 'AC-4.3 (>50% V-Fib Prob)'; }
    }
    
    // I^2t specific energy in A^2s for tissue damage visualization
    const i2t = Math.pow(currentAmp, 2) * (duration / 1000);
    
    // Compute a continuous intensity 0-1 based on actual physical values
    // Current contribution: 0-0.5 up to 100mA
    const intensityCurrent = Math.min(effectiveHeartCurrent / 100, 1) * 0.5;
    // Energy contribution: 0-0.5 based on heating (0.05 A^2s starts showing burns)
    const intensityEnergy = Math.min(i2t / 0.05, 1) * 0.5;
    
    const intensity = Math.min(intensityCurrent + intensityEnergy, 1.0);
    
    return { currentMA, effectiveHeartCurrent, r, level, severity, intensity, heartFactor };
  };

  const results = calculateResults();

  const prevSimulating = React.useRef(isSimulating);
  React.useEffect(() => {
    if (prevSimulating.current && !isSimulating && hasSimulated) {
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


  const getPPE = (): PPEItem[] => {
    return [
      { id: 'shoes', name: 'EH Rated Safety Shoes', mandatory: path === 'hand-to-foot' || config?.environment === 'industrial', icon: 'shoes' },
      { id: 'gloves', name: 'Insulating Gloves (Class depends on V)', mandatory: true, icon: 'gloves' },
      { id: 'glasses', name: 'Safety Glasses', mandatory: config?.environment === 'industrial', icon: 'glasses' },
      ...(config?.environment === 'industrial' ? [{ id: 'arc', name: 'Arc Flash Face Shield', mandatory: voltage > 400, icon: 'shield' }] : []),
    ];
  };

  return (
    <motion.div 
      className="flex flex-col lg:flex-row h-full gap-2 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0"
      animate={{ x: isSimulating ? [-2, 2, -3, 3, -1, 1, 0] : 0 }}
      transition={{ duration: 0.2, repeat: isSimulating ? Infinity : 0, ease: "linear" }}
    >
      {/* Column 1: Controls */}
        <div className="w-full lg:w-[320px] shrink-0 p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col h-auto lg:h-full overflow-visible lg:overflow-y-auto order-1 lg:order-1">
          <h3 className="flex items-center gap-2 mb-2 text-[10px] font-black tracking-[0.2em] uppercase text-orange-500 border-l-2 border-orange-500 pl-2 shrink-0">
            <Zap className="w-4 h-4 text-orange-500" /> Parameters
          </h3>
          
          <div className="space-y-3 flex-1 flex flex-col">
            <div>
              <label className="flex justify-between mb-1 text-[10px] font-bold text-white uppercase tracking-wider">
                <span>Voltage (V_t)</span>
                <span className="text-orange-400 font-black">{voltage} V AC</span>
              </label>
              <input
                type="range"
                min="50" max="1000" step="10"
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3 h-3"/> Shock Duration</span>
              <span className="text-sm font-black font-mono text-orange-400">{duration} ms</span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skin Condition</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setSkinCondition('dry')}
                  className={cn("px-2 py-1.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider transition-all", skinCondition === 'dry' ? 'bg-orange-500/20 border-orange-500/50 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white')}
                >
                  Dry Skin
                </button>
                <button
                  onClick={() => setSkinCondition('wet')}
                  className={cn("px-2 py-1.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider transition-all", skinCondition === 'wet' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white')}
                >
                  Wet / Perspired
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Path</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setPath('hand-to-hand')}
                  className={cn("px-2 py-1.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider transition-all", path === 'hand-to-hand' ? 'bg-orange-500/20 border-orange-500/50 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)] underline underline-offset-2' : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white')}
                >
                  Hand - Hand
                </button>
                <button
                  onClick={() => setPath('hand-to-foot')}
                  className={cn("px-2 py-1.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider transition-all", path === 'hand-to-foot' ? 'bg-orange-500/20 border-orange-500/50 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)] underline underline-offset-2' : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white')}
                >
                  Hand - Foot
                </button>
              </div>
            </div>
            
            <div className="hidden lg:block mt-auto pt-4 shrink-0">
              <button
                 onPointerDown={(e) => { handleStart(); }}
                onPointerUp={(e) => { handleStop(); }}
                onPointerLeave={handleStop}
                onPointerCancel={handleStop}
                onContextMenu={(e) => e.preventDefault()}
                style={{ touchAction: 'none' }}
                 className="w-full py-4 lg:py-2.5 text-xs lg:text-[10px] tracking-widest font-black text-slate-900 uppercase transition-all rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 flex items-center justify-center gap-2 select-none shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                 aria-live="polite"
              >
                <Zap className="w-4 h-4 fill-current" />
                HOLD TO SHOCK
              </button>
            </div>
<MobileActionButton>

              <button
                 onPointerDown={(e) => { handleStart(); }}
                onPointerUp={(e) => { handleStop(); }}
                onPointerLeave={handleStop}
                onPointerCancel={handleStop}
                onContextMenu={(e) => e.preventDefault()}
                style={{ touchAction: 'none' }}
                 className="w-full py-4  text-[14px]  tracking-widest font-black text-slate-900 uppercase transition-all rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 flex items-center justify-center gap-2 select-none shadow-[0_15px_30px_rgba(0,0,0,0.6)] "
                 aria-live="polite"
              >
                <Zap className="w-4 h-4 fill-current" />
                HOLD TO SHOCK
              </button>
            
</MobileActionButton>

          </div>
        </div>

        {/* Column 2: Analysis & PPE */}
        <div className="flex-1 min-w-[280px] p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col h-auto lg:h-full overflow-visible lg:overflow-y-auto order-3 lg:order-2">
           <h3 className="flex items-center gap-2 mb-2 text-[10px] font-black tracking-[0.2em] uppercase text-orange-500 border-l-2 border-orange-500 pl-2 shrink-0">
            <TrendingUp className="w-4 h-4 text-orange-500" /> IEC 60479-1 Analysis
          </h3>
          
          <div className="flex-1 flex flex-col min-h-0 space-y-2">
             <div className="grid grid-cols-2 gap-2 shrink-0">
               <div className="p-2 bg-slate-900/60 rounded-xl border border-white/5 shadow-inner flex flex-col justify-center">
                  <InfoTooltip title="Total Body Impedance (Z_T)" description="According to IEC 60479-1, total body impedance drops significantly at higher voltages due to skin breakdown."><span className="text-[8px] font-bold tracking-widest text-slate-500 uppercase mb-0.5">Impedance (Z_T)</span></InfoTooltip>
                  <span className="text-sm font-black font-mono text-white">{results.r.toFixed(0)} Ω</span>
               </div>
               <div className="p-2 bg-slate-900/60 rounded-xl border border-white/5 shadow-inner flex flex-col justify-center">
                  <InfoTooltip title="Heart Current Factor (F)" description="A multiplier representing the proportion of current passing through the heart region. Left-hand to both feet is typically 1.0 (highest risk)."><span className="text-[8px] font-bold tracking-widest text-slate-500 uppercase mb-0.5">Heart Factor</span></InfoTooltip>
                  <span className="text-sm font-black font-mono text-white">{results.heartFactor.toFixed(1)} F</span>
               </div>
             </div>

             <div className="flex justify-between items-end p-2 bg-slate-900/60 rounded-xl border border-white/5 shadow-inner shrink-0">
                <div>
                  <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase mb-0.5 block">Prospective Current</span>
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-xl font-black font-mono tracking-tighter", isSimulating ? 'text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'text-white')}>
                      {results.currentMA.toFixed(1)}
                    </span>
                    <span className="text-slate-400 font-mono text-[9px] uppercase">mA</span>
                  </div>
                </div>
                <div className="text-right">
                  <InfoTooltip title="Equivalent Heart Current" description="I_eq = Total Body Current x Heart Factor. This value determines the physiological effects on the heart such as Ventricular Fibrillation (V-Fib)."><span className="text-[8px] font-bold tracking-widest text-red-500 uppercase mb-0.5 block">Eq. Heart Current</span></InfoTooltip>
                  <span className="text-base font-black font-mono text-red-400">{results.effectiveHeartCurrent.toFixed(1)} mA</span>
                </div>
             </div>
             
             <div className="flex flex-col pt-1 shrink-0 bg-slate-900/40 p-2 rounded-xl">
                <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">Shock Severity (Level {results.level}/9)</span>
                <span className={cn("text-xs font-bold uppercase tracking-wider leading-tight", 
                  results.level === 0 ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' :
                  results.level > 6 ? 'text-red-500' : 
                  results.level > 3 ? 'text-orange-500' : 'text-yellow-400'
                )}>
                  {results.severity}
                </span>
             </div>
             
             <div className="mt-2 shrink-0">
               <PPEValidator hazardType="shock_ac" hazardMagnitude={voltage} onSafetyChange={setIsPPESafe} />
               <EmergencyResponse isSimulating={isSimulating && !isPPESafe} hasSimulated={hasSimulated} type="shock" />
             </div>
          </div>
        </div>

      {/* Column 3: Graphics & Waveforms */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-2 h-auto lg:h-full overflow-visible lg:overflow-hidden order-2 lg:order-3 relative z-10 lg:sticky lg:top-0 lg:z-20 bg-[#020617]/95 backdrop-blur-md pb-3 lg:pb-0 border-b border-slate-800 lg:border-b-0 shadow-lg lg:shadow-none">
        <div className="flex-1 h-[220px] min-h-[220px] lg:h-auto lg:min-h-[400px] w-full relative border border-slate-700/50 rounded-xl bg-[#020617] shadow-inner overflow-hidden flex flex-col">
          <span className="absolute top-2 left-2 text-[8px] font-black tracking-widest text-slate-600 uppercase z-20">Digital Twin</span>
          <HumanBodyTwin 
            shockPath={path} 
            intensity={results.intensity} 
            isAnimating={isSimulating} 
            profile={config?.profile}
          />
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          <div className="h-16 lg:h-28 shrink-0 w-full border border-slate-700/50 rounded-xl p-2 bg-[#020617] flex flex-col shadow-inner">
             <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase mb-1 flex justify-between shrink-0">
               <span>ECG Diagnostics</span>
               {isSimulating && <span className="text-green-500 animate-pulse drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">LIVE</span>}
             </span>
             <div className="flex-1 overflow-hidden rounded-lg">
               <DiagnosticScope type="ecg" isActive={isSimulating} intensity={results.intensity} voltage={voltage} />
             </div>
          </div>

          <div className="h-16 lg:h-20 shrink-0 w-full border border-slate-700/50 rounded-xl p-2 bg-[#020617] flex flex-col shadow-inner">
             <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase mb-1 shrink-0">Voltage Waveform</span>
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
    </motion.div>

  );
}
