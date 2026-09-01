import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { WaveformSample } from '../../workers/mcbWorker';
import { SystemType, CurrentType, MCBState } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Activity, Zap, AlertTriangle, Eye, Sliders, Layers } from 'lucide-react';

interface CanvasOscilloscopeProps {
  samples: WaveformSample[];
  tDetect: number;
  tClear: number;
  systemType?: SystemType;
  currentType?: CurrentType;
  kappaPeakFactor?: number;
  ratedCurrent?: number;
  faultCurrent?: number;
  isSimulating?: boolean;
  className?: string;
}

export const CanvasOscilloscope: React.FC<CanvasOscilloscopeProps> = ({
  samples,
  tDetect,
  tClear,
  systemType = '1ph_230v',
  currentType = 'ac',
  kappaPeakFactor = 1.45,
  ratedCurrent = 16,
  faultCurrent = 23.2,
  isSimulating = false,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const uplotInstanceRef = useRef<uPlot | null>(null);

  // Timebase scale in ms (e.g. 20ms, 50ms, 100ms, 200ms)
  const [timebaseMs, setTimebaseMs] = useState<number>(100);
  const [scaleMode, setScaleMode] = useState<'linear' | 'log'>('linear');
  const [showVoltage, setShowVoltage] = useState<boolean>(true);

  // Hover telemetry
  const [hoverData, setHoverData] = useState<{
    timeMs: number;
    iA: number;
    iB?: number;
    iC?: number;
    vT: number;
  } | null>(null);

  const is3Phase = systemType === '3ph_400v';
  const isDC = currentType === 'dc';

  // Generate live dataset (Pre-fault continuous or Worker Fault Waveform)
  const plotData = useMemo<uPlot.AlignedData>(() => {
    const durationSec = timebaseMs / 1000;
    const numPoints = 600;
    const dt = durationSec / numPoints;

    const timeArr: number[] = new Array(numPoints);
    const iArrA: number[] = new Array(numPoints);
    const iArrB: number[] = new Array(numPoints);
    const iArrC: number[] = new Array(numPoints);
    const vArr: number[] = new Array(numPoints);

    // If we have real worker samples from fault execution
    if (samples && samples.length > 5) {
      const stepRatio = Math.max(1, Math.floor(samples.length / numPoints));
      const filtered = samples.filter((_, idx) => idx % stepRatio === 0).slice(0, numPoints);

      const actualPoints = filtered.length;
      const tData: number[] = new Array(actualPoints);
      const iDataA: number[] = new Array(actualPoints);
      const iDataB: number[] = new Array(actualPoints);
      const iDataC: number[] = new Array(actualPoints);
      const vData: number[] = new Array(actualPoints);

      for (let i = 0; i < actualPoints; i++) {
        const s = filtered[i];
        const tMs = s.time * 1000;
        tData[i] = tMs;

        let vVal = s.voltage;
        // Arc voltage tail (25-35V) & TRV overvoltage spike on trip
        if (tClear > 0 && s.time >= tClear - 0.0025 && s.time <= tClear) {
          vVal = isDC ? 40 : 35;
        } else if (tClear > 0 && Math.abs(s.time - tClear) < 0.0008) {
          vVal = isDC ? 350 * 1.6 : 325 * 1.45; // L*di/dt overvoltage spike
        } else if (s.state === MCBState.OPEN_CLEARED) { // OPEN_CLEARED
          vVal = 0;
        }
        vData[i] = vVal;

        if (is3Phase && !isDC) {
          iDataA[i] = s.current;
          iDataB[i] = s.current * Math.cos(- (2 * Math.PI / 3));
          iDataC[i] = s.current * Math.cos(+(2 * Math.PI / 3));
        } else {
          iDataA[i] = s.current;
          iDataB[i] = 0;
          iDataC[i] = 0;
        }
      }

      if (is3Phase && !isDC) {
        return [tData, iDataA, iDataB, iDataC, vData];
      }
      return [tData, iDataA, vData];
    }

    // ALWAYS PRE-FAULT SYNTHETIC LIVE LOAD WAVEFORM
    const loadAmps = ratedCurrent;
    const nominalV = isDC ? 220 : is3Phase ? 400 * Math.SQRT2 / Math.sqrt(3) : 230 * Math.SQRT2;

    for (let i = 0; i < numPoints; i++) {
      const t = i * dt;
      const tMs = t * 1000;
      timeArr[i] = tMs;

      if (isDC) {
        iArrA[i] = loadAmps;
        iArrB[i] = 0;
        iArrC[i] = 0;
        vArr[i] = nominalV;
      } else if (is3Phase) {
        const omega = 2 * Math.PI * 50;
        iArrA[i] = loadAmps * Math.SQRT2 * Math.sin(omega * t);
        iArrB[i] = loadAmps * Math.SQRT2 * Math.sin(omega * t - (2 * Math.PI / 3));
        iArrC[i] = loadAmps * Math.SQRT2 * Math.sin(omega * t + (2 * Math.PI / 3));
        vArr[i] = nominalV * Math.cos(omega * t);
      } else {
        const omega = 2 * Math.PI * 50;
        iArrA[i] = loadAmps * Math.SQRT2 * Math.sin(omega * t);
        iArrB[i] = 0;
        iArrC[i] = 0;
        vArr[i] = nominalV * Math.cos(omega * t);
      }
    }

    if (is3Phase && !isDC) {
      return [timeArr, iArrA, iArrB, iArrC, vArr];
    }
    return [timeArr, iArrA, vArr];
  }, [samples, timebaseMs, ratedCurrent, systemType, currentType, is3Phase, isDC, tClear]);

  // Build uPlot instance
  useEffect(() => {
    if (!plotRef.current || !containerRef.current) return;

    const width = plotRef.current.clientWidth || 360;
    const height = Math.max(160, (plotRef.current.clientHeight || 200));

    // Custom Plugin for vertical TRIP and DETECT lines
    const tripMarkerPlugin: uPlot.Plugin = {
      hooks: {
        draw: (u: uPlot) => {
          const { ctx } = u;
          const { left, top, width: pW, height: pH } = u.bbox;

          // Trip clearing marker line
          if (tClear > 0) {
            const tClearMs = tClear * 1000;
            const xPos = u.valToPos(tClearMs, 'x', true);

            if (xPos >= left && xPos <= left + pW) {
              ctx.save();
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 3]);
              ctx.beginPath();
              ctx.moveTo(xPos, top);
              ctx.lineTo(xPos, top + pH);
              ctx.stroke();

              // Badge
              ctx.fillStyle = '#ef4444';
              ctx.font = 'bold 11px monospace';
              ctx.fillText(`⚡ TRIP: ${tClearMs.toFixed(1)}ms`, xPos + 4, top + 18);
              ctx.restore();
            }
          }

          // Solenoid detection marker
          if (tDetect > 0 && tDetect !== tClear) {
            const tDetectMs = tDetect * 1000;
            const xPos = u.valToPos(tDetectMs, 'x', true);

            if (xPos >= left && xPos <= left + pW) {
              ctx.save();
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(xPos, top);
              ctx.lineTo(xPos, top + pH);
              ctx.stroke();

              ctx.fillStyle = '#f59e0b';
              ctx.font = 'bold 10px monospace';
              ctx.fillText(`DETECT`, xPos + 4, top + 34);
              ctx.restore();
            }
          }
        }
      }
    };

    // Series Definitions
    const seriesList: uPlot.Series[] = [
      {
        label: 'Time (ms)',
        value: (_u, v) => `${(v || 0).toFixed(1)} ms`
      },
      {
        label: is3Phase ? 'Ia (A)' : 'i(t) (A)',
        stroke: '#10b981',
        width: 2.2,
        scale: 'current',
        value: (_u, v) => `${(v || 0).toFixed(1)} A`
      }
    ];

    if (is3Phase && !isDC) {
      seriesList.push(
        {
          label: 'Ib (A)',
          stroke: '#f59e0b',
          width: 2.0,
          scale: 'current',
          value: (_u, v) => `${(v || 0).toFixed(1)} A`
        },
        {
          label: 'Ic (A)',
          stroke: '#06b6d4',
          width: 2.0,
          scale: 'current',
          value: (_u, v) => `${(v || 0).toFixed(1)} A`
        }
      );
    }

    // Ghost Voltage series
    seriesList.push({
      label: 'v(t) (V)',
      stroke: 'rgba(56, 189, 248, 0.45)', // Cyan ghost trace
      width: 1.5,
      dash: [4, 2],
      scale: 'voltage',
      show: showVoltage,
      value: (_u, v) => `${(v || 0).toFixed(0)} V`
    });

    const opts: uPlot.Options = {
      width,
      height,
      plugins: [tripMarkerPlugin],
      legend: {
        show: false // We use custom interactive header chips
      },
      cursor: {
        sync: { key: 'mcb-scope' },
        drag: { setScale: false },
        dataIdx: (_u, _seriesIdx, closestIdx) => {
          if (closestIdx !== null && plotData[0][closestIdx] !== undefined) {
            setHoverData({
              timeMs: plotData[0][closestIdx],
              iA: plotData[1][closestIdx],
              iB: is3Phase && !isDC ? plotData[2]?.[closestIdx] : undefined,
              iC: is3Phase && !isDC ? plotData[3]?.[closestIdx] : undefined,
              vT: plotData[plotData.length - 1][closestIdx]
            });
          }
          return closestIdx;
        }
      },
      scales: {
        x: {
          time: false,
          auto: true
        },
        current: {
          auto: true,
          distr: scaleMode === 'log' ? 3 : 1
        },
        voltage: {
          auto: true,
          range: [-450, 450]
        }
      },
      axes: [
        {
          scale: 'x',
          stroke: '#64748b',
          grid: { stroke: 'rgba(30, 41, 59, 0.65)', width: 1 },
          ticks: { stroke: '#475569', width: 1 },
          values: (_u, vals) => vals.map(v => `${v.toFixed(0)}ms`),
          font: '10px monospace'
        },
        {
          scale: 'current',
          stroke: '#10b981',
          grid: { stroke: 'rgba(30, 41, 59, 0.65)', width: 1 },
          ticks: { stroke: '#10b981', width: 1 },
          values: (_u, vals) => vals.map(v => `${v.toFixed(0)}A`),
          font: '10px monospace',
          size: 45
        },
        {
          scale: 'voltage',
          side: 1, // Right axis
          stroke: 'rgba(56, 189, 248, 0.6)',
          grid: { show: false },
          ticks: { stroke: 'rgba(56, 189, 248, 0.6)', width: 1 },
          values: (_u, vals) => vals.map(v => `${v.toFixed(0)}V`),
          font: '10px monospace',
          size: 40
        }
      ],
      series: seriesList
    };

    // Clean up previous instance
    if (uplotInstanceRef.current) {
      uplotInstanceRef.current.destroy();
      uplotInstanceRef.current = null;
    }

    plotRef.current.innerHTML = '';
    const u = new uPlot(opts, plotData, plotRef.current);
    uplotInstanceRef.current = u;

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 50 && uplotInstanceRef.current) {
          uplotInstanceRef.current.setSize({
            width: entry.contentRect.width,
            height: Math.max(150, entry.contentRect.height)
          });
        }
      }
    });

    ro.observe(plotRef.current);

    return () => {
      ro.disconnect();
      if (uplotInstanceRef.current) {
        uplotInstanceRef.current.destroy();
        uplotInstanceRef.current = null;
      }
    };
  }, [plotData, is3Phase, isDC, scaleMode, showVoltage, tClear, tDetect]);

  // Live 60fps data update
  useEffect(() => {
    if (uplotInstanceRef.current && plotData) {
      uplotInstanceRef.current.setData(plotData);
    }
  }, [plotData]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-xl select-none font-mono text-xs h-full overflow-hidden',
        className
      )}
    >
      {/* DC WARNING BANNER */}
      {isDC && (
        <div className="mb-1.5 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 animate-pulse shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>DC: NO NATURAL CURRENT ZERO — LONGER ARCING TIME (L·di/dt Overvoltage)</span>
        </div>
      )}

      {/* TOP CONTROLS & SCOPE TIMEBASE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 shrink-0 border-b border-slate-800/80 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            uPlot 60fps Oscilloscope
          </span>
        </div>

        {/* Right Header Toggles & SCOPE TIMEBASE */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
          {/* Voltage Ghost Toggle */}
          <button
            onClick={() => setShowVoltage(v => !v)}
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer min-h-[28px] flex items-center gap-1 shrink-0",
              showVoltage ? "bg-sky-950 text-sky-300 border-sky-500" : "bg-slate-900 text-slate-500 border-slate-800"
            )}
            title="Toggle Voltage Ghost Waveform v(t)"
          >
            <Eye className="w-3 h-3" /> v(t) Ghost
          </button>

          {/* Scale Mode (Linear / Log) */}
          <button
            onClick={() => setScaleMode(m => m === 'linear' ? 'log' : 'linear')}
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer min-h-[28px] shrink-0",
              scaleMode === 'log' ? "bg-purple-950 text-purple-300 border-purple-500" : "bg-slate-900 text-slate-300 border-slate-800"
            )}
            title="Toggle Y-Axis Auto-Scale Mode"
          >
            Scale: {scaleMode.toUpperCase()}
          </button>

          {/* SCOPE TIMEBASE SELECTOR (MANDATORY LABEL) */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] shrink-0">
            <span className="text-slate-400 px-1 font-bold">SCOPE TIMEBASE:</span>
            {([20, 50, 100, 200] as const).map(ms => (
              <button
                key={ms}
                onClick={() => setTimebaseMs(ms)}
                className={cn(
                  "px-2 py-0.5 rounded font-black transition-all cursor-pointer min-h-[28px] shrink-0",
                  timebaseMs === ms ? "bg-orange-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                )}
              >
                {ms}ms
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* INTERACTIVE LEGEND CHIPS */}
      <div className="flex flex-wrap items-center gap-2 mb-1 text-[11px] shrink-0 bg-slate-900/60 p-1.5 rounded-lg border border-slate-850">
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>{is3Phase ? 'Phase A (Ia):' : 'Current i(t):'}</span>
          <span className="font-mono text-white tabular-nums">
            {hoverData ? `${hoverData.iA.toFixed(1)} A` : `${(samples?.[samples.length - 1]?.current || ratedCurrent).toFixed(1)} A`}
          </span>
        </div>

        {is3Phase && !isDC && (
          <>
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Phase B (Ib):</span>
              <span className="font-mono text-white tabular-nums">
                {hoverData?.iB !== undefined ? `${hoverData.iB.toFixed(1)} A` : `${(ratedCurrent * -0.5).toFixed(1)} A`}
              </span>
            </div>
            <div className="flex items-center gap-1 text-cyan-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
              <span>Phase C (Ic):</span>
              <span className="font-mono text-white tabular-nums">
                {hoverData?.iC !== undefined ? `${hoverData.iC.toFixed(1)} A` : `${(ratedCurrent * -0.5).toFixed(1)} A`}
              </span>
            </div>
          </>
        )}

        {showVoltage && (
          <div className="flex items-center gap-1 text-sky-400 font-bold ml-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block opacity-80" />
            <span>Voltage v(t):</span>
            <span className="font-mono text-white tabular-nums">
              {hoverData ? `${hoverData.vT.toFixed(0)} V` : `${(samples?.[samples.length - 1]?.voltage || 230).toFixed(0)} V`}
            </span>
          </div>
        )}
      </div>

      {/* uPlot Chart Container (Fills available space) */}
      <div className="relative w-full flex-1 min-h-[140px] overflow-hidden rounded-lg bg-[#090d16] border border-slate-850 flex items-center justify-center">
        <div ref={plotRef} className="w-full h-full" />
      </div>

      {/* FOOTER LIVE TELEMETRY */}
      <div className="flex items-center justify-between text-[11px] font-mono mt-1.5 pt-1.5 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            t: {hoverData ? `${hoverData.timeMs.toFixed(1)}ms` : `${(samples?.[samples.length - 1]?.time ? samples[samples.length - 1].time * 1000 : timebaseMs).toFixed(1)}ms`}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
            I²t: {(samples?.[samples.length - 1]?.i2t || 0).toFixed(1)} A²s
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-rose-300">
            Peak Ip: {(samples?.[samples.length - 1]?.peakIp || ratedCurrent * 1.414).toFixed(1)} A
          </span>
        </div>

        <span className="text-slate-500 hidden sm:inline font-sans text-[11px]">
          Live uPlot 60fps • IEC 60909 κ-factor: {kappaPeakFactor.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
