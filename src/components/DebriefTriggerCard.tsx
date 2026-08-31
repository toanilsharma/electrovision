import React from 'react';
import { motion } from 'motion/react';
import { Award, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface DebriefTriggerCardProps {
  onOpen: () => void;
  hasSimulated: boolean;
  isSimulating?: boolean;
  variant?: 'floating' | 'embedded';
  className?: string;
}

export function DebriefTriggerCard({ 
  onOpen, 
  hasSimulated, 
  isSimulating,
  variant = 'embedded',
  className
}: DebriefTriggerCardProps) {
  // ONLY show AFTER shock has completed/stopped, and NEVER while shock is active or before simulation!
  if (!hasSimulated || isSimulating) return null;

  if (variant === 'embedded') {
    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpen}
        className={cn(
          "w-full mt-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-2 border-amber-500/60 hover:border-amber-400 text-left transition-all cursor-pointer flex items-center justify-between gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] group select-none shrink-0",
          className
        )}
        title="Click to view detailed engineering debrief and learnings"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 leading-none mb-0.5">
              IEC 60479-1 ANALYSIS READY
            </span>
            <span className="text-xs font-black text-white uppercase tracking-wider group-hover:text-amber-200 truncate leading-tight">
              Show Me The Debrief & Learnings
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onOpen}
      className={cn(
        "fixed bottom-16 left-4 z-40 flex items-center gap-3 p-2.5 sm:p-3 bg-slate-950/95 backdrop-blur-md border-2 border-amber-500/60 hover:border-amber-400 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.35)] cursor-pointer text-left group max-w-[270px] sm:max-w-xs transition-all select-none",
        className
      )}
      title="Click to view detailed engineering debrief and learnings"
    >
      <div className="relative flex items-center justify-center p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 group-hover:bg-amber-500/30 shrink-0">
        <Award className="w-5 h-5 text-amber-400" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
          <span>IEC 60479-1 ANALYSIS</span>
          <span className="text-slate-400">• Ready</span>
        </span>
        <span className="text-xs font-black text-white uppercase tracking-wider group-hover:text-amber-200 truncate">
          Show Me The Debrief & Learnings
        </span>
        <span className="text-[9.5px] font-mono text-slate-300 truncate mt-0.5">
          Click to view engineering analysis
        </span>
      </div>

      <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </motion.button>
  );
}
