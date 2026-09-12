/**
 * ThreeEmojiQuizModal.tsx
 * 
 * Simple Mode 3-Emoji Quiz:
 * - 3 big tap targets: 😀 Safe / 😲 Risky / 🚨 Danger
 * - Instant feedback within 300ms
 * - Correct answer plays celebratory fanfare and awards the sticker badge into tray
 */

import React, { useState } from 'react';
import { MicroLesson } from '../../data/homeguardSimpleContent';
import { homeguardAudio } from '../../utils/homeguardAudio';
import { X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface ThreeEmojiQuizModalProps {
  lesson: MicroLesson;
  isOpen: boolean;
  onClose: () => void;
  onPass: (badgeId: string) => void;
}

export const ThreeEmojiQuizModal: React.FC<ThreeEmojiQuizModalProps> = ({
  lesson,
  isOpen,
  onClose,
  onPass
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const option = lesson.quiz.options[idx];
    if (option.isCorrect) {
      homeguardAudio.playCheerSound();
      // Haptic feedback: celebratory double-tap
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      setTimeout(() => {
        onPass(lesson.badgeId);
      }, 1200);
    } else {
      homeguardAudio.playBreakerTripSound();
      // Haptic feedback: warning buzz
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectOption(idx);
    }
  };

  const currentOption = selectedOption !== null ? lesson.quiz.options[selectedOption] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 text-slate-800 relative select-none animate-in zoom-in-95 duration-150"
        style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shrink-0 shadow-inner">
            {lesson.badgeEmoji}
          </div>
          <div>
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider block">
              Quiz: {lesson.badgeTitle}
            </span>
            <h3 className="text-lg font-black text-slate-900 leading-snug">
              What do you think?
            </h3>
          </div>
        </div>

        {/* Question Prompt */}
        <p className="text-base font-bold text-slate-700 mb-5 leading-relaxed bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
          {lesson.quiz.prompt}
        </p>

        {/* 3 Big Emoji Choices */}
        <div className="grid grid-cols-3 gap-3 mb-4" role="radiogroup" aria-label={lesson.quiz.prompt}>
          {lesson.quiz.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            return (
              <button
                key={idx}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleSelectOption(idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                disabled={isAnswered}
                className={cn(
                  "min-h-[72px] rounded-2xl p-2 flex flex-col items-center justify-center gap-1 border-3 font-black text-sm cursor-pointer transition-all active:scale-95 shadow-md",
                  !isAnswered && "bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50/60 focus:outline-2 focus:outline-amber-400 focus:outline-offset-2",
                  isSelected && opt.isCorrect && "bg-emerald-100 border-emerald-500 text-emerald-950 scale-105 shadow-lg",
                  isSelected && !opt.isCorrect && "bg-rose-100 border-rose-500 text-rose-950"
                )}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Message */}
        {isAnswered && currentOption && (
          <div className={cn(
            "p-3.5 rounded-2xl border flex items-center gap-2.5 animate-in fade-in duration-200",
            currentOption.isCorrect 
              ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
              : "bg-rose-50 border-rose-300 text-rose-900"
          )}>
            {currentOption.isCorrect ? (
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 fill-emerald-600 animate-spin" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div className="text-xs font-bold leading-tight">
              {currentOption.feedback}
            </div>
          </div>
        )}

        {/* Try Again Button if incorrect */}
        {isAnswered && currentOption && !currentOption.isCorrect && (
          <button
            type="button"
            onClick={() => {
              setSelectedOption(null);
              setIsAnswered(false);
            }}
            className="mt-4 w-full min-h-[48px] rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black text-sm cursor-pointer shadow-md"
          >
            Try Again 🔄
          </button>
        )}
      </div>
    </div>
  );
};
