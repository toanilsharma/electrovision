import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock, Shield, CheckCircle, AlertTriangle,
  ChevronRight, ChevronLeft, RotateCcw, Zap, Eye, BookOpen,
  ClipboardList, HelpCircle, CheckCircle2, XCircle, Power,
  Unlock, Info, Award, ArrowRight, Sparkles, Filter, RefreshCw, Skull,
  Volume2, VolumeX, FileText, Timer, Printer, Activity, Gauge
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { UserConfig } from "@/src/types";
import { assessmentAudio } from "@/src/utils/assessmentSound";
import { LOTO_QUESTION_BANK, LOTOQuizQuestion } from "@/src/data/lotoQuestions";
import { LOTOFailureConsequenceModal } from "./LOTOFailureConsequenceModal";
import { LOTOPermitModal } from "./LOTOPermitModal";
import { LOTOPracticalExamModal } from "./LOTOPracticalExamModal";
import { LOTOCertificateModal } from "./LOTOCertificateModal";
import { LOTOMachineryVisualEngine, LOTOMachineryState, lotoAudio } from "./LOTOMachineryVisualEngine";

type TabId = "procedure" | "learn" | "checklist" | "quiz";

interface PreparedQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

const LOTO_STEPS = [
  {
    id: 1,
    title: "Preparation",
    shortTitle: "1. Prepare",
    color: "#f59e0b",
    bgClass: "bg-amber-500/25 border-amber-500/60",
    textClass: "text-amber-300",
    icon: Eye,
    hazardLevel: "High",
    desc: "Identify ALL energy sources — electrical, hydraulic, pneumatic, mechanical, thermal, and chemical. Review equipment drawings and notify all affected employees.",
    keyPoints: ["Identify every energy source", "Review lockout procedure document", "Notify all affected workers", "Gather locks, tags, and tools"],
    regulation: "OSHA 29 CFR 1910.147",
    warning: "Missing even one energy source can be fatal."
  },
  {
    id: 2,
    title: "Equipment Shutdown",
    shortTitle: "2. Shutdown",
    color: "#ef4444",
    bgClass: "bg-red-500/25 border-red-500/60",
    textClass: "text-red-300",
    icon: Power,
    hazardLevel: "Critical",
    desc: "Follow the normal stopping procedure to turn off the equipment using designated pushbuttons. Do not disconnect power under load.",
    keyPoints: ["Use normal stop procedure", "Confirm all moving parts have stopped", "Verify zero load current", "Check tachometer reads 0 RPM"],
    regulation: "OSHA 29 CFR 1910.147(d)(2)",
    warning: "Never assume equipment is off without visual & instrument proof."
  },
  {
    id: 3,
    title: "Energy Isolation",
    shortTitle: "3. Isolate",
    color: "#8b5cf6",
    bgClass: "bg-violet-500/25 border-violet-500/60",
    textClass: "text-violet-300",
    icon: Shield,
    hazardLevel: "Critical",
    desc: "Physically isolate the equipment from ALL energy sources by pulling disconnect switches and closing pneumatic ball valves with a visible physical air gap.",
    keyPoints: ["Open 400A knife switch", "Visually confirm physical air gap", "Close pneumatic supply ball valve", "Positive physical disconnect required"],
    regulation: "OSHA 29 CFR 1910.147(d)(3)",
    warning: "Each energy source must have its own positive physical isolation device."
  },
  {
    id: 4,
    title: "Lockout / Tagout",
    shortTitle: "4. Lock & Tag",
    color: "#f97316",
    bgClass: "bg-orange-500/25 border-orange-500/60",
    textClass: "text-orange-300",
    icon: Lock,
    hazardLevel: "Critical",
    desc: "Apply your standardized red Master Lock 410 through a 6-hole steel hasp and attach a signed OSHA danger tag. Each authorized worker uses their own personal lock.",
    keyPoints: ["Apply 6-hole safety hasp", "Snap personal Master Lock 410", "Attach signed OSHA Danger Tag", "One key per lock kept by technician"],
    regulation: "OSHA 29 CFR 1910.147(d)(4)",
    warning: "A tag alone is only a warning — only a physical LOCK prevents energization."
  },
  {
    id: 5,
    title: "Stored Energy Release",
    shortTitle: "5. Bleed Energy",
    color: "#06b6d4",
    bgClass: "bg-cyan-500/25 border-cyan-500/60",
    textClass: "text-cyan-300",
    icon: Zap,
    hazardLevel: "High",
    desc: "Release, bleed, or block ALL stored residual energy: vent pneumatic accumulator pressure to 0 PSI, discharge DC capacitor banks to 0V, and block gravity loads.",
    keyPoints: ["Discharge DC bus capacitors to 0V", "Bleed air pressure lines to 0 PSI", "Block suspended gravity loads with die block", "Allow hot surfaces to cool"],
    regulation: "OSHA 29 CFR 1910.147(d)(5)",
    warning: "Stored residual energy causes 30% of fatal LOTO maintenance accidents."
  },
  {
    id: 6,
    title: "Verification",
    shortTitle: "6. Verify Zero",
    color: "#22c55e",
    bgClass: "bg-green-500/25 border-green-500/60",
    textClass: "text-green-300",
    icon: CheckCircle2,
    hazardLevel: "Safety Check",
    desc: "Execute the NFPA 70E 'Live-Dead-Live' test sequence using a calibrated CAT IV True-RMS meter, and press the machine TRY button to confirm zero start capability.",
    keyPoints: ["Test meter on known live 230V source", "Test machine terminals for 0.00V", "Re-verify meter on live source", "Attempt restart with TRY button (must NOT start)"],
    regulation: "OSHA 29 CFR 1910.147(d)(6) · NFPA 70E",
    warning: "NEVER touch terminals without proving the meter is operating via Live-Dead-Live."
  },
];

const LEARN_CARDS = [
  { title: "What is LOTO?", color: "#f59e0b", icon: Lock, content: "Lockout/Tagout (LOTO) is a safety procedure that protects workers from unexpected energization, startup, or release of stored energy during servicing and maintenance of machinery.", stat: "120 workers killed annually", statSub: "when LOTO is bypassed (OSHA report)" },
  { title: "Energy Types", color: "#8b5cf6", icon: Zap, content: "LOTO must address ALL 6 hazardous energy forms: Electrical, Pneumatic, Hydraulic, Mechanical (springs/flywheel/gravity), Thermal (steam/heaters), and Chemical.", stat: "6 energy types", statSub: "must ALL be completely neutralized" },
  { title: "Who Is Authorized?", color: "#06b6d4", icon: Shield, content: "Authorized employees apply lockout/tagout. Affected employees operate equipment and must be notified. Other workers must maintain safe boundaries outside the perimeter.", stat: "3 worker roles", statSub: "Authorized · Affected · Other" },
  { title: "Release Sequence", color: "#22c55e", icon: Unlock, content: "To restore energy: Ensure tools are removed, guards reinstalled, and workers clear. Each authorized specialist removes ONLY their own personal lock before re-energization.", stat: "Reverse steps 1 to 6", statSub: "only after all work is certified complete" },
];

