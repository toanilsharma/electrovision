import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  AlertTriangle, ShieldCheck, Footprints, Zap, BookOpen, Target,
  ChevronRight, ChevronLeft, RotateCcw, Activity, Layers,
  Map, Eye, CheckCircle2, XCircle, HelpCircle, Info,
  ArrowRight, Wind, Mountain, CloudRain, TrendingDown, Settings,
  ChevronUp, ChevronDown, Sliders, ShieldAlert, Gauge, Play, Sparkles, HeartPulse, Pause
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { EmergencyResponse } from '../EmergencyResponse';
import { PPEValidator } from '../PPEValidator';
import { 
  calculateIEEE80, 
  calculateCs, 
  IEEE80Result,
  getPhysiologicalBodyImpact
} from '@/src/utils/ieee80';
import { StepTouchInstrument, ViewMode } from './StepTouchInstrument';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'simulator' | 'learn' | 'escape' | 'quiz';
type SoilType = 'dry_gravel' | 'wet_soil' | 'concrete' | 'dry_sand';
type HazardMode = 'step' | 'touch';

interface QuizQ {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SOIL_DATA: Record<SoilType, { label: string; rhoDry: number; rhoWet: number; color: string; desc: string }> = {
  dry_gravel:  { label: 'Gravel',   rhoDry: 3000, rhoWet: 600, color: '#78716c', desc: 'Crushed rock surface layer per IEEE 80' },
  dry_sand:    { label: 'Asphalt',  rhoDry: 10000,rhoWet: 1200,color: '#d4b483', desc: 'Asphalt paving surface layer' },
  concrete:    { label: 'Concrete', rhoDry: 200,   rhoWet: 100, color: '#64748b', desc: 'Substation concrete slab' },
  wet_soil:    { label: 'Bare Soil',rhoDry: 100,   rhoWet: 50,  color: '#4ade80', desc: 'Low resistivity natural earth' },
};

const QUIZ_QUESTIONS: QuizQ[] = [
  {
    question: 'What is "Step Potential" per IEEE Std 80-2000?',
    options: [
      'The voltage between your hands when touching a conductor',
      'The voltage difference between two feet placed 1 metre apart on the ground surface',
      'The electric potential of a substation transformer tank',
      'The potential required to trigger a circuit breaker'
    ],
    correct: 1,
    explanation: 'IEEE 80 defines step potential (E_step) as the potential difference between two points on the earth surface separated by a distance of 1 m (the standard human stride length).',
  },
  {
    question: 'Which safe escape technique is recommended when escaping a step potential zone?',
    options: [
      'Run as fast as possible in any direction',
      'Shuffle with small steps, keeping feet together',
      'Jump with both feet together away from the fault (bunny-hopping)',
      'Lie flat on the ground and roll away'
    ],
    correct: 2,
    explanation: 'Jumping with both feet together (bunny-hopping) eliminates the voltage gradient between your feet. If jumping is not possible, shuffle with tiny steps keeping feet touching.',
  },
  {
    question: 'According to IEEE 80, what is the surface layer derating factor Cs?',
    options: [
      'A safety factor for human body weight',
      'A factor accounting for the high-resistivity surface layer (e.g. crushed rock) reducing foot current',
      'The circuit breaker clearing speed multiplier',
      'The transformer impedance factor'
    ],
    correct: 1,
    explanation: 'IEEE 80 Eq. 89 defines Cs as the surface layer derating factor. A high-resistivity surface layer (like crushed rock) increases the foot resistance and reduces body current.',
  },
  {
    question: 'Touch potential is generally MORE dangerous than step potential because:',
    options: [
      'The voltage is always higher',
      'It bypasses soil resistivity and creates a direct hand-to-foot path through the heart',
      'It causes more external skin burns',
      'It lasts longer in time'
    ],
    correct: 1,
    explanation: 'Touch potential creates a hand-to-feet current path directly through the chest and cardiac region. The allowable limit multiplier is 1.5 for touch vs 6.0 for step potential.',
  },
  {
    question: 'Which PPE is effective against step potential hazards?',
    options: [
      'Insulated rubber gloves only',
      'Dielectric (Class E / Electrical Hazard) safety boots adding series resistance',
      'Hard hat and high-vis jacket',
      'Safety glasses and face shield'
    ],
    correct: 1,
    explanation: 'EH Safety boots add 10,000 Ω series resistance in each foot path, significantly reducing step potential body current. Note: Gloves provide NO protection for step potential between feet.',
  },
  {
    question: 'What body weights are standardized in IEEE 80 for tolerable voltage limits?',
    options: ['50 kg (0.116/√ts) and 70 kg (0.157/√ts)', '60 kg and 80 kg', '75 kg and 100 kg', '40 kg and 90 kg'],
    correct: 0,
    explanation: 'IEEE Std 80-2000 specifies body mass constants k = 0.116 for 50 kg body weight and k = 0.157 for 70 kg body weight to determine tolerable fibrillation current limits IB = k / √ts.',
  },
];

const LEARN_SECTIONS = [
  {
    id: 'what',
    icon: BookOpen,
    title: 'What is Step & Touch Potential?',
    color: 'orange',
    content: [
      { heading: 'Step Potential (E_step)', text: 'When short-circuit fault current flows into the earth from a grounded structure or fallen wire, it dissipates outward in concentric voltage contours. If you stand with your feet apart in this potential gradient, a voltage difference exists between your two feet. Current flows up one leg and down the other.' },
      { heading: 'Touch Potential (E_touch)', text: 'If you touch a metal structure (e.g. substation fence, transformer case, or steel pole) during a ground fault while standing on the ground, the voltage difference between your hand and your feet drives current directly through your heart.' },
      { heading: 'Ground Potential Rise (GPR)', text: 'GPR = I_fault × R_grid. The maximum electrical potential that a substation grounding grid may attain relative to a distant grounding point. GPR creates all step and touch potential hazards.' },
    ]
  },
  {
    id: 'formula',
    icon: Activity,
    title: 'IEEE Std 80-2000 & IEC 60479-1 Equations',
    color: 'cyan',
    content: [
      { heading: 'Tolerable Touch Limit (IEEE 80 Eq. 29/32)', text: 'E_touch = (1000 + 1.5 · Cs · ρs) × (I_B)\nwhere I_B = 0.116 / √ts (50 kg) or 0.157 / √ts (70 kg)' },
      { heading: 'Tolerable Step Limit (IEEE 80 Eq. 30/33)', text: 'E_step = (1000 + 6.0 · Cs · ρs) × (I_B)\n\nNote: Step limit is higher (coeff 6.0 vs 1.5) because current does not pass directly through the heart.' },
      { heading: 'Surface Derating Factor Cs (IEEE 80 Eq. 89)', text: 'Cs = 1 − [0.09 · (1 − ρ / ρs)] / (2 · hs + 0.09)\nρs = surface resistivity, ρ = soil resistivity, hs = layer thickness (0.1m)' },
      { heading: 'IEC 60479-1 Body Current Effects', text: 'AC-1 (<0.5mA): Imperceptible\nAC-2 (0.5-10mA): Perception & mild cramp\nAC-3 (10-30mA): Severe muscle tetany / asphyxiation risk\nAC-4 (>30mA / >IB): Ventricular Fibrillation & Cardiac Arrest' },
    ]
  },
];

// ─── WORLD-CLASS INTERACTIVE ESCAPE DRILL VISUALIZER ────────────────────────
function InteractiveEscapeVisualizer() {
  const [escapeMode, setEscapeMode] = useState<'hop' | 'shuffle' | 'walk'>('hop');
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0.2);
  const [showShockFlash, setShowShockFlash] = useState<boolean>(false);

