import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Zap, 
  Flame, 
  Activity, 
  Gauge, 
  Thermometer, 
  Info, 
  Volume2, 
  VolumeX,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useAudioHaptics } from './useAudioHaptics';

export interface DisasterReplayProps {
  isOpen: boolean;
  onClose: () => void;
  initialVoltage?: number;       // Volts, e.g. 480 or 11000
  initialCurrentKA?: number;     // Bolted fault current in kA, e.g. 25
  faultType?: 'arc_flash' | 'mcb_short_circuit';
}

interface PhysicalPhase {
  id: number;
  name: string;
  shortTitle: string;
  startMs: number;
  endMs: number;
  color: string;
  description: string;
  formula: string;
}

const PHASES: PhysicalPhase[] = [
  {
    id: 1,
    name: 'Dielectric Breakdown & Townsend Avalanche',
    shortTitle: '1. Townsend Avalanche',
    startMs: 0.0,
    endMs: 1.5,
    color: '#38bdf8', // sky
    description: 'Electric field exceeds the dielectric strength of air (E > 3.0 kV/mm). Free electrons accelerate, colliding with atmospheric N₂/O₂ molecules to spawn high-velocity ionization streamers bridging the gap.',
    formula: 'E = V_{gap} / d_{electrode} > 3.0 \\text{ kV/mm} \\quad | \\quad \\alpha = A \\cdot P \\cdot e^{-B \\cdot P / E}'
  },
  {
    id: 2,
    name: 'Arc Column Ignition & Copper Vaporization',
    shortTitle: '2. Plasma Fireball',
    startMs: 1.5,
    endMs: 8.0,
    color: '#f59e0b', // amber
    description: 'Conductive plasma channel establishes. Arc core temperature skyrockets to 15,000–25,000 K (hotter than the sun surface). Solid copper busbars flash-vaporize with a 67,000:1 volumetric expansion.',
    formula: 'T_{arc} \\approx 18,500\\text{ K} \\quad | \\quad \\Delta V_{Cu} = 67,000 \\times V_{solid}'
  },
  {
    id: 3,
    name: 'Supersonic Blast Wave & Molten Shrapnel',
    shortTitle: '3. Blast Wavefront',
    startMs: 8.0,
    endMs: 25.0,
    color: '#ef4444', // red
    description: 'Rapid explosive thermal expansion drives a supersonic acoustic pressure shockwave exceeding 15–30 kPa overpressure at 0.5m. Molten copper droplets (1,085°C) and shrapnel are hurled radially.',
    formula: 'P_{blast} = 11.584 \\cdot \\frac{I_{arc}^{1.2} \\cdot t_{arc}^{0.5}}{D^{1.8}} \\text{ kPa}'
  },
  {
    id: 4,
    name: 'Magnetic Solenoid Plunger Acceleration',
    shortTitle: '4. Armature Trip',
    startMs: 25.0,
    endMs: 65.0,
    color: '#a855f7', // purple
    description: 'High short-circuit peak current induces an immense electromagnetic Lorentz force in the trip coil. The magnetic plunger violently accelerates (a > 500 m/s²), striking the trip latch to force open moving contacts.',
    formula: 'F_{mag} = \\frac{\\mu_0 \\cdot N^2 \\cdot A}{2 \\cdot x^2} \\cdot i(t)^2 \\propto i(t)^2'
  },
  {
    id: 5,
    name: 'De-Ion Splitter Plate Arc Quenching',
    shortTitle: '5. De-Ion Quench',
    startMs: 65.0,
    endMs: 100.0,
    color: '#10b981', // emerald
    description: 'Magnetic blowout runners drive the expanding plasma column into steel de-ion splitter plates. The arc is chopped into multiple series micro-arcs, rapidly cooled, and extinguished at AC zero-crossing.',
    formula: 'V_{arc} = \\sum_{k=1}^{n} (V_{anode} + V_{cathode} + E_k \\cdot l_k) > V_{system} \\implies I = 0\\text{ A}'
  }
];

