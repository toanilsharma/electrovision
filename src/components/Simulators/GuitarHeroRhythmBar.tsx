import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy, Flame } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { evaluateRhythmTiming, RhythmTimingResult } from '@/src/utils/demographicPhysics';

interface GuitarHeroRhythmBarProps {
  targetBpm?: number;
  lastStrokeTime: number; // timestamp when user compressed
  className?: string;
}

interface FallingBeat {
  id: number;
  spawnTime: number; // timestamp when note was spawned
  targetHitTime: number; // timestamp when note reaches target strike line
  hit: boolean;
}

export function GuitarHeroRhythmBar({
  targetBpm = 110,
  lastStrokeTime,
  className,
}: GuitarHeroRhythmBarProps) {
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [feedback, setFeedback] = useState<RhythmTimingResult | null>(null);
  const [strikeGlow, setStrikeGlow] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const beatsRef = useRef<FallingBeat[]>([]);
  const beatCounterRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const [, setTick] = useState<number>(0);

  const BEAT_INTERVAL_MS = Math.round(60000 / targetBpm); // ~545ms
  const TRAVEL_TIME_MS = 1400; // time from top spawn to target line

  // Spawner loop: creates a new beat note every BEAT_INTERVAL_MS
  useEffect(() => {
    const spawner = setInterval(() => {
      const now = performance.now();
      const newBeat: FallingBeat = {
        id: beatCounterRef.current++,
        spawnTime: now,
        targetHitTime: now + TRAVEL_TIME_MS,
        hit: false,
      };
      beatsRef.current.push(newBeat);

      // Clean up old beats that passed the line by > 300ms
      beatsRef.current = beatsRef.current.filter(b => now - b.targetHitTime < 400);
    }, BEAT_INTERVAL_MS);

    return () => clearInterval(spawner);
  }, [BEAT_INTERVAL_MS, TRAVEL_TIME_MS]);

  // RequestAnimationFrame update loop to re-render falling positions smoothly
  useEffect(() => {
    const loop = () => {
      setTick(t => (t + 1) % 1000);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // When user executes a compression stroke, find the closest active beat to strike line
  const lastProcessedStrokeRef = useRef<number>(0);
  useEffect(() => {
    if (!lastStrokeTime || lastStrokeTime === lastProcessedStrokeRef.current) return;
    lastProcessedStrokeRef.current = lastStrokeTime;

    const now = performance.now();
    // Find unhit beat closest to targetHitTime
    let closestBeat: FallingBeat | null = null;
    let minDelta = Infinity;

    for (const b of beatsRef.current) {
      if (b.hit) continue;
      const delta = now - b.targetHitTime;
      if (Math.abs(delta) < Math.abs(minDelta)) {
        minDelta = delta;
        closestBeat = b;
      }
    }

    if (closestBeat && Math.abs(minDelta) <= 220) {
      closestBeat.hit = true;
      const result = evaluateRhythmTiming(minDelta);
      setFeedback(result);
      setScore(s => s + result.score * Math.max(1, Math.floor(combo / 5)));

      if (result.accuracy === 'perfect' || result.accuracy === 'good') {
        setCombo(c => {
          const next = c + 1;
          setMaxCombo(m => Math.max(m, next));
          return next;
        });
      } else {
        setCombo(0);
      }

      setStrikeGlow(true);
      setTimeout(() => setStrikeGlow(false), 120);
    }
  }, [lastStrokeTime, combo]);

  const now = performance.now();

  return (
    <div className={cn("rounded-xl border border-slate-800 bg-slate-950 p-2 flex flex-col gap-1.5 relative overflow-hidden font-mono shadow-xl", className)}>
      {/* Top Header: Target BPM & Combo Meter */}
      <div className="flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="font-black text-slate-200 text-[11px] uppercase tracking-wider">
            110 BPM RHYTHM HIGHWAY
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          {combo >= 3 && (
            <div className="flex items-center gap-1 text-orange-400 font-black animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-orange-500" />
              <span>{combo}x STREAK</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-slate-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-black tabular-nums">{score}</span>
          </div>
        </div>
      </div>

      {/* Falling Runway (Horizontal track across screen) */}
      <div
        ref={containerRef}
        className="relative w-full h-11 rounded-lg bg-slate-900/90 border border-slate-800 overflow-hidden flex items-center"
      >
        {/* Track Grid Centerguide */}
        <div className="absolute inset-x-0 h-0.5 bg-slate-800/80 top-1/2 -translate-y-1/2" />

        {/* Glowing Target Strike Zone Line at 80% of width */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-4 rounded z-10 transition-all flex items-center justify-center -translate-x-1/2",
            strikeGlow
              ? "bg-amber-400/40 border-2 border-amber-300 shadow-[0_0_15px_#f59e0b]"
              : "border-2 border-dashed border-emerald-400/80 bg-emerald-500/10"
          )}
          style={{ left: '80%' }}
        >
          <div className="w-1 h-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
        </div>

        {/* Falling Beat Notes (Moving Left to Right towards the 80% Strike Line) */}
        {beatsRef.current.map(beat => {
          const progress = (now - beat.spawnTime) / TRAVEL_TIME_MS; // 0.0 at spawn, 1.0 at strike line
          const leftPercent = progress * 80.0;

          if (leftPercent < -5 || leftPercent > 105 || beat.hit) return null;

          return (
            <div
              key={beat.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center pointer-events-none transition-transform"
              style={{ left: `${leftPercent}%` }}
            >
              <div className="w-4 h-7 rounded bg-gradient-to-r from-red-500 to-amber-400 border border-white shadow-[0_0_8px_#f59e0b] animate-pulse" />
            </div>
          );
        })}
      </div>

      {/* Live Timing Feedback Pill */}
      <div className="flex items-center justify-between text-[9px] text-slate-400">
        <div>
          {feedback ? (
            <span
              className={cn(
                "font-black tracking-wider uppercase px-1.5 py-0.5 rounded",
                feedback.accuracy === 'perfect'
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500"
                  : feedback.accuracy === 'good'
                  ? "bg-sky-950 text-sky-400 border border-sky-500"
                  : "bg-amber-950 text-amber-400 border border-amber-500"
              )}
            >
              {feedback.feedback} ({feedback.deltaMs > 0 ? `+${Math.round(feedback.deltaMs)}ms` : `${Math.round(feedback.deltaMs)}ms`})
            </span>
          ) : (
            <span>Strike down when note aligns with green line!</span>
          )}
        </div>

        <div className="text-slate-500">
          Target: <strong className="text-slate-300">100–120 BPM</strong> (Stayin&apos; Alive)
        </div>
      </div>
    </div>
  );
}
