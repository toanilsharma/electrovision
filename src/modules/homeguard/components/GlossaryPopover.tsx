/**
 * GlossaryPopover.tsx
 * 
 * Speak-on-tap glossary for HomeGuard Simple Shell:
 * - Underlined words ("Leak Guard", "earth", "breaker", "socket", "shock")
 * - Clicking plays Web SpeechSynthesis spoken pronunciation
 * - Displays a friendly, rounded pictogram popover with plain-language explanation
 * - Zero technical formulas or symbols
 */

import React, { useState, useEffect } from 'react';
import { HOMEGUARD_GLOSSARY, GlossaryEntry } from '../data/homeguardStoryData';
import { Volume2, X } from 'lucide-react';

interface GlossaryPopoverProps {
  entry: GlossaryEntry;
  onClose: () => void;
}

export const GlossaryPopover: React.FC<GlossaryPopoverProps> = ({ entry, onClose }) => {
  useEffect(() => {
    // Play speech synthesis on open
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(entry.pronounceText);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis not available:', err);
      }
    }
  }, [entry]);

  const handleSpeakAgain = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(entry.pronounceText);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 text-slate-800 relative animate-in zoom-in-95 duration-150"
        style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shrink-0 shadow-inner">
            {entry.icon}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">
              {entry.simpleTitle}
            </h3>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Household Safety Term
            </span>
          </div>
        </div>

        <p className="text-base text-slate-600 leading-relaxed my-3">
          {entry.plainMeaning}
        </p>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSpeakAgain}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            <Volume2 className="w-4 h-4" />
            <span>Hear Explanation</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
          >
            Got it! 👍
          </button>
        </div>
      </div>
    </div>
  );
};

interface PlainLanguageTextProps {
  text: string;
  className?: string;
}

/**
 * Automatically recognizes and renders speak-on-tap glossary terms
 */
export const PlainLanguageText: React.FC<PlainLanguageTextProps> = ({ text, className }) => {
  const [activeEntry, setActiveEntry] = useState<GlossaryEntry | null>(null);

  // Parse text against glossary aliases
  const renderTokens = () => {
    // Regex matching any known term
    const terms = HOMEGUARD_GLOSSARY.map(g => g.term);
    const pattern = new RegExp(`(${terms.join('|')})`, 'gi');

    const parts = text.split(pattern);

    return parts.map((part, index) => {
      const matched = HOMEGUARD_GLOSSARY.find(
        g => g.term.toLowerCase() === part.toLowerCase() || g.aliases.includes(part.toLowerCase())
      );

      if (matched) {
        return (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveEntry(matched);
            }}
            className="inline font-black text-amber-700 underline decoration-amber-500 decoration-2 underline-offset-4 hover:bg-amber-100/80 px-1 rounded transition-colors cursor-pointer"
            title="Tap to speak & learn"
          >
            {part}
            <span className="text-[10px] ml-0.5 text-amber-500">🔊</span>
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      <span className={className}>{renderTokens()}</span>
      {activeEntry && (
        <GlossaryPopover entry={activeEntry} onClose={() => setActiveEntry(null)} />
      )}
    </>
  );
};
