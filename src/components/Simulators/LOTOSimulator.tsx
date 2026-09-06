import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock, Shield, CheckCircle, AlertTriangle,
  ChevronRight, ChevronLeft, RotateCcw, Zap, Eye, BookOpen,
  ClipboardList, HelpCircle, CheckCircle2, XCircle, Power,
  Unlock, Info, Award, ArrowRight, Sparkles, Filter, RefreshCw
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { UserConfig } from "@/src/types";
import { assessmentAudio } from "@/src/utils/assessmentSound";
import { LOTO_QUESTION_BANK, LOTOQuizQuestion } from "@/src/data/lotoQuestions";

type TabId = "procedure" | "learn" | "checklist" | "quiz";

interface PreparedQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // index in shuffled options
  explanation: string;
  category: string;
}

const LOTO_STEPS = [
  { id: 1, title: "Preparation", shortTitle: "Prepare", color: "#f59e0b", bgClass: "bg-amber-500/25 border-amber-500/60", textClass: "text-amber-300", icon: Eye, hazardLevel: "High", desc: "Identify ALL energy sources — electrical, hydraulic, pneumatic, mechanical, thermal, and chemical. Study equipment diagrams, review LOTO procedures, notify affected employees, and gather required locks and tags.", keyPoints: ["Identify every energy source", "Review lockout procedure document", "Notify all affected workers", "Gather locks, tags, and tools"], regulation: "OSHA 29 CFR 1910.147", warning: "Missing even one energy source can be fatal." },
  { id: 2, title: "Equipment Shutdown", shortTitle: "Shutdown", color: "#ef4444", bgClass: "bg-red-500/25 border-red-500/60", textClass: "text-red-300", icon: Power, hazardLevel: "Critical", desc: "Follow the normal stopping procedure to turn off the equipment. Use the designated shutdown controls — do not simply disconnect power without following the prescribed sequence.", keyPoints: ["Use normal stop procedure", "Follow equipment-specific sequence", "Confirm all moving parts have stopped", "Verify production is halted"], regulation: "OSHA 29 CFR 1910.147(d)(2)", warning: "Never assume equipment is off — verify with instruments." },
  { id: 3, title: "Energy Isolation", shortTitle: "Isolate", color: "#8b5cf6", bgClass: "bg-violet-500/25 border-violet-500/60", textClass: "text-violet-300", icon: Shield, hazardLevel: "Critical", desc: "Physically isolate the equipment from ALL energy sources by operating switches, valves, and other isolating devices. Ensure isolation is positive and complete — partial isolation is not acceptable.", keyPoints: ["Disconnect all electrical circuits", "Close all pneumatic/hydraulic valves", "Block mechanical motion hazards", "Verify isolation is positive and physical"], regulation: "OSHA 29 CFR 1910.147(d)(3)", warning: "Each energy source must have its own isolation device." },
  { id: 4, title: "Lockout / Tagout", shortTitle: "Lock & Tag", color: "#f97316", bgClass: "bg-orange-500/25 border-orange-500/60", textClass: "text-orange-300", icon: Lock, hazardLevel: "Critical", desc: "Apply your personal lock AND a danger tag to EVERY isolation device. Each authorized employee applies their OWN lock — only that person can remove it. Tags alone are not sufficient when lockout is feasible.", keyPoints: ["Apply one lock per isolation point", "Each worker uses their personal lock", "Attach a signed danger tag", "Never share or piggyback locks"], regulation: "OSHA 29 CFR 1910.147(d)(4)", warning: "A tag is a warning — only a LOCK ensures the device stays off." },
  { id: 5, title: "Stored Energy Release", shortTitle: "Bleed Energy", color: "#06b6d4", bgClass: "bg-cyan-500/25 border-cyan-500/60", textClass: "text-cyan-300", icon: Zap, hazardLevel: "High", desc: "Release, restrain, or neutralize ALL stored or residual energy. This includes: discharge capacitors, bleed pneumatic lines, drain hydraulic pressure, block gravity-fed components, and allow thermal dissipation.", keyPoints: ["Discharge capacitors and electrical charge", "Bleed pneumatic/hydraulic pressure to zero", "Block suspended/gravity-loaded parts", "Allow hot equipment to cool down"], regulation: "OSHA 29 CFR 1910.147(d)(5)", warning: "Stored energy causes nearly 30% of LOTO-related incidents." },
  { id: 6, title: "Verification", shortTitle: "Verify", color: "#22c55e", bgClass: "bg-green-500/25 border-green-500/60", textClass: "text-green-300", icon: CheckCircle2, hazardLevel: "Safety Check", desc: "Verify that isolation is complete by trying to start the equipment, testing with a calibrated meter, and confirming energy levels are zero. Only then is the equipment safe to work on. Document everything.", keyPoints: ["Test start button — equipment must NOT start", "Use calibrated voltage tester to confirm zero energy", "Confirm pressure gauges read zero", "Document the verification with date and signature"], regulation: "OSHA 29 CFR 1910.147(d)(6)", warning: "NEVER assume — always TEST before touching energized parts." },
];

