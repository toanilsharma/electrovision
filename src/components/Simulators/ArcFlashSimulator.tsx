import React, { useState } from 'react';
import { MobileActionButton } from '../MobileActionButton';
import { ShieldAlert, Zap, AlertTriangle, Flame } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { EmergencyResponse } from '../EmergencyResponse';
import { PPEValidator } from '../PPEValidator';
import { useAudioHaptics } from '../useAudioHaptics';
import { HazardOverlay } from '../HazardOverlay';

export function ArcFlashSimulator({ config }: { config?: UserConfig }) {
  const [voltage, setVoltage] = useState<number>(415);
  const [opticalTime, setOpticalTime] = useState<number>(1.5); // ms (GAPC detection)
  const [gooseLatency, setGooseLatency] = useState<number>(2.5); // ms (GOOSE transmission)
  const [breakerTime, setBreakerTime] = useState<number>(35); // ms (XCBR contacts open)
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [stNum, setStNum] = useState<number>(0);
  const [sqNum, setSqNum] = useState<number>(0);
  const [isPPESafe, setIsPPESafe] = useState(false);
  const { playArcBlast } = useAudioHaptics();

  const isIndustrial = config?.environment === 'industrial';

  // IEEE 1584-2002 Arc Flash Hazard Calculations
  // t is the total clearing time in seconds
  const clearingTimeMs = opticalTime + gooseLatency + breakerTime;
  const clearingTimeSec = clearingTimeMs / 1000;
  
  // Bolted fault current (Ibf) in kA
  const boltedFaultCurrent = isIndustrial ? 30 : 15; // 30 kA industrial, 15 kA standard
  
  // Arcing current (Ia) in kA - using standard approximation (IEEE 1584 for >1kV or LV approximation)
  const arcingCurrent = (voltage < 1000) ? (boltedFaultCurrent * 0.85) : (boltedFaultCurrent * 0.95);
  
  // Distance from arc (D) in mm
  const workingDistance = isIndustrial ? 910 : 455; // 36 inches for MV, 18 inches for LV
  
  // Normalized Incident Energy (En) based on En = 10^(k1 + k2 * log10(Ia))
  const k1 = -0.555; // box configuration
  const k2 = 1.081;
  const En = Math.pow(10, k1 + k2 * Math.log10(arcingCurrent));
  
  // Calculation of Incident Energy (E) in cal/cm2
  // E = 4.184 * Cf * En * (t/0.2) * (610^x / D^x)
  const Cf = voltage < 1000 ? 1.5 : 1.0;
  const x_factor = voltage < 1000 ? 1.473 : 0.973;
  
  const incidentEnergy = 4.184 * Cf * En * (clearingTimeSec / 0.2) * Math.pow(610 / workingDistance, x_factor); 
  const isDangerous = incidentEnergy > 1.2; // 1.2 cal/cm2 is the threshold for second degree burns
  const boundaryRadius = Math.max(0.1, incidentEnergy * 0.4); // meters

  // NFPA 70E HRC Levels
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
    setStNum(prev => prev + 1);
    setSqNum(prev => prev + 1);
    playArcBlast();
  };

  return (
    <motion.div 
      className="flex flex-col lg:flex-row h-full gap-4 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0"
      animate={{ x: isSimulating ? [-5, 5, -8, 8, -3, 3, 0] : 0, y: isSimulating ? [-2, 2, -4, 4, -1, 1, 0] : 0 }}
      transition={{ duration: 0.4, ease: "linear" }}
    >
      <div className="flex-col flex-1 gap-2 flex h-auto lg:h-full shrink-0 pb-2 order-1 lg:order-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 shrink-0">
          <div className="p-3 md:p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col">
            <h3 className="mb-2 md:mb-3 text-[10px] font-black tracking-[0.2em] uppercase text-orange-500 border-l-2 border-orange-500 pl-2 shrink-0">
              IEEE 61850 Parameters
            </h3>
            
            <div className="space-y-3 flex-1">
              <div>
                <label className="flex justify-between text-[10px] font-bold text-white uppercase tracking-wider mb-1">
                  <span>System Voltage (V)</span>
                  <span className="text-orange-400 font-black">{voltage} V</span>
                </label>
                <input
                  type="range"
                  min="415" max={isIndustrial ? 11000 : 1000} step="100"
                  value={voltage}
                  onChange={(e) => setVoltage(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-[10px] font-bold text-white uppercase tracking-wider mb-0.5">
                  <span>Optical Sensor Detection</span>
                  <span className="text-orange-400 font-black">{opticalTime.toFixed(1)} ms</span>
                </label>
                <div className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider mb-1">LN: GAPC1 (Arc Photodiode Pickup)</div>
                <input
                  type="range"
                  min="1.0" max="10.0" step="0.5"
                  value={opticalTime}
                  onChange={(e) => setOpticalTime(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-[10px] font-bold text-white uppercase tracking-wider mb-0.5">
                  <span>GOOSE Network Latency</span>
                  <span className="text-orange-400 font-black">{gooseLatency.toFixed(1)} ms</span>
                </label>
                <div className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider mb-1">Type 1A Class P2 Fast Trip (&lt;3ms limit)</div>
                <input
                  type="range"
                  min="1.0" max="15.0" step="0.5"
                  value={gooseLatency}
                  onChange={(e) => setGooseLatency(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-[10px] font-bold text-white uppercase tracking-wider mb-0.5">
                  <span>Breaker Opening Time</span>
                  <span className="text-orange-400 font-black">{breakerTime} ms</span>
                </label>
                <div className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider mb-1">LN: XCBR1 (High-speed mechanical contacts)</div>
                <input
                  type="range"
                  min="20" max="120" step="5"
                  value={breakerTime}
                  onChange={(e) => setBreakerTime(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            <div className="hidden lg:block w-full mt-4">
            <button 
              onPointerDown={(e) => { handleInitiate(); }}
                onPointerUp={(e) => { setIsSimulating(false); }}
                onPointerLeave={() => setIsSimulating(false)}
                onPointerCancel={() => setIsSimulating(false)}
                onContextMenu={(e) => e.preventDefault()}
                style={{ touchAction: 'none' }}
               className="w-full py-4 lg:py-3 font-black text-xs uppercase tracking-[0.2em] text-slate-900 transition-all rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 flex items-center justify-center gap-2 select-none shadow-2xl lg:shadow-[0_0_20px_rgba(249,115,22,0.3)] shrink-0"
               aria-live="polite"
            >
              <Flame className="w-4 h-4 fill-current" />
              HOLD TO INITIATE ARC
            </button>

<MobileActionButton>
<button 
              onPointerDown={(e) => { handleInitiate(); }}
                onPointerUp={(e) => { setIsSimulating(false); }}
                onPointerLeave={() => setIsSimulating(false)}
                onPointerCancel={() => setIsSimulating(false)}
                onContextMenu={(e) => e.preventDefault()}
                style={{ touchAction: 'none' }}
               className="w-full py-4 lg:py-3 font-black text-[14px] uppercase tracking-[0.2em] text-slate-900 transition-all rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 flex items-center justify-center gap-2 select-none shadow-2xl lg:shadow-[0_15px_30px_rgba(0,0,0,0.6)] shrink-0"
               aria-live="polite"
            >
              <Flame className="w-4 h-4 fill-current" />
              HOLD TO INITIATE ARC
            </button>
</MobileActionButton>

            </div>
          </div>
          
          <div className="p-3 md:p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="mb-2 text-[10px] font-black tracking-[0.2em] uppercase text-orange-500 border-l-2 border-orange-500 pl-2 shrink-0">
                  IEEE 61850 Diagnostics
                </h3>

                <div className="p-2 lg:p-3 border border-white/10 rounded-xl bg-slate-900/60 shadow-inner">
                  <span className="text-[9px] lg:text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 flex justify-between">
                    <span>Incident Energy (IEEE 1584)</span>
                    {!isSimulating && <span className="text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">MONITORED</span>}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-2xl lg:text-3xl font-black font-mono tracking-tighter", !isSimulating ? 'text-green-500' : isDangerous ? 'text-red-500' : 'text-orange-500')}>
                      {!isSimulating ? "0.00" : incidentEnergy.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">cal/cm²</span>
                  </div>
                </div>

                <div className="p-2 lg:p-3 border border-white/10 rounded-xl bg-slate-900/60 shadow-inner">
                  <span className="text-[9px] lg:text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 block">Total clearing Time</span>
                  <span className="text-lg lg:text-xl font-bold font-mono text-white">
                    {clearingTimeMs.toFixed(1)} <span className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-widest ml-1">milliseconds</span>
                  </span>
                </div>

                <div className="p-2 lg:p-3 border border-white/10 rounded-xl bg-slate-900/60 shadow-inner">
                  <span className="text-[9px] lg:text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 block">IEEE 1584 Arc Boundary</span>
                  <span className="text-lg lg:text-xl font-bold font-mono text-white">
                    {boundaryRadius.toFixed(2)} <span className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-widest ml-1">meters</span>
                  </span>
                </div>

                <div className={cn("p-2 lg:p-3 border rounded-xl shadow-inner text-left", hrcLevel === 5 ? "bg-red-950/80 border-red-500/50" : "bg-orange-950/40 border-orange-500/30")}>
                  <span className="text-[9px] lg:text-[10px] font-black tracking-widest text-orange-400 uppercase block mb-1">NFPA 70E Category Level</span>
                  <span className={cn("text-xs font-mono font-bold leading-tight block", hrcLevel === 5 ? "text-red-400" : "text-slate-200")}>
                    {hrcRecommendation}
                  </span>
                </div>
              </div>

              <div className="mt-2 border-t border-white/5 pt-2 text-[8px] font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>GAPC1.Op.general (Light Pickup)</span>
                  <span className={cn("font-bold", isSimulating ? "text-orange-400" : "text-slate-600")}>{isSimulating ? "TRUE" : "FALSE"}</span>
                </div>
                <div className="flex justify-between">
                  <span>GOOSE Pub (GoCB_ArcTrip)</span>
                  <span className={cn("font-bold", isSimulating ? "text-green-400" : "text-slate-600")}>
                    {isSimulating ? `Active (stNum: ${stNum}, sqNum: ${sqNum})` : "Idle"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>XCBR1.Pos (Breaker State)</span>
                  <span className={cn("font-bold", isSimulating ? "text-red-400 animate-pulse" : "text-green-500")}>
                    {isSimulating ? "TRIPPING" : "CLOSED (OK)"}
                  </span>
                </div>
              </div>
          </div>
        </div>
        
        <div className="p-3 border rounded-xl bg-slate-900/80 border-white/5 shadow-lg shrink-0">
          <div className="flex items-center gap-2 mb-1 text-[9px] md:text-[10px] font-black tracking-widest text-orange-500 uppercase">
            <ShieldAlert className="w-3.5 h-3.5 md:w-4 md:h-4" /> IEEE 61850 Standard Protection
          </div>
          <p className="text-[10px] md:text-xs text-slate-300 tracking-wide leading-relaxed font-mono">
            Under IEEE 61850-9-2 and high-speed GOOSE messaging, optical sensors bypass standard slow time-overcurrent relays. Tripping commands are published dynamically across the substation LAN in less than 3ms, saving lives and protecting physical switchgear.
          </p>
        </div>
        
        <div className="shrink-0">
          <PPEValidator hazardType="arc_flash" hazardMagnitude={incidentEnergy} onSafetyChange={setIsPPESafe} />
          <div className="mt-2 text-left">
             <EmergencyResponse isSimulating={isSimulating && !isPPESafe} hasSimulated={hasSimulated} type="arc_flash" />
          </div>
        </div>
      </div>
      
      <div className="relative flex flex-col flex-1 lg:flex-none lg:w-[400px] xl:w-[450px] shrink-0 h-48 lg:h-full min-h-[300px] border border-slate-700/50 bg-[#020617] rounded-xl shadow-inner overflow-hidden order-2 lg:order-3 relative z-10 lg:sticky lg:top-0 lg:z-20 bg-[#020617]/95 backdrop-blur-md border-b border-slate-800 lg:border-b-0 shadow-lg lg:shadow-none">
        <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Switchgear Panel */}
            <rect x="60" y="40" width="80" height="120" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="4" />
            <line x1="100" y1="40" x2="100" y2="160" stroke="#334155" strokeWidth="2" />
            <rect x="70" y="60" width="20" height="10" fill="#334155" />
            <rect x="110" y="60" width="20" height="10" fill="#334155" />
            
            {/* Fiber Optic Cable Graphic */}
            <path d="M 70 120 Q 50 140 100 180" fill="none" stroke={isSimulating ? "#06b6d4" : "#1e293b"} strokeWidth="2" className={cn(isSimulating && "animate-pulse")} />
            <text x="110" y="190" fill="#06b6d4" fontSize="6" fontFamily="monospace" fontWeight="bold">GAPC FIBER LINK</text>
            
            {/* Background expanding rings based on boundary limit */}
            <circle cx="100" cy="100" r={Math.min(boundaryRadius * 40, 95)} fill="none" stroke="rgba(249, 115, 22, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Arc Flash Animation */}
            <AnimatePresence>
              {isSimulating && (
                <motion.g
                  key="arc-flash-group"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                >
                  {/* Flash Radiance */}
                  <motion.circle 
                     cx="100" cy="100" r={Math.max(10, boundaryRadius * 50)} 
                     fill="rgba(255, 255, 255, 1)" 
                     style={{ filter: 'drop-shadow(0 0 40px #ffffff)' }} 
                     initial={{ scale: 0.5, opacity: 0 }}
                     animate={{ scale: [1, 1.2, 0.9, 1.1], opacity: [1, 0.8, 1, 0.9] }}
                     transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
                  />
                  <motion.circle 
                     cx="100" cy="100" r={Math.max(5, boundaryRadius * 30)} 
                     fill="rgba(253, 224, 71, 0.9)" 
                     style={{ filter: 'drop-shadow(0 0 30px #fde047)' }} 
                     initial={{ scale: 0.5 }}
                     animate={{ scale: [1, 1.1, 1] }}
                     transition={{ duration: 0.3, repeat: Infinity, repeatType: "mirror" }}
                  />
                  
                  {/* Arc Core Lightning (Plasma) */}
                  <motion.path 
                     d="M95 85 L110 100 M110 85 L95 100 M100 80 L100 120 M80 100 L120 100" 
                     stroke="#ffffff" strokeWidth="6" strokeLinecap="round"
                     animate={{ rotate: [0, 90, 180, 270], scale: [1, 1.2, 0.8, 1.1] }}
                     transition={{ duration: 0.2, repeat: Infinity }}
                  />
                  
                  {/* Heat/Pressure waves (Arc Blast) expanding continuously */}
                  {[...Array(4)].map((_, i) => (
                    <motion.circle 
                      key={i}
                      cx="100" cy="100" r={10} 
                      fill="none" stroke="#f97316" strokeWidth={3} 
                      initial={{ r: boundaryRadius * 10, opacity: 1 }}
                      animate={{ r: boundaryRadius * 50 + i * 10, opacity: 0 }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: "easeOut" }}
                    />
                  ))}
                  
                  {/* Flying Shrapnel Particles */}
                  {[...Array(8)].map((_, i) => {
                    const angle = (i * 45) * (Math.PI / 180);
                    return (
                      <motion.circle
                        key={`spark-${i}`}
                        cx="100" cy="100" r={1.5}
                        fill="#fde047"
                        initial={{ cx: 100, cy: 100, opacity: 1 }}
                        animate={{ 
                          cx: 100 + Math.cos(angle) * (60 + Math.random() * 40), 
                          cy: 100 + Math.sin(angle) * (60 + Math.random() * 40), 
                          opacity: 0 
                        }}
                        transition={{ duration: 0.4 + Math.random() * 0.2, repeat: Infinity, ease: "easeOut" }}
                      />
                    )
                  })}
                  
                  <motion.text 
                     x="100" y="105" textAnchor="middle" fill="#000" fontSize="14" fontWeight="black" fontFamily="monospace"
                     animate={{ scale: [1, 1.1, 1] }}
                     transition={{ duration: 0.1, repeat: Infinity }}
                  >
                     GOOSE TRIP
                  </motion.text>
                </motion.g>
              )}
            </AnimatePresence>
         </svg>

         <div className="absolute top-4 right-4 text-[9px] font-mono tracking-widest text-slate-400 uppercase bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
           Target: Panel A
         </div>
      </div>

      <HazardOverlay 
        isActive={isSimulating}
        hazardType="arc_flash"
        dangerLevel={isPPESafe ? 'safe' : (incidentEnergy >= 40 ? 'critical' : 'warning')}
        magnitude={isPPESafe ? "Protected (0 cal/cm² received)" : `${incidentEnergy.toFixed(2)} cal/cm²`}
      />
    </motion.div>
  );
}
