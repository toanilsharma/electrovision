import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Timer, AlertTriangle, ShieldCheck, CheckCircle2, Award, RotateCcw, X, Zap, ChevronRight, ChevronLeft } from "lucide-react";
import { LOTOMachineryVisualEngine } from "./LOTOMachineryVisualEngine";
import { assessmentAudio } from "@/src/utils/assessmentSound";

interface LOTOPracticalExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCertificateRequested: (score: number) => void;
}

export function LOTOPracticalExamModal({
  isOpen,
  onClose,
  onCertificateRequested
}: LOTOPracticalExamModalProps) {
  const [timeLeft, setTimeLeft] = useState(120);
  const [examActive, setExamActive] = useState(true);
  const [examStep, setExamStep] = useState(0);
  const [completedExamSteps, setCompletedExamSteps] = useState<Set<number>>(new Set());
  const [violations, setViolations] = useState<string[]>([]);
  const [examFinished, setExamFinished] = useState(false);

  // 120-second countdown timer
  useEffect(() => {
    if (!isOpen || !examActive || examFinished) return;
    if (timeLeft <= 0) {
      setExamActive(false);
      setExamFinished(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, examActive, examFinished, timeLeft]);

  if (!isOpen) return null;

  const handleStepDone = (idx: number) => {
    assessmentAudio.playCorrectChime();
    setCompletedExamSteps(prev => {
      const next = new Set([...prev, idx]);
      if (next.size === 6) {
        setExamActive(false);
        setExamFinished(true);
        assessmentAudio.playQuizComplete();
      }
      return next;
    });

    if (examStep < 5) {
      setExamStep(s => s + 1);
    }
  };

  const handleRestart = () => {
    setTimeLeft(120);
    setExamActive(true);
    setExamStep(0);
    setCompletedExamSteps(new Set());
    setViolations([]);
    setExamFinished(false);
  };

  const calculatedScore = Math.max(0, 100 - violations.length * 20 - (timeLeft <= 0 ? 30 : 0));
  const isPassed = calculatedScore >= 75 && completedExamSteps.size >= 5;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        >
          {/* Top Exam Status Strip */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/60 flex items-center justify-center text-red-400">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-black uppercase text-red-400 tracking-widest block">
                  HIGH-STAKES TIMED PRACTICAL EXAM · OSHA 1910.147
                </span>
                <h3 className="text-xs sm:text-sm font-black uppercase text-white">
                  LOTO Autonomous Field Competency Evaluation
                </h3>
              </div>
            </div>

            {/* Timers & Score Telemetry */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono">
                <Timer className={cn("w-3.5 h-3.5", timeLeft <= 30 ? "text-red-400 animate-ping" : "text-amber-400")} />
                <span className={cn("text-xs font-black", timeLeft <= 30 ? "text-red-400" : "text-white")}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs font-black text-emerald-400">
                <span>{completedExamSteps.size}/6 STEPS</span>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Exam Canvas Area */}
          <div className="flex-1 min-h-0 p-3 flex flex-col justify-between overflow-hidden">
            {examFinished ? (
              /* Exam Results Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center shadow-2xl", isPassed ? "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400" : "bg-red-500/20 border-2 border-red-400 text-red-400")}>
                  {isPassed ? <Award className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                </div>

                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-white">
                    {isPassed ? "PRACTICAL EXAM PASSED!" : "EXAM FAILED — RETAKE REQUIRED"}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    {isPassed ? "You have demonstrated autonomous competency under field emergency conditions." : "Safety violations exceeded threshold or time expired before complete verification."}
                  </p>
                </div>

                <div className="flex items-center gap-4 py-2 font-mono">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 block">FINAL SCORE</span>
                    <span className={cn("text-2xl font-black", isPassed ? "text-emerald-400" : "text-red-400")}>{calculatedScore}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 block">STEPS COMPLETED</span>
                    <span className="text-2xl font-black text-white">{completedExamSteps.size}/6</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleRestart}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retake Exam
                  </button>

                  {isPassed && (
                    <button
                      onClick={() => {
                        onClose();
                        onCertificateRequested(calculatedScore);
                      }}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
                    >
                      <Award className="w-4 h-4" /> View Official Certificate
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Active Exam Simulator View */
              <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden gap-2">
                <div className="flex-1 min-h-0 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative">
                  <LOTOMachineryVisualEngine
                    step={examStep}
                    isCompleted={completedExamSteps.has(examStep)}
                    color="#f59e0b"
                    onStepAccomplished={(idx) => handleStepDone(idx)}
                  />
                </div>

                {/* Exam Navigation Bar */}
                <div className="shrink-0 flex items-center justify-between pt-1 border-t border-slate-800">
                  <button
                    disabled={examStep === 0}
                    onClick={() => setExamStep(s => s - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>

                  <span className="text-[10px] font-mono text-slate-400">
                    Step {examStep + 1} of 6 (Operate machinery to complete)
                  </span>

                  <button
                    disabled={examStep === 5}
                    onClick={() => setExamStep(s => s + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
