import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { ElectrodeConfig, calculateIEEE1584_2018 } from '../utils/ieee1584-2018';
import { ShieldAlert, Zap, Radio, CheckCircle, Flame, Volume2, VolumeX, Maximize2, Layers, Footprints, AlertTriangle, Eye, FlameKindling, Thermometer, Shield } from 'lucide-react';

export type ScaleMode = 'auto' | '10m' | '60m';
export type ViewMode = 'normal' | 'thermal';

interface ToScaleViewProps {
  workingDistanceMeters: number; // e.g. 0.914m
  boundaryRadiusMeters: number; // e.g. 8.51m
  incidentEnergy: number; // cal/cm2
  isSimulating: boolean;
  clearingTimeMs: number; // e.g. 145ms
  opticalTimeMs: number; // e.g. 10ms
  gooseLatencyMs: number; // e.g. 15ms
  breakerTimeMs: number; // e.g. 120ms
  electrodeConfig: ElectrodeConfig;
  isPPESafe?: boolean;
  equippedPpeRating?: number;
}

export function ToScaleView({
  workingDistanceMeters,
  boundaryRadiusMeters,
  incidentEnergy,
  isSimulating,
  clearingTimeMs,
  opticalTimeMs,
  gooseLatencyMs,
  breakerTimeMs,
  electrodeConfig,
  isPPESafe = false,
  equippedPpeRating = 8
}: ToScaleViewProps) {
  const [scaleMode, setScaleMode] = useState<ScaleMode>('auto');
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [pressureWaveDistM, setPressureWaveDistM] = useState<number>(0);
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

  // Haptic trigger on PPE Overwhelm
  useEffect(() => {
    if (isSimulating && !isPPESafe && typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 200]);
      } catch (e) {}
    }
  }, [isSimulating, isPPESafe]);

  // Conventional 400ms Clearing Time Boundary & Incident Energy Calculation for Overlay
  const conventionalResult = useMemo(() => {
    return calculateIEEE1584_2018({
      voltage: 10990,
      boltedFaultCurrent: 30,
      gap: 152,
      workingDistance: workingDistanceMeters * 1000,
      clearingTimeMs: 400,
      electrodeConfig,
      enclosureWidth: 508,
      enclosureHeight: 610,
      enclosureDepth: 508,
      grounding: 'solidly_grounded'
    });
  }, [workingDistanceMeters, electrodeConfig]);

  const boundary400ms = conventionalResult.boundaryRadius;
  const energyReductionPct = Math.round(
    ((conventionalResult.incidentEnergy - incidentEnergy) / Math.max(0.1, conventionalResult.incidentEnergy)) * 100
  );
  const energyIncreasePct = Math.round(
    ((incidentEnergy - conventionalResult.incidentEnergy) / Math.max(0.1, conventionalResult.incidentEnergy)) * 100
  );

  // Pressure Wave Runner
  useEffect(() => {
    if (isSimulating) {
      if (!prefersReducedMotion) {
        let startTime = Date.now();
        const duration = 1500;
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / duration);
          setPressureWaveDistM(progress * boundaryRadiusMeters);
          if (progress >= 1) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
      } else {
        setPressureWaveDistM(boundaryRadiusMeters);
      }
    } else {
      setPressureWaveDistM(0);
    }
  }, [isSimulating, boundaryRadiusMeters, prefersReducedMotion]);

  // Canvas 2.5D Particle Overlay (Particles capped at 150)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number; color?: string }[] = [];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isSimulating && !prefersReducedMotion) {
        if (particles.length < 150) {
          // Rising smoke wisps
          particles.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 40,
            y: canvas.height * 0.45 + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 2.5 - 1.0,
            alpha: 0.85,
            size: Math.random() * 10 + 4,
            color: viewMode === 'thermal' ? 'rgba(234, 179, 8, 0.6)' : 'rgba(148, 163, 184, 0.7)'
          });

          // Molten metal droplet sparks on breaker failure
          if (clearingTimeMs > 400) {
            for (let i = 0; i < 2; i++) {
              particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 16,
                y: canvas.height * 0.45,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 4 + 1.5,
                alpha: 1.0,
                size: Math.random() * 3 + 1.5,
                color: '#f97316'
              });
            }
          }
        }

        particles.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.015;
          p.size += 0.15;

          ctx.fillStyle = p.color || `rgba(148, 163, 184, ${Math.max(0, p.alpha)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.alpha <= 0) particles.splice(idx, 1);
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, prefersReducedMotion, clearingTimeMs, viewMode]);

  // Dynamic Scale Calculation for 2.5D Isometric Projection
  const maxViewRadiusMeters = useMemo(() => {
    if (scaleMode === '10m') return 10.0;
    if (scaleMode === '60m') return 60.0;
    return Math.max(8.0, Math.max(boundaryRadiusMeters, boundary400ms) * 1.25);
  }, [scaleMode, boundaryRadiusMeters, boundary400ms]);

  const scalePxPerMeter = 75 / maxViewRadiusMeters;

  const workingRx = Math.max(8, workingDistanceMeters * scalePxPerMeter);
  const workingRy = workingRx * 0.5;

  const boundaryRx = Math.max(12, boundaryRadiusMeters * scalePxPerMeter);
  const boundaryRy = boundaryRx * 0.5;

  const boundary400msRx = Math.max(14, boundary400ms * scalePxPerMeter);
  const boundary400msRy = boundary400msRx * 0.5;

  const pressureWaveRx = Math.max(6, pressureWaveDistM * scalePxPerMeter);
  const pressureWaveRy = pressureWaveRx * 0.5;

  const isCableTrayIgnited = incidentEnergy >= 5.0;

  // Unprotected worker burn state text logic
  const getWorkerStatusText = () => {
    if (incidentEnergy > equippedPpeRating) {
      return `OVERWHELMED (${incidentEnergy.toFixed(1)} cal)`;
    }
    if (equippedPpeRating > 0 && incidentEnergy <= equippedPpeRating) {
      return 'PPE HELD (SAFE)';
    }
    if (incidentEnergy < 1.2) return 'NO BURN (<1.2 cal)';
    if (incidentEnergy < 4.0) return '2ND-DEGREE BURN';
    if (incidentEnergy < 25.0) return '3RD-DEGREE / IGNITION';
    if (incidentEnergy < 40.0) return 'SEVERE 3RD-DEGREE';
    return 'FATAL EXPOSURE (>40 cal)';
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 border border-slate-750 rounded-xl overflow-hidden shadow-inner relative font-mono select-none">
      
      {/* Header Bar & View / Scale Mode Selectors */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900/90 z-30">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-orange-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            2.5D Isometric Switchroom Scene
          </span>
        </div>

        {/* View Mode [NORMAL | THERMAL] & Scale Toggles */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setViewMode('normal')}
              className={cn(
                "px-2 py-0.5 rounded font-bold uppercase transition-all cursor-pointer min-h-[32px] focus-visible:ring-2 focus-visible:ring-cyan-400",
                viewMode === 'normal' ? "bg-orange-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
              )}
            >
              NORMAL
            </button>
            <button
              onClick={() => setViewMode('thermal')}
              className={cn(
                "px-2 py-0.5 rounded font-bold uppercase transition-all cursor-pointer flex items-center gap-1 min-h-[32px] focus-visible:ring-2 focus-visible:ring-cyan-400",
                viewMode === 'thermal' ? "bg-cyan-500 text-slate-950 font-black" : "text-cyan-400 hover:text-cyan-200"
              )}
            >
              <Eye className="w-3 h-3" />
              THERMAL
            </button>
          </div>

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            {(['auto', '10m', '60m'] as ScaleMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setScaleMode(mode)}
                className={cn(
                  "px-2 py-0.5 rounded font-bold uppercase transition-all cursor-pointer min-h-[32px] focus-visible:ring-2 focus-visible:ring-cyan-400",
                  scaleMode === mode ? "bg-orange-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
                )}
              >
                {mode === 'auto' ? 'AUTO' : mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsMuted(m => !m)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors cursor-pointer min-h-[32px] flex items-center justify-center"
            title={isMuted ? "Unmute Arc Blast Audio" : "Mute Arc Blast Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
          </button>
        </div>
      </div>

      {/* VERTICAL INFRARED °C LEGEND BAR (RIGHT VIEWPORT ANCHORED) */}
      {viewMode === 'thermal' && (
        <div className="absolute right-3 top-16 bottom-16 z-40 w-8 bg-slate-950/90 border border-slate-750 rounded-xl p-1 flex flex-col justify-between items-center text-[9px] font-bold text-white shadow-2xl backdrop-blur-md">
          <span className="text-white font-black">20k°</span>
          <div className="w-2 flex-1 rounded bg-gradient-to-b from-white via-orange-500 via-yellow-400 via-green-500 to-blue-900 my-1" />
          <span className="text-blue-300 font-black">25°C</span>
        </div>
      )}

      {/* RED VIGNETTE PULSE ON SUSTAINED ARC FAILURE */}
      <div 
        className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
        style={{
          background: isSimulating && clearingTimeMs > 400 
            ? 'radial-gradient(circle, transparent 65%, rgba(239, 68, 68, 0.45) 100%)' 
            : 'none'
        }}
      />

      {/* Main Interactive 2.5D Isometric Stage */}
      <div className={cn(
        "relative flex-1 min-h-[250px] w-full flex items-center justify-center p-2 overflow-hidden transition-colors duration-500",
        viewMode === 'thermal' 
          ? "bg-[radial-gradient(circle_at_50%_45%,_#ffffff_0%,_#f97316_20%,_#eab308_40%,_#1e3a8a_70%,_#020617_100%)]" 
          : "bg-[radial-gradient(circle_at_50%_45%,_#0f172a_0%,_#020617_100%)]"
      )}>
        
        {/* Heat-Shimmer SVG Turbulence Filter */}
        <svg className="absolute w-0 h-0 pointer-events-none">
          <filter id="heat-shimmer">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={isSimulating ? 14 : 0} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        {/* Canvas Overlay for Particle Sparks & Smoke */}
        <canvas
          ref={canvasRef}
          width={300}
          height={250}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* CAMERA SHAKE CONTAINED STRICTLY INSIDE THE VIEWPORT SVG (CLS = 0) */}
        <motion.svg 
          viewBox="0 0 200 200" 
          className="w-full h-full max-h-[340px] overflow-visible z-10" 
          preserveAspectRatio="xMidYMid meet" 
          style={{ filter: isSimulating ? 'url(#heat-shimmer)' : 'none' }}
          animate={isSimulating && clearingTimeMs > 400 ? { x: [-2, 2, -3, 3, -1, 1, 0] } : { x: 0 }}
          transition={{ duration: 0.2, repeat: Infinity }}
        >
          
          {/* 1. 2.5D ISOMETRIC METRE-GRID FLOOR PLANE (30° Angle) */}
          <g id="iso-floor-grid">
            {[-60, -40, -20, 0, 20, 40, 60].map(offset => (
              <line 
                key={`grid-x-${offset}`} 
                x1={100 + offset - 80 * 0.866} y1={110 + 80 * 0.5} 
                x2={100 + offset + 80 * 0.866} y2={110 - 80 * 0.5} 
                stroke={viewMode === 'thermal' ? "rgba(255,255,255,0.2)" : "#1e293b"} 
                strokeWidth="0.5" 
              />
            ))}
            {[-60, -40, -20, 0, 20, 40, 60].map(offset => (
              <line 
                key={`grid-y-${offset}`} 
                x1={100 + offset - 80 * 0.866} y1={110 - 80 * 0.5} 
                x2={100 + offset + 80 * 0.866} y2={110 + 80 * 0.5} 
                stroke={viewMode === 'thermal' ? "rgba(255,255,255,0.2)" : "#1e293b"} 
                strokeWidth="0.5" 
              />
            ))}
          </g>

          {/* 2. ISOMETRIC FLOOR RADAR RANGE RINGS (True Scale 1m, 2m, 5m, 10m, 20m, 50m) */}
          {[1, 2, 5, 10, 20, 50].map(m => {
            if (m > maxViewRadiusMeters) return null;
            const rx = m * scalePxPerMeter;
            const ry = rx * 0.5;
            return (
              <g key={`iso-ring-${m}`}>
                <ellipse cx="100" cy="110" rx={rx} ry={ry} fill="none" stroke={viewMode === 'thermal' ? "rgba(255,255,255,0.4)" : "#334155"} strokeWidth="0.5" strokeDasharray="3 2" />
                <text x={100 + rx} y={110 + 3} textAnchor="start" fill={viewMode === 'thermal' ? "#ffffff" : "#64748b"} fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {m}m
                </text>
              </g>
            );
          })}

          {/* 3. GHOST COMPARE BOUNDARY ELLIPSE (Tag Attached ON Ring at 210° Angle) */}
          <g>
            <ellipse
              cx="100" cy="110" rx={boundary400msRx} ry={boundary400msRy}
              fill="none" stroke="rgba(248, 113, 113, 0.4)" strokeWidth="1.5" strokeDasharray="5 4"
            />
            {/* Tag at 210° angle */}
            <text 
              x={100 - boundary400msRx * 0.866} 
              y={110 + boundary400msRy * 0.5} 
              textAnchor="end" fill="#f87171" fontSize="11" fontWeight="bold"
            >
              400ms: {boundary400ms.toFixed(1)}m
            </text>
          </g>

          {/* 4. ACTIVE ARC FLASH BOUNDARY ELLIPSE (Tag Attached ON Ring at 90° Angle) */}
          <g>
            <motion.ellipse
              cx="100"
              cy="110"
              rx={boundaryRx}
              ry={boundaryRy}
              fill="rgba(239, 68, 68, 0.14)"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4 3"
              animate={{ rx: boundaryRx, ry: boundaryRy }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />
            {/* Tag attached at 90° angle (top) */}
            <text 
              x={100} 
              y={110 - boundaryRy - 3} 
              textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold"
            >
              Db: {boundaryRadiusMeters.toFixed(2)}m (1.2 cal onset)
            </text>
          </g>

          {/* 5. WORKING DISTANCE ELLIPSE (D) */}
          <motion.ellipse
            cx="100"
            cy="110"
            rx={workingRx}
            ry={workingRy}
            fill="rgba(249, 115, 22, 0.18)"
            stroke="#f97316"
            strokeWidth="2"
            animate={{ rx: workingRx, ry: workingRy }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />

          {/* 6. EXPANDING ISOMETRIC PRESSURE WAVE RING */}
          {isSimulating && !prefersReducedMotion && (
            <ellipse
              cx="100" cy="110" rx={pressureWaveRx} ry={pressureWaveRy}
              fill="none" stroke="#eab308" strokeWidth="2.5" opacity="0.85"
            />
          )}

          {/* 7. ISOMETRIC CABLE TRAY ALONG FLOOR WITH IGNITION FLAMES */}
          <g transform="translate(100, 110)">
            <path d="M 0,0 L 50,25 L 56,22 L 6,-3 Z" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
            {isCableTrayIgnited && isSimulating && (
              <motion.circle
                cx="25" cy="12" r="7"
                fill="#ef4444"
                animate={{ scale: [1, 1.4, 0.9, 1.2], opacity: [0.9, 1, 0.7] }}
                transition={{ duration: 0.2, repeat: Infinity }}
              />
            )}
          </g>

          {/* 8. 2.5D ISOMETRIC SWITCHGEAR CUBICLE WITH OPEN DOOR & VISIBLE BUSBAR */}
          <g id="iso-switchgear-cubicle" transform="translate(100, 110)">
            {/* Front Face */}
            <path 
              d="M -15,-45 L 15,-30 L 15,0 L -15,-15 Z" 
              fill={clearingTimeMs > 400 && isSimulating ? "#0a0a0a" : "#0f172a"} 
              stroke={clearingTimeMs > 400 && isSimulating ? "#ef4444" : "#06b6d4"} 
              strokeWidth="1.5" 
            />
            {/* Top Face */}
            <path 
              d="M -15,-45 L 0,-52 L 30,-37 L 15,-30 Z" 
              fill={clearingTimeMs > 400 && isSimulating ? "#171717" : "#1e293b"} 
              stroke={clearingTimeMs > 400 && isSimulating ? "#ef4444" : "#06b6d4"} 
              strokeWidth="1.5" 
            />
            {/* Side Face */}
            <path 
              d="M 15,-30 L 30,-37 L 30,-7 L 15,0 Z" 
              fill={clearingTimeMs > 400 && isSimulating ? "#050505" : "#020617"} 
              stroke={clearingTimeMs > 400 && isSimulating ? "#ef4444" : "#06b6d4"} 
              strokeWidth="1.5" 
            />
            {/* Open Door Interior & Visible Copper Busbar Electrodes */}
            <line x1="0" y1="-35" x2="0" y2="-10" stroke="#f97316" strokeWidth="3" />
            <line x1="5" y1="-33" x2="5" y2="-8" stroke="#f97316" strokeWidth="3" />
          </g>

          {/* 9. SUSTAINED ARC EXPLOSION */}
          <AnimatePresence>
            {isSimulating && (
              <motion.g key="iso-arc-plasma" transform="translate(100, 85)">
                {/* White-Hot Plasma Core */}
                <motion.circle
                  cx="0" cy="0" r={Math.min(28, boundaryRx * 0.6)}
                  fill="#ffffff"
                  style={{ filter: 'drop-shadow(0 0 30px #ffffff)' }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { scale: [1, 1.3, 0.95, 1.2], opacity: [1, 0.8, 1] }}
                  transition={{ duration: 0.1, repeat: Infinity }}
                />
                {/* Flash Bloom */}
                <motion.circle
                  cx="0" cy="0" r={Math.min(42, workingRx * (1 + incidentEnergy / 40))}
                  fill={viewMode === 'thermal' ? "rgba(255, 255, 255, 0.9)" : "rgba(251, 146, 60, 0.85)"}
                  style={{ filter: 'drop-shadow(0 0 25px #fb923c)' }}
                  animate={prefersReducedMotion ? { opacity: 0.8 } : { scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.15, repeat: Infinity }}
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* 10. WORKER SILHOUETTE AVATAR ON ISOMETRIC FLOOR AT WORKING DISTANCE D */}
          {(() => {
            const workerX = 100;
            const workerY = 110 + workingRy;
            const statusText = getWorkerStatusText();
            return (
              <g transform={`translate(${workerX}, ${workerY})`}>
                <ellipse
                  cx="0" cy="0" rx="14" ry="7"
                  fill={isPPESafe ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.35)"}
                  stroke={isPPESafe ? "#10b981" : "#ef4444"}
                  strokeWidth="1.5"
                />

                <circle cx="0" cy="-14" r="4" fill={isPPESafe ? "#f59e0b" : "#ef4444"} />
                <path d="M -5,-10 L 5,-10 L 4,2 L -4,2 Z" fill={isPPESafe ? "#f59e0b" : "#ef4444"} />
                <line x1="-3" y1="2" x2="-3" y2="8" stroke={isPPESafe ? "#f59e0b" : "#ef4444"} strokeWidth="2.5" />
                <line x1="3" y1="2" x2="3" y2="8" stroke={isPPESafe ? "#f59e0b" : "#ef4444"} strokeWidth="2.5" />

                {/* Worker Status Tag */}
                <g transform="translate(0, 24)">
                  <rect x="-75" y="0" width="150" height="22" rx="4" fill="#0f172a" stroke={isPPESafe ? "#10b981" : "#ef4444"} strokeWidth="1.5" />
                  <text x="0" y="15" textAnchor="middle" fill={isPPESafe ? "#34d399" : "#f87171"} fontSize="11" fontWeight="black">
                    {statusText}
                  </text>
                </g>
              </g>
            );
          })()}

        </motion.svg>

        {/* MODE SAVINGS OR INCREASE OVERLAY CHIP */}
        {clearingTimeMs > 400 ? (
          <div className="absolute top-12 left-3 bg-red-950/90 border border-red-500 px-2.5 py-1 rounded-lg text-[11px] font-black text-red-300 shadow-md">
            +{energyIncreasePct > 0 ? energyIncreasePct : 350}% vs NORMAL (NO-TRIP FAILURE)
          </div>
        ) : energyReductionPct > 0 ? (
          <div className="absolute top-12 left-3 bg-green-950/90 border border-green-500 px-2.5 py-1 rounded-lg text-[11px] font-bold text-green-300 shadow-md">
            −{energyReductionPct}% Incident Energy (Fast GOOSE Trip)
          </div>
        ) : null}
      </div>

      {/* SINGLE COMPACT 24px LADDER BAR WITH MOVING MARKER */}
      <div className="p-2 bg-slate-950 border-t border-slate-800 shrink-0 font-mono text-[11px]">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
          <span className="uppercase">NFPA 70E Incident Energy Ladder</span>
          <span className="text-orange-400 font-black tabular-nums">{incidentEnergy.toFixed(2)} cal/cm²</span>
        </div>

        {/* 24px Ladder Bar with Color Bands & Moving Marker */}
        <div className="relative h-6 w-full rounded-lg bg-slate-900 overflow-hidden border border-slate-800 flex text-[9px] font-bold text-slate-950 select-none">
          <div className="w-[10%] bg-emerald-500 flex items-center justify-center">Safe</div>
          <div className="w-[15%] bg-yellow-500 flex items-center justify-center">Cat 1</div>
          <div className="w-[20%] bg-orange-500 flex items-center justify-center">Cat 2</div>
          <div className="w-[25%] bg-amber-600 flex items-center justify-center text-white">Cat 3</div>
          <div className="w-[20%] bg-red-600 flex items-center justify-center text-white">Cat 4</div>
          <div className="w-[10%] bg-red-950 text-red-200 flex items-center justify-center">Ext</div>

          {/* Animated Moving Pointer Marker */}
          <motion.div
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_10px_#ffffff] z-10"
            style={{
              left: `${Math.min(98, Math.max(1, (incidentEnergy / 40.0) * 100))}%`
            }}
            animate={{ left: `${Math.min(98, Math.max(1, (incidentEnergy / 40.0) * 100))}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

    </div>
  );
}
