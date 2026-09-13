/**
 * HomeGuardTourModal.tsx
 * 
 * 30-Second Interactive Guided Tour Modal (Rec 6)
 * Teaches non-electrical users (homeowners, housewives, students) the 3 core secrets of home safety:
 * 1. The 230V Street Incomer
 * 2. The DB Fuse Box (Life-Saver vs Fire-Guards)
 * 3. How to Click Appliances & The "Unplug First" Safety Rule
 */

import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import {
  Zap,
  ShieldCheck,
  Flame,
  Power,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  Home
} from 'lucide-react';

export interface HomeGuardTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HomeGuardTourModal: React.FC<HomeGuardTourModalProps> = ({
  isOpen,
  onClose
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "1. Where Electricity Comes From",
      icon: "⚡",
      badge: "The Mains Incomer",
      badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/50",
      description: "Electricity arrives from the street supply at 230 Volts. It enters through your outdoor energy meter and feeds the central Consumer Unit (DB Fuse Box) inside your home.",
      visualTip: "Watch the glowing electron trails move through the wall conduits into each room in a closed loop.",
      highlight: "In a safe home, all electricity entering through Live returns through Neutral (100% Balanced)."
    },
    {
      title: "2. Your Two Invisible Guardians",
      icon: "🛡️",
      badge: "Inside Your DB Fuse Box",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
      description: "Inside your DB fuse box, there are two distinct types of safety switches protecting your family:",
      points: [
        {
          label: "🛡️ Life-Saver Shock Guard (RCCB 30mA):",
          text: "Detects tiny electricity leaks into a human body or water, cutting power in 0.03 seconds before your heart is harmed."
        },
        {
          label: "🔥 Wire Fire-Guards (MCBs 16A):",
          text: "Protects the hidden copper wires inside your walls from overheating like toaster wires and catching fire when too many heavy appliances run."
        }
      ],
      highlight: "Regular switches only protect wires. ONLY the 30mA Life-Saver (RCCB) protects human lives!"
    },
    {
      title: "3. Interactive Controls & The Golden Rule",
      icon: "👆",
      badge: "How to Use This Simulator",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
      description: "You have full control over the house! Click any appliance (like the Space Heater or Kettle) in the house or the bottom switchboard to toggle it ON and OFF.",
      goldenRule: "⚠️ The Golden Real-Life Safety Rule: If a safety switch trips, UNPLUG the heavy heater first before pushing the switch UP. In real life, turning on a breaker with heavy heaters still plugged in causes a loud spark in your face!",
      highlight: "Explore all 5 guided missions on the left to see how your home protects you from shocks and fires."
    }
  ];

  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(s => s + 1);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('homeguard_guided_tour_completed', 'true');
      }
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(s => s - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans select-none">
        
        {/* Header Bar */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                HOMEGUARD 30-SECOND TOUR
              </span>
              <span className="text-[10px] text-slate-400 block">
                Step {currentSlide + 1} of {slides.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="p-5 space-y-4">
          
          {/* Badge & Title */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{slide.icon}</span>
              <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border", slide.badgeColor)}>
                {slide.badge}
              </span>
            </div>
            <h3 className="text-lg font-black text-white leading-tight">
              {slide.title}
            </h3>
          </div>

          {/* Description Text */}
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {slide.description}
          </p>

          {/* Slide 2 Points */}
          {slide.points && (
            <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              {slide.points.map((pt, i) => (
                <div key={i} className="text-xs leading-snug">
                  <span className="font-black text-emerald-300 block">{pt.label}</span>
                  <span className="text-slate-300 text-[11.5px]">{pt.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Golden Rule Highlight (Slide 3) */}
          {slide.goldenRule && (
            <div className="bg-amber-950/60 border border-amber-500/60 p-3 rounded-xl text-xs text-amber-200 font-bold leading-snug">
              {slide.goldenRule}
            </div>
          )}

          {/* Bottom Highlight Pill */}
          {slide.highlight && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-cyan-800/60 text-cyan-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>{slide.highlight}</span>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2">
          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all cursor-pointer",
                  currentSlide === idx ? "bg-cyan-400 w-6 shadow-sm shadow-cyan-400/50" : "bg-slate-700 hover:bg-slate-600"
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <span>{currentSlide === slides.length - 1 ? "Start Exploring!" : "Next"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
