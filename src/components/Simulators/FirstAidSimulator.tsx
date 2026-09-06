import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HeartPulse, Zap, AlertTriangle, CheckCircle2, ChevronRight,
  ChevronLeft, RotateCcw, Shield, Activity, Brain, Thermometer,
  PhoneCall, Eye, Wind, Hand, Radio, BookOpen, Target,
  Volume2, VolumeX, Sparkles, Flame, Gauge, Layers, Droplets,
  Keyboard, Award, ShieldCheck
} from 'lucide-react';
import { UserConfig } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { triggerHaptic } from '@/src/utils/haptics';
import { useAudioHaptics } from '../useAudioHaptics';
import {
  calculateChestResistance,
  calculateRecoilDepth,
  stepHemodynamics,
  INITIAL_HEMODYNAMICS,
  HemodynamicState,
  calculateBTEWaveform,
  calculateAMSA,
  calculateElectricalBurn,
  ElectricalBurnAssessment,
  BTEWaveformResult,
  AMSAAssessment
} from '@/src/utils/cprPhysics';
import { ThoraxCutawayView } from './ThoraxCutawayView';
import { AedPadEngine } from './AedPadEngine';
import { AedVectorResult } from '@/src/utils/aedVector';
import { BVMVentilationEngine } from './BVMVentilationEngine';
import { ProceduralECGMonitor } from './ProceduralECGMonitor';
import { resuscitationCoach } from '@/src/utils/resuscitationAudioCoach';
import { GuitarHeroRhythmBar } from './GuitarHeroRhythmBar';
import { PatientDemographic, DEMOGRAPHIC_PRESETS } from '@/src/utils/demographicPhysics';
import { ResuscitationExamModal } from './ResuscitationExamModal';
import { HazardRescueScenarios } from '../HazardRescueScenarios';
import { SafetyCertificateModal } from '../SafetyCertificateModal';
import { ExamScorecard } from '@/src/utils/cprExamTelemetry';
import { ProtocolVisualEngine } from './ProtocolVisualEngine';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'protocol' | 'cpr' | 'exam' | 'scenarios' | 'triage' | 'quiz';

