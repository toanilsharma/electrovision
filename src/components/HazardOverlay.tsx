import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, AlertTriangle, Flame, HeartPulse, Zap } from 'lucide-react';

export type HazardType = 'ac_shock' | 'dc_shock' | 'arc_flash' | 'short_circuit' | 'earth_fault' | 'touch' | 'step';

interface HazardOverlayProps {
  isActive: boolean;
  hazardType: HazardType;
  dangerLevel: 'safe' | 'warning' | 'critical';
  magnitude?: string;
  intensity?: number;
}

export const HazardOverlay: React.FC<HazardOverlayProps> = ({ isActive, hazardType, dangerLevel, magnitude, intensity = 1.0 }) => {
  const [alertContainer, setAlertContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setAlertContainer(document.getElementById('alert-container'));
  }, []);

  const getHazardDetails = () => {
    switch (hazardType) {
      case 'ac_shock':
        if (dangerLevel === 'critical') return { icon: HeartPulse, title: "Deadly Shock", desc: "This amount of electricity can stop your heart and cause permanent damage." };
        return { icon: Zap, title: "Painful Shock", desc: "Your muscles will lock up. You might not be able to let go of the wire, making it hard to breathe." };
      case 'dc_shock': 
        if (dangerLevel === 'critical') return { icon: HeartPulse, title: "Deadly Shock", desc: "This massive shock can instantly stop your heart and cause deep burns inside your body." };
        return { icon: Zap, title: "Severe Burns", desc: "This will cause sudden, violent muscle jerks and severe burns." };
      case 'arc_flash': 
        if (dangerLevel === 'critical') return { icon: Skull, title: "Deadly Explosion", desc: "A huge fireball hotter than the sun. It can cause fatal burns and melt things instantly." };
        return { icon: Flame, title: "Severe Burns", desc: "An intense flash of heat that can easily set clothes on fire and cause deep burns." };
      case 'short_circuit': 
        return { icon: Flame, title: "Fire Danger", desc: "Too much electricity is flowing where it shouldn't, which can melt wires and start fires." };
      case 'earth_fault': 
        return { icon: AlertTriangle, title: "Deadly Touch", desc: "The outside of this machine has dangerous electricity on it. Touching it could be deadly." };
      case 'touch': 
        return { icon: HeartPulse, title: "Deadly Touch Shock", desc: "Touching this while electricity is flowing into the ground can send a deadly shock through your heart." };
      case 'step': 
        return { icon: AlertTriangle, title: "Ground Shock", desc: "Electricity is spreading through the ground. Standing here can send a dangerous shock up your legs." };
    }
  };

  const showOverlay = isActive && dangerLevel !== 'safe';

  useEffect(() => {
    if (showOverlay && dangerLevel === 'critical') {
      let osc: OscillatorNode;
      let gain: GainNode;
      let interval: any;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        osc = audioCtx.createOscillator();
        gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        
        let high = true;
        interval = setInterval(() => {
          const baseVol = 0.05 + (0.2 * intensity);
          if (high) {
            osc.frequency.setValueAtTime(800 + (200 * intensity), audioCtx.currentTime);
            gain.gain.setValueAtTime(baseVol, audioCtx.currentTime);
          } else {
            osc.frequency.setValueAtTime(600 + (200 * intensity), audioCtx.currentTime);
            gain.gain.setValueAtTime(baseVol, audioCtx.currentTime);
          }
          high = !high;
        }, Math.max(80, 200 - (100 * intensity)));
      } catch (e) {
        // audio context failed
      }
      return () => {
        if (interval) clearInterval(interval);
        try {
          if (gain) {
            gain.gain.setValueAtTime(0, gain.context.currentTime);
          }
          if (osc) {
            osc.stop();
          }
        } catch (e) {}
      };
    }
  }, [showOverlay, dangerLevel]);

  return (
    <>
      {/* Full screen innovative electric shock / arc flash visual environment */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div key="hazard-fullscreen" initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
          >
            {/* Flashing Hazard Vignette background */}
            <div className={`absolute inset-0 transition-opacity duration-200 ${dangerLevel === 'critical' ? 'bg-red-950/30' : 'bg-orange-950/20'}`} />
            
            {/* Pulsing Electric Arc Flash Edge Glow */}
            <motion.div animate={{ 
                opacity: [0.2, 0.7, 0.2],
                scale: [1, 1.01, 1] 
              }}
              transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}
              className={`absolute inset-0 shadow-[inset_0_0_120px_rgba(${dangerLevel === 'critical' ? '239,68,68' : '249,115,22'},0.6)]`} 
            />

            {/* Top & Bottom Electric Strobe Warning Bars */}
            <motion.div 
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.25 }}
              className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-400 to-red-500 shadow-[0_0_20px_#ef4444]"
            />
            <motion.div 
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.25 }}
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-400 to-red-500 shadow-[0_0_20px_#ef4444]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rock-Solid High-Contrast Stationary Alert Banner */}
      {alertContainer && createPortal(
        <AnimatePresence>
          {showOverlay && (() => {
            const { icon: Icon, title, desc } = getHazardDetails();
            return (
              <motion.div key="hazard-overlay-panel"
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="w-full pointer-events-auto"
              >
                <div 
                  className={`relative w-full rounded-2xl border-2 ${dangerLevel === 'critical' ? 'border-red-500 bg-slate-950/98 shadow-[0_12px_45px_rgba(220,38,38,0.8)] ring-2 ring-red-500/50' : 'border-orange-500 bg-slate-950/98 shadow-[0_12px_45px_rgba(249,115,22,0.7)] ring-2 ring-orange-500/50'} p-3 md:p-3.5 flex flex-row items-center gap-3.5 text-left overflow-hidden`}
                >
                  <motion.div animate={{ x: [0, -100, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute inset-0 opacity-[0.06] bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,#fff_15px,#fff_30px)]" 
                  />
                  
                  <div className="flex-shrink-0 relative z-10 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-inner">
                    <motion.div animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.4 }}
                    >
                      <Icon className={`w-8 h-8 md:w-9 md:h-9 ${dangerLevel === 'critical' ? 'text-red-400' : 'text-orange-400'} drop-shadow-[0_0_18px_currentColor]`} />
                    </motion.div>
                  </div>
                  
                  <div className="flex-1 relative z-10 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <h1 className={`text-base sm:text-lg md:text-xl font-black uppercase tracking-wider ${dangerLevel === 'critical' ? 'text-yellow-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]' : 'text-orange-400'} drop-shadow-md leading-none`}>
                        {title}
                      </h1>
                      {magnitude && (
                        <span className={`text-xs md:text-sm font-mono font-black px-2.5 py-1 rounded-lg bg-black/90 border border-amber-400/60 text-amber-300 shadow-sm whitespace-nowrap`}>
                          ⚡ {magnitude}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs sm:text-sm text-slate-100 font-bold leading-relaxed drop-shadow-sm">
                      {desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        alertContainer
      )}
    </>
  );
};
