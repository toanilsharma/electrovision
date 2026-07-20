import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle, ShieldCheck, Footprints, Zap, BookOpen, Target,
  ChevronRight, ChevronLeft, RotateCcw, Activity, Layers,
  Map, Eye, CheckCircle2, XCircle, HelpCircle, Info,
  ArrowRight, Wind, Mountain, CloudRain, TrendingDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig } from '@/src/types';
import { EmergencyResponse } from '../EmergencyResponse';
import { PPEValidator } from '../PPEValidator';

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
const SOIL_DATA: Record<SoilType, { label: string; resistivity: number; color: string; desc: string }> = {
  dry_gravel:  { label: 'Dry Gravel',  resistivity: 3000, color: '#78716c', desc: 'High resistivity — moderate natural protection' },
  dry_sand:    { label: 'Dry Sand',    resistivity: 1500, color: '#d4b483', desc: 'Medium resistivity — reduced step voltage danger' },
  concrete:    { label: 'Wet Concrete',resistivity: 200,  color: '#64748b', desc: 'Low resistivity — significantly more hazardous' },
  wet_soil:    { label: 'Wet Soil',    resistivity: 50,   color: '#4ade80', desc: 'Very low resistivity — MOST hazardous surface' },
};

const QUIZ_QUESTIONS: QuizQ[] = [
  {
    question: 'What is "Step Potential"?',
    options: [
      'The voltage between your hands when touching a conductor',
      'The voltage difference between two feet placed 1 metre apart on the ground',
      'The electric potential of a substation transformer',
      'The potential required to trigger a circuit breaker'
    ],
    correct: 1,
    explanation: 'Step potential (E_step) is the voltage difference across the ground between two points 1 m apart — the standard human stride length. It drives current up one leg and down the other, risking cardiac fibrillation.',
  },
  {
    question: 'Which safe escape technique is recommended when escaping a step potential zone?',
    options: [
      'Run as fast as possible in any direction',
      'Shuffle with small steps, keeping feet together',
      'Jump with both feet together away from the fault',
      'Lie flat on the ground and roll away'
    ],
    correct: 2,
    explanation: 'Jumping with both feet together (bunny-hopping) eliminates the step potential between your feet. If that is not possible, shuffle with tiny steps keeping feet as close together as possible.',
  },
  {
    question: 'According to IEEE 80, what is the standard stride length used to calculate step potential?',
    options: ['0.5 metres', '0.75 metres', '1.0 metre', '1.5 metres'],
    correct: 2,
    explanation: 'IEEE 80 uses 1.0 m as the standard stride length for step potential calculations, representing the maximum distance between a person\'s two feet during normal walking.',
  },
  {
    question: 'Touch potential is generally MORE dangerous than step potential because:',
    options: [
      'The voltage is always higher',
      'It bypasses soil resistivity and creates a direct hand-to-foot path through the body',
      'It causes more external burns',
      'It lasts longer in time'
    ],
    correct: 1,
    explanation: 'Touch potential creates a current path from hand to foot through the heart. This bypasses the natural soil resistivity buffer, delivering far more current through the cardiac region than step potential.',
  },
  {
    question: 'Which PPE is MOST effective against step/touch potential hazards?',
    options: [
      'Hard hat and high-vis jacket',
      'Insulated rubber gloves only',
      'Dielectric (Class E) safety boots rated for the full voltage',
      'Safety glasses and a face shield'
    ],
    correct: 2,
    explanation: 'Dielectric safety boots (ASTM F2413 / IEC 61111) rated for the expected voltage break the current path between your feet and the energised ground surface, providing the most effective protection against step potential.',
  },
  {
    question: 'If soil resistivity INCREASES, the step potential hazard zone:',
    options: [
      'Becomes larger and more dangerous',
      'Becomes smaller and safer',
      'Remains unchanged',
      'Moves further from the fault point'
    ],
    correct: 1,
    explanation: 'Higher soil resistivity means more resistance per unit of ground path, so the voltage dissipates more gradually over distance. The hazard zone shrinks faster. Wet, low-resistivity soil is the worst case — voltage stays high over a large area.',
  },
  {
    question: 'The IEEE 80 allowable step potential limit formula uses which body weight as reference?',
    options: ['50 kg', '70 kg', '80 kg', '100 kg'],
    correct: 1,
    explanation: 'IEEE 80 uses 70 kg (154 lb) as the reference body mass for calculating allowable touch and step potential limits: E_step = (1000 + 6·Cs·ρs) × 0.116/√ts',
  },
  {
    question: 'What is the minimum safe distance from a fallen 11kV power line on wet soil?',
    options: ['1 metre', '3 metres', '8 metres or more', 'Any distance with rubber boots'],
    correct: 2,
    explanation: 'On wet soil (low resistivity), voltage gradients extend much further from the fault point. Utilities and safety standards recommend staying at least 8–10 m away from downed high-voltage lines on conductive surfaces — even further if possible.',
  },
];

