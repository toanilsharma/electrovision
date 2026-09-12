/**
 * FamilyRulePictogramStrip.tsx
 * 
 * Simple Mode One-Line Family Rule Strip (Zero paragraphs):
 * - e.g. [🔥 Heater] + [🔥 Heater] + [🔌 One Socket] = 🚨
 * - Tap to hear spoken rule via Web SpeechSynthesis
 * - High-contrast, friendly rounded pictogram badges
 */

import React from 'react';
import { cn } from '@/src/lib/utils';
import { Volume2, Sparkles } from 'lucide-react';

export interface FamilyRulePictogramStripProps {
  icons: string[];
  labels?: string[];
  resultEmoji: '😀' | '🚨';
  resultCaption: string;
  spokenRule: string; // <= 12 words
  className?: string;
}

export const FamilyRulePictogramStrip: React.FC<FamilyRulePictogramStripProps> = ({
  icons,
  labels,
  resultEmoji,
  resultCaption,
  spokenRule,
  className
}) => {
  const handleSpeak = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenRule);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      onClick={handleSpeak}
      className={cn(
        "w-full bg-white rounded-2xl p-3 border-2 border-amber-300 shadow-md flex items-center justify-between gap-2 cursor-pointer transition-all hover:bg-amber-50/50 active:scale-[0.99] select-none",
        className
      )}
      style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
      title="Tap to hear Golden Family Safety Rule"
    >
      {/* Left: Strip of Pictograms */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <span className="text-xs font-black text-amber-800 uppercase tracking-wider hidden sm:inline mr-1">
          Family Rule:
        </span>

        {icons.map((icon, idx) => (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100/90 border border-amber-300 text-lg shadow-inner">
              <span>{icon}</span>
              {labels && labels[idx] && (
                <span className="text-[11px] font-black text-amber-900 hidden md:inline">
                  {labels[idx]}
                </span>
              )}
            </div>
            {idx < icons.length - 1 && (
              <span className="text-xs font-black text-amber-500 font-mono">+</span>
            )}
          </React.Fragment>
        ))}

        <span className="text-sm font-black text-amber-600 font-mono mx-0.5">=</span>

        {/* Result Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-sm shadow-sm",
          resultEmoji === '🚨' 
            ? "bg-rose-500 text-white animate-pulse" 
            : "bg-emerald-500 text-white"
        )}>
          <span>{resultEmoji}</span>
          <span className="text-xs">{resultEmoji === '🚨' ? 'DANGER' : 'SAFE'}</span>
        </div>
      </div>

      {/* Right: Caption + Voice Icon */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold text-slate-600 hidden lg:inline max-w-[200px] truncate">
          {resultCaption}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSpeak();
          }}
          className="w-8 h-8 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center cursor-pointer shadow-sm transition-transform active:scale-95"
          aria-label="Speak rule"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
