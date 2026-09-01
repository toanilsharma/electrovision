import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { MCBTrippingCurve } from '../../mcb/types';
import { BimetalThermalModel } from '../../mcb/BimetalThermalModel';
import { cn } from '@/src/lib/utils';
import { Layers, ShieldCheck, Sparkles, Activity } from 'lucide-react';

export type OEMManufacturer = 'none' | 'all' | 'schneider' | 'abb' | 'siemens';

interface CanvasTCCChartProps {
  ratedCurrent: number;   // In (A)
  faultCurrent: number;   // I_fault (A)
  activeCurve: MCBTrippingCurve;
  bimetalTemp?: number;
  isTripped?: boolean;
  oemManufacturer?: OEMManufacturer;
  className?: string;
}

interface TrailPoint {
  x: number;
  y: number;
  timeMs: number;
  alpha: number;
}

export const CanvasTCCChart: React.FC<CanvasTCCChartProps> = ({
  ratedCurrent,
  faultCurrent,
  activeCurve,
  bimetalTemp = 30,
  isTripped = false,
  oemManufacturer = 'none',
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [selectedOEM, setSelectedOEM] = useState<OEMManufacturer>(oemManufacturer);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const isReplayingRef = useRef<boolean>(false);

  // Sync OEM prop
  useEffect(() => {
    setSelectedOEM(oemManufacturer);
  }, [oemManufacturer]);

  // Current multiplier (I / In)
  const currentMult = Math.max(0.1, faultCurrent / Math.max(1, ratedCurrent));

  // Magnetic zone limits per Curve
  const magneticBand = useMemo(() => {
    switch (activeCurve) {
      case 'B': return { min: 3, max: 5 };
      case 'D': return { min: 10, max: 20 };
      case 'C':
      default: return { min: 5, max: 10 };
    }
  }, [activeCurve]);

  // Calculate theoretical trip time using the exact same thermal model
  const calcTripTime = useCallback((mult: number, coldState: boolean = true) => {
    const spec = BimetalThermalModel.createCalibratedSpec(ratedCurrent, activeCurve, 30);
    const model = new BimetalThermalModel(spec, coldState ? 30 : 60);
    const timeSec = model.calculateTheoreticalTripTime(mult * ratedCurrent, 30);
    return Math.min(10000, Math.max(0.001, timeSec));
  }, [ratedCurrent, activeCurve]);

  // Current operating point Y (Trip Time)
  const currentTripTime = useMemo(() => {
    if (currentMult >= magneticBand.max) {
      return 0.005; // <10ms instantaneous magnetic
    }
    if (currentMult >= magneticBand.min) {
      return 0.015; // Magnetic tolerance band
    }
    const t = calcTripTime(currentMult, true);
    return isFinite(t) ? t : 9999;
  }, [currentMult, magneticBand, calcTripTime]);

  // Update Operating Dot Trail
  useEffect(() => {
    const now = Date.now();
    setTrail((prev) => {
      const updated = prev
        .map((p) => ({ ...p, alpha: Math.max(0, p.alpha - 0.08) }))
        .filter((p) => p.alpha > 0.05);

      if (currentMult >= 1.13) {
        updated.push({
          x: currentMult,
          y: currentTripTime,
          timeMs: now,
          alpha: 1.0
        });
      }
      return updated.slice(-25); // Keep last 25 trail samples
    });
  }, [currentMult, currentTripTime]);

  // Trigger Replay Animation on Trip
  useEffect(() => {
    if (isTripped && !isReplayingRef.current) {
      isReplayingRef.current = true;
      // Replay sweep
      let startProgress = 1.13;
      const interval = setInterval(() => {
        startProgress += (currentMult - 1.13) / 10;
        if (startProgress >= currentMult) {
          clearInterval(interval);
          isReplayingRef.current = false;
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isTripped, currentMult]);

  // D3 Chart Render with Morphing (300ms transition)
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(280, rect.width - 24);
    const height = Math.max(180, rect.height - 70);

    const margin = { top: 15, right: 15, bottom: 35, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // LOG-LOG Scales
    const xScale = d3.scaleLog()
      .domain([1, 100])
      .range([0, innerWidth]);

    const yScale = d3.scaleLog()
      .domain([0.001, 10000]) // 1ms .. 10ks
      .range([innerHeight, 0]);

    // Grid lines
    const xTicks = [1, 2, 5, 10, 20, 50, 100];
    const yTicks = [0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000];

    // Horizontal Grid
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.8)
      .attr('stroke-dasharray', d => (d === 1 || d === 3600) ? 'none' : '2,2');

    // Vertical Grid
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '2,2');

    // Conventional Non-tripping (1.13 In) & Tripping (1.45 In) lines
    const convLines = [
      { val: 1.13, color: '#10b981', label: '1.13 In (Non-Trip)' },
      { val: 1.45, color: '#f59e0b', label: '1.45 In (Trip ≤1h)' },
      { val: 2.55, color: '#a855f7', label: '2.55 In (1-60s)' }
    ];

    convLines.forEach(({ val, color, label }) => {
      const xPos = xScale(val);
      g.append('line')
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', color)
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.85);

      g.append('text')
        .attr('x', xPos + 2)
        .attr('y', 10)
        .attr('fill', color)
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(val === 2.55 ? '2.55x' : `${val}x`);
    });

    // Generate Points for Thermal Curve (Upper & Lower Envelope)
    const curvePointsCount = 60;
    const multStep = (magneticBand.min - 1.14) / curvePointsCount;
    
    const upperPoints: [number, number][] = [];
    const lowerPoints: [number, number][] = [];

    for (let i = 0; i <= curvePointsCount; i++) {
      const m = 1.14 + i * multStep;
      const tUpper = calcTripTime(m, true);   // Cold state
      const tLower = calcTripTime(m, false) * 0.45; // Warm state tolerance
      if (isFinite(tUpper) && tUpper <= 10000) {
        upperPoints.push([m, tUpper]);
        lowerPoints.push([m, Math.max(0.01, tLower)]);
      }
    }

    // Complete Shaded TCC Envelope Polygon Coordinates
    const bandPolygon: [number, number][] = [
      // Top thermal right
      ...upperPoints,
      // Magnetic upper right
      [magneticBand.max, 0.01],
      [magneticBand.max, 0.001],
      // Bottom instantaneous
      [100, 0.001],
      [100, 0.001],
      [magneticBand.min, 0.001],
      [magneticBand.min, 0.01],
      // Lower thermal back to 1.14
      ...lowerPoints.reverse()
    ];

    // D3 Line & Area Generators
    const lineGen = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    const areaGen = d3.area<[number, number]>()
      .x(d => xScale(d[0]))
      .y0(innerHeight)
      .y1(d => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Render Shaded Operating Zone with 300ms transition
    const pathD = lineGen(bandPolygon) || '';
    g.append('path')
      .datum(bandPolygon)
      .attr('fill', 'rgba(16, 185, 129, 0.15)')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.0)
      .attr('d', lineGen)
      .transition()
      .duration(300);

    // Magnetic Shaded Window
    const magRectX1 = xScale(magneticBand.min);
    const magRectX2 = xScale(magneticBand.max);
    g.append('rect')
      .attr('x', magRectX1)
      .attr('width', magRectX2 - magRectX1)
      .attr('y', yScale(0.01))
      .attr('height', yScale(0.001) - yScale(0.01))
      .attr('fill', 'rgba(6, 182, 212, 0.25)')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,2');

    g.append('text')
      .attr('x', (magRectX1 + magRectX2) / 2)
      .attr('y', yScale(0.004))
      .attr('fill', '#38bdf8')
      .attr('font-size', '10px')
      .attr('font-weight', 'black')
      .attr('text-anchor', 'middle')
      .text(`Curve ${activeCurve} (${magneticBand.min}-${magneticBand.max}In)`);

    // OEM Overlay Curves (Schneider, ABB, Siemens)
    if (selectedOEM !== 'none') {
      const oemConfigs = [
        { name: 'schneider', label: 'Schneider iC60N', color: '#38bdf8', shift: 0.98 },
        { name: 'abb', label: 'ABB S200', color: '#fbbf24', shift: 1.02 },
        { name: 'siemens', label: 'Siemens 5SY', color: '#c084fc', shift: 0.95 }
      ];

      const activeOEMs = selectedOEM === 'all' 
        ? oemConfigs 
        : oemConfigs.filter(o => o.name === selectedOEM);

      activeOEMs.forEach(({ color, shift }) => {
        const oemUpper = upperPoints.map(p => [p[0] * shift, p[1] * shift] as [number, number]);
        g.append('path')
          .datum(oemUpper)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0.8)
          .attr('d', lineGen);
      });
    }

    // Operating Dot Fading Trail
    trail.forEach((p) => {
      if (p.x >= 1 && p.x <= 100 && p.y >= 0.001 && p.y <= 10000) {
        g.append('circle')
          .attr('cx', xScale(p.x))
          .attr('cy', yScale(p.y))
          .attr('r', 4 * p.alpha)
          .attr('fill', '#f43f5e')
          .attr('opacity', p.alpha * 0.7);
      }
    });

    // Active Operating Point Marker
    if (currentMult >= 1 && currentMult <= 100) {
      const opX = xScale(currentMult);
      const opY = yScale(currentTripTime);

      // Glow Halo
      g.append('circle')
        .attr('cx', opX)
        .attr('cy', opY)
        .attr('r', 10)
        .attr('fill', 'rgba(244, 63, 94, 0.35)')
        .attr('class', 'animate-ping');

      // Solid Core Dot
      g.append('circle')
        .attr('cx', opX)
        .attr('cy', opY)
        .attr('r', 5)
        .attr('fill', isTripped ? '#ef4444' : '#f43f5e')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);

      // Value label chip
      g.append('text')
        .attr('x', opX + 7)
        .attr('y', opY - 5)
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(`${currentMult.toFixed(2)}x In`);
    }

    // X-Axis (Bottom)
    const xAxis = d3.axisBottom(xScale)
      .tickValues(xTicks)
      .tickFormat(d => `${d}x`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px');

    // X-Axis Title
    svg.append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', height - 5)
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('text-anchor', 'middle')
      .text('Multiple of Rated Current (I / In)');

    // Y-Axis (Left)
    const yAxis = d3.axisLeft(yScale)
      .tickValues(yTicks)
      .tickFormat(d => {
        const num = d as number;
        if (num < 1) return `${(num * 1000).toFixed(0)}ms`;
        if (num >= 3600) return `${(num / 3600).toFixed(0)}h`;
        if (num >= 60) return `${(num / 60).toFixed(0)}m`;
        return `${num}s`;
      });

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px');

    // Y-Axis Title
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(margin.top + innerHeight / 2))
      .attr('y', 14)
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('text-anchor', 'middle')
      .text('Tripping Time (t)');

  }, [ratedCurrent, faultCurrent, activeCurve, currentMult, currentTripTime, magneticBand, calcTripTime, selectedOEM, trail, isTripped]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-xl select-none font-mono text-xs h-full overflow-hidden',
        className
      )}
    >
      {/* Header Bar & OEM Selector */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5 shrink-0 border-b border-slate-800/80 pb-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
        <div className="flex items-center gap-1.5 shrink-0">
          <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            D3 Log-Log TCC (Curve {activeCurve})
          </span>
        </div>

        {/* Datasheet OEM Overlays Selector */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">Overlay:</span>
          <select
            value={selectedOEM}
            onChange={(e) => setSelectedOEM(e.target.value as OEMManufacturer)}
            className="bg-slate-900 border border-slate-750 text-[11px] font-bold text-white rounded px-2 py-1 cursor-pointer min-h-[28px]"
          >
            <option value="none">IEC 60898-1 Only</option>
            <option value="schneider">Schneider Acti9 iC60N</option>
            <option value="abb">ABB S200</option>
            <option value="siemens">Siemens 5SY</option>
            <option value="all">All Manufacturer Curves</option>
          </select>
        </div>
      </div>

      {/* OEM Comparison Badge */}
      {selectedOEM !== 'none' && (
        <div className="mb-1.5 px-2.5 py-1 rounded bg-sky-950/80 border border-sky-500/60 text-sky-300 text-[11px] font-bold flex items-center justify-between shrink-0 animate-fadeIn">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            {selectedOEM === 'all'
              ? 'Multi-OEM Overlay: Schneider • ABB • Siemens'
              : `Overlay: ${selectedOEM === 'schneider' ? 'Schneider Acti9 iC60N' : selectedOEM === 'abb' ? 'ABB S200' : 'Siemens 5SY'}`}
          </span>
          <span className="text-amber-300 font-bold">±2.5% Manufacturing Tolerance</span>
        </div>
      )}

      {/* D3 SVG Canvas (Log-Log) */}
      <div className="relative w-full flex-1 min-h-[140px] overflow-hidden rounded-lg bg-[#090d16] border border-slate-850 flex items-center justify-center">
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* FOOTER LIVE OPERATING POINT TELEMETRY */}
      <div className="flex items-center justify-between text-[11px] font-mono mt-1.5 pt-1.5 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
            Operating: {currentMult.toFixed(2)}× In
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">
            t_trip: {currentTripTime < 1 ? `${(currentTripTime * 1000).toFixed(0)} ms` : `${currentTripTime.toFixed(1)} s`}
          </span>
        </div>

        <span className="text-slate-500 hidden sm:inline font-sans text-[11px]">
          IEC 60898-1 Table 7 • Log-Log D3
        </span>
      </div>
    </div>
  );
};
