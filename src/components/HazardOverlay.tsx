import React, { useEffect } from 'react';
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
  const getHazardDetails = () => {
    switch (hazardType) {
      case 'ac_shock':
        if (dangerLevel === 'critical') return { icon: HeartPulse, title: "Deadly Shock", desc: "This strong electricity can stop your heart in seconds!" };
        return { icon: Zap, title: "Painful Shock", desc: "Your hand muscles lock tight and you cannot let go of the wire!" };
      case 'dc_shock': 
        if (dangerLevel === 'critical') return { icon: HeartPulse, title: "Deadly DC Shock", desc: "This huge shock can stop your heart and cause deep heat burns inside your body!" };
        return { icon: Zap, title: "Severe DC Shock", desc: "Causes violent muscle spasms and painful burns!" };
      case 'arc_flash': 
        if (dangerLevel === 'critical') return { icon: Skull, title: "Deadly Fireball", desc: "A blinding explosion hotter than the sun! It melts things instantly!" };
        return { icon: Flame, title: "Severe Heat Flash", desc: "Intense heat that can set clothes on fire and burn skin!" };
      case 'short_circuit': 
        return { icon: Flame, title: "Fire Hazard", desc: "Too much electricity is shorting, which can melt wires and start a fire!" };
      case 'earth_fault': 
        return { icon: AlertTriangle, title: "Dangerous Machine Touch", desc: "The metal body of this machine is live with electricity! Touching it is dangerous!" };
      case 'touch': 
        return { icon: HeartPulse, title: "Deadly Touch Shock", desc: "Touching this live metal can send electricity right through your heart!" };
      case 'step': 
        return { icon: AlertTriangle, title: "Ground Electricity", desc: "Electricity is flowing through the ground. Stepping here sends shock up your legs!" };
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
          const baseVol = 0.04 + (0.15 * intensity);
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
      {/* Full screen electric shock / arc flash edge visual effects */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div key="hazard-fullscreen" initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
          >
            {/* Flashing Hazard Vignette background */}
            <div className={`absolute inset-0 transition-opacity duration-200 ${dangerLevel === 'critical' ? 'bg-red-950/20' : 'bg-orange-950/15'}`} />
            
            {/* Pulsing Electric Arc Flash Edge Glow */}
            <motion.div animate={{ 
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.01, 1] 
              }}
              transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}
              className={`absolute inset-0 shadow-[inset_0_0_90px_rgba(${dangerLevel === 'critical' ? '239,68,68' : '249,115,22'},0.5)]`} 
            />

            {/* Top & Bottom Electric Strobe Warning Bars */}
            <motion.div 
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.25 }}
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-400 to-red-500 shadow-[0_0_15px_#ef4444]"
            />
            <motion.div 
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.25 }}
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-400 to-red-500 shadow-[0_0_15px_#ef4444]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
