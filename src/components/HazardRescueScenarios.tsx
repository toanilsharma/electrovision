import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  ArrowRight, 
  Info, 
  ChevronRight,
  Sparkles,
  HeartPulse,
  Radio,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useAudioHaptics } from './useAudioHaptics';

export interface RescueScenario {
  id: string;
  title: string;
  subtitle: string;
  voltage: string;
  standard: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  badgeName: string;
  brief: string;
  questions: {
    question: string;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
      consequenceTitle: string;
      consequenceDetail: string;
      standardRef: string;
    }[];
  }[];
}

const SCENARIOS: RescueScenario[] = [
  {
    id: 'crane_touch',
    title: 'The Fallen 33 kV Boom Crane',
    subtitle: 'High-Voltage Step & Touch Ground Potential',
    voltage: '33,000 V AC',
    standard: 'IEEE 80 / OSHA 1926.1400',
    difficulty: 'Advanced',
    badgeName: 'Faraday Shield Master',
    brief: 'A mobile crane boom has accidentally swung into a 33 kV overhead sub-transmission line at a construction site. The front outriggers and tires are smoking. The panicked operator is visible inside the cab.',
    questions: [
      {
        question: 'Stage 1: Ground crew members are shouting at the operator. What is the immediate life-critical directive to give the operator?',
        options: [
          {
            id: 'A',
            text: 'Tell the operator to climb down the metallic ladder immediately before the tires explode.',
            isCorrect: false,
            consequenceTitle: 'FATAL TOUCH POTENTIAL FLASHOVER',
            consequenceDetail: 'As the operator places hands on the metallic ladder while stepping down, the voltage difference between the crane frame (33 kV) and ground (0V) drives hundreds of amperes through their heart and limbs.',
            standardRef: 'IEEE 80 §8.2: Touch voltage V_touch can exceed human fibrillating threshold by 4,000% under ungrounded boom contact.'
          },
          {
            id: 'B',
            text: 'Instruct the operator to STAY IN THE CAB. Order all ground personnel to maintain at least 15m (50ft) exclusion perimeter until the utility grid operator confirms de-energization.',
            isCorrect: true,
            consequenceTitle: 'SAFE FARADAY ENCLOSURE MAINTAINED',
            consequenceDetail: 'The metallic cab acts as an equipotential Faraday shield; as long as the operator stays inside and touches no ground path, zero potential difference exists across their body.',
            standardRef: 'OSHA 1926.1400 / IEEE 80: Cab operator remains at equipotential floating reference with negligible current pass-through.'
          },
          {
            id: 'C',
            text: 'Have the ground supervisor run up and kick the outrigger away with rubber work boots.',
            isCorrect: false,
            consequenceTitle: 'FATAL STEP POTENTIAL GROUND GRADIENT',
            consequenceDetail: 'Fault current dissipating radially into the earth creates deadly voltage gradients between feet. Standard footwear flashes over instantly above 600V.',
            standardRef: 'IEEE 80 §8.1: Step voltage V_step across a 1-meter human stride in moist soil exceeds 12,000V.'
          }
        ]
      },
      {
        question: 'Stage 2: The hydraulic fluid ignites and the crane cab is enveloped in flames. The operator MUST evacuate immediately to survive. How must they dismount?',
        options: [
          {
            id: 'A',
            text: 'Step down gingerly, holding the exterior handrail with one hand while lowering one foot to the soil.',
            isCorrect: false,
            consequenceTitle: 'INSTANT ELECTROCUTION ON STEP-DOWN',
            consequenceDetail: 'Simultaneously bridging the energized metal chassis and the soil completes a dead short-circuit through the operator body.',
            standardRef: 'OSHA 29 CFR 1910.269: Bridging energized machine frame and earth results in instantaneous ventricular fibrillation.'
          },
          {
            id: 'B',
            text: 'JUMP completely clear without touching machine and ground at the same time. Land with both feet tightly together, then bunny-hop or shuffle feet touching without lifting shoes.',
            isCorrect: true,
            consequenceTitle: 'PERFECT EVACUATION EXECUTION',
            consequenceDetail: 'Jumping clear ensures zero bridging between crane and ground. Landing with feet together and shuffling prevents voltage differential between feet.',
            standardRef: 'IEEE 80 / CIGRE Technical Brochure 749: Zero stride separation eliminates step potential delta (ΔV = 0).'
          },
          {
            id: 'C',
            text: 'Jump clear and sprint away with wide strides as fast as humanly possible.',
            isCorrect: false,
            consequenceTitle: 'STEP POTENTIAL COLLAPSE',
            consequenceDetail: 'Taking wide running strides maximizes the radial distance between feet in the earth dissipation bowl, inducing thousands of volts across the groin.',
            standardRef: 'IEEE 80: Stride length s > 0.8m in high-resistivity earth causes fatal leg-to-leg shock.'
          }
        ]
      }
    ]
  },
  {
    id: 'flooded_basement',
    title: 'Flooded Basement Sump Pump Hazard',
    subtitle: 'Secondary Electrocution & Water Conductance',
    voltage: '415 V AC 3-Phase',
    standard: 'IEC 60479-1 / IEC 60364-7-702',
    difficulty: 'Intermediate',
    badgeName: 'Substation Guardian',
    brief: 'During monsoon basement flooding (40 cm water depth), a maintenance technician collapsed face down while working near an industrial 415V submersible pump. The pump motor casing has suffered water ingress.',
    questions: [
      {
        question: 'Stage 1: A co-worker arrives and spots the fallen technician in the water. What is the required first response?',
        options: [
          {
            id: 'A',
            text: 'Wade into the water quickly and drag the technician out by their jacket collar.',
            isCorrect: false,
            consequenceTitle: 'SECONDARY VICTIM ELECTROCUTION',
            consequenceDetail: 'Standing water with dissolved minerals conducts fault current throughout the entire basement floor. Entering creates a current path through the rescuer legs, collapsing both workers.',
            standardRef: 'IEC 60479-1: Wet submerged human body impedance drops below 500 ohms; lethal currents pass easily through water.'
          },
          {
            id: 'B',
            text: 'Immediately locate the upstream Main Switchboard (MSB) in the dry riser, emergency-trip the main breaker, lock out / tag out (LOTO), and verify zero energy before entering.',
            isCorrect: true,
            consequenceTitle: 'SOURCE ISOLATION VERIFIED',
            consequenceDetail: 'Eliminating the electrical source is the mandatory prerequisite before entering any flooded environment with fallen personnel.',
            standardRef: 'NFPA 70E Article 120 / OSHA 1910.147: Hazardous energy must be de-energized and locked out prior to entry.'
          },
          {
            id: 'C',
            text: 'Throw a heavy nylon tow-rope to loop around their boots and pull from the dry doorway.',
            isCorrect: false,
            consequenceTitle: 'HIGH RESISTANCE LEAKAGE & DELAYED CPR',
            consequenceDetail: 'Basement dirty water rapidly soaks standard nylon/cotton rope, creating an unexpected conductive bridge back to the rescuer.',
            standardRef: 'ASTM F711: Only certified non-conductive dielectric fiberglass rescue hooks are rated for energized rescue.'
          }
        ]
      },
      {
        question: 'Stage 2: The power is verified de-energized (0.0 V with calibrated multimeter). The victim is retrieved to dry ground and is unresponsive with no normal breathing. What is the immediate medical protocol?',
        options: [
          {
            id: 'A',
            text: 'Give them water and let them rest in recovery position for 15 minutes.',
            isCorrect: false,
            consequenceTitle: 'ANOXIC BRAIN DAMAGE',
            consequenceDetail: 'Electric shock victims experiencing ventricular fibrillation or respiratory paralysis will suffer irreversible brain death within 4–6 minutes without immediate CPR and defibrillation.',
            standardRef: 'AHA / ERC Guidelines: Ventricular fibrillation requires immediate chest compressions and AED within 3 minutes.'
          },
          {
            id: 'B',
            text: 'Immediately direct someone to call EMS (911/112), fetch the automated external defibrillator (AED), and commence high-quality chest compressions (100–120 bpm, 5–6 cm depth).',
            isCorrect: true,
            consequenceTitle: 'CRITICAL LIFE SAVED',
            consequenceDetail: 'Immediate CPR maintains cerebral perfusion while the AED analyzes cardiac rhythm to deliver a biphasic shock for ventricular fibrillation.',
            standardRef: 'IEC 60479-1 / ILCOR Guidelines: High survival rate when defibrillation occurs within the initial 180 seconds.'
          }
        ]
      }
    ]
  },
  {
    id: 'drawout_breaker',
    title: '415V Switchgear Draw-Out Breaker Racked Under Load',
    subtitle: 'Arc Flash Overpressure & NFPA 70E',
    voltage: '415 V AC / 1600A ACB',
    standard: 'NFPA 70E / IEEE 1584-2018',
    difficulty: 'Expert',
    badgeName: 'Arc Flash Commander',
    brief: 'A technician is preparing to rack out a 1600A draw-out air circuit breaker (ACB) from its switchgear cubicle. Downstream motors are running and drawing 850A continuous load. The mechanical interlock appears stiff.',
    questions: [
      {
        question: 'What is the mandatory operational safety rule before inserting the racking handle crank?',
        options: [
          {
            id: 'A',
            text: 'Push the manual TRIP button on the breaker faceplate, visually verify main contact flag indicates "OPEN / DISCHARGED", and verify zero current on the digital power analyzer.',
            isCorrect: true,
            consequenceTitle: 'ZERO ENERGY STATE VERIFIED',
            consequenceDetail: 'Breaking high load current on racking disconnect stabs will cause an immediate catastrophic three-phase bolted arc flash inside the confined cubicle.',
            standardRef: 'NFPA 70E §130.2 / IEEE 1584: Withdrawing energized load breaks finger cluster stabs, triggering explosive arc ignition.'
          },
          {
            id: 'B',
            text: 'Apply heavy force on the racking handle to quickly overcome the interlock resistance while load is active.',
            isCorrect: false,
            consequenceTitle: 'CATASTROPHIC ARC FLASH DETONATION',
            consequenceDetail: 'Forcing the interlock draws out the primary cluster stabs under 850A load. The resulting arc creates an explosive copper vapor fireball (>19,000°C), launching the switchgear doors off their hinges.',
            standardRef: 'IEEE 1584-2018: Incident energy exceeds 65 cal/cm², fatal third-degree burns and blast shrapnel.'
          },
          {
            id: 'C',
            text: 'Wear safety glasses and work fast so the contacts separate before the arc gets hot.',
            isCorrect: false,
            consequenceTitle: 'FATAL BLAST OVERPRESSURE',
            consequenceDetail: 'Arc flash ignition occurs in less than 2 milliseconds. Standard safety glasses offer zero protection against supersonic shockwaves and 20,000°C plasma.',
            standardRef: 'NFPA 70E Table 130.5(C): Racking breakers requires full Cat 4 (40 cal/cm²) PPE or remote racking robotic umbilical.'
          }
        ]
      }
    ]
  },
  {
    id: 'battery_thermal',
    title: 'Battery Room Daisy-Chain Thermal Runaway',
    subtitle: 'Contact Resistance & High-Current DC Arcing',
    voltage: '480 V DC / 500 Ah',
    standard: 'NFPA 855 / IEC 62485-2',
    difficulty: 'Intermediate',
    badgeName: 'Thermal Safety Specialist',
    brief: 'An infrared thermal camera check reveals a loose bolted bus connection glowing at 135°C on a 480V DC battery bank during rapid charging. Toxic pungent fumes and slight smoke wisps are detected.',
    questions: [
      {
        question: 'What is the correct remediation protocol for an overheating high-current DC bolted joint?',
        options: [
          {
            id: 'A',
            text: 'Take a standard steel wrench and tighten the glowing bolt immediately while charging continues.',
            isCorrect: false,
            consequenceTitle: 'DEAD DC ARC SHORT-CIRCUIT',
            consequenceDetail: 'Bridging adjacent battery terminals with an uninsulated metallic tool delivers over 15,000A DC. Unlike AC, DC has no natural zero-crossing, sustaining a ferocious non-extinguishing arc.',
            standardRef: 'NFPA 70E §320 / IEC 62485: Uninsulated tools in battery rooms cause explosive plasma flashover.'
          },
          {
            id: 'B',
            text: 'Spray water directly onto the terminal lug to rapidly cool the copper connection.',
            isCorrect: false,
            consequenceTitle: 'HYDROGEN EXPLOSION & ELECTROLYSIS',
            consequenceDetail: 'Spraying water onto 480V DC terminals causes violent electrolysis, generating explosive hydrogen gas (H₂) that ignites instantly from the arcing contact.',
            standardRef: 'NFPA 855: Water contact on exposed DC bus terminals generates lethal hydrogen accumulation.'
          },
          {
            id: 'C',
            text: 'Emergency-stop the battery inverter charger (I = 0A), isolate the DC string disconnect switch, ventilate room, don 1000V-rated insulated gloves, and use a calibrated insulated torque wrench to re-torque the joint.',
            isCorrect: true,
            consequenceTitle: 'THERMAL RUNAWAY DEFUSED',
            consequenceDetail: 'Stopping the charging current eliminates the I²R heating source instantly. Insulated tools and PPE prevent accidental short-circuits during torquing to OEM specs.',
            standardRef: 'IEC 62485-2 §7.3: DC bus connections must be torqued with insulated tools under de-energized or zero-current conditions.'
          }
        ]
      }
    ]
  },
  {
    id: 'hand_freeze_no_let_go',
    title: '230V AC Power Tool "No-Let-Go" Hand Freeze',
    subtitle: 'Forearm Flexor Muscle Tetany & Dielectric Separation',
    voltage: '230 V AC Single Phase',
    standard: 'IEC 60479-1 Zone AC-4.1 / ASTM F711',
    difficulty: 'Basic',
    badgeName: 'Rescue Crook Specialist',
    brief: 'An operator holding a metal-cased handheld electric angle grinder suffers an internal insulation fault. The 230V potential causes continuous involuntary contraction of their flexor muscles; their fingers are frozen clamped to the energized casing.',
    questions: [
      {
        question: 'Stage 1: The worker is rigid, groaning, and unable to release the tool or speak. What is your immediate physical rescue action?',
        options: [
          {
            id: 'A',
            text: 'Grab the victim’s arm or shoulder firmly with both bare hands and wrench them away from the tool.',
            isCorrect: false,
            consequenceTitle: 'SECONDARY ELECTROCUTION & TETANIC LOCK',
            consequenceDetail: 'Current transfers across skin-to-skin contact, causing instant involuntary flexor spasm in the rescuer as well. Both individuals are now trapped in the live circuit.',
            standardRef: 'IEC 60479-1: No-let-go threshold is 10–16 mA AC. Direct rescuer contact results in secondary casualty.'
          },
          {
            id: 'B',
            text: 'Immediately pull the machine supply cord plug from the wall socket (or switch off local isolator). If plug is inaccessible, use a dry, non-conductive dielectric rescue hook (shepherd\'s crook) or dry wooden broom handle to hook under their belt and wrench them free.',
            isCorrect: true,
            consequenceTitle: 'SAFE NON-CONDUCTIVE EXTRACTION',
            consequenceDetail: 'Disconnecting the plug kills the circuit instantly. Certified dielectric rescue hooks provide 100kV/foot insulation, safely breaking the physical contact without risk to the rescuer.',
            standardRef: 'ASTM F711 / OSHA 1910.269: Only non-conductive fiberglass hot-sticks or emergency isolation are approved for energized victim rescue.'
          },
          {
            id: 'C',
            text: 'Kick the power cord hard with steel-toed work boots to cut the cable.',
            isCorrect: false,
            consequenceTitle: 'ARC BLAST & FOOT FLASHOVER',
            consequenceDetail: 'Crushing an energized 230V cable against concrete with steel toes penetrates conductor insulation, triggering a dead phase-to-earth flashover directly under the rescuer’s foot.',
            standardRef: 'NFPA 70E: Mechanical severance of live cables initiates explosive arc flash.'
          }
        ]
      },
      {
        question: 'Stage 2: The victim is detached from the tool and collapses onto the floor. They are breathing normally but shaken with minor palm burns. What is the mandatory next protocol?',
        options: [
          {
            id: 'A',
            text: 'Give them a glass of water, apply ice to their palm, and let them return to work if they feel fine.',
            isCorrect: false,
            consequenceTitle: 'DELAYED VENTRICULAR ARRHYTHMIA RISK',
            consequenceDetail: 'Mains 230V shocks that cross the thoracic cavity can induce delayed ventricular fibrillation or rhabdomyolysis hours after the initial shock.',
            standardRef: 'AHA Electrical Shock Guidelines: 230V shocks require 12-lead ECG and 24-hour observation.'
          },
          {
            id: 'B',
            text: 'Place them in a comfortable recovery position, monitor airway/breathing continuously, do NOT give fluids by mouth, and transport to the emergency department for mandatory 12-lead ECG and serum creatine kinase (CK) evaluation.',
            isCorrect: true,
            consequenceTitle: 'COMPREHENSIVE CLINICAL CARE PROTOCOL',
            consequenceDetail: 'Continuous airway vigilance and emergency department referral ensures occult myocardial injury, delayed arrhythmias, or kidney-damaging myoglobinuria are caught promptly.',
            standardRef: 'ILCOR / ERC 2021: Mandatory post-electrocution medical evaluation with ECG telemetry.'
          }
        ]
      }
    ]
  }
];

