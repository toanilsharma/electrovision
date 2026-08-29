import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeartPulse, Activity, CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface CPRMetronomeGameProps {
  onGameComplete?: (score: number) => void;
  className?: string;
}

export const CPRMetronomeGame: React.FC<CPRMetronomeGameProps> = ({
  onGameComplete,
  className
}) => {
  const [compressionsCount, setCompressionsCount] = useState<number>(0);
  const [cyclePhase, setCyclePhase] = useState<'compressions' | 'breaths'>('compressions');
  const [breathsCount, setBreathsCount] = useState<number>(0);

  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const lastBeatTimeRef = useRef<number>(0);
  const targetBpm = 110;
  const targetIntervalMs = (60 / targetBpm) * 1000; // ~545 ms

  // Start Metronome
  const handleStartGame = () => {
    setIsPlaying(true);
    setCompressionsCount(0);
    setBreathsCount(0);
    setCyclePhase('compressions');
    setScore(0);
    setFeedback(null);
    lastBeatTimeRef.current = performance.now();
  };

  const handleChestTap = () => {
    if (!isPlaying) return;

    if (cyclePhase === 'compressions') {
      const now = performance.now();
      const elapsedSinceLastBeat = now - lastBeatTimeRef.current;
      const delta = Math.abs(elapsedSinceLastBeat - targetIntervalMs);
      lastBeatTimeRef.current = now;

      let pts = 0;
      let fbText = 'GOOD (+50)';
      let fbColor = 'text-amber-400 border-amber-400 bg-amber-950/80';

      if (delta <= 75) {
        pts = 100;
        fbText = 'PERFECT 110 BPM! (+100)';
        fbColor = 'text-emerald-400 border-emerald-400 bg-emerald-950/80';
      } else if (delta <= 150) {
        pts = 50;
        fbText = 'GOOD TEMPO (+50)';
        fbColor = 'text-amber-400 border-amber-400 bg-amber-950/80';
      } else {
        pts = 10;
        fbText = 'TOO FAST / TOO SLOW (+10)';
        fbColor = 'text-rose-400 border-rose-400 bg-rose-950/80';
      }

      setScore((prev) => prev + pts);
      setFeedback({ text: fbText, color: fbColor });

      const nextCount = compressionsCount + 1;
      setCompressionsCount(nextCount);

      if (nextCount >= 30) {
        setCyclePhase('breaths');
        setFeedback({ text: '30 COMPRESSIONS DONE! GIVE 2 RESCUE BREATHS', color: 'text-sky-300 border-sky-400 bg-sky-950' });
      }
    } else {
      // Breaths Phase
      const nextBreaths = breathsCount + 1;
      setBreathsCount(nextBreaths);

      if (nextBreaths >= 2) {
        setIsPlaying(false);
        setFeedback({ text: '30:2 CPR CYCLE COMPLETED PERFECTLY!', color: 'text-emerald-300 border-emerald-400 bg-emerald-950' });
        if (onGameComplete) onGameComplete(score + 200);
      }
    }
  };

  return (
    <div className={cn('w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 shadow-2xl select-none', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-rose-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-300 font-sans">
            30:2 CPR Rhythm Metronome Game (100–120 BPM)
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-slate-300">
          SCORE: <span className="text-emerald-400 font-black">{score} PTS</span>
        </span>
      </div>

      {/* Rhythm Metronome Target Zone */}
      <div className="relative w-full h-40 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden p-3 gap-2">
        {!isPlaying ? (
          <button
            type="button"
            onClick={handleStartGame}
            className="py-3 px-6 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl border-2 border-rose-300 shadow-[0_0_30px_rgba(225,29,72,0.6)] cursor-pointer transition-all active:scale-95 flex items-center gap-2"
          >
            <HeartPulse className="w-5 h-5 text-yellow-300" />
            <span>START 30:2 CPR RHYTHM GAME</span>
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 w-full">
            {/* Pulsing Target Chest Button */}
            <motion.button
              type="button"
              onClick={handleChestTap}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 545 / 1000, repeat: Infinity }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 border-4 border-rose-300 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_35px_rgba(225,29,72,0.8)] flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-90"
            >
              <HeartPulse className="w-8 h-8 text-yellow-300 animate-bounce" />
              <span>TAP BEAT</span>
            </motion.button>

            {/* Counter Badge */}
            <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-200 mt-1">
              <span>COMPRESSIONS: <span className="text-rose-400 font-black text-sm">{compressionsCount} / 30</span></span>
              <span>BREATHS: <span className="text-sky-400 font-black text-sm">{breathsCount} / 2</span></span>
            </div>
          </div>
        )}

        {/* Real-time Feedback Banner */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={cn('px-3 py-1 rounded-lg border text-xs font-black uppercase tracking-wider font-sans shadow-md', feedback.color)}
            >
              {feedback.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