const LEARN_SECTIONS = [
  {
    id: 'what',
    icon: BookOpen,
    title: 'What is Step & Touch Potential?',
    color: 'orange',
    content: [
      { heading: 'Step Potential', text: 'When current flows into the earth from a fault (e.g. a fallen power line), it spreads outward in concentric semicircles. The earth surface potential is highest near the fault and decreases with distance. If you stand with your feet apart in this gradient zone, a voltage difference exists between your two feet — this is Step Potential. Current flows up one leg and down the other, passing through your lower torso and potentially your heart.' },
      { heading: 'Touch Potential', text: 'If you touch a faulted structure (e.g. a metal pole that has become energised) while standing on the ground, the voltage difference between your hand and your feet drives current directly through your heart. This is Touch Potential. It is typically more lethal than step potential because the current path passes directly through the cardiac region.' },
      { heading: 'Ground Potential Rise (GPR)', text: 'The overall elevation of the ground surface\'s electric potential above a remote earth reference, caused by the fault current flowing through the earth resistance. IEEE 80 defines all step and touch potential hazards relative to GPR.' },
    ]
  },
  {
    id: 'formula',
    icon: Activity,
    title: 'IEEE 80 Physics Engine',
    color: 'cyan',
    content: [
      { heading: 'Step Voltage Formula', text: 'E_step(x) = V(x) − V(x+1)\nwhere V(x) = (ρ·I_f) / (2π·x)\n\nρ = soil resistivity (Ω·m), I_f = fault current (A), x = distance from fault (m)' },
      { heading: 'Allowable Step Limit', text: 'E_step_limit = (1000 + 6·Cs·ρs) × (0.116 / √ts)\n\nCs = ground derating factor (0.85), ρs = surface resistivity, ts = fault clearing time (s)' },
      { heading: 'Allowable Touch Limit', text: 'E_touch_limit = (1000 + 1.5·Cs·ρs) × (0.116 / √ts)\n\nTouch limit is stricter (coefficient 1.5 vs 6) because the current path crosses the heart.' },
      { heading: 'Fibrillation Threshold', text: 'As little as 50–100 mA through the heart for > 3 seconds can trigger ventricular fibrillation. Even momentary contact at high potentials can exceed this threshold.' },
    ]
  },
  {
    id: 'zones',
    icon: Layers,
    title: 'Voltage Gradient Zones',
    color: 'red',
    content: [
      { heading: 'Critical Zone (0–2 m)', text: 'DANGER: Touch potential is the dominant hazard. Any conductive structure within this zone is energised. Survival time can be measured in seconds. NO entry without confirmed isolation.' },
      { heading: 'High Hazard Zone (2–5 m)', text: 'WARNING: Step potential can still exceed allowable limits on wet or low-resistivity surfaces. Shuffling movement and dielectric footwear are mandatory.' },
      { heading: 'Caution Zone (5–10 m)', text: 'CAUTION: Step potential is below limits on most soil types, but wet soil or high fault currents may still pose a risk. Stay alert and wear appropriate footwear.' },
      { heading: 'Safe Zone (> 10 m)', text: 'Generally safe from step/touch hazards, but always maintain situational awareness. For industrial HV systems, the safe distance may extend further.' },
    ]
  },
  {
    id: 'standards',
    icon: Target,
    title: 'Applicable Standards',
    color: 'purple',
    content: [
      { heading: 'IEEE 80-2013', text: 'Guide for Safety in AC Substation Grounding — the primary standard for step and touch potential calculations, grounding system design, and safe limits for 70 kg body mass.' },
      { heading: 'IEC 60479-1', text: 'Effects of Current on Human Beings and Livestock — defines current thresholds for perception, let-go, ventricular fibrillation, and cardiac arrest based on exposure duration.' },
      { heading: 'AS/NZS 3000 / BS 7671', text: 'National wiring rules referencing earthing system design principles that minimise step/touch potential hazards in earthed systems.' },
      { heading: 'OSHA 29 CFR 1910.269', text: 'Electrical Power Generation, Transmission, and Distribution — requires employers to assess step and touch potential hazards and protect workers accordingly.' },
    ]
  },
];

const ESCAPE_STEPS = [
  {
    num: 1,
    icon: Eye,
    title: 'STOP & ASSESS',
    color: 'red',
    instruction: 'Freeze immediately. Do NOT take normal walking steps. Look for the fault source — a fallen line, sparking equipment, or smoking pole.',
    warning: 'Every normal footstep in a step potential zone can be lethal. Stop first.',
    tip: 'If you feel a tingling or prickling sensation in your feet, you ARE in a step potential zone.',
  },
  {
    num: 2,
    icon: Wind,
    title: 'CALL FOR HELP',
    color: 'orange',
    instruction: 'Shout "ELECTRICAL HAZARD — STAY BACK!" to warn bystanders. If you have a phone, call emergency services immediately without moving. Give your location.',
    warning: 'Do not wave your arms — this disrupts your balance needed for safe escape.',
    tip: 'If others can hear you, guide them to call 000 / 999 / 911 without approaching you.',
  },
  {
    num: 3,
    icon: Footprints,
    title: 'BUNNY HOP OUT',
    color: 'yellow',
    instruction: 'Jump with BOTH FEET TOGETHER away from the fault. Land with both feet simultaneously. Repeat until you are at least 10 metres from the fault source.',
    warning: 'Never shuffle with feet far apart. The voltage gradient between widely spaced feet is deadly.',
    tip: 'If jumping is impossible (injury, slippery surface), shuffle with tiny steps keeping feet as close together as possible — always moving AWAY from the fault.',
  },
  {
    num: 4,
    icon: Map,
    title: 'ESCAPE DIRECTION',
    color: 'green',
    instruction: 'Move RADIALLY away from the fault — perpendicular to the voltage gradient contour lines, i.e. directly away from the downed line or pole. Do NOT move parallel to the line.',
    warning: 'Moving parallel to a downed power line keeps you in the hazard zone even if you feel you are moving away.',
    tip: 'Imagine the fault as the centre of a bullseye. Always escape outward from the bullseye.',
  },
  {
    num: 5,
    icon: ShieldCheck,
    title: 'SAFE ZONE & REPORT',
    color: 'cyan',
    instruction: 'Once at least 10 m from the fault, call emergency services and utility provider. Establish a safety cordon (barrier tape, cones) to keep others away. Do NOT re-enter the zone.',
    warning: 'The ground may appear safe but remain energised until utility crews confirm de-energisation.',
    tip: 'Stay at least 10 m from the fallen line. For 66 kV or above, stay at least 20 m away.',
  },
];