// ─── Emergency Protocol Data ──────────────────────────────────────────────────
const PROTOCOL_STEPS = [
  {
    id: 1,
    icon: 'Eye',
    color: 'text-red-400',
    borderColor: 'border-red-500/60',
    bgColor: 'bg-red-500/10',
    title: 'Scene Safety — DO NOT TOUCH',
    standard: 'IEC 60364-4-41 / ILCOR 2020',
    urgency: 'CRITICAL',
    instruction: 'Assess the scene before approaching. Look for live cables, sparking equipment, wet floors, or energised panels. If the victim is still in contact with a live source — DO NOT TOUCH THEM. You will complete the circuit.',
    actions: [
      'Shout "DANGER — ELECTRICAL HAZARD!" to warn bystanders',
      'Scan for the power source from a safe distance',
      'Look for smoke, arcing, or glowing conductors',
      'Do NOT enter the hazard zone until power is confirmed OFF',
    ],
    fatal_mistake: 'Grabbing the victim while power is still on will electrocute you too.',
    scene: 'danger',
  },
  {
    id: 2,
    icon: 'Zap',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/60',
    bgColor: 'bg-orange-500/10',
    title: 'Isolate the Power Source',
    standard: 'IEC 60364-4-41 / LOTO OSHA 29 CFR 1910.147',
    urgency: 'CRITICAL',
    instruction: 'Turn off the power at the nearest isolator, switchboard, or breaker. If you cannot reach it, use a dry wooden pole or insulated hook to move the conductor away from the victim. Never use metal or wet objects.',
    actions: [
      'Turn off the mains switch, isolator, or circuit breaker',
      'Use a dry wooden stick or rubber-handled tool if direct access is blocked',
      'Confirm isolation with a voltage tester before approaching',
      'Establish LOTO (Lockout/Tagout) if re-energisation risk exists',
    ],
    fatal_mistake: 'Using a metal rod or wet cloth to move the conductor will electrocute you.',
    scene: 'isolate',
  },
  {
    id: 3,
    icon: 'PhoneCall',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/60',
    bgColor: 'bg-yellow-500/10',
    title: 'Call Emergency Services',
    standard: 'AHA BLS 2024 / ERC 2021',
    urgency: 'IMMEDIATE',
    instruction: 'Call emergency services immediately. Give your exact location, describe the incident as an electrical injury, state whether the victim is conscious and breathing. Send someone to meet and guide the ambulance.',
    actions: [
      'Dial emergency services (911 / 999 / 112 / local number)',
      'State: "Electrical shock victim, unresponsive, not breathing"',
      'Give GPS location or site address clearly',
      'Do NOT hang up — follow the operator\'s instructions',
      'Dispatch a colleague to the site entrance to guide paramedics',
    ],
    fatal_mistake: 'Delaying the call to attempt CPR alone without notifying emergency services reduces survival rate.',
    scene: 'call',
  },
  {
    id: 4,
    icon: 'Brain',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/60',
    bgColor: 'bg-purple-500/10',
    title: 'Assess Consciousness',
    standard: 'ILCOR 2020 / AHA BLS 2024',
    urgency: 'IMMEDIATE',
    instruction: 'Once the scene is safe and power is off, approach the victim. Shout their name loudly, tap their shoulders firmly. Check for responsiveness. If no response, proceed to breathing assessment immediately.',
    actions: [
      'Shout loudly: "Can you hear me? Open your eyes!"',
      'Tap both shoulders firmly (sternal rub if trained)',
      'No response = treat as unconscious',
      'Do not shake the victim — risk of spinal injury from the fall',
    ],
    fatal_mistake: 'Moving an unconscious victim without neck control risks spinal cord injury from the fall impact.',
    scene: 'assess',
  },
  {
    id: 5,
    icon: 'Wind',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/60',
    bgColor: 'bg-sky-500/10',
    title: 'Check Airway & Breathing',
    standard: 'ERC 2021 / ILCOR 2020',
    urgency: 'CRITICAL',
    instruction: 'Tilt the head back, lift the chin to open the airway. Look at the chest for rise and fall. Listen for breath sounds. Feel for air on your cheek. Spend no more than 10 seconds on this assessment.',
    actions: [
      'Head-tilt chin-lift: place one hand on forehead, two fingers under chin',
      'Look: watch chest for rise and fall',
      'Listen: ear close to mouth for breath sounds',
      'Feel: air on your cheek from mouth/nose',
      'If no breathing in 10 seconds → BEGIN CPR IMMEDIATELY',
    ],
    fatal_mistake: 'Spending more than 10 seconds checking breathing wastes critical perfusion time.',
    scene: 'airway',
  },
  {
    id: 6,
    icon: 'HeartPulse',
    color: 'text-red-400',
    borderColor: 'border-red-500/60',
    bgColor: 'bg-red-500/10',
    title: 'Begin CPR — 30:2 Ratio',
    standard: 'AHA BLS 2024 / ERC 2021 / ILCOR 2020',
    urgency: 'CRITICAL',
    instruction: 'Begin chest compressions immediately. Place heel of hand on centre of chest (lower half of sternum). Compress 5–6 cm deep at 100–120 BPM. Allow full chest recoil. After 30 compressions, give 2 rescue breaths. Continue until AED arrives or victim recovers.',
    actions: [
      'Kneel beside the victim — firm surface essential',
      'Heel of dominant hand on sternum centre, second hand on top, fingers interlaced',
      'Compress 5–6 cm deep — straight arms, full weight',
      'Rate: 100–120 per minute (use "Stayin\' Alive" rhythm)',
      '30 compressions → 2 rescue breaths (1 second each)',
      'Minimise interruptions — NO pause longer than 10 seconds',
    ],
    fatal_mistake: 'Shallow compressions (<5 cm) do not generate adequate cardiac output. Lock your elbows and compress fully.',
    scene: 'cpr',
  },
  {
    id: 7,
    icon: 'Radio',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/60',
    bgColor: 'bg-emerald-500/10',
    title: 'Deploy AED — Defibrillation',
    standard: 'AHA BLS 2024 / ERC 2021',
    urgency: 'HIGH',
    instruction: 'As soon as an Automated External Defibrillator (AED) is available, switch it on and follow voice prompts. Apply pads to bare dry skin. Stand clear during analysis and shock delivery. Resume CPR immediately after each shock.',
    actions: [
      'Power ON the AED and follow voice instructions',
      'Remove or cut clothing — place pads on bare, dry skin',
      'Pad 1: upper right chest (below collarbone)',
      'Pad 2: lower left side (below armpit)',
      '"STAND CLEAR" — ensure nobody is touching the victim',
      'Press SHOCK if advised → immediately resume CPR for 2 minutes',
      'AED re-analyses every 2 min — do not stop compressions until it instructs',
    ],
    fatal_mistake: 'Delaying CPR to wait for AED arrival wastes critical time. Do both — one person CPR, one person gets AED.',
    scene: 'aed',
  },
  {
    id: 8,
    icon: 'Hand',
    color: 'text-teal-400',
    borderColor: 'border-teal-500/60',
    bgColor: 'bg-teal-500/10',
    title: 'Recovery Position',
    standard: 'ERC 2021 / BRC First Aid Guidelines',
    urgency: 'MODERATE',
    instruction: 'If the victim regains consciousness and is breathing normally, place them in the Recovery Position to keep the airway open and prevent choking on vomit. Monitor continuously until paramedics arrive.',
    actions: [
      'Kneel beside the victim on their right side',
      'Straighten their legs, place near arm at right angle to body',
      'Bring far arm across chest, hold back of hand against their near cheek',
      'Pull up far knee and roll victim toward you onto their side',
      'Tilt head back to keep airway open',
      'Monitor breathing every minute until EMS arrives',
    ],
    fatal_mistake: 'Leaving a breathing-but-unconscious victim flat on their back risks airway obstruction from the tongue or vomit.',
    scene: 'recovery',
  },
  {
    id: 9,
    icon: 'Shield',
    color: 'text-green-400',
    borderColor: 'border-green-500/60',
    bgColor: 'bg-green-500/10',
    title: 'Handover & Hospital Monitoring',
    standard: 'AHA 2024 / IEC 60479-1 Clinical Notes',
    urgency: 'IMPORTANT',
    instruction: 'All electrical shock victims — even those who appear fully recovered — require mandatory hospital evaluation. Electrical injury causes internal burns, delayed cardiac arrhythmias (can occur up to 24 hours later), and neurological damage that may not be immediately visible.',
    actions: [
      'Brief paramedics: voltage level, AC/DC, contact duration, entry/exit point',
      'All high-voltage (>1000V) victims: mandatory 24-hour cardiac monitoring',
      'All victims regardless of voltage: ECG and urine myoglobin test (rhabdomyolysis)',
      'Document the incident for regulatory reporting (RIDDOR / OSHA 300)',
      'Preserve the incident scene for investigation',
      'Provide psychological support — PTSD is common post-electrical injury',
    ],
    fatal_mistake: 'Delayed ventricular fibrillation can occur hours after a "mild" shock. Always insist on hospital evaluation.',
    scene: 'handover',
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Eye, Zap, PhoneCall, Brain, Wind, HeartPulse, Radio, Hand, Shield
};

// ─── Triage Zone Data ─────────────────────────────────────────────────────────
type TriageZone = {
  id: string;
  label: string;
  cx: number; cy: number; rx: number; ry: number;
  organs: string[];
  risk: 'critical' | 'high' | 'moderate';
  monitoring: string;
  iecNote: string;
};

const TRIAGE_ZONES: TriageZone[] = [
  {
    id: 'head', label: 'Head / Skull', cx: 100, cy: 52, rx: 22, ry: 22,
    organs: ['Brain', 'Eyes', 'Ears', 'Brainstem'],
    risk: 'critical',
    monitoring: '48–72 hr neurological observation + CT scan',
    iecNote: 'IEC 60479-1: Current through head → loss of consciousness, seizures, respiratory arrest',
  },
  {
    id: 'chest', label: 'Chest / Heart', cx: 100, cy: 120, rx: 28, ry: 30,
    organs: ['Heart (VF risk)', 'Lungs', 'Thoracic Aorta'],
    risk: 'critical',
    monitoring: '24 hr continuous ECG cardiac monitoring mandatory',
    iecNote: 'IEC 60479-1: Transthoracic current ≥30 mA → ventricular fibrillation threshold',
  },
  {
    id: 'abdomen', label: 'Abdomen', cx: 100, cy: 175, rx: 25, ry: 25,
    organs: ['Liver', 'Kidneys', 'Bowel', 'Spleen'],
    risk: 'high',
    monitoring: '24 hr observation, urine myoglobin, LFTs, renal panel',
    iecNote: 'Internal flash burns from current path — may not be visible externally',
  },
  {
    id: 'left_arm', label: 'Left Arm', cx: 55, cy: 140, rx: 13, ry: 38,
    organs: ['Brachial Nerve', 'Median Nerve', 'Radial Nerve', 'Muscles'],
    risk: 'high',
    monitoring: 'Compartment syndrome check, nerve conduction study',
    iecNote: 'Common current entry/exit site — deep tissue burns despite normal skin appearance',
  },
  {
    id: 'right_arm', label: 'Right Arm', cx: 145, cy: 140, rx: 13, ry: 38,
    organs: ['Brachial Nerve', 'Median Nerve', 'Radial Nerve', 'Muscles'],
    risk: 'high',
    monitoring: 'Compartment syndrome check, nerve conduction study',
    iecNote: 'Common current entry/exit site — deep tissue burns despite normal skin appearance',
  },
  {
    id: 'left_leg', label: 'Left Leg', cx: 83, cy: 265, rx: 14, ry: 52,
    organs: ['Femoral Nerve', 'Sciatic Nerve', 'Muscle bellies'],
    risk: 'moderate',
    monitoring: 'Rhabdomyolysis screening (CK, urine myoglobin)',
    iecNote: 'Step voltage injury — current flows from one foot through legs if standing near ground fault',
  },
  {
    id: 'right_leg', label: 'Right Leg', cx: 117, cy: 265, rx: 14, ry: 52,
    organs: ['Femoral Nerve', 'Sciatic Nerve', 'Muscle bellies'],
    risk: 'moderate',
    monitoring: 'Rhabdomyolysis screening (CK, urine myoglobin)',
    iecNote: 'Step voltage injury — current flows from one foot through legs if standing near ground fault',
  },
];

// ─── Quiz Data ────────────────────────────────────────────────────────────────
const QUIZ_SCENARIOS = [
  {
    title: 'Scene Safety — First Responder',
    desc: 'You enter a workshop and see a colleague on the floor. There is a sparking cable near their hand. What is your FIRST action?',
    options: [
      { text: 'Grab their arm and pull them away quickly', correct: false },
      { text: 'Shout "DO NOT TOUCH" to bystanders, then find the isolator', correct: true },
      { text: 'Immediately begin chest compressions', correct: false },
      { text: 'Call your supervisor before doing anything', correct: false },
    ],
    explanation: 'Scene safety is always the first priority. A sparking cable indicates the circuit may still be live. Touching the victim without isolating the source puts you at equal risk of electrocution. Warn bystanders, then isolate the power.',
    standard: 'IEC 60364-4-41 / ILCOR 2020',
  },
  {
    title: 'Power Isolation Method',
    desc: 'The isolator switch is 5 metres away. The victim is still in contact with a live cable you cannot reach. What do you use to move the cable?',
    options: [
      { text: 'A metal pipe — it\'s sturdy', correct: false },
      { text: 'A damp cloth — fabric is insulating', correct: false },
      { text: 'A dry wooden pole or rubber-handled tool', correct: true },
      { text: 'Your foot in a rubber boot', correct: false },
    ],
    explanation: 'Only dry wood or rubber-insulated tools should be used to move a live conductor. Metal conducts electricity. Damp cloth has too low a resistance. Rubber boots alone are not rated for mains voltage contact.',
    standard: 'IEC 60364-4-41 / OSHA LOTO Standard',
  },
  {
    title: 'CPR Rate and Depth',
    desc: 'You are performing CPR on an adult electrical shock victim. What is the correct compression rate and depth?',
    options: [
      { text: '60 compressions/min at 3 cm depth', correct: false },
      { text: '100–120 compressions/min at 5–6 cm depth', correct: true },
      { text: '80 compressions/min at 7 cm depth', correct: false },
      { text: '120+ compressions/min at 4 cm depth', correct: false },
    ],
    explanation: 'AHA BLS 2024 and ERC 2021 guidelines specify 100–120 compressions per minute at 5–6 cm depth (2–2.4 inches) for adults. Shallower compressions do not generate adequate cardiac output. Deeper may cause rib fractures.',
    standard: 'AHA BLS 2024 / ERC 2021',
  },
  {
    title: 'CPR Compression Ratio',
    desc: 'You are alone performing CPR on an adult. What is the correct ratio of compressions to rescue breaths?',
    options: [
      { text: '15 compressions : 2 breaths', correct: false },
      { text: '30 compressions : 1 breath', correct: false },
      { text: '30 compressions : 2 breaths', correct: true },
      { text: 'Compressions only — no rescue breaths', correct: false },
    ],
    explanation: 'The internationally agreed ratio for adult single-rescuer CPR is 30 compressions followed by 2 rescue breaths (1 second each). Compression-only CPR is an acceptable alternative if the rescuer is unwilling to give rescue breaths.',
    standard: 'ILCOR 2020 / AHA BLS 2024',
  },
  {
    title: 'AED Pad Placement',
    desc: 'You have an AED ready. Where do you place the two pads on an adult victim?',
    options: [
      { text: 'Both pads on the left side of the chest', correct: false },
      { text: 'Upper right chest below collarbone, and lower left side below the armpit', correct: true },
      { text: 'One on the chest and one on the back', correct: false },
      { text: 'Both pads on the upper chest across the sternum', correct: false },
    ],
    explanation: 'Standard anterolateral AED pad placement: Pad 1 on the upper right chest (just below the clavicle), Pad 2 on the lower left lateral chest (below the armpit). This allows the shock to travel across the heart vector.',
    standard: 'AHA BLS 2024 / ERC 2021',
  },
  {
    title: 'Post-Shock Monitoring',
    desc: 'A colleague receives a shock from a 230V outlet. They appear fine, conscious, and say they feel OK. What should happen next?',
    options: [
      { text: 'Send them home to rest', correct: false },
      { text: 'Give them water and monitor for 30 minutes', correct: false },
      { text: 'Insist on hospital evaluation — all electrical injuries require ECG and assessment', correct: true },
      { text: 'Only go to hospital if they feel chest pain', correct: false },
    ],
    explanation: 'Even "minor" electrical shocks from mains voltage (230V AC) can cause delayed ventricular arrhythmias, internal burns, and myoglobin release damaging the kidneys. Mandatory hospital assessment with ECG and urine testing is required for all electrical injuries.',
    standard: 'AHA 2024 Post-Resuscitation Care / IEC 60479-1',
  },
  {
    title: 'Airway Assessment Time Limit',
    desc: 'How long should you spend checking for breathing before beginning CPR?',
    options: [
      { text: '30 seconds — be thorough', correct: false },
      { text: 'No more than 10 seconds', correct: true },
      { text: '1 minute', correct: false },
      { text: '20 seconds', correct: false },
    ],
    explanation: 'ERC 2021 and AHA 2024 both specify that breathing assessment should take no longer than 10 seconds. After 4–6 minutes without CPR, brain damage becomes irreversible. Each second spent checking is a second the brain is not being perfused.',
    standard: 'ERC 2021 / AHA BLS 2024',
  },
  {
    title: 'Recovery Position Indication',
    desc: 'The victim has recovered spontaneous breathing and is regaining consciousness after CPR. What is the correct position?',
    options: [
      { text: 'Flat on their back (supine)', correct: false },
      { text: 'Sitting upright against the wall', correct: false },
      { text: 'Recovery position — on their side, head tilted back', correct: true },
      { text: 'Prone (face down)', correct: false },
    ],
    explanation: 'The Recovery Position keeps the airway open and allows fluid to drain safely. Leaving a breathing-but-unconscious victim supine risks the tongue falling back to obstruct the airway, causing asphyxia.',
    standard: 'ERC 2021 / British Red Cross First Aid',
  },
  {
    title: 'High-Voltage Victim — Entry/Exit Burns',
    desc: 'A victim of a 11kV high-voltage contact has small burn marks on their right hand and left foot. Why are these entry/exit points critical information?',
    options: [
      { text: 'They help you estimate the pain level experienced', correct: false },
      { text: 'They reveal the current path through the body, predicting organ damage risk', correct: true },
      { text: 'They determine how much voltage was involved', correct: false },
      { text: 'They indicate where to apply the AED pads', correct: false },
    ],
    explanation: 'Entry and exit burn points define the current path through the body. A hand-to-foot path passes through the torso and heart — indicating high risk of cardiac arrhythmia, internal burns, and renal damage. This information must be given to paramedics.',
    standard: 'IEC 60479-1 / AHA Electrical Injury Guidelines',
  },
  {
    title: 'Rhabdomyolysis Risk',
    desc: 'After treating an electrical shock victim, the paramedic asks about "rhabdomyolysis risk". What does this refer to in electrical injuries?',
    options: [
      { text: 'Risk of electric shock to the paramedic', correct: false },
      { text: 'Muscle protein (myoglobin) released into bloodstream causing acute kidney failure', correct: true },
      { text: 'The risk of the victim going into a coma', correct: false },
      { text: 'Bone fractures from muscle contraction during the shock', correct: false },
    ],
    explanation: 'Electrical current causes massive muscle necrosis. Destroyed muscle cells release myoglobin into the bloodstream. Myoglobin is toxic to kidney tubules and can cause acute renal failure within 24–48 hours. Aggressive IV fluid therapy is the treatment.',
    standard: 'AHA Electrical Injury Guidelines / IEC 60479-1 Clinical Notes',
  },
];

function ProtocolModule() {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    setElapsed(0);
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 600);
    return () => clearInterval(t);
  }, []);

  // Keyboard navigation: Left & Right arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setStep(s => Math.min(PROTOCOL_STEPS.length - 1, s + 1));
      } else if (e.key === 'ArrowLeft') {
        setStep(s => Math.max(0, s - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const s = PROTOCOL_STEPS[step];
  const StepIcon = ICON_MAP[s.icon] || Shield;
  const totalTime = 4 * 60;
  const brainTimer = Math.max(0, totalTime - elapsed);
  const mm = String(Math.floor(brainTimer / 60)).padStart(2, '0');
  const ss = String(brainTimer % 60).padStart(2, '0');
  const isCritical = s.urgency === 'CRITICAL';

  return (
    <div className="flex flex-col h-full min-h-0 justify-between gap-2 overflow-hidden select-none">
      {/* 1. Sleek Compact Header Status Strip */}
      <div className={cn(
        "flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs shrink-0",
        isCritical ? "border-red-500/40 bg-red-950/20" : "border-slate-800 bg-slate-900/60"
      )}>
        <div className="flex items-center gap-2">
          <span className={cn(
            "w-2.5 h-2.5 rounded-full",
            isCritical ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-orange-500 shadow-[0_0_8px_#f97316]"
          )} style={{ opacity: pulse ? 1 : 0.2 }} />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            STEP {step + 1} OF {PROTOCOL_STEPS.length}: {s.title.toUpperCase()}
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
            isCritical ? "bg-red-600 text-white shadow-sm shadow-red-600/30" : "bg-orange-500 text-slate-950"
          )}>
            {s.urgency}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span className="text-[10px] text-slate-500 hidden sm:inline uppercase">{s.standard}</span>
          {step < 6 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">BRAIN SAFE WINDOW:</span>
              <span className={cn(
                "font-black text-xs tabular-nums",
                brainTimer < 60 ? "text-red-400 animate-pulse" : brainTimer < 120 ? "text-amber-400" : "text-emerald-400"
              )}>
                {mm}:{ss}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Visual & Directive Stage (2 Columns: 46% Visual Canvas, 54% Clinical Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Premium Interactive Vector Canvas */}
        <div className={cn(
          "md:col-span-6 rounded-xl border flex flex-col items-center justify-center p-2 relative overflow-hidden shadow-2xl min-h-0 h-full",
          s.borderColor,
          s.bgColor
        )}>
          <div className="w-full h-full flex items-center justify-center min-h-0 overflow-hidden">
            <ProtocolVisualEngine scene={s.scene} pulse={pulse} />
          </div>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[9px] font-mono text-slate-400 backdrop-blur-sm">
            {s.scene.toUpperCase()} · IEC &amp; AHA 2024
          </div>
        </div>

        {/* Right Column: Clinical Action Terminal (Zero-scroll, fits all viewports) */}
        <div className="md:col-span-6 flex flex-col justify-between gap-2 min-h-0 h-full overflow-hidden">
          {/* Top: Directive Instruction */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <StepIcon className={cn("w-4 h-4", s.color)} />
                <span className="text-xs font-black uppercase text-white tracking-wide">
                  Clinical Action Directive
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 uppercase bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                {s.standard}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-snug">
              {s.instruction}
            </p>
          </div>

          {/* Middle: 2-Column Micro-Grid for Action Checklist & Fatal Mistake */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1 min-h-0 overflow-hidden">
            {/* Action Checklist (7 cols) */}
            <div className="sm:col-span-7 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between overflow-hidden min-h-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                Mandatory Action Protocol
              </span>
              <div className="space-y-0.5 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                {s.actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className={cn("w-3 h-3 mt-0.5 shrink-0", s.color)} />
                    <span className="text-[10.5px] text-slate-200 leading-tight">{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fatal Mistake Alert (5 cols) */}
            <div className="sm:col-span-5 p-2.5 rounded-xl border border-red-500/40 bg-red-950/30 flex flex-col justify-between overflow-hidden min-h-0">
              <div>
                <div className="flex items-center gap-1.5 mb-1 text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Fatal Mistake</span>
                </div>
                <p className="text-[11px] text-red-200 leading-tight">
                  {s.fatal_mistake}
                </p>
              </div>

              <div className="pt-1.5 border-t border-red-500/20 text-[9px] font-mono text-red-400/80 flex items-center justify-between">
                <span>AHA/ERC Standard</span>
                <span className="text-[8px] bg-red-950 px-1 py-0.2 rounded border border-red-800 text-red-300">CRITICAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sleek Stepper Navigation Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 shrink-0">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>PREV</span>
        </button>

        {/* 9 Numbered Step Pills */}
        <div className="flex-1 flex items-center justify-center gap-1 overflow-x-auto py-0.5">
          {PROTOCOL_STEPS.map((stepItem, i) => {
            const isCurrent = i === step;
            const isPast = i < step;
            return (
              <button
                key={i}
                onClick={() => setStep(i)}
                title={`Step ${i + 1}: ${stepItem.title}`}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 border shrink-0",
                  isCurrent
                    ? "bg-orange-500 border-orange-400 text-slate-950 shadow-md shadow-orange-500/30 scale-105"
                    : isPast
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                )}
              >
                <span>{i + 1}</span>
                <span className="hidden xl:inline text-[9px] opacity-90 font-mono">
                  {stepItem.title.split('—')[0].trim()}
                </span>
              </button>
            );
          })}
        </div>

        {step < PROTOCOL_STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-orange-500/30 cursor-pointer shrink-0"
          >
            <span>NEXT</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => setStep(0)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/30 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESTART</span>
          </button>
        )}
      </div>
    </div>
  );
}

function CPRTrainer({
  onOpenExam,
  onOpenScenarios,
}: {
  onOpenExam?: () => void;
  onOpenScenarios?: () => void;
}) {
  const [subMode, setSubMode] = useState<'cpr' | 'bvm' | 'aed'>('cpr');
  const [demographic, setDemographic] = useState<PatientDemographic>('adult');
  const [lastStrokeTime, setLastStrokeTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceCoachActive, setIsVoiceCoachActive] = useState<boolean>(true);
  const [patientSpO2, setPatientSpO2] = useState<number>(72);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [userBPM, setUserBPM] = useState<number | null>(null);
  const [phase, setPhase] = useState<'compress' | 'release'>('release');
  const [breathPhase, setBreathPhase] = useState(false);
  const [compCount, setCompCount] = useState(0);
  const [compressionDepthCm, setCompressionDepthCm] = useState(0);
  const [strokeVelocityCmS, setStrokeVelocityCmS] = useState(0);
  const { playArcBlast, playBreakerTripSound } = useAudioHaptics();

  const activeDemoConfig = DEMOGRAPHIC_PRESETS[demographic];

  // Category A: Dynamic Hemodynamics State
  const [hemodynamics, setHemodynamics] = useState<HemodynamicState>(INITIAL_HEMODYNAMICS);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Category A: Viscoelastic Chest Resistance
  const chestMechanics = calculateChestResistance(compressionDepthCm, strokeVelocityCmS);

  const TARGET_BPM = 110;
  const INTERVAL_MS = Math.round(60000 / TARGET_BPM);

  // Configure AI Resuscitation Voice Coach
  useEffect(() => {
    resuscitationCoach.setConfig({
      speechEnabled: isVoiceCoachActive,
      audioEffectsEnabled: !isMuted,
      hapticsEnabled: true,
    });
  }, [isVoiceCoachActive, isMuted]);

  // Demographic Switch Handler with spoken voice confirmation
  const handleDemographicChange = (d: PatientDemographic) => {
    setDemographic(d);
    if (d === 'child') {
      resuscitationCoach.speak("Pediatric Child BLS protocol selected. Target depth 4 to 5 centimeters. Use one hand.", "urgent");
    } else if (d === 'infant') {
      resuscitationCoach.speak("Infant BLS protocol selected. Target depth 3.5 to 4 centimeters. Use two thumbs encircling chest. Check brachial pulse.", "urgent");
    } else {
      resuscitationCoach.speak("Adult BLS protocol selected. Target depth 5 to 6 centimeters. Two hands interlaced.");
    }
  };

  // High-precision Hemodynamic & Pressure Decay Physics Loop (runs every 100ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setHemodynamics(prev => {
        return stepHemodynamics(
          prev,
          0.1,
          false,
          compressionDepthCm,
          userBPM || TARGET_BPM
        );
      });
    }, 100);
    return () => clearInterval(timer);
  }, [compressionDepthCm, userBPM]);

  // Metronome tick & auto runner
  useEffect(() => {
    if (!isRunning || subMode !== 'cpr') {
      if (!isSpacePressed) {
        setPhase('release');
        setCompressionDepthCm(0);
      }
      return;
    }
    const t = setInterval(() => {
      setCompCount(c => {
        const next = c + 1;
        if (next % 30 === 0) {
          setBreathPhase(true);
          resuscitationCoach.speak("Give two rescue breaths.", "urgent");
          setTimeout(() => setBreathPhase(false), 1400);
        }
        return next;
      });

      const optimalDepth = activeDemoConfig.optimalDepthCm;
      setPhase('compress');
      setCompressionDepthCm(optimalDepth);
      setStrokeVelocityCmS(42.0);
      setLastStrokeTime(performance.now());

      // Step hemodynamics with successful compression
      setHemodynamics(prev => stepHemodynamics(prev, INTERVAL_MS / 1000, true, optimalDepth, TARGET_BPM));

      if (!isMuted) {
        resuscitationCoach.playMetronomeTick();
      }
      resuscitationCoach.triggerCompressionHaptic(false);

      setTimeout(() => {
        setPhase('release');
        setCompressionDepthCm(0);
        setStrokeVelocityCmS(-38.0);
        resuscitationCoach.triggerCompressionHaptic(true);
      }, INTERVAL_MS * 0.38);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, [isRunning, subMode, INTERVAL_MS, isMuted, isSpacePressed, activeDemoConfig]);

  // Manual compression execution (via Button Tap, Touch Zone, or Spacebar/Enter)
  const executeCompressionDown = useCallback(() => {
    const now = performance.now();
    setLastStrokeTime(now);
    const optimalDepth = activeDemoConfig.optimalDepthCm;

    setPhase('compress');
    setCompressionDepthCm(optimalDepth);
    setStrokeVelocityCmS(45.0);

    setHemodynamics(prev => stepHemodynamics(prev, 0.15, true, optimalDepth, userBPM || TARGET_BPM));
    if (!isMuted) resuscitationCoach.playMetronomeTick();
    resuscitationCoach.triggerCompressionHaptic(false);

    setCompCount(c => {
      const next = c + 1;
      if (next % 30 === 0) {
        setBreathPhase(true);
        resuscitationCoach.speak("Give two rescue breaths.", "urgent");
        setTimeout(() => setBreathPhase(false), 1400);
      } else if (next % 10 === 0) {
        resuscitationCoach.speak("Good compressions. Keep going.");
      }
      return next;
    });

    setTapTimes(prev => {
      const updated = [...prev, Date.now()].slice(-8);
      if (updated.length >= 2) {
        const gaps = updated.slice(1).map((t, i) => t - updated[i]);
        setUserBPM(Math.round(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length)));
      }
      return updated;
    });
  }, [isMuted, userBPM, activeDemoConfig]);

  const executeCompressionUp = useCallback(() => {
    setPhase('release');
    setCompressionDepthCm(0);
    setStrokeVelocityCmS(-40.0);
    resuscitationCoach.triggerCompressionHaptic(true);
  }, []);

  // Keyboard Spacebar & Enter integration for hands-on ergonomic muscle memory
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat && subMode === 'cpr') {
        e.preventDefault();
        setIsSpacePressed(true);
        executeCompressionDown();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && subMode === 'cpr') {
        e.preventDefault();
        setIsSpacePressed(false);
        executeCompressionUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [subMode, executeCompressionDown, executeCompressionUp]);

  const bpmDelta = userBPM ? userBPM - TARGET_BPM : null;
  const bpmLabel = bpmDelta === null ? null
    : bpmDelta < -15 ? { text: 'Too Slow — Speed Up!', color: 'text-red-400' }
    : bpmDelta > 15 ? { text: 'Too Fast — Slow Down!', color: 'text-orange-400' }
    : Math.abs(bpmDelta) <= 10 ? { text: '✓ Perfect Cadence (100–120 BPM)!', color: 'text-green-400' }
    : { text: 'Almost In Window', color: 'text-yellow-400' };

  const cyclePos = compCount % 30;

  // ─── Category A: Interactive AED & BTE Defibrillation Physics State ──────────
  const [aedPhase, setAedPhase] = useState<'vfib' | 'analyzing' | 'shock_ready' | 'shocked' | 'sinus' | 'asystole'>('vfib');
  const [aedTimer, setAedTimer] = useState<number>(0);
  const [patientImpedanceOhms, setPatientImpedanceOhms] = useState<number>(75);
  const [capacitorVoltageV, setCapacitorVoltageV] = useState<number>(0);

  const targetAedVoltage = demographic === 'adult' ? 1600 : 950;

  // Live BTE waveform calculation based on patient impedance and demographic energy preset
  const bteWaveform = calculateBTEWaveform({
    capacitanceUf: 140,
    chargeVoltageV: capacitorVoltageV > 0 ? capacitorVoltageV : targetAedVoltage,
    patientImpedanceOhms,
    phase1DurationMs: 6.0,
    interphaseDelayMs: 0.5,
    phase2DurationMs: 4.0,
  });

  // Calculate live AMSA of patient VF based on CPR quality and CPP
  const amsaAssessment = calculateAMSA(hemodynamics.coronaryPerfusionPressure, 8);

  const handleStartAnalysis = () => {
    setAedPhase('analyzing');
    setAedTimer(3);
    setCapacitorVoltageV(0);
    resuscitationCoach.speak("Analyzing heart rhythm... Do not touch patient!", "urgent");
    resuscitationCoach.startCapacitorCharge(3.0);

    // Capacitor charge ramp-up simulation (0 to targetAedVoltage)
    const chargeInterval = setInterval(() => {
      setCapacitorVoltageV(v => {
        if (v >= targetAedVoltage) {
          clearInterval(chargeInterval);
          return targetAedVoltage;
        }
        return v + (demographic === 'adult' ? 200 : 120);
      });
    }, 200);

    const interval = setInterval(() => {
      setAedTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setAedPhase('shock_ready');
          playBreakerTripSound();
          resuscitationCoach.speak("Shock advised. Stand clear! Deliver shock now. Press the flashing orange button.", "urgent");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDeliverShock = () => {
    setAedPhase('shocked');
    resuscitationCoach.playDefibrillationShock();
    playArcBlast();
    triggerHaptic([120, 60, 240]);

    setTimeout(() => {
      // Cardioversion outcome based on true AMSA & delivered current
      if (amsaAssessment.rhythmQuality === 'coarse_vf' && bteWaveform.isEffectiveCurrent) {
        setAedPhase('sinus');
        resuscitationCoach.speak("Shock delivered. Normal sinus rhythm restored. Check breathing.");
      } else if (amsaAssessment.amsaValue < 12.0 || !bteWaveform.isEffectiveCurrent) {
        // Fine ischemic VF or excessive impedance causes post-shock asystole or failed conversion
        setAedPhase('asystole');
        resuscitationCoach.speak("Shock delivered. Asystole detected. Continue CPR immediately!", "urgent");
      } else {
        setAedPhase('sinus');
        resuscitationCoach.speak("Shock delivered. Rhythm converted. Check pulse.");
      }
    }, 1400);
  };

  const handleResetAED = () => {
    setAedPhase('vfib');
    setCapacitorVoltageV(0);
  };

  return (
    <div className="flex flex-col gap-3 h-full select-none font-mono">
      {/* Sub-Mode Toggle: CPR vs BVM Ventilation vs AED Defibrillator */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSubMode('cpr')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
              subMode === 'cpr' ? "bg-red-600 text-white shadow-md shadow-red-600/30" : "text-slate-400 hover:text-white"
            )}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            CPR Physics & Hemodynamics
          </button>
          <button
            onClick={() => {
              setSubMode('bvm');
              setIsRunning(false);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
              subMode === 'bvm' ? "bg-sky-600 text-white shadow-md shadow-sky-600/30" : "text-slate-400 hover:text-white"
            )}
          >
            <Wind className="w-3.5 h-3.5" />
            BVM & Airway Dynamics (30:2)
          </button>
          <button
            onClick={() => {
              setSubMode('aed');
              setIsRunning(false);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
              subMode === 'aed' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-slate-400 hover:text-white"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            BTE Defibrillator & AMSA
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {subMode === 'cpr' && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
              <Keyboard className="w-3 h-3 text-orange-400" />
              SPACEBAR ACTIVE
            </span>
          )}
          <button
            onClick={() => setIsVoiceCoachActive(v => !v)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border",
              isVoiceCoachActive
                ? "bg-purple-950 border-purple-500/80 text-purple-300 shadow-sm shadow-purple-500/20"
                : "bg-slate-800 border-slate-700 text-slate-500 hover:text-white"
            )}
            title="Toggle AI Resuscitation Voice Coach"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px]">{isVoiceCoachActive ? "VOICE COACH ON" : "VOICE COACH OFF"}</span>
          </button>
          <button
            onClick={() => setIsMuted(m => !m)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isMuted ? "Unmute Metronome" : "Mute Metronome"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-orange-400" />}
            <span className="text-[10px]">{isMuted ? "MUTED" : "AUDIO ON"}</span>
          </button>
          {onOpenExam && (
            <button
              onClick={onOpenExam}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-red-600/30 cursor-pointer animate-pulse"
              title="Launch Timed 2-Minute Resuscitation Exam with AHA/ERC Telemetry"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">2-MIN EXAM</span>
            </button>
          )}
          {onOpenScenarios && (
            <button
              onClick={onOpenScenarios}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/30 cursor-pointer"
              title="Play 5 Real-World Electrical Hazard Rescue Scenarios"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">SCENARIOS</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Demographic Protocol Switcher */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Demographic Protocol:
          </span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(['adult', 'child', 'infant'] as PatientDemographic[]).map(d => {
            const cfg = DEMOGRAPHIC_PRESETS[d];
            const isSelected = demographic === d;
            return (
              <button
                key={d}
                onClick={() => handleDemographicChange(d)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 border shrink-0",
                  isSelected
                    ? d === 'adult'
                      ? "bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30"
                      : d === 'child'
                      ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/30"
                      : "bg-sky-600 border-sky-500 text-white shadow-md shadow-sky-600/30"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                )}
              >
                <span>{cfg.name}</span>
                <span className="text-[9px] opacity-80 hidden sm:inline">
                  ({cfg.targetDepthCmMin}–{cfg.targetDepthCmMax} cm · {cfg.aedEnergyJoules}J)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {subMode === 'cpr' ? (
        /* ─── CPR METRONOME & REAL-TIME BIOMECHANICAL/HEMODYNAMIC VIEW ──── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          
          {/* LEFT: Viscoelastic Chest Model & Hemodynamic Readouts (7 Cols) */}
          <div className="lg:col-span-7 rounded-xl border border-red-500/40 bg-red-950/20 flex flex-col justify-between p-4 gap-3 relative overflow-hidden">
            
            {/* Header Readout Bar */}
            <div className="flex items-center justify-between text-xs font-bold shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white uppercase tracking-wider text-[11px]">
                  {activeDemoConfig.name.toUpperCase()} CHEST BIOMECHANICS ({activeDemoConfig.targetDepthCmMin}–{activeDemoConfig.targetDepthCmMax} CM)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-black uppercase border",
                  hemodynamics.coronaryPerfusionPressure >= 15
                    ? "bg-emerald-950 border-emerald-500 text-emerald-300 animate-pulse"
                    : "bg-red-950 border-red-500/60 text-red-300"
                )}>
                  {hemodynamics.coronaryPerfusionPressure >= 15 ? "✓ ROSC VIABLE (CPP ≥ 15)" : "ISCHEMIC (CPP < 15)"}
                </span>
              </div>
            </div>

            {/* Interactive 3D Thorax & Cardiac Ventricular Cutaway View (Rec 6) */}
            <div className="flex-1 flex items-center justify-center relative min-h-[190px]">
              <ThoraxCutawayView
                phase={phase}
                compressionDepthCm={compressionDepthCm}
                forceNewtons={chestMechanics.forceNewtons}
                coronaryPerfusionPressure={hemodynamics.coronaryPerfusionPressure}
                breathPhase={breathPhase}
                demographic={demographic}
              />
            </div>

            {/* Category A: Hemodynamic Perfusion HUD */}
            <div className="grid grid-cols-4 gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono">
              <div className="text-center">
                <span className="text-[9px] text-slate-400 block">CPP (CORONARY)</span>
                <span className={cn(
                  "text-base font-black tabular-nums",
                  hemodynamics.coronaryPerfusionPressure >= 15 ? "text-emerald-400" : "text-amber-400"
                )}>
                  {Math.round(hemodynamics.coronaryPerfusionPressure)} <span className="text-[9px]">mmHg</span>
                </span>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-slate-400 block">AORTIC BP</span>
                <span className="text-base font-black text-sky-400 tabular-nums">
                  {Math.round(hemodynamics.aorticPressureSystolic)}/{Math.round(hemodynamics.aorticPressureDiastolic)}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-slate-400 block">CHEST RESIST.</span>
                <span className={cn(
                  "text-base font-black tabular-nums",
                  phase === 'compress' ? "text-orange-400" : "text-slate-500"
                )}>
                  {chestMechanics.forceNewtons} <span className="text-[9px]">N</span>
                </span>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-slate-400 block">BRAIN PERFUSION</span>
                <span className={cn(
                  "text-base font-black tabular-nums",
                  hemodynamics.cerebralPerfusionPct >= 60 ? "text-emerald-400" : "text-red-400"
                )}>
                  {hemodynamics.cerebralPerfusionPct}%
                </span>
              </div>
            </div>

            {/* Action Buttons, Rhythm Highway & Full Touch Compression Zone */}
            <div className="flex flex-col gap-1.5 w-full shrink-0">
              <GuitarHeroRhythmBar targetBpm={110} lastStrokeTime={lastStrokeTime} />

              <div className="flex gap-2">
                <button
                  onClick={() => { setIsRunning(r => !r); setCompCount(0); }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
                    isRunning ? "bg-slate-800 hover:bg-slate-750 text-white border border-slate-700" : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
                  )}
                >
                  {isRunning ? '⏹ Stop 110 BPM Pacer' : '▶ Start 110 BPM Metronome'}
                </button>
                <button
                  onMouseDown={executeCompressionDown}
                  onMouseUp={executeCompressionUp}
                  onTouchStart={(e) => { e.preventDefault(); executeCompressionDown(); }}
                  onTouchEnd={(e) => { e.preventDefault(); executeCompressionUp(); }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5 select-none",
                    isSpacePressed || phase === 'compress'
                      ? "bg-amber-400 text-slate-950 scale-95 shadow-amber-500/40"
                      : "bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-orange-500/20"
                  )}
                >
                  <Hand className="w-3.5 h-3.5" />
                  {isSpacePressed ? 'COMPRESSED (SPACE / TOUCH)' : 'TOUCH / SPACEBAR TO COMPRESS'}
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Cycle: <strong className="text-white">{cyclePos + 1}/30</strong></span>
                <span>Consecutive: <strong className="text-emerald-400">{hemodynamics.strokeCountSincePause}</strong></span>
                <span>Target Depth: <strong className="text-sky-400">{activeDemoConfig.targetDepthCmMin}–{activeDemoConfig.targetDepthCmMax} cm</strong></span>
              </div>
            </div>
          </div>

          {/* RIGHT: Real-time Procedural ECG, CPP Bar & Biomechanics (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2 overflow-y-auto">
            
            {/* Real-time Procedural ECG Monitor with CPR Motion Artifacts */}
            <ProceduralECGMonitor
              rhythm={aedPhase === 'sinus' ? 'sinus' : aedPhase === 'asystole' ? 'asystole' : amsaAssessment.rhythmQuality}
              isCompressing={phase === 'compress' || isRunning}
              compressionDepthCm={compressionDepthCm}
              heartRateBpm={aedPhase === 'sinus' ? 72 : 110}
              amsaValue={amsaAssessment.amsaValue}
              showLeadSelector={true}
            />

            {/* Real-time Coronary Perfusion Pressure (CPP) Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="uppercase flex items-center gap-1 text-emerald-400">
                  <Activity className="w-3.5 h-3.5" />
                  Coronary Perfusion Pressure (CPP)
                </span>
                <span className="text-[10px] font-mono font-black text-emerald-400">≥ 15 mmHg ROSC TARGET</span>
              </div>

              {/* Real-time CPP Meter */}
              <div className="relative h-7 w-full rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center overflow-hidden">
                {/* 15 mmHg Target Marker Line */}
                <div className="absolute top-0 bottom-0 left-[42.8%] w-0.5 bg-emerald-400 z-20 border-r border-dashed border-emerald-300" />
                <div
                  className={cn(
                    "h-full rounded transition-all duration-100",
                    hemodynamics.coronaryPerfusionPressure >= 15 ? "bg-gradient-to-r from-emerald-600 to-teal-400" : "bg-gradient-to-r from-red-600 to-amber-500"
                  )}
                  style={{ width: `${Math.min(100, (hemodynamics.coronaryPerfusionPressure / 35.0) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 mmHg (Ischemia)</span>
                <span className="text-emerald-400 font-bold">15 mmHg (ROSC Threshold)</span>
                <span>35 mmHg (Normal)</span>
              </div>
            </div>

            {/* Sternal Stiffening & Biomechanical Resistance Gauge */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="uppercase flex items-center gap-1 text-orange-400">
                  <Gauge className="w-3.5 h-3.5" />
                  Kelvin-Voigt Resistance Force
                </span>
                <span className="text-[10px] font-mono text-orange-400 font-bold">F = k₁x + k₂x³ + cv</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[9px] text-slate-500 block">DYNAMIC FORCE</span>
                  <span className="text-sm font-black text-white">{chestMechanics.forceNewtons} N (~{(chestMechanics.forceNewtons / 9.81).toFixed(1)} kg)</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[9px] text-slate-500 block">TANGENT STIFFNESS</span>
                  <span className="text-sm font-black text-sky-400">{chestMechanics.stiffnessNPerCm} N/cm</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Human ribs stiffen nonlinearly from 35 N/cm at rest to &gt;190 N/cm at 5.4 cm depth, requiring ~45-55 kgf of bodyweight force.
              </p>
            </div>

            {/* AHA/ERC Standards Checklist for Active Demographic */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between text-orange-400 font-bold mb-1">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="uppercase text-[11px]">{activeDemoConfig.name} BLS Protocol</span>
                </div>
                <span className="text-[9px] text-slate-400 font-normal">{activeDemoConfig.ageBracket}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-[11px]">
                <span className="text-slate-400">Target Depth</span>
                <span className="text-emerald-400 font-bold">{activeDemoConfig.targetDepthCmMin}–{activeDemoConfig.targetDepthCmMax} cm (Optimal {activeDemoConfig.optimalDepthCm} cm)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-[11px]">
                <span className="text-slate-400">Technique</span>
                <span className="text-white font-bold">{activeDemoConfig.handTechnique}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-[11px]">
                <span className="text-slate-400">Pulse Check Site</span>
                <span className="text-sky-400 font-bold">{activeDemoConfig.pulseCheckSite}</span>
              </div>
              <div className="flex justify-between py-1 text-[11px]">
                <span className="text-slate-400">AED Presets</span>
                <span className="text-amber-400 font-bold">{activeDemoConfig.aedEnergyJoules}J ({activeDemoConfig.aedPadPlacement})</span>
              </div>
            </div>

          </div>
        </div>
      ) : subMode === 'bvm' ? (
        /* ─── CATEGORY C: BVM VENTILATION & PULMONARY MECHANICS ──── */
        <div className="flex-1 min-h-0 overflow-y-auto">
          <BVMVentilationEngine
            currentSpO2={patientSpO2}
            onSpO2Change={setPatientSpO2}
            className="h-full"
          />
        </div>
      ) : (
        /* ─── CATEGORY B: RUGGEDIZED INDUSTRIAL AED HUD & DRAG-AND-DROP PADS ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-y-auto">
          
          {/* LEFT: Drag-and-Drop Electrode Pad Placement Stage (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border-2 border-slate-800 bg-slate-950/90 p-3 flex flex-col justify-between overflow-hidden shadow-2xl">
            <AedPadEngine
              onVectorUpdate={(result) => {
                if (result.isBothAttached) {
                  setPatientImpedanceOhms(result.contactImpedanceOhms);
                  resuscitationCoach.speak("Electrode pads attached. Evaluating contact impedance.");
                }
              }}
            />
          </div>

          {/* RIGHT: High-Fidelity Ruggedized AED Hardware Enclosure (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border-4 border-amber-500 bg-slate-950 p-4 flex flex-col justify-between gap-3 shadow-2xl relative overflow-hidden">
            {/* Corner Rubberized Bumpers */}
            <div className="absolute top-0 left-0 w-6 h-6 bg-slate-800 rounded-br-xl border-b-2 border-r-2 border-slate-700 pointer-events-none" />
            <div className="absolute top-0 right-0 w-6 h-6 bg-slate-800 rounded-bl-xl border-b-2 border-l-2 border-slate-700 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-6 h-6 bg-slate-800 rounded-tr-xl border-t-2 border-r-2 border-slate-700 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-slate-800 rounded-tl-xl border-t-2 border-l-2 border-slate-700 pointer-events-none" />

            {/* Industrial AED Top Bezel & Status Annunciators */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/50">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest block leading-none">
                      LIFEPAK CR2 INDUSTRIAL
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.2 rounded text-[8px] font-black",
                      demographic === 'adult' ? "bg-amber-500 text-slate-950" : "bg-sky-400 text-slate-950"
                    )}>
                      {demographic === 'adult' ? 'ADULT 150J' : 'PEDIATRIC 50J'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    IEC 60601-2-4 Medical Grade · ADAPTIV BTE Waveform
                  </span>
                </div>
              </div>

              {/* Hardware LED Annunciators */}
              <div className="flex items-center gap-2 text-[9px] font-bold">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    patientImpedanceOhms <= 100 ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500 animate-pulse"
                  )} />
                  <span className="text-slate-300">PADS {patientImpedanceOhms}Ω</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    capacitorVoltageV >= 1600 ? "bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping" : capacitorVoltageV > 0 ? "bg-amber-400" : "bg-slate-600"
                  )} />
                  <span className="text-slate-300">{capacitorVoltageV}V HV</span>
                </div>
              </div>
            </div>

            {/* CRT Monitor Screen with Procedural ECG Oscilloscope */}
            <div className="relative flex-1 min-h-[140px] rounded-xl bg-slate-950 border-2 border-slate-800 p-2 flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Scanline Grid Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent opacity-30 pointer-events-none animate-pulse" />

              {/* Procedural ECG Oscilloscope Monitor */}
              <div className="relative w-full h-full flex items-center justify-center">
                <ProceduralECGMonitor
                  rhythm={aedPhase === 'sinus' ? 'sinus' : aedPhase === 'asystole' ? 'asystole' : amsaAssessment.rhythmQuality}
                  isCompressing={false}
                  compressionDepthCm={0}
                  heartRateBpm={aedPhase === 'sinus' ? 72 : 0}
                  amsaValue={amsaAssessment.amsaValue}
                  showLeadSelector={false}
                  className="w-full h-full border-0 bg-transparent p-0 shadow-none"
                />
              </div>

              {/* CRT Bottom Readouts */}
              <div className="flex items-center justify-between text-[10px] font-mono shrink-0 z-10 border-t border-slate-800/80 pt-1">
                <span className="text-slate-400">AMSA: <strong className={cn(amsaAssessment.amsaValue >= 21 ? "text-emerald-400" : "text-amber-400")}>{amsaAssessment.amsaValue} mV·Hz</strong></span>
                <span className="text-slate-400">ROSC Chance: <strong className={cn(amsaAssessment.shockSuccessProbability >= 70 ? "text-emerald-400" : "text-red-400")}>{amsaAssessment.shockSuccessProbability}%</strong></span>
                <span className="text-slate-400">BTE Peak: <strong className={cn(bteWaveform.isEffectiveCurrent ? "text-emerald-400" : "text-amber-400")}>{bteWaveform.peakCurrentA} A</strong></span>
              </div>
            </div>

            {/* Hardware Controls & Mechanical Shock Button */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              {(aedPhase === 'vfib' || aedPhase === 'asystole') && (
                <button
                  onClick={handleStartAnalysis}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  1. Analyze Rhythm & Charge 1600V (Stand Clear)
                </button>
              )}

              {aedPhase === 'analyzing' && (
                <div className="flex-1 py-3 rounded-xl bg-amber-950 border-2 border-amber-500 text-amber-300 font-black text-xs uppercase text-center animate-pulse">
                  STAND CLEAR — CHARGING BIPHASIC CAPACITOR ({capacitorVoltageV}V / 1600V)
                </div>
              )}

              {aedPhase === 'shock_ready' && (
                <button
                  onClick={handleDeliverShock}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:brightness-125 active:scale-95 text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 animate-bounce shadow-2xl shadow-red-600/60 border-2 border-white"
                >
                  <Zap className="w-5 h-5 fill-current text-amber-200" />
                  ⚡ PRESS FLASHING BUTTON TO DELIVER SHOCK ({bteWaveform.deliveredEnergyJoules}J @ {bteWaveform.peakCurrentA}A)
                </button>
              )}

              {aedPhase === 'sinus' && (
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 p-2.5 rounded-xl bg-emerald-950 border-2 border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ROSC CONFIRMED (72 BPM) — AIRWAY & 24hr HOSPITAL MONITORING
                  </div>
                  <button
                    onClick={handleResetAED}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Re-Test
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

function TriagePanel() {
  const [triageSubTab, setTriageSubTab] = useState<'anatomy' | 'burns'>('anatomy');
  const [selected, setSelected] = useState<TriageZone | null>(null);

  // Category A: Joule Heating ($Q = I^2 R t$) & Electrical Burn State
  const [burnVoltageV, setBurnVoltageV] = useState<number>(415);
  const [burnDurationS, setBurnDurationS] = useState<number>(0.35);
  const [burnCurrentA, setBurnCurrentA] = useState<number>(1.5);

  const burnAssessment = calculateElectricalBurn(burnVoltageV, burnDurationS, burnCurrentA);

  const riskStyles = (r: TriageZone['risk']) =>
    r === 'critical' ? { fill: 'rgba(239,68,68,0.3)', stroke: '#ef4444', text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10', badge: 'bg-red-500 text-white' }
    : r === 'high' ? { fill: 'rgba(249,115,22,0.28)', stroke: '#f97316', text: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-500/10', badge: 'bg-orange-500 text-white' }
    : { fill: 'rgba(234,179,8,0.22)', stroke: '#eab308', text: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', badge: 'bg-yellow-500 text-slate-950' };

  return (
    <div className="flex flex-col gap-3 h-full font-mono select-none">
      {/* Triage Sub-Mode Toggle */}
      <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTriageSubTab('anatomy')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer",
              triageSubTab === 'anatomy' ? "bg-orange-600 text-white shadow-md shadow-orange-600/30" : "text-slate-400 hover:text-white"
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            IEC 60479-1 Current Path Zones
          </button>
          <button
            onClick={() => setTriageSubTab('burns')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer",
              triageSubTab === 'burns' ? "bg-red-600 text-white shadow-md shadow-red-600/30" : "text-slate-400 hover:text-white"
            )}
          >
            <Flame className="w-3.5 h-3.5" />
            Joule Heating & Tissue Necrosis ($Q = I^2 R t$)
          </button>
        </div>
      </div>

      {triageSubTab === 'anatomy' ? (
        /* ─── IEC 60479-1 ANATOMICAL BODY CURRENT PATHWAYS ──────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 flex items-center justify-center p-4">
            <svg viewBox="60 20 80 300" className="h-full" style={{ maxHeight: 340 }}>
              <circle cx="100" cy="52" r="22" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect x="92" y="70" width="16" height="15" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <rect x="72" y="83" width="56" height="72" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect x="42" y="83" width="28" height="76" rx="14" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect x="130" y="83" width="28" height="76" rx="14" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect x="76" y="152" width="48" height="30" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect x="76" y="178" width="22" height="104" rx="11" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect x="102" y="178" width="22" height="104" rx="11" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              {TRIAGE_ZONES.map(zone => {
                const rs = riskStyles(zone.risk);
                const isSel = selected?.id === zone.id;
                return (
                  <ellipse key={zone.id} cx={zone.cx} cy={zone.cy} rx={zone.rx} ry={zone.ry}
                    fill={rs.fill} stroke={rs.stroke} strokeWidth={isSel ? 2.5 : 1.5}
                    style={{ cursor: 'pointer', opacity: isSel ? 1 : 0.75, transition: 'all 0.2s' }}
                    onClick={() => setSelected(zone)} />
                );
              })}
              <text x="100" y="310" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">Click zones to assess damage risk</text>
            </svg>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-700 border-dashed bg-slate-900/40 p-8">
                <Target className="w-10 h-10 text-slate-600" />
                <div className="text-center">
                  <p className="text-slate-400 font-bold">Select a body zone</p>
                  <p className="text-xs text-slate-600 mt-1">Click the body diagram to see organ damage risk and clinical assessment requirements for that current path</p>
                </div>
                <div className="flex gap-3 text-xs font-mono flex-wrap justify-center">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Critical</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> High</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Moderate</span>
                </div>
              </div>
            ) : (() => {
              const rs = riskStyles(selected.risk);
              return (
                <div className={`flex flex-col gap-3 rounded-xl border ${rs.border} ${rs.bg} p-4`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className={`font-black text-base ${rs.text}`}>{selected.label}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${rs.badge}`}>{selected.risk} risk</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/60 p-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Organs at Risk</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.organs.map(o => <span key={o} className={`px-2 py-0.5 rounded text-xs font-bold border ${rs.border} ${rs.text}`}>{o}</span>)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-900/60 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className={`w-3.5 h-3.5 ${rs.text}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Required Clinical Monitoring</span>
                    </div>
                    <p className={`text-sm font-bold ${rs.text}`}>{selected.monitoring}</p>
                  </div>
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">IEC 60479-1 Reference</span>
                    </div>
                    <p className="text-xs text-sky-300 leading-relaxed">{selected.iecNote}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-xs text-slate-500 hover:text-slate-300 underline self-start">← Select different zone</button>
                </div>
              );
            })()}

            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 space-y-2 flex-shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Current Path Risk Summary</span>
              {[
                { path: 'Hand to Hand (Transthoracic)', level: 'CRITICAL', note: 'Crosses heart — VF threshold at 30 mA' },
                { path: 'Hand to Foot (Most Common)', level: 'CRITICAL', note: 'Passes through torso, heart, organs' },
                { path: 'Head to Foot', level: 'CRITICAL', note: 'Brain, brainstem, and cardiac risk' },
                { path: 'Foot to Foot (Step Voltage)', level: 'MODERATE', note: 'Muscle paralysis, falls — less cardiac' },
              ].map(row => (
                <div key={row.path} className="flex items-start gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black flex-shrink-0 ${row.level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{row.level}</span>
                  <div><span className="font-bold text-slate-300">{row.path}</span> <span className="text-slate-500">— {row.note}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ─── CATEGORY A: JOULE HEATING & TISSUE BURN NECROSIS VIEW ─────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-y-auto">
          
          {/* Controls & Tissue Cross Section (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Simulation Sliders Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1 text-red-400">
                  <Flame className="w-3.5 h-3.5" />
                  Joule Heating Parameters ($Q = I^2 R t$)
                </span>
                <span className="text-amber-400">{burnAssessment.joulesThermalEnergy.toLocaleString()} Joules Deposited</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                {/* Voltage Selector */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">VOLTAGE LEVEL</label>
                  <select
                    value={burnVoltageV}
                    onChange={e => setBurnVoltageV(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white font-bold"
                  >
                    <option value={120}>120V AC (Home)</option>
                    <option value={230}>230V AC (Mains)</option>
                    <option value={415}>415V 3-Phase</option>
                    <option value={11000}>11kV High Voltage</option>
                  </select>
                </div>

                {/* Duration Slider */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>DURATION</span>
                    <span className="text-white font-bold">{burnDurationS.toFixed(2)} s</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="2.0"
                    step="0.05"
                    value={burnDurationS}
                    onChange={e => setBurnDurationS(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-red-500"
                  />
                </div>

                {/* Current Slider */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>BODY CURRENT</span>
                    <span className="text-white font-bold">{burnCurrentA.toFixed(2)} A</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="8.0"
                    step="0.1"
                    value={burnCurrentA}
                    onChange={e => setBurnCurrentA(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Multi-Layer Tissue Depth Visualizer */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col gap-2 flex-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Tissue Layer Thermal Gradient & Necrosis Depth
              </span>

              <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                {burnAssessment.layers.map((layer, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-[11px]">{layer.layerName}</span>
                        <span className="text-[9px] text-slate-500">({layer.depthMmRange})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{layer.cellularEffect}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-xs font-black block tabular-nums",
                        layer.peakTempC > 100 ? "text-red-400" : layer.peakTempC > 60 ? "text-orange-400" : "text-emerald-400"
                      )}>
                        {layer.peakTempC} °C
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.2 text-[8px] font-black uppercase rounded",
                        layer.damageGrade === 'carbonized' ? "bg-neutral-800 text-neutral-300 border border-neutral-600"
                        : layer.damageGrade === '3rd_degree' ? "bg-red-950 text-red-300 border border-red-500"
                        : layer.damageGrade === '2nd_degree' ? "bg-amber-950 text-amber-300 border border-amber-500"
                        : "bg-emerald-950 text-emerald-300"
                      )}>
                        {layer.damageGrade.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Compartment Syndrome & Acute Kidney Injury Prognosis (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            
            {/* Compartment Syndrome Warning Card */}
            <div className={cn(
              "rounded-xl border p-3 flex flex-col gap-2 transition-all",
              burnAssessment.isCompartmentSyndrome
                ? "border-red-500 bg-red-950/40 animate-pulse shadow-lg shadow-red-500/20"
                : "border-slate-800 bg-slate-900/90"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className={cn("w-4 h-4", burnAssessment.isCompartmentSyndrome ? "text-red-400" : "text-slate-400")} />
                  Compartment Syndrome Pressure
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-black",
                  burnAssessment.isCompartmentSyndrome ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300"
                )}>
                  {burnAssessment.compartmentPressureMmhg} mmHg
                </span>
              </div>

              {/* Pressure Bar */}
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                <div className="absolute top-0 bottom-0 left-[37.5%] w-0.5 bg-red-400 z-10" />
                <div
                  className={cn("h-full transition-all", burnAssessment.isCompartmentSyndrome ? "bg-red-500" : "bg-emerald-500")}
                  style={{ width: `${Math.min(100, (burnAssessment.compartmentPressureMmhg / 80) * 100)}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-300 leading-tight">
                {burnAssessment.isCompartmentSyndrome
                  ? "CRITICAL: Intracompartmental pressure exceeds capillary closing pressure (>30 mmHg). IMMEDIATE FASCIOTOMY REQUIRED to prevent ischemic muscle gangrene and limb loss."
                  : "Pressure within safe physiological limits (<30 mmHg). Continue monitoring distal pulses and sensation every 15 minutes."}
              </p>
            </div>

            {/* Rhabdomyolysis & Urine Myoglobin Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Droplets className="w-3.5 h-3.5" />
                  Myoglobinuria & Renal Risk
                </span>
                <span className={cn(
                  "text-[10px] font-black uppercase",
                  burnAssessment.myoglobinuriaRisk === 'fatal_renal_shutdown' ? "text-red-400" : "text-amber-400"
                )}>
                  {burnAssessment.myoglobinuriaRisk.replace('_', ' ')}
                </span>
              </div>

              {/* Urine Color Simulation Tube */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div
                  className="w-7 h-14 rounded-full border border-slate-700 shadow-inner shrink-0"
                  style={{ backgroundColor: burnAssessment.urineColor }}
                  title="Estimated Urine Appearance"
                />
                <div className="text-[10px] text-slate-300 leading-tight">
                  <strong className="text-white block mb-0.5">Urine Appearance:</strong>
                  {burnAssessment.myoglobinuriaRisk === 'fatal_renal_shutdown'
                    ? "Dark port-wine / tea-colored cola urine containing massive myoglobin pigment from necrosed skeletal muscle. Extreme risk of acute tubular necrosis."
                    : "Amber color with moderate pigment. Hydration necessary to maintain urinary output > 100 mL/hr."}
                </div>
              </div>

              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between text-[11px]">
                <span className="text-slate-400">Parkland Resuscitation Fluid:</span>
                <strong className="text-emerald-400 font-mono">{burnAssessment.recommendedLactatedRingersMl.toLocaleString()} mL Lactated Ringer's</strong>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioQuiz() {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const q = QUIZ_SCENARIOS[qIndex];
  const isCorrect = selected !== null && q.options[selected].correct;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    setScores(s => [...s, q.options[selected!].correct]);
  };

  const handleNext = () => {
    if (qIndex < QUIZ_SCENARIOS.length - 1) {
      setQIndex(i => i + 1); setSelected(null); setSubmitted(false);
    } else { setFinished(true); }
  };

  const restart = () => { setQIndex(0); setSelected(null); setSubmitted(false); setScores([]); setFinished(false); };

  if (finished) {
    const correct = scores.filter(Boolean).length;
    const pct = Math.round((correct / QUIZ_SCENARIOS.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center gap-6 h-full py-8">
        <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${pct >= 80 ? 'border-green-500 bg-green-500/10' : pct >= 60 ? 'border-orange-500 bg-orange-500/10' : 'border-red-500 bg-red-500/10'}`}>
          <span className={`text-3xl font-black font-mono ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-orange-400' : 'text-red-400'}`}>{pct}%</span>
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-black text-white uppercase tracking-wider">{pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good Effort' : 'Needs Review'}</h3>
          <p className="text-slate-400 mt-1">{correct} of {QUIZ_SCENARIOS.length} correct — {pct >= 80 ? 'You are ready to respond to an electrical emergency.' : 'Review the protocol module and retry.'}</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {scores.map((s, i) => (
            <div key={i} className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black border ${s ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>{i + 1}</div>
          ))}
        </div>
        <button onClick={restart} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black uppercase tracking-widest text-sm transition-all shadow-lg">
          <RotateCcw className="w-4 h-4" /> Retry Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${(qIndex / QUIZ_SCENARIOS.length) * 100}%` }} />
        </div>
        <span className="text-xs font-mono text-slate-500 whitespace-nowrap">{qIndex + 1} / {QUIZ_SCENARIOS.length}</span>
        <span className="text-xs font-mono text-green-400 whitespace-nowrap">✓ {scores.filter(Boolean).length}</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono block mb-2">Q{qIndex + 1} — {q.title}</span>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">{q.desc}</p>
        </div>

        <div className="space-y-2">
          {q.options.map((opt, i) => {
            let cls = 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-orange-500/50 hover:bg-slate-700/60';
            if (submitted) {
              if (opt.correct) cls = 'border-green-500 bg-green-500/15 text-green-300';
              else if (i === selected && !opt.correct) cls = 'border-red-500 bg-red-500/15 text-red-300';
              else cls = 'border-slate-700/40 bg-slate-800/30 text-slate-500';
            } else if (selected === i) cls = 'border-orange-500 bg-orange-500/10 text-orange-300';
            return (
              <button key={i} disabled={submitted} onClick={() => setSelected(i)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-sm leading-relaxed ${cls} disabled:cursor-default`}>
                <span className="font-mono text-xs mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>{opt.text}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className={`rounded-xl border p-4 ${isCorrect ? 'border-green-500/40 bg-green-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
              <span className={`font-black text-sm uppercase tracking-widest ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{isCorrect ? 'Correct' : 'Incorrect'}</span>
              <span className="text-[10px] font-mono text-slate-500 ml-auto">{q.standard}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{q.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-shrink-0 pt-1">
        {!submitted ? (
          <button onClick={handleSubmit} disabled={selected === null}
            className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black text-sm uppercase tracking-widest transition-all shadow-lg">
            Submit Answer
          </button>
        ) : (
          <button onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2">
            {qIndex < QUIZ_SCENARIOS.length - 1 ? <><span>Next Question</span><ChevronRight className="w-4 h-4" /></> : <span>See Results</span>}
          </button>
        )}
      </div>
    </div>
  );
}

export function FirstAidSimulator({ config }: { config?: UserConfig }) {
  const [activeTab, setActiveTab] = useState<TabId>('protocol');
  const [isExamModalOpen, setIsExamModalOpen] = useState<boolean>(false);
  const [isHazardScenariosOpen, setIsHazardScenariosOpen] = useState<boolean>(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);
  const [activeExamScorecard, setActiveExamScorecard] = useState<ExamScorecard | null>(null);

  const TABS: { id: TabId; label: string; sublabel: string; icon: React.ElementType; activeBg: string }[] = [
    { id: 'protocol', label: 'Emergency Protocol', sublabel: '9-Step Response', icon: AlertTriangle, activeBg: 'bg-red-650 border-red-500' },
    { id: 'cpr', label: 'CPR Trainer', sublabel: 'Metronome + Rate', icon: HeartPulse, activeBg: 'bg-red-700 border-red-600' },
    { id: 'exam', label: '2-Min Exam', sublabel: 'AHA Scorecard', icon: Award, activeBg: 'bg-emerald-700 border-emerald-600' },
    { id: 'scenarios', label: 'Hazard Scenarios', sublabel: '5 Electrical Cases', icon: Zap, activeBg: 'bg-amber-700 border-amber-600' },
    { id: 'triage', label: 'Shock Triage', sublabel: 'Body Zone Risk Map', icon: Thermometer, activeBg: 'bg-orange-600 border-orange-500' },
    { id: 'quiz', label: 'Scenario Quiz', sublabel: '10 Clinical Cases', icon: Brain, activeBg: 'bg-purple-700 border-purple-500' },
  ];

  const handleTabSelect = (id: TabId) => {
    setActiveTab(id);
    if (id === 'exam') setIsExamModalOpen(true);
    if (id === 'scenarios') setIsHazardScenariosOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <div className="flex-shrink-0 px-3 pt-2 pb-1.5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-white leading-none">First Aid & Emergency Response</h2>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Electrical Injury Protocol — AHA BLS 2024 · ERC 2021 · IEC 60479-1</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>AHA/ERC EXAM</span>
            </button>
            <button
              onClick={() => setIsHazardScenariosOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>RESCUE SCENARIOS</span>
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => handleTabSelect(tab.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left flex-shrink-0 transition-all cursor-pointer ${isActive ? `${tab.activeBg} text-white` : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'}`}>
                <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wide leading-none">{tab.label}</div>
                  <div className={`text-[8.5px] font-mono leading-none mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-600'}`}>{tab.sublabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-2 sm:p-2.5 min-h-0 flex flex-col">
        {activeTab === 'protocol' && <ProtocolModule />}
        {activeTab === 'cpr' && (
          <CPRTrainer
            onOpenExam={() => setIsExamModalOpen(true)}
            onOpenScenarios={() => setIsHazardScenariosOpen(true)}
          />
        )}
        {activeTab === 'exam' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 max-w-xl mx-auto text-center p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500 flex items-center justify-center">
              <Award className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-black text-white">AHA/ERC 2-Minute Resuscitation Mastery Exam</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete a 120-second clinical resuscitation exam under simulated cardiac arrest. Track Chest Compression Fraction (CCF ≥ 80%), depth accuracy, recoil completeness, and coronary perfusion pressure (CPP).
            </p>
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/40 cursor-pointer"
            >
              LAUNCH 2-MINUTE PRACTICAL EXAM
            </button>
          </div>
        )}
        {activeTab === 'scenarios' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 max-w-xl mx-auto text-center p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-amber-600/20 border border-amber-500 flex items-center justify-center">
              <Zap className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-black text-white">Interactive Electrical Hazard Rescue Scenarios</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test your decision-making in 5 high-voltage industrial emergency situations: 415V Arc Flash Switchgear, 33kV Boom Crane Step Potential, Flooded Sump Pump, Battery Room Thermal Runaway, and 230V No-Let-Go Hand Freeze.
            </p>
            <button
              onClick={() => setIsHazardScenariosOpen(true)}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-600/40 cursor-pointer"
            >
              LAUNCH INTERACTIVE SCENARIOS
            </button>
          </div>
        )}
        {activeTab === 'triage' && <TriagePanel />}
        {activeTab === 'quiz' && <ScenarioQuiz />}
      </div>

      {/* 2-Minute Resuscitation Mastery Exam Modal (Rec 14) */}
      <ResuscitationExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        onClaimCertificate={(scorecard) => {
          setActiveExamScorecard(scorecard);
          setIsExamModalOpen(false);
          setIsCertificateModalOpen(true);
        }}
      />

      {/* 5 Real-World Electrical Hazard Rescue Scenarios Modal (Rec 15) */}
      <HazardRescueScenarios
        isOpen={isHazardScenariosOpen}
        onClose={() => setIsHazardScenariosOpen(false)}
        onOpenCertificate={(studentName, score) => {
          setIsHazardScenariosOpen(false);
          setIsCertificateModalOpen(true);
        }}
      />

      {/* Downloadable / Printable Certified Safety Certificate Modal */}
      <SafetyCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        defaultStudentName={activeExamScorecard?.candidateName || 'Dr. Anil Sharma'}
        defaultScore={activeExamScorecard?.overallScore || 95}
        certificateType={activeExamScorecard ? 'cpr_resuscitation' : 'electrical'}
        examScorecard={activeExamScorecard || undefined}
      />
    </div>
  );
}

