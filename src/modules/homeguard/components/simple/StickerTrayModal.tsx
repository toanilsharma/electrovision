/**
 * StickerTrayModal.tsx
 * 
 * Simple Mode Sticker Badge Tray & Printable Certificate Sheet:
 * - Collects 6 sticker badges from the 6 micro-lessons
 * - Tray full (6/6 badges) unlocks the Printable Certificate & Sticker Sheet
 * - Formatted for print: window.print() supported with print stylesheet styles
 */

import React, { useState } from 'react';
import { HOMEGUARD_MICRO_LESSONS } from '../../data/homeguardSimpleContent';
import { Award, Printer, X, Check, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface StickerTrayModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedBadgeIds: string[];
  onSelectLesson?: (lessonId: string) => void;
}

export const StickerTrayModal: React.FC<StickerTrayModalProps> = ({
  isOpen,
  onClose,
  earnedBadgeIds,
  onSelectLesson
}) => {
  const [isPrintView, setIsPrintView] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalBadges = HOMEGUARD_MICRO_LESSONS.length;
  const earnedCount = earnedBadgeIds.length;
  const isAllEarned = earnedCount >= totalBadges;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={cn(
          "w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 text-slate-800 relative select-none animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto",
          isPrintView && "print:border-none print:shadow-none print:p-0 print:max-w-none"
        )}
        style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors print:hidden"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── STANDARD MODAL VIEW ── */}
        {!isPrintView ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                🏆
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  My Safety Sticker Tray
                </h3>
                <span className="text-xs font-bold text-amber-700">
                  Earn all 6 sticker badges to print your official certificate!
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 mb-5">
              <div className="flex justify-between text-xs font-black text-slate-700 mb-1">
                <span>Badges Earned:</span>
                <span className="text-amber-700">{earnedCount} of {totalBadges}</span>
              </div>
              <div className="w-full h-3 bg-amber-200/70 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(earnedCount / totalBadges) * 100}%` }}
                />
              </div>
            </div>

            {/* 6 Sticker Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {HOMEGUARD_MICRO_LESSONS.map((lesson) => {
                const isEarned = earnedBadgeIds.includes(lesson.badgeId);
                return (
                  <div
                    key={lesson.id}
                    onClick={() => {
                      if (onSelectLesson && !isEarned) {
                        onSelectLesson(lesson.id);
                        onClose();
                      }
                    }}
                    className={cn(
                      "p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all relative overflow-hidden shadow-sm",
                      isEarned 
                        ? "bg-white border-amber-300 shadow-md" 
                        : "bg-slate-50 border-dashed border-slate-300 opacity-70 cursor-pointer hover:opacity-100"
                    )}
                  >
                    {isEarned ? (
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-3xl mb-2 shadow-inner">
                        {lesson.badgeEmoji}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 mb-2">
                        <Lock className="w-5 h-5" />
                      </div>
                    )}

                    <span className="text-xs font-black text-slate-900 leading-tight">
                      {lesson.badgeTitle}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      {isEarned ? lesson.badgeDesc : 'Tap to earn'}
                    </span>

                    {isEarned && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Print Certificate Sheet Action (Unlocked when all 6 badges collected) */}
            {isAllEarned ? (
              <button
                type="button"
                onClick={() => setIsPrintView(true)}
                className="w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-white font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
                <span>Print Official Family Certificate Sheet! 🖨️</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-100 text-center text-xs font-bold text-slate-500">
                Collect {totalBadges - earnedCount} more badge{totalBadges - earnedCount > 1 ? 's' : ''} to unlock your printable Certificate Sheet!
              </div>
            )}
          </div>
        ) : (
          /* ── PRINTABLE CERTIFICATE & STICKER SHEET VIEW ── */
          <div className="p-4 bg-amber-50/40 rounded-2xl border-4 border-amber-400 text-center relative">
            <button
              type="button"
              onClick={() => setIsPrintView(false)}
              className="absolute top-2 left-2 px-3 py-1 rounded-xl bg-slate-200 text-slate-700 text-xs font-black cursor-pointer print:hidden"
            >
              ← Back to Tray
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="absolute top-2 right-2 px-4 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Now</span>
            </button>

            <div className="my-6">
              <span className="text-4xl">🏆</span>
              <h2 className="text-2xl font-black text-amber-950 mt-1 uppercase tracking-wider">
                HomeGuard Official Family Safety Certificate
              </h2>
              <p className="text-sm font-bold text-amber-800 mt-1">
                Presented to our Junior Household Electrical Safety Champions
              </p>
            </div>

            {/* 6 Printed Sticker Badges */}
            <div className="grid grid-cols-3 gap-4 my-6 p-4 bg-white rounded-2xl border-2 border-amber-300">
              {HOMEGUARD_MICRO_LESSONS.map(l => (
                <div key={l.id} className="p-3 border-2 border-dashed border-amber-300 rounded-2xl flex flex-col items-center">
                  <span className="text-3xl">{l.badgeEmoji}</span>
                  <span className="text-xs font-black text-slate-900 mt-1">{l.badgeTitle}</span>
                  <span className="text-[9px] text-slate-600 leading-tight mt-0.5">{l.badgeDesc}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 font-bold max-w-md mx-auto mb-2">
              "We promise to never plug two heaters into one plug, cover low wall sockets, and test our Leak Guard T button every month!"
            </p>
            <div className="flex justify-around text-xs font-bold text-slate-800 border-t border-amber-200 pt-3">
              <span>Family Member Signature: ___________________</span>
              <span>Date: ___________________</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