// ─── Voltage Gradient SVG ─────────────────────────────────────────────────────
function VoltageGradientSVG({
  distance, soilResistivity, sourceVoltage, faultCurrent, isInDanger,
  isTouchZone, isPPESafe, isRaining
}: {
  distance: number; soilResistivity: number; sourceVoltage: number;
  faultCurrent: number; isInDanger: boolean; isTouchZone: boolean;
  isPPESafe: boolean; isRaining: boolean;
}) {
  const faultX = 60;
  const groundY = 175;
  const scaleX = (m: number) => faultX + m * 14;
  const personX = scaleX(distance);

  const calcVoltage = (x: number) => {
    if (x <= 0.3) return sourceVoltage * 0.95;
    return Math.min(sourceVoltage * 0.9, (soilResistivity * faultCurrent) / (2 * Math.PI * x));
  };

  // Generate voltage gradient curve points
  const curvePoints = [];
  for (let x = 0.1; x <= 15; x += 0.3) {
    const v = calcVoltage(x);
    const svgX = scaleX(x);
    const svgY = groundY - (v / sourceVoltage) * 100;
    if (svgX <= 270) curvePoints.push(`${svgX},${Math.max(svgY, 30)}`);
  }
  const curvePath = `M ${curvePoints.join(' L ')}`;

  const v1 = calcVoltage(distance);
  const gradientBarH = Math.max(5, (v1 / sourceVoltage) * 100);
  const personColor = isInDanger && !isPPESafe ? '#ef4444' : isPPESafe ? '#22d3ee' : '#4ade80';

  return (
    <svg viewBox="0 0 300 210" className="w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="faultGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
          <stop offset="30%" stopColor="#facc15" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#22c55e" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="redGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Ground surface */}
      <rect x="30" y={groundY} width="260" height="35" fill="url(#groundGrad)" rx="2" opacity="0.5" />
      <line x1="30" y1={groundY} x2="290" y2={groundY} stroke="rgba(100,116,139,0.4)" strokeWidth="1" />

      {/* Rain drops */}
      {isRaining && Array.from({ length: 10 }).map((_, i) => (
        <motion.line
          key={i}
          x1={40 + i * 25} y1={20} x2={38 + i * 25} y2={35}
          stroke="#38bdf8" strokeWidth="1" opacity="0.6"
          animate={{ y: [0, groundY - 20], opacity: [0.6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08 }}
        />
      ))}

      {/* Voltage gradient concentric zones */}
      {[2, 5, 10].map((zoneM, i) => {
        const zoneX = scaleX(zoneM);
        const colors = ['rgba(239,68,68,0.12)', 'rgba(234,179,8,0.08)', 'rgba(34,197,94,0.05)'];
        return zoneX <= 280 ? (
          <rect key={i} x={faultX} y={30} width={zoneX - faultX} height={groundY - 30}
            fill={colors[i]} />
        ) : null;
      })}

      {/* Zone labels */}
      <text x={faultX + 4} y={45} fontSize="5" fill="rgba(239,68,68,0.8)" fontWeight="bold">CRITICAL</text>
      <text x={faultX + 4} y={52} fontSize="5" fill="rgba(239,68,68,0.8)">0–2 m</text>
      <text x={scaleX(2) + 4} y={45} fontSize="5" fill="rgba(234,179,8,0.8)" fontWeight="bold">HIGH RISK</text>
      <text x={scaleX(2) + 4} y={52} fontSize="5" fill="rgba(234,179,8,0.8)">2–5 m</text>
      <text x={scaleX(5) + 4} y={45} fontSize="5" fill="rgba(34,197,94,0.8)" fontWeight="bold">CAUTION</text>
      <text x={scaleX(5) + 52} y={52} fontSize="5" fill="rgba(34,197,94,0.8)">5–10 m</text>

      {/* Zone boundary lines */}
      {[2, 5, 10].map((zoneM, i) => {
        const zoneX = scaleX(zoneM);
        const colors = ['rgba(239,68,68,0.4)', 'rgba(234,179,8,0.3)', 'rgba(34,197,94,0.2)'];
        return zoneX <= 280 ? (
          <line key={i} x1={zoneX} y1={30} x2={zoneX} y2={groundY}
            stroke={colors[i]} strokeWidth="0.5" strokeDasharray="3 2" />
        ) : null;
      })}

      {/* Voltage gradient curve */}
      <path d={curvePath} fill="none" stroke="rgba(249,115,22,0.7)" strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 0 3px rgba(249,115,22,0.5))' }} />
      <path d={curvePath + ` L ${scaleX(Math.min(15, 20))},${groundY} L ${faultX},${groundY} Z`}
        fill="rgba(249,115,22,0.07)" />

      {/* Fault point glow */}
      <circle cx={faultX} cy={groundY} r="18" fill="url(#faultGlow)" />
      <motion.circle cx={faultX} cy={groundY} r="6" fill="none" stroke="#f97316" strokeWidth="1.5"
        animate={{ r: [6, 22], opacity: [0.9, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }} />

      {/* Fault source — downed power line */}
      <line x1={faultX} y1={30} x2={faultX} y2={groundY} stroke="#475569" strokeWidth="4" />
      <line x1={faultX - 18} y1={38} x2={faultX + 18} y2={38} stroke="#475569" strokeWidth="3" />
      {/* Downed wire */}
      <motion.path d={`M ${faultX + 18} 38 Q ${faultX + 10} 120 ${faultX} ${groundY}`}
        fill="none" stroke="#f97316" strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 0 4px #f97316)' }}
        animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
      <text x={faultX - 12} y={28} fontSize="5.5" fill="#f97316" fontWeight="bold">FAULT</text>

      {/* Person */}
      {personX <= 280 && (
        <g>
          {/* Step voltage indicator line under feet */}
          {!isTouchZone && isInDanger && !isPPESafe && (
            <motion.line
              x1={personX - 5} y1={groundY} x2={personX + 5} y2={groundY}
              stroke="#ef4444" strokeWidth="3"
              animate={{ opacity: [1, 0] }} transition={{ duration: 0.2, repeat: Infinity }}
              style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }}
            />
          )}
          {/* PPE boots indicator */}
          {isPPESafe && (
            <rect x={personX - 6} y={groundY - 3} width="12" height="4"
              fill="rgba(34,211,238,0.4)" rx="2"
              style={{ filter: 'drop-shadow(0 0 4px #22d3ee)' }} />
          )}

          {/* Person body */}
          <circle cx={personX} cy={groundY - 26} r="5"
            fill={personColor} opacity="0.9"
            style={{ filter: isInDanger && !isPPESafe ? 'drop-shadow(0 0 4px #ef4444)' : undefined }} />
          {/* Torso */}
          <line x1={personX} y1={groundY - 21} x2={personX} y2={groundY - 9}
            stroke={personColor} strokeWidth="2" strokeLinecap="round" />
          {/* Arms */}
          {isTouchZone ? (
            <>
              {/* Touch arm reaching to pole */}
              <line x1={personX} y1={groundY - 18} x2={faultX + 4} y2={groundY - 18}
                stroke={isInDanger && !isPPESafe ? '#ef4444' : personColor} strokeWidth="1.5" strokeLinecap="round" />
              <line x1={personX} y1={groundY - 18} x2={personX + 5} y2={groundY - 14}
                stroke={personColor} strokeWidth="1.5" strokeLinecap="round" />
              {/* Touch current path */}
              {isInDanger && !isPPESafe && (
                <motion.path d={`M ${faultX + 4} ${groundY - 18} L ${personX} ${groundY - 18} L ${personX} ${groundY}`}
                  fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2"
                  animate={{ opacity: [1, 0] }} transition={{ duration: 0.25, repeat: Infinity }}
                  style={{ filter: 'drop-shadow(0 0 4px #f97316)' }} />
              )}
            </>
          ) : (
            <>
              <line x1={personX - 4} y1={groundY - 18} x2={personX} y2={groundY - 15}
                stroke={personColor} strokeWidth="1.5" strokeLinecap="round" />
              <line x1={personX + 4} y1={groundY - 18} x2={personX} y2={groundY - 15}
                stroke={personColor} strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
          {/* Legs */}
          <line x1={personX} y1={groundY - 9} x2={personX - 5} y2={groundY}
            stroke={personColor} strokeWidth="2" strokeLinecap="round" />
          <line x1={personX} y1={groundY - 9} x2={personX + 5} y2={groundY}
            stroke={personColor} strokeWidth="2" strokeLinecap="round" />

          {/* Distance label */}
          <text x={personX} y={groundY + 14} fontSize="6" fill={personColor} textAnchor="middle"
            fontWeight="bold">{distance}m</text>
          {/* Voltage bar next to person */}
          <rect x={personX + 8} y={groundY - gradientBarH} width="4" height={gradientBarH}
            fill={`rgba(249,115,22,${Math.min(0.9, v1 / sourceVoltage + 0.1)})`} rx="1" />

          {/* Step potential arc under feet */}
          {!isTouchZone && (
            <path d={`M ${personX - 5} ${groundY} Q ${personX} ${groundY - 8} ${personX + 5} ${groundY}`}
              fill="none"
              stroke={isInDanger && !isPPESafe ? 'rgba(239,68,68,0.6)' : 'rgba(34,197,94,0.4)'}
              strokeWidth="1" />
          )}
        </g>
      )}

      {/* Distance ruler */}
      <line x1={faultX} y1={groundY + 22} x2={290} y2={groundY + 22} stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
      {[0, 2, 5, 10, 15].map(m => {
        const rx = scaleX(m);
        return rx <= 290 ? (
          <g key={m}>
            <line x1={rx} y1={groundY + 20} x2={rx} y2={groundY + 25} stroke="rgba(100,116,139,0.5)" strokeWidth="0.5" />
            <text x={rx} y={groundY + 31} fontSize="5" fill="rgba(100,116,139,0.7)" textAnchor="middle">{m}m</text>
          </g>
        ) : null;
      })}

      {/* Axis label */}
      <text x={290} y={groundY - 2} fontSize="5" fill="rgba(249,115,22,0.6)" textAnchor="end">V(x)</text>
      <text x={290} y={groundY + 31} fontSize="5" fill="rgba(100,116,139,0.6)" textAnchor="end">Distance →</text>
    </svg>
  );
}

// ─── Escape Animation ─────────────────────────────────────────────────────────
function EscapeAnimation({ step }: { step: number }) {
  return (
    <svg viewBox="0 0 200 85" className="w-full max-w-[500px] mx-auto h-auto aspect-[200/85]">
      <defs>
        <radialGradient id="faultEscGlow" cx="20%" cy="80%" r="30%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Ground */}
      <rect x="0" y="65" width="200" height="20" fill="#1e293b" />
      <line x1="0" y1="65" x2="200" y2="65" stroke="rgba(203, 213, 225, 0.9)" strokeWidth="1.5" />
      
      {/* Fault source */}
      <circle cx="20" cy="65" r="14" fill="url(#faultEscGlow)" />
      <motion.circle cx="20" cy="65" r="4" fill="none" stroke="#f97316" strokeWidth="1.5"
        animate={{ r: [4, 22], opacity: [1, 0] }} transition={{ duration: 1, repeat: Infinity }} />
      <line x1="20" y1="12" x2="20" y2="65" stroke="#e2e8f0" strokeWidth="3" />
      
      {/* Spark star shape at ground point */}
      <motion.polygon
        points="20,60 22,63 26,63 23,65 24,69 20,67 16,69 17,65 14,63 18,63"
        fill="#facc15"
        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        style={{ originX: "20px", originY: "65px" }}
      />

      {/* Zone rings with high contrast */}
      {[25, 65, 125].map((r, i) => (
        <circle key={i} cx="20" cy="65" r={r} fill="none"
          stroke={['rgba(248,113,113,0.9)', 'rgba(253,224,71,0.8)', 'rgba(74,222,128,0.75)'][i]}
          strokeWidth="1.5" strokeDasharray="3.5 2" />
      ))}

      {/* Person escaping - moves right (away from fault) */}
      <motion.g
        animate={{
          x: step === 0 ? 0 : step === 1 ? 0 : step === 2 ? 45 : step === 3 ? 90 : 130,
          y: (step === 2 || step === 3) ? [0, -12, 0] : 0
        }}
        transition={(step === 2 || step === 3) ? {
          x: { duration: 0.8 },
          y: { repeat: Infinity, duration: 0.6, ease: "easeOut" }
        } : { duration: 0.8 }}>
        
        {/* Head, torso */}
        <circle cx="45" cy="42" r="4" fill="#4ade80" stroke="#1e293b" strokeWidth="0.5" />
        <line x1="45" y1="46" x2="45" y2="56" stroke="#4ade80" strokeWidth="2.5" />
        
        {/* Dynamic arms based on step */}
        {step === 1 ? (
          <>
            {/* Arms raised calling for help */}
            <line x1="45" y1="50" x2="38" y2="42" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
            <line x1="45" y1="50" x2="52" y2="42" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Arms down */}
            <line x1="45" y1="50" x2="40" y2="55" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
            <line x1="45" y1="50" x2="50" y2="55" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* Feet kept tightly together */}
        <line x1="44" y1="56" x2="44" y2="65" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="46" y1="56" x2="46" y2="65" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />

        {/* Jump indicator */}
        {(step === 2 || step === 3) && (
          <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
            <line x1="38" y1="62" x2="52" y2="62" stroke="#4ade80" strokeWidth="1.5" />
            <text x="45" y="32" fontSize="8" fill="#22c55e" textAnchor="middle" fontWeight="black" stroke="#000" strokeWidth="0.5" paintOrder="stroke">BUNNY HOP!</text>
          </motion.g>
        )}
      </motion.g>

      {/* Labels */}
      <text x="20" y="8" fontSize="10" fill="#f97316" textAnchor="middle" fontWeight="black" stroke="#000" strokeWidth="0.5" paintOrder="stroke">FAULT</text>
      <text x="20" y="78" fontSize="9" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">0m</text>
      <text x="145" y="78" fontSize="9" fill="#4ade80" textAnchor="middle" fontWeight="bold" stroke="#000" strokeWidth="0.5" paintOrder="stroke">SAFE ≥10m →</text>
    </svg>
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
    const grade = pct >= 90 ? { label: 'Expert', color: 'text-cyan-400', icon: '🏆' }
      : pct >= 70 ? { label: 'Proficient', color: 'text-green-400', icon: '✅' }
      : pct >= 50 ? { label: 'Developing', color: 'text-yellow-400', icon: '📚' }
      : { label: 'Needs Review', color: 'text-red-400', icon: '⚠️' };
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-6 py-8 text-center">
        <div className="text-5xl">{grade.icon}</div>
        <div>
          <p className={cn("text-3xl font-black mb-1", grade.color)}>{score}/{QUIZ_QUESTIONS.length}</p>
          <p className={cn("text-lg font-bold uppercase tracking-widest", grade.color)}>{grade.label}</p>
          <p className="text-slate-400 text-sm mt-2">{pct}% correct — {pct >= 70 ? 'You understand step & touch potential hazards!' : 'Review the Learn section to improve your knowledge.'}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2 bg-orange-500/20 border border-orange-500/50 rounded-lg text-orange-400 text-xs font-bold uppercase tracking-wider hover:bg-orange-500/30 transition-colors cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" /> Retry Quiz
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-orange-500 rounded-full"
            animate={{ width: `${((current + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
            transition={{ duration: 0.3 }} />
        </div>
        <span className="text-[10px] font-mono text-slate-400">{current + 1}/{QUIZ_QUESTIONS.length}</span>
        <span className="text-[10px] font-mono text-green-400">{score} pts</span>
      </div>

      {/* Question */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
        <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400 mb-1">Question {current + 1}</p>
        <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
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
              className={cn('w-full flex items-center gap-3 p-3 rounded-lg border text-left text-xs transition-all', style,
                !isAnswered && 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]',
                isAnswered && 'cursor-default')}>
              <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0",
                isAnswered && isCorrect ? 'border-green-500 bg-green-500/20 text-green-400' :
                isAnswered && isSelected ? 'border-red-500 bg-red-500/20 text-red-400' :
                'border-slate-600 text-slate-500')}>
                {isAnswered ? (isCorrect ? '✓' : isSelected ? '✕' : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={cn("p-3 rounded-xl border flex items-start gap-2",
              selected === q.correct
                ? 'border-green-500/40 bg-green-500/10'
                : 'border-amber-500/40 bg-amber-500/10')}>
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-cyan-400" />
            <p className="text-[10px] text-slate-300 leading-relaxed">{q.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {isAnswered && current < QUIZ_QUESTIONS.length - 1 && (
        <button onClick={handleNext}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-500/20 border border-orange-500/50 rounded-lg text-orange-400 text-xs font-bold uppercase tracking-wider hover:bg-orange-500/30 transition-colors cursor-pointer">
          Next Question <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Main Simulator ───────────────────────────────────────────────────────────
export function StepTouchSimulator({ config }: { config?: UserConfig }) {
  const [distance, setDistance] = useState(8);
  const [isPPESafe, setIsPPESafe] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [soilType, setSoilType] = useState<SoilType>('dry_gravel');
  const [isRaining, setIsRaining] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('simulator');
  const [escapeStep, setEscapeStep] = useState(0);

  const isIndustrial = config?.environment === 'industrial';
  const sourceVoltage = isIndustrial ? 11000 : 3300;
  const faultCurrent = isIndustrial ? 1500 : 500;
  const ts = 0.5; // fault clearing time (s)
  const Cs = 0.85; // derating factor

  const soilResistivity = isRaining
    ? Math.max(50, SOIL_DATA[soilType].resistivity * 0.4)
    : SOIL_DATA[soilType].resistivity;

  const calcVoltageAt = (x: number) => {
    if (x <= 0.3) return sourceVoltage * 0.95;
    return Math.min(sourceVoltage * 0.9, (soilResistivity * faultCurrent) / (2 * Math.PI * x));
  };

  const v1 = calcVoltageAt(distance);
  const v2 = calcVoltageAt(distance + 1.0); // IEEE 80 stride = 1m

  const stepPotential = Math.max(0, v1 - v2);
  const touchPotential = Math.max(0, sourceVoltage - v1);

  const allowableStep = (1000 + 6 * Cs * soilResistivity) * (0.116 / Math.sqrt(ts));
  const allowableTouch = (1000 + 1.5 * Cs * soilResistivity) * (0.116 / Math.sqrt(ts));

  const isTouchZone = distance < 2;
  const activeVoltage = isTouchZone ? touchPotential : stepPotential;
  const activeLimit = isTouchZone ? allowableTouch : allowableStep;

  const isNativelySafe = activeVoltage <= activeLimit;
  const isSafe = isNativelySafe || isPPESafe;
  const isInDanger = !isSafe;
  const dangerRatio = Math.min(3, activeVoltage / Math.max(1, activeLimit));

  useEffect(() => { if (isInDanger) setHasSimulated(true); }, [isInDanger]);

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'simulator', label: 'Simulator', icon: Zap },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'escape', label: 'Escape Guide', icon: Footprints },
    { id: 'quiz', label: 'Quiz', icon: Target },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950/20">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-0 shrink-0 border-b border-white/5 bg-slate-900/40">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              activeTab === tab.id
                ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
            )}>
            <tab.icon className="w-3 h-3" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content Container */}
      <div className={cn("flex-1", activeTab === 'simulator' ? 'overflow-hidden' : 'overflow-y-auto')}>
        <AnimatePresence mode="wait">

          {/* ── SIMULATOR TAB (Rebuilt Layout) ─────────────────────────────── */}
          {activeTab === 'simulator' && (
            <motion.div key="simulator"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="flex flex-col lg:flex-row h-full overflow-hidden">

              {/* Left Column: Sleek, compact controls panel (50% width on desktop) */}
              <div className="w-full lg:w-1/2 shrink-0 overflow-y-auto p-2 lg:p-3 space-y-2 lg:space-y-2.5 border-b lg:border-b-0 lg:border-r border-slate-800/50 order-2 lg:order-1 pb-16 lg:pb-6">
                
                {/* Title Status Banner */}
                <div className={cn("p-2 px-2.5 rounded-lg border flex items-center justify-between transition-all duration-300",
                  isInDanger ? 'bg-red-500/10 border-red-500/30' : isPPESafe ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-green-500/10 border-green-500/30')}>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", isInDanger ? 'bg-red-500' : isPPESafe ? 'bg-cyan-400' : 'bg-green-400')} />
                    <span className={cn("text-[10px] md:text-xs font-black uppercase tracking-wide", isInDanger ? 'text-red-400' : isPPESafe ? 'text-cyan-400' : 'text-green-400')}>
                      {isInDanger 
                        ? (isTouchZone ? 'Touch Voltage Risk' : 'Step Voltage Risk') 
                        : isPPESafe ? 'Insulated (Boots)' : 'Safe Condition'}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest hidden sm:inline">IEEE 80</span>
                </div>

                {/* Distance Controller */}
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] md:text-xs font-bold uppercase text-orange-500 border-l-2 border-orange-500 pl-1.5">
                      Distance from Fault
                    </span>
                    <span className="text-xs font-mono font-black text-white">{distance}m</span>
                  </div>
                  <input type="range" min={0.5} max={15} step={0.5} value={distance}
                    onChange={e => setDistance(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer" />
                  
                  {/* Quick presets pills */}
                  <div className="flex gap-1 mt-1.5 overflow-x-auto pb-0.5">
                    {[
                      { label: 'Touch Zone (<2m)', val: 1 },
                      { label: 'High Risk (2-5m)', val: 3.5 },
                      { label: 'Caution (5-10m)', val: 7 },
                      { label: 'Safe Zone (≥10m)', val: 12 },
                    ].map(z => (
                      <button key={z.label} onClick={() => setDistance(z.val)}
                        className={cn("py-0.5 px-2 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap flex-1 text-center",
                          distance === z.val
                            ? 'border-orange-500 bg-orange-500/35 text-orange-300 shadow-sm'
                            : 'border-slate-700 bg-slate-850/60 text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white'
                        )}>
                        {z.label.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Surface Material Selection */}
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[10px] md:text-xs font-bold uppercase text-cyan-400 border-l-2 border-cyan-400 pl-1.5 mb-1.5 block">
                    Surface Material
                  </span>
                  <div className="grid grid-cols-2 gap-1 mb-1.5">
                    {(Object.entries(SOIL_DATA) as [SoilType, typeof SOIL_DATA[SoilType]][]).map(([key, data]) => (
                      <button key={key} onClick={() => setSoilType(key)}
                        className={cn("py-0.5 px-1.5 rounded-md border text-left transition-all cursor-pointer",
                          soilType === key
                            ? 'border-emerald-500 bg-emerald-500/25 text-emerald-300 font-extrabold shadow-sm'
                            : 'border-slate-700 bg-slate-850/60 text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white'
                        )}>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider truncate">{data.label}</span>
                        </div>
                        <p className="text-[8px] text-slate-400 font-mono pl-2.5">{data.resistivity} Ω·m</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setIsRaining(r => !r)}
                    className={cn("w-full flex items-center justify-center gap-1.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      isRaining
                        ? 'border-sky-500 bg-sky-500/30 text-sky-300 shadow-sm'
                        : 'border-slate-700 bg-slate-850/60 text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white')}>
                    <CloudRain className="w-3.5 h-3.5" />
                    {isRaining ? `Rain (Res = ${soilResistivity.toFixed(0)} Ω·m)` : 'Dry Conditions'}
                  </button>
                </div>

                {/* PPE Selector */}
                <PPEValidator hazardType="step_touch" hazardMagnitude={activeVoltage} onSafetyChange={setIsPPESafe} />

                {/* Scenarios Preset Compare */}
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[10px] md:text-xs font-bold uppercase text-purple-400 border-l-2 border-purple-400 pl-1.5 mb-1.5 block">
                    Quick Scenario Presets
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { label: 'Dry Gravel @ 5m', dist: 5, soil: 'dry_gravel' as SoilType, rain: false },
                      { label: 'Wet Soil @ 5m', dist: 5, soil: 'wet_soil' as SoilType, rain: true },
                      { label: 'Wet Soil @ 2m', dist: 2, soil: 'wet_soil' as SoilType, rain: true },
                      { label: 'Concrete @ 10m', dist: 10, soil: 'concrete' as SoilType, rain: false },
                    ].map((sc, i) => (
                      <button key={i}
                        onClick={() => { setDistance(sc.dist); setSoilType(sc.soil); setIsRaining(sc.rain); }}
                        className="flex items-center justify-between px-1.5 py-0.5 rounded-md border border-slate-700 bg-slate-850/60 text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white transition-colors text-left cursor-pointer">
                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider truncate mr-1">{sc.label.split(' @')[0]}</span>
                        <span className="w-1 h-1 rounded-full shrink-0 bg-orange-500" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emergency Response */}
                <div className="mt-0.5">
                  <EmergencyResponse isSimulating={isInDanger && !isPPESafe} hasSimulated={hasSimulated} type="step_touch" />
                </div>

              </div>

              {/* Right Column: Dynamic central Visualizer (50% width on desktop) */}
              <div className="w-full lg:w-1/2 shrink-0 flex flex-col gap-2.5 bg-slate-950/60 p-2.5 lg:p-3 order-1 lg:order-2 overflow-hidden min-w-0">
                
                {/* SVG Visualizer Wrapper */}
                <div className="flex-1 min-h-0 relative w-full bg-slate-950 border border-white/10 rounded-xl overflow-hidden p-2 shadow-inner flex items-center justify-center">
                  <div className="absolute top-2 left-2 z-10">
                    <span className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-slate-300 bg-slate-950/90 px-2 py-0.5 rounded border border-white/10">
                      {sourceVoltage.toLocaleString()}V · {soilResistivity.toFixed(0)}Ω·m
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 z-10">
                    <span className={cn("text-[10px] md:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                      isTouchZone ? 'text-red-400 border-red-500/50 bg-red-500/20' : 'text-orange-400 border-orange-500/50 bg-orange-500/20')}>
                      {isTouchZone ? 'TOUCH POSITION' : 'STEP GRADIENT'}
                    </span>
                  </div>

                  <VoltageGradientSVG
                    distance={distance}
                    soilResistivity={soilResistivity}
                    sourceVoltage={sourceVoltage}
                    faultCurrent={faultCurrent}
                    isInDanger={isInDanger}
                    isTouchZone={isTouchZone}
                    isPPESafe={isPPESafe}
                    isRaining={isRaining}
                  />

                  {/* Pulsing overlay when dangerous */}
                  {isInDanger && !isPPESafe && (
                    <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
                      animate={{ opacity: [0, 0.15, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.4) 0%, transparent 70%)' }} />
                  )}
                </div>

                {/* Live Engineering Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  
                  {/* Step Potential */}
                  <div className={cn("p-2 rounded-lg border flex flex-col justify-between transition-colors",
                    isTouchZone ? 'border-slate-800 bg-slate-950/20 opacity-50' : stepPotential > allowableStep ? 'border-red-500/40 bg-red-950/25' : 'border-green-500/30 bg-green-950/15')}>
                    <div className="flex justify-between items-center text-[10px] md:text-xs font-bold uppercase tracking-wide text-slate-400">
                      <span>Step Potential</span>
                      {!isTouchZone && (stepPotential > allowableStep ? <span className="text-red-400 font-black">FAIL</span> : <span className="text-green-400 font-bold">PASS</span>)}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={cn("text-lg md:text-xl font-black font-mono", isTouchZone ? 'text-slate-500' : stepPotential > allowableStep ? 'text-red-400' : 'text-green-400')}>
                        {Math.round(stepPotential)}V
                      </span>
                      <span className="text-[10px] md:text-xs text-slate-500 font-mono">/ {Math.round(allowableStep)}V Max</span>
                    </div>
                  </div>

                  {/* Touch Potential */}
                  <div className={cn("p-2 rounded-lg border flex flex-col justify-between transition-colors",
                    !isTouchZone ? 'border-slate-800 bg-slate-950/20 opacity-50' : touchPotential > allowableTouch ? 'border-red-500/40 bg-red-950/25' : 'border-green-500/30 bg-green-950/15')}>
                    <div className="flex justify-between items-center text-[10px] md:text-xs font-bold uppercase tracking-wide text-slate-400">
                      <span>Touch Potential</span>
                      {isTouchZone && (touchPotential > allowableTouch ? <span className="text-red-400 font-black">FAIL</span> : <span className="text-green-400 font-bold">PASS</span>)}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={cn("text-lg md:text-xl font-black font-mono", !isTouchZone ? 'text-slate-500' : touchPotential > allowableTouch ? 'text-red-400' : 'text-green-400')}>
                        {Math.round(touchPotential)}V
                      </span>
                      <span className="text-[10px] md:text-xs text-slate-500 font-mono">/ {Math.round(allowableTouch)}V Max</span>
                    </div>
                  </div>

                  {/* Soil resistivity */}
                  <div className="p-2 rounded-lg border border-slate-800 bg-slate-950/40 flex flex-col justify-between">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-slate-400">Soil Resistivity</span>
                    <div className="text-sm md:text-base font-black font-mono text-cyan-400 mt-1 flex items-baseline gap-1">
                      {Math.round(soilResistivity)} <span className="text-[10px] md:text-xs text-slate-500 font-normal font-sans">Ω·m</span>
                    </div>
                  </div>

                  {/* Voltage GPR */}
                  <div className="p-2 rounded-lg border border-slate-800 bg-slate-950/40 flex flex-col justify-between">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-slate-400">GPR Peak Voltage</span>
                    <div className="text-sm md:text-base font-black font-mono text-purple-400 mt-1 flex items-baseline gap-1">
                      {sourceVoltage.toLocaleString()} <span className="text-[10px] md:text-xs text-slate-500 font-normal font-sans">V AC</span>
                    </div>
                  </div>

                </div>

                {/* Hazard Level Indicator */}
                <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 flex justify-between items-center shrink-0">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide">Danger Ratio (V_act / V_lim)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div animate={{ width: `${Math.min(100, dangerRatio * 50)}%` }}
                        className={cn("h-full rounded-full", dangerRatio > 1 ? 'bg-red-500' : 'bg-green-500')} />
                    </div>
                    <span className={cn("text-xs font-mono font-black", dangerRatio > 1 ? 'text-red-400' : 'text-green-400')}>
                      {dangerRatio.toFixed(2)}×
                    </span>
                  </div>
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
                      section.color === 'cyan' ? 'bg-cyan-500/20' :
                      section.color === 'red' ? 'bg-red-500/20' : 'bg-purple-500/20')}>
                      <section.icon className={cn("w-4 h-4",
                        section.color === 'orange' ? 'text-orange-400' :
                        section.color === 'cyan' ? 'text-cyan-400' :
                        section.color === 'red' ? 'text-red-400' : 'text-purple-400')} />
                    </div>
                    <span className="text-sm font-bold text-white flex-1">{section.title}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
                    {section.content.map((item, i) => (
                      <div key={i}>
                        <h4 className={cn("text-[10px] font-black uppercase tracking-widest mb-1.5 border-l-2 pl-2",
                          section.color === 'orange' ? 'text-orange-400 border-orange-500' :
                          section.color === 'cyan' ? 'text-cyan-400 border-cyan-500' :
                          section.color === 'red' ? 'text-red-400 border-red-500' : 'text-purple-400 border-purple-500')}>
                          {item.heading}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-line">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}

              <div className="p-4 rounded-xl border border-orange-500/40 bg-orange-950/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-orange-400 mb-2">Golden Rule</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Never walk normally near a fallen high-voltage line. The difference in voltage between your two feet can be lethal — even if you never touch the wire.
                      <strong className="text-white"> Always bunny-hop or shuffle out, perpendicular to the downed conductor.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

                    {/* ── ESCAPE GUIDE TAB ──────────────────────────────────────────── */}
          {activeTab === 'escape' && (
            <motion.div key="escape"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="flex flex-col lg:flex-row h-full overflow-hidden w-full">

              {/* Left Column: Step Instruction & Navigation */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 order-2 lg:order-1 flex flex-col justify-between pb-16 lg:pb-4">
                <div className="space-y-4">
                  {/* Single Active Step Card */}
                  {(() => {
                    const step = ESCAPE_STEPS[escapeStep];
                    return (
                      <motion.div
                        key={escapeStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "rounded-xl border p-5 bg-slate-900/80 shadow-xl",
                          step.color === 'red' ? 'border-red-500/50 bg-red-950/15' :
                          step.color === 'orange' ? 'border-orange-500/50 bg-orange-950/15' :
                          step.color === 'yellow' ? 'border-yellow-500/50 bg-yellow-950/15' :
                          step.color === 'green' ? 'border-green-500/50 bg-green-950/15' :
                          'border-cyan-500/50 bg-cyan-950/15'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          {/* Step Number Badge */}
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white shrink-0 shadow-md",
                            step.color === 'red' ? 'bg-red-600' :
                            step.color === 'orange' ? 'bg-orange-600' :
                            step.color === 'yellow' ? 'bg-yellow-600' :
                            step.color === 'green' ? 'bg-green-600' : 'bg-cyan-600')}>
                            {step.num}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-2">
                              <p className={cn("text-base md:text-lg font-extrabold uppercase tracking-wide",
                                step.color === 'red' ? 'text-red-400' :
                                step.color === 'orange' ? 'text-orange-400' :
                                step.color === 'yellow' ? 'text-yellow-400' :
                                step.color === 'green' ? 'text-green-400' : 'text-cyan-400')}>
                                {step.title}
                              </p>
                              <step.icon className={cn("w-5 h-5 shrink-0",
                                step.color === 'red' ? 'text-red-400' :
                                step.color === 'orange' ? 'text-orange-400' :
                                step.color === 'yellow' ? 'text-yellow-400' :
                                step.color === 'green' ? 'text-green-400' : 'text-cyan-400')} />
                            </div>
                            
                            <p className="text-sm md:text-base text-slate-200 leading-relaxed mb-4">{step.instruction}</p>
                            
                            <div className="space-y-2 mt-3">
                              <div className="flex items-start gap-2.5 p-2.5 px-3.5 rounded-lg bg-red-950/40 border border-red-500/30">
                                <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-xs md:text-sm text-red-300"><strong className="font-bold">CRITICAL WARNING:</strong> {step.warning}</p>
                              </div>
                              <div className="flex items-start gap-2.5 p-2.5 px-3.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
                                <Info className="w-4.5 h-4.5 text-cyan-400 shrink-0 mt-0.5" />
                                <p className="text-xs md:text-sm text-cyan-300"><strong className="font-bold">PRO TIP:</strong> {step.tip}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* High-visibility large navigation buttons */}
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <button
                      onClick={() => setEscapeStep(s => Math.max(0, s - 1))}
                      disabled={escapeStep === 0}
                      className={cn(
                        "flex items-center justify-center gap-2 py-3 px-6 rounded-xl border font-black tracking-wider text-xs md:text-sm uppercase transition-all shadow-md",
                        escapeStep === 0
                          ? 'bg-slate-800/10 border-slate-850 text-slate-500 opacity-30 cursor-not-allowed'
                          : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 cursor-pointer active:scale-95'
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" /> PREVIOUS STEP
                    </button>
                    <button
                      onClick={() => setEscapeStep(s => Math.min(ESCAPE_STEPS.length - 1, s + 1))}
                      disabled={escapeStep === ESCAPE_STEPS.length - 1}
                      className={cn(
                        "flex items-center justify-center gap-2 py-3 px-6 rounded-xl border font-black tracking-wider text-xs md:text-sm uppercase transition-all shadow-md",
                        escapeStep === ESCAPE_STEPS.length - 1
                          ? 'bg-slate-800/10 border-slate-850 text-slate-500 opacity-30 cursor-not-allowed'
                          : 'bg-orange-500 border-orange-400 text-slate-950 hover:bg-orange-400 hover:border-orange-300 cursor-pointer active:scale-95'
                      )}
                    >
                      NEXT STEP <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Safety Reminder */}
                <div className="p-4 rounded-xl border border-red-500/40 bg-red-950/20 flex items-start gap-3 mt-4 shrink-0">
                  <Zap className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    <strong className="text-red-400 font-bold">NEVER WALK NORMALLY:</strong> The voltage gradient is circular and spreads outward from the point of fault contact. Walking creates a voltage differential between your feet. Always keep feet together.
                  </p>
                </div>
              </div>

              {/* Right Column: Visualizer Column */}
              <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 p-4 border-b lg:border-b-0 lg:border-l border-slate-800/50 bg-slate-950/60 order-1 lg:order-2 flex flex-col justify-center gap-3">
                <div className="rounded-xl bg-slate-950/40 border border-white/5 p-4 shadow-inner">
                  <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">Interactive Escape Visualisation</p>
                  <div className="w-full flex justify-center py-4 bg-slate-900/40 rounded-lg border border-white/5 shadow-inner">
                    <EscapeAnimation step={escapeStep} />
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* ── QUIZ TAB ──────────────────────────────────────────────────── */}
          {activeTab === 'quiz' && (
            <motion.div key="quiz"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="p-4">
              <div className="mb-4 p-3 rounded-xl bg-orange-950/20 border border-orange-500/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Knowledge Assessment</p>
                <p className="text-[10px] text-slate-400">
                  {QUIZ_QUESTIONS.length} questions · Step & Touch Potential · IEEE 80 · IEC 60479
                </p>
              </div>
              <QuizTab />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
