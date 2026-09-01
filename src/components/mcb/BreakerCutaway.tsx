import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { MCBState, TripCause } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Clock, ShieldAlert, Zap, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

interface BreakerCutawayProps {
  temperature: number;      // Bimetal temp °C
  bimetalTripTemp?: number;  // °C threshold (default 130°C)
  state: MCBState;          // CLOSED, UNLATCHED, ARCING, OPEN_CLEARED
  tripCause: TripCause;
  current?: number;
  In?: number;
  timeLapseSpeed?: number;
  remainingTimeSec?: number; // Countdown timer until trip
  className?: string;
}

interface ArcParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  plateIdx: number;
  alpha: number;
  size: number;
  color: string;
}

export const BreakerCutaway: React.FC<BreakerCutawayProps> = ({
  temperature,
  bimetalTripTemp = 130,
  state,
  tripCause,
  current = 0,
  In = 16,
  timeLapseSpeed = 1,
  remainingTimeSec,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [scrubProgress, setScrubProgress] = useState<number | null>(null);
  const [isManualScrub, setIsManualScrub] = useState<boolean>(false);

  const isTripped = state !== MCBState.CLOSED;
  const isMagneticTrip = tripCause === TripCause.MAGNETIC || tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE;
  const isOverload = tripCause === TripCause.THERMAL || temperature > 60;

  // Effective scrub progress (0.0: Closed -> 0.3: Unlatched -> 0.7: Arcing -> 1.0: Cleared)
  const effectiveProgress = useMemo(() => {
    if (scrubProgress !== null) return scrubProgress;
    if (state === MCBState.CLOSED) return 0.0;
    if (state === MCBState.UNLATCHED) return 0.35;
    if (state === MCBState.ARCING) return 0.7;
    return 1.0;
  }, [scrubProgress, state]);

  // Bimetal deflection angle (0 to 35 degrees)
  const bimetalDeflection = useMemo(() => {
    if (isManualScrub && scrubProgress !== null) {
      return scrubProgress * 35;
    }
    return Math.min(
      35,
      Math.max(0, ((temperature - 30) / (bimetalTripTemp - 30)) * 35)
    );
  }, [temperature, bimetalTripTemp, isManualScrub, scrubProgress]);

  // Contact opening angle (0 deg: Closed -> 45 deg: Fully open)
  const contactAngle = effectiveProgress * 45;

  // Handle position (0 deg: Up/ON -> 35 deg: Snapped Down/OFF)
  const handleAngle = effectiveProgress * 35;

  // Plunger stroke (0px: Rest -> -25px: Struck Latch)
  const plungerOffset = isMagneticTrip || (isManualScrub && effectiveProgress > 0.2) ? -28 : 0;

  // PixiJS / 2D Canvas Arc Plasma & Chute Extinction Stream
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let arcParticles: ArcParticle[] = [];
    let lastTime = performance.now();

    const updateCanvasSize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = (rect.height - 45) * dpr;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();

    const toCanvasX = (svgX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect ? rect.width : 750;
      return (svgX / 750) * w;
    };

    const toCanvasY = (svgY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const h = rect ? Math.max(160, rect.height - 45) : 320;
      return (svgY / 320) * h;
    };

    // Render 60fps Arc Stream
    const render = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect ? rect.width : 750;
      const h = rect ? Math.max(160, rect.height - 45) : 320;

      ctx.clearRect(0, 0, w, h);

      // Trigger Arc Particles when unlatching / arcing
      const isArcingNow = state === MCBState.ARCING || (isManualScrub && effectiveProgress > 0.3 && effectiveProgress < 0.95);

      if (isArcingNow) {
        // Contact gap point
        const originX = toCanvasX(245 + Math.sin(contactAngle * Math.PI / 180) * 15);
        const originY = toCanvasY(150 - Math.cos(contactAngle * Math.PI / 180) * 10);

        // Spawn plasma particles drawn magnetically toward the chute plates (X: 110..180, Y: 100..200)
        for (let i = 0; i < 4; i++) {
          const targetPlateIdx = Math.floor(Math.random() * 7);
          const targetPlateY = toCanvasY(110 + targetPlateIdx * 14);
          const targetPlateX = toCanvasX(145 + Math.random() * 25);

          const angleToPlate = Math.atan2(targetPlateY - originY, targetPlateX - originX);
          const speed = 3.5 + Math.random() * 4.0;

          arcParticles.push({
            x: originX,
            y: originY,
            vx: Math.cos(angleToPlate) * speed,
            vy: Math.sin(angleToPlate) * speed,
            plateIdx: targetPlateIdx,
            alpha: 1.0,
            size: 2.0 + Math.random() * 2.5,
            color: Math.random() > 0.3 ? '#38bdf8' : '#f59e0b'
          });
        }

        // Draw central lightning plasma bolt between contact posts
        ctx.save();
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(220), toCanvasY(150));
        ctx.lineTo(toCanvasX(235 + (Math.random() - 0.5) * 8), toCanvasY(140 + (Math.random() - 0.5) * 8));
        ctx.lineTo(originX, originY);
        ctx.stroke();

        // Runner horn extension into arc chute
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(toCanvasX(175), toCanvasY(130));
        ctx.stroke();
        ctx.restore();
      }

      // Update & Draw Particle Stream into Chute
      ctx.save();
      arcParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, p.alpha - 0.035);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      arcParticles = arcParticles.filter((p) => p.alpha > 0.05);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, isManualScrub, effectiveProgress, contactAngle]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden select-none font-mono h-full',
        className
      )}
    >
      {/* Header Bar with Live Trip State */}
      <div className="w-full flex items-center justify-between mb-1.5 z-10 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            2D Mechanism Cutaway Kinematics
          </span>
        </div>

        {/* Live Reverse Countdown Timer Badge */}
        <div className="shrink-0">
          {isTripped ? (
            <span className="px-2.5 py-0.5 rounded-lg bg-rose-950 border border-rose-500 text-rose-300 text-[11px] font-black uppercase flex items-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> TRIPPED ({tripCause})
            </span>
          ) : remainingTimeSec !== undefined && remainingTimeSec < 3600 ? (
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-950 border border-amber-500 text-amber-300 text-[11px] font-black uppercase flex items-center gap-1 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> TRIP IN: {remainingTimeSec.toFixed(1)}s
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> NORMAL (1.13x In)
            </span>
          )}
        </div>
      </div>

      {/* SVG Layered Cutaway Canvas (750x320 Edge-to-Edge) */}
      <div className="relative w-full flex-1 min-h-[160px] flex items-center justify-center overflow-hidden rounded-lg bg-[#090d16] border border-slate-850">
        <svg viewBox="0 0 750 320" className="w-full h-full overflow-visible z-10">
          <defs>
            {/* Plasma Glow Filter */}
            <filter id="plasmaGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Bimetal Thermal Heat Gradient */}
            <linearGradient id="bimetalHeatGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="60%" stopColor={temperature > 60 ? '#f59e0b' : '#38bdf8'} />
              <stop offset="100%" stopColor={temperature >= bimetalTripTemp ? '#ef4444' : '#f59e0b'} />
            </linearGradient>
          </defs>

          {/* Breaker Thermoplastic Molded Housing */}
          <path
            d="M 60,30 L 480,30 L 690,30 L 690,290 L 60,290 Z"
            fill="#0b1120"
            stroke="#334155"
            strokeWidth="2.5"
            rx="16"
          />

          {/* Line Terminal Post (Top) */}
          <g transform="translate(190, 15)">
            <rect x="0" y="0" width="45" height="25" rx="4" fill="#334155" stroke="#64748b" strokeWidth="2" />
            <circle cx="22" cy="12" r="5" fill="#e2e8f0" />
            {/* Leader-line */}
            <path d="M 45,12 L 80,12" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="85" y="15" fill="#94a3b8" fontSize="11" fontWeight="bold">LINE TERMINAL</text>
          </g>

          {/* Load Terminal Post (Bottom) */}
          <g transform="translate(620, 275)">
            <rect x="0" y="0" width="45" height="25" rx="4" fill="#334155" stroke="#64748b" strokeWidth="2" />
            <circle cx="22" cy="12" r="5" fill="#e2e8f0" />
            {/* Leader-line */}
            <path d="M 0,12 L -35,12" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="-135" y="15" fill="#94a3b8" fontSize="11" fontWeight="bold">LOAD TERMINAL</text>
          </g>

          {/* 1. OPERATING TOGGLE HANDLE (Top Right Pivot) */}
          <g transform="translate(480, 50)">
            <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            {/* Pivot Toggle Arm */}
            <motion.path
              d="M -10,0 L -25,-40 L 5,-40 L 10,0 Z"
              fill={isTripped ? '#ef4444' : '#10b981'}
              stroke="#ffffff"
              strokeWidth="1.5"
              animate={{ rotate: handleAngle }}
              style={{ originX: '0px', originY: '0px' }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            />
            <text x="0" y="-46" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black">
              {isTripped ? 'OFF' : 'ON'}
            </text>
            {/* Leader-line */}
            <path d="M 15,-20 L 55,-20" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="60" y="-17" fill="#94a3b8" fontSize="11" fontWeight="bold">OPERATING HANDLE</text>
          </g>

          {/* 2. OVER-CENTER TRIP LATCH & LEVER MECHANISM */}
          <g transform="translate(360, 110)">
            <circle cx="0" cy="0" r="8" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
            {/* Upper Latch Link */}
            <line x1="0" y1="0" x2="60" y2="-40" stroke="#cbd5e1" strokeWidth="3" />
            {/* Trip Lever connected to Bimetal & Plunger */}
            <motion.path
              d="M 0,0 L 40,40 L 45,85"
              fill="none"
              stroke={isTripped ? '#ef4444' : '#94a3b8'}
              strokeWidth="3.5"
              strokeLinecap="round"
              animate={{ rotate: isTripped ? 25 : 0 }}
              style={{ originX: '0px', originY: '0px' }}
            />
            {/* Leader-line */}
            <path d="M 40,40 L 70,40 L 80,55" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="85" y="58" fill="#94a3b8" fontSize="11" fontWeight="bold">TRIP LATCH</text>
          </g>

          {/* 3. FIXED & MOVING CONTACT ASSEMBLY */}
          <g transform="translate(220, 150)">
            {/* Fixed Contact Post */}
            <rect x="-15" y="-10" width="15" height="20" rx="3" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
            <circle cx="-5" cy="0" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1" /> {/* Ag/C tip */}

            {/* Moving Contact Arm (Pivoting at bottom) */}
            <motion.g
              animate={{ rotate: -contactAngle }}
              style={{ originX: '70px', originY: '60px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              <line x1="70" y1="60" x2="0" y2="0" stroke="#e2e8f0" strokeWidth="4.5" strokeLinecap="round" />
              <circle cx="0" cy="0" r="5" fill="#fbbf24" stroke="#d97706" strokeWidth="1" /> {/* Ag/C tip */}
            </motion.g>

            {/* Flexible Copper Braid */}
            <path d="M 70,60 C 120,90 140,90 180,60" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="3 2" />

            {/* Leader-line */}
            <path d="M 0,-15 L 0,-35 L -35,-35" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="-160" y="-32" fill="#94a3b8" fontSize="11" fontWeight="bold">CONTACTS (Ag/C)</text>
          </g>

          {/* 4. ARC SPLITTER CHUTE (7 De-ionizing Steel Plates + Arc Horns) */}
          <g transform="translate(105, 95)">
            <rect x="0" y="0" width="70" height="110" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            
            {/* 7 Arc Splitter Steel Plates */}
            {[12, 26, 40, 54, 68, 82, 96].map((yP, idx) => (
              <g key={`plate-${idx}`}>
                <line x1="6" y1={yP} x2="64" y2={yP} stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
                {/* Plate V-notch */}
                <path d={`M 6,${yP - 3} L 18,${yP} L 6,${yP + 3}`} fill="#0f172a" />
              </g>
            ))}

            {/* Upper Arc Runner Horn */}
            <path d="M 70,12 Q 95,20 115,45" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
            {/* Lower Arc Runner Horn */}
            <path d="M 70,96 Q 95,90 115,65" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />

            {/* Leader-line */}
            <path d="M 35,115 L 35,135 L 0,135" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="-95" y="138" fill="#94a3b8" fontSize="11" fontWeight="bold">ARC CHUTE (7 Plates)</text>
          </g>

          {/* 5. MAGNETIC SOLENOID (Fast Plunger <10ms) */}
          <g transform="translate(380, 195)">
            {/* Solenoid Coil Body */}
            <rect x="0" y="0" width="75" height="42" rx="6" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" />
            {[8, 18, 28, 38, 48, 58, 68].map((xp, idx) => (
              <line key={`coil-${idx}`} x1={xp} y1="0" x2={xp} y2="42" stroke="#fbbf24" strokeWidth="2.5" />
            ))}

            {/* Iron Moving Plunger */}
            <motion.rect
              x="-20" y="14" width="30" height="14" rx="3"
              fill="#e2e8f0" stroke="#475569" strokeWidth="1.5"
              animate={{ x: plungerOffset - 20 }}
              transition={{ type: 'spring', stiffness: 550, damping: 18 }}
            />

            {/* Leader-line */}
            <path d="M 37,45 L 37,65 L 0,65" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="-120" y="68" fill="#94a3b8" fontSize="11" fontWeight="bold">SOLENOID (&lt;10ms)</text>
          </g>

          {/* 6. BIMETAL THERMAL STRIP (Differential Expansion Strip) */}
          <g transform="translate(560, 110)">
            {/* Lower Anchor Block */}
            <rect x="0" y="115" width="35" height="35" rx="4" fill="#334155" stroke="#64748b" strokeWidth="2" />
            <circle cx="17" cy="132" r="5" fill="#e2e8f0" />

            {/* Calibrated Bending Curved Strip */}
            <motion.path
              d="M 17,115 C 17,75 17,35 17,0"
              fill="none"
              stroke="url(#bimetalHeatGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              animate={{
                d: `M 17,115 C 17,75 ${17 - bimetalDeflection * 0.8},35 ${17 - bimetalDeflection * 1.3},0`
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            />

            {/* Calibration Adjustment Screw */}
            <circle cx="17" cy="0" r="4" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />

            {/* Leader-line */}
            <path d="M 25,50 L 55,50" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <text x="60" y="53" fill="#94a3b8" fontSize="11" fontWeight="bold">
              BIMETAL ({temperature.toFixed(1)}°C)
            </text>
          </g>
        </svg>

        {/* PIXIJS / 2D CANVAS ARC PLASMA OVERLAY */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />
      </div>

      {/* TRIP SLOW-MOTION REPLAY SCRUB BAR (Synced to TIME WARP) */}
      <div className="w-full mt-2 pt-1.5 border-t border-slate-800 flex flex-col gap-1 z-30 shrink-0">
        <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
          <span className="flex items-center gap-1.5 text-sky-400">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            SLOW-MOTION TRIP SCRUB BAR ({timeLapseSpeed}x TIME WARP)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsManualScrub(false);
                setScrubProgress(null);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px]"
              title="Reset scrub bar to live engine state"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" /> Live Sync
            </button>
            <span className="text-amber-400 tabular-nums">
              {(effectiveProgress * 100).toFixed(0)}% Complete
            </span>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effectiveProgress}
          onChange={(e) => {
            setIsManualScrub(true);
            setScrubProgress(parseFloat(e.target.value));
          }}
          className="w-full h-2 accent-sky-500 cursor-pointer rounded-lg bg-slate-800 focus-visible:ring-2 focus-visible:ring-sky-400"
        />

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>0ms: Closed Contact</span>
          <span>3ms: Magnetic/Thermal Unlatch</span>
          <span>6ms: Contact Separation &amp; Arc Chute</span>
          <span>10ms: Arc Extinguished</span>
        </div>
      </div>
    </div>
  );
};
