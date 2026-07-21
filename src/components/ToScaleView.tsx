import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { ElectrodeConfig } from '../utils/ieee1584-2018';
import { ShieldAlert, Zap, Radio, CheckCircle, Flame } from 'lucide-react';

interface ToScaleViewProps {
  workingDistanceMeters: number; // e.g. 0.914m
  boundaryRadiusMeters: number; // e.g. 8.51m
  isSimulating: boolean;
  clearingTimeMs: number; // e.g. 145ms
  opticalTimeMs: number; // e.g. 10ms
  gooseLatencyMs: number; // e.g. 15ms
  breakerTimeMs: number; // e.g. 120ms
  electrodeConfig: ElectrodeConfig;
}

export function ToScaleView({
  workingDistanceMeters,
  boundaryRadiusMeters,
  isSimulating,
  clearingTimeMs,
  opticalTimeMs,
  gooseLatencyMs,
  breakerTimeMs,
  electrodeConfig
}: ToScaleViewProps) {
  const [activeLogs, setActiveLogs] = useState<{ timeMs: number; text: string; status: string }[]>([]);

  // Web Audio API sound trigger for Arc Blast
  useEffect(() => {
    if (isSimulating) {
      // Initiate live sequence log
      const tripTimeMs = Math.round(opticalTimeMs + gooseLatencyMs);
      const openTimeMs = Math.round(clearingTimeMs);

      setActiveLogs([
        { timeMs: 0, text: 'Fault Detected in Switchgear Panel A', status: 'INITIATED' },
        { timeMs: Math.round(opticalTimeMs), text: `GAPC1 Photodiode Pickup (${opticalTimeMs}ms)`, status: 'SENSING' },
        { timeMs: tripTimeMs, text: `GOOSE Type 1A Trip Published (${gooseLatencyMs}ms LAN)`, status: 'TRIPPING' },
        { timeMs: openTimeMs, text: `XCBR1 Breaker Open - Arc Quenched (${clearingTimeMs}ms)`, status: 'QUENCHED' },
      ]);

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + (clearingTimeMs / 1000));
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (clearingTimeMs / 1000));

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + (clearingTimeMs / 1000));
      } catch (e) {
        // Audio fallback
      }
    } else {
      setActiveLogs([]);
    }
  }, [isSimulating, opticalTimeMs, gooseLatencyMs, clearingTimeMs]);

  // Scaled view parameters (max radius ~12m maps to 90px in SVG view box 200x200)
  const maxViewRadiusMeters = Math.max(10, boundaryRadiusMeters * 1.15);
  const scale = 80 / maxViewRadiusMeters; // px per meter

  const workingRadiusPx = Math.max(8, workingDistanceMeters * scale);
  const boundaryRadiusPx = Math.max(12, boundaryRadiusMeters * scale);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 border border-slate-750 rounded-xl overflow-hidden shadow-inner relative">
      {/* Header Badge */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/90 z-20">
        <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-orange-400" />
          <span>To-Scale Hazard Boundary View</span>
        </span>
        <span className="text-[10px] font-mono text-orange-300 font-bold px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30">
          Config: {electrodeConfig}
        </span>
      </div>

      {/* Interactive Top-Down SVG View */}
      <div className="relative flex-1 min-h-[220px] w-full flex items-center justify-center p-2 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,_#0f172a_0%,_#020617_100%)]">
        <svg viewBox="0 0 200 200" className="w-full h-full max-h-[280px]" preserveAspectRatio="xMidYMid meet">
          {/* Grid background lines */}
          <line x1="0" y1="100" x2="200" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="100" y1="0" x2="100" y2="200" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />

          {/* Scale circles */}
          <circle cx="100" cy="100" r={40} fill="none" stroke="#1e293b" strokeWidth="0.5" />
          <circle cx="100" cy="100" r={75} fill="none" stroke="#1e293b" strokeWidth="0.5" />

          {/* Arc Flash Boundary Circle (Dashed Red) */}
          <motion.circle
            cx="100"
            cy="100"
            r={boundaryRadiusPx}
            fill="rgba(239, 68, 68, 0.08)"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            animate={{ r: boundaryRadiusPx }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />

          {/* Working Distance Circle (Solid Orange) */}
          <motion.circle
            cx="100"
            cy="100"
            r={workingRadiusPx}
            fill="rgba(249, 115, 22, 0.12)"
            stroke="#f97316"
            strokeWidth="1.5"
            animate={{ r: workingRadiusPx }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />

          {/* Center Switchgear Enclosure Box */}
          <rect x="90" y="85" width="20" height="30" rx="2" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
          <text x="100" y="103" textAnchor="middle" fill="#06b6d4" fontSize="5" fontFamily="monospace" fontWeight="bold">PANEL A</text>

          {/* Human Silhouette at Working Distance */}
          <g transform={`translate(100, ${100 + workingRadiusPx})`}>
            {/* Head */}
            <circle cx="0" cy="-6" r="3" fill="#38bdf8" />
            {/* Body */}
            <path d="M -4 0 L 4 0 L 3 8 L -3 8 Z" fill="#38bdf8" />
            {/* Label */}
            <text x="0" y="14" textAnchor="middle" fill="#38bdf8" fontSize="4.5" fontFamily="monospace" fontWeight="bold">
              Worker ({workingDistanceMeters}m)
            </text>
          </g>

          {/* Arc Flash Explosion Effects */}
          <AnimatePresence>
            {isSimulating && (
              <motion.g key="arc-flash-topdown">
                {/* Intense Plasma Core */}
                <motion.circle
                  cx="100" cy="100" r={Math.min(35, boundaryRadiusPx * 0.8)}
                  fill="rgba(255, 255, 255, 0.95)"
                  style={{ filter: 'drop-shadow(0 0 25px #ffffff)' }}
                  animate={{ scale: [1, 1.25, 0.95, 1.15], opacity: [1, 0.85, 1] }}
                  transition={{ duration: 0.2, repeat: Infinity }}
                />
                <motion.circle
                  cx="100" cy="100" r={Math.min(20, workingRadiusPx)}
                  fill="rgba(253, 224, 71, 0.9)"
                  style={{ filter: 'drop-shadow(0 0 20px #fde047)' }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.15, repeat: Infinity }}
                />
                {/* Blast Waves */}
                {[...Array(3)].map((_, i) => (
                  <motion.circle
                    key={i}
                    cx="100" cy="100" r={10}
                    fill="none" stroke="#f97316" strokeWidth="2"
                    initial={{ r: 5, opacity: 1 }}
                    animate={{ r: boundaryRadiusPx, opacity: 0 }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeOut" }}
                  />
                ))}
              </motion.g>
            )}
          </AnimatePresence>

          {/* Scale Labels */}
          <text x="100" y={100 - boundaryRadiusPx - 3} textAnchor="middle" fill="#ef4444" fontSize="5" fontFamily="monospace" fontWeight="bold">
            Arc Boundary: {boundaryRadiusMeters.toFixed(2)}m
          </text>
          <text x="100" y={100 - workingRadiusPx - 3} textAnchor="middle" fill="#f97316" fontSize="4.5" fontFamily="monospace" fontWeight="bold">
            Work Dist: {workingDistanceMeters.toFixed(2)}m
          </text>
        </svg>

        {/* Legend Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-[9px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
            <span>Working Dist ($D$): <strong>{workingDistanceMeters}m</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 border border-red-400 inline-block"></span>
            <span>Arc Boundary ($D_b$): <strong>{boundaryRadiusMeters.toFixed(2)}m</strong></span>
          </div>
        </div>
      </div>

      {/* GOOSE Sequence Event Log */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex flex-col gap-1 shrink-0">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-orange-400" /> IEEE 61850 GOOSE Sequence Log</span>
          {isSimulating && <span className="text-green-400 text-[9px] animate-pulse">● LIVE TRIPPING</span>}
        </div>

        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px] text-slate-300">
          {activeLogs.length === 0 ? (
            <div className="text-slate-500 italic text-[9.5px]">Hold "HOLD TO INITIATE ARC" to view live substation sequence log...</div>
          ) : (
            activeLogs.map((log, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-0.5 last:border-0">
                <span className="text-orange-400 font-bold">{log.timeMs}ms:</span>
                <span className="text-slate-200 flex-1 ml-2">{log.text}</span>
                <span className={cn(
                  "text-[8.5px] px-1 py-0.2 rounded font-bold uppercase",
                  log.status === 'INITIATED' ? "bg-orange-500/20 text-orange-300" :
                  log.status === 'SENSING' ? "bg-sky-500/20 text-sky-300" :
                  log.status === 'TRIPPING' ? "bg-amber-500/20 text-amber-300" : "bg-green-500/20 text-green-300"
                )}>
                  {log.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
