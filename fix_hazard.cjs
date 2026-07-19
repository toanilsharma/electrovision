const fs = require('fs');
let file = 'src/components/HazardOverlay.tsx';
let content = fs.readFileSync(file, 'utf8');

content = `import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, AlertTriangle, Flame, HeartPulse, Zap } from 'lucide-react';

export type HazardType = 'ac_shock' | 'dc_shock' | 'arc_flash' | 'short_circuit' | 'earth_fault' | 'touch' | 'step';

interface HazardOverlayProps {
  isActive: boolean;
  hazardType: HazardType;
  dangerLevel: 'safe' | 'warning' | 'critical';
  magnitude?: string;
}

export const HazardOverlay: React.FC<HazardOverlayProps> = ({ isActive, hazardType, dangerLevel, magnitude }) => {
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

  return (
    <>
      {/* Full screen visual effects */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
          >
            <div className={\`absolute inset-0 \${dangerLevel === 'critical' ? 'bg-red-900/20' : 'bg-orange-900/10'}\`} />
            <motion.div 
              animate={{ 
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.02, 1] 
              }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className={\`absolute inset-0 shadow-[inset_0_0_150px_rgba(\${dangerLevel === 'critical' ? '220,38,38' : '249,115,22'},0.5)]\`} 
            />
            {/* Screen Shake effect on the body, handled via standard CSS animation class injected if critical */}
            {dangerLevel === 'critical' && (
              <style dangerouslySetInnerHTML={{__html: \`
                body { animation: screen-shake 0.4s cubic-bezier(.36,.07,.19,.97) both infinite; }
                @keyframes screen-shake {
                  0%, 100% { transform: translate3d(0, 0, 0); }
                  10%, 30%, 50%, 70%, 90% { transform: translate3d(-4px, 0, 0); }
                  20%, 40%, 60%, 80% { transform: translate3d(4px, 0, 0); }
                }
              \`}} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Banner */}
      {alertContainer && createPortal(
        <AnimatePresence>
          {showOverlay && (() => {
            const { icon: Icon, title, desc } = getHazardDetails();
            return (
              <motion.div
                key="hazard-overlay-panel"
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-full pointer-events-auto"
              >
                <div 
                  className={\`relative w-full rounded-2xl border \${dangerLevel === 'critical' ? 'border-red-500 bg-red-950/95 shadow-[0_10px_40px_rgba(220,38,38,0.6)]' : 'border-orange-500 bg-orange-950/95 shadow-[0_10px_40px_rgba(249,115,22,0.5)]'} p-3 md:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left overflow-hidden\`}
                >
                  <motion.div 
                    animate={{ x: [0, -100, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute inset-0 opacity-[0.08] bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,#fff_15px,#fff_30px)]" 
                  />
                  <div className="flex-shrink-0 relative z-10">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <Icon className={\`w-8 h-8 md:w-10 md:h-10 \${dangerLevel === 'critical' ? 'text-red-500' : 'text-orange-500'} drop-shadow-[0_0_20px_currentColor]\`} />
                    </motion.div>
                  </div>
                  
                  <div className="flex-1 relative z-10 flex flex-col gap-1">
                    <h1 className={\`text-base md:text-lg font-black uppercase tracking-tighter \${dangerLevel === 'critical' ? 'text-red-500' : 'text-orange-500'} drop-shadow-[0_2px_8px_rgba(0,0,0,1)] leading-tight\`}>
                      {title}
                    </h1>
                    
                    <p className="text-xs md:text-sm text-white font-bold leading-snug drop-shadow-md">
                      {desc}
                    </p>
                    
                    {magnitude && (
                      <div className="inline-flex flex-col mt-1 bg-black/60 px-3 py-1 rounded-lg border border-white/20 w-fit self-center sm:self-start">
                        <div className="text-[8px] text-white/70 font-black tracking-widest uppercase mb-0.5">Magnitude</div>
                        <div className={\`text-xs md:text-sm font-mono \${dangerLevel === 'critical' ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,1)]' : 'text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,1)]'} font-black whitespace-nowrap\`}>
                          {magnitude}
                        </div>
                      </div>
                    )}
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
`
fs.writeFileSync(file, content);
console.log("Done");
