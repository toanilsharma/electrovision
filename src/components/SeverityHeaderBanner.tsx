import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Skull, Zap, AlertTriangle } from 'lucide-react';
import { ShockEffectLevel } from '../types';
import { cn } from '@/src/lib/utils';

interface SeverityHeaderBannerProps {
  isSimulating: boolean;
  isPPESafe: boolean;
  level: ShockEffectLevel;
  severity: string;
  currentMA: number;
  voltage: number;
  className?: string;
}

export const SeverityHeaderBanner: React.FC<SeverityHeaderBannerProps> = ({
  isSimulating,
  isPPESafe,
  level,
  severity,
  currentMA,
  voltage,
  className
}) => {
  // Remove standby banner completely when not simulating!
  if (!isSimulating) return null;

  const getBannerDetails = () => {
    if (isPPESafe) {
      return {
        icon: ShieldCheck,
        title: '🛡️ 100% PPE INSULATED & PROTECTED',
        desc: 'Class 0 gloves isolated prospective current flow.',
        style: 'border-emerald-500 bg-emerald-950/95 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
      };
    }

    if (level >= 7) {
      return {
        icon: Skull,
        title: '🚨 CRITICAL: LETHAL VENTRICULAR FIBRILLATION',
        desc: `${severity} — ${currentMA.toFixed(1)}mA at ${voltage}V exceeds C2 V-fib threshold! Fatal in seconds!`,
        style: 'border-red-500 bg-red-950/95 text-white shadow-[0_0_40px_rgba(239,68,68,0.95)] ring-4 ring-red-500/60 animate-pulse'
      };
    }

    if (level >= 3) {
      return {
        icon: AlertTriangle,
        title: '⚠️ WARNING: MUSCLE TETANIZATION (>10mA)',
        desc: `${severity} — Hand flexor muscles tetanized! Victim locked to conductor!`,
        style: 'border-amber-500 bg-amber-950/95 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.7)] ring-2 ring-amber-400/60'
      };
    }

    return {
      icon: Zap,
      title: '⚡ PERCEPTION THRESHOLD EXCEEDED (>0.5mA)',
      desc: `${severity} (${currentMA.toFixed(1)}mA perceived flow)`,
      style: 'border-yellow-500 bg-slate-950/95 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.5)]'
    };
  };

  const { icon: Icon, title, desc, style } = getBannerDetails();

  return (
    <div aria-live="assertive" aria-atomic="true" className={cn('w-full shrink-0', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${isPPESafe}-${level}`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.12 }}
          className={cn(
            'w-full p-3.5 sm:p-4.5 rounded-2xl border-3 flex items-center justify-between gap-4 text-left transition-all select-none shadow-2xl',
            style
          )}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-black/60 shrink-0 border border-white/10">
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-amber-300 drop-shadow-lg" />
            </div>

            <div className="flex flex-col min-w-0 space-y-0.5">
              <span className="font-sans font-black uppercase text-sm sm:text-base md:text-lg tracking-wider text-white drop-shadow-md leading-none truncate">
                {title}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-100/95 truncate leading-tight mt-0.5 tracking-wide">
                {desc}
              </span>
            </div>
          </div>

          {!isPPESafe && (
            <span className="text-xs sm:text-base font-mono font-black px-3 py-1.5 rounded-xl bg-black/90 border-2 border-amber-400 text-amber-300 shrink-0 shadow-lg">
              ⚡ {currentMA.toFixed(1)} mA
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
