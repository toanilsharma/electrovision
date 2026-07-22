import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Award,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Home,
  Factory,
  ArrowRight,
  Sparkles,
  Clock,
  Target,
  TrendingUp,
  Trophy,
  Star,
  Timer,
  ChevronRight,
  Brain
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserConfig } from '../types';
import { RESIDENTIAL_QUESTIONS, AssessmentQuestion } from '../data/residentialQuestions';
import { INDUSTRIAL_QUESTIONS } from '../data/industrialQuestions';
import { assessmentAudio } from '../utils/assessmentSound';

// ─── TYPES ───────────────────────────────────────────────────────
interface AssessmentProps {
  config?: UserConfig;
}

interface FloatingScore {
  id: number;
  text: string;
  color: string;
  x: number;
}

type QuizPhase = 'intro' | 'active' | 'results';

// ─── ANIMATED CIRCULAR PROGRESS SVG ──────────────────────────────
function CircularProgress({ value, max, size = 44, strokeWidth = 3, color = '#f97316' }: {
  value: number; max: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

// ─── ANIMATED BACKGROUND GRID ────────────────────────────────────
function ElectricGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      {/* Animated glow orbs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      {/* Scanning line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent animate-[scan_4s_ease-in-out_infinite]" />
    </div>
  );
}

// ─── PARTICLE BURST COMPONENT ────────────────────────────────────
function ParticleBurst({ active, color = '#22c55e' }: { active: boolean; color?: string }) {
  if (!active) return null;
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const distance = 60 + Math.random() * 80;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 3 + Math.random() * 5;
    return { id: i, x, y, size, delay: Math.random() * 0.15 };
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.7, delay: p.delay, ease: 'easeOut' }}
          style={{ width: p.size, height: p.size, backgroundColor: color, position: 'absolute', borderRadius: '50%' }}
        />
      ))}
    </div>
  );
}

// ─── FLOATING SCORE POPUP ────────────────────────────────────────
function FloatingScorePopup({ scores }: { scores: FloatingScore[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      <AnimatePresence>
        {scores.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 1, y: 0, x: s.x, scale: 0.5 }}
            animate={{ opacity: 0, y: -80, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2"
            style={{ color: s.color }}
          >
            <span className="text-xl font-black font-mono drop-shadow-[0_0_10px_currentColor]">{s.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── OPTION LETTER BADGE ─────────────────────────────────────────
function OptionBadge({ letter, variant }: { letter: string; variant: 'default' | 'selected' | 'correct' | 'wrong' | 'dimmed' }) {
  const styles: Record<string, string> = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/50 group-hover:bg-orange-500/20 group-hover:text-orange-400 group-hover:border-orange-500/40',
    selected: 'bg-orange-500 text-slate-950 border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]',
    correct: 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    wrong: 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]',
    dimmed: 'bg-slate-900/50 text-slate-600 border-slate-800/30',
  };

  return (
    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border transition-all duration-200 shrink-0', styles[variant])}>
      {letter}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export function AssessmentModule({ config }: AssessmentProps) {
  const environment = config?.environment || 'residential';
  const profile = config?.profile || 'adult_male';
  const userName = config?.name || 'Operator';

  // ─── STATE ────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false);
  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [introCountdown, setIntroCountdown] = useState(3);
  const [quizQuestions, setQuizQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Score
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Per-question timer (30s)
  const QUESTION_TIME = 30;
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // VFX
  const [screenShake, setScreenShake] = useState(false);
  const [shortCircuitVFX, setShortCircuitVFX] = useState(false);
  const [correctParticles, setCorrectParticles] = useState(false);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [wrongVignette, setWrongVignette] = useState(false);
  const [questionDirection, setQuestionDirection] = useState(1); // 1 = forward

  // Canvas for sparks
  const sparkCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Results animated counters
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedAccuracy, setAnimatedAccuracy] = useState(0);

  // ─── QUIZ INIT ────────────────────────────────────────────────
  const initializeQuiz = useCallback(() => {
    const fullBank = environment === 'residential' ? RESIDENTIAL_QUESTIONS : INDUSTRIAL_QUESTIONS;
    const profileSpecific = fullBank.filter(q => q.targetProfiles.includes(profile));
    const generalQuestions = fullBank.filter(q => q.targetProfiles.includes('all') && !profileSpecific.includes(q));
    const combined = [...profileSpecific, ...generalQuestions];
    const shuffled = [...combined].sort(() => 0.5 - Math.random());
    const selected20 = shuffled.slice(0, 20);

    setQuizQuestions(selected20);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setTimeLeft(QUESTION_TIME);
    setFloatingScores([]);
    setAnimatedScore(0);
    setAnimatedAccuracy(0);
    setPhase('intro');
    setIntroCountdown(3);
  }, [environment, profile]);

  useEffect(() => { initializeQuiz(); }, [initializeQuiz]);

  // ─── INTRO COUNTDOWN ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'intro') return;
    if (introCountdown <= 0) {
      setPhase('active');
      return;
    }
    const t = setTimeout(() => setIntroCountdown(prev => prev - 1), 800);
    return () => clearTimeout(t);
  }, [phase, introCountdown]);

  // ─── PER-QUESTION TIMER ────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'active' || isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time ran out - auto-submit wrong
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, isAnswered, currentIndex]);

  const handleTimeUp = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setIsCorrect(false);
    setStreak(0);
    assessmentAudio.playShortCircuitZap();
    triggerSparkAnimation();
  };

  // ─── AUDIO ─────────────────────────────────────────────────────
  const toggleAudio = () => {
    const muted = assessmentAudio.toggleMute();
    setIsMuted(muted);
  };

  const currentQuestion = quizQuestions[currentIndex];

  // ─── SPARK ANIMATION (Enhanced) ────────────────────────────────
  const triggerSparkAnimation = () => {
    setShortCircuitVFX(true);
    setScreenShake(true);
    setWrongVignette(true);

    const canvas = sparkCanvasRef.current;
    if (!canvas) { setTimeout(() => { setShortCircuitVFX(false); setScreenShake(false); setWrongVignette(false); }, 500); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;

    let frame = 0;
    const maxFrames = 30;

    const drawLightning = () => {
      ctx.clearRect(0, 0, W, H);

      // Strobing red/white flash
      if (frame < 8) {
        ctx.fillStyle = frame % 2 === 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(0, 0, W, H);
      }

      // Multiple jagged arcs from center
      const cx = W / 2, cy = H / 2;
      const arcCount = 6 + Math.floor(Math.random() * 5);
      for (let i = 0; i < arcCount; i++) {
        ctx.beginPath();
        let px = cx + (Math.random() - 0.5) * 50;
        let py = cy + (Math.random() - 0.5) * 50;
        ctx.moveTo(px, py);

        const tx = Math.random() * W;
        const ty = Math.random() * H;
        const segs = 5 + Math.floor(Math.random() * 4);
        for (let j = 0; j < segs; j++) {
          const nx = px + (tx - px) / (segs - j) + (Math.random() - 0.5) * 80;
          const ny = py + (ty - py) / (segs - j) + (Math.random() - 0.5) * 80;
          ctx.lineTo(nx, ny);
          px = nx; py = ny;
        }

        const colors = ['#38bdf8', '#f97316', '#ef4444', '#fbbf24', '#ffffff'];
        ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.lineWidth = 1 + Math.random() * 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Bright center glow
      if (frame < 15) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
        grad.addColorStop(0, `rgba(249, 115, 22, ${0.3 * (1 - frame / 15)})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(drawLightning);
      } else {
        ctx.clearRect(0, 0, W, H);
        setShortCircuitVFX(false);
        setScreenShake(false);
        setTimeout(() => setWrongVignette(false), 300);
      }
    };
    drawLightning();
  };

  // ─── ADD FLOATING SCORE ────────────────────────────────────────
  const addFloatingScore = (text: string, color: string) => {
    const id = Date.now() + Math.random();
    const x = -40 + Math.random() * 80;
    setFloatingScores(prev => [...prev, { id, text, color, x }]);
    setTimeout(() => {
      setFloatingScores(prev => prev.filter(s => s.id !== id));
    }, 1300);
  };

  // ─── HANDLERS ──────────────────────────────────────────────────
  const handleOptionSelect = (idx: number) => {
    if (isAnswered || !currentQuestion) return;
    assessmentAudio.playClick();
    setSelectedOption(idx);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null || isAnswered || !currentQuestion) return;

    setIsAnswered(true);
    const correct = selectedOption === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setCorrectParticles(true);
      setTimeout(() => setCorrectParticles(false), 800);

      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      const streakBonus = newStreak > 1 ? newStreak * 20 : 0;
      const points = 100 + streakBonus;
      setScore(prev => prev + points);
      setCorrectCount(prev => prev + 1);

      addFloatingScore(`+${points}`, '#22c55e');
      if (newStreak >= 3) {
        addFloatingScore(`🔥 STREAK x${newStreak}!`, '#f59e0b');
        assessmentAudio.playStreakBonus();
      } else {
        assessmentAudio.playCorrectChime();
      }
    } else {
      setStreak(0);
      assessmentAudio.playShortCircuitZap();
      triggerSparkAnimation();
      addFloatingScore('⚡ WRONG', '#ef4444');
    }
  };

  const handleNextQuestion = () => {
    assessmentAudio.playClick();
    if (currentIndex < quizQuestions.length - 1) {
      setQuestionDirection(1);
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(null);
      setTimeLeft(QUESTION_TIME);
    } else {
      const totalTimeSec = Math.round((Date.now() - startTime) / 1000);
      setElapsedTime(totalTimeSec);
      assessmentAudio.playQuizComplete();
      setPhase('results');
    }
  };

  // ─── RESULTS ANIMATED COUNTERS ─────────────────────────────────
  useEffect(() => {
    if (phase !== 'results') return;
    const accuracy = Math.round((correctCount / 20) * 100);

    // Animate score counting up
    let scoreFrame = 0;
    const scoreInterval = setInterval(() => {
      scoreFrame++;
      const progress = Math.min(scoreFrame / 40, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(Math.round(score * eased));
      setAnimatedAccuracy(Math.round(accuracy * eased));
      if (progress >= 1) clearInterval(scoreInterval);
    }, 25);

    return () => clearInterval(scoreInterval);
  }, [phase, score, correctCount]);

  // ─── HELPERS ───────────────────────────────────────────────────
  const getProfileTitle = () => {
    const formatted = profile.replace('_', ' ');
    return `${environment} · ${formatted}`;
  };

  const getPerformanceBadge = () => {
    const pct = Math.round((correctCount / 20) * 100);
    if (pct >= 90) return { title: 'MASTER SAFETY CHAMPION', gradient: 'from-amber-400 to-orange-500', ring: 'ring-amber-400/30', icon: Trophy, desc: 'Outstanding! Your safety knowledge is world-class. Zero tolerance for hazards.' };
    if (pct >= 75) return { title: 'CERTIFIED SAFETY OFFICER', gradient: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-400/30', icon: ShieldCheck, desc: 'Strong proficiency in electrical safety procedures and risk identification.' };
    if (pct >= 60) return { title: 'SAFETY APPRENTICE', gradient: 'from-sky-400 to-blue-500', ring: 'ring-sky-400/30', icon: TrendingUp, desc: 'Good foundation. Review the explanations to strengthen weak areas.' };
    return { title: 'HAZARD RISK ZONE', gradient: 'from-rose-400 to-red-600', ring: 'ring-rose-500/30', icon: AlertTriangle, desc: 'Critical gaps detected. Retake immediately and study each explanation carefully.' };
  };

  if (quizQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Zap className="w-8 h-8 text-orange-500" />
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ─── PHASE: INTRO COUNTDOWN ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div className="relative flex items-center justify-center h-full w-full overflow-hidden">
        <ElectricGrid />
        <AnimatePresence mode="wait">
          {introCountdown > 0 ? (
            <motion.div
              key={introCountdown}
              initial={{ scale: 3, opacity: 0, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 0.5, opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center z-10"
            >
              <div className="text-[120px] sm:text-[160px] font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-amber-600 leading-none drop-shadow-[0_0_40px_rgba(249,115,22,0.5)]">
                {introCountdown}
              </div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.4em] mt-4">
                {introCountdown === 3 ? 'Preparing Assessment' : introCountdown === 2 ? 'Loading Questions' : 'Get Ready'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="go"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.3, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center z-10"
            >
              <Zap className="w-20 h-20 text-orange-500 drop-shadow-[0_0_30px_rgba(249,115,22,0.6)]" />
              <p className="text-2xl font-black text-orange-400 uppercase tracking-[0.3em] mt-4">GO!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meta info bar at bottom */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
          <div className="flex items-center gap-4 px-6 py-2 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-800/50">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              {environment === 'residential' ? <Home className="w-3.5 h-3.5 text-orange-400" /> : <Factory className="w-3.5 h-3.5 text-orange-400" />}
              {environment}
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              {profile.replace('_', ' ')}
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="text-[10px] font-mono text-orange-400 uppercase tracking-widest font-bold">
              20 Questions
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ─── PHASE: RESULTS ────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'results') {
    const badge = getPerformanceBadge();
    const BadgeIcon = badge.icon;
    const accuracy = Math.round((correctCount / 20) * 100);

    // SVG Donut
    const donutRadius = 70;
    const donutCircumference = 2 * Math.PI * donutRadius;
    const donutOffset = donutCircumference * (1 - animatedAccuracy / 100);

    return (
      <div className="relative flex flex-col h-full w-full overflow-hidden">
        <ElectricGrid />

        {/* Confetti particles for good scores */}
        {accuracy >= 75 && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: `${10 + Math.random() * 80}%`, opacity: 1, rotate: 0 }}
                animate={{ y: '110vh', opacity: [1, 1, 0], rotate: 360 + Math.random() * 360 }}
                transition={{ duration: 3 + Math.random() * 3, delay: Math.random() * 2, ease: 'linear' }}
                className="absolute w-2 h-2 rounded-sm"
                style={{ backgroundColor: ['#f97316', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899'][i % 5] }}
              />
            ))}
          </div>
        )}

        <div className="relative z-20 flex flex-col h-full max-w-5xl mx-auto w-full p-3 sm:p-5">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between shrink-0 mb-3"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30"
              >
                <Award className="w-5 h-5 text-orange-400" />
              </motion.div>
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wider">Assessment Complete</h2>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{userName} · {getProfileTitle()}</p>
              </div>
            </div>
            <button onClick={toggleAudio} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
            </button>
          </motion.div>

          {/* Main results grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 min-h-0 overflow-hidden">

            {/* Left: Score Ring + Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
              className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-4 relative overflow-hidden"
            >
              {/* Animated background glow */}
              <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br rounded-2xl", `${badge.gradient}`)} />

              {/* SVG Donut Chart */}
              <div className="relative z-10 mb-3">
                <svg width="170" height="170" className="transform -rotate-90">
                  <circle cx="85" cy="85" r={donutRadius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <motion.circle
                    cx="85" cy="85" r={donutRadius} fill="none"
                    stroke="url(#scoreGradient)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={donutCircumference}
                    initial={{ strokeDashoffset: donutCircumference }}
                    animate={{ strokeDashoffset: donutOffset }}
                    transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={accuracy >= 75 ? '#22c55e' : accuracy >= 60 ? '#3b82f6' : '#ef4444'} />
                      <stop offset="100%" stopColor={accuracy >= 75 ? '#14b8a6' : accuracy >= 60 ? '#6366f1' : '#f97316'} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white font-mono">{animatedAccuracy}</span>
                  <span className="text-xs text-slate-400 font-mono">%</span>
                </div>
              </div>

              {/* Badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border bg-gradient-to-r text-white", badge.gradient, badge.ring, "ring-2")}
              >
                <BadgeIcon className="w-3.5 h-3.5" /> {badge.title}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed max-w-xs relative z-10 px-2"
              >
                {badge.desc}
              </motion.p>
            </motion.div>

            {/* Right: Stats Grid */}
            <div className="lg:col-span-3 grid grid-cols-2 gap-2.5 auto-rows-fr content-center">
              {[
                { label: 'Total Score', value: animatedScore.toString(), suffix: 'PTS', icon: Zap, color: 'text-orange-400', glow: 'shadow-orange-500/10', delay: 0.3 },
                { label: 'Correct Answers', value: `${correctCount}`, suffix: '/ 20', icon: CheckCircle2, color: 'text-emerald-400', glow: 'shadow-emerald-500/10', delay: 0.5 },
                { label: 'Max Streak', value: maxStreak.toString(), suffix: '', icon: Flame, color: 'text-amber-400', glow: 'shadow-amber-500/10', delay: 0.7 },
                { label: 'Time Taken', value: `${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')}`, suffix: '', icon: Clock, color: 'text-sky-400', glow: 'shadow-sky-500/10', delay: 0.9 },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stat.delay, type: 'spring', stiffness: 100 }}
                  className={cn("bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-xl p-3 sm:p-4 flex flex-col justify-center shadow-lg", stat.glow)}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn("text-2xl sm:text-3xl font-black font-mono", stat.color)}>{stat.value}</span>
                    {stat.suffix && <span className="text-xs text-slate-500 font-mono">{stat.suffix}</span>}
                  </div>
                </motion.div>
              ))}

              {/* Question Breakdown Mini Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="col-span-2 bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-xl p-3 sm:p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Question Breakdown</span>
                  <span className="text-[10px] font-mono text-emerald-400">{correctCount} correct · {20 - correctCount} wrong</span>
                </div>
                <div className="flex gap-1 h-3">
                  {quizQuestions.map((_, qi) => (
                    <motion.div
                      key={qi}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 1.2 + qi * 0.03 }}
                      className={cn(
                        "flex-1 rounded-sm origin-bottom",
                        qi < correctCount
                          ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                          : "bg-gradient-to-t from-rose-700 to-rose-500"
                      )}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="flex justify-center pt-3 shrink-0"
          >
            <button
              onClick={initializeQuiz}
              className="group relative px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-xl uppercase tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.25)] hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] transition-all flex items-center gap-2 text-xs cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-500" />
              New 20-Question Challenge
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ─── PHASE: ACTIVE QUIZ ────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  const timerPct = timeLeft / QUESTION_TIME;
  const timerColor = timerPct > 0.5 ? '#22c55e' : timerPct > 0.25 ? '#f59e0b' : '#ef4444';
  const isTimerUrgent = timeLeft <= 10;

  return (
    <motion.div
      animate={screenShake ? { x: [-15, 15, -10, 10, -5, 5, 0], y: [-3, 3, -2, 2, 0] } : { x: 0, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex flex-col h-full w-full overflow-hidden"
    >
      <ElectricGrid />

      {/* Spark Canvas */}
      <canvas
        ref={sparkCanvasRef}
        className={cn("absolute inset-0 z-50 pointer-events-none w-full h-full", shortCircuitVFX ? "opacity-100" : "opacity-0")}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Wrong Answer Vignette */}
      <AnimatePresence>
        {wrongVignette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-40 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 120px 40px rgba(239,68,68,0.4)' }}
          />
        )}
      </AnimatePresence>

      {/* Correct Particles */}
      <ParticleBurst active={correctParticles} color="#22c55e" />

      {/* Floating Score Popups */}
      <FloatingScorePopup scores={floatingScores} />

      {/* ─── TOP HUD ─────────────────────────────────────────────── */}
      <div className="relative z-20 flex items-center gap-2 px-3 py-2 shrink-0">
        {/* Timer Ring */}
        <div className="relative shrink-0">
          <CircularProgress value={timeLeft} max={QUESTION_TIME} size={38} strokeWidth={3} color={timerColor} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "text-[11px] font-black font-mono transition-colors",
              isTimerUrgent ? "text-red-400 animate-pulse" : "text-white"
            )}>
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Question Counter */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex gap-[3px]">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-[10px] h-[6px] rounded-[2px] transition-all duration-300",
                  i < currentIndex ? "bg-orange-500" : i === currentIndex ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.4)]" : "bg-slate-800"
                )}
              />
            ))}
          </div>
          <span className="sm:hidden text-[10px] font-mono text-slate-400 font-bold">
            {currentIndex + 1}/20
          </span>
        </div>

        <div className="flex-1" />

        {/* Live Score */}
        <motion.div
          key={score}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 backdrop-blur-sm border border-slate-800/60"
        >
          <Zap className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-black font-mono text-white">{score}</span>
        </motion.div>

        {/* Streak Badge */}
        <AnimatePresence>
          {streak > 1 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 backdrop-blur-sm"
            >
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </motion.div>
              <span className="text-xs font-black font-mono text-amber-400">x{streak}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio toggle */}
        <button onClick={toggleAudio} className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50 text-slate-400 hover:text-white cursor-pointer transition-colors">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
        </button>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 px-3 pb-3 min-h-0 overflow-hidden">

        {/* Question Panel */}
        <div className="lg:col-span-8 flex flex-col min-h-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: questionDirection * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: questionDirection * -60 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-3 sm:p-4"
            >
              {/* Category & Persona Tag */}
              <div className="flex items-center justify-between shrink-0 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[9px] font-mono font-bold tracking-widest uppercase border border-orange-500/20">
                    {currentQuestion?.category}
                  </span>
                  <span className="hidden sm:inline text-[9px] text-slate-500 font-mono">
                    Q{currentIndex + 1}
                  </span>
                </div>
                {currentQuestion?.targetProfiles.includes(profile) && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[9px] text-emerald-400/80 font-mono flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15"
                  >
                    <Sparkles className="w-3 h-3" /> For {profile.replace('_', ' ')}
                  </motion.span>
                )}
              </div>

              {/* Question Text */}
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white leading-snug mb-3 shrink-0">
                {currentQuestion?.question}
              </h3>

              {/* Options */}
              <div className="flex-1 grid grid-cols-1 gap-2 content-start min-h-0 overflow-y-auto">
                {currentQuestion?.options.map((optText, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOption === idx;
                  const isCorrectOpt = idx === currentQuestion.correctAnswer;

                  let variant: 'default' | 'selected' | 'correct' | 'wrong' | 'dimmed' = 'default';
                  let cardBorder = 'border-slate-800/40 hover:border-slate-700/60';
                  let cardBg = 'bg-slate-950/40 hover:bg-slate-900/60';

                  if (isAnswered) {
                    if (isCorrectOpt) {
                      variant = 'correct';
                      cardBorder = 'border-emerald-500/60';
                      cardBg = 'bg-emerald-950/30';
                    } else if (isSelected && !isCorrectOpt) {
                      variant = 'wrong';
                      cardBorder = 'border-rose-500/60';
                      cardBg = 'bg-rose-950/30';
                    } else {
                      variant = 'dimmed';
                      cardBorder = 'border-slate-900/30';
                      cardBg = 'bg-slate-950/20 opacity-40';
                    }
                  } else if (isSelected) {
                    variant = 'selected';
                    cardBorder = 'border-orange-500/50';
                    cardBg = 'bg-orange-950/20';
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileHover={!isAnswered ? { scale: 1.01 } : undefined}
                      whileTap={!isAnswered ? { scale: 0.99 } : undefined}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={isAnswered}
                      className={cn(
                        "group flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer",
                        cardBorder, cardBg,
                        isAnswered && isCorrectOpt && "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
                        isAnswered && isSelected && !isCorrectOpt && "shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                      )}
                    >
                      <OptionBadge letter={letter} variant={variant} />
                      <span className={cn(
                        "flex-1 text-xs sm:text-sm leading-snug transition-colors",
                        variant === 'correct' ? 'text-emerald-300 font-semibold' : variant === 'wrong' ? 'text-rose-300 font-semibold' : variant === 'dimmed' ? 'text-slate-600' : 'text-slate-200'
                      )}>
                        {optText}
                      </span>
                      {isAnswered && isCorrectOpt && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        </motion.div>
                      )}
                      {isAnswered && isSelected && !isCorrectOpt && (
                        <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/40 shrink-0">
                {/* Left: correct/wrong indicator */}
                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("flex items-center gap-1.5 text-xs font-bold", isCorrect ? "text-emerald-400" : "text-rose-400")}
                    >
                      {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {isCorrect ? `+${100 + (streak > 1 ? streak * 20 : 0)} pts` : 'Incorrect'}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="ml-auto">
                  {!isAnswered ? (
                    <motion.button
                      whileHover={selectedOption !== null ? { scale: 1.03 } : undefined}
                      whileTap={selectedOption !== null ? { scale: 0.97 } : undefined}
                      onClick={handleConfirmAnswer}
                      disabled={selectedOption === null}
                      className={cn(
                        "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
                        selectedOption !== null
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                          : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                      )}
                    >
                      Submit Answer
                    </motion.button>
                  ) : (
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2 cursor-pointer"
                    >
                      {currentIndex < 19 ? 'Next' : 'Results'} <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── SIDEBAR ─────────────────────────────────────────────── */}
        <div className="lg:col-span-4 hidden lg:flex flex-col gap-2.5 min-h-0 overflow-hidden">
          {/* User Card */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-3 flex items-center gap-3 shrink-0">
            <motion.div
              animate={streak >= 3 ? { boxShadow: ['0 0 0px rgba(249,115,22,0)', '0 0 15px rgba(249,115,22,0.5)', '0 0 0px rgba(249,115,22,0)'] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shrink-0"
            >
              {profile.charAt(0).toUpperCase()}
            </motion.div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">{userName}</h4>
              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest truncate flex items-center gap-1">
                {environment === 'residential' ? <Home className="w-3 h-3 text-orange-400 inline" /> : <Factory className="w-3 h-3 text-orange-400 inline" />}
                {getProfileTitle()}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Streak</span>
              <span className="text-base font-black text-amber-400 font-mono flex items-center gap-0.5">
                {maxStreak} <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
            </div>
          </div>

          {/* Explanation Panel */}
          <div className="flex-1 bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-3 flex flex-col justify-center min-h-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              {isAnswered ? (
                <motion.div
                  key={`exp-${currentIndex}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest",
                    isCorrect ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                  )}>
                    {isCorrect ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    <span>{isCorrect ? 'Safe Decision!' : 'Danger Zone!'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentQuestion?.explanation}
                  </p>
                  {!isCorrect && currentQuestion && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Correct: {currentQuestion.options[currentQuestion.correctAnswer]}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-6 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    <Brain className="w-10 h-10 text-slate-700 mb-3" />
                  </motion.div>
                  <p className="text-xs text-slate-500 font-mono">Analyze the scenario...</p>
                  <p className="text-[10px] text-slate-600 mt-1">Then select the safest action.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress Stats Mini */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center shrink-0">
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Correct</span>
              <span className="text-base font-black text-emerald-400 font-mono">{correctCount}</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Wrong</span>
              <span className="text-base font-black text-rose-400 font-mono">{currentIndex - correctCount + (isAnswered ? 1 : 0) - (isCorrect ? 1 : 0)}</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Left</span>
              <span className="text-base font-black text-slate-300 font-mono">{19 - currentIndex}</span>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Explanation (only when answered, on mobile only) */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="lg:hidden col-span-1 bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-xl p-3"
            >
              <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-1", isCorrect ? "text-emerald-400" : "text-rose-400")}>
                {isCorrect ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                {isCorrect ? 'Correct!' : 'Wrong!'}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">{currentQuestion?.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
