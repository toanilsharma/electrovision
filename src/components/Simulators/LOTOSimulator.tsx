import React, { useState, useEffect } from "react";
import {
  Lock, Shield, CheckCircle, AlertTriangle,
  ChevronRight, ChevronLeft, RotateCcw, Zap, Eye, BookOpen,
  ClipboardList, HelpCircle, CheckCircle2, XCircle, Power,
  Unlock, Info, Award, ArrowRight
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { UserConfig } from "@/src/types";

type TabId = "procedure" | "learn" | "checklist" | "quiz";
interface QuizQ { question: string; options: string[]; correct: number; explanation: string; }

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

const QUIZ_QUESTIONS: QuizQ[] = [
  { question: "What does LOTO stand for?", options: ["Lockout/Tagout", "Load Off / Turn Off", "Lock On / Tag Out", "Line Outage / Total Off"], correct: 0, explanation: "LOTO stands for Lockout/Tagout — the process of physically locking energy isolation devices and attaching warning tags to prevent unexpected equipment energization during maintenance." },
  { question: "Who is the ONLY person who can remove an authorized employee's personal lock?", options: ["The supervisor on duty", "The safety officer", "The authorized employee who placed it", "Any qualified electrician"], correct: 2, explanation: "Only the authorized employee who placed the lock can remove it. This is a fundamental LOTO principle. Exceptions require a specific documented procedure under OSHA 1910.147." },
  { question: "Which energy type is most commonly involved in LOTO incidents?", options: ["Hydraulic", "Electrical", "Pneumatic", "Thermal"], correct: 1, explanation: "Electrical energy is the most common hazardous energy source controlled by LOTO. However, ALL energy types must be addressed — hydraulic, pneumatic, mechanical, thermal, and chemical." },
  { question: "What is the FINAL step before starting work on isolated equipment?", options: ["Apply the danger tag", "Bleed stored energy", "Verify zero energy state", "Notify the supervisor"], correct: 2, explanation: "Verification (zero energy state) is always the last step. Try to start the equipment and test with a calibrated meter. NEVER assume isolation is complete — always verify with instruments." },
  { question: "When is a tag ALONE sufficient instead of a lock?", options: ["When the supervisor approves it", "When only one person is working", "When a lock cannot physically be applied to the isolation device", "Tags are always sufficient"], correct: 2, explanation: "Tags are only used alone when the isolation device cannot physically accommodate a lock. OSHA requires locks whenever physically feasible. Tags without locks provide only a warning, not physical protection." },
];

// === Animated SVG Scenes ===

function Step0Scene({ isCompleted }: { isCompleted: boolean }) {
  const [tick, setTick] = React.useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 1100); return () => clearInterval(t); }, []);
  const items = ["Electrical", "Hydraulic", "Pneumatic", "Mechanical"];
  return (
    <svg viewBox="0 0 300 210" className="w-full h-full" style={{ maxWidth: 320 }}>
      <rect x="70" y="14" width="160" height="185" rx="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
      <rect x="100" y="7" width="100" height="22" rx="5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="150" y="22" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">LOTO FORM</text>
      {items.map((item, i) => {
        const checked = i < (tick % 5);
        return (
          <g key={i}>
            <rect x="85" y={48 + i * 36} width="16" height="16" rx="3" fill={checked ? "#22c55e" : "#334155"} stroke={checked ? "#22c55e" : "#64748b"} strokeWidth="1.5" />
            {checked && <text x="93" y={60 + i * 36} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">✓</text>}
            <text x="109" y={62 + i * 36} fill="#94a3b8" fontSize="11">{item}</text>
          </g>
        );
      })}
      {isCompleted && <><circle cx="215" cy="175" r="18" fill="#22c55e" /><text x="215" y="181" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">✓</text></>}
    </svg>
  );
}

function Step1Scene({ isCompleted }: { isCompleted: boolean }) {
  const [powered, setPowered] = React.useState(true);
  useEffect(() => { const t = setTimeout(() => setPowered(false), 900); return () => clearTimeout(t); }, []);
  return (
    <svg viewBox="0 0 300 210" className="w-full h-full" style={{ maxWidth: 320 }}>
      <rect x="60" y="28" width="180" height="130" rx="12" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
      <text x="150" y="50" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">CONTROL PANEL</text>
      <circle cx="150" cy="105" r="32" fill={powered ? "#ef4444" : "#1e293b"} stroke={powered ? "#fca5a5" : "#475569"} strokeWidth="3" style={{ transition: "fill 0.6s, stroke 0.6s" }} />
      <path d="M150 78 L150 98" stroke="white" strokeWidth="4" strokeLinecap="round" opacity={powered ? 1 : 0.3} style={{ transition: "opacity 0.5s" }} />
      <path d="M136 85 Q125 95 125 105 Q125 120 150 125 Q175 120 175 105 Q175 95 164 85" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" opacity={powered ? 1 : 0.3} style={{ transition: "opacity 0.5s" }} />
      <text x="150" y="155" textAnchor="middle" fill={powered ? "#ef4444" : "#22c55e"} fontSize="12" fontWeight="bold" style={{ transition: "fill 0.5s" }}>{powered ? "● RUNNING" : "○ STOPPED"}</text>
      <circle cx="95" cy="85" r="8" fill={powered ? "#ef4444" : "#374151"} style={{ transition: "fill 0.5s" }} />
      <circle cx="205" cy="85" r="8" fill={powered ? "#f97316" : "#374151"} style={{ transition: "fill 0.5s" }} />
      {isCompleted && <><circle cx="240" cy="183" r="16" fill="#22c55e" /><text x="240" y="189" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">✓</text></>}
    </svg>
  );
}

function Step2Scene({ isCompleted }: { isCompleted: boolean }) {
  const [isolated, setIsolated] = React.useState(false);
  useEffect(() => { const t = setTimeout(() => setIsolated(true), 800); return () => clearTimeout(t); }, []);
  return (
    <svg viewBox="0 0 300 210" className="w-full h-full" style={{ maxWidth: 320 }}>
      <line x1="30" y1="80" x2="100" y2="80" stroke="#ef4444" strokeWidth="5" />
      <circle cx="110" cy="80" r="8" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2.5" />
      <line x1="118" y1="80" x2={isolated ? 128 : 168} y2={isolated ? 58 : 80} stroke="#8b5cf6" strokeWidth="5" strokeLinecap="round" style={{ transition: "x2 0.5s, y2 0.5s" }} />
      <circle cx="170" cy="80" r="8" fill="#1e293b" stroke={isolated ? "#475569" : "#8b5cf6"} strokeWidth="2.5" style={{ transition: "stroke 0.5s" }} />
      <rect x="180" y="55" width="90" height="60" rx="8" fill={isolated ? "#0f172a" : "#1e3a5f"} stroke={isolated ? "#374151" : "#3b82f6"} strokeWidth="2" style={{ transition: "fill 0.5s, stroke 0.5s" }} />
      <text x="225" y="87" textAnchor="middle" fill={isolated ? "#4b5563" : "#60a5fa"} fontSize="11" fontWeight="bold" style={{ transition: "fill 0.5s" }}>{isolated ? "ISOLATED" : "ENERGIZED"}</text>
      {!isolated && <text x="225" y="75" textAnchor="middle" fontSize="18">⚡</text>}
      {isolated && <text x="136" y="53" fill="#8b5cf6" fontSize="22">↗</text>}
      <text x="150" y="150" textAnchor="middle" fill="#64748b" fontSize="8">Isolating Devices</text>
      <rect x="38" y="162" width="62" height="22" rx="5" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" />
      <text x="69" y="177" textAnchor="middle" fill="#8b5cf6" fontSize="8.5" fontWeight="bold">DISCONNECT</text>
      <rect x="112" y="162" width="62" height="22" rx="5" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
      <text x="143" y="177" textAnchor="middle" fill="#06b6d4" fontSize="8.5" fontWeight="bold">AIR VALVE</text>
      <rect x="190" y="162" width="68" height="22" rx="5" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" />
      <text x="224" y="177" textAnchor="middle" fill="#a78bfa" fontSize="8.5" fontWeight="bold">HYD. VALVE</text>
      {isCompleted && <><circle cx="255" cy="193" r="14" fill="#22c55e" /><text x="255" y="198" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">✓</text></>}
    </svg>
  );
}

function Step3Scene({ isCompleted }: { isCompleted: boolean }) {
  const [locked, setLocked] = React.useState(false);
  useEffect(() => { const t = setTimeout(() => setLocked(true), 700); return () => clearTimeout(t); }, []);
  return (
    <svg viewBox="0 0 300 210" className="w-full h-full" style={{ maxWidth: 320 }}>
      <rect x="50" y="28" width="90" height="120" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
      <text x="95" y="48" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">DISCONNECT</text>
      <rect x="75" y="58" width="40" height="60" rx="4" fill="#374151" stroke="#64748b" strokeWidth="1.5" />
      <rect x="82" y="88" width="26" height="22" rx="3" fill="#ef4444" />
      <text x="95" y="104" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">OFF</text>
      <g style={{ opacity: locked ? 1 : 0.15, transition: "opacity 0.5s" }}>
        <rect x="80" y="123" width="30" height="18" rx="4" fill="#f97316" stroke="#fb923c" strokeWidth="1.5" />
        <path d="M87 123 Q87 116 95 116 Q103 116 103 123" fill="none" stroke="#fb923c" strokeWidth="3" />
        <text x="95" y="136" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">LOCK</text>
      </g>
      <g style={{ opacity: locked ? 1 : 0.08, transition: "opacity 0.6s" }}>
        <rect x="155" y="58" width="105" height="68" rx="6" fill="#1e293b" stroke="#f97316" strokeWidth="2" />
        <path d="M155 73 L145 80 L155 87" fill="none" stroke="#f97316" strokeWidth="2" />
        <text x="207" y="76" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="bold">⚠ DANGER</text>
        <text x="207" y="89" textAnchor="middle" fill="#f97316" fontSize="8.5" fontWeight="bold">DO NOT ENERGIZE</text>
        <line x1="170" y1="100" x2="248" y2="100" stroke="#374151" strokeWidth="1" />
        <text x="209" y="115" textAnchor="middle" fill="#94a3b8" fontSize="7">Worker Name / Date</text>
      </g>
      <text x="95" y="172" textAnchor="middle" fontSize="11" fontWeight="bold" fill={locked ? "#22c55e" : "#64748b"} style={{ transition: "fill 0.5s" }}>{locked ? "🔒 LOCKED OUT" : "Applying..."}</text>
      {isCompleted && <><circle cx="255" cy="190" r="16" fill="#22c55e" /><text x="255" y="196" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">✓</text></>}
    </svg>
  );
}

function Step4Scene({ isCompleted }: { isCompleted: boolean }) {
  const [pressure, setPressure] = React.useState(100);
  useEffect(() => { const t = setInterval(() => setPressure(p => Math.max(0, p - 7)), 280); return () => clearInterval(t); }, []);
  const angle = -135 + (pressure / 100) * 270;
  const color = pressure > 60 ? "#ef4444" : pressure > 30 ? "#f97316" : "#22c55e";
  const nx = 100 + 44 * Math.cos((angle - 90) * Math.PI / 180);
  const ny = 100 + 44 * Math.sin((angle - 90) * Math.PI / 180);
  return (
    <svg viewBox="0 0 300 210" className="w-full h-full" style={{ maxWidth: 320 }}>
      <circle cx="100" cy="100" r="65" fill="#0f172a" stroke="#334155" strokeWidth="3" />
      <path d="M 45 140 A 60 60 0 1 1 155 140" fill="none" stroke="#374151" strokeWidth="10" strokeLinecap="round" />
      <path d="M 45 140 A 60 60 0 1 1 155 140" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${pressure * 1.88} 188`} style={{ transition: "stroke-dasharray 0.3s, stroke 0.3s" }} />
      <line x1="100" y1="100" x2={nx} y2={ny} stroke={color} strokeWidth="3.5" strokeLinecap="round" style={{ transition: "x2 0.3s, y2 0.3s, stroke 0.3s" }} />
      <circle cx="100" cy="100" r="6" fill={color} style={{ transition: "fill 0.3s" }} />
      <text x="100" y="142" textAnchor="middle" fontSize="20" fontWeight="bold" fill={color} style={{ transition: "fill 0.3s" }}>{pressure}</text>
      <text x="100" y="156" textAnchor="middle" fill="#64748b" fontSize="9">PSI</text>
      <text x="100" y="24" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">PRESSURE GAUGE</text>
      <rect x="182" y="38" width="85" height="52" rx="6" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
      <text x="224" y="56" textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="bold">CAPACITOR</text>
      <text x="224" y="74" textAnchor="middle" fontSize="16" fill={pressure > 20 ? "#ef4444" : "#4b5563"} style={{ transition: "fill 0.3s" }}>{pressure > 20 ? "⚡" : "○"}</text>
      <text x="224" y="89" textAnchor="middle" fontSize="9" fontWeight="bold" fill={pressure > 20 ? "#ef4444" : "#22c55e"} style={{ transition: "fill 0.3s" }}>{pressure > 20 ? "CHARGED" : "DISCHARGED"}</text>
      {isCompleted && <><circle cx="230" cy="183" r="16" fill="#22c55e" /><text x="230" y="189" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">✓</text></>}
    </svg>
  );
}

function Step5Scene({ isCompleted }: { isCompleted: boolean }) {
  const [reading, setReading] = React.useState(230);
  useEffect(() => { const t = setInterval(() => setReading(v => Math.max(0, v - 13)), 260); return () => clearInterval(t); }, []);
  return (
    <svg viewBox="0 0 300 210" className="w-full h-full" style={{ maxWidth: 320 }}>
      <rect x="40" y="18" width="110" height="155" rx="10" fill="#1e293b" stroke="#22c55e" strokeWidth="2.5" />
      <rect x="52" y="32" width="86" height="55" rx="5" fill="#0d1117" stroke="#22c55e" strokeWidth="1.5" />
      <text x="95" y="68" textAnchor="middle" fontSize="26" fontWeight="bold" fill={reading === 0 ? "#22c55e" : "#ef4444"} style={{ transition: "fill 0.3s" }}>{reading}</text>
      <text x="95" y="82" textAnchor="middle" fill="#4b5563" fontSize="10">Volts AC</text>
      <text x="95" y="108" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">MULTIMETER</text>
      <line x1="72" y1="173" x2="72" y2="208" stroke="#ef4444" strokeWidth="3" />
      <line x1="118" y1="173" x2="118" y2="208" stroke="#4b5563" strokeWidth="3" />
      <circle cx="72" cy="173" r="5" fill="#ef4444" />
      <circle cx="118" cy="173" r="5" fill="#4b5563" />
      <rect x="175" y="78" width="90" height="80" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2" />
      <text x="220" y="108" textAnchor="middle" fill="#374151" fontSize="10" fontWeight="bold">TERMINAL</text>
      <text x="220" y="133" textAnchor="middle" fontSize="20" fill={reading === 0 ? "#22c55e" : "#374151"} style={{ transition: "fill 0.3s" }}>{reading === 0 ? "✅" : "○"}</text>
      <text x="220" y="152" textAnchor="middle" fontSize="10" fontWeight="bold" fill={reading === 0 ? "#22c55e" : "#ef4444"} style={{ transition: "fill 0.3s" }}>{reading === 0 ? "ZERO" : "ACTIVE!"}</text>
      <rect x="40" y="183" width="220" height="22" rx="5" fill={reading === 0 ? "#14532d" : "#450a0a"} style={{ transition: "fill 0.5s" }} />
      <text x="150" y="198" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill={reading === 0 ? "#86efac" : "#fca5a5"} style={{ transition: "fill 0.5s" }}>{reading === 0 ? "✓ SAFE — ZERO ENERGY VERIFIED" : "⚠ ENERGY PRESENT — DO NOT WORK"}</text>
    </svg>
  );
}

function LOTOScene({ step, isCompleted }: { step: number; isCompleted: boolean }) {
  const scenes = [
    <Step0Scene isCompleted={isCompleted} />,
    <Step1Scene isCompleted={isCompleted} />,
    <Step2Scene isCompleted={isCompleted} />,
    <Step3Scene isCompleted={isCompleted} />,
    <Step4Scene isCompleted={isCompleted} />,
    <Step5Scene isCompleted={isCompleted} />,
  ];
  return (
    <AnimatePresence mode="wait">
      <motion.div key={step} initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.35 }} className="w-full h-full flex items-center justify-center p-2">
        {scenes[step]}
      </motion.div>
    </AnimatePresence>
  );
}

// === Main Component ===
export function LOTOSimulator({ config }: { config?: UserConfig }) {
  const [activeTab, setActiveTab] = useState<TabId>("procedure");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [learnCard, setLearnCard] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const allDone = completedSteps.size >= LOTO_STEPS.length;
  const step = LOTO_STEPS[currentStep];
  const checkedCritical = CHECKLIST_ITEMS.filter(i => i.critical && checkedItems.has(i.id)).length;
  const totalCritical = CHECKLIST_ITEMS.filter(i => i.critical).length;
  const correctCount = Object.entries(quizAnswers).filter(([qi, ans]) => QUIZ_QUESTIONS[+qi].correct === ans).length;

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "procedure", label: "Procedure", icon: Lock },
    { id: "learn", label: "Learn", icon: BookOpen },
    { id: "checklist", label: "Checklist", icon: ClipboardList },
    { id: "quiz", label: "Quiz", icon: HelpCircle },
  ];

  function completeStep() {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < LOTO_STEPS.length - 1) setTimeout(() => setCurrentStep(s => s + 1), 380);
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2.5 px-3 pt-2.5 pb-2 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-white leading-none">LOTO Procedure Simulator</h2>
          <p className="text-[9px] md:text-[10px] text-slate-400 font-mono">Lockout / Tagout · OSHA 29 CFR 1910.147</p>
        </div>
        {allDone && activeTab === "procedure" && (
          <motion.div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/40 shrink-0" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[9px] font-black text-green-400 uppercase tracking-wide hidden sm:inline">All Steps Done!</span>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-white/10 px-1.5 gap-0.5 pt-1 bg-slate-950/95 shadow-lg">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-t-lg text-[10px] md:text-xs font-black uppercase tracking-wide border border-transparent transition-all cursor-pointer flex-1 justify-center",
              activeTab === tab.id 
                ? "bg-orange-500/25 border-orange-500/60 text-orange-300 border-b-transparent" 
                : "text-slate-400 hover:text-white hover:bg-slate-900 border-b-transparent")}>
            <tab.icon className="w-3.5 h-3.5 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* === PROCEDURE TAB === */}
          {activeTab === "procedure" && (
            <motion.div key="procedure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row h-full overflow-hidden">

              {/* Left: Steps list */}
              <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-800/80 overflow-y-auto order-2 lg:order-1 p-2 md:p-3 space-y-1.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-355 uppercase tracking-wide">Steps Progress</span>
                  <span className="text-xs font-mono font-black text-orange-400">{completedSteps.size}/{LOTO_STEPS.length} Complete</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full mb-2 overflow-hidden border border-slate-700/50">
                  <motion.div className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full"
                    animate={{ width: `${(completedSteps.size / LOTO_STEPS.length) * 100}%` }} transition={{ duration: 0.5 }} />
                </div>

                {LOTO_STEPS.map((s, i) => {
                  const isActive = i === currentStep;
                  const isDone = completedSteps.has(i);
                  return (
                    <motion.button key={i} onClick={() => setCurrentStep(i)} whileTap={{ scale: 0.98 }}
                      className={cn("w-full flex items-start gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer",
                        isActive 
                          ? s.bgClass 
                          : isDone 
                            ? "bg-green-500/15 border-green-500/40 text-green-300" 
                            : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850")}>
                      <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                        isDone ? "bg-green-500 border-green-500" : "border-slate-650 bg-slate-800")}
                        style={isActive && !isDone ? { borderColor: s.color, backgroundColor: s.color + "22" } : {}}>
                        {isDone ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <span className="text-xs font-black" style={isActive ? { color: s.color } : { color: "#94a3b8" }}>{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className={cn("text-xs md:text-sm font-black uppercase tracking-wide", isDone ? "text-green-300" : "text-slate-200")}
                            style={isActive && !isDone ? { color: s.color } : {}}>{s.title}</span>
                          <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wide border",
                            s.hazardLevel === "Critical" ? "text-red-350 border-red-500/50 bg-red-500/20" : s.hazardLevel === "High" ? "text-amber-350 border-amber-500/50 bg-amber-500/20" : "text-green-350 border-green-500/50 bg-green-500/20")}>
                            {s.hazardLevel}
                          </span>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-350 leading-relaxed line-clamp-2">{s.desc}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{s.regulation}</p>
                      </div>
                    </motion.button>
                  );
                })}

                <div className="flex gap-2 pt-1">
                  {!allDone ? (
                    <motion.button onClick={completeStep} whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
                      className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider cursor-pointer border transition-all shadow-md", step.bgClass, step.textClass)}>
                      <CheckCircle className="w-4 h-4" />
                      Complete Step {currentStep + 1}
                    </motion.button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-black text-sm uppercase tracking-wider bg-green-500/25 border border-green-500/60 text-green-300 shadow-md">
                      <Award className="w-4 h-4" /> LOTO Complete!
                    </div>
                  )}
                  <button onClick={() => { setCurrentStep(0); setCompletedSteps(new Set()); }}
                    className="px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-500 cursor-pointer text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-sm">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </div>
              </div>

              {/* Right: Animation panel */}
              <div className="w-full lg:w-1/2 order-1 lg:order-2 flex flex-col p-2.5 md:p-3 gap-2 overflow-hidden bg-slate-950/65">
                {/* SVG animation */}
                <div className="flex-1 min-h-0 bg-slate-950 border border-slate-800 rounded-xl relative flex items-center justify-center overflow-hidden" style={{ minHeight: 130 }}>
                  <div className="absolute top-2 left-2 z-10">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                      style={{ color: step.color, borderColor: step.color + "70", backgroundColor: step.color + "20" }}>
                      Step {currentStep + 1} — {step.shortTitle}
                    </span>
                  </div>
                  <LOTOScene step={currentStep} isCompleted={completedSteps.has(currentStep)} />
                </div>

                {/* Key points grid */}
                <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 shrink-0 shadow-inner">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-wide mb-1.5" style={{ color: step.color }}>Key Actions:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {step.keyPoints.map((pt, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: step.color }} />
                        <span className="text-[10px] md:text-xs text-slate-200 leading-snug">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-[9px] md:text-[10px] text-red-200 font-bold leading-snug">{step.warning}</span>
                </div>

                {/* Navigation dots + prev/next */}
                <div className="flex items-center justify-between shrink-0">
                  <button disabled={currentStep === 0} onClick={() => setCurrentStep(s => s - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all uppercase shadow-sm">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <div className="flex gap-1.5">
                    {LOTO_STEPS.map((_, i) => (
                      <button key={i} onClick={() => setCurrentStep(i)} style={{ backgroundColor: completedSteps.has(i) ? "#22c55e" : i === currentStep ? "#f97316" : "#475569" }}
                        className={cn("rounded-full transition-all cursor-pointer hover:opacity-90 hover:scale-110", i === currentStep ? "w-5 h-2.5" : "w-2.5 h-2.5")} />
                    ))}
                  </div>
                  <button disabled={currentStep === LOTO_STEPS.length - 1} onClick={() => setCurrentStep(s => s + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all uppercase shadow-sm">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* === LEARN TAB === */}
          {activeTab === "learn" && (
            <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row h-full overflow-hidden p-2.5 md:p-3 gap-3 bg-slate-950/60">
              
              {/* Left Column: Interactive Knowledge Cards */}
              <div className="w-full lg:w-1/2 flex flex-col gap-2.5 overflow-hidden justify-between h-full">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wide">Knowledge Cards ({learnCard + 1}/{LEARN_CARDS.length})</span>
                  <div className="flex gap-1">{LEARN_CARDS.map((c, i) => (
                    <button key={i} onClick={() => setLearnCard(i)} className="rounded-full transition-all cursor-pointer hover:scale-110" style={{ width: i === learnCard ? 16 : 8, height: 8, backgroundColor: i === learnCard ? c.color : "#475569" }} />
                  ))}</div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div key={learnCard} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                      className="flex-1 rounded-xl border p-3 flex flex-col justify-between"
                      style={{ borderColor: LEARN_CARDS[learnCard].color + "70", backgroundColor: LEARN_CARDS[learnCard].color + "12" }}>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: LEARN_CARDS[learnCard].color + "25", border: `1.5px solid ${LEARN_CARDS[learnCard].color}60` }}>
                            {React.createElement(LEARN_CARDS[learnCard].icon, { className: "w-4.5 h-4.5", style: { color: LEARN_CARDS[learnCard].color } })}
                          </div>
                          <h3 className="text-xs md:text-sm font-black uppercase tracking-wide text-white">{LEARN_CARDS[learnCard].title}</h3>
                        </div>
                        <p className="text-[11px] md:text-xs text-slate-200 leading-relaxed">{LEARN_CARDS[learnCard].content}</p>
                      </div>

                      <div className="pt-2 border-t border-white/10 mt-2 shrink-0">
                        <p className="text-sm md:text-base font-black leading-tight" style={{ color: LEARN_CARDS[learnCard].color }}>{LEARN_CARDS[learnCard].stat}</p>
                        <p className="text-[9px] text-slate-400 font-mono">{LEARN_CARDS[learnCard].statSub}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button disabled={learnCard === 0} onClick={() => setLearnCard(c => c - 1)} 
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold border border-slate-650 bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 hover:text-white cursor-pointer transition-all uppercase text-slate-200 shadow-sm">
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <button disabled={learnCard === LEARN_CARDS.length - 1} onClick={() => setLearnCard(c => c + 1)} 
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold border border-slate-650 bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 hover:text-white cursor-pointer transition-all uppercase text-slate-200 shadow-sm">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Statistics & Energy Types list */}
              <div className="w-full lg:w-1/2 flex flex-col gap-2.5 overflow-y-auto pr-1">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-1.5 shrink-0">
                  {[
                    { val: "120+", label: "Deaths/yr w/o LOTO", color: "#ef4444" },
                    { val: "50k+", label: "Injuries saved/yr", color: "#22c55e" },
                    { val: "6", label: "Energy types", color: "#8b5cf6" },
                    { val: "$15k+", label: "Avg OSHA fine", color: "#f97316" },
                  ].map((s, i) => (
                    <div key={i} className="p-2 rounded-xl bg-slate-900 border border-slate-750 text-center shadow-sm">
                      <p className="text-sm md:text-base font-black" style={{ color: s.color }}>{s.val}</p>
                      <p className="text-[8px] md:text-[9px] text-slate-300 font-bold uppercase tracking-wide leading-tight mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Energy types */}
                <div className="flex-1 flex flex-col min-h-[160px]">
                  <p className="text-xs font-black text-slate-200 uppercase tracking-wide mb-1.5 border-l-2 border-amber-500 pl-2 shrink-0">All 6 Hazardous Energy Types</p>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-1.5 flex-1 min-h-0">
                    {[
                      { type: "Electrical", emoji: "⚡", color: "#f59e0b", ex: "Wires, motors, caps" },
                      { type: "Pneumatic", emoji: "💨", color: "#06b6d4", ex: "Compressed air lines" },
                      { type: "Hydraulic", emoji: "💧", color: "#3b82f6", ex: "Oil-pressured lines" },
                      { type: "Mechanical", emoji: "⚙️", color: "#8b5cf6", ex: "Springs, flywheels, gravity" },
                      { type: "Thermal", emoji: "🔥", color: "#ef4444", ex: "Steam, hot surfaces" },
                      { type: "Chemical", emoji: "☣️", color: "#22c55e", ex: "Gases, chemicals" },
                    ].map((e, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-750 bg-slate-900 shadow-sm">
                        <span className="text-lg md:text-xl shrink-0">{e.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-[10px] md:text-xs font-black text-white leading-none mb-0.5">{e.type}</p>
                          <p className="text-[8px] md:text-[9px] text-slate-400 leading-tight truncate">{e.ex}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* === CHECKLIST TAB === */}
          {activeTab === "checklist" && (
            <motion.div key="checklist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-2.5 md:p-3.5 space-y-2">
              <div className={cn("flex items-center justify-between p-2 rounded-xl border transition-all shadow-sm", checkedCritical === totalCritical ? "bg-green-500/20 border-green-500/40" : "bg-amber-500/20 border-amber-500/40")}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", checkedCritical === totalCritical ? "bg-green-500" : "bg-amber-500")} />
                  <span className={cn("text-xs md:text-sm font-black uppercase tracking-wide", checkedCritical === totalCritical ? "text-green-300" : "text-amber-300")}>
                    {checkedCritical === totalCritical ? "All Critical Items Complete!" : `${totalCritical - checkedCritical} Critical Items Remaining`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-slate-200">{checkedItems.size}/{CHECKLIST_ITEMS.length}</span>
                  <button onClick={() => setCheckedItems(new Set())} className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer transition-all"><RotateCcw className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-green-500" animate={{ width: `${(checkedItems.size / CHECKLIST_ITEMS.length) * 100}%` }} />
              </div>

              {["Before Start", "Shutdown", "Isolation", "Lock & Tag", "Energy Release", "Verification"].map(cat => (
                <div key={cat}>
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-wide text-slate-350 mb-1 border-l-2 border-orange-500/60 pl-2">{cat}</p>
                  <div className="space-y-1">
                    {CHECKLIST_ITEMS.filter(i => i.category === cat).map(item => {
                      const checked = checkedItems.has(item.id);
                      return (
                        <motion.button key={item.id} whileTap={{ scale: 0.98 }}
                          onClick={() => setCheckedItems(prev => { const n = new Set(prev); checked ? n.delete(item.id) : n.add(item.id); return n; })}
                          className={cn("w-full flex items-center gap-2.5 p-1.5 px-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-sm",
                            checked ? "bg-green-500/15 border-green-500/40" : "bg-slate-900 border-slate-800 hover:border-slate-750 hover:bg-slate-850")}>
                          <div className={cn("w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all", checked ? "bg-green-500 border-green-500" : "border-slate-600 bg-slate-800")}>
                            {checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white text-[10px] font-black">✓</motion.span>}
                          </div>
                          <span className={cn("text-xs leading-snug flex-1", checked ? "text-slate-400 line-through" : "text-slate-100")}>{item.text}</span>
                          {item.critical && !checked && <span className="shrink-0 text-[8px] px-1.5 py-0.5 rounded font-black uppercase bg-red-500/20 border border-red-500/45 text-red-300">Critical</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* === QUIZ TAB === */}
          {activeTab === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-2.5 md:p-3.5">
              {quizSubmitted ? (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <div className={cn("p-4 rounded-xl border text-center shadow-md", correctCount >= 4 ? "bg-green-500/20 border-green-500/45" : "bg-amber-500/20 border-amber-500/45")}>
                    <div className="text-4xl mb-1">{correctCount >= 4 ? "🏆" : "📘"}</div>
                    <p className={cn("text-2xl font-black", correctCount >= 4 ? "text-green-300" : "text-amber-300")}>{correctCount}/{QUIZ_QUESTIONS.length}</p>
                    <p className="text-xs font-bold text-slate-200 mt-1">{correctCount >= 4 ? "Excellent! You understand LOTO." : "Review the procedure and try again."}</p>
                  </div>
                  {QUIZ_QUESTIONS.map((q, qi) => {
                    const isCorrect = quizAnswers[qi] === q.correct;
                    return (
                      <div key={qi} className={cn("p-2.5 rounded-xl border shadow-sm", isCorrect ? "bg-green-500/15 border-green-500/40" : "bg-red-500/15 border-red-500/40")}>
                        <div className="flex items-start gap-2 mb-1">
                          {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                          <span className="text-[11px] md:text-xs font-bold text-slate-200">{q.question}</span>
                        </div>
                        <p className="text-[10px] pl-5.5 text-slate-400 leading-relaxed">{q.explanation}</p>
                      </div>
                    );
                  })}
                  <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizIndex(0); setShowExplanation(false); }}
                    className="w-full py-2 rounded-xl bg-orange-500/25 border border-orange-500/60 text-orange-300 font-black text-xs md:text-sm uppercase tracking-wider cursor-pointer hover:bg-orange-500/35 transition-all flex items-center justify-center gap-1.5 shadow-md">
                    <RotateCcw className="w-3.5 h-3.5" /> Try Again
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-350 uppercase tracking-wide">Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}</span>
                    <div className="flex gap-1">{QUIZ_QUESTIONS.map((_, i) => (
                      <div key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === quizIndex ? 18 : quizAnswers[i] !== undefined ? 12 : 8, backgroundColor: quizAnswers[i] !== undefined ? (quizAnswers[i] === QUIZ_QUESTIONS[i].correct ? "#22c55e" : "#ef4444") : i === quizIndex ? "#f97316" : "#475569" }} />
                    ))}</div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={quizIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                        <p className="text-xs md:text-sm font-bold text-white leading-relaxed">{QUIZ_QUESTIONS[quizIndex].question}</p>
                      </div>
                      <div className="space-y-1.5">
                        {QUIZ_QUESTIONS[quizIndex].options.map((opt, oi) => {
                          const answered = quizAnswers[quizIndex] !== undefined;
                          const isCorrectOpt = oi === QUIZ_QUESTIONS[quizIndex].correct;
                          const isSelected = quizAnswers[quizIndex] === oi;
                          return (
                            <motion.button key={oi} whileTap={{ scale: 0.99 }}
                              onClick={() => { if (!answered) { setQuizAnswers(p => ({ ...p, [quizIndex]: oi })); setShowExplanation(true); } }}
                              className={cn("w-full flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer text-xs",
                                answered 
                                  ? (isCorrectOpt 
                                      ? "bg-green-500/20 border-green-500/50 text-green-200 font-bold" 
                                      : isSelected 
                                        ? "bg-red-500/20 border-red-500/50 text-red-200 font-medium" 
                                        : "bg-slate-900/50 border-slate-800 text-slate-500") 
                                  : "bg-slate-900 border border-slate-750 text-slate-200 hover:border-orange-500/60 hover:bg-orange-500/10 hover:text-white")}>
                              <span className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-black shrink-0 transition-all",
                                answered 
                                  ? (isCorrectOpt 
                                      ? "border-green-500 bg-green-500 text-white" 
                                      : isSelected 
                                        ? "border-red-500 bg-red-500 text-white" 
                                        : "border-slate-700 text-slate-550") 
                                  : "border-slate-650 text-slate-400")}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </motion.button>
                          );
                        })}
                      </div>
                      <AnimatePresence>
                        {showExplanation && quizAnswers[quizIndex] !== undefined && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className={cn("p-2.5 rounded-xl border flex items-start gap-2 shadow-sm", quizAnswers[quizIndex] === QUIZ_QUESTIONS[quizIndex].correct ? "bg-green-500/15 border-green-500/40" : "bg-amber-500/15 border-amber-500/40")}>
                            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] md:text-xs text-slate-200 leading-relaxed">{QUIZ_QUESTIONS[quizIndex].explanation}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {quizAnswers[quizIndex] !== undefined && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                          {quizIndex < QUIZ_QUESTIONS.length - 1 ? (
                            <button onClick={() => { setQuizIndex(i => i + 1); setShowExplanation(false); }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-500/25 border border-orange-500/60 text-orange-300 font-black text-xs md:text-sm uppercase tracking-wider cursor-pointer hover:bg-orange-500/35 transition-all shadow-md">
                              Next Question <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => setQuizSubmitted(true)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/25 border border-green-500/60 text-green-300 font-black text-xs md:text-sm uppercase tracking-wider cursor-pointer hover:bg-green-500/35 transition-all shadow-md">
                              <Award className="w-3.5 h-3.5" /> View Results
                            </button>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
