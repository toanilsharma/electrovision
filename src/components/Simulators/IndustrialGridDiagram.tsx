import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import panzoom, { PanZoom } from 'panzoom';
import { 
  Zap, Volume2, VolumeX, Gauge, ShieldAlert, AlertTriangle, 
  Activity, CheckCircle2, Flame, Clock, Radio, ZapOff,
  Plus, Minus, Maximize2
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

  // Panzoom Instance & Container Refs
  const sldContainerRef = useRef<HTMLDivElement | null>(null);
  const panzoomInstanceRef = useRef<PanZoom | null>(null);

  // Initialize Panzoom on Mobile / Desktop SLD
  useEffect(() => {
    if (!sldContainerRef.current) return;
    const pz = panzoom(sldContainerRef.current, {
      maxZoom: 4.0,
      minZoom: 0.5,
      bounds: true,
      boundsPadding: 0.15,
      zoomDoubleClickSpeed: 1,
      onTouch: () => false, // enable smooth multi-touch pinch & pan
    });
    panzoomInstanceRef.current = pz;

    return () => {
      pz.dispose();
      panzoomInstanceRef.current = null;
    };
  }, []);

  const handleResetViewport = () => {
    if (panzoomInstanceRef.current) {
      panzoomInstanceRef.current.moveTo(0, 0);
      panzoomInstanceRef.current.zoomAbs(0, 0, 1);
    }
  };

  const handleZoomIn = () => {
    if (panzoomInstanceRef.current) {
      panzoomInstanceRef.current.smoothZoom(250, 180, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (panzoomInstanceRef.current) {
      panzoomInstanceRef.current.smoothZoom(250, 180, 0.77);
    }
  };

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
        osc.frequency.setValueAtTime(100, ctx.currentTime); // 100Hz 2nd harmonic hum
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        humOscRef.current = osc;
        humGainRef.current = gain;
      } else if (humGainRef.current) {
        humGainRef.current.gain.setTargetAtTime(0.015, ctx.currentTime, 0.1);
      }
    } catch (e) {
      console.warn("Audio init prevented:", e);
    }

    return () => {
      if (humOscRef.current && audioCtxRef.current) {
        try {
          humGainRef.current?.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05);
        } catch (e) {}
      }
    };
  }, [isMuted, prefersReducedMotion]);

  // Trigger Arc Blast Sound Effect on Fault Initiation
  useEffect(() => {
    if (!isFaultActive || isMuted || prefersReducedMotion) return;

    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;

      const bufferSize = ctx.sampleRate * 0.15; // 150ms noise blast
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 450;
      filter.Q.value = 3;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
    } catch (e) {}
  }, [isFaultActive, isMuted, prefersReducedMotion]);

  // Trigger Breaker Trip Solenoid Click Sound Effect
  useEffect(() => {
    if (!tripped || isMuted || prefersReducedMotion) return;

    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }, [tripped, isMuted, prefersReducedMotion]);

  // Particle System Canvas Animation for Arc Plasma Sparks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      color: string;
    }

    const sparks: Spark[] = [];
    const colors = ['#f59e0b', '#ef4444', '#fef08a', '#38bdf8', '#ffffff'];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isFaultActive && !prefersReducedMotion) {
        // Spawn sparks at the fault busbar (x: 350, y: 160)
        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 5.5;
          sparks.push({
            x: 350,
            y: 160,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 15 + Math.random() * 20,
            size: 1 + Math.random() * 2.5,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
      }

      // Update & Draw Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.15; // Gravity pull
        s.life += 1;

        const alpha = Math.max(0, 1 - s.life / s.maxLife);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        if (s.life >= s.maxLife) {
          sparks.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1.0;

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [isFaultActive, prefersReducedMotion]);

  // Calculate Conductor Dynamic Color based on Thermal Stress Ratio (I²t / k²S²)
  const thermalRatio = useMemo(() => {
    if (withstandCapacityKA2s <= 0) return 0;
    return letThroughEnergyKA2s / withstandCapacityKA2s;
  }, [letThroughEnergyKA2s, withstandCapacityKA2s]);

  const conductorColor = useMemo(() => {
    if (tripped) return '#64748b'; // Cold slate gray after trip
    if (thermalRatio >= 1.0) return '#ef4444'; // Red-hot melted
    if (thermalRatio >= 0.7) return '#f97316'; // Glowing orange
    if (thermalRatio >= 0.4) return '#facc15'; // Warm yellow
    return '#38bdf8'; // Normal cool cyan
  }, [thermalRatio, tripped]);

  const isMelted = thermalRatio > 1.0;

  return (
    <div className={cn("flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative", className)}>
      
      {/* Top Header Bar: Status Badge, Slow-Mo Speed Pills, Audio Toggle */}
      <div className="p-2.5 sm:p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 z-20 flex-wrap">
        
        {/* Left: Industrial SLD Title & Relay State Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider uppercase text-white font-mono">
                IEC 60909 INDUSTRIAL SLD
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                {faultType === 'three_phase' ? '3Φ BOLTED' : '1Φ L-G'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              Transformer D/Yn11 • Relay 51 • VCB Vacuum Interrupter
            </span>
          </div>
        </div>

        {/* Right: Controls (Slow-Mo Pills & Audio Mute Button) */}
        <div className="flex items-center gap-2">
          
          {/* Slow-Mo Time Scale Pills */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            {([
              { scale: 1, label: '1x Live' },
              { scale: 0.5, label: '0.5x' },
              { scale: 0.25, label: '0.25x Slo-Mo' }
            ] as const).map(({ scale, label }) => (
              <button
                key={scale}
                type="button"
                onClick={() => setTimeScale(scale)}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded font-mono transition-all cursor-pointer min-h-[44px] flex items-center justify-center",
                  timeScale === scale
                    ? "bg-cyan-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sound Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={() => {
              initAudio();
              setIsMuted(!isMuted);
            }}
            className={cn(
              "px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[44px]",
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

      {/* Main SVG Vector Diagram + Canvas Arc Flash Overlay with Panzoom & Reset FAB */}
      <div className="relative flex-1 w-full min-h-[420px] flex items-center justify-center p-2 overflow-hidden bg-[radial-gradient(ellipse_at_top,_#1e293b_0%,_#0f172a_100%)] touch-none select-none">
        
        {/* Panzoom Viewport Container */}
        <div 
          ref={sldContainerRef}
          className="w-full h-full max-w-[700px] max-h-[500px] flex items-center justify-center relative origin-center cursor-grab active:cursor-grabbing"
        >
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
            className="w-full h-full max-w-[700px] max-h-[500px] overflow-visible z-10 select-none pointer-events-auto"
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

              <text x="50" y="11" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace" className="pointer-events-none select-none">
                TRANSFORMER
              </text>
              <text x="50" y="52" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="monospace" className="pointer-events-none select-none">
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
            <text x="165" y="40" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="monospace" className="pointer-events-none select-none">
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
            <text x="230" y="34" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="monospace" className="pointer-events-none select-none">
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
              <text x="55" y="14" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="black" fontFamily="monospace" className="pointer-events-none select-none">
                RELAY 51 (O/C)
              </text>

              {/* Mode & Td Info Labels (≥11px) */}
              <text x="8" y="30" fill="#cbd5e1" fontSize="12" fontFamily="monospace" fontWeight="bold" className="pointer-events-none select-none">
                Mode: {protectionSpeed.toUpperCase()}
              </text>
              <text x="8" y="44" fill="#cbd5e1" fontSize="12" fontFamily="monospace" className="pointer-events-none select-none">
                Td: {tripTime === Infinity ? '∞' : `${tripTime}ms`}
              </text>

              {/* Relay Status LEDs with Text Chips (RUN / PICKUP / TRIP) */}
              <g transform="translate(8, 52)">
                {/* RUN LED */}
                <circle cx="6" cy="10" r="3.5" fill="#10b981" />
                <text x="12" y="13" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold" className="pointer-events-none select-none">PWR:ON</text>

                {/* PICKUP LED */}
                <circle 
                  cx="48" cy="10" r="3.5" 
                  fill={isFaultActive ? '#f59e0b' : '#334155'} 
                  className={cn(isFaultActive && "animate-ping")}
                />
                <text x="54" y="13" fill={isFaultActive ? '#f59e0b' : '#64748b'} fontSize="11" fontFamily="monospace" fontWeight="bold" className="pointer-events-none select-none">P/U</text>

                {/* TRIP LED */}
                <circle 
                  cx="80" cy="10" r="3.5" 
                  fill={tripped ? '#ef4444' : '#334155'} 
                />
                <text x="86" y="13" fill={tripped ? '#ef4444' : '#64748b'} fontSize="11" fontFamily="monospace" fontWeight="bold" className="pointer-events-none select-none">TRIP</text>
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
              <text x="25" y="12" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="monospace" className="pointer-events-none select-none">
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
                <text x="15" y="8" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black" fontFamily="monospace" className="pointer-events-none select-none">
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
                <text x="360" y="90" fill="#ef4444" fontSize="12" fontWeight="black" fontFamily="sans-serif" className="animate-bounce pointer-events-none select-none">
                  CABLE MELTDOWN!
                </text>
              </g>
            )}

            {/* Conductor Cable Specifications Tag */}
            <g transform="translate(360, 45)">
              <rect x="0" y="0" width="130" height="40" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
              <text x="65" y="14" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="monospace" className="pointer-events-none select-none">
                CABLE: {cableSizeMm2} mm² Cu PVC
              </text>
              <text x="65" y="30" textAnchor="middle" fill={isMelted ? '#ef4444' : '#38bdf8'} fontSize="12" fontWeight="bold" fontFamily="monospace" className="pointer-events-none select-none">
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
              <text x="-10" y="-10" fill="#ef4444" fontSize="12" fontWeight="black" fontFamily="sans-serif" className="pointer-events-none select-none">
                {faultType === 'three_phase' ? '3-PHASE FAULT' : 'L-G FAULT'}
              </text>

              <line x1="0" y1="0" x2="0" y2="40" stroke="#cbd5e1" strokeWidth="2.5" />
              <line x1="-16" y1="40" x2="16" y2="40" stroke="#cbd5e1" strokeWidth="2.5" />
              <line x1="-10" y1="45" x2="10" y2="45" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="-5" y1="50" x2="5" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
              <text x="0" y="64" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="monospace" className="pointer-events-none select-none">
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
              <text x="37.5" y="14" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="monospace" className="pointer-events-none select-none">
                MOTOR LOAD
              </text>

              <circle cx="37.5" cy="38" r="16" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
              <text x="37.5" y="43" textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="black" fontFamily="sans-serif" className="pointer-events-none select-none">
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
                    <text x="37.5" y="-5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="black" fontFamily="monospace" className="animate-pulse pointer-events-none select-none">
                      ⚠️ LOAD LOST
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </g>

          </svg>
        </div>

        {/* Floating Action Button (FAB) in Bottom Right: Zoom & Reset/Fit to 100% */}
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md p-1 rounded-2xl border border-slate-750 shadow-2xl">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-all active:scale-95 border border-slate-800"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-all active:scale-95 border border-slate-800"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetViewport}
            title="Reset Viewport to 100% / Fit"
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-lg shadow-cyan-500/20 border border-cyan-400"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-xs font-mono font-black">FIT 100%</span>
          </button>
        </div>
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
