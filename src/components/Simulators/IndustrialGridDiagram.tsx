import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Volume2, VolumeX, Gauge, ShieldAlert, AlertTriangle, 
  Activity, CheckCircle2, Flame, Clock, Radio, ZapOff 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface IndustrialGridDiagramProps {
  time: number; // Simulated time 0 to 100ms
  isFaultActive: boolean;
  tripped: boolean;
  faultType: 'three_phase' | 'line_ground';
  protectionSpeed: 'fast' | 'delayed' | 'fail';
  faultCurrent: number; // Amps
  faultCurrentKA: number; // kA
  peakCurrentKA: number; // kA
  letThroughEnergyKA2s: number; // kA²s
  withstandCapacityKA2s: number; // kA²s
  cableSizeMm2: number;
  transformerKVA: number;
  ukPercent: number;
  tripTime: number; // ms
  isThermalPass: boolean;
  timeScale: number; // 1, 0.5, 0.25
  setTimeScale: (scale: number) => void;
  className?: string;
}

export function IndustrialGridDiagram({
  time,
  isFaultActive,
  tripped,
  faultType,
  protectionSpeed,
  faultCurrent,
  faultCurrentKA,
  peakCurrentKA,
  letThroughEnergyKA2s,
  withstandCapacityKA2s,
  cableSizeMm2,
  transformerKVA,
  ukPercent,
  tripTime,
  isThermalPass,
  timeScale,
  setTimeScale,
  className
}: IndustrialGridDiagramProps) {
  // Sound & Motion settings
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const humOscRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
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

  // Web Audio Synthesizer Functions
  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Start / Stop Transformer Background Hum
  useEffect(() => {
    if (isMuted || prefersReducedMotion) {
      if (humOscRef.current && audioCtxRef.current) {
        try {
          humGainRef.current?.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05);
        } catch (e) {}
      }
      return;
    }

    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;

      if (!humOscRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, ctx.currentTime); // 50 Hz Grid Hum

        // Filter for deep transformer hum
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, ctx.currentTime);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        humOscRef.current = osc;
        humGainRef.current = gain;
      } else if (humGainRef.current) {
        // Modulate hum volume during active fault
        const targetVol = isFaultActive ? 0.25 : 0.05;
        humGainRef.current.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.1);
      }
    } catch (e) {
      // Audio fallback
    }
  }, [isMuted, isFaultActive, prefersReducedMotion]);

  // Play Mechanical Breaker Clack on Trip
  const lastTrippedRef = useRef<boolean>(false);
  useEffect(() => {
    if (tripped && !lastTrippedRef.current && !isMuted) {
      try {
        initAudio();
        if (audioCtxRef.current) {
          const ctx = audioCtxRef.current;
          const now = ctx.currentTime;

          // Metal clack oscillator burst
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);

          // Haptics on mobile
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([80, 40, 120]);
          }
        }
      } catch (e) {}
    }
    lastTrippedRef.current = tripped;
  }, [tripped, isMuted]);

  // Play Arc Roar Sound on Fault Inception
  const lastFaultRef = useRef<boolean>(false);
  useEffect(() => {
    if (isFaultActive && !lastFaultRef.current && !isMuted) {
      try {
        initAudio();
        if (audioCtxRef.current) {
          const ctx = audioCtxRef.current;
          const now = ctx.currentTime;

          // White noise explosion burst
          const bufferSize = ctx.sampleRate * 0.8;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.min(1.0, faultCurrentKA / 15);
          }

          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1500, now);
          filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.6, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          noise.start(now);

          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([150, 50, 250, 50, 300]);
          }
        }
      } catch (e) {}
    }
    lastFaultRef.current = isFaultActive;
  }, [isFaultActive, faultCurrentKA, isMuted]);

  // Calculate Conductor Thermal Energy Ratio (I²t / k²S²)
  const thermalRatio = useMemo(() => {
    if (withstandCapacityKA2s <= 0) return 0;
    return letThroughEnergyKA2s / withstandCapacityKA2s;
  }, [letThroughEnergyKA2s, withstandCapacityKA2s]);

  // Conductor Color Gradient based on thermal stress
  const conductorColor = useMemo(() => {
    if (thermalRatio < 0.25) return '#10b981'; // Healthy Emerald
    if (thermalRatio < 0.60) return '#f59e0b'; // Amber / Yellow
    if (thermalRatio <= 1.00) return '#ef4444'; // Red-Hot Glow
    return '#78350f'; // Charred Dark Brown
  }, [thermalRatio]);

  const isMelted = thermalRatio > 1.00 || (time === 100 && !tripped);

  // Haptics on cable melt
  useEffect(() => {
    if (isMelted && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 100, 500, 100, 500]);
    }
  }, [isMelted]);

  // Stage Arc Flash Canvas Overlay Animation Runner
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particleOffset = 0;

    const renderCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isFaultActive && !prefersReducedMotion) {
        const faultX = 350;
        const faultY = 160;
        const stageTime = (time - 10); // ms since ignition

        // Stage (d): Radial Screen Light-Bloom scaled to kA magnitude
        const bloomRadius = Math.min(180, 40 + faultCurrentKA * 8);
        const bloomGrad = ctx.createRadialGradient(faultX, faultY, 0, faultX, faultY, bloomRadius);
        bloomGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.85, 0.4 + faultCurrentKA / 20)})`);
        bloomGrad.addColorStop(0.3, `rgba(251, 191, 36, ${Math.min(0.7, 0.3 + faultCurrentKA / 25)})`);
        bloomGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.3)');
        bloomGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = bloomGrad;
        ctx.beginPath();
        ctx.arc(faultX, faultY, bloomRadius, 0, Math.PI * 2);
        ctx.fill();

        // Stage (c): Expanding Pressure-Wave Shockwave Ring
        const shockRadius = (stageTime * 2.5) % 120;
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - shockRadius / 120)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(faultX, faultY, shockRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Stage (a): Initial Ignition Spark Burst (0 to 30ms)
        if (stageTime <= 30) {
          const sparkCount = 18;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          for (let i = 0; i < sparkCount; i++) {
            const angle = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.2;
            const dist = 15 + Math.random() * 35;
            ctx.beginPath();
            ctx.moveTo(faultX, faultY);
            ctx.lineTo(faultX + Math.cos(angle) * dist, faultY + Math.sin(angle) * dist);
            ctx.stroke();
          }
        }

        // Stage (b): Plasma Column Arc Flicker
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#38bdf8';

        if (faultType === 'three_phase') {
          // Triple Arc Bursts between 3 phase lines
          for (let p = -1; p <= 1; p++) {
            ctx.strokeStyle = p === 0 ? '#ffffff' : '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(faultX - 25, faultY + p * 12);
            for (let step = -20; step <= 25; step += 8) {
              const jitterY = faultY + p * 12 + (Math.random() * 10 - 5);
              ctx.lineTo(faultX + step, jitterY);
            }
            ctx.stroke();
          }
        } else {
          // Line-to-Ground Arc Jet to Earth Symbol
          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(faultX, faultY - 15);
          let currentY = faultY - 15;
          while (currentY < faultY + 45) {
            currentY += 8;
            const jitterX = faultX + (Math.random() * 14 - 7);
            ctx.lineTo(jitterX, currentY);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Stage (e): Rising Smoke Wisps
        ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
        for (let s = 0; s < 5; s++) {
          const smokeY = faultY - ((stageTime * 1.2 + s * 15) % 80);
          const smokeX = faultY + Math.sin(smokeY / 10) * 12;
          const smokeR = 6 + (faultY - smokeY) * 0.15;
          ctx.beginPath();
          ctx.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      particleOffset = (particleOffset + (isFaultActive ? 8 : 1.5)) % 40;
      animId = requestAnimationFrame(renderCanvas);
    };

    renderCanvas();
    return () => cancelAnimationFrame(animId);
  }, [isFaultActive, time, faultType, faultCurrentKA, prefersReducedMotion]);

  return (
    <div className={cn(
      "w-full h-full min-h-[480px] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative select-none",
      className
    )}>
      {/* Top Diagram Controls & Specs Bar */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-30 shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-100 font-mono">
            415V Industrial Grid Single Line Diagram (IEC 60909)
          </span>
        </div>

        {/* Action Controls: Time Scale, Sound, Info Chips */}
        <div className="flex items-center gap-2">
          {/* Time Scale Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-300 px-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Speed:
            </span>
            {[1, 0.5, 0.25].map(scale => (
              <button
                key={scale}
                onClick={() => setTimeScale(scale)}
                className={cn(
                  "px-2 py-1 rounded font-bold transition-all cursor-pointer min-h-[36px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
                  timeScale === scale 
                    ? "bg-cyan-600 text-slate-950 font-black shadow-sm" 
                    : "text-slate-300 hover:text-white"
                )}
              >
                {scale}X
              </button>
            ))}
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all min-h-[36px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
              isMuted 
                ? "bg-slate-900 text-slate-400 border-slate-800" 
                : "bg-cyan-950 text-cyan-300 border-cyan-750"
            )}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span className="text-[11px] font-mono">{isMuted ? "MUTED" : "AUDIO ON"}</span>
          </button>
        </div>
      </div>

      {/* Main SVG Vector Diagram + Canvas Arc Flash Overlay */}
      <div className="relative flex-1 w-full min-h-[420px] flex items-center justify-center p-2 overflow-hidden bg-[radial-gradient(ellipse_at_top,_#1e293b_0%,_#0f172a_100%)]">
        
        {/* Canvas Overlay for Stage Arc Flash & Plasma */}
        <canvas
          ref={canvasRef}
          width={500}
          height={380}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* SVG Vector SLD Canvas */}
        <svg
          viewBox="0 0 500 360"
          className="w-full h-full max-w-[700px] max-h-[500px] overflow-visible z-10"
        >
          <defs>
            {/* Glow Filters */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="faultGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Grid Pattern */}
            <pattern id="grid_sld" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="500" height="360" fill="url(#grid_sld)" rx="12" opacity="0.3" />

          {/* 1. TRANSFORMER SUBSTATION SYMBOL (2-Winding D/Yn11) */}
          <g transform="translate(30, 20)">
            <rect x="0" y="0" width="100" height="60" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            {/* Cooling Fins */}
            {[-3, 15, 33, 51, 69, 87, 103].map((fx, idx) => (
              <line key={idx} x1={fx} y1="-4" x2={fx} y2="0" stroke="#334155" strokeWidth="1.5" />
            ))}

            {/* 2-Winding Overlapping Circles Symbol */}
            <circle cx="38" cy="30" r="16" fill="none" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="62" cy="30" r="16" fill="none" stroke="#38bdf8" strokeWidth="2" />

            <text x="50" y="11" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
              TRANSFORMER
            </text>
            <text x="50" y="52" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="monospace">
              {transformerKVA}kVA (uk={ukPercent}%)
            </text>
          </g>

          {/* 415V BUSBAR LINE */}
          <path
            d="M 130,50 L 200,50"
            fill="none"
            stroke="#64748b"
            strokeWidth="3"
          />
          <text x="165" y="40" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="monospace">
            415V Grid Bus
          </text>

          {/* 2. CT RING & PROTECTION RELAY MODULE 51 */}
          <path
            d="M 200,50 L 260,50"
            fill="none"
            stroke={isFaultActive ? '#ef4444' : conductorColor}
            strokeWidth="3.5"
          />

          {/* CT Ring Symbol */}
          <circle cx="230" cy="50" r="9" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
          <text x="230" y="34" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="monospace">
            CT 1000/5A
          </text>

          {/* Dashed CT Secondary Wiring Line to Relay 51 */}
          <path
            d="M 230,59 L 230,110 L 170,110"
            fill="none"
            stroke={isFaultActive ? '#ef4444' : '#f59e0b'}
            strokeWidth="1.5"
            strokeDasharray="3 3"
            className={cn(isFaultActive && "animate-pulse")}
          />

          {/* Relay 51 Protection Card */}
          <g transform="translate(60, 100)">
            <rect x="0" y="0" width="110" height="75" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="55" y="14" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="black" fontFamily="monospace">
              RELAY 51 (O/C)
            </text>

            {/* Mode & Td Info Labels (≥11px) */}
            <text x="8" y="30" fill="#cbd5e1" fontSize="12" fontFamily="monospace" fontWeight="bold">
              Mode: {protectionSpeed.toUpperCase()}
            </text>
            <text x="8" y="44" fill="#cbd5e1" fontSize="12" fontFamily="monospace">
              Td: {tripTime === Infinity ? '∞' : `${tripTime}ms`}
            </text>

            {/* Relay Status LEDs with Text Chips (RUN / PICKUP / TRIP) */}
            <g transform="translate(8, 52)">
              {/* RUN LED */}
              <circle cx="6" cy="10" r="3.5" fill="#10b981" />
              <text x="12" y="13" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">PWR:ON</text>

              {/* PICKUP LED */}
              <circle 
                cx="48" cy="10" r="3.5" 
                fill={isFaultActive ? '#f59e0b' : '#334155'} 
                className={cn(isFaultActive && "animate-ping")}
              />
              <text x="54" y="13" fill={isFaultActive ? '#f59e0b' : '#64748b'} fontSize="11" fontFamily="monospace" fontWeight="bold">P/U</text>

              {/* TRIP LED */}
              <circle 
                cx="80" cy="10" r="3.5" 
                fill={tripped ? '#ef4444' : '#334155'} 
              />
              <text x="86" y="13" fill={tripped ? '#ef4444' : '#64748b'} fontSize="11" fontFamily="monospace" fontWeight="bold">TRIP</text>
            </g>
          </g>

          {/* Relay Trip Control Signal Line to Breaker */}
          <path
            d="M 170,135 L 280,135 L 280,75"
            fill="none"
            stroke={tripped ? '#ef4444' : isFaultActive ? '#f59e0b' : '#64748b'}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* 3. BREAKER VCB-CB1 WITH STATUS FLAG & ARC CHUTE */}
          <g transform="translate(255, 25)">
            <rect x="0" y="0" width="50" height="50" rx="6" fill="#0f172a" stroke={tripped ? '#10b981' : '#ef4444'} strokeWidth="2" />
            <text x="25" y="12" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="monospace">
              VCB-CB1
            </text>

            {/* Breaker Arc Chute Plates */}
            <g transform="translate(36, 18)">
              {[-2, 3, 8, 13, 18].map((py, idx) => (
                <line key={idx} x1="0" y1={py} x2="8" y2={py} stroke="#64748b" strokeWidth="1" />
              ))}
            </g>

            {/* Breaker Contact Terminals */}
            <circle cx="12" cy="25" r="2.5" fill="#f8fafc" />
            <circle cx="34" cy="25" r="2.5" fill="#f8fafc" />

            {/* Moving Contact Arm */}
            <g transform={`rotate(${tripped ? -38 : 0}, 12, 25)`} className="transition-transform duration-300">
              <line x1="12" y1="25" x2="34" y2="25" stroke={tripped ? '#10b981' : '#ef4444'} strokeWidth="3" />
            </g>

            {/* Status Flag Indicator ([CLOSED] / [OPEN]) */}
            <g transform="translate(10, 36)">
              <rect 
                x="0" y="0" width="30" height="10" rx="2" 
                fill={tripped ? '#064e3b' : '#7f1d1d'} 
                stroke={tripped ? '#10b981' : '#ef4444'} 
                strokeWidth="1" 
              />
              <text x="15" y="8" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black" fontFamily="monospace">
                {tripped ? 'OPEN' : 'CLOSED'}
              </text>
            </g>
          </g>

          {/* 4. CABLE THERMAL GRADIENT & WHIP / MELTDOWN ANIMATION */}
          {!isMelted ? (
            <motion.path
              d="M 305,50 L 350,50 L 350,160"
              fill="none"
              stroke={conductorColor}
              strokeWidth={isFaultActive ? '5' : '3.5'}
              style={{
                filter: isFaultActive ? 'url(#faultGlow)' : undefined
              }}
            />
          ) : (
            <g>
              <motion.path
                d="M 305,50 L 335,65"
                fill="none"
                stroke="#78350f"
                strokeWidth="4"
                initial={{ pathLength: 1 }}
                animate={{ rotate: [-10, 15, -5] }}
                transition={{ duration: 0.4 }}
              />
              <motion.path
                d="M 350,160 L 350,110 L 340,95"
                fill="none"
                stroke="#78350f"
                strokeWidth="4"
              />
              <circle cx="335" cy="65" r="3" fill="#ef4444" className="animate-ping" />
              <text x="360" y="90" fill="#ef4444" fontSize="12" fontWeight="black" fontFamily="sans-serif" className="animate-bounce">
                CABLE MELTDOWN!
              </text>
            </g>
          )}

          {/* Conductor Cable Specifications Tag */}
          <g transform="translate(360, 45)">
            <rect x="0" y="0" width="130" height="40" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="65" y="14" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="monospace">
              CABLE: {cableSizeMm2} mm² Cu PVC
            </text>
            <text x="65" y="30" textAnchor="middle" fill={isMelted ? '#ef4444' : '#38bdf8'} fontSize="12" fontWeight="bold" fontFamily="monospace">
              Withstand: {withstandCapacityKA2s.toFixed(2)} kA²s
            </text>
          </g>

          {/* 5. CURRENT FLOW PARTICLES */}
          {(!tripped && !isMelted && !prefersReducedMotion) && (
            <g>
              {isFaultActive ? (
                <>
                  <circle r="5" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 6px #ffffff)' }}>
                    <animateMotion path="M 130,50 L 350,50 L 350,160" dur={`${0.15 / timeScale}s`} repeatCount="indefinite" />
                  </circle>
                  <circle r="4" fill="#fbbf24">
                    <animateMotion path="M 130,50 L 350,50 L 350,160" dur={`${0.2 / timeScale}s`} repeatCount="indefinite" />
                  </circle>
                </>
              ) : (
                <>
                  <circle r="3.5" fill="#10b981">
                    <animateMotion path="M 130,50 L 350,50 L 350,270 L 415,270" dur={`${1.4 / timeScale}s`} repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </g>
          )}

          {/* 6. FAULT INCEPTION POINT & PROTECTIVE EARTH GROUND SYMBOL */}
          <g transform="translate(350, 160)">
            <circle cx="0" cy="0" r="4" fill="#ef4444" />
            <text x="-10" y="-10" fill="#ef4444" fontSize="12" fontWeight="black" fontFamily="sans-serif">
              {faultType === 'three_phase' ? '3-PHASE FAULT' : 'L-G FAULT'}
            </text>

            <line x1="0" y1="0" x2="0" y2="40" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="-16" y1="40" x2="16" y2="40" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="-10" y1="45" x2="10" y2="45" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="-5" y1="50" x2="5" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
            <text x="0" y="64" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="monospace">
              EARTH
            </text>
          </g>

          {/* 7. MOTOR LOAD */}
          <path
            d="M 350,160 L 350,270 L 415,270"
            fill="none"
            stroke={tripped || isMelted ? '#334155' : conductorColor}
            strokeWidth="3"
            strokeDasharray={tripped || isMelted ? '4 4' : 'none'}
          />

          <g transform="translate(415, 240)">
            <rect x="0" y="0" width="75" height="60" rx="6" fill="#1e293b" stroke={tripped || isMelted ? '#475569' : '#10b981'} strokeWidth="1.5" />
            <text x="37.5" y="14" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="monospace">
              MOTOR LOAD
            </text>

            <circle cx="37.5" cy="38" r="16" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            <text x="37.5" y="43" textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="black" fontFamily="sans-serif">
              M
            </text>

            <motion.g
              style={{ originX: '37.5px', originY: '38px' }}
              animate={{ rotate: (tripped || isMelted) ? 0 : 360 }}
              transition={{ 
                duration: (tripped || isMelted) ? 2.0 : 0.8, 
                repeat: (tripped || isMelted) ? 0 : Infinity, 
                ease: (tripped || isMelted) ? "easeOut" : "linear" 
              }}
            >
              <line x1="37.5" y1="24" x2="37.5" y2="52" stroke="#94a3b8" strokeWidth="1.5" opacity="0.6" />
              <line x1="23.5" y1="38" x2="51.5" y2="38" stroke="#94a3b8" strokeWidth="1.5" opacity="0.6" />
            </motion.g>

            <AnimatePresence>
              {(tripped || isMelted) && (
                <motion.g
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <rect x="-10" y="-18" width="95" height="18" rx="3" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
                  <text x="37.5" y="-5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="black" fontFamily="monospace" className="animate-pulse">
                    ⚠️ LOAD LOST
                  </text>
                </motion.g>
              )}
            </AnimatePresence>
          </g>

        </svg>
      </div>

      {/* Persistent Diagnostics Overlay Bar */}
      <div className="w-full bg-slate-900/95 border-t border-slate-800 p-2 px-4 flex flex-wrap items-center justify-between text-xs font-mono shrink-0 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Ik:</span>
            <span className="font-bold text-red-400 tabular-nums">{faultCurrentKA.toFixed(2)} kA</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">ip:</span>
            <span className="font-bold text-orange-400 tabular-nums">{peakCurrentKA.toFixed(2)} kA</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">I²t:</span>
            <span className="font-bold text-amber-400 tabular-nums">{letThroughEnergyKA2s.toFixed(2)} kA²s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Thermal Stress:</span>
          <div className="w-24 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                thermalRatio < 0.6 ? "bg-emerald-500" : thermalRatio <= 1.0 ? "bg-amber-500" : "bg-red-500 animate-pulse"
              )}
              style={{ width: `${Math.min(100, thermalRatio * 100)}%` }}
            />
          </div>
          <span className={cn("font-bold tabular-nums", isMelted ? "text-red-400" : "text-emerald-400")}>
            {(thermalRatio * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
