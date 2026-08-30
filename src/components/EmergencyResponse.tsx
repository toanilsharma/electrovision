import React, { useState, useEffect } from 'react';
import { AlertCircle, Phone, HeartPulse, ShieldAlert, Skull, Flame, Zap, Ambulance, Play, ArrowRight, ShieldCheck, Heart, Droplets, Shield, Thermometer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

const playMetronomeTick = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    
    gain.connect(audioCtx.destination);
    osc.connect(gain);
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  } catch (e) {}
};

interface EmergencyResponseProps {
  isSimulating: boolean;
  type: 'shock' | 'arc_flash' | 'step_touch' | 'short_circuit' | 'earth_fault';
  hasSimulated: boolean;
}

export function EmergencyResponse({ isSimulating, type, hasSimulated }: EmergencyResponseProps) {
  const [drillActive, setDrillActive] = useState(false);
  const [drillStep, setDrillStep] = useState<number>(1);
  const [isPowerDisconnected, setIsPowerDisconnected] = useState(false);
  const [emergencyCalled, setEmergencyCalled] = useState(false);
  const [coolingWaterApplied, setCoolingWaterApplied] = useState(false);
  const [burnCovered, setBurnCovered] = useState(false);
  
  // CPR rhythm state for shock drills
  const [cprSuccesses, setCprSuccesses] = useState<number>(0);
  const [lastCprTime, setLastCprTime] = useState<number>(0);
  const [cprBpm, setCprBpm] = useState<number>(0);
  const [cprFeedback, setCprFeedback] = useState<string>('Ready');

  useEffect(() => {
    if (isSimulating) {
      setDrillActive(true);
      setDrillStep(1);
      setIsPowerDisconnected(false);
      setEmergencyCalled(false);
      setCoolingWaterApplied(false);
      setBurnCovered(false);
      setCprSuccesses(0);
      setLastCprTime(0);
      setCprBpm(0);
      setCprFeedback('Ready');
    }
  }, [isSimulating]);

  const isArcFlash = type === 'arc_flash';

  return (
    <div className="mt-1 w-full shrink-0 font-mono">
      <AnimatePresence mode="wait">
        {drillActive && hasSimulated && (
          <motion.div
            key="emergency-rescue-drill"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 border border-red-500/40 rounded-xl bg-slate-950/90 shadow-[0_10px_30px_rgba(239,68,68,0.15)] flex flex-col gap-2.5 text-xs"
          >
            {/* Drill Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs font-black tracking-widest text-red-400 flex items-center gap-1.5 uppercase">
                <Flame className="w-4 h-4 animate-pulse text-orange-400" />
                {isArcFlash ? 'NFPA 70E Arc Thermal Burn Rescue Drill' : 'Active Safety Rescue Drill'}
              </span>
              <span className="text-xs font-mono bg-red-950 border border-red-500/30 text-red-300 px-2 py-0.5 rounded font-bold">
                STEP {drillStep} OF 5
              </span>
            </div>

            {/* Step Content */}
            <div className="min-h-[90px] flex flex-col justify-center">
              
              {/* ARC FLASH RESCUE STEPS */}
              {isArcFlash ? (
                <>
                  {/* Step 1: Isolate & De-energize */}
                  {drillStep === 1 && (
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-yellow-400" /> Step 1: Isolate Breaker &amp; Verify Zero Energy
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        Verify power isolation before approaching switchgear. Never enter an active blast zone without de-energizing!
                      </p>
                      <button
                        onClick={() => {
                          setIsPowerDisconnected(true);
                          setDrillStep(2);
                        }}
                        className="mt-1 px-3 py-2 bg-red-500 text-slate-950 font-black text-xs tracking-wider uppercase rounded-lg hover:bg-red-400 transition-colors cursor-pointer min-h-[44px]"
                      >
                        Verify Power Isolation &amp; Enter Safely
                      </button>
                    </div>
                  )}

                  {/* Step 2: Call Emergency Medical Services */}
                  {drillStep === 2 && (
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-orange-400" /> Step 2: Call EMS &amp; Report Thermal Trauma
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        Call 911 / EMS immediately. Report: <strong className="text-white">"Arc flash explosion, severe thermal burns &amp; blast shock."</strong>
                      </p>
                      <button
                        onClick={() => {
                          setEmergencyCalled(true);
                          setDrillStep(3);
                        }}
                        className="mt-1 px-3 py-2 bg-orange-500 text-slate-950 font-black text-xs tracking-wider uppercase rounded-lg hover:bg-orange-400 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                      >
                        <Ambulance className="w-4 h-4" /> Call EMS (911) &amp; Dispatch Burn Unit
                      </button>
                    </div>
                  )}

                  {/* Step 3: Cool Thermal Burns (20 min running water, NO ice) */}
                  {drillStep === 3 && (
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 text-sky-400" /> Step 3: Cool Burns (20 Min Cool Water — NO Ice)
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        Apply cool running water for 20 minutes. <strong className="text-red-400 font-bold">NEVER apply ice or peel melted clothing adhered to skin!</strong>
                      </p>
                      <button
                        onClick={() => {
                          setCoolingWaterApplied(true);
                          setDrillStep(4);
                        }}
                        className="mt-1 px-3 py-2 bg-sky-500 text-slate-950 font-black text-xs tracking-wider uppercase rounded-lg hover:bg-sky-400 transition-colors cursor-pointer min-h-[44px]"
                      >
                        Apply 20 Min Cool Running Water (No Ice)
                      </button>
                    </div>
                  )}

                  {/* Step 4: Cover Wounds Loosely */}
                  {drillStep === 4 && (
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-400" /> Step 4: Cover Wounds Loosely With Sterile Cloth
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        Cover thermal burn wounds loosely with clean, non-adherent sterile dressing to prevent infection.
                      </p>
                      <button
                        onClick={() => {
                          setBurnCovered(true);
                          setDrillStep(5);
                        }}
                        className="mt-1 px-3 py-2 bg-emerald-500 text-slate-950 font-black text-xs tracking-wider uppercase rounded-lg hover:bg-emerald-400 transition-colors cursor-pointer min-h-[44px]"
                      >
                        Cover Burns Loosely With Sterile Dressings
                      </button>
                    </div>
                  )}

                  {/* Step 5: Treat Shock & Complete Certification */}
                  {drillStep === 5 && (
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-bold text-green-400 uppercase flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Arc Flash Rescue Certified!
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        You verified energy isolation, contacted EMS burn units, cooled burns safely without ice or garment peeling, covered wounds, and treated patient for shock. Session certified!
                      </p>
                      <button
                        onClick={() => setDrillActive(false)}
                        className="px-3 py-2 bg-green-500 text-slate-950 font-black text-xs tracking-wider uppercase rounded-lg hover:bg-green-400 transition-colors cursor-pointer min-h-[44px]"
                      >
                        Complete Rescue Academy Session
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* SHOCK RESCUE STEPS (Standard) */
                <>
                  {drillStep === 1 && (
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-yellow-400" /> Step 1: Isolate Live Energy Source
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        The victim is frozen in contact with a live line. Disconnect main power before touching!
                      </p>
                      <button
                        onClick={() => {
                          setIsPowerDisconnected(true);
                          setDrillStep(2);
                        }}
                        className="mt-1 px-3 py-2 bg-red-500 text-slate-950 font-black text-xs tracking-wider uppercase rounded-lg hover:bg-red-400 transition-colors cursor-pointer min-h-[44px]"
                      >
                        Disconnect Main Breaker Switch
                      </button>
                    </div>
                  )}
                  {/* Step 5 Certification for Shock */}
                  {drillStep === 5 && (
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-bold text-green-400 uppercase flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Shock Rescue Certified!
                      </h4>
                      <button
                        onClick={() => setDrillActive(false)}
                        className="px-3 py-2 bg-green-500 text-slate-950 font-black text-xs tracking-wider uppercase rounded-lg hover:bg-green-400 transition-colors cursor-pointer min-h-[44px]"
                      >
                        Complete Rescue Academy Session
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>
          </motion.div>
        )}

        {!drillActive && hasSimulated && (
          <motion.div
            key="passive-drill-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 border border-green-500/30 rounded-xl bg-green-500/10 text-left font-mono text-xs text-slate-200 leading-relaxed flex justify-between items-center"
          >
            <span>
              <strong className="text-green-400 uppercase">Rescue Session Complete:</strong> You executed the NFPA 70E Arc Rescue Drill!
            </span>
            <button
              onClick={() => {
                setDrillActive(true);
                setDrillStep(1);
              }}
              className="px-3 py-1.5 border border-green-500/50 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500 hover:text-slate-950 text-xs font-bold uppercase shrink-0 ml-2 cursor-pointer min-h-[36px]"
            >
              Restart Drill
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
