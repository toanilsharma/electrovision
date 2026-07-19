import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HeartPulse, Zap, AlertTriangle, CheckCircle2, ChevronRight,
  ChevronLeft, RotateCcw, Shield, Activity, Brain, Thermometer,
  PhoneCall, Eye, Wind, Hand, Radio, BookOpen, Target
} from 'lucide-react';
import { UserConfig } from '@/src/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'protocol' | 'cpr' | 'triage' | 'quiz';

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

// ─── Utility: Protocol Scene SVG ─────────────────────────────────────────────
function SceneSVG({ scene, pulse }: { scene: string; pulse: boolean }) {
  if (scene === 'danger') return (
    <svg viewBox="0 0 200 200" className="max-w-full max-h-full aspect-square">
      <rect x="0" y="180" width="200" height="20" fill="#0f172a" />
      <ellipse cx="100" cy="130" rx="60" ry="18" fill="#1e3a6e" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" />
      <circle cx="155" cy="118" r="16" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
      <polygon points="95,15 105,15 100,35 112,35 88,65 96,40 82,40" fill="#ef4444" opacity="0.9" />
      {pulse && <>
        <circle cx="120" cy="130" r="3" fill="#fbbf24" opacity="0.9"><animate attributeName="opacity" values="0;1;0" dur="0.4s" repeatCount="indefinite" /></circle>
        <circle cx="128" cy="122" r="2" fill="#ef4444" opacity="0.8"><animate attributeName="opacity" values="0;1;0" dur="0.3s" repeatCount="indefinite" /></circle>
      </>}
      <text x="100" y="192" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">DO NOT TOUCH — ISOLATE FIRST</text>
    </svg>
  );

  if (scene === 'isolate') return (
    <svg viewBox="0 0 200 200" className="max-w-full max-h-full aspect-square">
      <rect x="0" y="180" width="200" height="20" fill="#0f172a" />
      <rect x="10" y="30" width="40" height="70" rx="4" fill="#1e293b" stroke="#f97316" strokeWidth="2" />
      <rect x="22" y="60" width="16" height="28" rx="3" fill="#22c55e" stroke="#86efac" strokeWidth="1" />
      <text x="30" y="78" textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace">OFF</text>
      <circle cx="80" cy="60" r="14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
      <rect x="66" y="74" width="28" height="40" rx="6" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" />
      <line x1="66" y1="88" x2="38" y2="75" stroke="#1e40af" strokeWidth="10" strokeLinecap="round" />
      {pulse && <circle cx="30" cy="74" r="8" fill="none" stroke="#22c55e" strokeWidth="2"><animate attributeName="r" values="8;14;8" dur="1s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" /></circle>}
      <text x="100" y="192" textAnchor="middle" fill="#22c55e" fontSize="8" fontFamily="monospace">POWER ISOLATED SAFELY</text>
    </svg>
  );

  if (scene === 'call') return (
    <svg viewBox="0 0 200 200" className="max-w-full max-h-full aspect-square">
      <rect x="0" y="180" width="200" height="20" fill="#0f172a" />
      <rect x="82" y="20" width="36" height="60" rx="6" fill="#1e293b" stroke="#facc15" strokeWidth="2" />
      <circle cx="100" cy="72" r="4" fill="#facc15" opacity="0.8" />
      <text x="100" y="52" textAnchor="middle" fill="#facc15" fontSize="18">📞</text>
      {pulse && <>
        <path d="M 122 35 Q 135 50 122 65" fill="none" stroke="#facc15" strokeWidth="2"><animate attributeName="opacity" values="0.9;0;0.9" dur="1.2s" repeatCount="indefinite" /></path>
        <path d="M 130 26 Q 150 50 130 74" fill="none" stroke="#facc15" strokeWidth="2"><animate attributeName="opacity" values="0.7;0;0.7" dur="1.2s" begin="0.3s" repeatCount="indefinite" /></path>
      </>}
      <circle cx="70" cy="130" r="15" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
      <rect x="56" y="145" width="28" height="30" rx="6" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="100" y="192" textAnchor="middle" fill="#facc15" fontSize="8" fontFamily="monospace">CALL EMERGENCY SERVICES NOW</text>
    </svg>
  );

  if (scene === 'airway') return (
    <svg viewBox="0 0 200 200" className="max-w-full max-h-full aspect-square">
      <rect x="0" y="180" width="200" height="20" fill="#0f172a" />
      <ellipse cx="100" cy="130" rx="60" ry="20" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" />
      <circle cx="160" cy="118" r="16" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
      <path d="M 158 118 Q 166 118 170 124" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
      {pulse && <>
        <line x1="172" y1="113" x2="188" y2="106" stroke="#7dd3fc" strokeWidth="2"><animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" /></line>
        <line x1="175" y1="120" x2="192" y2="118" stroke="#7dd3fc" strokeWidth="2"><animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.4s" repeatCount="indefinite" /></line>
      </>}
      <text x="100" y="192" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontFamily="monospace">HEAD-TILT CHIN-LIFT — MAX 10s</text>
    </svg>
  );

  if (scene === 'cpr') return (
    <svg viewBox="0 0 200 200" className="max-w-full max-h-full aspect-square">
      <rect x="0" y="180" width="200" height="20" fill="#0f172a" />
      <ellipse cx="110" cy="120" rx="55" ry="18" fill="#1e3a6e" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" />
      <circle cx="162" cy="108" r="15" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="55" cy="88" r="14" fill="#f97316" stroke="#fb923c" strokeWidth="1.5" />
      <rect x="45" y="102" width="20" height="25" rx="4" fill="#f97316" />
      <line x1="60" y1="114" x2="108" y2={pulse ? '117' : '120'} stroke="#f97316" strokeWidth="10" strokeLinecap="round" />
      {pulse && <ellipse cx="108" cy="120" rx="20" ry="6" fill="none" stroke="#ef4444" strokeWidth="1.5"><animate attributeName="rx" values="20;36;20" dur="0.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0;0.8" dur="0.5s" repeatCount="indefinite" /></ellipse>}
      <text x="30" y="170" fill="#ef4444" fontSize="22">♥</text>
      <text x="100" y="192" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">30 COMPRESSIONS : 2 BREATHS</text>
    </svg>
  );

  if (scene === 'aed') return (
    <svg viewBox="0 0 200 200" className="max-w-full max-h-full aspect-square">
      <rect x="0" y="180" width="200" height="20" fill="#0f172a" />
      <rect x="10" y="30" width="55" height="70" rx="6" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
      <text x="37" y="55" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold" fontFamily="monospace">AED</text>
      <rect x="18" y="60" width="38" height="16" rx="3" fill="#22c55e" opacity="0.8" />
      <text x="37" y="72" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold" fontFamily="monospace">SHOCK</text>
      <line x1="65" y1="55" x2="112" y2="92" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,2" />
      <line x1="65" y1="75" x2="112" y2="130" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,2" />
      <rect x="102" y="82" width="22" height="18" rx="3" fill="#22c55e" opacity="0.8" />
      <rect x="102" y="122" width="22" height="18" rx="3" fill="#22c55e" opacity="0.8" />
      <ellipse cx="132" cy="120" rx="45" ry="16" fill="#1e3a6e" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" />
      {pulse && <polygon points="120,100 128,100 123,113 132,113 115,135 122,116 112,116" fill="#facc15" opacity="0.9"><animate attributeName="opacity" values="0.9;0;0.9" dur="0.6s" repeatCount="indefinite" /></polygon>}
      <text x="100" y="192" textAnchor="middle" fill="#22c55e" fontSize="8" fontFamily="monospace">STAND CLEAR — ANALYSING</text>
    </svg>
  );

  if (scene === 'recovery') return (
    <svg viewBox="0 0 200 200" className="max-w-full max-h-full aspect-square">
      <rect x="0" y="180" width="200" height="20" fill="#0f172a" />
      <ellipse cx="100" cy="135" rx="55" ry="15" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" />
      <circle cx="155" cy="122" r="15" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="40" cy="60" r="20" fill="#14532d" stroke="#22c55e" strokeWidth="2" />
      <polyline points="30,60 38,70 55,48" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
      {pulse && <ellipse cx="172" cy="115" rx="5" ry="3" fill="#7dd3fc" opacity="0.8"><animate attributeName="rx" values="5;9;5" dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0.2;0.8" dur="3s" repeatCount="indefinite" /></ellipse>}
      <text x="100" y="192" textAnchor="middle" fill="#22c55e" fontSize="8" fontFamily="monospace">BREATHING — RECOVERY POSITION</text>
    </svg>
  );

  if (scene === 'handover') return (
    <svg viewBox="0 0 200 200" className="max-w-full max-h-full aspect-square">
      <rect x="0" y="180" width="200" height="20" fill="#0f172a" />
      <rect x="10" y="90" width="80" height="50" rx="5" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
      <text x="50" y="125" textAnchor="middle" fill="white" fontSize="22">🚑</text>
      <circle cx="25" cy="143" r="7" fill="#334155" stroke="#64748b" strokeWidth="2" />
      <circle cx="75" cy="143" r="7" fill="#334155" stroke="#64748b" strokeWidth="2" />
      <rect x="130" y="40" width="50" height="80" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
      <rect x="147" y="52" width="16" height="40" rx="2" fill="#ef4444" opacity="0.8" />
      <rect x="135" y="64" width="40" height="16" rx="2" fill="#ef4444" opacity="0.8" />
      {pulse && <line x1="92" y1="120" x2="130" y2="90" stroke="#facc15" strokeWidth="2" strokeDasharray="5,3"><animate attributeName="strokeDashoffset" values="0;-16" dur="0.8s" repeatCount="indefinite" /></line>}
      <text x="100" y="192" textAnchor="middle" fill="#a78bfa" fontSize="8" fontFamily="monospace">HOSPITAL — 24hr CARDIAC MONITORING</text>
    </svg>
  );

  return (
    <svg viewBox="0 0 200 200" className="max-w-full max-h-full aspect-square">
      <rect x="0" y="180" width="200" height="20" fill="#0f172a" />
      <ellipse cx="100" cy="130" rx="60" ry="18" fill="#1e3a6e" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" />
      <circle cx="155" cy="118" r="16" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="55" cy="90" r="14" fill="#f97316" stroke="#fb923c" strokeWidth="1.5" />
      {pulse && <circle cx="100" cy="120" r="8" fill="none" stroke="#facc15" strokeWidth="2"><animate attributeName="r" values="8;18;8" dur="1s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" /></circle>}
      <text x="100" y="192" textAnchor="middle" fill="#facc15" fontSize="8" fontFamily="monospace">SHOUT — TAP — ASSESS RESPONSE</text>
    </svg>
  );
}

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

  const s = PROTOCOL_STEPS[step];
  const StepIcon = ICON_MAP[s.icon] || Shield;
  const totalTime = 4 * 60;
  const brainTimer = Math.max(0, totalTime - elapsed);
  const mm = String(Math.floor(brainTimer / 60)).padStart(2, '0');
  const ss = String(brainTimer % 60).padStart(2, '0');
  const isCritical = s.urgency === 'CRITICAL';

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className={`rounded-lg p-3 border flex flex-wrap items-center justify-between gap-2 ${isCritical ? 'border-red-500/50 bg-red-500/10' : 'border-slate-700 bg-slate-800/60'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-400' : 'bg-orange-400'} transition-opacity`} style={{ opacity: pulse ? 1 : 0.1 }} />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            Step {step + 1} of {PROTOCOL_STEPS.length} — {s.urgency}
          </span>
        </div>
        {step < 6 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Brain safe window</span>
            <span className={`font-mono font-black text-sm ${brainTimer < 60 ? 'text-red-400' : brainTimer < 120 ? 'text-orange-400' : 'text-green-400'}`}>{mm}:{ss}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto lg:overflow-y-hidden">
        <div className={`rounded-xl border ${s.borderColor} ${s.bgColor} flex items-center justify-center p-2 lg:p-4 min-h-[140px] lg:min-h-[200px] h-[160px] lg:h-auto overflow-hidden`}>
          <div className="w-full h-full flex items-center justify-center min-h-0 overflow-hidden">
            <SceneSVG scene={s.scene} pulse={pulse} />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:overflow-y-auto lg:min-h-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StepIcon className={`w-5 h-5 ${s.color}`} />
              <span className={`text-xs font-black tracking-widest uppercase font-mono ${s.color}`}>Step {s.id}</span>
            </div>
            <h3 className="text-lg font-black text-white tracking-wide">{s.title}</h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase">{s.standard}</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{s.instruction}</p>
          <div className={`rounded-lg border ${s.borderColor} p-3 space-y-1.5`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Checklist</span>
            {s.actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${s.color}`} />
                <span className="text-xs text-slate-300 leading-relaxed">{a}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Fatal Mistake</span>
            </div>
            <p className="text-xs text-red-300 leading-relaxed">{s.fatal_mistake}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold">
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5 overflow-x-auto">
          {PROTOCOL_STEPS.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={`rounded-full transition-all flex-shrink-0 ${i === step ? 'bg-orange-500 w-5 h-2' : 'bg-slate-600 hover:bg-slate-500 w-2 h-2'}`} />
          ))}
        </div>
        {step < PROTOCOL_STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-sm transition-all shadow-orange-500/30 shadow-lg">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setStep(0)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-black text-sm transition-all">
            <RotateCcw className="w-4 h-4" /> Restart
          </button>
        )}
      </div>
    </div>
  );
}

function CPRTrainer() {
  const [isRunning, setIsRunning] = useState(false);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [userBPM, setUserBPM] = useState<number | null>(null);
  const [phase, setPhase] = useState<'compress' | 'release'>('release');
  const [breathPhase, setBreathPhase] = useState(false);
  const [compCount, setCompCount] = useState(0);
  const TARGET_BPM = 110;
  const INTERVAL_MS = Math.round(60000 / TARGET_BPM);

  useEffect(() => {
    if (!isRunning) { setPhase('release'); return; }
    const t = setInterval(() => {
      setCompCount(c => {
        const next = c + 1;
        if (next % 30 === 0) { setBreathPhase(true); setTimeout(() => setBreathPhase(false), 1200); }
        return next;
      });
      setPhase('compress');
      setTimeout(() => setPhase('release'), INTERVAL_MS * 0.4);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, [isRunning, INTERVAL_MS]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    setTapTimes(prev => {
      const updated = [...prev, now].slice(-8);
      if (updated.length >= 2) {
        const gaps = updated.slice(1).map((t, i) => t - updated[i]);
        setUserBPM(Math.round(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length)));
      }
      return updated;
    });
  }, []);

  const bpmDelta = userBPM ? userBPM - TARGET_BPM : null;
  const bpmLabel = bpmDelta === null ? null
    : bpmDelta < -15 ? { text: 'Too Slow — Speed Up!', color: 'text-red-400' }
    : bpmDelta > 15 ? { text: 'Too Fast — Slow Down!', color: 'text-orange-400' }
    : Math.abs(bpmDelta) <= 10 ? { text: '✓ Perfect Rhythm!', color: 'text-green-400' }
    : { text: 'Almost There', color: 'text-yellow-400' };

  const cyclePos = compCount % 30;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="rounded-xl border border-red-500/40 bg-red-500/5 flex flex-col items-center justify-center p-6 gap-5">
          <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
            {isRunning && phase === 'compress' && (
              <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-50" />
            )}
            <div className="rounded-2xl border-4 flex items-center justify-center transition-all duration-100"
              style={{
                width: isRunning && phase === 'compress' ? 108 : 130,
                height: isRunning && phase === 'compress' ? 92 : 114,
                background: breathPhase ? 'rgba(56,189,248,0.18)' : 'rgba(239,68,68,0.13)',
                borderColor: breathPhase ? 'rgba(56,189,248,0.6)' : 'rgba(239,68,68,0.5)',
              }}>
              <HeartPulse style={{ width: isRunning && phase === 'compress' ? 38 : 46, height: isRunning && phase === 'compress' ? 38 : 46, color: breathPhase ? '#7dd3fc' : '#ef4444', transition: 'all 0.1s' }} />
            </div>
          </div>

          {breathPhase ? (
            <div className="text-sky-400 font-black text-lg animate-pulse text-center">RESCUE BREATH ×2</div>
          ) : (
            <div className="text-center">
              <div className="text-red-400 font-black text-3xl font-mono">{cyclePos + 1} <span className="text-slate-500 text-xl">/ 30</span></div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Compressions</div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="text-center"><div className="text-3xl font-black font-mono text-white">{TARGET_BPM}</div><div className="text-[10px] text-slate-500 uppercase tracking-widest">Target BPM</div></div>
            <div className="text-slate-600 text-xl">vs</div>
            <div className="text-center"><div className={`text-3xl font-black font-mono ${userBPM ? (bpmLabel?.color || 'text-white') : 'text-slate-600'}`}>{userBPM ?? '—'}</div><div className="text-[10px] text-slate-500 uppercase tracking-widest">Your BPM</div></div>
          </div>

          {bpmLabel && <div className={`text-sm font-black ${bpmLabel.color} tracking-wide`}>{bpmLabel.text}</div>}

          <div className="flex gap-3 w-full">
            <button onClick={() => { setIsRunning(r => !r); setCompCount(0); }} className={`flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${isRunning ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg'}`}>
              {isRunning ? '⏹ Stop' : '▶ Start'}
            </button>
            <button onClick={handleTap} className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 transition-all shadow-lg">
              TAP BEAT
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto">
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-black uppercase tracking-widest text-orange-400">AHA BLS 2024 — CPR Standards</span>
            </div>
            {[
              { label: 'Compression Rate', value: '100–120 BPM', note: 'Use Stayin Alive by Bee Gees as a mental metronome' },
              { label: 'Compression Depth', value: '5–6 cm', note: 'At least 2 inches — full weight through straight arms' },
              { label: 'Chest Recoil', value: 'Full recoil between compressions', note: 'Do not lean — allows heart to fill with blood' },
              { label: 'Ratio', value: '30 compressions : 2 breaths', note: 'Interruptions must not exceed 10 seconds' },
              { label: 'Rescue Breaths', value: '1 second each', note: 'Avoid excessive ventilation — causes gastric inflation' },
            ].map(item => (
              <div key={item.label} className="py-2 border-b border-slate-700/60 last:border-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{item.label}</span>
                  <span className="text-sm font-black text-white font-mono">{item.value}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.note}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">Electrical Injury CPR Notes</span>
            </div>
            <ul className="space-y-2">
              {[
                'Electrical cardiac arrest often presents as ventricular fibrillation — AED is highly effective.',
                'Young victims of electrical shock have high survival rates with early, high-quality CPR — do not give up.',
                'Tetanic muscle contraction during shock may cause falls — always check for trauma injuries.',
                'CPR quality for electrical victims is identical to standard cardiac arrest protocol.',
              ].map((note, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">›</span>
                  <span className="text-xs text-amber-200/80 leading-relaxed">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function TriagePanel() {
  const [selected, setSelected] = useState<TriageZone | null>(null);

  const riskStyles = (r: TriageZone['risk']) =>
    r === 'critical' ? { fill: 'rgba(239,68,68,0.3)', stroke: '#ef4444', text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10', badge: 'bg-red-500 text-white' }
    : r === 'high' ? { fill: 'rgba(249,115,22,0.28)', stroke: '#f97316', text: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-500/10', badge: 'bg-orange-500 text-white' }
    : { fill: 'rgba(234,179,8,0.22)', stroke: '#eab308', text: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', badge: 'bg-yellow-500 text-slate-950' };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
        <p className="text-xs text-slate-400"><span className="font-bold text-slate-300">Shock Triage Tool:</span> Click a body zone to assess organ damage risk along that current path, based on IEC 60479-1 biological effects data.</p>
      </div>
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

  const TABS: { id: TabId; label: string; sublabel: string; icon: React.ElementType; activeBg: string }[] = [
    { id: 'protocol', label: 'Emergency Protocol', sublabel: '9-Step Response', icon: AlertTriangle, activeBg: 'bg-red-650 border-red-500' },
    { id: 'cpr', label: 'CPR Trainer', sublabel: 'Metronome + Rate', icon: HeartPulse, activeBg: 'bg-red-700 border-red-600' },
    { id: 'triage', label: 'Shock Triage', sublabel: 'Body Zone Risk Map', icon: Thermometer, activeBg: 'bg-orange-600 border-orange-500' },
    { id: 'quiz', label: 'Scenario Quiz', sublabel: '10 Clinical Cases', icon: Brain, activeBg: 'bg-purple-700 border-purple-500' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center flex-shrink-0">
            <HeartPulse className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black uppercase tracking-wider text-white leading-none">First Aid & Emergency Response</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Electrical Injury Protocol — AHA BLS 2024 · ERC 2021 · IEC 60479-1</p>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left flex-shrink-0 transition-all ${isActive ? `${tab.activeBg} text-white` : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'}`}>
                <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wide leading-none">{tab.label}</div>
                  <div className={`text-[9px] font-mono leading-none mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-600'}`}>{tab.sublabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-3 md:p-4 min-h-0 flex flex-col">
        {activeTab === 'protocol' && <ProtocolModule />}
        {activeTab === 'cpr' && <CPRTrainer />}
        {activeTab === 'triage' && <TriagePanel />}
        {activeTab === 'quiz' && <ScenarioQuiz />}
      </div>
    </div>
  );
}