export const DisasterReplayModal: React.FC<DisasterReplayProps> = ({
  isOpen,
  onClose,
  initialVoltage = 480,
  initialCurrentKA = 25,
  faultType = 'arc_flash'
}) => {
  // Current playback time in milliseconds (0.00 to 100.00 ms)
  const [timeMs, setTimeMs] = useState<number>(0.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.01); // 0.01x (1000 FPS slow-motion)
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastWallTimeRef = useRef<number | null>(null);

  const { playArcCrackle, playBreakerTripSound, playMagneticTripSolenoid } = useAudioHaptics();

  // Active Physical Phase based on current timeMs
  const activePhase = useMemo(() => {
    return PHASES.find(p => timeMs >= p.startMs && timeMs < p.endMs) || PHASES[PHASES.length - 1];
  }, [timeMs]);

  // Dynamic Telemetry Computed from Physics Laws
  const telemetry = useMemo(() => {
    const t = Math.max(0, Math.min(100, timeMs));
    
    // 1. Plasma Core Temperature in °C
    let tempC = 25;
    if (t < 1.5) {
      tempC = 25 + (t / 1.5) * 4500;
    } else if (t < 12.0) {
      tempC = 4500 + Math.pow((t - 1.5) / 10.5, 0.7) * 15500;
    } else if (t < 65.0) {
      tempC = 20000 - ((t - 12) / 53) * 12000;
    } else {
      tempC = 8000 * Math.exp(-(t - 65) / 18) + 250;
    }

    // 2. Instantaneous Arc Current (kA) - sinusoidal with DC offset decay
    let currentKA = 0;
    if (t > 0.5 && t < 75.0) {
      const omega = 2 * Math.PI * 50; // 50 Hz
      const tSec = t / 1000;
      const acComponent = Math.sin(omega * tSec);
      const dcOffset = 1.4 * Math.exp(-tSec / 0.03); // decaying DC offset
      currentKA = Math.max(0, initialCurrentKA * (acComponent + dcOffset));
    }

    // 3. Blast Overpressure (kPa)
    let pressureKPa = 0;
    if (t >= 2.0 && t <= 45.0) {
      const blastRise = Math.sin(Math.min(Math.PI, ((t - 2) / 43) * Math.PI));
      pressureKPa = blastRise * (8.5 + (initialCurrentKA / 25) * 16.5);
    }

    // 4. Contact Separation (mm) - MCB / Breaker kinematics
    let contactGapMm = 0;
    if (t > 30.0) {
      const progress = Math.min(1, (t - 30) / 40);
      contactGapMm = progress * 14.5;
    }

    // 5. Arc Voltage (Volts)
    let arcVoltage = 0;
    if (t > 1.5 && t < 75.0) {
      arcVoltage = 65 + (contactGapMm * 18.5) + (t > 65 ? 240 : 0);
    }

    return {
      tempC: Math.round(tempC),
      currentKA: Number(currentKA.toFixed(2)),
      pressureKPa: Number(pressureKPa.toFixed(1)),
      contactGapMm: Number(contactGapMm.toFixed(1)),
      arcVoltage: Math.round(arcVoltage)
    };
  }, [timeMs, initialCurrentKA]);

  // High-Speed Canvas Physics Animation Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = 360);

    ctx.clearRect(0, 0, width, height);

    // Background High-Speed Camera Sensor Grid
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Subtle optical grid reticle
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const centerX = width * 0.48;
    const centerY = height * 0.52;

    // 1. Busbar Electrodes (Fixed & Moving Contact)
    const gapBase = 50;
    const contactSeparationPx = telemetry.contactGapMm * 4.5;
    const electrodeLeftX = centerX - gapBase / 2 - 80;
    const electrodeRightX = centerX + gapBase / 2 + contactSeparationPx;

    // Left Copper Busbar (Cathode / Source)
    const copperGradLeft = ctx.createLinearGradient(electrodeLeftX, 0, electrodeLeftX + 80, 0);
    copperGradLeft.addColorStop(0, '#b45309');
    copperGradLeft.addColorStop(0.7, '#f59e0b');
    copperGradLeft.addColorStop(1, '#fde68a');
    ctx.fillStyle = copperGradLeft;
    ctx.fillRect(electrodeLeftX, centerY - 14, 80, 28);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(electrodeLeftX, centerY - 14, 80, 28);

    // Right Copper Busbar (Anode / Moving Contact)
    const copperGradRight = ctx.createLinearGradient(electrodeRightX, 0, electrodeRightX + 90, 0);
    copperGradRight.addColorStop(0, '#fde68a');
    copperGradRight.addColorStop(0.3, '#f59e0b');
    copperGradRight.addColorStop(1, '#b45309');
    ctx.fillStyle = copperGradRight;
    ctx.fillRect(electrodeRightX, centerY - 14, 90, 28);
    ctx.strokeRect(electrodeRightX, centerY - 14, 90, 28);

    // Electrode Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText('FIXED ELECTRODE', electrodeLeftX, centerY - 20);
    ctx.fillText(
      `MOVING CONTACT (+${telemetry.contactGapMm}mm)`,
      electrodeRightX,
      centerY - 20
    );

    // 2. Arc Splitter Chute Plates (Above electrodes)
    const splitterCount = 8;
    const splitterStartX = centerX - 60;
    const splitterY = centerY - 120;
    ctx.fillStyle = '#475569';
    for (let i = 0; i < splitterCount; i++) {
      const sx = splitterStartX + i * 16;
      ctx.fillRect(sx, splitterY, 3, 50);
      // Quenching micro-arcs between plates if in Phase 5
      if (timeMs >= 65.0 && timeMs < 95.0) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.fillRect(sx + 3, splitterY + 15, 13, 2);
        ctx.fillStyle = '#475569';
      }
    }
    ctx.fillStyle = '#64748b';
    ctx.font = '8.5px monospace';
    ctx.fillText('DE-ION SPLITTER PLATES (IEC 60898)', splitterStartX, splitterY - 6);

    // 3. Phase 1 — Townsend Ionization Streamers (t < 1.5ms)
    if (timeMs >= 0.1 && timeMs < 2.5) {
      const streamerAlpha = Math.min(1, timeMs / 1.0);
      ctx.strokeStyle = `rgba(56, 189, 248, ${streamerAlpha})`;
      ctx.lineWidth = 1.5;
      const numStreamers = 9;
      for (let s = 0; s < numStreamers; s++) {
        ctx.beginPath();
        let sx = electrodeLeftX + 80;
        let sy = centerY - 10 + s * 2.5;
        ctx.moveTo(sx, sy);
        while (sx < electrodeRightX) {
          sx += 6 + Math.random() * 8;
          sy += (Math.random() - 0.5) * 8;
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
    }

    // 4. Phase 2 & 3 — Arc Column Plasma Fireball (t = 1.5ms to 75ms)
    if (timeMs >= 1.5 && timeMs < 85.0) {
      const arcLife = Math.min(1, (timeMs - 1.5) / 10);
      const arcDecay = timeMs > 60 ? Math.max(0, 1 - (timeMs - 60) / 25) : 1;
      const baseRadius = (35 + Math.sin(timeMs * 0.4) * 6) * arcLife * arcDecay;

      // Outer Thermal Convection Halo
      const outerGrad = ctx.createRadialGradient(
        centerX, centerY, baseRadius * 0.2,
        centerX, centerY, baseRadius * 2.8
      );
      outerGrad.addColorStop(0, 'rgba(249, 115, 22, 0.6)');
      outerGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.25)');
      outerGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Dense Ionized Plasma Core
      const coreGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius
      );
      coreGrad.addColorStop(0, '#ffffff'); // White hot core (>20,000°C)
      coreGrad.addColorStop(0.25, '#fef08a'); // Brilliant yellow
      coreGrad.addColorStop(0.65, '#f97316'); // Fiery orange
      coreGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Vaporized Copper Gas Particles & Molten Spatter
      const particleSeed = Math.floor(timeMs * 8);
      const particleCount = Math.min(60, Math.floor(timeMs * 1.5));
      for (let p = 0; p < particleCount; p++) {
        const angle = (p * 0.45 + particleSeed * 0.05) % (Math.PI * 2);
        const dist = 30 + ((p * 7 + particleSeed * 3) % (width * 0.38));
        const px = centerX + Math.cos(angle) * dist;
        const py = centerY + Math.sin(angle) * dist * 0.65;
        
        ctx.fillStyle = p % 3 === 0 ? '#fef08a' : p % 3 === 1 ? '#fb923c' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 1.2 + (p % 3) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Phase 3 — Supersonic Shockwave Ring (t = 8ms to 45ms)
    if (timeMs >= 8.0 && timeMs <= 60.0) {
      const shockwaveProgress = (timeMs - 8.0) / 45.0;
      const shockRadius = shockwaveProgress * (width * 0.46);
      const shockAlpha = Math.max(0, 1 - shockwaveProgress * 1.2);

      ctx.save();
      ctx.strokeStyle = `rgba(254, 240, 138, ${shockAlpha * 0.85})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, shockRadius, shockRadius * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Second trailing echo shockwave
      if (shockRadius > 35) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${shockAlpha * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, shockRadius * 0.72, shockRadius * 0.72 * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Solenoid Armature Kinematic Gauge (Bottom Center)
    const solX = centerX - 120;
    const solY = centerY + 70;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(solX, solY, 240, 48);
    ctx.fillRect(solX, solY, 240, 48);

    // Solenoid Coil Graphic
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('ELECTROMAGNETIC TRIP SOLENOID (F ∝ i²)', solX + 8, solY + 12);
    
    // Solenoid plunger position
    const plungerMaxTravel = 60;
    const plungerTravel = Math.min(plungerMaxTravel, (telemetry.contactGapMm / 14.5) * plungerMaxTravel);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(solX + 10 + plungerTravel, solY + 20, 40, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText('PLUNGER', solX + 12 + plungerTravel, solY + 32);

    // Force vector arrow if current is flowing
    if (telemetry.currentKA > 2) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(solX + 55 + plungerTravel, solY + 29);
      ctx.lineTo(solX + 90 + plungerTravel, solY + 29);
      ctx.lineTo(solX + 84 + plungerTravel, solY + 25);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`${(telemetry.currentKA * 12.4).toFixed(0)} N`, solX + 94 + plungerTravel, solY + 32);
    }

  }, [timeMs, telemetry]);

  // High-Precision Animation Tick Loop (supports 0.01x extreme slow-motion)
  useEffect(() => {
    if (!isPlaying) {
      lastWallTimeRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const step = (wallTime: number) => {
      if (lastWallTimeRef.current === null) {
        lastWallTimeRef.current = wallTime;
      }
      const deltaWallMs = wallTime - lastWallTimeRef.current;
      lastWallTimeRef.current = wallTime;

      // Advance virtual simulator timeMs according to slow-motion multiplier
      setTimeMs(prev => {
        const next = prev + deltaWallMs * speedMultiplier;
        if (next >= 100.0) {
          setIsPlaying(false);
          return 100.0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speedMultiplier]);

  // Audio synch on phase transition
  const prevPhaseIdRef = useRef(activePhase.id);
  useEffect(() => {
    if (!isAudioEnabled) return;
    if (activePhase.id !== prevPhaseIdRef.current) {
      if (activePhase.id === 2) {
        playArcCrackle(400);
      } else if (activePhase.id === 4) {
        playMagneticTripSolenoid();
      } else if (activePhase.id === 5) {
        playBreakerTripSound();
      }
    }
    prevPhaseIdRef.current = activePhase.id;
  }, [activePhase.id, isAudioEnabled, playArcCrackle, playMagneticTripSolenoid, playBreakerTripSound]);

  const handleSeek = (newMs: number) => {
    setTimeMs(Math.max(0, Math.min(100, newMs)));
  };

  const handleStep = (delta: number) => {
    setIsPlaying(false);
    handleSeek(timeMs + delta);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimeMs(0.0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-5xl bg-slate-950 border-2 border-orange-500/60 rounded-2xl shadow-[0_0_60px_rgba(249,115,22,0.3)] flex flex-col overflow-hidden text-slate-100 font-mono my-auto"
        >
          {/* Tactical Phantom Camera HUD Header */}
          <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-800 bg-slate-900/90 gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400">
                <Camera className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-white">
                    DISASTER REPLAY: PHANTOM VEO-4K
                  </span>
                  <span className="px-1.5 py-0.2 bg-red-600/90 text-white rounded text-[9px] font-black tracking-wider uppercase animate-pulse">
                    1,000 FPS REPLAY BUFFER
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>EXP: 1/50,000s</span>
                  <span>•</span>
                  <span>4K SENSOR</span>
                  <span>•</span>
                  <span className="text-amber-300 font-bold">
                    {faultType === 'arc_flash' ? 'IEEE 1584 ARC EXPLOSION' : 'IEC 60898 MAGNETIC CLEARING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Microsecond High-Speed Timer Readout */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-slate-950 border border-orange-500/50 rounded-xl shadow-inner text-right">
                <div className="text-[9px] text-slate-400 uppercase tracking-widest">HIGH-SPEED TIMESTAMP</div>
                <div className="text-base sm:text-lg font-black text-orange-400 tracking-wider">
                  t = +{timeMs.toFixed(3)} <span className="text-xs text-orange-300">ms</span>
                </div>
              </div>

              <button
                onClick={() => setIsAudioEnabled(a => !a)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
                title={isAudioEnabled ? "Mute High-Speed Audio" : "Unmute High-Speed Audio"}
              >
                {isAudioEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 transition-colors border border-slate-700 hover:border-rose-500/60 cursor-pointer"
                title="Close Disaster Replay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* High-Speed Canvas Viewport */}
          <div className="relative w-full bg-slate-950 border-b border-slate-800 overflow-hidden flex items-center justify-center min-h-[300px]">
            <canvas ref={canvasRef} className="w-full h-[320px] sm:h-[350px] block" />

            {/* Overlaid Active Physical Phase Badge */}
            <div className="absolute top-3 left-3 bg-slate-950/90 border border-slate-700 p-2 rounded-xl backdrop-blur-md max-w-sm pointer-events-none">
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="w-2.5 h-2.5 rounded-full animate-ping shrink-0" 
                  style={{ backgroundColor: activePhase.color }} 
                />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {activePhase.name}
                </span>
              </div>
              <div className="text-[10.5px] text-slate-300 leading-tight">
                {activePhase.description}
              </div>
              <div className="text-[9.5px] text-amber-300/90 font-mono mt-1 pt-1 border-t border-slate-800">
                Formula: {activePhase.formula}
              </div>
            </div>

            {/* Live Microsecond Telemetry HUD Pills */}
            <div className="absolute bottom-3 right-3 flex flex-wrap gap-2 pointer-events-none">
              <div className="px-2.5 py-1 bg-slate-950/90 border border-slate-800 rounded-lg flex items-center gap-1.5 text-[10px]">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-slate-400">Plasma Temp:</span>
                <span className="font-bold text-orange-400">{telemetry.tempC.toLocaleString()}°C</span>
              </div>

              <div className="px-2.5 py-1 bg-slate-950/90 border border-slate-800 rounded-lg flex items-center gap-1.5 text-[10px]">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Current:</span>
                <span className="font-bold text-cyan-400">{telemetry.currentKA} kA</span>
              </div>

              <div className="px-2.5 py-1 bg-slate-950/90 border border-slate-800 rounded-lg flex items-center gap-1.5 text-[10px]">
                <Gauge className="w-3.5 h-3.5 text-red-400" />
                <span className="text-slate-400">Overpressure:</span>
                <span className="font-bold text-red-400">{telemetry.pressureKPa} kPa</span>
              </div>

              <div className="px-2.5 py-1 bg-slate-950/90 border border-slate-800 rounded-lg flex items-center gap-1.5 text-[10px]">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Arc Gap:</span>
                <span className="font-bold text-amber-400">+{telemetry.contactGapMm} mm</span>
              </div>
            </div>
          </div>

          {/* Scrubber Bar with Phase Keyframes */}
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-col gap-1.5">
            {/* Phase Segment Anchors Bar */}
            <div className="grid grid-cols-5 gap-1 text-[9px] font-bold">
              {PHASES.map((p) => {
                const isActive = activePhase.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSeek(p.startMs)}
                    className={cn(
                      "py-1 px-1.5 rounded text-left transition-all truncate border cursor-pointer",
                      isActive 
                        ? "bg-slate-800 text-white border-orange-400/80 shadow-sm" 
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                    )}
                    title={`Jump to ${p.name} (${p.startMs}ms - ${p.endMs}ms)`}
                  >
                    <span className="block truncate">{p.shortTitle}</span>
                    <span className="text-[7.5px] opacity-70">{p.startMs}ms - {p.endMs}ms</span>
                  </button>
                );
              })}
            </div>

            {/* Continuous Range Slider */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] text-slate-400 font-bold shrink-0">0.0 ms</span>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={timeMs}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
              <span className="text-[10px] text-slate-400 font-bold shrink-0">100.0 ms</span>
            </div>
          </div>

          {/* High-Speed Playback Controls Bar */}
          <div className="px-4 py-2.5 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
            {/* Transport Buttons: Play, Pause, Steps, Reset */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReset}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl transition-all cursor-pointer"
                title="Reset to 0.0 ms"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleStep(-0.5)}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs flex items-center gap-0.5 cursor-pointer"
                title="Step -0.5 ms"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[10px]">-0.5ms</span>
              </button>

              <button
                onClick={() => setIsPlaying(p => !p)}
                className={cn(
                  "px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95",
                  isPlaying 
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950" 
                    : "bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-orange-500/30"
                )}
              >
                {isPlaying ? (
                  <><Pause className="w-4 h-4 fill-current" /> PAUSE</>
                ) : (
                  <><Play className="w-4 h-4 fill-current" /> PLAY SLOW-MO</>
                )}
              </button>

              <button
                onClick={() => handleStep(0.5)}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs flex items-center gap-0.5 cursor-pointer"
                title="Step +0.5 ms"
              >
                <span className="text-[10px]">+0.5ms</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speed Multiplier Dials */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[9.5px] text-slate-400 font-bold px-1.5 uppercase">SPEED:</span>
              {[
                { label: '0.01x (1000 FPS)', value: 0.01 },
                { label: '0.05x', value: 0.05 },
                { label: '0.1x', value: 0.1 },
                { label: '1.0x Real', value: 1.0 }
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeedMultiplier(s.value)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                    speedMultiplier === s.value 
                      ? "bg-orange-500 text-slate-950" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
