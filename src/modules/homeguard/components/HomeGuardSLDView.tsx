/**
 * HomeGuardSLDView.tsx
 * 
 * Crystal-Clear Residential Single Line Diagram (SLD) & Power Path Visualizer:
 * - Designed for the masses (housewives, students, homeowners) to understand 100% of electrical flow in 10 seconds!
 * - Clean, color-coded visual flow: Grid Supply (230V) -> Main Service Meter -> Shock Guard (RCCB) -> Fire Guards (MCBs) -> Home Appliances -> Earth Pit (5.2Ω).
 * - Live animated electron/energy flow showing real-time amps and path (Live, Neutral return, Earth leakage).
 * - Interactive node tooltips explaining what each component does in everyday plain English.
 * - Dynamic fault spotlights (Overload heat, Short circuit flash, Child shock detection, Water leak detection, Broken earth).
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { CircuitState } from '../hooks/useHomeGuardEngine';
import { cn } from '@/src/lib/utils';
import {
  Zap,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Droplets,
  HeartPulse,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Home
} from 'lucide-react';

export interface HomeGuardSLDViewProps {
  circuitStates: Record<string, CircuitState>;
  activeApplianceIds: string[];
  isTripped: boolean;
  isShortCircuit: boolean;
  isOverloaded: boolean;
  scenarioId?: string;
  onRecloseBreaker?: (circuitId: string) => void;
  onTestTripRCCB?: () => void;
  className?: string;
}

interface Particle {
  progress: number;
  speed: number;
  pathId: 'mains' | 'c1' | 'c2' | 'c3' | 'neutral' | 'earth_leak';
}

export const HomeGuardSLDView: React.FC<HomeGuardSLDViewProps> = ({
  circuitStates,
  activeApplianceIds,
  isTripped,
  isShortCircuit,
  isOverloaded,
  scenarioId = 'winter_overload_145',
  onRecloseBreaker,
  onTestTripRCCB,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const c2State = circuitStates.c2_living_sockets;
  const rccbState = circuitStates.main_rccb;
  const c1State = circuitStates.c1_lighting;
  const c3State = circuitStates.c3_kitchen_sockets;

  const isChildShock = scenarioId === 'child_touch_shock' || scenarioId === 'preset_child_shock';
  const isWetBath = scenarioId === 'kettle_earth_leakage' || scenarioId === 'preset_wet_bath';
  const isBrokenEarth = scenarioId === 'broken_earth_velcb' || scenarioId === 'preset_broken_earth';

  // Live Wattage calculation
  const totalWatts = useMemo(() => {
    let w = 0;
    if (activeApplianceIds.includes('tv_console')) w += 150;
    if (activeApplianceIds.includes('space_heater')) w += 2000;
    if (activeApplianceIds.includes('kettle')) w += 2200;
    if (activeApplianceIds.includes('microwave')) w += 1200;
    return w;
  }, [activeApplianceIds]);

  const livingCurrentAmps = isTripped ? 0 : (c2State ? c2State.currentAmps : 0);

  // Animated particle flow
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];

    // Define 2D SLD vector paths (0..800, 0..420 space)
    const sldPaths = {
      mains: [
        { x: 50, y: 190 },
        { x: 130, y: 190 },
        { x: 230, y: 190 },
        { x: 340, y: 190 }
      ],
      c1: [
        { x: 340, y: 190 },
        { x: 420, y: 90 },
        { x: 530, y: 90 },
        { x: 670, y: 90 }
      ],
      c2: [
        { x: 340, y: 190 },
        { x: 420, y: 190 },
        { x: 530, y: 190 },
        { x: 670, y: 190 }
      ],
      c3: [
        { x: 340, y: 190 },
        { x: 420, y: 290 },
        { x: 530, y: 290 },
        { x: 670, y: 290 }
      ],
      neutral: [
        { x: 670, y: 215 },
        { x: 530, y: 215 },
        { x: 340, y: 215 },
        { x: 230, y: 215 },
        { x: 50, y: 215 }
      ],
      earth_leak: [
        { x: 670, y: 190 },
        { x: 670, y: 360 },
        { x: 340, y: 360 },
        { x: 150, y: 360 }
      ]
    };

    const count = isOverloaded ? 35 : 24;
    const pathsList: ('mains' | 'c1' | 'c2' | 'c3' | 'neutral')[] = ['mains', 'c1', 'c2', 'c3', 'neutral'];
    for (let i = 0; i < count; i++) {
      particles.push({
        progress: Math.random(),
        speed: 0.006 + Math.random() * 0.006,
        pathId: pathsList[i % pathsList.length]
      });
    }

    if ((isChildShock || isWetBath) && !isTripped) {
      for (let i = 0; i < 10; i++) {
        particles.push({
          progress: Math.random(),
          speed: 0.015 + Math.random() * 0.01,
          pathId: 'earth_leak'
        });
      }
    }

    const interpolate = (pts: { x: number; y: number }[], t: number) => {
      if (pts.length === 2) {
        return {
          x: pts[0].x + (pts[1].x - pts[0].x) * t,
          y: pts[0].y + (pts[1].y - pts[0].y) * t
        };
      }
      const segCount = pts.length - 1;
      const segIndex = Math.min(segCount - 1, Math.floor(t * segCount));
      const segT = (t * segCount) - segIndex;
      const p1 = pts[segIndex];
      const p2 = pts[segIndex + 1];
      return {
        x: p1.x + (p2.x - p1.x) * segT,
        y: p1.y + (p2.y - p1.y) * segT
      };
    };

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const sx = w / 800;
      const sy = h / 420;

      if (!isTripped) {
        particles.forEach(p => {
          const speedMod = isOverloaded && p.pathId === 'c2' ? 2.5 : 1.0;
          p.progress += p.speed * speedMod;
          if (p.progress > 1) p.progress = 0;

          const pts = sldPaths[p.pathId];
          if (!pts) return;

          const head = interpolate(pts, p.progress);
          const tail = interpolate(pts, Math.max(0, p.progress - 0.03 * speedMod));

          const hx = head.x * sx;
          const hy = head.y * sy;
          const tx = tail.x * sx;
          const ty = tail.y * sy;

          if (p.pathId === 'earth_leak') {
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(hx, hy);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#f87171';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
            ctx.fill();
          } else if (p.pathId === 'neutral') {
            ctx.beginPath();
            ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#60a5fa';
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 6;
            ctx.fill();
          } else {
            const isHot = isOverloaded && p.pathId === 'c2';
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(hx, hy);
            ctx.strokeStyle = isHot ? '#f59e0b' : '#34d399';
            ctx.lineWidth = isHot ? 3.5 : 2.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(hx, hy, isHot ? 4 : 3, 0, Math.PI * 2);
            ctx.fillStyle = isHot ? '#fef08a' : '#a7f3d0';
            ctx.shadowColor = isHot ? '#f59e0b' : '#10b981';
            ctx.shadowBlur = isHot ? 10 : 6;
            ctx.fill();
          }
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isTripped, isOverloaded, isChildShock, isWetBath]);

  return (
    <div className={cn(
      "relative w-full h-full bg-gradient-to-b from-slate-950 via-[#0a1222] to-[#050b16] rounded-2xl overflow-hidden flex flex-col font-sans select-none border border-slate-800 shadow-2xl",
      className
    )}>
      {/* 1. SLD HEADER BAR */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-sm shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-black text-white tracking-wide flex items-center gap-1.5">
              ⚡ HOW ELECTRICITY FLOWS IN YOUR HOME (SLD)
            </span>
          </div>
        </div>

        {/* Wire Legend */}
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-slate-300">Live (Power In)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span className="text-slate-300">Neutral (Return)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            <span className="text-slate-300">Earth (Safety Ground)</span>
          </div>
        </div>
      </div>

      {/* 2. SVG VECTOR SLD + CANVAS PARTICLE OVERLAY */}
      <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox="0 0 800 420"
          className="w-full h-full max-h-full object-contain overflow-visible select-none"
        >
          <defs>
            <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BACKGROUND BUSBAR BARS */}
          {/* Live Incomer Line */}
          <path d="M 50 190 L 230 190" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          {/* Neutral Incomer Line */}
          <path d="M 50 215 L 230 215" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />

          {/* DB Box Distribution Busbars */}
          <rect x="335" y="70" width="8" height="240" rx="4" fill="#ef4444" opacity="0.8" />
          <text x="339" y="60" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">LIVE BUS</text>

          <rect x="355" y="70" width="6" height="240" rx="3" fill="#3b82f6" opacity="0.8" />
          <text x="358" y="60" textAnchor="middle" fill="#3b82f6" fontSize="8" fontWeight="bold">NEUTRAL</text>

          {/* Branch Lines to 3 Circuits */}
          {/* Circuit 1: Lighting */}
          <path d="M 340 90 L 420 90 L 530 90 L 670 90" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <path d="M 670 105 L 530 105 L 358 105" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeDasharray="4,3" />

          {/* Circuit 2: Living Room Sockets (Target) */}
          <path
            d="M 340 190 L 420 190 L 530 190 L 670 190"
            fill="none"
            stroke={
              isTripped ? "#475569" :
              isOverloaded ? "#f59e0b" :
              "#10b981"
            }
            strokeWidth={isOverloaded ? "5" : "3.5"}
            strokeLinecap="round"
            filter={isOverloaded ? "url(#glowFilter)" : undefined}
          />
          <path d="M 670 215 L 530 215 L 358 215" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

          {/* Circuit 3: Kitchen Sockets */}
          <path d="M 340 290 L 420 290 L 530 290 L 670 290" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <path d="M 670 305 L 530 305 L 358 305" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeDasharray="4,3" />

          {/* Protective Earth (PE) Green Line */}
          <path
            d="M 150 360 L 670 360"
            fill="none"
            stroke={isBrokenEarth ? "#ef4444" : "#22c55e"}
            strokeWidth={isBrokenEarth ? "3" : "3"}
            strokeDasharray={isBrokenEarth ? "6,4" : undefined}
          />
          <path d="M 670 190 L 670 360" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="3,3" />

          {/* ==================== 1. STREET ELECTRICAL SERVICE PILLAR ==================== */}
          <g transform="translate(50, 190)">
            {/* Feeder Pillar Green Enclosure */}
            <rect x="-38" y="-55" width="76" height="110" rx="8" fill="#14532d" stroke="#22c55e" strokeWidth="2" />
            <polygon points="-38,-55 38,-55 44,-64 -32,-64" fill="#166534" stroke="#22c55e" strokeWidth="1.5" />
            
            {/* Warning Plate */}
            <rect x="-26" y="-48" width="52" height="18" rx="2" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            <text x="0" y="-36" textAnchor="middle" fill="#713f12" fontSize="7.5" fontWeight="black">⚡ 230V / 415V</text>
            <text x="0" y="-30" textAnchor="middle" fill="#713f12" fontSize="5.5" fontWeight="bold">DANGER / खतरा</text>

            {/* Ventilation Louvers */}
            <line x1="-20" y1="-20" x2="20" y2="-20" stroke="#166534" strokeWidth="2" />
            <line x1="-20" y1="-14" x2="20" y2="-14" stroke="#166534" strokeWidth="2" />
            <line x1="-20" y1="-8" x2="20" y2="-8" stroke="#166534" strokeWidth="2" />

            <text x="0" y="8" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="black">ELEC. DEPT.</text>
            <text x="0" y="20" textAnchor="middle" fill="#86efac" fontSize="7.5" fontWeight="bold">FEEDER PILLAR</text>
            <text x="0" y="32" textAnchor="middle" fill="#38bdf8" fontSize="7">Main Street Grid</text>
            <rect x="-30" y="38" width="60" height="12" rx="6" fill="#0f172a" stroke="#22c55e" />
            <text x="0" y="47" textAnchor="middle" fill="#22c55e" fontSize="7" fontWeight="bold">● 230V 50Hz</text>
          </g>

          {/* ==================== 2. MAIN ELECTRICITY METER ==================== */}
          <g transform="translate(145, 190)">
            <rect x="-25" y="-40" width="50" height="80" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
            <rect x="-18" y="-30" width="36" height="18" rx="3" fill="#1e293b" />
            <text x="0" y="-18" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="black" fontFamily="monospace">04218 kWh</text>
            <text x="0" y="6" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">ENERGY</text>
            <text x="0" y="16" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">METER</text>
            <text x="0" y="30" textAnchor="middle" fill="#64748b" fontSize="6.5">Utility Billing</text>
          </g>

          {/* ==================== 3. MAIN RCCB (SHOCK DETECTIVE) ==================== */}
          <g
            transform="translate(265, 190)"
            onClick={onTestTripRCCB}
            className="cursor-pointer group"
          >
            <rect
              x="-40" y="-60" width="80" height="120" rx="10"
              fill={rccbState.state !== 'CLOSED' ? "#450a0a" : "#064e3b"}
              stroke={rccbState.state !== 'CLOSED' ? "#ef4444" : "#10b981"}
              strokeWidth="2.5"
              filter="drop-shadow(0 0 12px rgba(0,0,0,0.6))"
            />
            {/* Status LED */}
            <circle
              cx="26" cy="-46" r="4"
              fill={rccbState.state !== 'CLOSED' ? "#ef4444" : "#10b981"}
              className={rccbState.state !== 'CLOSED' ? "animate-ping" : undefined}
            />

            <text x="0" y="-38" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="black">
              1. MAIN RCCB
            </text>
            <text x="0" y="-24" textAnchor="middle" fill={rccbState.state !== 'CLOSED' ? "#fca5a5" : "#a7f3d0"} fontSize="7.5" fontWeight="black">
              SHOCK GUARD (30mA)
            </text>

            {/* Switch Handle */}
            <rect x="-14" y="-14" width="28" height="28" rx="4" fill="#0f172a" />
            <line
              x1="0"
              y1={rccbState.state !== 'CLOSED' ? 4 : -8}
              x2="0"
              y2={rccbState.state !== 'CLOSED' ? 10 : -2}
              stroke={rccbState.state !== 'CLOSED' ? "#ef4444" : "#10b981"}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Test button */}
            <rect x="-24" y="24" width="48" height="16" rx="8" fill="#f59e0b" />
            <text x="0" y="35" textAnchor="middle" fill="#020617" fontSize="8" fontWeight="black">
              🟡 TEST 'T'
            </text>

            <text x="0" y="52" textAnchor="middle" fill="#cbd5e1" fontSize="7" fontWeight="bold">
              {rccbState.state !== 'CLOSED' ? '🔴 TRIPPED!' : '🟢 ACTIVE (0.03s)'}
            </text>

            {/* Trip explanation callout */}
            {rccbState.state !== 'CLOSED' && (
              <g transform="translate(0, -75)">
                <rect x="-75" y="-12" width="150" height="24" rx="12" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fill="#fecaca" fontSize="8" fontWeight="black">
                  🛡️ RCCB TRIPPED IN 0.03s!
                </text>
              </g>
            )}
          </g>

          {/* ==================== 4. BRANCH MCBs ==================== */}
          {/* C1 Lighting MCB */}
          <g transform="translate(460, 90)">
            <rect x="-28" y="-26" width="56" height="52" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="-12" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="black">MCB 10A</text>
            <text x="0" y="0" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">Lights</text>
            <rect x="-16" y="8" width="32" height="12" rx="4" fill="#0284c7" />
            <text x="0" y="17" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">ON</text>
          </g>

          {/* C2 Living Room MCB (Target) */}
          <g
            transform="translate(460, 190)"
            onClick={() => onRecloseBreaker && onRecloseBreaker('c2_living_sockets')}
            className="cursor-pointer group"
          >
            <rect
              x="-34" y="-36" width="68" height="72" rx="8"
              fill={c2State.state !== 'CLOSED' ? "#450a0a" : "#1e293b"}
              stroke={c2State.state !== 'CLOSED' ? "#ef4444" : isOverloaded ? "#f59e0b" : "#10b981"}
              strokeWidth="2"
              filter="drop-shadow(0 0 10px rgba(0,0,0,0.5))"
            />
            <text x="0" y="-20" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="black">
              2. MCB 16A ★
            </text>
            <text x="0" y="-8" textAnchor="middle" fill="#fef08a" fontSize="7" fontWeight="bold">
              FIRE GUARD
            </text>

            <rect
              x="-24" y="2" width="48" height="16" rx="6"
              fill={c2State.state !== 'CLOSED' ? "#ef4444" : "#10b981"}
            />
            <text x="0" y="13" textAnchor="middle" fill="#020617" fontSize="7.5" fontWeight="black">
              {c2State.state !== 'CLOSED' ? '⬆ PUSH UP' : '● ON (16A)'}
            </text>
            <text x="0" y="28" textAnchor="middle" fill="#94a3b8" fontSize="6.5">
              Living Sockets
            </text>

            {/* Overload Callout */}
            {isOverloaded && !isTripped && (
              <g transform="translate(0, -48)">
                <rect x="-65" y="-10" width="130" height="20" rx="10" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" className="animate-pulse" />
                <text x="0" y="3.5" textAnchor="middle" fill="#fef08a" fontSize="7.5" fontWeight="black">
                  🔥 23A / 16A OVERLOAD!
                </text>
              </g>
            )}

            {/* Short Circuit Callout */}
            {isShortCircuit && (
              <g transform="translate(0, -48)">
                <rect x="-70" y="-10" width="140" height="20" rx="10" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" className="animate-pulse" />
                <text x="0" y="3.5" textAnchor="middle" fill="#fecaca" fontSize="7.5" fontWeight="black">
                  ⚡ 250A SHORT CIRCUIT!
                </text>
              </g>
            )}
          </g>

          {/* C3 Kitchen MCB */}
          <g transform="translate(460, 290)">
            <rect x="-28" y="-26" width="56" height="52" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
            <text x="0" y="-12" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="black">MCB 16A</text>
            <text x="0" y="0" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">Kitchen</text>
            <rect x="-16" y="8" width="32" height="12" rx="4" fill="#059669" />
            <text x="0" y="17" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">ON</text>
          </g>

          {/* ==================== 5. END APPLIANCES & ROOM LOADS ==================== */}
          {/* C1: Ceiling Lamp */}
          <g transform="translate(670, 90)">
            <circle cx="0" cy="0" r="18" fill="#fef08a" fillOpacity="0.3" stroke="#facc15" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="10" fill="#fef08a" />
            <text x="0" y="28" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold">Lights (150W)</text>
          </g>

          {/* C2: Living Room Appliances / Socket Board */}
          <g transform="translate(670, 190)">
            <rect
              x="-60" y="-45" width="120" height="90" rx="10"
              fill="#0f172a"
              stroke={isShortCircuit ? "#ef4444" : isOverloaded ? "#f59e0b" : "#38bdf8"}
              strokeWidth="2"
            />
            <text x="0" y="-28" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="black">
              LIVING ROOM LOAD
            </text>

            <text x="0" y="-14" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">
              📺 TV (150W) + ⚡ HEATER
            </text>
            <text x="0" y="-2" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="bold">
              {totalWatts}W Total ({livingCurrentAmps.toFixed(1)}A)
            </text>

            {/* Child Shock Scenario Badge */}
            {isChildShock && (
              <g transform="translate(0, 20)">
                <rect x="-50" y="-8" width="100" height="16" rx="8" fill={isTripped ? "#064e3b" : "#7f1d1d"} stroke={isTripped ? "#10b981" : "#ef4444"} />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="black">
                  {isTripped ? '👶 CHILD SAVED! ✨' : '⚡ 230mA SHOCK RISK!'}
                </text>
              </g>
            )}
          </g>

          {/* C3: Kitchen Appliances */}
          <g transform="translate(670, 290)">
            <rect x="-50" y="-28" width="100" height="56" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
            <text x="0" y="-12" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">KITCHEN</text>
            <text x="0" y="2" textAnchor="middle" fill="#a7f3d0" fontSize="7.5">Kettle + Microwave</text>
            <text x="0" y="16" textAnchor="middle" fill="#64748b" fontSize="6.5">3400W Safe Ring</text>
          </g>

          {/* ==================== 6. OUTDOOR EARTH PIT (GROUND ELECTRODE) ==================== */}
          <g transform="translate(150, 360)">
            <rect x="-50" y="-18" width="100" height="36" rx="8" fill="#1e293b" stroke="#16a34a" strokeWidth="2" />
            <text x="0" y="-4" textAnchor="middle" fill="#22c55e" fontSize="8" fontWeight="black">EARTH GROUND PIT</text>
            <text x="0" y="9" textAnchor="middle" fill="#94a3b8" fontSize="7">Solid Rod Ra ≈ 5.2 Ω</text>

            {isBrokenEarth && (
              <g transform="translate(0, -28)">
                <rect x="-60" y="-8" width="120" height="16" rx="8" fill="#7f1d1d" stroke="#ef4444" />
                <text x="0" y="3" textAnchor="middle" fill="#fecaca" fontSize="7" fontWeight="black">
                  ❌ SEVERED EARTH WIRE!
                </text>
              </g>
            )}
          </g>
        </svg>

        {/* Live Canvas Particle Loop */}
        <canvas
          ref={canvasRef}
          width={800}
          height={420}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      </div>

      {/* 3. PLAIN ENGLISH EXPLANATION FOOTER & KIRCHHOFF TELEMETRY */}
      <div className="px-3 py-2 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400">Phase (Live):</span>
            <span className="text-white font-black">{!isTripped ? `${(totalWatts / 230).toFixed(1)}A ➔` : '0.0A'}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-blue-400">Neutral:</span>
            <span className="text-white font-black">{!isTripped ? `${(totalWatts / 230).toFixed(1)}A ⬅` : '0.0A'}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-400">Earth:</span>
            <span className="text-emerald-300 font-black">
              {isWetBath && !isTripped ? '45.0mA ⤓' : isChildShock && !isTripped ? '230.0mA ⤓' : '0.0mA (Balanced)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTripped ? (
            <button
              type="button"
              onClick={() => onRecloseBreaker && onRecloseBreaker('c2_living_sockets')}
              className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer animate-pulse shrink-0"
            >
              ⬆ PUSH SWITCH UP (RESTORE POWER)
            </button>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold text-[11px]">
              ✓ Kirchhoff Law: I_in = I_return (100% Balanced)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
