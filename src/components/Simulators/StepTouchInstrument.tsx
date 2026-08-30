import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, CloudRain, Eye, Maximize2, Layers, Activity, 
  AlertTriangle, CheckCircle2, ShieldAlert, ChevronRight, Gauge 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { IEEE80Result } from '@/src/utils/ieee80';

export type ViewMode = 'profile' | 'bullseye' | 'dome';

export interface StepTouchInstrumentProps {
  distance: number;
  ieeeResults: IEEE80Result;
  hazardMode: 'step' | 'touch';
  isNativelySafe: boolean;
  isPPESafe: boolean;
  isRaining: boolean;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  className?: string;
}

export function getDistanceZone(m: number): { label: string; range: string; color: string; bg: string } {
  if (m < 2.0)  return { label: 'TOUCH ZONE', range: '<2m', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' };
  if (m < 5.0)  return { label: 'HIGH RISK ZONE', range: '2-5m', color: '#f97316', bg: 'rgba(249, 115, 22, 0.2)' };
  if (m < 10.0) return { label: 'CAUTION ZONE', range: '5-10m', color: '#eab308', bg: 'rgba(234, 179, 8, 0.2)' };
  return { label: 'SAFE ZONE', range: '≥10m', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' };
}

// ─── REALISTIC VECTOR HUMAN AVATAR & ELECTRICAL HAZARD ANIMATOR ─────────────
function RealisticHumanAvatar({
  figureColor,
  isInDanger,
  isStepMode,
  hasEHBoots,
  hasGloves,
  dangerRatio,
  prefersReducedMotion,
  isReachingStructure = false
}: {
  figureColor: string;
  isInDanger: boolean;
  isStepMode: boolean;
  hasEHBoots: boolean;
  hasGloves: boolean;
  dangerRatio: number;
  prefersReducedMotion: boolean;
  isReachingStructure?: boolean;
}) {
  return (
    <motion.g
      animate={
        isInDanger && !prefersReducedMotion
          ? { x: [-1.5, 1.5, -1.5], y: [0, -1, 0] }
          : { x: 0, y: 0 }
      }
      transition={{ repeat: Infinity, duration: dangerRatio > 1.8 ? 0.05 : 0.09 }}
    >
      {/* Active Ground Shockwave Energy Ring under feet */}
      {isInDanger && !prefersReducedMotion && (
        <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-ping opacity-75" />
      )}

      {/* Dielectric Safety Boots */}
      <rect x="-11" y="-3" width="8" height="4" fill={hasEHBoots ? "#22d3ee" : "#334155"} rx="1" stroke="#000000" strokeWidth="0.8" />
      <rect x="3" y="-3" width="8" height="4" fill={hasEHBoots ? "#22d3ee" : "#334155"} rx="1" stroke="#000000" strokeWidth="0.8" />

      {/* Legs (Pants) */}
      <line x1="-7" y1="-3" x2="-5" y2="-22" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <line x1="7" y1="-3" x2="5" y2="-22" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

      {/* Torso & High-Vis Safety Vest */}
      <path d="M -8,-22 L -10,-42 L 10,-42 L 8,-22 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
      {/* Reflective Strips on Vest */}
      <line x1="-9" y1="-36" x2="9" y2="-36" stroke="#ffffff" strokeWidth="1.5" />
      <line x1="-8" y1="-28" x2="8" y2="-28" stroke="#ffffff" strokeWidth="1.5" />

      {/* Arms & Rubber Gloves */}
      {isReachingStructure ? (
        /* TOUCH MODE: Right Arm Reaching Out to Structure */
        <>
          <line x1="8" y1="-40" x2="28" y2="-45" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="28" cy="-45" r="3" fill={hasGloves ? "#a855f7" : "#fca5a5"} stroke="#000" strokeWidth="0.5" />
          {/* Spark at Hand Contact Point */}
          {isInDanger && !prefersReducedMotion && (
            <circle cx="28" cy="-45" r="7" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-ping" />
          )}
        </>
      ) : (
        /* STEP MODE: Arms at Side */
        <>
          <line x1="-10" y1="-40" x2="-14" y2="-24" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <line x1="10" y1="-40" x2="14" y2="-24" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="-14" cy="-24" r="2.5" fill={hasGloves ? "#a855f7" : "#fca5a5"} />
          <circle cx="14" cy="-24" r="2.5" fill={hasGloves ? "#a855f7" : "#fca5a5"} />
        </>
      )}

      {/* Realistic Head & Hard Hat Helmet */}
      <circle cx="0" cy="-49" r="6" fill="#fca5a5" />
      {/* Hard Hat */}
      <path d="M -8,-52 Q 0,-60 8,-52 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
      <rect x="-9" y="-53" width="18" height="2" fill="#ca8a04" rx="1" />

      {/* HAZARD ELECTRICAL CURRENT FLOW ANIMATIONS */}
      {isInDanger && !prefersReducedMotion && (
        <g>
          {isStepMode ? (
            /* STEP HAZARD: Current Loop UP Leg 1 -> Pelvis -> DOWN Leg 2 */
            <g>
              <path d="M -8,0 Q 0,-8 8,0" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" className="animate-pulse" />
              <circle cx="-6" cy="-12" r="2" fill="#f97316" className="animate-ping" />
              <circle cx="6" cy="-12" r="2" fill="#f97316" className="animate-ping" />
            </g>
          ) : (
            /* TOUCH HAZARD: Current Path Hand -> Arm -> Heart/Chest -> Feet */
            <g>
              <circle cx="2" cy="-35" r="5" fill="#ef4444" className="animate-ping" />
              <path d="M 28,-45 L 8,-40 L 2,-35 L 0,-22 L -6,0" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
            </g>
          )}
        </g>
      )}
    </motion.g>
  );
}

export function StepTouchInstrument({
  distance,
  ieeeResults,
  hazardMode,
  isNativelySafe,
  isPPESafe,
  isRaining,
  activeView,
  setActiveView,
  className
}: StepTouchInstrumentProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Performance Optimization: Precompute V(x) Array (201 points) on parameter changes
  const vxCache = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = 0.01 + (i / 200) * 15.0;
      points.push(ieeeResults.calcVx(x));
    }
    return points;
  }, [ieeeResults]);

  const gprVolts = ieeeResults.GPR_volts;
  const actualStep = ieeeResults.calcActualStep(distance);
  const actualTouch = ieeeResults.calcActualTouch(distance);
  const vFoot1 = ieeeResults.calcVx(distance);
  const vFoot2 = ieeeResults.calcVx(distance + 1.0);

  const isStepMode = hazardMode === 'step';
  const activeVoltage = isStepMode ? actualStep : actualTouch;
  const activeLimit = isStepMode ? ieeeResults.E_step_tolerable : ieeeResults.E_touch_tolerable;

  const isInDanger = !isNativelySafe && !isPPESafe;
  const dangerRatio = activeVoltage / Math.max(1, activeLimit);

  // Derive distance zone details
  const activeZone = getDistanceZone(distance);

  // Compute body path current
  const bodyEvaluation = useMemo(() => {
    return ieeeResults.calcBodyCurrent(activeVoltage, isStepMode, isPPESafe, false);
  }, [ieeeResults, activeVoltage, isStepMode, isPPESafe]);

  // Person Status Chip Details
  const personStatus = useMemo(() => {
    if (!isInDanger) {
      if (isPPESafe && !isNativelySafe) {
        return {
          chipText: "[PROTECTED: EH BOOTS]",
          chipColor: "bg-cyan-950 text-cyan-300 border-cyan-500",
          figureColor: "#22d3ee",
          isTetany: false
        };
      }
      return {
        chipText: "[SAFE: BELOW LIMIT]",
        chipColor: "bg-green-950 text-green-300 border-green-500",
        figureColor: "#10b981",
        isTetany: false
      };
    }
    if (dangerRatio > 1.8) {
      return {
        chipText: "[CRITICAL: SEVERE TETANY RISK]",
        chipColor: "bg-red-950 text-red-200 border-red-500 animate-pulse font-black",
        figureColor: "#ef4444",
        isTetany: true
      };
    }
    return {
      chipText: "[DANGER: FIBRILLATION RISK]",
      chipColor: "bg-orange-950 text-orange-200 border-orange-500 font-bold",
      figureColor: "#f97316",
      isTetany: true
    };
  }, [isInDanger, isPPESafe, isNativelySafe, dangerRatio]);

  // Canvas Animation Runner (100% Synced Coordinates)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let ripplePhase = 0;

    const renderCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // View B Bullseye Canvas Ripples & Pulsing Hazard Ring
      if (activeView === 'bullseye' && !prefersReducedMotion) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ripplePhase = (ripplePhase + 0.5) % 30;

        for (let r = 20; r < 200; r += 25) {
          const radius = r + ripplePhase;
          const alpha = Math.max(0, 1 - radius / 200);
          ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (isInDanger) {
          const personRadius = (distance / 15) * 140;
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + Math.sin(Date.now() / 150) * 0.4})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(10, personRadius), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Rain Particles overlay
      if (isRaining && !prefersReducedMotion) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        const now = Date.now() / 100;
        for (let i = 0; i < 30; i++) {
          const rx = (i * 27 + now * 10) % canvas.width;
          const ry = (i * 19 + now * 25) % canvas.height;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 3, ry + 12);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(renderCanvas);
    };

    renderCanvas();
    return () => cancelAnimationFrame(animId);
  }, [activeView, isRaining, isInDanger, distance, prefersReducedMotion]);

  // Semicircular Danger Gauge Needle Angle (-90 deg to +90 deg for 0x to 3x)
  const needleAngle = useMemo(() => {
    const clamped = Math.min(3.0, Math.max(0, dangerRatio));
    return (clamped / 3.0) * 180 - 90;
  }, [dangerRatio]);

  return (
    <div className={cn(
      "w-full h-full min-h-[360px] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative select-none",
      className
    )}>
      {/* Top Header Controls Bar & View Switcher Chips */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-30 shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-100 font-mono">
            IEEE 80 Three-View Grounding Instrument
          </span>
        </div>

        {/* View Switcher Chips [PROFILE | BULLSEYE | 3D DOME] */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
          {[
            { id: 'profile', label: 'PROFILE' },
            { id: 'bullseye', label: 'BULLSEYE' },
            { id: 'dome', label: '3D DOME' },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as ViewMode)}
              className={cn(
                "px-2.5 py-1 rounded font-bold transition-all cursor-pointer min-h-[36px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
                activeView === view.id
                  ? "bg-cyan-600 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Person Status Text Chip Overlay & Active Distance Zone Chip (A11Y aria-live) */}
      <div className="absolute top-12 left-3 z-30 flex flex-col gap-1" aria-live="polite" aria-atomic="true">
        <span className={cn("text-[11px] font-mono px-2.5 py-1 rounded-md border shadow-md font-bold uppercase tracking-wider tabular-nums", personStatus.chipColor)}>
          {personStatus.chipText}
        </span>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-950 text-slate-200 font-bold uppercase tracking-wider tabular-nums">
          DISTANCE: {distance.toFixed(1)}m — <span style={{ color: activeZone.color }}>{activeZone.label} ({activeZone.range})</span>
        </span>
      </div>

      {/* Main Multi-View Instrument Canvas / SVG Display Area */}
      <div className="relative flex-1 w-full min-h-[320px] flex items-center justify-center p-2 overflow-hidden bg-[radial-gradient(ellipse_at_top,_#1e293b_0%,_#0f172a_100%)]">
        
        {/* Canvas Overlay for Rain & Bullseye Ripples */}
        <canvas
          ref={canvasRef}
          width={500}
          height={320}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        <AnimatePresence mode="wait">
          {/* VIEW A: SIDE PROFILE */}
          {activeView === 'profile' && (
            <motion.svg
              key="view-profile"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              viewBox="0 0 500 320"
              className="w-full h-full max-w-[750px] overflow-visible z-10"
            >
              {/* Ground & Axis Line */}
              <rect x="30" y="240" width="440" height="40" fill="rgba(30,41,59,0.5)" rx="4" />
              <line x1="30" y1="240" x2="470" y2="240" stroke="#475569" strokeWidth="1.5" />

              {/* Voltage Zones */}
              {[
                { mStart: 0, mEnd: 2, color: 'rgba(239,68,68,0.15)', label: 'TOUCH (<2m)' },
                { mStart: 2, mEnd: 5, color: 'rgba(249,115,22,0.12)', label: 'HIGH RISK (2-5m)' },
                { mStart: 5, mEnd: 10, color: 'rgba(234,179,8,0.08)', label: 'CAUTION (5-10m)' },
                { mStart: 10, mEnd: 15, color: 'rgba(34,197,94,0.05)', label: 'SAFE (≥10m)' },
              ].map((z, idx) => {
                const x1 = 50 + (z.mStart / 15) * 400;
                const x2 = 50 + (z.mEnd / 15) * 400;
                const isSelectedZone = distance >= z.mStart && (z.mEnd === 15 ? distance <= 15 : distance < z.mEnd);
                return (
                  <g key={idx}>
                    <rect x={x1} y="50" width={x2 - x1} height="190" fill={isSelectedZone ? 'rgba(56, 189, 248, 0.12)' : z.color} stroke={isSelectedZone ? '#38bdf8' : 'none'} strokeWidth={isSelectedZone ? '1.5' : '0'} />
                    <line x1={x2} y1="50" x2={x2} y2="240" stroke="rgba(100,116,139,0.4)" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={(x1 + x2)/2} y="68" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      {z.label}
                    </text>
                  </g>
                );
              })}

              {/* IEEE 80 Geometric Arctan Potential Curve V(x) */}
              {(() => {
                const points = [];
                for (let x = 0.1; x <= 15; x += 0.2) {
                  const v = ieeeResults.calcVx(x);
                  const px = 50 + (x / 15) * 400;
                  const py = 240 - (v / Math.max(1, gprVolts)) * 170;
                  points.push(`${px},${Math.max(40, py)}`);
                }
                const curveD = `M ${points.join(' L ')}`;
                return (
                  <g>
                    <path d={curveD} fill="none" stroke="#f97316" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 6px #f97316)' }} />
                    <path d={`${curveD} L 450,240 L 50,240 Z`} fill="rgba(249,115,22,0.08)" />
                  </g>
                );
              })()}

              {/* Substation Pole & Downed Conductor */}
              <line x1="50" y1="40" x2="50" y2="240" stroke="#64748b" strokeWidth="4" />
              <line x1="30" y1="55" x2="70" y2="55" stroke="#64748b" strokeWidth="3" />
              <circle cx="50" cy="240" r="18" fill="rgba(249,115,22,0.3)" />
              <circle cx="50" cy="240" r="6" fill="#f97316" className="animate-ping" />

              {/* REALISTIC HUMAN AVATAR ON PROFILE VIEW */}
              {(() => {
                const px = 50 + (distance / 15) * 400;
                return (
                  <motion.g
                    animate={{ x: px, y: 240 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    {/* Floating Position & Zone Badge Tag directly above Figure */}
                    <g transform="translate(0, -75)">
                      <rect x="-45" y="0" width="90" height="20" rx="4" fill="#0f172a" stroke={personStatus.figureColor} strokeWidth="1.5" />
                      <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">
                        X = {distance.toFixed(1)}m
                      </text>
                    </g>

                    <RealisticHumanAvatar
                      figureColor={personStatus.figureColor}
                      isInDanger={isInDanger}
                      isStepMode={isStepMode}
                      hasEHBoots={false}
                      hasGloves={false}
                      dangerRatio={dangerRatio}
                      prefersReducedMotion={prefersReducedMotion}
                      isReachingStructure={!isStepMode}
                    />
                  </motion.g>
                );
              })()}

              {/* Distance Axis Ticks & Labels (>=11px) */}
              {[0, 2, 5, 10, 15].map(m => {
                const tx = 50 + (m / 15) * 400;
                return (
                  <g key={m}>
                    <line x1={tx} y1="240" x2={tx} y2="248" stroke="#94a3b8" strokeWidth="1.5" />
                    <text x={tx} y="265" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="monospace">
                      {m}m
                    </text>
                  </g>
                );
              })}
            </motion.svg>
          )}

          {/* VIEW B: TOP-DOWN BULLSEYE */}
          {activeView === 'bullseye' && (
            <motion.svg
              key="view-bullseye"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              viewBox="0 0 500 320"
              className="w-full h-full max-w-[750px] overflow-visible z-10"
            >
              <circle cx="250" cy="160" r="10" fill="#f97316" style={{ filter: 'drop-shadow(0 0 10px #f97316)' }} />
              <text x="250" y="130" textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="black" fontFamily="monospace">
                GROUND FAULT ORIGIN (GPR {ieeeResults.GPR_kV.toFixed(1)} kV)
              </text>

              {[2, 5, 10, 15].map(m => {
                const radius = (m / 15) * 140;
                const isSelectedZone = distance <= m && (m === 2 || distance > [0, 2, 5, 10][ [2, 5, 10, 15].indexOf(m) ]);
                return (
                  <g key={m}>
                    <circle cx="250" cy="160" r={radius} fill="none" stroke={isSelectedZone ? '#38bdf8' : '#475569'} strokeWidth={isSelectedZone ? '2' : '1.5'} strokeDasharray="4 4" />
                    <text x={250 + radius + 4} y="164" fill={isSelectedZone ? '#38bdf8' : '#94a3b8'} fontSize="11" fontWeight="bold" fontFamily="monospace">
                      {m}m ({(ieeeResults.calcVx(m)/1000).toFixed(1)}kV)
                    </text>
                  </g>
                );
              })}

              {/* Person Marker Dot */}
              {(() => {
                const pDistRadius = (distance / 15) * 140;
                return (
                  <motion.g
                    animate={{ x: 250 + pDistRadius }}
                    transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <circle cx="0" cy="160" r="9" fill={personStatus.figureColor} stroke="#ffffff" strokeWidth="2" />
                    <text x="0" y="185" textAnchor="middle" fill={personStatus.figureColor} fontSize="11" fontWeight="black" fontFamily="monospace">
                      YOU ({distance.toFixed(1)}m)
                    </text>
                  </motion.g>
                );
              })()}
            </motion.svg>
          )}

          {/* VIEW C: PREMIUM REALISTIC 3D POTENTIAL HILL DOME */}
          {activeView === 'dome' && (
            <motion.svg
              key="view-dome"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              viewBox="0 0 500 320"
              className="w-full h-full max-w-[750px] overflow-visible z-10"
            >
              <defs>
                <radialGradient id="domePeakGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#f97316" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </radialGradient>
              </defs>

              <g transform="translate(250, 210)">
                {/* Ground Base Grid Floor */}
                <ellipse cx="0" cy="0" rx="200" ry="90" fill="url(#domePeakGradient)" stroke="#334155" strokeWidth="1.5" />
                <line x1="-200" y1="0" x2="200" y2="0" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="-90" x2="0" y2="90" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />

                {/* Layered Shaded 3D Potential Hill Mesh Contours */}
                {[
                  { m: 0.2, color: 'rgba(239, 68, 68, 0.4)', label: '0m GPR' },
                  { m: 2.0, color: 'rgba(249, 115, 22, 0.3)', label: '2m' },
                  { m: 5.0, color: 'rgba(245, 158, 11, 0.2)', label: '5m' },
                  { m: 10.0, color: 'rgba(234, 179, 8, 0.15)', label: '10m' },
                  { m: 15.0, color: 'rgba(16, 185, 129, 0.1)', label: '15m' },
                ].map(({ m, color, label }) => {
                  const fraction = m / 15;
                  const rx = 180 * Math.max(0.1, fraction);
                  const ry = 80 * Math.max(0.1, fraction);
                  const v = ieeeResults.calcVx(m);
                  const h = (v / Math.max(1, gprVolts)) * 130;
                  const isSelectedZone = distance <= m && (m === 2 || distance > [0, 2, 5, 10][ [0.2, 2, 5, 10, 15].indexOf(m) ]);
                  return (
                    <g key={m}>
                      <ellipse cx="0" cy={-h} rx={rx} ry={ry} fill={color} stroke={isSelectedZone ? '#38bdf8' : 'rgba(249, 115, 22, 0.5)'} strokeWidth={isSelectedZone ? '2' : '1'} />
                      <text x={rx + 4} y={-h + 3} fill={isSelectedZone ? '#38bdf8' : '#94a3b8'} fontSize="11" fontWeight="bold" fontFamily="monospace">
                        {label} ({(v/1000).toFixed(1)}kV)
                      </text>
                    </g>
                  );
                })}

                {/* Dome Peak Marker (GPR) */}
                <circle cx="0" cy="-130" r="7" fill="#ef4444" className="animate-ping" />
                <text x="0" y="-145" textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="black" fontFamily="monospace">
                  GPR PEAK = {ieeeResults.GPR_kV.toFixed(1)} kV
                </text>

                {/* Person Position & Realistic Human Avatar on 3D Slope */}
                {(() => {
                  const slopeX = (distance / 15) * 140;
                  const vFraction = (ieeeResults.calcVx(distance) / Math.max(1, gprVolts));
                  const slopeY = -vFraction * 120;

                  const vFraction2 = (ieeeResults.calcVx(distance + 1.0) / Math.max(1, gprVolts));
                  const slopeY2 = -vFraction2 * 120;

                  return (
                    <motion.g 
                      animate={{ x: slopeX, y: slopeY }}
                      transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      {/* Active Zone Aura ring under feet on 3D Dome */}
                      <ellipse cx="0" cy="0" rx="16" ry="6" fill={activeZone.bg} stroke={activeZone.color} strokeWidth="1.5" />

                      {/* Foot 1 Marker V(x) */}
                      <circle cx="-10" cy="0" r="4" fill="#38bdf8" />
                      
                      {/* Foot 2 Marker V(x+1) */}
                      <circle cx="10" cy={slopeY2 - slopeY} r="4" fill="#f59e0b" />

                      {/* Vertical Step Voltage Bar Delta V */}
                      {isStepMode ? (
                        <g>
                          <line x1="0" y1="0" x2="0" y2={slopeY2 - slopeY} stroke="#ef4444" strokeWidth="3" />
                          
                          {/* Foot Voltage Labels */}
                          <g transform="translate(25, -20)">
                            <rect x="0" y="0" width="160" height="42" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
                            <text x="8" y="15" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" className="tabular-nums">
                              Foot 1 ({distance.toFixed(1)}m): {Math.round(vFoot1)} V
                            </text>
                            <text x="8" y="30" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace" className="tabular-nums">
                              Foot 2 ({(distance + 1.0).toFixed(1)}m): {Math.round(vFoot2)} V
                            </text>
                          </g>

                          {/* Primary Step Voltage Banner */}
                          <g transform="translate(-140, -45)">
                            <rect x="0" y="0" width="130" height="26" rx="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                            <text x="65" y="17" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black" fontFamily="monospace" className="tabular-nums">
                              STEP = ΔV = {Math.round(actualStep)} V
                            </text>
                          </g>
                        </g>
                      ) : (
                        /* TOUCH MODE: Hand to Pole Reach Line */
                        <g>
                          <line x1="-slopeX" y1="-130 - slopeY" x2="0" y2="-45" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 4" />
                          <g transform="translate(-130, -55)">
                            <rect x="0" y="0" width="160" height="26" rx="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                            <text x="80" y="17" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black" fontFamily="monospace" className="tabular-nums">
                              TOUCH = GPR − V(x) = {Math.round(actualTouch)} V
                            </text>
                          </g>
                        </g>
                      )}

                      {/* REALISTIC HUMAN AVATAR STANDING ON 3D SLOPE */}
                      <g transform="translate(0, 0)">
                        <RealisticHumanAvatar
                          figureColor={personStatus.figureColor}
                          isInDanger={isInDanger}
                          isStepMode={isStepMode}
                          hasEHBoots={false}
                          hasGloves={false}
                          dangerRatio={dangerRatio}
                          prefersReducedMotion={prefersReducedMotion}
                          isReachingStructure={!isStepMode}
                        />
                      </g>
                    </motion.g>
                  );
                })()}

              </g>
            </motion.svg>
          )}
        </AnimatePresence>

      </div>

      {/* DANGER GAUGE (SEMICIRCULAR GAUGE + DUAL HORIZONTAL BAR) */}
      <div className="w-full bg-slate-900/95 border-t border-slate-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 font-mono">
        
        {/* Semicircular Danger Ratio Needle Gauge */}
        <div className="flex items-center gap-3">
          <div className="relative w-24 h-12 flex items-end justify-center overflow-hidden">
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="#334155" strokeWidth="8" />
              <path d="M 10,50 A 40,40 0 0,1 50,10" fill="none" stroke="#10b981" strokeWidth="8" />
              <path d="M 50,10 A 40,40 0 0,1 76.6,20" fill="none" stroke="#f59e0b" strokeWidth="8" />
              <path d="M 76.6,20 A 40,40 0 0,1 90,50" fill="none" stroke="#ef4444" strokeWidth="8" />
              
              <g transform="translate(50, 50)">
                <line
                  x1="0" y1="0" x2="0" y2="-34"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{
                    transform: `rotate(${needleAngle}deg)`,
                    transformOrigin: '0px 0px',
                    transition: prefersReducedMotion ? 'none' : 'transform 0.4s ease-out'
                  }}
                />
                <circle cx="0" cy="0" r="4" fill="#ffffff" />
              </g>
            </svg>
          </div>

          <div className="flex flex-col" aria-live="polite" aria-atomic="true">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Danger Gauge</span>
            <span className={cn("text-lg font-black tabular-nums leading-none", dangerRatio > 1.0 ? "text-red-400" : "text-green-400")}>
              {dangerRatio.toFixed(2)}×
            </span>
            <span className="text-[10px] text-slate-500">IEEE 80 Ratio</span>
          </div>
        </div>

        {/* Dual Horizontal Bar: ACTUAL vs TOLERABLE */}
        <div className="flex-1 max-w-sm w-full space-y-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-slate-400 uppercase">
              {isStepMode ? 'Actual Step (E_step)' : 'Actual Touch (E_touch)'}:
            </span>
            <span className={cn("tabular-nums font-black", activeVoltage > activeLimit ? "text-red-400" : "text-amber-400")}>
              {Math.round(activeVoltage)} V
            </span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <motion.div
              className={cn("h-full rounded-full", activeVoltage > activeLimit ? "bg-red-500 animate-pulse" : "bg-amber-400")}
              animate={{ width: `${Math.min(100, (activeVoltage / Math.max(1, gprVolts)) * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] font-bold pt-0.5">
            <span className="text-slate-400 uppercase">Tolerable Limit (IEEE 80):</span>
            <span className="text-cyan-400 tabular-nums font-black">{Math.round(activeLimit)} V</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <motion.div
              className="h-full bg-cyan-500 rounded-full"
              animate={{ width: `${Math.min(100, (activeLimit / Math.max(1, gprVolts)) * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-2">
          <span className={cn("font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border text-[11px] tabular-nums shadow-sm", personStatus.chipColor)}>
            {personStatus.chipText}
          </span>
        </div>

      </div>
    </div>
  );
}
