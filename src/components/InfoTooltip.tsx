import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function InfoTooltip({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center gap-1 cursor-help" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <Info className="w-3 h-3 text-sky-400 opacity-70 hover:opacity-100 transition-opacity" />
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl z-50 pointer-events-none"
          >
            <h4 className="text-[10px] font-black tracking-widest uppercase text-sky-400 mb-1">{title}</h4>
            <p className="text-xs text-slate-300 font-normal leading-relaxed">{description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
