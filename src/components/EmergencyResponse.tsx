import React, { useState, useEffect } from 'react';
import { AlertCircle, Phone, HeartPulse, ShieldAlert, Skull, Flame, Zap, Ambulance, Play, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

const playMetronomeTick = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch brief tick
    
    gain.connect(audioCtx.destination);
    osc.connect(gain);
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime); // Low volume
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); // Fade out very fast (50ms)
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  } catch (e) {
    // Audio Context not started or supported
  }
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
  const [hookUsed, setHookUsed] = useState(false);
  const [emergencyCalled, setEmergencyCalled] = useState(false);
  const [metronomeFlash, setMetronomeFlash] = useState(false);
  
  // CPR rhythm state
  const [cprSuccesses, setCprSuccesses] = useState<number>(0);
  const [lastCprTime, setLastCprTime] = useState<number>(0);
  const [cprBpm, setCprBpm] = useState<number>(0);
  const [cprFeedback, setCprFeedback] = useState<string>('Ready');

  // Metronome effect for CPR rhythm guide
  useEffect(() => {
    if (drillActive && drillStep === 4) {
      const interval = setInterval(() => {
        setMetronomeFlash(prev => {
          const next = !prev;
          if (next) {
            playMetronomeTick();
          }
          return next;
        });
      }, 272); // Toggles state every 272ms, giving a full cycle of 545ms (110 BPM)
      return () => clearInterval(interval);
    } else {
      setMetronomeFlash(false);
    }
  }, [drillActive, drillStep]);

  // Automatically trigger drill visibility when simulation registers a live incident
  useEffect(() => {
    if (isSimulating) {
      setDrillActive(true);
      // Reset state of the drill on new simulation
      setDrillStep(1);
      setIsPowerDisconnected(false);
      setHookUsed(false);
      setEmergencyCalled(false);
      setCprSuccesses(0);
      setLastCprTime(0);
      setCprBpm(0);
      setCprFeedback('Ready');
    }
  }, [isSimulating]);

  // CPR rhythm evaluation
  const handleCprCompress = () => {
    const now = Date.now();
    if (lastCprTime === 0) {
      setLastCprTime(now);
      setCprFeedback('Compression started! Maintain 100-120 BPM.');
      return;
    }

    const intervalMs = now - lastCprTime;
    const currentBpm = Math.round(60000 / intervalMs);
    setCprBpm(currentBpm);
    setLastCprTime(now);

    // Standard CPR rhythm: 100 to 120 bpm (500 to 600 ms interval)
    if (currentBpm >= 100 && currentBpm <= 125) {
      setCprSuccesses(prev => {
        const next = prev + 1;
        if (next >= 10) {
          setCprFeedback('EXCELLENT! Heart rhythm stabilized.');
          setTimeout(() => setDrillStep(5), 1000); // go to success
        } else {
          setCprFeedback(`Perfect rhythm! Keep it up (${next}/10)`);
        }
        return next;
      });
    } else if (currentBpm < 100) {
      setCprFeedback('TOO SLOW! Push faster (target: 100-120 BPM).');
    } else {
      setCprFeedback('TOO FAST! Slow down slightly (target: 100-120 BPM).');
    }
  };

  return (
    <div className="mt-1 w-full shrink-0">
      <AnimatePresence mode="wait">
        {drillActive && hasSimulated && (
          <motion.div
            key="emergency-rescue-drill"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-2.5 md:p-3 border border-red-500/40 rounded-xl bg-slate-950/90 shadow-[0_10px_30px_rgba(239,68,68,0.15)] flex flex-col gap-2"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[10px] font-black tracking-widest text-red-500 flex items-center gap-1.5 uppercase">
                <Skull className="w-4 h-4 animate-pulse" /> Active Safety Rescue Drill
              </span>
              <span className="text-[8px] font-mono bg-red-950 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded">
                STEP {drillStep} OF 5
              </span>
            </div>

            {/* Step Content */}
            <div className="min-h-[70px] flex flex-col justify-center">
              
              {/* Step 1: Isolate / De-energize */}
              {drillStep === 1 && (
                <div className="space-y-2 text-left">
                  <h4 className="text-[11px] font-bold text-white uppercase flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" /> Step 1: Isolate Live Energy Source
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-mono">
                    The victim is frozen in contact with a live line. Touching them directly is fatal. You must isolate or de-energize the breaker first!
                  </p>
                  <button
                    onClick={() => {
                      setIsPowerDisconnected(true);
                      setDrillStep(2);
                    }}
                    className="mt-1 px-3 py-1.5 bg-red-500 text-slate-900 font-bold text-[10px] tracking-wider uppercase rounded hover:bg-red-400 transition-colors"
                  >
                    Disconnect Main Breaker Switch
                  </button>
                </div>
              )}

              {/* Step 2: Safety Rescue Hook */}
              {drillStep === 2 && (
                <div className="space-y-2 text-left">
                  <h4 className="text-[11px] font-bold text-white uppercase flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-400" /> Step 2: Deploy Dielectric Rescue Hook
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-mono">
                    Use an insulated high-voltage Safety Rescue Hook to physically pull the victim clear of the terminal enclosure.
                  </p>
                  <button
                    onClick={() => {
                      setHookUsed(true);
                      setDrillStep(3);
                    }}
                    className="mt-1 px-3 py-1.5 bg-blue-500 text-slate-900 font-bold text-[10px] tracking-wider uppercase rounded hover:bg-blue-400 transition-colors"
                  >
                    Deploy Rescue Hook & Pull Victim Clear
                  </button>
                </div>
              )}

              {/* Step 3: Call Medical Dispatch */}
              {drillStep === 3 && (
                <div className="space-y-2 text-left">
                  <h4 className="text-[11px] font-bold text-white uppercase flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-orange-400" /> Step 3: Initiate Dispatch Contact
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-mono">
                    Call 911/112 immediately. Inform the emergency dispatcher: <span className="text-white">"Electrical shock incident, victim is unresponsive."</span>
                  </p>
                  <button
                    onClick={() => {
                      setEmergencyCalled(true);
                      setDrillStep(4);
                    }}
                    className="mt-1 px-3 py-1.5 bg-orange-500 text-slate-900 font-bold text-[10px] tracking-wider uppercase rounded hover:bg-orange-400 transition-colors flex items-center gap-1.5"
                  >
                    <Ambulance className="w-3.5 h-3.5" /> Call Emergency Medical Services (911)
                  </button>
                </div>
              )}

              {/* Step 4: Administer CPR */}
              {drillStep === 4 && (
                <div className="space-y-2 text-left">
                  <h4 className="text-[11px] font-bold text-white uppercase flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Step 4: Administer Heart CPR (100-120 BPM)
                  </h4>
                  <p className="text-[9.5px] text-slate-400 leading-tight font-mono">
                    Tap the CPR pad repeatedly. You must hit 10 consecutive compressions within the critical life-saving rhythm (100 to 120 beats per minute).
                  </p>
                  
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={handleCprCompress}
                      className="px-3 py-2 bg-rose-500 text-slate-900 font-black text-[10px] tracking-widest uppercase rounded-lg hover:bg-rose-400 active:scale-95 transition-all flex items-center gap-1.5 select-none"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" /> COMPRESS CPR PAD
                    </button>

                    {/* Rhythmic Metronome Indicator (110 BPM) */}
                    <div className="flex flex-col items-center justify-center p-1 border border-white/5 rounded-lg bg-slate-900/60 shrink-0 w-11 text-center select-none">
                      <span className="text-[6px] text-slate-500 font-mono block uppercase leading-none">RHYTHM</span>
                      <div className={cn(
                        "w-3.5 h-3.5 rounded-full mt-1 transition-all duration-75", 
                        metronomeFlash 
                          ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)] scale-110" 
                          : "bg-green-950 scale-95"
                      )} />
                      <span className="text-[6px] text-green-400 font-mono mt-0.5 block leading-none">110 BPM</span>
                    </div>

                    <div className="flex-1 px-2.5 py-1 border border-white/5 rounded-lg bg-slate-900/80 font-mono text-[9px]">
                      <div className="flex justify-between">
                        <span>Rhythm BPM: <strong className={cn(cprBpm >= 100 && cprBpm <= 125 ? "text-green-400" : "text-yellow-500")}>{cprBpm || '--'}</strong></span>
                        <span>Progress: <strong className="text-white">{cprSuccesses}/10</strong></span>
                      </div>
                      <p className="text-[8px] text-slate-400 mt-0.5 truncate">{cprFeedback}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Successful Rescue Certification */}
              {drillStep === 5 && (
                <div className="space-y-1.5 text-left">
                  <h4 className="text-[11px] font-bold text-green-400 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Safety Rescue Successful!
                  </h4>
                  <p className="text-[9.5px] text-slate-400 leading-normal font-mono">
                    Congratulations! You correctly isolated the hazard, pulled the victim clear using non-conductive safety equipment, notified dispatch, and administered professional-grade CPR in perfect coordination. You are certified for emergency shock rescue!
                  </p>
                  <button
                    onClick={() => {
                      setDrillActive(false);
                    }}
                    className="px-3 py-1 bg-green-500 text-slate-900 font-bold text-[10px] tracking-wider uppercase rounded hover:bg-green-400 transition-colors"
                  >
                    Complete Rescue Academy Session
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {!drillActive && hasSimulated && (
          <motion.div
            key="passive-drill-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 border border-green-500/20 rounded-xl bg-green-500/5 text-left font-mono text-[9px] text-slate-300 leading-relaxed flex justify-between items-center"
          >
            <span>
              <strong className="text-green-400 uppercase">Interactive Session Complete:</strong> You successfully ran the safety rescue drill! Return to normal parameters or restart the drill.
            </span>
            <button
              onClick={() => {
                setDrillActive(true);
                setDrillStep(1);
              }}
              className="px-2 py-1 border border-green-500/50 rounded bg-green-500/20 text-green-400 hover:bg-green-500 text-[8px] font-bold uppercase shrink-0 ml-2"
            >
              Restart Drill
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
