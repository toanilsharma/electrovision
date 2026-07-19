import React, { useState, useEffect } from 'react';
import { ActivitySquare, AlertTriangle, Zap, Footprints, ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { EmergencyResponse } from '../EmergencyResponse';
import { EnvironmentalControls, EnvironmentalState } from '../EnvironmentalControls';
import { HazardOverlay } from '../HazardOverlay';
import { PPEValidator } from '../PPEValidator';

export function StepTouchSimulator({ config }: { config?: UserConfig }) {
  const [distance, setDistance] = useState<number>(10); // 1 to 15 meters
  const [isPPESafe, setIsPPESafe] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [env, setEnv] = useState<EnvironmentalState>({
    soilType: 'dry_gravel',
    humidity: 50,
    temperature: 20,
    isRaining: false
  });
  
  const isIndustrial = config?.environment === 'industrial';
  
  // High voltage for step/touch demo (e.g. fallen distribution line)
  const sourceVoltage = isIndustrial ? 11000 : 3300; 
  
  // IEEE 80 soil/gravel resistivity calculations
  let soilResistivity = 3000; // Dry gravel default
  switch (env.soilType) {
    case 'dry_gravel':
      soilResistivity = env.isRaining ? 1500 : 3000;
      break;
    case 'wet_soil':
      soilResistivity = 100;
      break;
    case 'concrete':
      soilResistivity = env.isRaining ? 150 : 500;
      break;
  }

  // IEEE 80 variables
  const faultCurrent = isIndustrial ? 1500 : 500; // A
  const ts = 0.5; // Fault clearing duration (s)
  const Cs = 0.85; // Ground derating factor
  
  // Voltages based on earth surface potential dissipation
  // V(x) = (Resistivity * I) / (2 * PI * x)
  const calculateVoltageAt = (x: number) => {
    if (x <= 0.5) return sourceVoltage * 0.95;
    const potential = (soilResistivity * faultCurrent) / (2 * Math.PI * x);
    return Math.min(sourceVoltage * 0.9, potential);
  };

  const v1 = calculateVoltageAt(distance);
  const v2 = calculateVoltageAt(distance + 0.75); // 0.75m is standard stride length

  // Actual step potential
  const actualStepPotential = Math.max(0, v1 - v2);
  // Actual touch potential (standing at distance, touching faulted pole)
  const actualTouchPotential = Math.max(0, sourceVoltage - v1);

  // IEEE 80 limits
  // E_step = (1000 + 6 * Cs * rho_s) * 0.116 / sqrt(ts)
  // E_touch = (1000 + 1.5 * Cs * rho_s) * 0.116 / sqrt(ts)
  const allowableStepLimit = (1000 + 6 * Cs * soilResistivity) * (0.116 / Math.sqrt(ts));
  const allowableTouchLimit = (1000 + 1.5 * Cs * soilResistivity) * (0.116 / Math.sqrt(ts));

  // Determine current hazard based on location
  const isTouchZone = distance < 2;
  const activeActualVoltage = isTouchZone ? actualTouchPotential : actualStepPotential;
  const activeAllowableLimit = isTouchZone ? allowableTouchLimit : allowableStepLimit;

  // Safe without PPE?
  const isNativelySafe = activeActualVoltage <= activeAllowableLimit;
  // Safe overall? (Either natively below the safety limit OR protected by wearing correct PPE)
  const isSafe = isNativelySafe || isPPESafe;

  useEffect(() => {
    if (!isSafe) {
      setHasSimulated(true);
    }
  }, [distance, isSafe]);

  const isSimulating = !isSafe;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0">
      <div className="flex-col flex-1 gap-2 flex h-auto lg:h-full shrink-0 pb-2 order-1 lg:order-1">
        <div className="p-3 md:p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-orange-500 border-l-2 border-orange-500 pl-2">
              Distance from Fault Object (m)
            </h3>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">IEEE 80 Compliant Engine</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-900/50 p-2 md:p-3 rounded-lg border border-white/10">
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Position</span>
              <span className={cn("text-xl md:text-2xl font-black font-mono", isSafe ? 'text-green-400' : isTouchZone ? 'text-red-500' : 'text-yellow-400')}>
                {distance} <span className="text-[10px] md:text-xs uppercase tracking-widest ml-1">meters</span>
              </span>
            </div>

            <input
              type="range"
              min="1" max="15" step="0.5"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>
          
          <div className="mt-3">
            <EnvironmentalControls 
              state={env} 
              onChange={setEnv} 
              showSoil={true} 
              showRain={true} 
            />
          </div>
        </div>

        {/* PPE Verification */}
        <div className="shrink-0">
          <PPEValidator 
            hazardType="step_touch"
            hazardMagnitude={activeActualVoltage}
            onSafetyChange={setIsPPESafe}
          />
        </div>
        
        <div className="p-3 md:p-4 flex-1 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col min-h-0">
           <h3 className="mb-2 md:mb-3 text-[10px] font-black tracking-[0.2em] uppercase text-orange-500 border-l-2 border-orange-500 pl-2 shrink-0">
              IEEE 80 GROUND POTENTIAL RISE & VOLTAGE GRADIENT ASSESSMENT
           </h3>
           
           <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
             <div className="p-2 border border-white/5 rounded-lg bg-slate-950/60 flex flex-col">
               <span className="text-[8px] font-bold tracking-widest uppercase text-slate-400">Actual Shock Gradient</span>
               <span className={cn("text-lg font-black font-mono mt-0.5", isSafe ? "text-green-400" : "text-red-500")}>
                 {activeActualVoltage.toFixed(0)} V
               </span>
             </div>
             <div className="p-2 border border-white/5 rounded-lg bg-slate-950/60 flex flex-col">
               <span className="text-[8px] font-bold tracking-widest uppercase text-slate-400">IEEE 80 Allowable Limit</span>
               <span className="text-lg font-black font-mono text-cyan-400 mt-0.5">
                 {activeAllowableLimit.toFixed(0)} V
               </span>
             </div>
           </div>
           
           <div className="space-y-2 flex-1 flex flex-col justify-center">
             {isSafe ? (
               <div className="p-3 border border-green-500/50 rounded-xl bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                 <div className="flex items-center gap-2 mb-1">
                   <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                   <h4 className="text-[10px] md:text-xs font-bold text-green-400 uppercase tracking-widest">Protected State Confirmed</h4>
                 </div>
                 <p className="text-[9px] md:text-[10px] text-slate-300 font-mono leading-relaxed">
                   {isNativelySafe 
                     ? "The physical distance from the fault ensures the touch/step voltage is below the IEEE 80 permissible safety threshold. No hazard."
                     : "WARNING: High voltage gradient is present. However, your selected dielectric footwear insulation rated for full voltage preserves a safe pathway."}
                 </p>
               </div>
             ) : (
               <div className="p-3 border border-red-500/50 rounded-xl bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                 <div className="flex items-center gap-2 mb-1">
                   <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500 animate-pulse" />
                   <h4 className="text-[10px] md:text-xs font-bold text-red-500 uppercase tracking-widest">
                     {isTouchZone ? "Touch Potential Risk (CRITICAL)" : "Step Potential Fibrillation Risk"}
                   </h4>
                 </div>
                 <p className="text-[9px] md:text-[10px] text-slate-300 font-mono leading-relaxed mb-2">
                   {isTouchZone 
                     ? "CRITICAL: Touching the energized structure completes a low-resistance path, bypassing safe soil resistivity and causing high internal body current."
                     : "The actual step potential voltage between your feet exceeds the allowable limit. Current will flow up one leg and down the other, potentially triggering ventricular fibrillation."}
                 </p>
                 <div className="text-[8px] text-red-400 font-black uppercase tracking-wider flex items-center gap-1">
                   <Footprints className="w-3.5 h-3.5" /> Wear ASTM F1117 Dielectric boots to isolate!
                 </div>
               </div>
             )}
           </div>

           <div className="shrink-0 mt-2">
             <EmergencyResponse isSimulating={isSimulating} hasSimulated={hasSimulated} type="step_touch" />
           </div>
        </div>
      </div>
      
      <div className="flex relative items-center justify-center bg-slate-950/30 border-white/5 backdrop-blur-md border rounded-2xl shadow-inner flex-1 lg:flex-none lg:w-[400px] xl:w-[450px] shrink-0 h-[300px] min-h-[300px] lg:h-full overflow-hidden p-2 order-2 lg:order-3 relative z-10 lg:sticky lg:top-0 lg:z-20 bg-[#020617]/95 backdrop-blur-md border-b border-slate-800 lg:border-b-0 shadow-lg lg:shadow-none">
        <svg viewBox="0 0 200 200" className="w-full h-full max-h-[300px]">
          {/* Earth Rings with dynamic gradient intensity based on soil resistivity */}
          <circle cx="100" cy="180" r="80" fill="none" stroke={`rgba(239, 68, 68, ${soilResistivity > 1000 ? 0.1 : 0.35})`} strokeWidth="15" />
          <circle cx="100" cy="180" r="60" fill="none" stroke={`rgba(234, 179, 8, ${soilResistivity > 1000 ? 0.2 : 0.45})`} strokeWidth="15" />
          <circle cx="100" cy="180" r="40" fill="none" stroke={`rgba(249, 115, 22, ${soilResistivity > 1000 ? 0.3 : 0.55})`} strokeWidth="15" />
          <circle cx="100" cy="180" r="20" fill="rgba(249, 115, 22, 0.6)" />
          
          {/* Radial voltage gradient pulse effect */}
          <motion.circle 
             cx="100" cy="180" r={20} fill="none" stroke="rgba(249, 115, 22, 0.5)" strokeWidth={2}
             animate={{ r: [20, 100], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />

          {/* Faulted Pole / Object */}
          <rect x="95" y="50" width="10" height="130" fill="#475569" />
          <line x1="60" y1="70" x2="140" y2="70" stroke="#475569" strokeWidth="4" />
          {/* Downed wire */}
          <path d="M140 70 Q 150 120 100 180" fill="none" stroke="#f97316" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 5px #f97316)' }} />
          
          {/* Person mapping based on distance */}
          {(() => {
            const personX = 100 + (distance * 6);
            return (
              <g transform={`translate(${personX - 100}, 0)`}>
                {/* Realistic human outline for step/touch */}
                <path d="M98 128 C98 125, 102 125, 102 128 C102 131, 102 133, 101 135 C104 136, 108 138, 108 142 L112 153 C112 155, 110 155, 108 153 L105 143 L103 160 C103 165, 108 180, 108 180 C108 182, 105 182, 104 180 M103 160 C101 165, 96 180, 96 180 C95 182, 92 182, 94 180 M101 135 C98 136, 92 138, 92 142 L88 153 C88 155, 90 155, 92 153 L95 143" fill="none" stroke={isSafe ? "#4ade80" : "#cbd5e1"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {isTouchZone ? (
                   // Touching pole with left hand
                   <>
                     <line x1="100" y1="138" x2="90" y2="100" stroke={isSafe ? "#4ade80" : "#ef4444"} strokeWidth="1.5" strokeLinecap="round" />
                     {!isSafe && (
                       <motion.path d="M90 100 Q100 130 100 180" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4 4" animate={{ opacity: [1, 0] }} transition={{ duration: 0.3, repeat: Infinity }} style={{ filter: 'drop-shadow(0 0 5px #f97316)' }} />
                     )}
                   </>
                ) : null}

                {/* Voltage across legs bridging rings if step hazard */}
                {!isSafe && !isTouchZone && (
                  <motion.path d="M96 180 Q 102 170 108 180" fill="none" stroke="#ef4444" strokeWidth="2" animate={{ opacity: [1, 0], scaleY: [1, 1.2] }} transition={{ duration: 0.2, repeat: Infinity }} style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }} />
                )}
              </g>
            );
          })()}
        </svg>

        <div className="absolute top-4 left-4 text-[9px] font-mono tracking-widest text-slate-400 uppercase bg-slate-900/80 px-2 py-1 rounded border border-white/10">
          Source: {sourceVoltage}V | Soil: {soilResistivity} Ω-m
        </div>
      </div>

      <HazardOverlay 
        isActive={isSimulating}
        hazardType={isTouchZone ? 'touch' : 'step'}
        dangerLevel={isTouchZone ? 'critical' : 'warning'}
        magnitude={`${activeActualVoltage.toFixed(0)}V vs ${activeAllowableLimit.toFixed(0)}V max`}
        intensity={isPPESafe ? 0 : Math.max(0.1, Math.min(faultCurrent / 1500, 1.0)) * (activeActualVoltage / activeAllowableLimit > 1 ? 1 : 0.5)}
      />
    </div>
  );
}
