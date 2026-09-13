import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { MCBState, TripCause } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { ShieldAlert, Zap, Flame, Clock } from 'lucide-react';

interface GSAPTripVerdictStampProps {
  state: MCBState;
  tripCause: TripCause;
  clearingTimeMs?: number;
  multiplier?: number;
  className?: string;
}

export const GSAPTripVerdictStamp: React.FC<GSAPTripVerdictStampProps> = ({
  state,
  tripCause,
  clearingTimeMs = 8.5,
  multiplier = 1.0,
  className
}) => {
  const stampRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const isTripped = state !== MCBState.CLOSED;

  // Format Stamp Verdict Message
  const verdictText = React.useMemo(() => {
    if (tripCause === TripCause.MAGNETIC) {
      return 'TRIPPED — MAGNETIC <10 ms';
    }
    if (tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE) {
      return `TRIPPED — MAGNETIC TOLERANCE (${multiplier.toFixed(1)}x In)`;
    }
    if (tripCause === TripCause.THERMAL) {
      if (clearingTimeMs >= 1000) {
        return `TRIPPED — THERMAL ${(clearingTimeMs / 1000).toFixed(1)} s`;
      }
      return `TRIPPED — THERMAL ${clearingTimeMs.toFixed(1)} ms`;
    }
    return `TRIPPED (${tripCause})`;
  }, [tripCause, clearingTimeMs, multiplier]);

  // GSAP Stamp Slam + Shockwave + Panel Shake Animation
  useEffect(() => {
    if (!isTripped || !stampRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reset initial states
    gsap.killTweensOf([stampRef.current, ringRef.current]);

    const tl = gsap.timeline();

    if (!prefersReducedMotion) {
      // 1. Rubber Stamp Slam
      tl.fromTo(
        stampRef.current,
        { scale: 2.8, opacity: 0, rotation: -12 },
        { scale: 1.0, opacity: 1, rotation: -4, duration: 0.35, ease: 'back.out(2.2)' }
      );

      // 2. Shockwave Ring Expansion
      if (ringRef.current) {
        tl.fromTo(
          ringRef.current,
          { scale: 0.8, opacity: 0.9, borderColor: '#ef4444' },
          { scale: 2.2, opacity: 0, duration: 0.6, ease: 'power2.out' },
          '-=0.2'
        );
      }

      // 3. Panel 2px Vibration Shake
      const panel = stampRef.current.parentElement;
      if (panel) {
        gsap.fromTo(
          panel,
          { x: 0, y: 0 },
          { x: 2, y: -2, duration: 0.04, repeat: 5, yoyo: true, ease: 'power1.inOut' }
        );
      }
    } else {
      // Reduced motion: simple fade
      tl.fromTo(stampRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    }

    return () => {
      tl.kill();
      if (stampRef.current?.parentElement) {
        gsap.set(stampRef.current.parentElement, { x: 0, y: 0 });
      }
    };
  }, [isTripped, tripCause]);

  if (!isTripped) return null;

  return (
    <div className={cn("absolute top-3 right-3 z-40 pointer-events-none flex flex-col items-end overflow-visible", className)}>
      <div className="relative">
        {/* Shockwave Ring */}
        <div
          ref={ringRef}
          className="absolute -inset-2 rounded-2xl border-2 border-rose-500 pointer-events-none opacity-0"
        />

        {/* GSAP Stamp Banner */}
        <div
          ref={stampRef}
          className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-rose-950/95 border-2 sm:border-3 border-rose-500 shadow-[0_0_35px_rgba(239,68,68,0.75)] flex flex-col items-center justify-center text-center rotate-[-2deg] select-none backdrop-blur-md"
        >
          <div className="flex items-center gap-1.5 text-rose-300 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-0.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            <span>IEC 60898-1 VERDICT</span>
          </div>

          <div className="text-white text-sm sm:text-base font-black tracking-tight uppercase font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {verdictText}
          </div>

          <div className="text-[9px] sm:text-[10px] text-rose-300/90 font-bold uppercase mt-0.5">
            Contacts Open • Arc Extinguished
          </div>
        </div>
      </div>
    </div>
  );
};
