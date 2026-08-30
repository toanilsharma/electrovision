import React, { useMemo } from 'react';
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export interface CoordinationChartCardProps {
  time: number; // 0 to 100ms
  faultCurrentKA: number; // e.g. 15.34 kA or 12.44 kA
  faultCurrentA: number; // e.g. 15340 A
  protectionSpeed: 'fast' | 'delayed' | 'fail';
  tRelayMs: number; // 5ms or 67ms
  tBreakerMs: number; // 6ms
  tArcMs: number; // 3ms
  tTotalMs: number; // 14ms or 76ms
  cableSizeMm2: number; // 16 mm²
  withstandEnergyA2s: number; // 3385600 A²s
  withstandEnergyKA2s: number; // 3.39 kA²s
  letThroughEnergyKA2s: number; // kA²s
  tripped: boolean;
  className?: string;
}

export function CoordinationChartCard({
  time,
  faultCurrentKA,
  faultCurrentA,
  protectionSpeed,
  tRelayMs,
  tBreakerMs,
  tArcMs,
  tTotalMs,
  cableSizeMm2,
  withstandEnergyA2s,
  withstandEnergyKA2s,
  letThroughEnergyKA2s,
  tripped,
  className
}: CoordinationChartCardProps) {

  // Calculate Cable Thermal Damage Time at current fault current Ik
  // t_damage (s) = (k²S²) / Ik²
  const tDamageMs = useMemo(() => {
    if (faultCurrentA <= 0) return 100;
    const sec = withstandEnergyA2s / Math.pow(faultCurrentA, 2);
    return sec * 1000; // ms
  }, [withstandEnergyA2s, faultCurrentA]);

  // Calculate Margin & Verdict
  const { verdictLabel, verdictColor, marginMs, ratioExceeded } = useMemo(() => {
    if (protectionSpeed === 'fail') {
      return {
        verdictLabel: 'NO CLEARING — CABLE MELTS',
        verdictColor: 'bg-red-650 text-white border-red-500 font-black animate-pulse',
        marginMs: -Infinity,
        ratioExceeded: Infinity
      };
    }

    const margin = tDamageMs - tTotalMs;
    if (tTotalMs <= tDamageMs) {
      return {
        verdictLabel: `MARGIN +${margin.toFixed(1)}ms SAFE`,
        verdictColor: 'bg-green-950 text-green-300 border-green-500 font-bold',
        marginMs: margin,
        ratioExceeded: 1.0
      };
    } else {
      const ratio = tTotalMs / tDamageMs;
      return {
        verdictLabel: `EXCEEDED ×${ratio.toFixed(1)} — CABLE MELTS`,
        verdictColor: 'bg-red-950 text-red-300 border-red-500 font-black animate-pulse',
        marginMs: margin,
        ratioExceeded: ratio
      };
    }
  }, [tDamageMs, tTotalMs, protectionSpeed]);

  // SVG Chart Dimensions & Log Scaling Helpers
  const width = 500;
  const height = 260;
  const margin = { top: 25, right: 30, bottom: 40, left: 55 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  // Log X-axis: Current from 1 kA to 50 kA
  const minI = 1;
  const maxI = 50;
  const logMinI = Math.log10(minI);
  const logMaxI = Math.log10(maxI);

  const getX = (iKA: number) => {
    const logVal = Math.log10(Math.max(minI, Math.min(maxI, iKA)));
    return margin.left + ((logVal - logMinI) / (logMaxI - logMinI)) * chartW;
  };

  // Log Y-axis: Time from 1 ms to 10,000 ms (0.001s to 10s)
  const minT = 1; // 1 ms
  const maxT = 10000; // 10,000 ms
  const logMinT = Math.log10(minT);
  const logMaxT = Math.log10(maxT);

  const getY = (tMs: number) => {
    const logVal = Math.log10(Math.max(minT, Math.min(maxT, tMs)));
    // Inverse Y (10000ms at top, 1ms at bottom)
    return margin.top + (1 - (logVal - logMinT) / (logMaxT - logMinT)) * chartH;
  };

  // Generate Cable Thermal Damage Curve Path points (t = k²S² / I²)
  const damageCurvePath = useMemo(() => {
    const points: string[] = [];
    for (let iKA = 1; iKA <= 50; iKA += 0.5) {
      const iA = iKA * 1000;
      const sec = withstandEnergyA2s / Math.pow(iA, 2);
      const tMs = sec * 1000;
      const x = getX(iKA);
      const y = getY(tMs);
      points.push(`${iKA === 1 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  }, [withstandEnergyA2s]);

  // Generate Relay 50/51 Protection Characteristic Curve Path
  const relayCurvePath = useMemo(() => {
    const relayT = tTotalMs === Infinity ? 9000 : tTotalMs;
    // Step curve: high time at low current, steps down to clearing time at pickup
    const xPickup = getX(2); // pickup ~2kA
    const xEnd = getX(50);
    const yHigh = getY(5000);
    const yTrip = getY(relayT);

    return `M ${margin.left},${yHigh} L ${xPickup},${yHigh} L ${xPickup},${yTrip} L ${xEnd},${yTrip}`;
  }, [tTotalMs]);

  // Animated Operating Point Position
  const activeFaultX = getX(faultCurrentKA);
  let activeFaultY = getY(1); // default bottom

  if (time > 10) {
    if (tripped) {
      activeFaultY = getY(tTotalMs);
    } else {
      const activeMs = (time - 10);
      activeFaultY = getY(Math.min(10000, activeMs * 80));
    }
  }

  return (
    <div className={cn("p-4 rounded-xl bg-slate-900 border border-slate-750 shadow-xl flex flex-col gap-3", className)}>
      {/* Card Header & Verdict Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Log-Log Protection Coordination Chart (IEC 60909)
          </span>
        </div>

        {/* Verdict Chip */}
        <div className={cn("px-3 py-1 rounded-lg text-xs font-mono border shadow flex items-center gap-1.5", verdictColor)}>
          {tTotalMs <= tDamageMs && protectionSpeed !== 'fail' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span>{verdictLabel}</span>
        </div>
      </div>

      {/* SVG Log-Log Plot */}
      <div className="relative w-full h-[260px] flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800 p-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Axis Grid Lines */}
          {/* Y-Axis Log Ticks (1ms, 10ms, 100ms, 1000ms, 10000ms) */}
          {[1, 10, 100, 1000, 10000].map(tVal => {
            const y = getY(tVal);
            return (
              <g key={tVal}>
                <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <text x={margin.left - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">
                  {tVal >= 1000 ? `${tVal/1000}s` : `${tVal}ms`}
                </text>
              </g>
            );
          })}

          {/* X-Axis Log Ticks (1kA, 2kA, 5kA, 10kA, 20kA, 50kA) */}
          {[1, 2, 5, 10, 20, 50].map(iVal => {
            const x = getX(iVal);
            return (
              <g key={iVal}>
                <line x1={x} y1={margin.top} x2={x} y2={height - margin.bottom} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <text x={x} y={height - margin.bottom + 16} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                  {iVal}kA
                </text>
              </g>
            );
          })}

          {/* Axis Titles */}
          <text x={width / 2} y={height - 6} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">
            Fault Current Ik (kA) [Log Scale]
          </text>
          <text x={14} y={height / 2} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace" transform={`rotate(-90 14 ${height/2})`}>
            Time t (ms) [Log Scale]
          </text>

          {/* CABLE THERMAL DAMAGE CURVE (t = k²S² / I²) */}
          <path
            d={damageCurvePath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
          <text x={getX(35)} y={getY(withstandEnergyA2s / Math.pow(35000, 2) * 1000) - 8} fill="#ef4444" fontSize="10" fontWeight="bold" fontFamily="monospace">
            Cable Damage (k²S²)
          </text>

          {/* RELAY 50/51 PROTECTION CURVE */}
          {protectionSpeed !== 'fail' && (
            <>
              <path
                d={relayCurvePath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <text x={getX(25)} y={getY(tTotalMs) - 8} fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                Relay 51 Clearing ({tTotalMs}ms)
              </text>
            </>
          )}

          {/* VERTICAL FAULT CURRENT LINE (at Ik) */}
          <line
            x1={activeFaultX}
            y1={margin.top}
            x2={activeFaultX}
            y2={height - margin.bottom}
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <text x={activeFaultX} y={margin.top - 6} textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">
            Ik = {faultCurrentKA.toFixed(1)}kA
          </text>

          {/* SHADED MARGIN REGION BETWEEN CLEARING AND CABLE DAMAGE */}
          {protectionSpeed !== 'fail' && (
            <g>
              {/* Intersection Point with Cable Damage Curve */}
              <circle cx={activeFaultX} cy={getY(tDamageMs)} r="4" fill="#ef4444" />
              {/* Intersection Point with Clearing Line */}
              <circle cx={activeFaultX} cy={getY(tTotalMs)} r="4" fill="#38bdf8" />

              {/* Shaded Vertical Margin Bar */}
              <line
                x1={activeFaultX}
                y1={getY(tDamageMs)}
                x2={activeFaultX}
                y2={getY(tTotalMs)}
                stroke={tTotalMs <= tDamageMs ? "#10b981" : "#ef4444"}
                strokeWidth="6"
                opacity="0.6"
              />
            </g>
          )}

          {/* ANIMATED OPERATING POINT */}
          <motion.circle
            cx={activeFaultX}
            cy={activeFaultY}
            r="6"
            fill="#ffffff"
            stroke="#f59e0b"
            strokeWidth="3"
            style={{ filter: 'drop-shadow(0 0 8px #f59e0b)' }}
          />

          {/* NO CLEARING FLAG FOR NO TRIP */}
          {protectionSpeed === 'fail' && time >= 10 && (
            <g transform={`translate(${activeFaultX - 45}, ${margin.top + 10})`}>
              <rect x="0" y="0" width="90" height="20" rx="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
              <text x="45" y="14" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black" fontFamily="monospace" className="animate-pulse">
                NO CLEARING ⚠️
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Teaching Legend & Explanation Note (Acceptance Criteria) */}
      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1 font-sans">
        <div className="flex items-center justify-between font-bold border-b border-slate-800 pb-1">
          <span className="text-cyan-400">💡 Trainee Protection Lesson:</span>
          <span className="text-slate-400 font-mono text-[11px]">
            Cable Limit @ {faultCurrentKA.toFixed(1)}kA = {tDamageMs.toFixed(1)}ms
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          At <strong className="text-orange-400">{faultCurrentKA.toFixed(1)} kA</strong>, the cable thermal limit is <strong className="text-red-400">{tDamageMs.toFixed(1)} ms</strong>. 
          <strong className="text-emerald-400"> Fast Trip (14ms)</strong> clears the fault <em className="text-slate-200">before</em> the red cable damage curve is hit (PASS). 
          <strong className="text-red-400"> Delayed Trip (76ms)</strong> exceeds the withstand limit by <strong className="text-red-400">{(76 / tDamageMs).toFixed(1)}×</strong>, causing total insulation meltdown!
        </p>
      </div>
    </div>
  );
}
