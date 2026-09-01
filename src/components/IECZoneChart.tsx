import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { classifyIECZone, getC3Threshold } from '../utils/iec60479Zones';
import { Activity, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface IECZoneChartProps {
  currentMA: number;
  durationMs: number;
  isSimulating: boolean;
  shockPath?: 'hand-to-hand' | 'hand-to-foot' | 'none';
  className?: string;
}

export const IECZoneChart: React.FC<IECZoneChartProps> = ({
  currentMA,
  durationMs,
  isSimulating,
  shockPath = 'hand-to-foot',
  className
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG Canvas dimensions & Margins
  const width = 420;
  const height = 240;
  const margin = { top: 25, right: 20, bottom: 35, left: 45 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  // Log-Log mapping limits
  const minT = 0.01; // 10 ms
  const maxT = 10.0; // 10,000 ms
  const minI = 0.1;  // 0.1 mA
  const maxI = 10000; // 10,000 mA (10 A)

  const logMinT = Math.log10(minT);
  const logMaxT = Math.log10(maxT);
  const logMinI = Math.log10(minI);
  const logMaxI = Math.log10(maxI);

  const getX = (tSec: number) => {
    const clampedT = Math.max(minT, Math.min(maxT, tSec));
    const logT = Math.log10(clampedT);
    return margin.left + ((logT - logMinT) / (logMaxT - logMinT)) * chartW;
  };

  const getY = (iMA: number) => {
    const clampedI = Math.max(minI, Math.min(maxI, iMA));
    const logI = Math.log10(clampedI);
    return height - margin.bottom - ((logI - logMinI) / (logMaxI - logMinI)) * chartH;
  };

  // Inverse log-log mapping (pixel X,Y -> tSec, iMA)
  const getValFromX = (pixelX: number) => {
    const clampedX = Math.max(margin.left, Math.min(width - margin.right, pixelX));
    const frac = (clampedX - margin.left) / chartW;
    const logT = logMinT + frac * (logMaxT - logMinT);
    return Math.pow(10, logT);
  };

  const getValFromY = (pixelY: number) => {
    const clampedY = Math.max(margin.top, Math.min(height - margin.bottom, pixelY));
    const frac = (height - margin.bottom - clampedY) / chartH;
    const logI = logMinI + frac * (logMaxI - logMinI);
    return Math.pow(10, logI);
  };

  // Interactive Hover State
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number; tSec: number; iMA: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;

    if (svgX >= margin.left && svgX <= width - margin.right && svgY >= margin.top && svgY <= height - margin.bottom) {
      const tSec = getValFromX(svgX);
      const iMA = getValFromY(svgY);
      setHoverPos({ x: svgX, y: svgY, tSec, iMA });
    } else {
      setHoverPos(null);
    }
  };

  const handleMouseLeave = () => setHoverPos(null);

  // Heart current factor (F_H): Hand-to-Hand = 0.4, Left-Hand-to-Feet = 1.0
  const currentPathKey = shockPath === 'hand-to-hand' ? 'hand-to-hand' : shockPath === 'none' ? 'none' : 'hand-to-foot';
  const durationSec = Math.max(0.01, durationMs / 1000);
  const currentZone = classifyIECZone(currentMA, durationSec, currentPathKey);
  const effectiveHeartCurrent = currentZone.effectiveHeartCurrent;
  const heartFactor = currentZone.heartCurrentFactor;

  // Hover zone classification
  const hoverZone = hoverPos ? classifyIECZone(hoverPos.iMA, hoverPos.tSec, currentPathKey) : null;

  // Generate c3 curve path points (I = 116 / sqrt(t))
  const c1Y = getY(0.5);
  const c2Y = getY(10);

  const c3Points = useMemo(() => {
    const pts = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = Math.pow(10, logMinT + (i / steps) * (logMaxT - logMinT));
      const c3Val = getC3Threshold(t);
      pts.push(`${getX(t).toFixed(1)},${getY(c3Val).toFixed(1)}`);
    }
    return pts.join(' L ');
  }, []);

  const c41Points = useMemo(() => {
    const pts = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = Math.pow(10, logMinT + (i / steps) * (logMaxT - logMinT));
      const c3Val = getC3Threshold(t) * 1.5;
      pts.push(`${getX(t).toFixed(1)},${getY(c3Val).toFixed(1)}`);
    }
    return pts.join(' L ');
  }, []);

  const c42Points = useMemo(() => {
    const pts = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = Math.pow(10, logMinT + (i / steps) * (logMaxT - logMinT));
      const c3Val = getC3Threshold(t) * 2.5;
      pts.push(`${getX(t).toFixed(1)},${getY(c3Val).toFixed(1)}`);
    }
    return pts.join(' L ');
  }, []);

  // Live operating point coordinates
  const tracerX = getX(durationSec);
  const tracerY = getY(effectiveHeartCurrent > 0 ? effectiveHeartCurrent : 0.1);

  // Ticks
  const tTicks = [0.01, 0.1, 1.0, 10.0];
  const iTicks = [0.1, 1.0, 10.0, 100.0, 1000.0, 10000.0];

  return (
    <div className={cn("w-full bg-slate-950/95 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-2 shadow-2xl select-none", className)}>
      {/* Header with Zone Badge */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-black tracking-wider uppercase text-sky-300 font-sans">
            IEC 60479-1 Time/Current Zones
          </span>
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shadow-md", currentZone.badgeStyle)}>
          {currentZone.zone} ({currentZone.vfibProbability} V-Fib Risk)
        </span>
      </div>

      {/* Log-Log Canvas / SVG Zone Chart */}
      <div className="relative w-full aspect-[16/9] max-h-[220px] bg-slate-900/90 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center p-1 group cursor-crosshair">
        
        {/* Hover Coordinate HUD Overlay */}
        <AnimatePresence>
          {hoverPos && hoverZone && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 left-2 z-20 bg-slate-950/98 border-2 border-amber-400/90 p-2 rounded-xl shadow-2xl text-[9.5px] font-mono flex flex-col gap-1 pointer-events-none max-w-[280px]"
            >
              <div className="flex items-center justify-between gap-2 border-b border-amber-400/30 pb-1">
                <span className="text-amber-300 font-bold">
                  ⏱️ {hoverPos.tSec >= 1 ? `${hoverPos.tSec.toFixed(2)}s` : `${(hoverPos.tSec * 1000).toFixed(0)}ms`} | ⚡ {hoverPos.iMA.toFixed(1)}mA
                </span>
                <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase border", hoverZone.badgeStyle)}>
                  {hoverZone.zone}
                </span>
              </div>
              <p className="text-[9px] font-sans font-bold text-slate-100 leading-tight">
                <span className="text-amber-300">⚡ Impact:</span> {hoverZone.shortImpact}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <svg 
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full drop-shadow"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Zone Fill Gradients */}
            <linearGradient id="ac1Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="ac2Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="ac3Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="ac4Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {tTicks.map((t) => (
            <line
              key={`grid-t-${t}`}
              x1={getX(t)}
              y1={margin.top}
              x2={getX(t)}
              y2={height - margin.bottom}
              stroke="#334155"
              strokeDasharray="2,2"
              strokeWidth="0.8"
            />
          ))}
          {iTicks.map((i) => (
            <line
              key={`grid-i-${i}`}
              x1={margin.left}
              y1={getY(i)}
              x2={width - margin.right}
              y2={getY(i)}
              stroke="#334155"
              strokeDasharray="2,2"
              strokeWidth="0.8"
            />
          ))}

          {/* Zone Areas (Shaded Boundaries) */}
          {/* AC-1: Area below c1 (0.5 mA) */}
          <rect
            x={margin.left}
            y={c1Y}
            width={chartW}
            height={height - margin.bottom - c1Y}
            fill="url(#ac1Grad)"
          />
          {/* AC-2: Area between c1 (0.5 mA) and c2 (10 mA) */}
          <rect
            x={margin.left}
            y={c2Y}
            width={chartW}
            height={c1Y - c2Y}
            fill="url(#ac2Grad)"
          />
          {/* AC-3: Area between c2 (10 mA) and c3 curve */}
          <path
            d={`M ${margin.left},${c2Y} L ${width - margin.right},${c2Y} L ${c3Points} L ${margin.left},${getY(getC3Threshold(minT))} Z`}
            fill="url(#ac3Grad)"
          />
          {/* AC-4: Area above c3 curve */}
          <path
            d={`M ${margin.left},${margin.top} L ${width - margin.right},${margin.top} L ${c3Points} L ${margin.left},${getY(getC3Threshold(minT))} Z`}
            fill="url(#ac4Grad)"
          />

          {/* Boundary Curves */}
          {/* Curve c1 (Perception 0.5 mA) */}
          <line
            x1={margin.left}
            y1={c1Y}
            x2={width - margin.right}
            y2={c1Y}
            stroke="#10b981"
            strokeWidth="1.8"
          />
          <text x={margin.left + 5} y={c1Y - 4} fill="#10b981" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
            c1: 0.5 mA (Perception)
          </text>

          {/* Curve c2 (Let-Go 10 mA) */}
          <line
            x1={margin.left}
            y1={c2Y}
            x2={width - margin.right}
            y2={c2Y}
            stroke="#eab308"
            strokeWidth="1.8"
          />
          <text x={margin.left + 5} y={c2Y - 4} fill="#eab308" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
            c2: 10 mA (Let-Go)
          </text>

          {/* Curve c3 (Organic Damage / V-Fib Boundary) */}
          <path d={`M ${c3Points}`} fill="none" stroke="#ef4444" strokeWidth="2.2" />
          <text x={getX(0.5)} y={getY(getC3Threshold(0.5)) - 5} fill="#ef4444" fontSize="8" fontWeight="black" fontFamily="sans-serif">
            c3 (V-Fib Boundary)
          </text>

          {/* Curves 1.5*c3 and 2.5*c3 (sub-bands 4.1/4.2/4.3) */}
          <path d={`M ${c41Points}`} fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" />
          <path d={`M ${c42Points}`} fill="none" stroke="#991b1b" strokeWidth="1" strokeDasharray="3,3" />

          {/* Interactive Mouse Hover Crosshair */}
          {hoverPos && (
            <g className="pointer-events-none">
              <line x1={hoverPos.x} y1={margin.top} x2={hoverPos.x} y2={height - margin.bottom} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
              <line x1={margin.left} y1={hoverPos.y} x2={width - margin.right} y2={hoverPos.y} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx={hoverPos.x} cy={hoverPos.y} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {/* Axes Lines */}
          <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#94a3b8" strokeWidth="1.5" />
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#94a3b8" strokeWidth="1.5" />

          {/* X Axis Ticks & Labels */}
          {tTicks.map((t) => (
            <g key={`xtick-${t}`} transform={`translate(${getX(t)}, ${height - margin.bottom})`}>
              <line y2="4" stroke="#94a3b8" strokeWidth="1" />
              <text y="14" fill="#94a3b8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                {t >= 1 ? `${t}s` : `${t * 1000}ms`}
              </text>
            </g>
          ))}

          {/* Y Axis Ticks & Labels */}
          {iTicks.map((i) => (
            <g key={`ytick-${i}`} transform={`translate(${margin.left}, ${getY(i)})`}>
              <line x2="-4" stroke="#94a3b8" strokeWidth="1" />
              <text x="-6" y="2.5" fill="#94a3b8" fontSize="7.5" fontWeight="bold" textAnchor="end" fontFamily="sans-serif">
                {i >= 1000 ? `${i / 1000}A` : `${i}mA`}
              </text>
            </g>
          ))}

          {/* Live Operating Point Tracer Dot & Trail */}
          {(isSimulating || effectiveHeartCurrent > 0) && (
            <g>
              {/* Vertical & Horizontal Crosshairs */}
              <line x1={tracerX} y1={margin.top} x2={tracerX} y2={height - margin.bottom} stroke={currentZone.color} strokeWidth="1" strokeDasharray="2,2" />
              <line x1={margin.left} y1={tracerY} x2={width - margin.right} y2={tracerY} stroke={currentZone.color} strokeWidth="1" strokeDasharray="2,2" />

              {/* Glowing Tracer Dot */}
              <motion.circle
                cx={tracerX}
                cy={tracerY}
                r="6"
                fill={currentZone.color}
                stroke="#ffffff"
                strokeWidth="2"
                animate={isSimulating ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, repeat: isSimulating ? Infinity : 0 }}
                style={{ filter: `drop-shadow(0 0 8px ${currentZone.color})` }}
              />
            </g>
          )}
        </svg>
      </div>

      {/* 6-Zone Status Strip with Live Active Highlight */}
      <div className="grid grid-cols-6 gap-1 shrink-0 pt-0.5">
        {(['AC-1', 'AC-2', 'AC-3', 'AC-4.1', 'AC-4.2', 'AC-4.3'] as const).map((z) => {
          const isActive = (hoverZone ? hoverZone.zone : currentZone.zone) === z;
          return (
            <div
              key={z}
              className={cn(
                "py-1 px-0.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center select-none",
                isActive
                  ? "bg-slate-900 border-2 border-white shadow-lg ring-1 ring-white/50 scale-105 z-10"
                  : "bg-slate-950/60 border-slate-800 opacity-60"
              )}
            >
              <span className={cn(
                "text-[9.5px] font-mono font-black",
                isActive ? "text-white" : "text-slate-400"
              )}>
                {z}
              </span>
              <span className="text-[7.5px] font-sans font-bold text-slate-400 leading-none mt-0.5">
                {z === 'AC-1' ? '<0.5mA' : z === 'AC-2' ? '≤10mA' : z === 'AC-3' ? 'Let-Go' : z === 'AC-4.1' ? '<5% VF' : z === 'AC-4.2' ? '<50% VF' : '>50% VF'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Explanatory Banner Below Chart with Standards-Accurate Short Impact */}
      <div className={cn("p-2 rounded-lg border text-left flex items-center justify-between gap-2 transition-all shadow-md", hoverZone ? hoverZone.badgeStyle : currentZone.badgeStyle)}>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-black uppercase tracking-wider font-sans truncate">
            {hoverZone ? hoverZone.label : currentZone.label}
          </span>
          <span className="text-[10px] font-extrabold leading-tight opacity-95 mt-0.5 truncate text-amber-200">
            ⚡ {hoverZone ? hoverZone.shortImpact : currentZone.shortImpact}
          </span>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-white shadow">
            {hoverPos ? `Hover: ${hoverPos.iMA.toFixed(1)} mA` : `I_heart: ${effectiveHeartCurrent.toFixed(1)} mA`}
          </span>
          <span className="text-[9px] font-mono text-slate-400 mt-0.5">
            {`F_H=${heartFactor.toFixed(1)} (I_body=${currentMA.toFixed(1)}mA)`}
          </span>
        </div>
      </div>
    </div>
  );
};