const CHECKLIST_ITEMS = [
  { id: 1, category: "Before Start", text: "LOTO procedure document obtained and reviewed", critical: true },
  { id: 2, category: "Before Start", text: "All energy sources identified and listed", critical: true },
  { id: 3, category: "Before Start", text: "Affected employees notified of shutdown", critical: false },
  { id: 4, category: "Before Start", text: "Required PPE obtained (gloves, safety glasses)", critical: false },
  { id: 5, category: "Shutdown", text: "Equipment shut down using normal procedure", critical: true },
  { id: 6, category: "Shutdown", text: "All moving parts have come to complete rest", critical: true },
  { id: 7, category: "Isolation", text: "All electrical disconnects opened and verified", critical: true },
  { id: 8, category: "Isolation", text: "All pneumatic/hydraulic valves closed", critical: true },
  { id: 9, category: "Lock & Tag", text: "Personal lock applied to each isolation device", critical: true },
  { id: 10, category: "Lock & Tag", text: "Signed danger tag applied next to each lock", critical: true },
  { id: 11, category: "Energy Release", text: "Electrical capacitors discharged", critical: true },
  { id: 12, category: "Energy Release", text: "Pneumatic/hydraulic pressure bled to zero", critical: true },
  { id: 13, category: "Energy Release", text: "Spring-loaded or gravity components blocked", critical: false },
  { id: 14, category: "Verification", text: "Attempted to start equipment — did NOT start", critical: true },
  { id: 15, category: "Verification", text: "Voltage tested with calibrated meter — reads ZERO", critical: true },
  { id: 16, category: "Verification", text: "All energy verification documented and signed", critical: false },
];

const HARDWARE_TOOLS = [
  [{ name: "Hazard Survey", icon: "📋" }, { name: "LOTO Permit PTW", icon: "📜" }, { name: "Arc Flash PPE", icon: "🦺" }],
  [{ name: "Stop Pushbutton", icon: "🔴" }, { name: "Tachometer", icon: "⏱️" }, { name: "Ammeter", icon: "📟" }],
  [{ name: "400A Knife Switch", icon: "🔌" }, { name: "Air Ball Valve", icon: "🚰" }, { name: "Air Gap Verification", icon: "↔️" }],
  [{ name: "Master Lock 410", icon: "🔒" }, { name: "6-Hole Steel Hasp", icon: "⛓️" }, { name: "OSHA Danger Tag", icon: "🏷️" }],
  [{ name: "Pneumatic Relief Valve", icon: "💨" }, { name: "DC Bleeder Resistor", icon: "⚡" }, { name: "Die Safety Block", icon: "🧱" }],
  [{ name: "Fluke Multimeter", icon: "📟" }, { name: "CAT IV Probes", icon: "🥢" }, { name: "TRY Pushbutton", icon: "🔘" }],
];

