import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Award, CheckCircle2, AlertTriangle, RotateCcw, BookOpen, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { UserConfig } from '../types';
import { cn } from '@/src/lib/utils';

interface SafetyQuizPageProps {
  config?: UserConfig;
  onBackToSimulator?: () => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: '1. According to IEC 60479-1:2018, what is the muscle let-go threshold where flexor muscles lock?',
    options: ['0.5 mA AC', '5 mA AC', '10 mA AC (50/60 Hz)', '50 mA AC'],
    correctIndex: 2,
    explanation: 'Per IEC 60479-1 Clause 3.1, 10 mA AC is the threshold where hand flexor muscles tetanize, making it physically impossible to release a energized conductor.'
  },
  {
    id: 'q2',
    question: '2. Why is the Hand-to-Foot current path classified as the highest risk shock route?',
    options: [
      'It has the highest skin surface resistance',
      'Heart Current Factor F_H = 1.0 (100% current traverses cardiac tissues)',
      'It produces DC waveforms only',
      'It eliminates tissue burns'
    ],
    correctIndex: 1,
    explanation: 'Per IEC 60479-1 Table 2, Hand-to-Foot shock path has F_H = 1.0, directing maximum prospective current through the heart ventricles.'
  },
  {
    id: 'q3',
    question: '3. What is the MANDATORY first emergency step when discovering an electrical shock victim?',
    options: [
      'Touch the victim to pull them away immediately',
      'Isolate power (switch off circuit breaker / disconnect mains)',
      'Check pupil response',
      'Apply dielectric lubricant'
    ],
    correctIndex: 1,
    explanation: 'Power isolation is mandatory before touching the victim to prevent secondary electrical shock to the first responder.'
  },
  {
    id: 'q4',
    question: '4. How do ASTM D120 Class 0 insulating gloves (10 MΩ) protect against 230V mains touch potential?',
    options: [
      'They decrease body resistance to 100 Ω',
      'They increase total series impedance to 10 MΩ+, reducing current to safe microamp (µA) range',
      'They increase skin temperature',
      'They stop current only during DC shocks'
    ],
    correctIndex: 1,
    explanation: 'Adding 10 MΩ series glove insulation reduces 230V prospective current from 170 mA (fatal AC-4.3) down to 23 µA (imperceptible AC-1).'
  }
];

export const SafetyQuizPage: React.FC<SafetyQuizPageProps> = ({ config, onBackToSimulator }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);

  const currentQ = QUIZ_QUESTIONS[currentQuestionIndex];

  const handleOptionSelect = (qId: string, optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    let scoreCount = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        scoreCount++;
      }
    });
    setFinalScore(scoreCount);
    setIsSubmitted(true);
  };

  const handleRestartQuiz = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setFinalScore(0);
    setCurrentQuestionIndex(0);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPct = Math.round(((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100);

  return (
    <div className="w-full h-full p-3 sm:p-6 bg-slate-950 flex flex-col items-center justify-center overflow-y-auto select-none">
      <div className="w-full max-w-3xl bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3 text-left">
            <div className="p-3 bg-amber-950 border border-amber-400/60 rounded-2xl">
              <HelpCircle className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-amber-300 font-sans leading-none">
                IEC 60479-1 Electrical Safety Micro-Quiz
              </h2>
              <p className="text-xs font-mono font-bold text-slate-400 mt-1">
                Test your knowledge on body impedance, let-go thresholds & emergency response.
              </p>
            </div>
          </div>

          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-400 text-amber-300 font-mono font-bold text-xs">
            <Award className="w-4 h-4 text-amber-400" /> +200 XP
          </span>
        </div>

        {!isSubmitted ? (
          <div className="space-y-6 text-left">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold text-slate-300">
                <span>QUESTION {currentQuestionIndex + 1} OF {QUIZ_QUESTIONS.length}</span>
                <span>{progressPct}% COMPLETED</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Active Question Card */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
              <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
                {currentQ.question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleOptionSelect(currentQ.id, optIdx)}
                      className={cn(
                        'w-full p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all text-left cursor-pointer min-h-[48px] flex items-center justify-between',
                        isSelected
                          ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      )}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quiz Bottom Navigation Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                PREVIOUS
              </button>

              {currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[currentQ.id] === undefined}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>NEXT QUESTION</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={answeredCount < QUIZ_QUESTIONS.length}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>SUBMIT QUIZ FOR CERTIFICATE</span>
                  <Award className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Quiz Results & Explanations View */
          <div className="space-y-6 text-left">
            <div className="p-4 bg-emerald-950 border-2 border-emerald-400 rounded-2xl text-center flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <Award className="w-12 h-12 text-amber-400 animate-bounce" />
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-emerald-300">
                QUIZ COMPLETED: {finalScore} / {QUIZ_QUESTIONS.length} CORRECT!
              </h3>
              <p className="text-xs font-mono font-bold text-emerald-200">
                {finalScore === QUIZ_QUESTIONS.length
                  ? '🎉 PERFECT SCORE! EARNED "IEC 60479-1 CERTIFIED SAFETY SPECIALIST" BADGE (+200 XP)!'
                  : 'Great effort! Review the detailed IEC standards explanations below.'}
              </p>
            </div>

            {/* Detailed Explanations Breakdown */}
            <div className="space-y-3">
              {QUIZ_QUESTIONS.map((q) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correctIndex;

                return (
                  <div key={q.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-200">
                        {q.question}
                      </span>
                      <span className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0', isCorrect ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-red-950 text-red-300 border border-red-500')}>
                        {isCorrect ? 'CORRECT ✓' : 'INCORRECT ✗'}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-amber-300/90 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      💡 <span className="font-bold">IEC 60479-1 Basis:</span> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleRestartQuiz}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>RETRY QUIZ</span>
              </button>

              {onBackToSimulator && (
                <button
                  type="button"
                  onClick={onBackToSimulator}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>RETURN TO SIMULATOR</span>
                  <Zap className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
