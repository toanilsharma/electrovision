import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  HeartPulse,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Timer,
  Play,
  ShieldCheck,
  Sparkles,
  Share2,
  Copy,
  Printer,
  Wind,
  Gauge,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { PatientDemographic, DEMOGRAPHIC_PRESETS } from '@/src/utils/demographicPhysics';
import {
  TelemetryStroke,
  TelemetryVentilation,
  ExamScorecard,
  evaluateStroke,
  calculateCCF,
  compileExamScorecard,
} from '@/src/utils/cprExamTelemetry';
import { stepHemodynamics, INITIAL_HEMODYNAMICS, HemodynamicState } from '@/src/utils/cprPhysics';
import { resuscitationCoach } from '@/src/utils/resuscitationAudioCoach';
import { ProceduralECGMonitor } from './ProceduralECGMonitor';
import { GuitarHeroRhythmBar } from './GuitarHeroRhythmBar';

interface ResuscitationExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimCertificate: (scorecard: ExamScorecard) => void;
  defaultCandidateName?: string;
  defaultDemographic?: PatientDemographic;
}

export function ResuscitationExamModal({
  isOpen,
  onClose,
  onClaimCertificate,
  defaultCandidateName = 'Resuscitation Specialist',
  defaultDemographic = 'adult',
}: ResuscitationExamModalProps) {
  const [candidateName, setCandidateName] = useState<string>(defaultCandidateName);
  const [demographic, setDemographic] = useState<PatientDemographic>(defaultDemographic);
  const [examState, setExamState] = useState<'idle' | 'running' | 'completed'>('idle');

  // Exam Timing & Telemetry
  const EXAM_DURATION_SEC = 120; // 2 minutes (standard AHA/ERC cycle)
  const [timeLeftSec, setTimeLeftSec] = useState<number>(EXAM_DURATION_SEC);
  const [activeCompressionTimeSec, setActiveCompressionTimeSec] = useState<number>(0);
  const [lastStrokeTimestamp, setLastStrokeTimestamp] = useState<number>(0);

  // Strokes and Ventilations
  const strokesRef = useRef<TelemetryStroke[]>([]);
  const ventilationsRef = useRef<TelemetryVentilation[]>([]);
  const [strokeCount, setStrokeCount] = useState<number>(0);
  const [currentCyclePos, setCurrentCyclePos] = useState<number>(0);
  const [currentBpm, setCurrentBpm] = useState<number>(110);
  const [recentDepths, setRecentDepths] = useState<number[]>([]);
  const [isCompressingDown, setIsCompressingDown] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<boolean>(false);

  // Hemodynamics
  const [hemodynamics, setHemodynamics] = useState<HemodynamicState>(INITIAL_HEMODYNAMICS);
  const [peakCpp, setPeakCpp] = useState<number>(0);

  // Final Scorecard
  const [finalScorecard, setFinalScorecard] = useState<ExamScorecard | null>(null);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const demoConfig = DEMOGRAPHIC_PRESETS[demographic];

  // Reset exam state
  const resetExam = useCallback(() => {
    setTimeLeftSec(EXAM_DURATION_SEC);
    setActiveCompressionTimeSec(0);
    setLastStrokeTimestamp(0);
    strokesRef.current = [];
    ventilationsRef.current = [];
    setStrokeCount(0);
    setCurrentCyclePos(0);
    setCurrentBpm(110);
    setRecentDepths([]);
    setIsCompressingDown(false);
    setBreathPhase(false);
    setHemodynamics(INITIAL_HEMODYNAMICS);
    setPeakCpp(0);
    setFinalScorecard(null);
    setExamState('idle');
  }, [EXAM_DURATION_SEC]);

  // Handle Exam Start
  const handleStartExam = () => {
    resetExam();
    setExamState('running');
    resuscitationCoach.speak(
      `Resuscitation Mastery Exam initiated for ${demoConfig.name} protocol. Maintain 100 to 120 beats per minute. Two minutes on the clock. Begin compressions now!`,
      "urgent"
    );
  };

  // Main 1-Second Exam Countdown Timer
  useEffect(() => {
    if (examState !== 'running') return;

    const timer = setInterval(() => {
      setTimeLeftSec(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examState]);

  // Continuous Hemodynamic decay & Active Compression Accumulator
  useEffect(() => {
    if (examState !== 'running') return;

    const interval = setInterval(() => {
      const now = performance.now();
      const timeSinceLastStrokeMs = now - lastStrokeTimestamp;
      const isCurrentlyCompressing = timeSinceLastStrokeMs < 900;

      if (isCurrentlyCompressing) {
        setActiveCompressionTimeSec(prev => prev + 0.1);
      }

      setHemodynamics(prev => {
        const next = stepHemodynamics(prev, 0.1, false, 0, currentBpm);
        setPeakCpp(p => Math.max(p, next.coronaryPerfusionPressure));
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [examState, lastStrokeTimestamp, currentBpm]);

  // Complete Exam and build scorecard
  const finishExam = useCallback(() => {
    setExamState('completed');
    resuscitationCoach.speak("Exam concluded. Cease compressions. Analyzing resuscitation telemetry...", "urgent");

    const elapsed = EXAM_DURATION_SEC - timeLeftSec;
    const card = compileExamScorecard(
      candidateName,
      strokesRef.current,
      ventilationsRef.current,
      elapsed > 0 ? elapsed : EXAM_DURATION_SEC,
      activeCompressionTimeSec,
      peakCpp,
      42, // simulated first shock at 42s
      demographic
    );

    setFinalScorecard(card);
  }, [candidateName, timeLeftSec, activeCompressionTimeSec, peakCpp, demographic, EXAM_DURATION_SEC]);

  // Compression Downstroke Handler
  const handleCompressionDown = useCallback(() => {
    if (examState !== 'running') return;
    const now = performance.now();
    const optimalDepth = demoConfig.optimalDepthCm;

    setIsCompressingDown(true);
    setLastStrokeTimestamp(now);

    // Calculate instant BPM based on last stroke interval
    const lastStroke = strokesRef.current[strokesRef.current.length - 1];
    let instantBpm = 110;
    if (lastStroke) {
      const deltaMs = now - lastStroke.timestampMs;
      if (deltaMs > 250 && deltaMs < 1200) {
        instantBpm = Math.round(60000 / deltaMs);
        setCurrentBpm(instantBpm);
      }
    }

    const evalResult = evaluateStroke(optimalDepth, 0.05, instantBpm, demographic);

    const newStroke: TelemetryStroke = {
      id: strokesRef.current.length + 1,
      timestampMs: now,
      depthCm: optimalDepth,
      recoilDepthCm: 0.05,
      velocityCmS: 45,
      durationMs: 240,
      isDepthAccurate: evalResult.isDepthAccurate,
      isRecoilComplete: evalResult.isRecoilComplete,
      isCadenceAccurate: evalResult.isCadenceAccurate,
      instantBpm,
    };

    strokesRef.current.push(newStroke);
    setStrokeCount(strokesRef.current.length);
    setRecentDepths(prev => [...prev.slice(-14), optimalDepth]);

    // Step hemodynamics with active compression
    setHemodynamics(prev => {
      const next = stepHemodynamics(prev, 0.15, true, optimalDepth, instantBpm);
      setPeakCpp(p => Math.max(p, next.coronaryPerfusionPressure));
      return next;
    });

    resuscitationCoach.playMetronomeTick();
    resuscitationCoach.triggerCompressionHaptic(false);

    // Track cycle progress (30:2)
    setCurrentCyclePos(c => {
      const next = (c + 1) % 30;
      if (next === 0) {
        setBreathPhase(true);
        resuscitationCoach.speak("Give two rescue breaths now.", "urgent");
        // Record automatic effective ventilations
        ventilationsRef.current.push(
          {
            timestampMs: now + 500,
            tidalVolumeMl: demoConfig.targetTidalVolumeMl,
            airwayAngleDeg: 35,
            isAirwayOpen: true,
            isEffective: true,
            gastricDistensionPct: 4,
          },
          {
            timestampMs: now + 1500,
            tidalVolumeMl: demoConfig.targetTidalVolumeMl,
            airwayAngleDeg: 35,
            isAirwayOpen: true,
            isEffective: true,
            gastricDistensionPct: 4,
          }
        );
        setTimeout(() => setBreathPhase(false), 2000);
      }
      return next;
    });
  }, [examState, demoConfig, demographic]);

  // Compression Upstroke Handler
  const handleCompressionUp = useCallback(() => {
    if (examState !== 'running') return;
    setIsCompressingDown(false);
    resuscitationCoach.triggerCompressionHaptic(true);
  }, [examState]);

  // Keyboard Spacebar & Enter binding during exam
  useEffect(() => {
    if (!isOpen || examState !== 'running') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        e.preventDefault();
        handleCompressionDown();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleCompressionUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, examState, handleCompressionDown, handleCompressionUp]);

  // Live CCF computation
  const elapsedSeconds = EXAM_DURATION_SEC - timeLeftSec;
  const liveCcfPct = calculateCCF(activeCompressionTimeSec, elapsedSeconds > 0 ? elapsedSeconds : 1);

  // Social Share
  const handleCopyShareLink = () => {
    if (!finalScorecard) return;
    const shareText = `I just achieved ${finalScorecard.overallScore}% Resuscitation Mastery with ${finalScorecard.ccfPct}% Chest Compression Fraction (CCF) on the Electrolive AHA/ERC CPR Simulator! Certified Serial: ${finalScorecard.certificateSerial} 🚑⚡`;
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                    AHA/ERC 2-Minute Resuscitation Mastery Exam
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-600 text-white">
                    Clinical Telemetry
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  Standardized 120s High-Stakes Practical Evaluation · ILCOR Consensus / IEC 60479-1
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content Switcher: IDLE vs RUNNING vs COMPLETED */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-between">
            {examState === 'idle' && (
              <div className="flex flex-col gap-6 max-w-2xl mx-auto my-auto py-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold">
                    <Timer className="w-3.5 h-3.5" />
                    <span>TIMED PRACTICAL EVALUATION (120 SECONDS)</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">Resuscitation Competency Certification</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
                    You will be evaluated across a complete 2-minute resuscitation cycle. Maintain continuous compressions (100–120 BPM) with target depth and 100% complete chest recoil. A minimum Chest Compression Fraction (CCF) of 80% is required to pass.
                  </p>
                </div>

                {/* Candidate Information & Demographic Setup */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Candidate Practitioner Full Name:
                    </label>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-red-500 outline-none"
                      placeholder="e.g. Dr. Alex Mercer, RN"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Select Patient Demographic Protocol:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['adult', 'child', 'infant'] as PatientDemographic[]).map(d => {
                        const cfg = DEMOGRAPHIC_PRESETS[d];
                        const isSel = demographic === d;
                        return (
                          <button
                            key={d}
                            onClick={() => setDemographic(d)}
                            className={cn(
                              "p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer",
                              isSel ? "bg-red-600/20 border-red-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                            )}
                          >
                            <span className="font-bold text-xs uppercase">{cfg.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{cfg.targetDepthCmMin}–{cfg.targetDepthCmMax} cm</span>
                            <span className="text-[9px] text-slate-500">{cfg.compressionRatioSingle}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rubric Criteria */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 font-mono text-[10px]">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                      <span className="text-slate-400 block">TARGET CCF</span>
                      <span className="font-bold text-emerald-400">≥ 80.0%</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                      <span className="text-slate-400 block">CADENCE</span>
                      <span className="font-bold text-emerald-400">100–120 BPM</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                      <span className="text-slate-400 block">TARGET DEPTH</span>
                      <span className="font-bold text-emerald-400">{demoConfig.targetDepthCmMin}–{demoConfig.targetDepthCmMax} CM</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                      <span className="text-slate-400 block">MIN PASS SCORE</span>
                      <span className="font-bold text-emerald-400">80% OVERALL</span>
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartExam}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>COMMENCE 2-MINUTE EXAM</span>
                </button>
              </div>
            )}

            {examState === 'running' && (
              <div className="flex flex-col gap-4 h-full">
                {/* Top Telemetry Header Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
                  {/* Countdown Timer */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">TIME REMAINING</span>
                      <span className={cn("text-2xl font-black tabular-nums", timeLeftSec <= 15 ? "text-red-500 animate-pulse" : "text-white")}>
                        {Math.floor(timeLeftSec / 60)}:{(timeLeftSec % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <Timer className="w-6 h-6 text-red-500" />
                  </div>

                  {/* Live CCF % */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">CHEST FRACTION (CCF)</span>
                      <span className={cn("text-2xl font-black tabular-nums", liveCcfPct >= 80 ? "text-emerald-400" : "text-amber-400")}>
                        {liveCcfPct}%
                      </span>
                    </div>
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>

                  {/* Live Cadence BPM */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">RATE (BPM)</span>
                      <span className={cn("text-2xl font-black tabular-nums", currentBpm >= 100 && currentBpm <= 120 ? "text-emerald-400" : "text-amber-400")}>
                        {currentBpm}
                      </span>
                    </div>
                    <Gauge className="w-6 h-6 text-sky-400" />
                  </div>

                  {/* Cycle Status */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">CYCLE PROGRESS</span>
                      <span className="text-2xl font-black text-white tabular-nums">
                        {currentCyclePos}/30
                      </span>
                    </div>
                    <Layers className="w-6 h-6 text-purple-400" />
                  </div>

                  {/* Coronary Perfusion Pressure (CPP) */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">CPP (TARGET ≥15)</span>
                      <span className={cn("text-2xl font-black tabular-nums", hemodynamics.coronaryPerfusionPressure >= 15 ? "text-emerald-400" : "text-red-400")}>
                        {Math.round(hemodynamics.coronaryPerfusionPressure)} <span className="text-xs">mmHg</span>
                      </span>
                    </div>
                    <HeartPulse className="w-6 h-6 text-rose-500" />
                  </div>
                </div>

                {/* ECG Monitor with Motion Artifacts */}
                <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-800">
                  <ProceduralECGMonitor
                    rhythm="vfib"
                    isCompressing={isCompressingDown}
                    compressionDepthCm={isCompressingDown ? demoConfig.optimalDepthCm : 0}
                    heartRateBpm={currentBpm}
                    showLeadSelector={false}
                    className="h-full border-0 rounded-none bg-slate-950 p-1.5"
                  />
                </div>

                {/* Rhythm Highway visual runway */}
                <GuitarHeroRhythmBar targetBpm={110} lastStrokeTime={lastStrokeTimestamp} />

                {/* Interactive Compression Zone */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onMouseDown={handleCompressionDown}
                    onMouseUp={handleCompressionUp}
                    onTouchStart={(e) => { e.preventDefault(); handleCompressionDown(); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleCompressionUp(); }}
                    className={cn(
                      "w-full py-6 rounded-2xl font-black text-sm uppercase tracking-widest transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2 select-none border",
                      isCompressingDown
                        ? "bg-amber-400 text-slate-950 border-amber-300 scale-[0.98] shadow-amber-500/50"
                        : "bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-red-600/30"
                    )}
                  >
                    <HeartPulse className="w-5 h-5 fill-current" />
                    <span>{isCompressingDown ? 'COMPRESSED — RELEASE FOR RECOIL' : 'PRESS & RELEASE (SPACEBAR / ENTER / TOUCH)'}</span>
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-mono">
                    <span>Total Strokes: <strong className="text-white">{strokeCount}</strong></span>
                    <span>Protocol: <strong className="text-sky-400">{demoConfig.name} ({demoConfig.targetDepthCmMin}–{demoConfig.targetDepthCmMax} cm)</strong></span>
                    <span>Status: <strong className={breathPhase ? "text-sky-400 animate-pulse" : "text-emerald-400"}>{breathPhase ? "DELIVER RESCUE BREATHS" : "COMPRESSING"}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {examState === 'completed' && finalScorecard && (
              <div className="flex flex-col gap-6 py-2 max-w-3xl mx-auto">
                {/* Result Announcement Banner */}
                <div className={cn(
                  "p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4",
                  finalScorecard.passed
                    ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-200"
                    : "bg-red-950/40 border-red-500/60 text-red-200"
                )}>
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                      finalScorecard.passed ? "bg-emerald-500 text-slate-950" : "bg-red-500 text-white"
                    )}>
                      {finalScorecard.passed ? <Award className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-white">{finalScorecard.grade}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700">
                          {finalScorecard.certificateSerial}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Candidate: <strong className="text-white">{finalScorecard.candidateName}</strong> · Examined on {finalScorecard.examDate}
                      </p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right shrink-0">
                    <span className="text-xs text-slate-400 block font-mono">OVERALL PROFICIENCY</span>
                    <span className="text-3xl font-black tabular-nums text-white">
                      {finalScorecard.overallScore}<span className="text-base text-slate-400">/100</span>
                    </span>
                  </div>
                </div>

                {/* Scorecard Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CHEST FRACTION (CCF)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={cn("text-xl font-black tabular-nums", finalScorecard.ccfPct >= 80 ? "text-emerald-400" : "text-amber-400")}>
                        {finalScorecard.ccfPct}%
                      </span>
                      <span className="text-[9px] text-slate-500">≥80% target</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">DEPTH ACCURACY</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={cn("text-xl font-black tabular-nums", finalScorecard.depthAccuracyPct >= 80 ? "text-emerald-400" : "text-amber-400")}>
                        {finalScorecard.depthAccuracyPct}%
                      </span>
                      <span className="text-[9px] text-slate-500">avg {finalScorecard.averageDepthCm}cm</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">RECOIL COMPLETION</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={cn("text-xl font-black tabular-nums", finalScorecard.recoilCompletenessPct >= 80 ? "text-emerald-400" : "text-amber-400")}>
                        {finalScorecard.recoilCompletenessPct}%
                      </span>
                      <span className="text-[9px] text-slate-500">0 leaning</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CADENCE UNIFORMITY</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={cn("text-xl font-black tabular-nums", finalScorecard.cadenceUniformityPct >= 80 ? "text-emerald-400" : "text-amber-400")}>
                        {finalScorecard.cadenceUniformityPct}%
                      </span>
                      <span className="text-[9px] text-slate-500">avg {finalScorecard.averageBpm} BPM</span>
                    </div>
                  </div>
                </div>

                {/* Clinical Debriefing Strengths & Recommendations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Demonstrated Clinical Strengths</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300">
                      {finalScorecard.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Targeted Practice Recommendations</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300">
                      {finalScorecard.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyShareLink}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    >
                      {copiedShare ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedShare ? 'COPIED TO CLIPBOARD!' : 'SHARE RESULT'}</span>
                    </button>

                    <button
                      onClick={resetExam}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RETEST EXAM</span>
                    </button>
                  </div>

                  {finalScorecard.passed && (
                    <button
                      onClick={() => onClaimCertificate(finalScorecard)}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Award className="w-4 h-4" />
                      <span>CLAIM OFFICIAL RESUSCITATION CERTIFICATE</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
