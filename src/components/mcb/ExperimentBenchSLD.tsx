import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { MCBState, TripCause, SystemType, CurrentType } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Zap, ShieldAlert, Cpu, Lightbulb, Flame, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { Application, Graphics, Container } from 'pixi.js';

export type LoadType = 'motor' | 'lamp' | 'impedance';
export type FaultLocation = 'line_side' | 'mid_cable' | 'load_side';

interface ExperimentBenchSLDProps {
  current: number;          // Instantaneous current (A)
  In: number;               // Rated current (A)
  state: MCBState;          // CLOSED, UNLATCHED, ARCING, OPEN_CLEARED
  tripCause: TripCause;
  bimetalTemp: number;      // °C
  bimetalTripTemp: number;    // °C threshold
  isToleranceZone: boolean;
  remainingTimeSec?: number; // Countdown timer until trip
  systemType?: SystemType;
  currentType?: CurrentType;
  faultLocation: FaultLocation;
  onFaultLocationChange: (loc: FaultLocation) => void;
  loadType: LoadType;
  onLoadTypeChange: (load: LoadType) => void;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  progress: number;
  speed: number;
  size: number;
  alpha: number;
  pathId: 'main' | 'fault' | 'spark';
  vx?: number;
  vy?: number;
}

export const ExperimentBenchSLD: React.FC<ExperimentBenchSLDProps> = ({
  current,
  In,
  state,
  tripCause,
  bimetalTemp,
  bimetalTripTemp = 130,
  isToleranceZone,
  remainingTimeSec,
  systemType = '1ph_230v',
  currentType = 'ac',
  faultLocation,
  onFaultLocationChange,
  loadType,
  onLoadTypeChange,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiCanvasRef = useRef<HTMLCanvasElement>(null);
  const pixiAppRef = useRef<Application | null>(null);

  const isTripped = state !== MCBState.CLOSED;
  const absCurrent = Math.abs(current);
  const currentMult = In > 0 ? absCurrent / In : 1;

  const isNormal = !isTripped && currentMult <= 1.13;
  const isOverload = !isTripped && currentMult > 1.13 && currentMult <= 1.45;
  const isShortCircuit = !isTripped && currentMult > 1.45;
  const is3Phase = systemType === '3ph_400v';

  // Cable Conductor Stroke Color
  let cableStroke = '#10b981'; // Green
  if (isTripped) {
    cableStroke = '#475569'; // Muted Gray
  } else if (currentMult > 3.0) {
    cableStroke = '#f43f5e'; // Red Hot Glow
  } else if (isOverload || isShortCircuit) {
    cableStroke = '#f59e0b'; // Amber Warm
  }

  const cableGlowWidth = isTripped ? 3 : currentMult > 3.0 ? 8 : isOverload ? 5.5 : 4;

  // Particle System & Arc Visuals via Canvas Loop / PixiJS
  useEffect(() => {
    const canvas = pixiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let sparks: Particle[] = [];
    let lastTime = performance.now();

    // Resize canvas
    const updateCanvasSize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = (rect.height - 40) * dpr;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();

    // Map normalized 0..800 coord to canvas pixel coord
    const toCanvasX = (svgX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect ? rect.width : 800;
      return (svgX / 800) * w;
    };

    const toCanvasY = (svgY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const h = rect ? Math.max(160, rect.height - 40) : 240;
      return (svgY / 240) * h;
    };

    // Initialize initial particles
    const maxParticles = isTripped ? 0 : Math.min(120, Math.floor(15 + currentMult * 8));
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: 0,
        y: 0,
        progress: Math.random(),
        speed: 0.003 + currentMult * 0.0035,
        size: 2.5 + Math.min(3, currentMult * 0.4),
        alpha: 0.3 + Math.random() * 0.7,
        pathId: 'main'
      });
    }

    // Trigger Spark burst on trip
    if (isTripped) {
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 4.5;
        sparks.push({
          x: toCanvasX(390),
          y: toCanvasY(110),
          progress: 0,
          speed: 0,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: 2 + Math.random() * 2.5,
          alpha: 1.0,
          pathId: 'spark'
        });
      }
    }

    // Animation Render Loop
    const render = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect ? rect.width : 800;
      const h = rect ? Math.max(160, rect.height - 40) : 240;

      ctx.clearRect(0, 0, w, h);

      // 1. FAULT NODE ELECTRIC ARC FLICKER
      if (!isTripped && currentMult > 1.45) {
        let faultX = 200;
        if (faultLocation === 'mid_cable') faultX = 570;
        if (faultLocation === 'load_side') faultX = 665;

        const cFaultX = toCanvasX(faultX);
        const cFaultY = toCanvasY(120);
        const cGroundY = toCanvasY(190);

        // Draw Jagged Arc Bolt
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(cFaultX, cFaultY);

        const segments = 6;
        const segH = (cGroundY - cFaultY) / segments;
        for (let s = 1; s < segments; s++) {
          const jitter = (Math.random() - 0.5) * 16;
          ctx.lineTo(cFaultX + jitter, cFaultY + s * segH);
        }
        ctx.lineTo(cFaultX, cGroundY);
        ctx.stroke();

        // Arc Core Flash
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cFaultX, cFaultY, 4 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. CURRENT PARTICLES FLOW (GRID -> MCB -> LOAD)
      if (!isTripped) {
        // Particle Color based on current multiplier
        let particleColor = 'rgba(16, 185, 129, '; // Green
        if (currentMult > 3.0) {
          particleColor = 'rgba(244, 63, 94, '; // Red
        } else if (currentMult > 1.13) {
          particleColor = 'rgba(245, 158, 11, '; // Amber
        }

        particles.forEach((p) => {
          p.progress += (0.004 + currentMult * 0.0035);
          if (p.progress > 1.0) p.progress = 0;

          // Path: X: 80 -> 720, Y: 120 (passing through MCB at 300..480)
          const svgX = 80 + p.progress * (720 - 80);
          let svgY = 120;

          // Inside MCB moving contact diversion
          if (svgX >= 350 && svgX <= 430) {
            svgY = 110;
          }

          const cX = toCanvasX(svgX);
          const cY = toCanvasY(svgY);

          ctx.fillStyle = `${particleColor}${p.alpha})`;
          ctx.beginPath();
          ctx.arc(cX, cY, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 3. CONTACT-OPEN SPARK BURST PARTICLES
      if (sparks.length > 0) {
        ctx.save();
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 6;

        sparks.forEach((sp) => {
          if (sp.vx !== undefined && sp.vy !== undefined) {
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.vy += 0.12; // Gravity
            sp.alpha = Math.max(0, sp.alpha - 0.025);

            ctx.globalAlpha = sp.alpha;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        sparks = sparks.filter((sp) => sp.alpha > 0.05);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentMult, isTripped, faultLocation]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-xl overflow-hidden font-mono select-none h-full',
        className
      )}
    >
      {/* Experiment Controls Header Bar */}
      <div className="flex items-center justify-between gap-1.5 mb-2 z-10 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
        {/* Load Selector */}
        <div className="flex items-center gap-1 text-[11px] font-bold bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
          <span className="text-slate-400 pl-1">Load:</span>
          {(['motor', 'lamp', 'impedance'] as LoadType[]).map((type) => (
            <button
              key={type}
              onClick={() => onLoadTypeChange(type)}
              className={cn(
                "px-2.5 py-1 rounded uppercase font-black transition-all cursor-pointer min-h-[30px] shrink-0",
                loadType === type ? "bg-sky-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              )}
            >
              {type === 'motor' ? '⚡ Motor' : type === 'lamp' ? '💡 Lamp' : '🔥 Heater'}
            </button>
          ))}
        </div>

        {/* Fault Location Switch Selector */}
        <div className="flex items-center gap-1 text-[11px] font-bold bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
          <span className="text-slate-400 pl-1">Fault Switch:</span>
          {(['line_side', 'mid_cable', 'load_side'] as FaultLocation[]).map((loc) => (
            <button
              key={loc}
              onClick={() => onFaultLocationChange(loc)}
              className={cn(
                "px-2.5 py-1 rounded uppercase font-black transition-all cursor-pointer min-h-[30px] shrink-0",
                faultLocation === loc ? "bg-rose-500 text-white shadow" : "text-slate-400 hover:text-white"
              )}
            >
              {loc === 'line_side' ? 'Line' : loc === 'mid_cable' ? 'Mid' : 'Load'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Experiment Bench Canvas + Pixi Overlay */}
      <div className="relative w-full flex-1 min-h-[160px] flex items-center justify-center overflow-hidden rounded-lg bg-[#090d16] border border-slate-850">
        
        {/* ANCHORED REVERSE COUNTDOWN TIMER HUD CHIP */}
        <div className="absolute top-2 right-2 z-20">
          {isTripped ? (
            <span className="px-3 py-1 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-300 text-xs font-black uppercase shadow animate-pulse flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> TRIPPED ({tripCause})
            </span>
          ) : remainingTimeSec !== undefined && remainingTimeSec < 3600 ? (
            <span className="px-3 py-1 rounded-lg bg-amber-950/90 border border-amber-500 text-amber-300 text-xs font-black uppercase shadow flex items-center gap-1.5 animate-pulse">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" /> TRIP IN: {remainingTimeSec.toFixed(1)}s
            </span>
          ) : (
            <span className="px-3 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold shadow flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" /> NO TRIP (1.13x In)
            </span>
          )}
        </div>

        {/* Scaled Full-bleed SVG Schematic */}
        <svg viewBox="0 0 800 240" className="w-full h-full preserve-3d overflow-visible z-10">
          <defs>
            <filter id="conductorGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <pattern id="benchGrid800" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <rect width="800" height="240" fill="url(#benchGrid800)" rx="10" />

          {/* 1. POWER SOURCE (GRID) (X: 30..110) */}
          <g transform="translate(30, 80)">
            <rect x="0" y="0" width="75" height="75" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
            <Zap className="w-7 h-7 text-amber-400" x="24" y="16" />
            <text x="37" y="60" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="black">
              {is3Phase ? '3Ø 400V' : '1Ø 230V'}
            </text>
            {/* Leader-line */}
            <path d="M 37,-5 L 37,-15 L 75,-15" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="80" y="-12" fill="#94a3b8" fontSize="11" fontWeight="bold">GRID SOURCE</text>
          </g>

          {/* Conductor Line 1: Source to MCB (X: 105 -> 300) */}
          <line
            x1="105" y1="120" x2="300" y2="120"
            stroke={cableStroke} strokeWidth={cableGlowWidth}
            filter={currentMult > 3.0 ? 'url(#conductorGlow)' : undefined}
          />

          {/* Line-Side Fault Tap Node (X: 200) */}
          {faultLocation === 'line_side' && (
            <g transform="translate(200, 120)">
              <circle cx="0" cy="0" r="6" fill="#f43f5e" />
              <line x1="0" y1="0" x2="0" y2="60" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="4 3" />
              <path d="M -12,60 L 12,60 M -8,65 L 8,65 M -4,70 L 4,70" stroke="#f43f5e" strokeWidth="2" />
              <text x="0" y="-14" textAnchor="middle" fill="#f43f5e" fontSize="11" fontWeight="bold">
                ⚡ Line-Side Fault
              </text>
            </g>
          )}

          {/* 2. MCB BREAKER MODULE ENCLOSURE (X: 300..490, Y: 45..195) */}
          <g transform="translate(300, 45)">
            <rect
              x="0" y="0" width="190" height="150" rx="12"
              fill="#0b1120" stroke={isTripped ? '#f43f5e' : '#10b981'} strokeWidth="2.5"
            />
            {/* Breaker Header Label */}
            <text x="95" y="24" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="black">
              MCB ({In}A) • IEC 60898-1
            </text>

            {/* Leader-line to MCB */}
            <path d="M 95,-5 L 95,-15 L 140,-15" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="145" y="-12" fill="#94a3b8" fontSize="11" fontWeight="bold">MCB MECHANISM</text>

            {/* Contact Posts */}
            <circle cx="20" cy="75" r="5" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
            <circle cx="170" cy="75" r="5" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />

            {/* Moving Breaker Contact Blade */}
            <line x1="20" y1="75" x2="65" y2="75" stroke="#e2e8f0" strokeWidth="3.5" />
            <line
              x1="65" y1="75"
              x2={isTripped ? "95" : "125"}
              y2={isTripped ? "42" : "75"}
              stroke={isTripped ? '#f43f5e' : '#10b981'} strokeWidth="4" strokeLinecap="round"
            />
            <line x1="125" y1="75" x2="170" y2="75" stroke="#e2e8f0" strokeWidth="3.5" />

            {/* MINI BIMETAL HEAT STRIP */}
            <g transform="translate(35, 105)">
              <rect
                x="0" y="0" width="55" height="18" rx="4"
                fill={bimetalTemp >= bimetalTripTemp ? '#ef4444' : bimetalTemp > 60 ? '#f59e0b' : '#334155'}
                stroke="#64748b" strokeWidth="1.5"
              />
              <text x="27" y="13" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                {bimetalTemp.toFixed(0)}°C
              </text>
              <text x="27" y="30" textAnchor="middle" fill="#94a3b8" fontSize="10">Bimetal</text>
            </g>

            {/* MINI MAGNETIC SOLENOID */}
            <g transform="translate(105, 105)">
              <rect
                x="0" y="0" width="55" height="18" rx="4"
                fill={currentMult >= 5.0 ? '#06b6d4' : '#1e293b'}
                stroke={currentMult >= 5.0 ? '#38bdf8' : '#64748b'} strokeWidth="1.5"
              />
              <text x="27" y="13" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                {currentMult >= 5.0 ? '⚡ MAG' : 'Solenoid'}
              </text>
              <text x="27" y="30" textAnchor="middle" fill="#94a3b8" fontSize="10">Magnetic</text>
            </g>
          </g>

          {/* Conductor Line 2: MCB to Load (X: 490 -> 680) */}
          <line
            x1="490" y1="120" x2="680" y2="120"
            stroke={cableStroke} strokeWidth={cableGlowWidth}
            filter={currentMult > 3.0 ? 'url(#conductorGlow)' : undefined}
          />

          {/* Mid-Cable Fault Tap Node (X: 580) */}
          {faultLocation === 'mid_cable' && (
            <g transform="translate(580, 120)">
              <circle cx="0" cy="0" r="6" fill="#f43f5e" />
              <line x1="0" y1="0" x2="0" y2="60" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="4 3" />
              <path d="M -12,60 L 12,60 M -8,65 L 8,65 M -4,70 L 4,70" stroke="#f43f5e" strokeWidth="2" />
              <text x="0" y="-14" textAnchor="middle" fill="#f43f5e" fontSize="11" fontWeight="bold">
                ⚡ Mid-Cable Fault
              </text>
            </g>
          )}

          {/* Load-Side Fault Tap Node (X: 665) */}
          {faultLocation === 'load_side' && (
            <g transform="translate(665, 120)">
              <circle cx="0" cy="0" r="6" fill="#f43f5e" />
              <line x1="0" y1="0" x2="0" y2="60" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="4 3" />
              <path d="M -12,60 L 12,60 M -8,65 L 8,65 M -4,70 L 4,70" stroke="#f43f5e" strokeWidth="2" />
              <text x="0" y="-14" textAnchor="middle" fill="#f43f5e" fontSize="11" fontWeight="bold">
                ⚡ Load-Side Fault
              </text>
            </g>
          )}

          {/* 3. LOAD ENCLOSURE (X: 680..770, Y: 80) */}
          <g transform="translate(680, 80)">
            <rect x="0" y="0" width="75" height="75" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
            {loadType === 'motor' ? (
              <text x="37" y="48" textAnchor="middle" fill="#38bdf8" fontSize="28" fontWeight="black">M</text>
            ) : loadType === 'lamp' ? (
              <circle cx="37" cy="37" r="18" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
            ) : (
              <path d="M 15,37 L 26,22 L 37,52 L 48,22 L 60,37" fill="none" stroke="#f97316" strokeWidth="3" />
            )}
            <text x="37" y="92" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
              {loadType === 'motor' ? 'Motor Load' : loadType === 'lamp' ? 'Lamp Load' : 'Heater Load'}
            </text>
            {/* Leader-line to Load */}
            <path d="M 37,-5 L 37,-15 L 0,-15" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="-65" y="-12" fill="#94a3b8" fontSize="11" fontWeight="bold">LOAD SYMBOL</text>
          </g>
        </svg>

        {/* PIXIJS / 2D CANVAS PARTICLE & FAULT ARC OVERLAY */}
        <canvas
          ref={pixiCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />
      </div>

      {/* Footer Metrics Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] pt-1 shrink-0">
        <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 font-bold uppercase">Fault Location</span>
          <span className="text-xs font-black text-rose-400 uppercase">{faultLocation.replace('_', ' ')}</span>
        </div>
        <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 font-bold uppercase">Current (Ia)</span>
          <span className="text-xs font-black text-emerald-400 tabular-nums">{current.toFixed(1)} A</span>
        </div>
        <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 font-bold uppercase">Bimetal Temp</span>
          <span className={cn('text-xs font-black tabular-nums', bimetalTemp >= bimetalTripTemp ? 'text-rose-400' : 'text-amber-400')}>
            {bimetalTemp.toFixed(1)}°C
          </span>
        </div>
        <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 font-bold uppercase">State</span>
          <span className={cn('text-xs font-black', isTripped ? 'text-rose-400' : 'text-emerald-400')}>{state}</span>
        </div>
      </div>
    </div>
  );
};