export function LOTOSimulator({ config }: { config?: UserConfig }) {
  const [activeTab, setActiveTab] = useState<TabId>("procedure");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [learnCard, setLearnCard] = useState(0);

  // Modals state
  const [showConsequenceModal, setShowConsequenceModal] = useState(false);
  const [showPermitModal, setShowPermitModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certScore, setCertScore] = useState(100);
  const [ambientHumEnabled, setAmbientHumEnabled] = useState(false);

  // Checklist state
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [checklistFilter, setChecklistFilter] = useState<string>("All");

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<PreparedQuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [shortCircuitVFX, setShortCircuitVFX] = useState(false);
  const [wrongVignette, setWrongVignette] = useState(false);
  const [stepAnimTrigger, setStepAnimTrigger] = useState<number | null>(null);
  const sparkCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ════════════════════════════════════════════════════════════════════════════
  // SHARED MACHINERY & ENERGY PHYSICS STATE
  // Synchronized across Left Controls, Center Animations, and Right Gauges
  // ════════════════════════════════════════════════════════════════════════════
  const [inspectedSources, setInspectedSources] = useState<Set<string>>(new Set());
  const [motorStopped, setMotorStopped] = useState(false);
  const [motorRpm, setMotorRpm] = useState(1750);
  const [motorAmps, setMotorAmps] = useState(68);
  const [knifeSwitchOpen, setKnifeSwitchOpen] = useState(false);
  const [pneumaticValveClosed, setPneumaticValveClosed] = useState(false);
  const [haspApplied, setHaspApplied] = useState(false);
  const [padlockApplied, setPadlockApplied] = useState(false);
  const [dangerTagApplied, setDangerTagApplied] = useState(false);
  const [airPressurePsi, setAirPressurePsi] = useState(120);
  const [dcCapacitorVolts, setDcCapacitorVolts] = useState(680);
  const [isBleedingAir, setIsBleedingAir] = useState(false);
  const [isDischargingDC, setIsDischargingDC] = useState(false);
  const [zeroVerifyPhase, setZeroVerifyPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [probeVoltage, setProbeVoltage] = useState(0);
  const [tryButtonPressed, setTryButtonPressed] = useState(false);

  // Global manual interlock controls
  const [mainsPower480V, setMainsPower480V] = useState(true);
  const [pneumaticSupplyOpen, setPneumaticSupplyOpen] = useState(true);
  const [gravityRamBlocked, setGravityRamBlocked] = useState(false);

  // Ambient 60Hz hum audio handling
  useEffect(() => {
    if (ambientHumEnabled) {
      if (knifeSwitchOpen || !mainsPower480V) {
        lotoAudio.stopAmbientHum();
      } else {
        lotoAudio.startAmbientHum();
      }
    } else {
      lotoAudio.stopAmbientHum();
    }
    return () => {
      lotoAudio.stopAmbientHum();
    };
  }, [ambientHumEnabled, knifeSwitchOpen, mainsPower480V]);

  // Initialize randomized quiz
  const initializeQuiz = useCallback(() => {
    const shuffledBank = [...LOTO_QUESTION_BANK].sort(() => 0.5 - Math.random());
    const sampled10 = shuffledBank.slice(0, 10);

    const prepared: PreparedQuizQuestion[] = sampled10.map(q => {
      const originalOptions = [...q.options];
      const correctText = originalOptions[q.correctAnswer];
      const shuffledOptions = [...originalOptions].sort(() => 0.5 - Math.random());
      const newCorrectIndex = shuffledOptions.indexOf(correctText);

      return {
        id: q.id,
        question: q.question,
        options: shuffledOptions,
        correctAnswer: newCorrectIndex,
        explanation: q.explanation,
        category: q.category
      };
    });

    setQuizQuestions(prepared);
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowExplanation(false);
  }, []);

  useEffect(() => {
    initializeQuiz();
  }, [initializeQuiz]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "procedure") return;
      if (e.key === "ArrowLeft") {
        setCurrentStep(s => Math.max(0, s - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentStep(s => Math.min(LOTO_STEPS.length - 1, s + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // ════════════════════════════════════════════════════════════════════════════
  // SYNCHRONIZED INTERACTIVE ACTION HANDLERS
  // ════════════════════════════════════════════════════════════════════════════
  const triggerStepCelebration = (stepIdx: number) => {
    assessmentAudio.playCorrectChime();
    setStepAnimTrigger(stepIdx);
    setCompletedSteps(prev => new Set([...prev, stepIdx]));
    setTimeout(() => setStepAnimTrigger(null), 500);
  };

  // Step 1 Actions (Inspect plant energy sources)
  const handleInspectSource = (id: string) => {
    lotoAudio.playClick();
    setInspectedSources(prev => {
      const next = new Set([...prev, id]);
      if (next.size >= 6) {
        triggerStepCelebration(0);
      }
      return next;
    });
  };

  const handleInspectAllSources = () => {
    lotoAudio.playClick();
    setInspectedSources(new Set(["ELEC", "MECH", "PNEU", "HYDR", "CHEM", "THERM"]));
    triggerStepCelebration(0);
  };

  // Step 2 Actions (Shutdown motor)
  const handleStopMotor = () => {
    if (motorStopped) return;
    setMotorStopped(true);
    lotoAudio.playSwitchClack();

    const interval = setInterval(() => {
      setMotorRpm(r => {
        if (r <= 40) {
          clearInterval(interval);
          triggerStepCelebration(1);
          return 0;
        }
        return Math.floor(r * 0.72);
      });
      setMotorAmps(a => (a <= 2 ? 0 : Math.floor(a * 0.65)));
    }, 120);
  };

  // Step 3 Actions (Energy isolation)
  const handleToggleKnifeSwitch = () => {
    lotoAudio.playSwitchClack();
    const next = !knifeSwitchOpen;
    setKnifeSwitchOpen(next);
    if (next && pneumaticValveClosed) {
      triggerStepCelebration(2);
    }
  };

  const handleToggleAirValve = () => {
    lotoAudio.playAirHiss();
    const next = !pneumaticValveClosed;
    setPneumaticValveClosed(next);
    if (knifeSwitchOpen && next) {
      triggerStepCelebration(2);
    }
  };

  const handleIsolateAll = () => {
    lotoAudio.playSwitchClack();
    setKnifeSwitchOpen(true);
    setPneumaticValveClosed(true);
    triggerStepCelebration(2);
  };

  // Step 4 Actions (Lockout / Tagout)
  const handleApplyHasp = () => {
    lotoAudio.playSwitchClack();
    setHaspApplied(true);
  };

  const handleApplyPadlock = () => {
    lotoAudio.playPadlockSnap();
    setPadlockApplied(true);
    if (dangerTagApplied) {
      triggerStepCelebration(3);
    }
  };

  const handleApplyTag = () => {
    lotoAudio.playClick();
    setDangerTagApplied(true);
    if (padlockApplied) {
      triggerStepCelebration(3);
    }
  };

  const handleApplyAllLOTO = () => {
    lotoAudio.playPadlockSnap();
    setHaspApplied(true);
    setPadlockApplied(true);
    setDangerTagApplied(true);
    triggerStepCelebration(3);
  };

  // Step 5 Actions (Bleed stored energy)
  const handleBleedAir = () => {
    if (isBleedingAir || airPressurePsi === 0) return;
    setIsBleedingAir(true);
    lotoAudio.playAirHiss();

    const t = setInterval(() => {
      setAirPressurePsi(p => {
        if (p <= 5) {
          clearInterval(t);
          if (dcCapacitorVolts === 0) {
            triggerStepCelebration(4);
          }
          return 0;
        }
        return p - 10;
      });
    }, 120);
  };

  const handleDischargeDC = () => {
    if (isDischargingDC || dcCapacitorVolts === 0) return;
    setIsDischargingDC(true);
    lotoAudio.playSwitchClack();

    const t = setInterval(() => {
      setDcCapacitorVolts(v => {
        if (v <= 20) {
          clearInterval(t);
          if (airPressurePsi === 0) {
            triggerStepCelebration(4);
          }
          return 0;
        }
        return Math.floor(v * 0.75 - 5);
      });
    }, 120);
  };

  const handleBleedAllEnergy = () => {
    handleBleedAir();
    handleDischargeDC();
  };

  // Step 6 Actions (Zero energy verification Live-Dead-Live)
  const handleProbeLive1 = () => {
    lotoAudio.playMeterBeep();
    setProbeVoltage(230.4);
    setZeroVerifyPhase(1);
  };

  const handleProbeDead = () => {
    lotoAudio.playMeterBeep();
    setProbeVoltage(0.0);
    setZeroVerifyPhase(2);
  };

  const handleProbeLive2 = () => {
    lotoAudio.playMeterBeep();
    setProbeVoltage(230.1);
    setZeroVerifyPhase(3);
  };

  const handlePressTry = () => {
    lotoAudio.playSwitchClack();
    setZeroVerifyPhase(4);
    setTryButtonPressed(true);
    triggerStepCelebration(5);
  };

  const handleExecuteNextZeroTest = () => {
    if (zeroVerifyPhase === 0) handleProbeLive1();
    else if (zeroVerifyPhase === 1) handleProbeDead();
    else if (zeroVerifyPhase === 2) handleProbeLive2();
    else if (zeroVerifyPhase === 3) handlePressTry();
  };

  // Global reset
  const resetProcedure = () => {
    assessmentAudio.playClick();
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setStepAnimTrigger(null);
    setInspectedSources(new Set());
    setMotorStopped(false);
    setMotorRpm(1750);
    setMotorAmps(68);
    setKnifeSwitchOpen(false);
    setPneumaticValveClosed(false);
    setHaspApplied(false);
    setPadlockApplied(false);
    setDangerTagApplied(false);
    setAirPressurePsi(120);
    setDcCapacitorVolts(680);
    setIsBleedingAir(false);
    setIsDischargingDC(false);
    setZeroVerifyPhase(0);
    setProbeVoltage(0);
    setTryButtonPressed(false);
    setMainsPower480V(true);
    setPneumaticSupplyOpen(true);
    setGravityRamBlocked(false);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // COMPUTED TELEMETRY & SAFETY VERDICT
  // ════════════════════════════════════════════════════════════════════════════
  const liveFeederVoltage = (!mainsPower480V || knifeSwitchOpen) ? 0.0 : 480.0;
  const liveAirPressure = pneumaticSupplyOpen ? airPressurePsi : Math.min(airPressurePsi, 0);
  const allDone = completedSteps.size >= LOTO_STEPS.length;
  const step = LOTO_STEPS[currentStep];

  // Verdict state logic
  const isZeroEnergyVerified = (zeroVerifyPhase === 4) && knifeSwitchOpen && padlockApplied && airPressurePsi === 0 && dcCapacitorVolts === 0;
  const isStoredEnergyPresent = (knifeSwitchOpen || !mainsPower480V) && (airPressurePsi > 0 || dcCapacitorVolts > 0);
  const isStoppedLive = motorStopped && liveFeederVoltage > 0;

  let verdictTitle = "⚡ DANGER: HIGH HAZARD ENERGIZED";
  let verdictSub = "480V 3-Phase & 120 PSI Active · Machine Running Under Load";
  let verdictStyle = "bg-rose-950/70 border-rose-500/80 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.3)]";

  if (isZeroEnergyVerified) {
    verdictTitle = "🛡️ ZERO ENERGY VERIFIED (ZVE)";
    verdictSub = "All 6 Sources Positively Isolated & Verified · 100% Safe to Work";
    verdictStyle = "bg-emerald-950/70 border-emerald-500/80 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
  } else if (haspApplied && padlockApplied && airPressurePsi === 0 && dcCapacitorVolts === 0) {
    verdictTitle = "🔒 LOCKED & BLED (AWAITING VERIFY)";
    verdictSub = "Locked & Depressurized · Perform Step 6 Live-Dead-Live Probing";
    verdictStyle = "bg-cyan-950/70 border-cyan-500/80 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
  } else if (isStoredEnergyPresent) {
    verdictTitle = "⚠️ STORED ENERGY HAZARD ACTIVE";
    verdictSub = `Feeder Disconnected · Residual Charge: ${dcCapacitorVolts}V DC & ${airPressurePsi} PSI`;
    verdictStyle = "bg-amber-950/70 border-amber-500/80 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
  } else if (isStoppedLive) {
    verdictTitle = "⚡ STOPPED BUT LIVE (480V AT MCC)";
    verdictSub = "Motor Stopped via Normal Controls Only · 480V Feeder Fully Live!";
    verdictStyle = "bg-red-950/70 border-red-500/80 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
  }

  // Quiz helper
  const handleQuizAnswerSubmit = (optionIndex: number) => {
    if (quizAnswers[quizIndex] !== undefined) return;
    const currentQ = quizQuestions[quizIndex];
    const isCorrect = optionIndex === currentQ.correctAnswer;
    setQuizAnswers(prev => ({ ...prev, [quizIndex]: optionIndex }));
    setShowExplanation(true);

    if (isCorrect) {
      assessmentAudio.playCorrectChime();
    } else {
      assessmentAudio.playShortCircuitZap();
      setShortCircuitVFX(true);
      setScreenShake(true);
      setWrongVignette(true);
      setTimeout(() => {
        setShortCircuitVFX(false);
        setScreenShake(false);
        setWrongVignette(false);
      }, 500);
    }
  };

  const totalQuizMarks = Object.entries(quizAnswers).reduce((acc, [qi, chosenOpt]) => {
    const q = quizQuestions[+qi];
    return acc + (q && chosenOpt === q.correctAnswer ? 10 : 0);
  }, 0);

  const checkedCritical = CHECKLIST_ITEMS.filter(i => i.critical && checkedItems.has(i.id)).length;
  const totalCritical = CHECKLIST_ITEMS.filter(i => i.critical).length;

  return (
    <div className={cn(
      "flex flex-col h-full w-full bg-slate-950 overflow-hidden text-slate-100 relative select-none",
      screenShake ? "animate-[shake_0.4s_ease-in-out]" : ""
    )}>
      {/* Short circuit flash canvas */}
      <canvas
        ref={sparkCanvasRef}
        className={cn("absolute inset-0 z-50 pointer-events-none w-full h-full", shortCircuitVFX ? "opacity-100" : "opacity-0")}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Wrong answer vignette overlay */}
      <AnimatePresence>
        {wrongVignette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-40 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 100px 30px rgba(239,68,68,0.5)' }}
          />
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════════
          1. COCKPIT HEADER BAR (42px)
          Compact, high-tech, responsive header with mode pills & actions
      ════════════════════════════════════════════════════════════════════════ */}
      <header className="h-[42px] shrink-0 px-2 sm:px-3 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-1 text-xs font-bold font-mono z-30">
        {/* Left: Brand Title & OSHA standard */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.3)]">
            <Lock className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1 leading-none">
              LOTO PRO™
              <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 font-mono">
                OSHA 1910.147 · NFPA 70E
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[10px] sm:text-xs shrink-0">
          <button
            onClick={() => setActiveTab("procedure")}
            className={cn(
              "px-2 sm:px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center gap-1",
              activeTab === "procedure" ? "bg-orange-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <Lock className="w-3 h-3" />
            <span>Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab("learn")}
            className={cn(
              "px-2 sm:px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center gap-1",
              activeTab === "learn" ? "bg-orange-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <BookOpen className="w-3 h-3" />
            <span className="hidden sm:inline">Theory</span>
          </button>
          <button
            onClick={() => setActiveTab("checklist")}
            className={cn(
              "px-2 sm:px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center gap-1",
              activeTab === "checklist" ? "bg-orange-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <ClipboardList className="w-3 h-3" />
            <span className="hidden sm:inline">Checklist</span>
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={cn(
              "px-2 sm:px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center gap-1",
              activeTab === "quiz" ? "bg-orange-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <HelpCircle className="w-3 h-3" />
            <span>Quiz</span>
          </button>
        </div>

        {/* Right: Quick Tools (Sound, Reset, Cert) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setAmbientHumEnabled(v => !v)}
            className={cn(
              "px-2 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1",
              ambientHumEnabled ? "bg-amber-500/20 border-amber-500 text-amber-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            )}
            title="Toggle 60Hz transformer sound"
          >
            {ambientHumEnabled ? <Volume2 className="w-3 h-3 text-amber-400 animate-pulse" /> : <VolumeX className="w-3 h-3" />}
            <span className="hidden md:inline">60Hz</span>
          </button>

          <button
            onClick={resetProcedure}
            className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-red-950/40 hover:border-red-500/60 text-slate-200 hover:text-red-300 text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
            title="Reset Procedure to Step 1"
          >
            <RotateCcw className="w-3 h-3 text-orange-400" />
            <span className="hidden lg:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════════
          2. MAIN CONTENT AREA (ZERO SCROLLBARS)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 w-full h-full overflow-hidden relative">
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════════════════
              A. PROCEDURE TAB: STRICT 3-COLUMN WORLD-CLASS SIMULATOR
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "procedure" && (
            <motion.div
              key="procedure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col lg:flex-row overflow-hidden select-none"
            >
              {/* ────────────────────────────────────────────────────────────
                  LEFT COLUMN: INPUTS & CONTROLS (ZERO SCROLLBARS)
              ──────────────────────────────────────────────────────────── */}
              <aside className="w-full lg:w-72 xl:w-76 shrink-0 h-full overflow-hidden p-2 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between select-none">
                
                {/* Section 1: 6 LOTO Steps Selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      1. LOTO 6-STEP PROTOCOL
                    </span>
                    <span className="text-[9px] font-bold text-orange-400 font-mono">
                      {completedSteps.size}/6 DONE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                    {LOTO_STEPS.map((s, idx) => {
                      const isActive = idx === currentStep;
                      const isDone = completedSteps.has(idx);
                      const StepIcon = s.icon;

                      return (
                        <button
                          key={s.id}
                          onClick={() => setCurrentStep(idx)}
                          className={cn(
                            "w-full text-left p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-1.5 relative overflow-hidden",
                            isActive
                              ? "bg-slate-850 border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.3)] ring-1 ring-orange-400/60"
                              : isDone
                              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                              : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-sm"
                              style={{ backgroundColor: s.color + "25", border: `1px solid ${s.color}60` }}
                            >
                              <StepIcon className="w-3 h-3" style={{ color: s.color }} />
                            </div>
                            <div className="min-w-0 leading-tight">
                              <div className="text-[10px] font-bold truncate text-white">
                                {s.shortTitle}
                              </div>
                              <div className="text-[8px] text-slate-400 font-sans truncate">
                                {s.title}
                              </div>
                            </div>
                          </div>

                          {isDone ? (
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black flex items-center justify-center shrink-0">
                              ✓
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono text-slate-400 font-bold">
                              P{idx + 1}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Active Step Direct Action Controls */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <span>⚡</span> ACTIVE STEP {currentStep + 1} CONTROLS
                    </span>
                    <span className="text-[8px] font-mono text-slate-400 uppercase">
                      {step.regulation}
                    </span>
                  </div>

                  {/* Step 0 Actions: Survey & Identify */}
                  {currentStep === 0 && (
                    <div className="space-y-1">
                      <button
                        onClick={handleInspectAllSources}
                        className="w-full py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10.5px] uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Identify All 6 Energy Sources</span>
                      </button>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "ELEC", name: "480V AC" },
                          { id: "PNEU", name: "120 PSI" },
                          { id: "MECH", name: "Gravity" },
                          { id: "HYDR", name: "Hydr Ram" },
                          { id: "CHEM", name: "Chemical" },
                          { id: "THERM", name: "Thermal" },
                        ].map(src => {
                          const isDone = inspectedSources.has(src.id);
                          return (
                            <button
                              key={src.id}
                              onClick={() => handleInspectSource(src.id)}
                              className={cn(
                                "py-1 px-1 rounded text-[8.5px] font-bold border transition-all cursor-pointer truncate",
                                isDone ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"
                              )}
                            >
                              {isDone ? "✓ " : ""}{src.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 1 Actions: Equipment Shutdown */}
                  {currentStep === 1 && (
                    <div className="space-y-1">
                      <button
                        onClick={handleStopMotor}
                        className={cn(
                          "w-full py-2 px-2 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5",
                          motorStopped && motorRpm === 0
                            ? "bg-emerald-500 text-slate-950 border border-emerald-300"
                            : "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                        )}
                      >
                        <Power className="w-4 h-4" />
                        <span>{motorStopped && motorRpm === 0 ? "✓ MOTOR STOPPED (0 RPM)" : "🔴 PUSH EMERGENCY STOP"}</span>
                      </button>
                      <div className="flex items-center justify-between text-[9px] font-mono px-1 text-slate-400">
                        <span>Speed: {motorRpm} RPM</span>
                        <span>Current: {motorAmps.toFixed(1)} A</span>
                      </div>
                    </div>
                  )}

                  {/* Step 2 Actions: Energy Isolation */}
                  {currentStep === 2 && (
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={handleToggleKnifeSwitch}
                          className={cn(
                            "py-1.5 px-1 rounded-lg border font-bold text-[9.5px] transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                            knifeSwitchOpen ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-violet-950/80 border-violet-500 text-violet-200"
                          )}
                        >
                          <span>400A SWITCH</span>
                          <span className="text-[7.5px] font-black">{knifeSwitchOpen ? "✓ OPEN (AIR GAP)" : "👉 PULL LEVER"}</span>
                        </button>
                        <button
                          onClick={handleToggleAirValve}
                          className={cn(
                            "py-1.5 px-1 rounded-lg border font-bold text-[9.5px] transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                            pneumaticValveClosed ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-cyan-950/80 border-cyan-500 text-cyan-200"
                          )}
                        >
                          <span>AIR VALVE 90°</span>
                          <span className="text-[7.5px] font-black">{pneumaticValveClosed ? "✓ CLOSED" : "👉 TURN 90°"}</span>
                        </button>
                      </div>
                      <button
                        onClick={handleIsolateAll}
                        className="w-full py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-black text-[9.5px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                      >
                        ⚡ Isolate Both Simultaneously
                      </button>
                    </div>
                  )}

                  {/* Step 3 Actions: Lockout & Tagout */}
                  {currentStep === 3 && (
                    <div className="space-y-1">
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={handleApplyHasp}
                          className={cn(
                            "py-1 px-0.5 rounded text-[8.5px] font-bold border transition-all cursor-pointer text-center",
                            haspApplied ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-750 text-slate-300"
                          )}
                        >
                          1. Hasp {haspApplied ? "✓" : "👉"}
                        </button>
                        <button
                          onClick={handleApplyPadlock}
                          className={cn(
                            "py-1 px-0.5 rounded text-[8.5px] font-bold border transition-all cursor-pointer text-center",
                            padlockApplied ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-750 text-slate-300"
                          )}
                        >
                          2. Lock {padlockApplied ? "✓" : "👉"}
                        </button>
                        <button
                          onClick={handleApplyTag}
                          className={cn(
                            "py-1 px-0.5 rounded text-[8.5px] font-bold border transition-all cursor-pointer text-center",
                            dangerTagApplied ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-750 text-slate-300"
                          )}
                        >
                          3. Tag {dangerTagApplied ? "✓" : "👉"}
                        </button>
                      </div>
                      <button
                        onClick={handleApplyAllLOTO}
                        className="w-full py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Apply Hasp, Lock & Tag</span>
                      </button>
                    </div>
                  )}

                  {/* Step 4 Actions: Stored Energy Release */}
                  {currentStep === 4 && (
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={handleBleedAir}
                          className={cn(
                            "py-1.5 px-1 rounded-lg border font-bold text-[9.5px] transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                            airPressurePsi === 0 ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-cyan-950/80 border-cyan-500 text-cyan-200"
                          )}
                        >
                          <span>VENT AIR</span>
                          <span className="text-[7.5px] font-black">{airPressurePsi === 0 ? "✓ 0 PSI" : isBleedingAir ? "VENTING..." : "👉 120→0 PSI"}</span>
                        </button>
                        <button
                          onClick={handleDischargeDC}
                          className={cn(
                            "py-1.5 px-1 rounded-lg border font-bold text-[9.5px] transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                            dcCapacitorVolts === 0 ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-amber-950/80 border-amber-500 text-amber-200"
                          )}
                        >
                          <span>BLEED DC CAP</span>
                          <span className="text-[7.5px] font-black">{dcCapacitorVolts === 0 ? "✓ 0 V" : isDischargingDC ? "DRAINING..." : "👉 680→0 V"}</span>
                        </button>
                      </div>
                      <button
                        onClick={handleBleedAllEnergy}
                        className="w-full py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[9.5px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                      >
                        💨 Purge Both Stored Energies
                      </button>
                    </div>
                  )}

                  {/* Step 5 Actions: Verification */}
                  {currentStep === 5 && (
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                        <button
                          onClick={handleProbeLive1}
                          className={cn(
                            "py-1 px-1 rounded border font-bold text-center",
                            zeroVerifyPhase >= 1 ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-750 text-slate-300 cursor-pointer"
                          )}
                        >
                          1. Live: 230V {zeroVerifyPhase >= 1 ? "✓" : ""}
                        </button>
                        <button
                          onClick={handleProbeDead}
                          className={cn(
                            "py-1 px-1 rounded border font-bold text-center",
                            zeroVerifyPhase >= 2 ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-750 text-slate-300 cursor-pointer"
                          )}
                        >
                          2. Dead: 0.0V {zeroVerifyPhase >= 2 ? "✓" : ""}
                        </button>
                        <button
                          onClick={handleProbeLive2}
                          className={cn(
                            "py-1 px-1 rounded border font-bold text-center",
                            zeroVerifyPhase >= 3 ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-750 text-slate-300 cursor-pointer"
                          )}
                        >
                          3. Re-Live: 230V {zeroVerifyPhase >= 3 ? "✓" : ""}
                        </button>
                        <button
                          onClick={handlePressTry}
                          className={cn(
                            "py-1 px-1 rounded border font-bold text-center",
                            zeroVerifyPhase >= 4 ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-750 text-slate-300 cursor-pointer"
                          )}
                        >
                          4. TRY Button {zeroVerifyPhase >= 4 ? "✓" : ""}
                        </button>
                      </div>
                      <button
                        onClick={handleExecuteNextZeroTest}
                        className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Execute Next Zero-Energy Probe</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Section 3: Rapid Physical Energy Interlocks */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    3. PHYSICAL ENERGY INTERLOCKS
                  </span>

                  <div className="grid grid-cols-3 gap-1">
                    {/* 480V Feeder */}
                    <button
                      onClick={() => {
                        setMainsPower480V(v => !v);
                        lotoAudio.playSwitchClack();
                      }}
                      className={cn(
                        "py-1 px-1 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                        mainsPower480V
                          ? "bg-rose-950/70 border-rose-500 text-rose-300 font-bold"
                          : "bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold"
                      )}
                    >
                      <span className="text-[9px]">480V Feeder</span>
                      <span className="text-[7.5px] font-black">{mainsPower480V ? "LIVE 🔴" : "OFF 🟢"}</span>
                    </button>

                    {/* Air Supply */}
                    <button
                      onClick={() => {
                        setPneumaticSupplyOpen(v => !v);
                        lotoAudio.playAirHiss();
                      }}
                      className={cn(
                        "py-1 px-1 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                        pneumaticSupplyOpen
                          ? "bg-cyan-950/70 border-cyan-500 text-cyan-300 font-bold"
                          : "bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold"
                      )}
                    >
                      <span className="text-[9px]">Air Feed</span>
                      <span className="text-[7.5px] font-black">{pneumaticSupplyOpen ? "120 PSI 💨" : "0 PSI 🟢"}</span>
                    </button>

                    {/* Gravity Wedge */}
                    <button
                      onClick={() => {
                        setGravityRamBlocked(v => !v);
                        lotoAudio.playSwitchClack();
                      }}
                      className={cn(
                        "py-1 px-1 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center justify-center leading-tight",
                        gravityRamBlocked
                          ? "bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-slate-950 border-slate-750 text-slate-400 font-bold"
                      )}
                    >
                      <span className="text-[9px]">Die Block</span>
                      <span className="text-[7.5px] font-black">{gravityRamBlocked ? "LOCKED 🧱" : "FREE ⚠️"}</span>
                    </button>
                  </div>
                </div>

                {/* Section 4: Step Navigation Bar */}
                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-1.5 shrink-0">
                  <button
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(s => s - 1)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-700 bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-750 text-slate-200 text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <button
                    onClick={() => {
                      assessmentAudio.playCorrectChime();
                      setCompletedSteps(prev => new Set([...prev, currentStep]));
                      if (currentStep < 5) setCurrentStep(s => s + 1);
                    }}
                    className={cn(
                      "flex-[2] py-1.5 rounded-lg font-black text-[10.5px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md active:scale-95",
                      completedSteps.has(currentStep)
                        ? "bg-emerald-500 text-slate-950 border border-emerald-300"
                        : "bg-orange-500 hover:bg-orange-400 text-slate-950 border border-orange-400"
                    )}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{completedSteps.has(currentStep) ? "Step Verified ✓" : `Complete Step ${currentStep + 1}`}</span>
                  </button>

                  <button
                    disabled={currentStep === 5}
                    onClick={() => setCurrentStep(s => s + 1)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-700 bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-750 text-slate-200 text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </aside>

              {/* ────────────────────────────────────────────────────────────
                  CENTER COLUMN: SIMULATOR & ANIMATIONS (MAXIMIZED CANVAS)
              ──────────────────────────────────────────────────────────── */}
              <main className="flex-1 min-w-0 h-full flex flex-col bg-slate-950 p-1.5 sm:p-2 overflow-hidden relative">
                
                {/* Center Machinery HUD Header */}
                <div className="shrink-0 flex items-center justify-between px-2 py-1 bg-slate-900/90 border border-slate-800 rounded-lg mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: step.color }} />
                    <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-wider truncate">
                      MACHINE UNIT #4: 480V 3Ø CONVEYOR DRIVE (50 HP)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-[9px] px-2 py-0.5 rounded font-mono font-black uppercase tracking-wider border"
                      style={{ color: step.color, borderColor: step.color + "80", backgroundColor: step.color + "20" }}
                    >
                      Step {currentStep + 1}: {step.title}
                    </span>
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border shrink-0",
                      step.hazardLevel === "Critical" ? "text-red-300 border-red-500/60 bg-red-950/60" : "text-amber-300 border-amber-500/60 bg-amber-950/60"
                    )}>
                      {step.hazardLevel}
                    </span>
                  </div>
                </div>

                {/* Pure Animation Stage - Fills 100% of Center Column */}
                <div className="flex-1 w-full min-h-0 relative overflow-hidden bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center shadow-inner">
                  <LOTOMachineryVisualEngine
                    step={currentStep}
                    isCompleted={completedSteps.has(currentStep)}
                    color={step.color}
                    onStepAccomplished={(idx) => {
                      setCompletedSteps(prev => new Set([...prev, idx]));
                    }}
                    machineryState={{
                      inspectedSources,
                      motorStopped,
                      motorRpm,
                      motorAmps,
                      knifeSwitchOpen,
                      pneumaticValveClosed,
                      haspApplied,
                      padlockApplied,
                      dangerTagApplied,
                      airPressurePsi,
                      dcCapacitorVolts,
                      isBleedingAir,
                      isDischargingDC,
                      zeroVerifyPhase,
                      probeVoltage,
                      tryButtonPressed,
                    }}
                    onInspectSource={handleInspectSource}
                    onInspectAllSources={handleInspectAllSources}
                    onStopMotor={handleStopMotor}
                    onToggleKnifeSwitch={handleToggleKnifeSwitch}
                    onToggleAirValve={handleToggleAirValve}
                    onIsolateAll={handleIsolateAll}
                    onApplyHasp={handleApplyHasp}
                    onApplyPadlock={handleApplyPadlock}
                    onApplyTag={handleApplyTag}
                    onApplyAllLOTO={handleApplyAllLOTO}
                    onBleedAir={handleBleedAir}
                    onDischargeDC={handleDischargeDC}
                    onBleedAllEnergy={handleBleedAllEnergy}
                    onProbeLive1={handleProbeLive1}
                    onProbeDead={handleProbeDead}
                    onProbeLive2={handleProbeLive2}
                    onPressTry={handlePressTry}
                    onExecuteNextZeroTest={handleExecuteNextZeroTest}
                  />

                  {/* Step Completion Flash */}
                  <AnimatePresence>
                    {stepAnimTrigger !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-3 right-3 z-40 pointer-events-none flex items-start justify-end"
                      >
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/95 border-2 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)] backdrop-blur-md">
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                            Step {stepAnimTrigger + 1} Verified!
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hardware Dock Quick Bar */}
                <div className="shrink-0 mt-1.5 px-2 py-1 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                  <span className="text-[9px] font-mono font-black uppercase text-slate-400 hidden sm:inline">
                    Interactive Dock:
                  </span>
                  <div className="flex-1 flex items-center justify-end gap-1.5 overflow-x-auto no-scrollbar">
                    {HARDWARE_TOOLS[currentStep]?.map((t, ti) => (
                      <button
                        key={ti}
                        onClick={() => {
                          assessmentAudio.playClick();
                          if (currentStep === 0) handleInspectAllSources();
                          else if (currentStep === 1) handleStopMotor();
                          else if (currentStep === 2) handleIsolateAll();
                          else if (currentStep === 3) handleApplyAllLOTO();
                          else if (currentStep === 4) handleBleedAllEnergy();
                          else if (currentStep === 5) handleExecuteNextZeroTest();
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-orange-950/60 border border-slate-700 hover:border-orange-500/60 text-[9px] font-bold text-slate-200 hover:text-orange-300 shadow-sm whitespace-nowrap cursor-pointer transition-all active:scale-95"
                      >
                        <span>{t.icon}</span>
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </main>

              {/* ────────────────────────────────────────────────────────────
                  RIGHT COLUMN: OUTPUTS, RESULTS & OTHER INFO (ZERO SCROLLBARS)
              ──────────────────────────────────────────────────────────── */}
              <aside className="w-full lg:w-72 xl:w-78 shrink-0 h-full overflow-hidden p-2 bg-slate-900/95 border-l border-slate-800 flex flex-col justify-between select-none">
                
                {/* Section 1: Live Energy State Verdict Banner */}
                <div className={cn("p-2.5 rounded-xl border flex flex-col gap-1 transition-all", verdictStyle)}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      ENERGY STATE VERDICT
                    </span>
                    <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 border border-white/20">
                      OSHA 1910.147
                    </span>
                  </div>
                  <div className="text-xs font-black leading-tight">
                    {verdictTitle}
                  </div>
                  <div className="text-[9.5px] opacity-90 leading-tight">
                    {verdictSub}
                  </div>
                </div>

                {/* Section 2: Live Sensor Telemetry Gauges */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    LIVE MACHINERY GAUGES
                  </span>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Feeder Voltage Gauge */}
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono text-slate-400 uppercase">Feeder Voltage</span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className={cn("text-base font-black font-mono", liveFeederVoltage > 0 ? "text-rose-400" : "text-emerald-400")}>
                          {liveFeederVoltage.toFixed(0)} <span className="text-[10px]">V</span>
                        </span>
                        <span className={cn("text-[8px] font-black px-1 rounded", liveFeederVoltage > 0 ? "bg-rose-950 text-rose-300" : "bg-emerald-950 text-emerald-300")}>
                          {liveFeederVoltage > 0 ? "HOT ⚡" : "ZERO 🟢"}
                        </span>
                      </div>
                    </div>

                    {/* Air Line Pressure */}
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono text-slate-400 uppercase">Air Pressure</span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className={cn("text-base font-black font-mono", liveAirPressure > 10 ? "text-cyan-400" : "text-emerald-400")}>
                          {liveAirPressure} <span className="text-[10px]">PSI</span>
                        </span>
                        <span className={cn("text-[8px] font-black px-1 rounded", liveAirPressure > 10 ? "bg-cyan-950 text-cyan-300" : "bg-emerald-950 text-emerald-300")}>
                          {liveAirPressure > 10 ? "TRAPPED" : "BLED 🟢"}
                        </span>
                      </div>
                    </div>

                    {/* Motor Tachometer */}
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono text-slate-400 uppercase">Motor Speed</span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className={cn("text-base font-black font-mono", motorRpm > 0 ? "text-amber-400" : "text-emerald-400")}>
                          {motorRpm} <span className="text-[10px]">RPM</span>
                        </span>
                        <span className={cn("text-[8px] font-black px-1 rounded", motorRpm > 0 ? "bg-amber-950 text-amber-300" : "bg-emerald-950 text-emerald-300")}>
                          {motorRpm > 0 ? "SPINNING" : "REST 🟢"}
                        </span>
                      </div>
                    </div>

                    {/* Stored DC Capacitor */}
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono text-slate-400 uppercase">Stored DC Bus</span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className={cn("text-base font-black font-mono", dcCapacitorVolts > 15 ? "text-orange-400" : "text-emerald-400")}>
                          {dcCapacitorVolts} <span className="text-[10px]">V</span>
                        </span>
                        <span className={cn("text-[8px] font-black px-1 rounded", dcCapacitorVolts > 15 ? "bg-orange-950 text-orange-300" : "bg-emerald-950 text-emerald-300")}>
                          {dcCapacitorVolts > 15 ? "CHARGED" : "0V 🟢"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Directive Brief & Fatal Consequence */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[9px] font-black uppercase text-orange-400 mb-0.5">
                      What Just Happened?
                    </div>
                    <div className="text-[10px] text-slate-300 font-sans leading-snug">
                      {step.desc}
                    </div>
                  </div>

                  {/* Fatal Mistake Alert & Failure Simulation Button */}
                  <div className="p-2 rounded-lg border border-red-500/40 bg-red-950/30">
                    <div className="flex items-center justify-between text-red-400 mb-0.5">
                      <span className="text-[9.5px] font-black uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Fatal Consequence
                      </span>
                    </div>
                    <p className="text-[9.5px] text-red-200 leading-tight">
                      {step.warning}
                    </p>
                    <button
                      onClick={() => setShowConsequenceModal(true)}
                      className="w-full mt-1.5 py-1 px-1.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 hover:text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      <Skull className="w-3 h-3 text-red-400" />
                      <span>Simulate Catastrophe</span>
                    </button>
                  </div>
                </div>

                {/* Section 4: Safety Tools & Certifications (2x2 Grid) */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    SAFETY TOOLS & CERTIFICATION
                  </span>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* PTW Permit */}
                    <button
                      onClick={() => setShowPermitModal(true)}
                      className="p-1.5 rounded-lg border border-blue-500/50 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 hover:text-white text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                      <FileText className="w-3 h-3 text-blue-400" />
                      <span>PTW Permit</span>
                    </button>

                    {/* Consequence Sim */}
                    <button
                      onClick={() => setShowConsequenceModal(true)}
                      className="p-1.5 rounded-lg border border-red-500/50 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                      <Skull className="w-3 h-3 text-red-400" />
                      <span>Disaster Sim</span>
                    </button>

                    {/* Practical Exam */}
                    <button
                      onClick={() => setShowExamModal(true)}
                      className="p-1.5 rounded-lg border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-white text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                      <Timer className="w-3 h-3 text-amber-400" />
                      <span>Exam (120s)</span>
                    </button>

                    {/* Certificate */}
                    <button
                      onClick={() => {
                        setCertScore(allDone ? 100 : Math.max(certScore, 85));
                        setShowCertModal(true);
                      }}
                      className="p-1.5 rounded-lg border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-white text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                      <Award className="w-3 h-3 text-emerald-400" />
                      <span>Certificate</span>
                    </button>
                  </div>
                </div>
              </aside>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              B. LEARN / THEORY TAB
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "learn" && (
            <motion.div
              key="learn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row h-full overflow-hidden p-2.5 md:p-3 gap-3 bg-slate-950/60"
            >
              <div className="w-full lg:w-1/2 flex flex-col gap-2.5 overflow-hidden justify-between h-full">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-xs font-black text-slate-100 uppercase tracking-wide">Knowledge Cards ({learnCard + 1}/{LEARN_CARDS.length})</span>
                  <div className="flex gap-1">
                    {LEARN_CARDS.map((c, i) => (
                      <button key={i} onClick={() => setLearnCard(i)} className="rounded-full transition-all cursor-pointer hover:scale-110" style={{ width: i === learnCard ? 16 : 8, height: 8, backgroundColor: i === learnCard ? c.color : "#475569" }} />
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={learnCard}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="flex-1 rounded-xl border p-3.5 flex flex-col justify-between"
                      style={{ borderColor: LEARN_CARDS[learnCard].color + "90", backgroundColor: LEARN_CARDS[learnCard].color + "18" }}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                            style={{ backgroundColor: LEARN_CARDS[learnCard].color + "30", border: `1.5px solid ${LEARN_CARDS[learnCard].color}` }}
                          >
                            {React.createElement(LEARN_CARDS[learnCard].icon, { className: "w-5 h-5", style: { color: LEARN_CARDS[learnCard].color } })}
                          </div>
                          <h3 className="text-sm md:text-base font-black uppercase tracking-wide text-white">{LEARN_CARDS[learnCard].title}</h3>
                        </div>
                        <p className="text-xs md:text-sm text-slate-100 leading-relaxed font-medium">{LEARN_CARDS[learnCard].content}</p>
                      </div>

                      <div className="pt-2.5 border-t border-white/15 mt-2 shrink-0">
                        <p className="text-base md:text-lg font-black leading-tight" style={{ color: LEARN_CARDS[learnCard].color }}>{LEARN_CARDS[learnCard].stat}</p>
                        <p className="text-[10px] text-slate-300 font-mono">{LEARN_CARDS[learnCard].statSub}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    disabled={learnCard === 0}
                    onClick={() => setLearnCard(c => c - 1)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-black border border-slate-700 bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-750 text-slate-100 shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    disabled={learnCard === LEARN_CARDS.length - 1}
                    onClick={() => setLearnCard(c => c + 1)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-black border border-slate-700 bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-750 text-slate-100 shadow-md"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="w-full lg:w-1/2 flex flex-col gap-2.5 overflow-y-auto pr-1 no-scrollbar">
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
                  {[
                    { val: "120+", label: "Deaths/yr w/o LOTO", color: "#ef4444" },
                    { val: "50k+", label: "Injuries saved/yr", color: "#22c55e" },
                    { val: "6", label: "Energy types", color: "#8b5cf6" },
                    { val: "$15k+", label: "Avg OSHA fine", color: "#f97316" },
                  ].map((s, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center shadow-md">
                      <p className="text-base md:text-lg font-black" style={{ color: s.color }}>{s.val}</p>
                      <p className="text-[9px] md:text-[10px] text-slate-200 font-bold uppercase tracking-wide leading-tight mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex flex-col min-h-[160px]">
                  <p className="text-xs font-black text-slate-100 uppercase tracking-wide mb-1.5 border-l-3 border-amber-500 pl-2 shrink-0">All 6 Hazardous Energy Types</p>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 flex-1 min-h-0">
                    {[
                      { type: "Electrical", emoji: "⚡", color: "#f59e0b", ex: "Wires, motors, caps" },
                      { type: "Pneumatic", emoji: "💨", color: "#06b6d4", ex: "Compressed air lines" },
                      { type: "Hydraulic", emoji: "💧", color: "#3b82f6", ex: "Oil-pressured lines" },
                      { type: "Mechanical", emoji: "⚙️", color: "#8b5cf6", ex: "Springs, flywheels, gravity" },
                      { type: "Thermal", emoji: "🔥", color: "#ef4444", ex: "Steam, hot surfaces" },
                      { type: "Chemical", emoji: "☣️", color: "#22c55e", ex: "Gases, chemicals" },
                    ].map((e, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-800 bg-slate-900 shadow-md">
                        <span className="text-xl md:text-2xl shrink-0">{e.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white leading-none mb-0.5">{e.type}</p>
                          <p className="text-[9px] md:text-[10px] text-slate-300 leading-tight truncate font-medium">{e.ex}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              C. CHECKLIST TAB
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "checklist" && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full overflow-hidden p-2 sm:p-3 gap-2 bg-slate-950"
            >
              <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className={cn("w-3 h-3 rounded-full animate-pulse shrink-0", checkedCritical === totalCritical ? "bg-emerald-400" : "bg-amber-400")} />
                  <span className={cn("text-xs md:text-sm font-black uppercase tracking-wide", checkedCritical === totalCritical ? "text-emerald-300" : "text-amber-300")}>
                    {checkedCritical === totalCritical ? "All Critical Items Complete!" : `${totalCritical - checkedCritical} Critical Items Remaining`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto justify-end">
                  {["All", "Before Start", "Shutdown", "Isolation", "Lock & Tag", "Energy Release", "Verification"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setChecklistFilter(cat)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[9.5px] font-bold uppercase whitespace-nowrap transition-all cursor-pointer border",
                        checklistFilter === cat ? "bg-orange-500 text-slate-950 border-orange-400 font-black" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5 no-scrollbar">
                {CHECKLIST_ITEMS.filter(i => checklistFilter === "All" || i.category === checklistFilter).map(item => {
                  const isChecked = checkedItems.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        assessmentAudio.playClick();
                        setCheckedItems(prev => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        });
                      }}
                      className={cn(
                        "p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all",
                        isChecked ? "bg-emerald-950/30 border-emerald-500/60 text-white" : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("w-4 h-4 rounded flex items-center justify-center border shrink-0", isChecked ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black" : "border-slate-600 bg-slate-950")}>
                          {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-medium leading-snug">{item.text}</span>
                          <span className="text-[9px] text-slate-400 font-mono block">{item.category}</span>
                        </div>
                      </div>

                      {item.critical && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-950 border border-red-800 text-red-300 shrink-0">
                          CRITICAL
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              D. QUIZ TAB (100 MARKS)
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full overflow-hidden p-2 sm:p-3 gap-2 bg-slate-950"
            >
              {quizQuestions.length > 0 && !quizSubmitted && (
                <div className="flex-1 min-h-0 flex flex-col justify-between max-w-2xl mx-auto w-full">
                  <div className="shrink-0 flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-xs font-black uppercase text-orange-400">
                      Question {quizIndex + 1} of 10
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Score: {totalQuizMarks} / 100 Marks
                    </span>
                  </div>

                  <div className="my-auto space-y-3">
                    <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                      {quizQuestions[quizIndex].question}
                    </h3>

                    <div className="space-y-1.5">
                      {quizQuestions[quizIndex].options.map((opt, oi) => {
                        const isAnswered = quizAnswers[quizIndex] !== undefined;
                        const isSelected = quizAnswers[quizIndex] === oi;
                        const isCorrect = oi === quizQuestions[quizIndex].correctAnswer;

                        return (
                          <button
                            key={oi}
                            disabled={isAnswered}
                            onClick={() => handleQuizAnswerSubmit(oi)}
                            className={cn(
                              "w-full text-left p-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer",
                              isAnswered
                                ? isCorrect
                                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold"
                                  : isSelected
                                  ? "bg-rose-950/80 border-rose-500 text-rose-200 font-bold"
                                  : "bg-slate-900/60 border-slate-800 text-slate-500"
                                : "bg-slate-900 border-slate-800 hover:border-orange-500/60 text-slate-200"
                            )}
                          >
                            <span>{opt}</span>
                            {isAnswered && (
                              <span>
                                {isCorrect ? "✓ (+10)" : isSelected ? "✗" : ""}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {showExplanation && (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
                        <span className="font-bold text-amber-400 uppercase tracking-wider block mb-0.5">OSHA Rationale:</span>
                        {quizQuestions[quizIndex].explanation}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      disabled={quizIndex === 0}
                      onClick={() => { setQuizIndex(i => i - 1); setShowExplanation(false); }}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold uppercase disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Prev
                    </button>

                    {quizAnswers[quizIndex] !== undefined && (
                      quizIndex < 9 ? (
                        <button
                          onClick={() => { setQuizIndex(i => i + 1); setShowExplanation(false); }}
                          className="px-4 py-1.5 rounded-lg bg-orange-500 text-slate-950 text-xs font-black uppercase cursor-pointer"
                        >
                          Next Question ➔
                        </button>
                      ) : (
                        <button
                          onClick={() => setQuizSubmitted(true)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black uppercase cursor-pointer"
                        >
                          Finish & View Results
                        </button>
                      )
                    )}

                    <button
                      disabled={quizIndex === 9 || quizAnswers[quizIndex] === undefined}
                      onClick={() => { setQuizIndex(i => i + 1); setShowExplanation(false); }}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold uppercase disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {quizSubmitted && (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-white">
                    Quiz Complete: {totalQuizMarks} / 100 Marks
                  </h3>
                  <p className="text-xs text-slate-300 font-sans">
                    {totalQuizMarks >= 80 ? "Outstanding performance! You have demonstrated OSHA 1910.147 Authorized Employee Competency." : "Review the LOTO steps and safety standards to improve your score."}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={initializeQuiz}
                      className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold uppercase cursor-pointer"
                    >
                      Retake Quiz
                    </button>
                    <button
                      onClick={() => {
                        setCertScore(totalQuizMarks);
                        setShowCertModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-orange-500 text-slate-950 text-xs font-black uppercase cursor-pointer"
                    >
                      Claim Certificate
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          3. MODAL DIALOGS
      ════════════════════════════════════════════════════════════════════════ */}
      <LOTOFailureConsequenceModal
        stepIndex={currentStep}
        isOpen={showConsequenceModal}
        onClose={() => setShowConsequenceModal(false)}
      />

      <LOTOPermitModal
        isOpen={showPermitModal}
        onClose={() => setShowPermitModal(false)}
        candidateName={config?.name || "Authorized Electrical Specialist"}
        completedStepsCount={completedSteps.size}
      />

      <LOTOPracticalExamModal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        onCertificateRequested={(score) => {
          setCertScore(score);
          setShowCertModal(true);
        }}
      />

      <LOTOCertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        candidateName={config?.name || "Authorized Electrical Specialist"}
        score={certScore}
      />
    </div>
  );
}
