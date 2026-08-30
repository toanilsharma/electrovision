import React, { useState } from 'react';
import { Play, Square, RotateCcw, Clock, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface EventTimelineScrubberProps {
  time: number; // 0 to 100 ms
  setTime: (t: number) => void;
  isAutoPlaying: boolean;
  setIsAutoPlaying: (playing: boolean) => void;
  protectionSpeed: 'fast' | 'delayed' | 'fail';
  tRelayMs: number;
  tBreakerMs: number;
  tArcMs: number;
  tTotalMs: number;
  tripped: boolean;
  className?: string;
}

export function EventTimelineScrubber({
  time,
  setTime,
  isAutoPlaying,
  setIsAutoPlaying,
  protectionSpeed,
  tRelayMs,
  tBreakerMs,
  tArcMs,
  tTotalMs,
  tripped,
  className
}: EventTimelineScrubberProps) {
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  const faultInceptionMs = 10;
  const tripCommandMs = protectionSpeed === 'fail' ? Infinity : (faultInceptionMs + tRelayMs);
  const contactsPartMs = protectionSpeed === 'fail' ? Infinity : (tripCommandMs + tBreakerMs);
  const clearedMs = protectionSpeed === 'fail' ? Infinity : (faultInceptionMs + tTotalMs);

  // Markers definition
  const markers = [
    {
      id: 'fault',
      label: 't0 FAULT',
      sub: 'Inception',
      ms: faultInceptionMs,
      color: 'bg-red-500 border-red-400 text-red-300',
      active: time >= faultInceptionMs
    },
    {
      id: 'pickup',
      label: 'RELAY PICKUP',
      sub: 'O/C Detect',
      ms: faultInceptionMs,
      color: 'bg-amber-500 border-amber-400 text-amber-300',
      active: time >= faultInceptionMs
    },
    ...(protectionSpeed !== 'fail' ? [
      {
        id: 'trip',
        label: 'TRIP COMMAND',
        sub: `${tRelayMs}ms delay`,
        ms: tripCommandMs,
        color: 'bg-cyan-500 border-cyan-400 text-cyan-300',
        active: time >= tripCommandMs
      },
      {
        id: 'contacts',
        label: 'CONTACTS PART',
        sub: `+${tBreakerMs}ms CB`,
        ms: contactsPartMs,
        color: 'bg-orange-500 border-orange-400 text-orange-300',
        active: time >= contactsPartMs
      },
      {
        id: 'cleared',
        label: 'ARC EXTINCT',
        sub: `${tTotalMs}ms cleared`,
        ms: clearedMs,
        color: 'bg-emerald-500 border-emerald-400 text-emerald-300',
        active: time >= clearedMs
      }
    ] : [
      {
        id: 'notrip',
        label: 'NO TRIP',
        sub: 'Relay Fail',
        ms: 100,
        color: 'bg-red-600 border-red-400 text-red-100 animate-pulse',
        active: time >= 100
      }
    ])
  ];

  return (
    <div className={cn("p-4 rounded-xl bg-slate-900 border border-slate-750 shadow-xl flex flex-col gap-3", className)}>
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Event Timeline Scrubber (0 - 100 ms)
          </span>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          {isAutoPlaying ? (
            <button
              onClick={() => setIsAutoPlaying(false)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer border border-red-500 shadow"
            >
              <Square className="w-3.5 h-3.5 fill-white" /> PAUSE
            </button>
          ) : (
            <button
              onClick={() => {
                if (time >= 100) setTime(0);
                setIsAutoPlaying(true);
              }}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1 cursor-pointer border border-green-500 shadow"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" /> IGNITE / RUN
            </button>
          )}

          <button
            onClick={() => {
              setIsAutoPlaying(false);
              setTime(0);
            }}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-750 rounded-lg cursor-pointer"
            title="Reset Timeline to 0ms"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-mono font-bold text-orange-400">
            {time} ms
          </div>
        </div>
      </div>

      {/* 0-100ms Scrubber Bar & Markers */}
      <div className="relative pt-6 pb-8 px-2">
        {/* Track Line */}
        <div className="w-full h-3 bg-slate-950 border border-slate-800 rounded-full relative overflow-hidden">
          {/* Fault Duration Highlight */}
          {time >= faultInceptionMs && (
            <div
              className={cn(
                "h-full transition-all duration-75",
                tripped ? "bg-emerald-500/50" : "bg-red-500/60 animate-pulse"
              )}
              style={{
                left: `${faultInceptionMs}%`,
                width: `${Math.min(100, (tripped ? (clearedMs - faultInceptionMs) : (time - faultInceptionMs)))}%`
              }}
            />
          )}
        </div>

        {/* Interactive Native Range Input overlay for smooth drag */}
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={time}
          onChange={(e) => {
            setIsAutoPlaying(false);
            setTime(Number(e.target.value));
          }}
          className="absolute left-0 top-6 w-full h-3 opacity-0 cursor-pointer z-30"
        />

        {/* Animated Playhead Thumb */}
        <div
          className="absolute top-4 -translate-x-1/2 pointer-events-none z-20 transition-all duration-75 flex flex-col items-center"
          style={{ left: `${time}%` }}
        >
          <div className="bg-orange-500 text-slate-950 text-[10px] font-mono font-black px-1.5 py-0.5 rounded shadow border border-orange-400 whitespace-nowrap mb-0.5">
            {time}ms
          </div>
          <div className="w-3 h-5 bg-orange-400 border-2 border-white rounded-full shadow-lg" />
        </div>

        {/* Event Markers along Timeline */}
        {markers.map((m) => {
          if (m.ms > 100) return null;
          const leftPercent = Math.min(95, Math.max(5, m.ms));

          return (
            <div
              key={m.id}
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10"
              style={{ left: `${leftPercent}%` }}
              onMouseEnter={() => setHoveredMarker(m.id)}
              onMouseLeave={() => setHoveredMarker(null)}
              onClick={() => { setTime(m.ms); setIsAutoPlaying(false); }}
            >
              {/* Top Label & Hover Chip (≥11px) */}
              <div className={cn(
                "text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border shadow transition-all whitespace-nowrap mb-1",
                m.color,
                hoveredMarker === m.id ? "scale-110 shadow-lg z-40" : "opacity-90"
              )}>
                {m.label}
              </div>

              {/* Marker Tick Line */}
              <div className={cn(
                "w-0.5 h-6 transition-all",
                m.active ? "bg-white" : "bg-slate-700"
              )} />

              {/* Subtitle ms badge (≥11px) */}
              <span className="text-[11px] font-mono text-slate-300 font-bold mt-1">
                {m.ms}ms
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Scrubber Status Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>
            {time < 10 
              ? "State: Normal Load Current (150A)" 
              : time <= clearedMs 
              ? `State: Fault In Progress (${(time - 10)}ms active)` 
              : "State: Breaker Tripped & Fault Cleared"}
          </span>
        </span>
        <span className="text-slate-300 font-bold">
          {protectionSpeed === 'fast' ? "Fast Trip (14ms)" : protectionSpeed === 'delayed' ? "Delayed (76ms)" : "No Trip (Fail)"}
        </span>
      </div>
    </div>
  );
}
