import React, { useState } from 'react';
import { RESIDENTIAL_GLOSSARY, GlossaryEntry } from '../data/residentialGlossary';
import { cn } from '@/src/lib/utils';
import { HelpCircle, Sparkles, X } from 'lucide-react';

interface JargonTooltipProps {
  termKey: keyof typeof RESIDENTIAL_GLOSSARY | string;
  children?: React.ReactNode;
  className?: string;
}

export const JargonTooltip: React.FC<JargonTooltipProps> = ({
  termKey,
  children,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const entry: GlossaryEntry | undefined = RESIDENTIAL_GLOSSARY[termKey];

  if (!entry) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={cn(
          "inline-flex items-center gap-0.5 text-inherit border-b border-dotted border-cyan-400/80 cursor-help transition-colors hover:text-cyan-300 font-inherit",
          className
        )}
      >
        <span>{children || entry.term}</span>
        <HelpCircle className="w-3 h-3 text-cyan-400 shrink-0 inline opacity-75" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3 bg-slate-900/98 border border-cyan-500/50 rounded-xl shadow-2xl z-50 text-left text-xs font-sans text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
            <span className="font-bold text-white text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {entry.simpleName}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
              Grade 6 Guide
            </span>
          </div>

          <p className="text-[11px] font-semibold text-cyan-200 mb-1 leading-snug">
            {entry.oneLineSummary}
          </p>

          <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
            {entry.grade6Analogy}
          </p>

          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-amber-300/90 leading-tight">
            <strong>Why it protects you:</strong> {entry.whyItMatters}
          </div>
        </div>
      )}
    </span>
  );
};
