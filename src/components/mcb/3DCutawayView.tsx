import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MCBState, TripCause } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Eye, Layers, Zap, Flame, Info, Sparkles } from 'lucide-react';

interface CutawayView3DProps {
  temperature: number;      // Bimetal temp °C
  bimetalTripTemp: number;  // °C threshold (130°C)
  state: MCBState;          // CLOSED, UNLATCHED, ARCING, OPEN_CLEARED
  tripCause: TripCause;
  current: number;          // Instantaneous current (A)
  remainingTimeSec?: number; // Countdown timer until trip
  className?: string;
}

export const CutawayView3D: React.FC<CutawayView3DProps> = ({
  temperature,
  bimetalTripTemp,
  state,
  tripCause,
  current,
  remainingTimeSec,
  className
}) => {
  // Exploded View Mode State
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  // 3D Camera Rotation Orbit State (Pitch & Yaw)
  const [rotX, setRotX] = useState<number>(20);
  const [rotY, setRotY] = useState<number>(-30);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isTripped = state !== MCBState.CLOSED;
  const isMagneticTrip = tripCause === TripCause.MAGNETIC || tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE;
  const isThermalTrip = tripCause === TripCause.THERMAL;

  // Bimetal Deflection & Color Calculation
  const tempRatio = Math.min(1.0, Math.max(0, (temperature - 30) / (bimetalTripTemp - 30)));
  const bimetalAngle = tempRatio * 28; // Up to 28 deg deflection

  // Bimetal Heat Gradient Color (Blue -> Amber -> Glowing Red -> White Hot)
  let bimetalColor = '#64748b'; // Ambient Slate
  if (tempRatio > 0.8) {
    bimetalColor = '#ef4444'; // Glowing Red
  } else if (tempRatio > 0.4) {
    bimetalColor = '#f59e0b'; // Amber
  } else if (tempRatio > 0.1) {
    bimetalColor = '#38bdf8'; // Warm Blue
  }

  // Exploded View Offsets
  const expCover = isExploded ? 70 : 0;
  const expBimetal = isExploded ? -35 : 0;
  const expSolenoid = isExploded ? 40 : 0;
  const expArcChute = isExploded ? -60 : 0;

  // Orbit Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    setRotY((prevY) => prevY + dx * 0.5);
    setRotX((prevX) => Math.min(60, Math.max(-20, prevX - dy * 0.5)));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className={cn('relative w-full h-full min-h-[320px] bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between overflow-hidden font-mono select-none cursor-grab active:cursor-grabbing', className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Top Controls Overlay */}
      <div 
        onPointerDown={(e) => e.stopPropagation()} 
        className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto"
      >
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-black text-emerald-400 flex items-center gap-1.5 shadow">
            <Sparkles className="w-3.5 h-3.5" /> 3D CUTAWAY COCKPIT
          </span>
          
          {/* Reverse Timer Badge */}
          {remainingTimeSec !== undefined && remainingTimeSec < 3600 && !isTripped && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-500 text-amber-300 text-xs font-black uppercase shadow flex items-center gap-1.5 animate-pulse">
              TRIP IN: {remainingTimeSec.toFixed(1)}s
            </span>
          )}

          {isTripped && (
            <span className={cn(
              "px-2.5 py-1 rounded-lg border text-xs font-black uppercase shadow animate-pulse",
              isMagneticTrip ? "bg-rose-950/90 border-rose-500 text-rose-300" : "bg-amber-950/90 border-amber-500 text-amber-300"
            )}>
              {isMagneticTrip ? '⚡ MAGNETIC TRIP (<10ms)' : '🔥 THERMAL OVERLOAD TRIP'}
            </span>
          )}
        </div>

        {/* Exploded View Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExploded((prev) => !prev);
          }}
          className={cn(
            "px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer shadow flex items-center gap-1.5 min-h-[34px]",
            isExploded ? "bg-cyan-500 text-slate-950" : "bg-slate-900 border border-slate-750 text-slate-300 hover:text-white"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          {isExploded ? 'COLLAPSE VIEW' : 'EXPLODED VIEW'}
        </button>
      </div>

      {/* Part Hover Tooltip Banner */}
      <AnimatePresence>
        {hoveredPart && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-3 z-30 px-3 py-1.5 rounded-lg bg-slate-900/95 border border-sky-500/50 text-sky-200 text-xs font-bold shadow-xl flex items-center gap-2 pointer-events-none"
          >
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{hoveredPart}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Perspective Canvas Container */}
      <div className="relative w-full h-[260px] flex items-center justify-center overflow-visible">
        <div
          className="w-[450px] h-[260px] transition-transform duration-75"
          style={{
            transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${zoomScale})`,
            transformStyle: 'preserve-3d'
          }}
        >
          <svg viewBox="0 0 500 300" className="w-full h-full overflow-visible">
            <defs>
              {/* Glass Housing Shading Gradient */}
              <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.7" />
              </linearGradient>
              <filter id="plasmaGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 1. POLYCARBONATE TRANSPARENT HOUSING (SHELL) */}
            <g
              transform={`translate(${expCover}, ${-expCover * 0.3})`}
              className="transition-transform duration-500 cursor-pointer"
              onMouseEnter={() => setHoveredPart('Transparent Polycarbonate Housing Enclosure')}
              onMouseLeave={() => setHoveredPart(null)}
            >
              <rect
                x="80" y="30" width="340" height="230" rx="16"
                fill="url(#glassGrad)" stroke="#38bdf8" strokeWidth={isExploded ? '2' : '1.5'}
                strokeDasharray={isExploded ? '6 4' : 'none'} opacity={isExploded ? 0.4 : 0.8}
              />
              <text x="250" y="52" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
                IEC 60898-1 Polycarbonate Housing
              </text>
            </g>

            {/* 2. ARC CHUTE ASSEMBLY (6 SPLITTER PLATES) */}
            <g
              transform={`translate(${expArcChute}, ${expArcChute * 0.5})`}
              className="transition-transform duration-500 cursor-pointer"
              onMouseEnter={() => setHoveredPart('Arc Chute Assembly (6 Steel De-ion Arc Splitter Plates)')}
              onMouseLeave={() => setHoveredPart(null)}
            >
              <rect x="100" y="70" width="70" height="110" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <text x="135" y="85" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">Arc Chute</text>

              {/* 6 Steel Splitter Plates */}
              {[95, 110, 125, 140, 155, 170].map((yPos, i) => (
                <rect key={`plate-${i}`} x="105" y={yPos} width="60" height="4" rx="1" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="0.5" />
              ))}

              {/* Arc Plasma Jet Animation during ARCING state */}
              {state === MCBState.ARCING && (
                <g filter="url(#plasmaGlow)">
                  <path d="M 170,140 Q 140,110 135,90" fill="none" stroke="#60a5fa" strokeWidth="4" className="animate-ping" />
                  <path d="M 170,140 Q 150,120 135,100" fill="none" stroke="#f43f5e" strokeWidth="3" className="animate-pulse" />
                  {/* Splitter Arc Sparks */}
                  {[95, 110, 125, 140, 155].map((yPos, idx) => (
                    <circle key={`spark-${idx}`} cx="135" cy={yPos} r="3" fill="#fef08a" className="animate-ping" />
                  ))}
                </g>
              )}
            </g>

            {/* 3. BIMETAL THERMAL ELEMENT */}
            <g
              transform={`translate(${expBimetal}, ${-expBimetal * 0.4})`}
              className="transition-transform duration-500 cursor-pointer"
              onMouseEnter={() => setHoveredPart(`Bimetal Strip (Layered Thermo-Bimetal Brass/Invar - Temp: ${temperature.toFixed(1)}°C)`)}
              onMouseLeave={() => setHoveredPart(null)}
            >
              {/* Base Post */}
              <rect x="340" y="170" width="20" height="40" rx="3" fill="#334155" />
              
              {/* Bending Strip */}
              <motion.path
                d="M 350,170 C 350,130 350,100 350,70"
                fill="none"
                stroke={bimetalColor}
                strokeWidth="7"
                strokeLinecap="round"
                animate={{
                  d: `M 350,170 C 350,130 ${350 - bimetalAngle},100 ${350 - bimetalAngle * 1.3},70`
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              />
              <text x="365" y="120" fill="#94a3b8" fontSize="9" fontWeight="bold">
                Bimetal ({temperature.toFixed(1)}°C)
              </text>
            </g>

            {/* 4. ELECTROMAGNETIC SOLENOID & PLUNGER */}
            <g
              transform={`translate(${expSolenoid}, ${expSolenoid * 0.3})`}
              className="transition-transform duration-500 cursor-pointer"
              onMouseEnter={() => setHoveredPart('Electromagnetic Solenoid (Instantaneous Short-Circuit Coil & Steel Plunger)')}
              onMouseLeave={() => setHoveredPart(null)}
            >
              {/* Copper Wound Coil */}
              <rect x="250" y="140" width="55" height="35" rx="6" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" />
              {[255, 263, 271, 279, 287, 295].map((xPos, idx) => (
                <line key={`coil-${idx}`} x1={xPos} y1="140" x2={xPos} y2="175" stroke="#fbbf24" strokeWidth="2.5" />
              ))}

              {/* Steel Plunger */}
              <motion.rect
                x="230" y="152" width="30" height="11" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1"
                animate={{ x: isMagneticTrip ? 210 : 230 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              />
              <text x="277" y="192" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">Solenoid</text>

              {/* Magnetic Strike Wave */}
              {isMagneticTrip && (
                <circle cx="210" cy="157" r="12" fill="none" stroke="#38bdf8" strokeWidth="2" className="animate-ping" />
              )}
            </g>

            {/* 5. MOVING CONTACT ARM & LATCH MECHANISM */}
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPart('Spring-Loaded Moving Contact & Unlatching Trip Lever')}
              onMouseLeave={() => setHoveredPart(null)}
            >
              {/* Fixed Contact Post (Left) */}
              <circle cx="180" cy="140" r="7" fill="#f8fafc" stroke="#475569" strokeWidth="2" />

              {/* Moving Contact Blade */}
              <motion.line
                x1="180" y1="140" x2="250" y2="110"
                stroke={isTripped ? '#f43f5e' : '#10b981'} strokeWidth="5" strokeLinecap="round"
                animate={{ rotate: isTripped ? -42 : 0 }}
                style={{ originX: '180px', originY: '140px' }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Footer Helper Note */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-800">
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-sky-400" /> Drag mouse/touch to orbit camera 360°
        </span>
        <span className="text-slate-500">Hover components for technical details</span>
      </div>
    </div>
  );
};