  const gprVolts = 11000;
  const r0 = 0.5;
  const calcV = (dist: number) => {
    const x = Math.max(0.01, dist);
    return gprVolts * (2 / Math.PI) * Math.atan(r0 / x);
  };

  const distM = 0.5 + progress * 11.5;
  const strideGapM = escapeMode === 'walk' ? 0.9 : escapeMode === 'shuffle' ? 0.05 : 0.0;

  const foot1Dist = distM;
  const foot2Dist = distM + strideGapM;

  const v1 = calcV(foot1Dist);
  const v2 = calcV(foot2Dist);
  const deltaV = Math.abs(v1 - v2);

  const rTotal = 1000 + 2 * 1400;
  const bodyCurrentMA = (deltaV / rTotal) * 1000;

  const isShockActive = escapeMode === 'walk' && bodyCurrentMA > 10;

  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 0.95) return 0.1;
        return p + 0.015;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const handleTryWalkingNormally = () => {
    setEscapeMode('walk');
    setShowShockFlash(true);
    setTimeout(() => {
      setShowShockFlash(false);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-[650px] mx-auto select-none font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => { setEscapeMode('hop'); setIsAnimating(true); }}
            className={cn(
              "px-3 py-2 rounded-lg font-bold transition-all border cursor-pointer min-h-[44px] flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
              escapeMode === 'hop'
                ? "bg-green-600 text-slate-950 border-green-400 font-black shadow-md"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            )}
          >
            <Footprints className="w-4 h-4" /> BUNNY HOP (SAFE)
          </button>

          <button
            onClick={() => { setEscapeMode('shuffle'); setIsAnimating(true); }}
            className={cn(
              "px-3 py-2 rounded-lg font-bold transition-all border cursor-pointer min-h-[44px] flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
              escapeMode === 'shuffle'
                ? "bg-cyan-600 text-slate-950 border-cyan-400 font-black shadow-md"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            )}
          >
            <Footprints className="w-4 h-4" /> SHUFFLE STEPS (SAFE)
          </button>
        </div>

        <button
          onClick={handleTryWalkingNormally}
          className={cn(
            "px-3 py-2 font-black text-xs uppercase tracking-wider rounded-lg border shadow-md cursor-pointer transition-all flex items-center gap-1.5 min-h-[44px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
            escapeMode === 'walk'
              ? "bg-red-600 text-white border-red-400 animate-pulse shadow-red-900/50"
              : "bg-red-950 text-red-300 border-red-800 hover:bg-red-900"
          )}
        >
          <AlertTriangle className="w-4 h-4 text-yellow-300" /> TRY WALKING NORMALLY
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800 text-[11px] tabular-nums">
        <div className="bg-slate-900 p-2 rounded border border-slate-800">
          <span className="text-slate-400 text-[11px] block font-bold">Foot 1 Potential V1</span>
          <span className="text-cyan-300 font-black text-xs">{Math.round(v1)} V</span>
          <span className="text-[11px] text-slate-500 block">x1 = {foot1Dist.toFixed(1)}m</span>
        </div>

        <div className="bg-slate-900 p-2 rounded border border-slate-800">
          <span className="text-slate-400 text-[11px] block font-bold">Foot 2 Potential V2</span>
          <span className="text-amber-300 font-black text-xs">{Math.round(v2)} V</span>
          <span className="text-[11px] text-slate-500 block">x2 = {foot2Dist.toFixed(1)}m</span>
        </div>

        <div className="bg-slate-900 p-2 rounded border border-slate-800">
          <span className="text-slate-400 text-[11px] block font-bold">Step ΔV (V1 − V2)</span>
          <span className={cn("font-black text-xs", deltaV > 50 ? "text-red-400" : "text-green-400")}>
            {Math.round(deltaV)} V
          </span>
          <span className="text-[11px] text-slate-500 block">Stride = {strideGapM.toFixed(2)}m</span>
        </div>

        <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] block font-bold">Body Current I_body</span>
          <span className={cn("font-black text-xs", bodyCurrentMA >= 10 ? "text-red-400 animate-pulse" : "text-emerald-400")}>
            {bodyCurrentMA.toFixed(1)} mA
          </span>
          <span className="text-[11px] text-slate-500 block">
            {bodyCurrentMA >= 10 ? 'SHOCK HAZARD!' : 'SAFE RANGE'}
          </span>
        </div>
      </div>

      <div className="relative w-full aspect-[220/100] bg-[radial-gradient(ellipse_at_top,_#1e293b_0%,_#0f172a_100%)] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-2">
        <AnimatePresence>
          {(showShockFlash || (isShockActive && Math.sin(Date.now() / 80) > 0.3)) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 bg-red-600/50 z-30 pointer-events-none flex items-center justify-center"
            >
              <div className="bg-slate-950 border-2 border-red-500 text-yellow-300 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-bounce">
                <Zap className="w-5 h-5 text-yellow-300 animate-ping" />
                FATAL STEP SHOCK! ΔV = {Math.round(deltaV)} V ({bodyCurrentMA.toFixed(1)} mA)
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <svg viewBox="0 0 500 220" className="w-full h-full overflow-visible z-10">
          <rect x="20" y="160" width="460" height="40" fill="rgba(30,41,59,0.6)" rx="4" />
          <line x1="20" y1="160" x2="480" y2="160" stroke="#475569" strokeWidth="2" />

          <line x1="60" y1="30" x2="60" y2="160" stroke="#64748b" strokeWidth="4" />
          <line x1="40" y1="45" x2="80" y2="45" stroke="#64748b" strokeWidth="3" />
          <circle cx="60" cy="160" r="18" fill="rgba(249,115,22,0.3)" />
          <circle cx="60" cy="160" r="6" fill="#f97316" className="animate-ping" />
          <text x="60" y="22" textAnchor="middle" fill="#f97316" fontSize="11" fontWeight="black" fontFamily="monospace">
            FAULT (GPR 11.0 kV)
          </text>

          {[
            { m: 2, x: 60 + (2/15)*380, label: '2m', color: '#ef4444' },
            { m: 5, x: 60 + (5/15)*380, label: '5m High', color: '#f97316' },
            { m: 10, x: 60 + (10/15)*380, label: '10m Safe', color: '#22c55e' },
          ].map(z => (
            <g key={z.m}>
              <line x1={z.x} y1="40" x2={z.x} y2="160" stroke={z.color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
              <text x={z.x} y="176" textAnchor="middle" fill={z.color} fontSize="11" fontWeight="bold" fontFamily="monospace">
                {z.label}
              </text>
            </g>
          ))}

          {(() => {
            const posX = 60 + (progress) * 380;
            const hopY = escapeMode === 'hop' ? -Math.abs(Math.sin(progress * 40)) * 25 : 0;

            return (
              <g transform={`translate(${posX}, ${160 + hopY})`}>
                <g transform="translate(0, -75)">
                  <rect x="-50" y="0" width="100" height="20" rx="4" fill="#0f172a" stroke={escapeMode === 'walk' ? '#ef4444' : '#22c55e'} strokeWidth="1.5" />
                  <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">
                    ΔV = {Math.round(deltaV)} V ({distM.toFixed(1)}m)
                  </text>
                </g>

                <circle cx="0" cy="-48" r="6" fill="#fca5a5" />
                <path d="M -8,-51 Q 0,-59 8,-51 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />

                <path d="M -8,-22 L -10,-42 L 10,-42 L 8,-22 Z" fill="#f59e0b" />
                <line x1="-9" y1="-35" x2="9" y2="-35" stroke="#ffffff" strokeWidth="1.5" />

                <line x1="-10" y1="-40" x2="-14" y2="-24" stroke="#f59e0b" strokeWidth="3" />
                <line x1="10" y1="-40" x2="14" y2="-24" stroke="#f59e0b" strokeWidth="3" />

                {escapeMode === 'walk' ? (
                  <>
                    <line x1="-7" y1="-22" x2="-14" y2="0" stroke="#ef4444" strokeWidth="3.5" />
                    <line x1="7" y1="-22" x2="14" y2="0" stroke="#ef4444" strokeWidth="3.5" />
                    <rect x="-18" y="-3" width="8" height="4" fill="#ef4444" rx="1" />
                    <rect x="10" y="-3" width="8" height="4" fill="#ef4444" rx="1" />
                    
                    <path d="M -14,0 Q 0,-10 14,0" fill="none" stroke="#yellow" strokeWidth="2.5" className="animate-ping" />
                  </>
                ) : (
                  <>
                    <line x1="-3" y1="-22" x2="-3" y2="0" stroke="#22c55e" strokeWidth="3.5" />
                    <line x1="3" y1="-22" x2="3" y2="0" stroke="#22c55e" strokeWidth="3.5" />
                    <rect x="-6" y="-3" width="6" height="4" fill="#22c55e" rx="1" />
                    <rect x="0" y="-3" width="6" height="4" fill="#22c55e" rx="1" />
                  </>
                )}

                {distM >= 10 && (
                  <g transform="translate(0, -90)">
                    <rect x="-60" y="0" width="120" height="22" rx="4" fill="#065f46" stroke="#10b981" strokeWidth="1.5" />
                    <text x="0" y="15" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black" fontFamily="monospace">
                      SAFE EXIT! ΔV = 0 V ✓
                    </text>
                  </g>
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold text-cyan-300 text-[11px]">
            {escapeMode === 'hop' 
              ? 'Bunny Hopping (IEEE 80 Recommended): Keeps both feet together at the exact same ground potential (ΔV = 0 V).'
              : escapeMode === 'shuffle'
                ? 'Shuffle Steps (Alternative Safe Escape): Micro-stride shuffling ensures zero voltage difference between feet.'
                : 'DANGER: Normal walking stride creates a wide voltage differential across your legs!'}
          </span>
        </div>

        <button 
          onClick={() => setIsAnimating(a => !a)}
          className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-750 text-slate-200 rounded-lg text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isAnimating ? 'PAUSE' : 'PLAY'}
        </button>
      </div>
    </div>
  );
}

// ─── Quiz Component ────────────────────────────────────────────────────────────
function QuizTab() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean[]>(Array(QUIZ_QUESTIONS.length).fill(false));
  const [isComplete, setIsComplete] = useState(false);

  const q = QUIZ_QUESTIONS[current];
  const isAnswered = answered[current];

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    const correct = idx === q.correct;
    if (correct) setScore(s => s + 1);
    const newAnswered = [...answered];
    newAnswered[current] = true;
    setAnswered(newAnswered);
    if (current === QUIZ_QUESTIONS.length - 1 && newAnswered.every(Boolean)) {
      setTimeout(() => setIsComplete(true), 1500);
    }
  };

  const handleNext = () => {
    if (current < QUIZ_QUESTIONS.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  };

  const handleReset = () => {
    setCurrent(0); setSelected(null); setScore(0);
    setAnswered(Array(QUIZ_QUESTIONS.length).fill(false));
    setIsComplete(false);
  };

  if (isComplete) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
        <div className="text-5xl">🏆</div>
        <div>
          <p className="text-3xl font-black text-cyan-400 mb-1">{score}/{QUIZ_QUESTIONS.length}</p>
          <p className="text-lg font-bold uppercase tracking-widest text-cyan-300">IEEE 80 Quiz Score</p>
          <p className="text-slate-400 text-xs mt-2">{pct}% correct — IEEE Std 80-2000 Substation Grounding Knowledge verified.</p>
        </div>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-5 py-3 bg-orange-500/20 border border-orange-500/50 rounded-lg text-orange-400 text-xs font-bold uppercase tracking-wider hover:bg-orange-500/30 transition-colors cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none">
          <RotateCcw className="w-4 h-4" /> Retry Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${((current + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
        </div>
        <span className="text-[11px] font-mono text-slate-400">{current + 1}/{QUIZ_QUESTIONS.length}</span>
        <span className="text-[11px] font-mono text-green-400">{score} pts</span>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
        <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400 mb-1">Question {current + 1}</p>
        <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>
      </div>

      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isSelected = selected === i;
          let style = 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-orange-500/50 hover:text-white';
          if (isAnswered) {
            if (isCorrect) style = 'border-green-500 bg-green-500/15 text-green-400';
            else if (isSelected) style = 'border-red-500 bg-red-500/15 text-red-400';
            else style = 'border-slate-700 bg-slate-900/20 text-slate-500 opacity-60';
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)}
              className={cn('w-full flex items-center gap-3 p-3 rounded-lg border text-left text-xs transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none', style)}>
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/20 flex items-start gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>{q.explanation}</p>
        </div>
      )}

      {isAnswered && current < QUIZ_QUESTIONS.length - 1 && (
        <button onClick={handleNext}
          className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500/20 border border-orange-500/50 rounded-lg text-orange-400 text-xs font-bold uppercase tracking-wider hover:bg-orange-500/30 transition-colors cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none">
          Next Question <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Main IEEE 80 Step & Touch Simulator ──────────────────────────────────────
export function StepTouchSimulator({ config }: { config?: UserConfig }) {
  const [distance, setDistance] = useState<number>(3.5);
  const [hazardMode, setHazardMode] = useState<HazardMode>('step');
  const [soilType, setSoilType] = useState<SoilType>('dry_gravel');
  const [isRaining, setIsRaining] = useState<boolean>(false);
  const [hasEHBoots, setHasEHBoots] = useState<boolean>(false);
  const [hasGloves, setHasGloves] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabId>('simulator');
  const [activeView, setActiveView] = useState<ViewMode>('profile');
  const [scenarioTakeaway, setScenarioTakeaway] = useState<string | null>(null);

  const [showEngineerDetails, setShowEngineerDetails] = useState<boolean>(false);
  const [bodyWeightKg, setBodyWeightKg] = useState<50 | 70>(70);
  const [clearingTimeSec, setClearingTimeSec] = useState<number>(0.5);
  const [underlyingSoilType, setUnderlyingSoilType] = useState<'dry' | 'wet'>('dry');
  const [layerThicknessM, setLayerThicknessM] = useState<number>(0.10);
  const [faultCurrentKA, setFaultCurrentKA] = useState<number>(22);
  const [gridResistanceOhm, setGridResistanceOhm] = useState<number>(0.5);

  const [hasSimulated, setHasSimulated] = useState<boolean>(false);

  const effectiveDistance = hazardMode === 'touch' ? 1.0 : distance;

  const surfaceResistivity = isRaining
    ? SOIL_DATA[soilType].rhoWet
    : SOIL_DATA[soilType].rhoDry;

  const soilResistivity = underlyingSoilType === 'dry' ? 1000 : 100;

  const ieeeResults: IEEE80Result = useMemo(() => {
    return calculateIEEE80({
      bodyWeightKg,
      clearingTimeSec,
      surfaceResistivity,
      soilResistivity,
      layerThicknessM,
      faultCurrentKA,
      gridResistanceOhm,
      hasEHBoots,
      hasGloves
    });
  }, [
    bodyWeightKg, clearingTimeSec, surfaceResistivity, soilResistivity,
    layerThicknessM, faultCurrentKA, gridResistanceOhm, hasEHBoots, hasGloves
  ]);

  const actualStepVoltage = ieeeResults.calcActualStep(effectiveDistance);
  const actualTouchVoltage = ieeeResults.calcActualTouch(1.0);

  const isStepMode = hazardMode === 'step';

  const activeActualVoltage = isStepMode ? actualStepVoltage : actualTouchVoltage;
  const activeTolerableLimit = isStepMode ? ieeeResults.E_step_tolerable : ieeeResults.E_touch_tolerable;

  const isNativelySafe = activeActualVoltage <= activeTolerableLimit;

  const bodyEvaluation = useMemo(() => {
    return ieeeResults.calcBodyCurrent(activeActualVoltage, isStepMode, hasEHBoots, hasGloves);
  }, [ieeeResults, activeActualVoltage, isStepMode, hasEHBoots, hasGloves]);

  const isPPESafe = !bodyEvaluation.isFibrillationRisk;
  const isInDanger = !isPPESafe;

  const bodyImpact = useMemo(() => {
    return getPhysiologicalBodyImpact(
      bodyEvaluation.iBodymA,
      isStepMode,
      ieeeResults.IB_amp * 1000
    );
  }, [bodyEvaluation.iBodymA, isStepMode, ieeeResults.IB_amp]);

  useEffect(() => {
    if (isInDanger) setHasSimulated(true);
  }, [isInDanger]);

  const applyPreset = (presetType: 'switchyard' | 'storm' | 'earth_mat' | 'farm') => {
    switch (presetType) {
      case 'switchyard':
        setSoilType('dry_gravel');
        setIsRaining(false);
        setClearingTimeSec(0.1);
        setUnderlyingSoilType('dry');
        setGridResistanceOhm(0.5);
        setScenarioTakeaway('High surface resistivity + fast clearing (0.1s) = minimal risk!');
        break;
      case 'storm':
        setSoilType('wet_soil');
        setIsRaining(true);
        setUnderlyingSoilType('wet');
        setClearingTimeSec(0.5);
        setScenarioTakeaway('Rain destroys surface insulation, driving up foot current!');
        break;
      case 'earth_mat':
        setGridResistanceOhm(2.0);
        setFaultCurrentKA(22);
        setScenarioTakeaway('High grid resistance causes a massive GPR spike (44 kV)!');
        break;
      case 'farm':
        setSoilType('wet_soil');
        setIsRaining(false);
        setUnderlyingSoilType('wet');
        setClearingTimeSec(0.5);
        setScenarioTakeaway('Bare soil offers zero surface layer derating buffer (Cs ≈ 1.0).');
        break;
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'simulator', label: 'Simulator (IEEE 80)', icon: Zap },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'escape', label: 'Escape Guide', icon: Footprints },
    { id: 'quiz', label: 'Quiz', icon: Target },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950/20 text-slate-100">
      {/* Top Tab Bar & Specs Chip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-1.5 pb-0 shrink-0 border-b border-white/5 bg-slate-900/40">
        <div className="flex items-center gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none min-h-[44px]",
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-cyan-400 font-bold tabular-nums">
          <span className="text-slate-400">IEEE 80:</span>
          <span>GPR {ieeeResults.GPR_kV.toFixed(1)} kV = {faultCurrentKA} kA × {gridResistanceOhm} Ω</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400">ts = {clearingTimeSec}s</span>
          <span className="text-slate-600">|</span>
          <span className="text-purple-400">{bodyWeightKg} kg</span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className={cn("flex-1", activeTab === 'simulator' ? 'overflow-hidden' : 'overflow-y-auto')}>
        <AnimatePresence mode="wait">

          {/* ── SIMULATOR TAB (MOBILE 360x740 STACK ORDER COMPLIANT) ── */}
          {activeTab === 'simulator' && (
            <motion.div key="simulator"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="flex flex-col lg:flex-row h-full overflow-hidden">

              {/* 360x740 MOBILE STACK ORDER: 
                  1. Status Banner (aria-live="polite")
                  2. View-Switcher Diagram (50vh, StepTouchInstrument)
                  3. Danger Gauge & Controls Stack
              */}

              {/* RIGHT COLUMN ON DESKTOP, TOP DIAGRAM ON MOBILE (50vh height) */}
              <div className="w-full lg:w-1/2 shrink-0 h-[48vh] min-h-[320px] lg:h-full order-1 lg:order-2 flex flex-col relative shadow-2xl p-1.5 lg:p-3">
                <StepTouchInstrument
                  distance={effectiveDistance}
                  ieeeResults={ieeeResults}
                  hazardMode={hazardMode}
                  isNativelySafe={isNativelySafe}
                  isPPESafe={isPPESafe}
                  isRaining={isRaining}
                  activeView={activeView}
                  setActiveView={setActiveView}
                />
              </div>

              {/* LEFT COLUMN: Controls & Diagnostics Panel */}
              <div className="w-full lg:w-1/2 shrink-0 overflow-y-auto p-2 md:p-2.5 space-y-2 border-b lg:border-b-0 lg:border-r border-slate-800/50 order-2 lg:order-1 pb-16 lg:pb-3 scrollbar-thin scrollbar-thumb-slate-800">
                
                {/* 1. Status Verdict Header Banner (aria-live="polite") */}
                <div 
                  aria-live="polite" 
                  aria-atomic="true"
                  className={cn("p-2 rounded-lg border flex items-center justify-between transition-all duration-300 shadow-sm",
                    isInDanger ? 'bg-red-950/40 border-red-500/50' : 'bg-green-950/40 border-green-500/50')}
                >
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", isInDanger ? 'bg-red-500' : 'bg-green-400')} />
                    <span className={cn("text-xs font-black uppercase tracking-wider tabular-nums", isInDanger ? 'text-red-400' : 'text-green-400')}>
                      {isInDanger 
                        ? `FIBRILLATION RISK (${bodyEvaluation.iBodymA.toFixed(1)} mA ≥ ${ (ieeeResults.IB_amp*1000).toFixed(1) } mA)`
                        : `SAFE (${bodyEvaluation.iBodymA.toFixed(1)} mA < ${(ieeeResults.IB_amp*1000).toFixed(1)} mA)`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-750 text-slate-300 font-bold uppercase tracking-widest tabular-nums">
                    IEEE Std 80
                  </span>
                </div>

                {/* 2. Distance Slider & Zone Chips (2x2 Grid) */}
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-300">Distance & Zone Selection</span>
                    <span className="text-xs font-mono font-black text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-750 tabular-nums">
                      {effectiveDistance.toFixed(1)} m
                    </span>
                  </div>

                  {isStepMode ? (
                    <div className="space-y-2">
                      <input 
                        type="range" min={0.5} max={15} step={0.5} value={distance}
                        onChange={e => setDistance(Number(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-2.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none" 
                      />
                      {/* Zone Chips (2x2 Grid for Mobile 360px Touch Target Compliance) */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: '<2m Touch', val: 1.0 },
                          { label: '2-5m High Risk', val: 3.5 },
                          { label: '5-10m Caution', val: 7.0 },
                          { label: '≥10m Safe', val: 12.0 },
                        ].map(z => (
                          <button 
                            key={z.label} 
                            onClick={() => setDistance(z.val)}
                            className={cn(
                              "py-2 px-2 text-[11px] font-bold uppercase border rounded-lg cursor-pointer text-center truncate min-h-[44px] flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
                              distance === z.val 
                                ? 'border-orange-500 bg-orange-500/30 text-orange-300 font-extrabold shadow-md' 
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                            )}
                          >
                            {z.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-950 rounded-lg border border-red-500/30 text-[11px] text-red-300 font-bold text-center">
                      Touch mode fixes human contact at 1.0 m reach distance from energised structure.
                    </div>
                  )}
                </div>

                {/* 3. STEP / TOUCH Toggle (Segmented Control) */}
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase text-slate-300 block">Hazard Mode Toggle</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setHazardMode('step')}
                      className={cn(
                        "py-2 px-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
                        hazardMode === 'step'
                          ? "bg-orange-600 text-slate-950 border-orange-400 font-black shadow-md"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                      )}
                    >
                      <Footprints className="w-4 h-4" /> Step (E_step)
                    </button>
                    <button
                      onClick={() => setHazardMode('touch')}
                      className={cn(
                        "py-2 px-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
                        hazardMode === 'touch'
                          ? "bg-red-600 text-white border-red-400 font-black shadow-md"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                      )}
                    >
                      <Zap className="w-4 h-4" /> Touch (E_touch)
                    </button>
                  </div>
                </div>

                {/* 4. Surface Material Cards (2-Col Grid) & RAIN Toggle */}
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-cyan-400 uppercase">Surface Material & Rain</span>
                    <button 
                      onClick={() => setIsRaining(r => !r)} 
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 cursor-pointer transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none", 
                        isRaining ? "bg-sky-500/30 text-sky-300 border-sky-400 font-black" : "bg-slate-950 text-slate-400 border-slate-800"
                      )}
                    >
                      <CloudRain className="w-4 h-4 text-sky-400" /> {isRaining ? "RAIN ON" : "DRY"}
                    </button>
                  </div>

                  {/* Material Cards in 2-Column Grid */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.entries(SOIL_DATA) as [SoilType, typeof SOIL_DATA[SoilType]][]).map(([key, data]) => {
                      const activeRho = isRaining ? data.rhoWet : data.rhoDry;
                      return (
                        <button 
                          key={key} 
                          onClick={() => setSoilType(key)}
                          className={cn(
                            "p-2 rounded-lg border text-left transition-all cursor-pointer min-h-[44px] flex flex-col justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
                            soilType === key ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold shadow-md' : 'border-slate-800 bg-slate-950 text-slate-400'
                          )}
                        >
                          <span className="text-[11px] font-bold truncate">{data.label}</span>
                          <span className="text-[10px] font-mono text-slate-400 tabular-nums">{activeRho} Ω·m</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. PPE Controls & Readout Cards (2-Col Grid) */}
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-purple-400 block">Personal Protective Equipment (PPE)</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => setHasEHBoots(b => !b)} 
                      className={cn(
                        "p-2 rounded-lg border text-[11px] font-bold uppercase flex items-center justify-between cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none", 
                        hasEHBoots ? "bg-cyan-600 text-slate-950 border-cyan-400 font-black" : "bg-slate-950 text-slate-400 border-slate-800"
                      )}
                    >
                      <span>EH BOOTS (+10kΩ)</span>
                      <span>{hasEHBoots ? "✓" : "OFF"}</span>
                    </button>

                    <button 
                      onClick={() => { if (!isStepMode) setHasGloves(g => !g); }} 
                      disabled={isStepMode} 
                      className={cn(
                        "p-2 rounded-lg border text-[11px] font-bold uppercase flex items-center justify-between cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none", 
                        isStepMode ? "bg-slate-950 text-slate-600 border-slate-850 opacity-40" : hasGloves ? "bg-purple-600 text-white border-purple-400 font-black" : "bg-slate-950 text-slate-400 border-slate-800"
                      )}
                    >
                      <span>GLOVES (+10kΩ)</span>
                      <span>{isStepMode ? "N/A" : hasGloves ? "✓" : "OFF"}</span>
                    </button>
                  </div>
                </div>

                {/* Readout Cards (2-Col Grid) */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-bold">Derating Cs</span>
                    <span className="text-xs font-mono font-black text-cyan-300 tabular-nums">{ieeeResults.Cs.toFixed(3)}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-bold">IB Fibrillation Limit</span>
                    <span className="text-xs font-mono font-black text-purple-300 tabular-nums font-mono">{(ieeeResults.IB_amp * 1000).toFixed(1)} mA</span>
                  </div>
                </div>

                {/* 6. PROBABLE PHYSIOLOGICAL BODY IMPACT CARD */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <div className="flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-red-400 animate-pulse" />
                      <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                        Physiological Body Impact
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-black uppercase border" style={{ color: bodyImpact.severityColor, borderColor: bodyImpact.severityColor, backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
                      IEC Zone {bodyImpact.zoneCode}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-black block" style={{ color: bodyImpact.severityColor }}>
                      {bodyImpact.zoneTitle}
                    </span>
                    <p className="text-[11px] text-slate-300 font-mono leading-tight">
                      {bodyImpact.primaryEffect}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[11px] font-mono">
                    <span className="text-slate-400 font-bold">Affected Organs:</span>
                    {bodyImpact.affectedOrgans.map(organ => (
                      <span key={organ} className="bg-slate-950 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                        {organ}
                      </span>
                    ))}
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono border-t border-slate-850">
                    <span className="text-slate-500 italic">{bodyImpact.standardsRef}</span>
                    <span className="text-amber-400 font-bold">{bodyImpact.recommendation}</span>
                  </div>
                </div>

                {/* 7. Presets Row */}
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-bold text-amber-400 uppercase">
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Presets</span>
                    {scenarioTakeaway && <span className="text-[10px] font-normal text-slate-300 truncate max-w-[200px]">{scenarioTakeaway}</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <button onClick={() => applyPreset('switchyard')} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-bold text-slate-200 uppercase truncate text-center cursor-pointer min-h-[44px]">
                      Dry Yard
                    </button>
                    <button onClick={() => applyPreset('storm')} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-bold text-red-400 uppercase truncate text-center cursor-pointer min-h-[44px]">
                      Storm
                    </button>
                    <button onClick={() => applyPreset('earth_mat')} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-bold text-purple-400 uppercase truncate text-center cursor-pointer min-h-[44px]">
                      Earth Mat
                    </button>
                    <button onClick={() => applyPreset('farm')} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-bold text-amber-400 uppercase truncate text-center cursor-pointer min-h-[44px]">
                      Farms
                    </button>
                  </div>
                </div>

                {/* 8. Engineer Details Accordion */}
                <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                  <button
                    onClick={() => setShowEngineerDetails(prev => !prev)}
                    className="w-full p-2.5 bg-slate-850 hover:bg-slate-750 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-800 min-h-[44px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                        Engineer Details (IEEE 80 Accordion)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-semibold">
                      <span>{showEngineerDetails ? "Hide" : "Expand"}</span>
                      {showEngineerDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {showEngineerDetails && (
                    <div className="p-3 space-y-3 bg-slate-950/70 border-t border-slate-800 text-[11px]">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1 bg-slate-900 p-2 rounded border border-slate-800">
                          <span className="font-bold text-slate-300 block">Body Weight</span>
                          <div className="grid grid-cols-2 gap-1">
                            {[50, 70].map(wt => (
                              <button key={wt} onClick={() => setBodyWeightKg(wt as 50 | 70)} className={cn("py-2 text-[11px] font-bold rounded-lg border font-mono min-h-[44px]", bodyWeightKg === wt ? "bg-purple-600 text-white border-purple-400" : "bg-slate-950 text-slate-400 border-slate-800")}>
                                {wt}kg
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1 bg-slate-900 p-2 rounded border border-slate-800">
                          <span className="font-bold text-slate-300 block">Clearing ts: {clearingTimeSec.toFixed(2)}s</span>
                          <input type="range" min={0.05} max={1.0} step={0.05} value={clearingTimeSec} onChange={e => setClearingTimeSec(Number(e.target.value))} className="w-full accent-amber-500 cursor-pointer h-2.5" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-0.5">
                  <EmergencyResponse isSimulating={isInDanger} hasSimulated={hasSimulated} type="step_touch" />
                </div>

              </div>

            </motion.div>
          )}

          {/* ── LEARN TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'learn' && (
            <motion.div key="learn"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="p-4 space-y-4">
              {LEARN_SECTIONS.map((section) => (
                <details key={section.id} className="group rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <summary className="flex items-center gap-3 p-4 cursor-pointer list-none hover:bg-white/5 transition-colors">
                    <div className={cn("p-2 rounded-lg",
                      section.color === 'orange' ? 'bg-orange-500/20' :
                      section.color === 'cyan' ? 'bg-cyan-500/20' : 'bg-red-500/20')}>
                      <section.icon className={cn("w-4 h-4",
                        section.color === 'orange' ? 'text-orange-400' :
                        section.color === 'cyan' ? 'text-cyan-400' : 'text-red-400')} />
                    </div>
                    <span className="text-sm font-bold text-white flex-1">{section.title}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
                    {section.content.map((item, i) => (
                      <div key={i}>
                        <h4 className={cn("text-[11px] font-black uppercase tracking-widest mb-1.5 border-l-2 pl-2",
                          section.color === 'orange' ? 'text-orange-400 border-orange-500' :
                          section.color === 'cyan' ? 'text-cyan-400 border-cyan-500' : 'text-red-400 border-red-500')}>
                          {item.heading}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-line">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </motion.div>
          )}

          {/* ── ESCAPE GUIDE TAB ──────────────────────────────────────────── */}
          {activeTab === 'escape' && (
            <motion.div key="escape"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="p-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span className="font-bold text-orange-400 uppercase tracking-wider">
                  Interactive Escape Drill & Real-Time Physics Telemetry
                </span>
                <span className="text-[11px] text-slate-400">IEEE Std 80-2000 Physics Telemetry</span>
              </div>

              <InteractiveEscapeVisualizer />
            </motion.div>
          )}

          {/* ── QUIZ TAB ──────────────────────────────────────────────────── */}
          {activeTab === 'quiz' && (
            <motion.div key="quiz"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="p-4">
              <QuizTab />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