const LEARN_CARDS = [
  { title: "What is LOTO?", color: "#f59e0b", icon: Lock, content: "Lockout/Tagout (LOTO) is a safety procedure that protects workers from the unexpected energization, startup, or release of stored energy during servicing and maintenance of machines and equipment.", stat: "120 workers killed annually", statSub: "when LOTO is not followed (OSHA)" },
  { title: "Energy Types", color: "#8b5cf6", icon: Zap, content: "LOTO must address ALL forms of hazardous energy: Electrical (most common), Pneumatic (compressed air), Hydraulic, Mechanical (springs, gravity), Thermal (heat/steam), and Chemical.", stat: "6 energy types", statSub: "must ALL be controlled" },
  { title: "Who Is Authorized?", color: "#06b6d4", icon: Shield, content: "Authorized employees perform lockout/tagout. Affected employees operate the equipment and must be notified. Other employees must stay clear of the area during the procedure.", stat: "3 worker categories", statSub: "Authorized · Affected · Other" },
  { title: "Release Sequence", color: "#22c55e", icon: Unlock, content: "To restore energy: Ensure equipment is reassembled, tools removed, guards replaced, and employees clear. Each authorized worker removes ONLY their own lock before the equipment is re-energized.", stat: "Reverse the LOTO steps", statSub: "only after all work is complete" },
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

import { LOTOMachineryVisualEngine } from "./LOTOMachineryVisualEngine";


// === Main Component ===
export function LOTOSimulator({ config }: { config?: UserConfig }) {
  const [activeTab, setActiveTab] = useState<TabId>("procedure");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [learnCard, setLearnCard] = useState(0);

  // Checklist state
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [checklistFilter, setChecklistFilter] = useState<string>("All");

  // Quiz state (10 Questions of 10 Marks each out of 50 Question Bank)
  const [quizQuestions, setQuizQuestions] = useState<PreparedQuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // VFX State for Quiz wrong/correct answers
  const [screenShake, setScreenShake] = useState(false);
  const [shortCircuitVFX, setShortCircuitVFX] = useState(false);
  const [wrongVignette, setWrongVignette] = useState(false);
  const [correctPulse, setCorrectPulse] = useState(false);
  const [floatingScore, setFloatingScore] = useState<string | null>(null);
  const sparkCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Step Completion Animation Trigger State
  const [stepAnimTrigger, setStepAnimTrigger] = useState<number | null>(null);

  const allDone = completedSteps.size >= LOTO_STEPS.length;
  const step = LOTO_STEPS[currentStep];
  const checkedCritical = CHECKLIST_ITEMS.filter(i => i.critical && checkedItems.has(i.id)).length;
  const totalCritical = CHECKLIST_ITEMS.filter(i => i.critical).length;

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "procedure", label: "Procedure", icon: Lock },
    { id: "learn", label: "Learn", icon: BookOpen },
    { id: "checklist", label: "Checklist", icon: ClipboardList },
    { id: "quiz", label: "Quiz (100 Marks)", icon: HelpCircle },
  ];

  // Helper to initialize 10 random questions with shuffled options
  const initializeQuiz = useCallback(() => {
    const shuffledBank = [...LOTO_QUESTION_BANK].sort(() => 0.5 - Math.random());
    const sampled10 = shuffledBank.slice(0, 10);

    const prepared: PreparedQuizQuestion[] = sampled10.map(q => {
      const originalOptions = [...q.options];
      const correctText = originalOptions[q.correctAnswer];
      
      // Shuffle 4 options
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
    setSelectedQuizOption(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowExplanation(false);
  }, []);

  useEffect(() => {
    initializeQuiz();
  }, [initializeQuiz]);

  // Keyboard navigation for LOTO steps
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

  // Trigger Short Circuit Spark Canvas Effect on Wrong Quiz Answer
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
    const maxFrames = 25;

    const drawLightning = () => {
      ctx.clearRect(0, 0, W, H);

      // Flash background red & white
      if (frame < 6) {
        ctx.fillStyle = frame % 2 === 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(0, 0, W, H);
      }

      // Arcs
      const cx = W / 2, cy = H / 2;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        let px = cx + (Math.random() - 0.5) * 40;
        let py = cy + (Math.random() - 0.5) * 40;
        ctx.moveTo(px, py);

        const tx = Math.random() * W;
        const ty = Math.random() * H;
        const segs = 5;
        for (let j = 0; j < segs; j++) {
          const nx = px + (tx - px) / (segs - j) + (Math.random() - 0.5) * 60;
          const ny = py + (ty - py) / (segs - j) + (Math.random() - 0.5) * 60;
          ctx.lineTo(nx, ny);
          px = nx; py = ny;
        }

        ctx.strokeStyle = frame % 2 === 0 ? '#ef4444' : '#f97316';
        ctx.lineWidth = 2 + Math.random() * 3;
        ctx.stroke();
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

  function completeStep() {
    assessmentAudio.playCorrectChime();
    setStepAnimTrigger(currentStep);

    setCompletedSteps(prev => {
      const nextSet = new Set([...prev, currentStep]);
      if (nextSet.size >= LOTO_STEPS.length) {
        assessmentAudio.playQuizComplete();
      }
      return nextSet;
    });

    setTimeout(() => {
      setStepAnimTrigger(null);
      if (currentStep < LOTO_STEPS.length - 1) {
        setCurrentStep(s => s + 1);
      }
    }, 450);
  }

  function resetProcedure() {
    assessmentAudio.playClick();
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setStepAnimTrigger(null);
  }

  const handleQuizAnswerSubmit = (optionIndex: number) => {
    if (quizAnswers[quizIndex] !== undefined) return;

    const currentQ = quizQuestions[quizIndex];
    const isCorrect = optionIndex === currentQ.correctAnswer;

    setQuizAnswers(prev => ({ ...prev, [quizIndex]: optionIndex }));
    setShowExplanation(true);

    if (isCorrect) {
      setCorrectPulse(true);
      setTimeout(() => setCorrectPulse(false), 700);
      setFloatingScore("+10 MARKS!");
      setTimeout(() => setFloatingScore(null), 1200);
      assessmentAudio.playCorrectChime();
    } else {
      assessmentAudio.playShortCircuitZap();
      triggerSparkAnimation();
      setFloatingScore("⚡ WRONG (0 Marks)");
      setTimeout(() => setFloatingScore(null), 1200);
    }
  };

  // Calculate total marks (10 questions x 10 marks = 100 Marks max)
  const totalQuizMarks = Object.entries(quizAnswers).reduce((acc, [qi, chosenOpt]) => {
    const q = quizQuestions[+qi];
    return acc + (q && chosenOpt === q.correctAnswer ? 10 : 0);
  }, 0);

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden text-slate-100 relative">
      {/* Short Circuit Spark Overlay Canvas */}
      <canvas
        ref={sparkCanvasRef}
        className={cn("absolute inset-0 z-50 pointer-events-none w-full h-full", shortCircuitVFX ? "opacity-100" : "opacity-0")}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Wrong Answer Danger Vignette */}
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

      {/* Top Header */}
      <div className="shrink-0 flex items-center justify-between px-3 pt-2 pb-1.5 border-b border-slate-800/80 bg-slate-900/90 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(249,115,22,0.3)]">
            <Lock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-white leading-none truncate flex items-center gap-1.5">
              LOTO Procedure Simulator
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 font-mono">OSHA 1910.147</span>
            </h2>
            <p className="text-[9px] text-slate-400 font-mono truncate mt-0.5">Control of Hazardous Energy · High-Voltage Safety Protocol</p>
          </div>
        </div>

        {/* Global Prominent Reset Button in Header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={resetProcedure}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-red-950/40 hover:border-red-500/60 text-slate-200 hover:text-red-300 transition-all text-xs font-black uppercase tracking-wider cursor-pointer shadow-md active:scale-95"
            title="Reset procedure from Step 1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Reset LOTO</span>
          </button>

          {allDone && activeTab === "procedure" && (
            <motion.div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9.5px] font-black text-emerald-300 uppercase tracking-wide">All Done!</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-slate-800 px-1 gap-1 bg-slate-950 shadow-md z-20">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[10px] md:text-xs font-black uppercase tracking-wider border border-transparent transition-all cursor-pointer flex-1 justify-center",
              activeTab === tab.id 
                ? "bg-gradient-to-b from-orange-500/30 to-orange-500/10 border-orange-500/70 text-orange-300 border-b-transparent shadow-lg" 
                : "text-slate-400 hover:text-white hover:bg-slate-900 border-b-transparent")}>
            <tab.icon className="w-3.5 h-3.5 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden z-20">
        <AnimatePresence mode="wait">

          {/* === PROCEDURE TAB (ZERO SCROLL FIT FOR MOBILE & LAPTOP) === */}
          {activeTab === "procedure" && (
            <motion.div key="procedure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative flex flex-col h-full overflow-hidden p-2 gap-2 bg-slate-950">

              {/* STEP COMPLETION ANIMATED CELEBRATION OVERLAY */}
              <AnimatePresence>
                {stepAnimTrigger !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-emerald-950/20 backdrop-blur-[2px]"
                  >
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [0.8, 1.2, 1], opacity: 1 }}
                      transition={{ duration: 0.4, type: "spring" }}
                      className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-slate-900/90 border-2 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.5)]"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg">
                        <CheckCircle className="w-10 h-10" />
                      </div>
                      <span className="text-lg font-black text-emerald-300 uppercase tracking-widest">
                        Step {stepAnimTrigger + 1} Verified & Completed!
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        {LOTO_STEPS[stepAnimTrigger].title}
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* TOP STEPPER BAR (STEPS 1 TO 6) */}
              <div className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-md">
                <div className="flex items-center justify-between mb-1.5 text-[10px] md:text-xs font-mono">
                  <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    Step {currentStep + 1} of 6: <span className="underline decoration-2" style={{ color: step.color }}>{step.title}</span>
                  </span>
                  <span className="font-black text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/30">
                    {completedSteps.size}/6 Completed
                  </span>
                </div>

                {/* Step Pills Row */}
                <div className="grid grid-cols-6 gap-1.5">
                  {LOTO_STEPS.map((s, i) => {
                    const isActive = i === currentStep;
                    const isDone = completedSteps.has(i);
                    const isJustDone = stepAnimTrigger === i;

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentStep(i)}
                        className={cn(
                          "flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden active:scale-95",
                          isActive
                            ? "bg-slate-800 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.35)] ring-1 ring-orange-400/50"
                            : isDone
                              ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300"
                              : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white"
                        )}
                      >
                        {isJustDone && (
                          <motion.div
                            className="absolute inset-0 bg-emerald-500/30"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                          />
                        )}
                        <div className="flex items-center gap-1">
                          {isDone ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="text-xs font-black font-mono" style={{ color: isActive ? s.color : "#cbd5e1" }}>{i + 1}</span>
                          )}
                          <span className="hidden sm:inline text-[9.5px] font-black truncate max-w-[60px]" style={{ color: isActive ? s.color : isDone ? "#86efac" : "#e2e8f0" }}>
                            {s.shortTitle}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MAIN ACTIVE STEP VIEWPORT */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 overflow-hidden">
                {/* SVG ANIMATED INTERACTIVE SCENE PANEL */}
                <div className="lg:col-span-6 flex flex-col min-h-0 overflow-hidden bg-slate-900/80 border border-slate-800 rounded-xl p-2 shadow-md">
                  <div className="flex items-center justify-between shrink-0 mb-1">
                    <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                      style={{ color: step.color, borderColor: step.color + "90", backgroundColor: step.color + "25" }}>
                      Diagram · Step {currentStep + 1}: {step.shortTitle}
                    </span>
                    <span className={cn("text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border shadow-sm",
                      step.hazardLevel === "Critical" ? "text-red-300 border-red-500/60 bg-red-950/60" : step.hazardLevel === "High" ? "text-amber-300 border-amber-500/60 bg-amber-950/60" : "text-emerald-300 border-emerald-500/60 bg-emerald-950/60")}>
                      {step.hazardLevel} Hazard
                    </span>
                  </div>

                  <div className="flex-1 min-h-0 bg-slate-950 border border-slate-800 rounded-lg relative flex items-center justify-center overflow-hidden">
                    <LOTOMachineryVisualEngine
                      step={currentStep}
                      isCompleted={completedSteps.has(currentStep)}
                      color={step.color}
                    />
                  </div>
                </div>

                {/* FOCUSED STEP DETAILS PANEL (ZERO-SCROLL BALANCED LAYOUT) */}
                <div className="lg:col-span-6 flex flex-col justify-between min-h-0 overflow-hidden bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 gap-2 shadow-md">
                  
                  {/* Top: Step Directive Header */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: step.color }} />
                        <span className="text-xs font-black uppercase text-white tracking-wide">
                          Step {step.id}: {step.title} Directive
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-orange-400 uppercase bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-500/30">
                        {step.regulation}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug font-sans">
                      {step.desc}
                    </p>
                  </div>

                  {/* Middle: 2-Column Micro-Grid (Mandatory Actions 7 cols & Fatal Mistake 5 cols) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1 min-h-0 overflow-hidden">
                    {/* Mandatory Safety Actions (7 cols) */}
                    <div className="sm:col-span-7 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between overflow-hidden min-h-0">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                          Mandatory Safety Protocol
                        </span>
                        <div className="space-y-1 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                          {step.keyPoints.map((pt, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-emerald-400" />
                              <span className="text-[10.5px] text-slate-200 leading-tight">{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800/80 text-[8.5px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Zero-Energy Verified</span>
                        <span className="text-emerald-400 font-bold">REQUIRED</span>
                      </div>
                    </div>

                    {/* Fatal Mistake Alert (5 cols) */}
                    <div className="sm:col-span-5 p-2.5 rounded-xl border border-red-500/40 bg-red-950/30 flex flex-col justify-between overflow-hidden min-h-0">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Fatal Mistake</span>
                        </div>
                        <p className="text-[10.5px] text-red-200 leading-tight">
                          {step.warning}
                        </p>
                      </div>

                      <div className="pt-1.5 border-t border-red-500/20 text-[9px] font-mono text-red-400/80 flex items-center justify-between">
                        <span>OSHA Standard</span>
                        <span className="text-[8px] bg-red-950 px-1 py-0.2 rounded border border-red-800 text-red-300">CRITICAL</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Action Controls Bar */}
                  <div className="shrink-0 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep(s => s - 1)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white border border-slate-700 bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all uppercase shadow-md active:scale-95"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Prev</span>
                      </button>

                      <button
                        onClick={resetProcedure}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:text-red-300 hover:bg-red-950/40 hover:border-red-500/50 cursor-pointer transition-all text-xs font-bold uppercase tracking-wider shadow-md active:scale-95"
                        title="Reset All Steps"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                        <span className="hidden sm:inline">Reset</span>
                      </button>
                    </div>

                    {!allDone ? (
                      <motion.button
                        onClick={completeStep}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-black text-xs md:text-sm uppercase tracking-wider cursor-pointer border transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95 text-slate-950",
                          completedSteps.has(currentStep)
                            ? "bg-gradient-to-r from-emerald-400 to-teal-400 border-emerald-300 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                            : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 border-amber-300"
                        )}
                      >
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {completedSteps.has(currentStep) ? "Step Verified ✓" : `Complete Step ${currentStep + 1}`}
                      </motion.button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-black text-xs md:text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 border border-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        <Award className="w-4 h-4" /> LOTO Completed!
                      </div>
                    )}

                    <button
                      disabled={currentStep === LOTO_STEPS.length - 1}
                      onClick={() => setCurrentStep(s => s + 1)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white border border-slate-700 bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all uppercase shadow-md active:scale-95"
                    >
                      <span className="hidden sm:inline">Next</span> <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* === LEARN TAB === */}
          {activeTab === "learn" && (
            <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row h-full overflow-hidden p-2.5 md:p-3 gap-3 bg-slate-950/60">
              
              <div className="w-full lg:w-1/2 flex flex-col gap-2.5 overflow-hidden justify-between h-full">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-xs font-black text-slate-100 uppercase tracking-wide">Knowledge Cards ({learnCard + 1}/{LEARN_CARDS.length})</span>
                  <div className="flex gap-1">{LEARN_CARDS.map((c, i) => (
                    <button key={i} onClick={() => setLearnCard(i)} className="rounded-full transition-all cursor-pointer hover:scale-110" style={{ width: i === learnCard ? 16 : 8, height: 8, backgroundColor: i === learnCard ? c.color : "#475569" }} />
                  ))}</div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div key={learnCard} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                      className="flex-1 rounded-xl border p-3.5 flex flex-col justify-between"
                      style={{ borderColor: LEARN_CARDS[learnCard].color + "90", backgroundColor: LEARN_CARDS[learnCard].color + "18" }}>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                            style={{ backgroundColor: LEARN_CARDS[learnCard].color + "30", border: `1.5px solid ${LEARN_CARDS[learnCard].color}` }}>
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
                  <button disabled={learnCard === 0} onClick={() => setLearnCard(c => c - 1)} 
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-black border border-slate-700 bg-slate-850 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-750 hover:text-white cursor-pointer transition-all uppercase text-slate-100 shadow-md">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button disabled={learnCard === LEARN_CARDS.length - 1} onClick={() => setLearnCard(c => c + 1)} 
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-black border border-slate-700 bg-slate-850 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-750 hover:text-white cursor-pointer transition-all uppercase text-slate-100 shadow-md">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="w-full lg:w-1/2 flex flex-col gap-2.5 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
                  {[
                    { val: "120+", label: "Deaths/yr w/o LOTO", color: "#ef4444" },
                    { val: "50k+", label: "Injuries saved/yr", color: "#22c55e" },
                    { val: "6", label: "Energy types", color: "#8b5cf6" },
                    { val: "$15k+", label: "Avg OSHA fine", color: "#f97316" },
                  ].map((s, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-750 text-center shadow-md">
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
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-750 bg-slate-900 shadow-md">
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

          {/* === IMPROVED CHECKLIST TAB (ZERO SCROLL SMART GRID) === */}
          {activeTab === "checklist" && (
            <motion.div key="checklist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-full overflow-hidden p-2 sm:p-3 gap-2 bg-slate-950">
              
              {/* Header Status & Filter Controls */}
              <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className={cn("w-3 h-3 rounded-full animate-pulse shrink-0", checkedCritical === totalCritical ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-amber-400")} />
                  <span className={cn("text-xs md:text-sm font-black uppercase tracking-wide", checkedCritical === totalCritical ? "text-emerald-300" : "text-amber-300")}>
                    {checkedCritical === totalCritical ? "All Critical Items Complete!" : `${totalCritical - checkedCritical} Critical Items Remaining`}
                  </span>
                </div>

                {/* Category Filters & Actions */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto justify-end">
                  {["All", "Before Start", "Shutdown", "Isolation", "Lock & Tag", "Energy Release", "Verification"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setChecklistFilter(cat)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border",
                        checklistFilter === cat
                          ? "bg-orange-500 text-slate-950 border-orange-400 shadow-sm"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => setCheckedItems(new Set(CHECKLIST_ITEMS.map(i => i.id)))}
                    className="px-2 py-1 rounded-lg text-[9px] font-black uppercase bg-emerald-950 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 cursor-pointer shadow-sm"
                  >
                    Check All
                  </button>
                  <button
                    onClick={() => setCheckedItems(new Set())}
                    className="p-1 rounded-lg text-slate-300 bg-slate-950 border border-slate-800 hover:text-red-300 hover:border-red-500/50 cursor-pointer shadow-sm"
                    title="Reset Checklist"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="shrink-0 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-400"
                  animate={{ width: `${(checkedItems.size / CHECKLIST_ITEMS.length) * 100}%` }}
                />
              </div>

              {/* Checklist Items Viewport (Zero Scroll Smart Grid) */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {CHECKLIST_ITEMS
                    .filter(item => checklistFilter === "All" || item.category === checklistFilter)
                    .map(item => {
                      const checked = checkedItems.has(item.id);
                      return (
                        <motion.button
                          key={item.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCheckedItems(prev => { const n = new Set(prev); checked ? n.delete(item.id) : n.add(item.id); return n; })}
                          className={cn(
                            "flex items-center gap-2.5 p-2 px-3 rounded-xl border text-left transition-all cursor-pointer shadow-md",
                            checked
                              ? "bg-emerald-950/30 border-emerald-500/50"
                              : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                          )}
                        >
                          <div className={cn("w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all", checked ? "bg-emerald-500 border-emerald-400 text-slate-950" : "border-slate-600 bg-slate-800")}>
                            {checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs font-black">✓</motion.span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-mono text-orange-400 font-bold uppercase block">{item.category}</span>
                            <span className={cn("text-xs font-medium leading-snug block truncate", checked ? "text-slate-400 line-through" : "text-white")}>
                              {item.text}
                            </span>
                          </div>
                          {item.critical && !checked && (
                            <span className="shrink-0 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase bg-red-950 border border-red-500/60 text-red-300 shadow-sm">
                              Critical
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          )}

          {/* === IMPROVED QUIZ TAB (10 QUESTIONS x 10 MARKS = 100 MARKS) === */}
          {activeTab === "quiz" && (
            <motion.div
              key="quiz"
              animate={screenShake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full overflow-hidden p-2.5 md:p-3.5 bg-slate-950 relative"
            >

              {/* Floating Score Animation */}
              <AnimatePresence>
                {floatingScore && (
                  <motion.div
                    initial={{ opacity: 1, y: 0, scale: 0.8 }}
                    animate={{ opacity: 0, y: -50, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-xl font-black font-mono drop-shadow-[0_0_15px_currentColor]"
                    style={{ color: floatingScore.includes("WRONG") ? "#ef4444" : "#22c55e" }}
                  >
                    {floatingScore}
                  </motion.div>
                )}
              </AnimatePresence>

              {quizSubmitted ? (
                /* QUIZ RESULTS SCREEN */
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full overflow-y-auto space-y-3 no-scrollbar">
                  <div className={cn("p-5 rounded-2xl border text-center shadow-2xl relative overflow-hidden",
                    totalQuizMarks >= 80 ? "bg-emerald-950/50 border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.2)]" : totalQuizMarks >= 60 ? "bg-amber-950/50 border-amber-500/60" : "bg-rose-950/50 border-rose-500/60"
                  )}>
                    <div className="text-5xl mb-2">{totalQuizMarks >= 80 ? "🏆" : totalQuizMarks >= 60 ? "🛡️" : "⚠️"}</div>
                    <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-white mb-1">
                      {totalQuizMarks >= 80 ? "LOTO SAFETY CHAMPION" : totalQuizMarks >= 60 ? "CERTIFIED SAFETY OFFICER" : "HAZARD RISK ZONE"}
                    </h3>
                    <p className={cn("text-4xl font-black font-mono my-1", totalQuizMarks >= 80 ? "text-emerald-300" : totalQuizMarks >= 60 ? "text-amber-300" : "text-rose-400")}>
                      {totalQuizMarks} <span className="text-lg text-slate-400">/ 100 MARKS</span>
                    </p>
                    <p className="text-xs font-bold text-slate-300 max-w-md mx-auto leading-relaxed">
                      {totalQuizMarks >= 80 ? "Flawless performance! You have mastered LOTO energy isolation protocols." : "Review missed questions below and retake the quiz to achieve 100% mastery."}
                    </p>
                  </div>

                  {/* Question Breakdown List */}
                  <div className="space-y-2">
                    {quizQuestions.map((q, qi) => {
                      const userChoice = quizAnswers[qi];
                      const isCorrect = userChoice === q.correctAnswer;
                      return (
                        <div key={qi} className={cn("p-3 rounded-xl border shadow-md transition-all", isCorrect ? "bg-emerald-950/30 border-emerald-500/50" : "bg-rose-950/30 border-rose-500/50")}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-start gap-2">
                              {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                              <div>
                                <span className="text-xs font-bold text-white block">Q{qi + 1}: {q.question}</span>
                                <span className="text-[9px] font-mono text-orange-400 uppercase font-bold">{q.category}</span>
                              </div>
                            </div>
                            <span className={cn("text-xs font-black font-mono px-2 py-0.5 rounded border shrink-0", isCorrect ? "text-emerald-300 border-emerald-500/40 bg-emerald-950" : "text-rose-300 border-rose-500/40 bg-rose-950")}>
                              {isCorrect ? "+10 MARKS" : "0 MARKS"}
                            </span>
                          </div>
                          <p className="text-[11px] pl-6 text-slate-300 leading-relaxed font-medium mt-1">{q.explanation}</p>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={initializeQuiz}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs md:text-sm uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" /> Start New 10-Question Quiz (Fresh Shuffled Set)
                  </button>
                </motion.div>
              ) : (
                /* ACTIVE QUIZ INTERFACE */
                <div className="flex flex-col h-full justify-between space-y-2">
                  
                  {/* Quiz HUD Header */}
                  <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white uppercase tracking-wider block">
                          Question {quizIndex + 1} of 10
                        </span>
                        <span className="text-[9px] font-mono text-orange-400 uppercase font-bold">
                          {quizQuestions[quizIndex]?.category} · 10 Marks Each
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-slate-400 uppercase block">Current Score</span>
                        <span className="text-sm font-black font-mono text-emerald-400">{totalQuizMarks} / 100 MARKS</span>
                      </div>

                      {/* Question indicator pills */}
                      <div className="hidden sm:flex gap-1">
                        {quizQuestions.map((_, i) => (
                          <div
                            key={i}
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: i === quizIndex ? 18 : quizAnswers[i] !== undefined ? 10 : 6,
                              backgroundColor: quizAnswers[i] !== undefined ? (quizAnswers[i] === quizQuestions[i]?.correctAnswer ? "#22c55e" : "#ef4444") : i === quizIndex ? "#f97316" : "#475569"
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="flex-1 min-h-0 flex flex-col justify-between space-y-2 overflow-hidden bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={quizIndex}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col flex-1 min-h-0 justify-between space-y-2"
                      >
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed mb-2">
                            {quizQuestions[quizIndex]?.question}
                          </h3>
                        </div>

                        {/* 4 Shuffled Options */}
                        <div className="grid grid-cols-1 gap-2">
                          {quizQuestions[quizIndex]?.options.map((opt, oi) => {
                            const answered = quizAnswers[quizIndex] !== undefined;
                            const isCorrectOpt = oi === quizQuestions[quizIndex].correctAnswer;
                            const isSelected = quizAnswers[quizIndex] === oi;

                            return (
                              <motion.button
                                key={oi}
                                whileTap={!answered ? { scale: 0.98 } : undefined}
                                onClick={() => handleQuizAnswerSubmit(oi)}
                                disabled={answered}
                                className={cn(
                                  "w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs sm:text-sm shadow-md",
                                  answered
                                    ? (isCorrectOpt
                                        ? "bg-emerald-950/50 border-emerald-500/70 text-emerald-200 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                        : isSelected
                                          ? "bg-rose-950/50 border-rose-500/70 text-rose-200 font-medium"
                                          : "bg-slate-950/30 border-slate-900 text-slate-600 opacity-40")
                                    : "bg-slate-900 border-slate-800 text-slate-100 hover:border-orange-500/70 hover:bg-orange-950/30 hover:text-white"
                                )}
                              >
                                <span className={cn(
                                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center text-[10px] font-black shrink-0 transition-all",
                                  answered
                                    ? (isCorrectOpt
                                        ? "border-emerald-400 bg-emerald-500 text-slate-950"
                                        : isSelected
                                          ? "border-rose-400 bg-rose-500 text-white"
                                          : "border-slate-700 text-slate-600")
                                    : "border-slate-700 text-slate-300"
                                )}>
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                <span className="flex-1 leading-snug">{opt}</span>
                                {answered && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                                {answered && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                              </motion.button>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        <AnimatePresence>
                          {showExplanation && quizAnswers[quizIndex] !== undefined && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className={cn(
                                "p-2.5 rounded-xl border flex items-start gap-2 shadow-md shrink-0",
                                quizAnswers[quizIndex] === quizQuestions[quizIndex].correctAnswer
                                  ? "bg-emerald-950/40 border-emerald-500/50"
                                  : "bg-rose-950/40 border-rose-500/50"
                              )}
                            >
                              <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                {quizQuestions[quizIndex].explanation}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Quiz Navigation Action Bar */}
                  <div className="shrink-0 flex items-center justify-between pt-1 border-t border-slate-800">
                    <button
                      disabled={quizIndex === 0}
                      onClick={() => setQuizIndex(i => i - 1)}
                      className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-850 text-slate-200 text-xs font-black uppercase disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-750 transition-all shadow-md"
                    >
                      <ChevronLeft className="w-4 h-4 inline" /> Prev
                    </button>

                    {quizAnswers[quizIndex] !== undefined && (
                      quizIndex < 9 ? (
                        <button
                          onClick={() => { setQuizIndex(i => i + 1); setShowExplanation(false); }}
                          className="flex-1 max-w-xs py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 mx-2"
                        >
                          Next Question <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setQuizSubmitted(true)}
                          className="flex-1 max-w-xs py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 mx-2"
                        >
                          <Award className="w-4 h-4" /> Finish & View Results (100 Marks)
                        </button>
                      )
                    )}

                    <button
                      disabled={quizIndex === 9 || quizAnswers[quizIndex] === undefined}
                      onClick={() => { setQuizIndex(i => i + 1); setShowExplanation(false); }}
                      className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-850 text-slate-200 text-xs font-black uppercase disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-750 transition-all shadow-md"
                    >
                      Next <ChevronRight className="w-4 h-4 inline" />
                    </button>
                  </div>

                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
