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
  currentMA,
  voltage,
  className
}) => {
  if (!isSimulating) return null;

  const getBannerDetails = () => {
    if (isPPESafe) {
      return {
        icon: ShieldCheck,
        title: '🛡️ 100% PROTECTED BY RUBBER GLOVES',
        desc: 'Insulating gloves stopped electricity from entering your body.',
        style: 'border-emerald-500 bg-emerald-950/95 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
      };
    }

    if (level >= 7) {
      return {
        icon: Skull,
        title: '🚨 DANGEROUS SHOCK — HEART CAN STOP!',
        desc: `This strong shock (${currentMA.toFixed(1)}mA at ${voltage}V) can stop your heart in seconds and cause deep burns!`,
        style: 'border-red-500 bg-red-950/95 text-white shadow-[0_0_30px_rgba(239,68,68,0.9)] ring-2 ring-red-500/60 animate-pulse'
      };
    }

    if (level >= 3) {
      return {
        icon: AlertTriangle,
        title: '⚠️ YOU CANNOT LET GO OF THE WIRE!',
        desc: `Electric current (${currentMA.toFixed(1)}mA) has locked your hand muscles tight. You cannot open your hands!`,
        style: 'border-amber-500 bg-amber-950/95 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.7)] ring-2 ring-amber-400/60'
      };
    }

    return {
      icon: Zap,
      title: '⚡ ELECTRIC TINGLE PERCEIVED',
      desc: `You feel a mild buzzing sensation (${currentMA.toFixed(1)}mA) in your fingers.`,
      style: 'border-yellow-500 bg-slate-950/95 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
    };
  };

  const { icon: Icon, title, desc, style } = getBannerDetails();

  return (
    <div aria-live="assertive" aria-atomic="true" className={cn('w-full shrink-0', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${isPPESafe}-${level}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.1 }}
          className={cn(
            'w-full p-2 sm:p-2.5 rounded-xl border-2 flex items-center justify-between gap-3 text-left transition-all select-none shadow-xl',
            style
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-black/60 shrink-0 border border-white/10">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-amber-300 drop-shadow" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-sans font-black uppercase text-xs sm:text-sm tracking-wider text-white drop-shadow leading-tight truncate">
                {title}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-amber-100/95 truncate leading-tight mt-0.5">
                {desc}
              </span>
            </div>
          </div>

          {!isPPESafe && (
            <span className="text-xs sm:text-sm font-mono font-black px-2 py-1 rounded-lg bg-black/90 border border-amber-400 text-amber-300 shrink-0 shadow">
              ⚡ {currentMA.toFixed(1)} mA
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
