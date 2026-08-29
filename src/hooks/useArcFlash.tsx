import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function useArcFlash() {
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const triggerArcFlash = useCallback(() => {
    setIsFlashing(true);
    const timer = setTimeout(() => {
      setIsFlashing(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const ArcFlashOverlay: React.FC = () => (
    <AnimatePresence>
      {isFlashing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 pointer-events-none mix-blend-screen overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.98) 0%, rgba(254,240,138,0.85) 45%, rgba(239,68,68,0.4) 75%, transparent 100%)'
          }}
        />
      )}
    </AnimatePresence>
  );

  return {
    triggerArcFlash,
    ArcFlashOverlay
  };
}