interface HazardRescueScenariosProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCertificate?: (studentName: string, score: number) => void;
}

export const HazardRescueScenarios: React.FC<HazardRescueScenariosProps> = ({
  isOpen,
  onClose,
  onOpenCertificate
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('crane_touch');
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [completedScenarios, setCompletedScenarios] = useState<Record<string, boolean>>({});
  const [scenarioScores, setScenarioScores] = useState<Record<string, number>>({});

  const { playArcBlast, playBreakerTripSound } = useAudioHaptics();

  const currentScenario = SCENARIOS.find(s => s.id === activeScenarioId) || SCENARIOS[0];
  const currentQuestion = currentScenario.questions[questionIndex] || currentScenario.questions[0];

  const selectedOption = currentQuestion.options.find(o => o.id === selectedOptionId);

  const handleSelectOption = (option: typeof currentQuestion.options[0]) => {
    if (selectedOptionId !== null) return; // already answered
    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      playBreakerTripSound();
    } else {
      playArcBlast();
    }
  };

  const handleNextStep = () => {
    if (!selectedOption) return;

    if (selectedOption.isCorrect) {
      // Check if there are more questions in this scenario
      if (questionIndex + 1 < currentScenario.questions.length) {
        setQuestionIndex(prev => prev + 1);
        setSelectedOptionId(null);
      } else {
        // Completed this scenario!
        setCompletedScenarios(prev => ({ ...prev, [currentScenario.id]: true }));
        setScenarioScores(prev => ({ ...prev, [currentScenario.id]: 100 }));
      }
    } else {
      // Reset this question to retry
      setSelectedOptionId(null);
    }
  };

  const handleSwitchScenario = (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    setQuestionIndex(0);
    setSelectedOptionId(null);
  };

  const totalCompleted = Object.values(completedScenarios).filter(Boolean).length;
  const isAllCompleted = totalCompleted === SCENARIOS.length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-5xl bg-slate-950 border-2 border-cyan-500/60 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-slate-100 my-auto max-h-[95vh]"
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black uppercase tracking-widest text-white">
                    HAZARD SPOTTER & RESCUE INCIDENTS
                  </span>
                  <span className="px-2 py-0.5 bg-cyan-600/90 text-white rounded text-[10px] font-black tracking-wider uppercase">
                    INTERACTIVE TRIAGE
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>REAL-WORLD HIGH VOLTAGE SCENARIOS</span>
                  <span>•</span>
                  <span className="text-cyan-300 font-bold">
                    COMPLETED: {totalCompleted} OF {SCENARIOS.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAllCompleted && (
                <button
                  onClick={() => onOpenCertificate?.('Certified Safety Responder', 100)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 cursor-pointer transition-all active:scale-95"
                >
                  <Award className="w-4 h-4" /> CLAIM CERTIFICATE
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 transition-colors border border-slate-700 hover:border-rose-500/60 cursor-pointer"
                title="Close Scenarios"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scenario Selector Ribbon */}
          <div className="flex overflow-x-auto gap-2 p-2 bg-slate-900/70 border-b border-slate-800 shrink-0">
            {SCENARIOS.map((s, idx) => {
              const isCurrent = s.id === activeScenarioId;
              const isDone = completedScenarios[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => handleSwitchScenario(s.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer text-left",
                    isCurrent 
                      ? "bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]" 
                      : isDone
                      ? "bg-slate-900 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-slate-300 shrink-0">
                      {idx + 1}
                    </span>
                  )}
                  <div>
                    <div className="truncate max-w-[140px] sm:max-w-[180px]">{s.title}</div>
                    <div className="text-[9px] text-slate-400 font-normal">{s.voltage}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Scenario Main Viewport */}
          <div className="p-4 overflow-y-auto flex flex-col gap-4 flex-1">
            {/* Scenario Header Card */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-cyan-400">{currentScenario.standard}</span>
                  <span className="px-2 py-0.2 bg-slate-800 text-slate-300 text-[9.5px] rounded font-bold uppercase">
                    Level: {currentScenario.difficulty}
                  </span>
                  <span className="px-2 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9.5px] rounded font-bold uppercase flex items-center gap-1">
                    <Award className="w-3 h-3" /> Badge: {currentScenario.badgeName}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white mt-1">
                  {currentScenario.title}
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {currentScenario.brief}
                </p>
              </div>
            </div>

            {/* Question Stage Box */}
            <div className="p-4 bg-slate-900 border border-slate-750 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-300 border-b border-slate-800 pb-2">
                <span className="uppercase tracking-wider">
                  Incident Decision Step {questionIndex + 1} of {currentScenario.questions.length}
                </span>
                <span className="text-slate-400">
                  {completedScenarios[currentScenario.id] ? "SCENARIO MASTERED (+100 PTS)" : "ACTIVE INCIDENT"}
                </span>
              </div>

              <div className="text-sm sm:text-base font-bold text-white leading-snug">
                {currentQuestion.question}
              </div>

              {/* Multiple Choice Option Buttons */}
              <div className="flex flex-col gap-2.5 mt-2">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  const isAnswered = selectedOptionId !== null;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(option)}
                      disabled={isAnswered}
                      className={cn(
                        "p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer",
                        !isAnswered && "bg-slate-950/80 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 text-slate-200",
                        isAnswered && isSelected && option.isCorrect && "bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
                        isAnswered && isSelected && !option.isCorrect && "bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
                        isAnswered && !isSelected && "opacity-40 border-slate-800 bg-slate-950 text-slate-500 cursor-not-allowed"
                      )}
                    >
                      <span className={cn(
                        "w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 mt-0.5",
                        isSelected && option.isCorrect ? "bg-emerald-500 text-slate-950" :
                        isSelected && !option.isCorrect ? "bg-red-500 text-white" :
                        "bg-slate-800 text-slate-300"
                      )}>
                        {option.id}
                      </span>
                      <span className="leading-relaxed flex-1">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* After-Action Debrief Feedback Banner */}
              {selectedOption && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-2 p-3.5 rounded-xl border flex flex-col gap-2",
                    selectedOption.isCorrect 
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-100" 
                      : "bg-red-950/80 border-red-500 text-red-100"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-xs sm:text-sm uppercase tracking-wider">
                      {selectedOption.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 animate-bounce" />
                      )}
                      <span>{selectedOption.consequenceTitle}</span>
                    </div>

                    <button
                      onClick={handleNextStep}
                      className={cn(
                        "px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95",
                        selectedOption.isCorrect 
                          ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30" 
                          : "bg-red-500 hover:bg-red-400 text-white shadow-red-500/30"
                      )}
                    >
                      {selectedOption.isCorrect ? (
                        <>CONTINUE <ArrowRight className="w-3.5 h-3.5" /></>
                      ) : (
                        <>RETRY DECISION <RotateCcw className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>

                  <div className="text-xs leading-relaxed text-slate-200">
                    {selectedOption.consequenceDetail}
                  </div>

                  <div className="text-[10px] text-amber-300 font-bold border-t border-slate-800/80 pt-1.5">
                    Standard Citation: {selectedOption.standardRef}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
