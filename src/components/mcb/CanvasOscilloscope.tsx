import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WaveformSample } from '../../workers/mcbWorker';
import { SystemType, CurrentType } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Activity, Zap, AlertTriangle, Eye } from 'lucide-react';

interface CanvasOscilloscopeProps {
  samples: WaveformSample[];
  tDetect: number;
  tClear: number;
  systemType?: SystemType;
  currentType?: CurrentType;
  kappaPeakFactor?: number;
  className?: string;
}

export const CanvasOscilloscope: React.FC<CanvasOscilloscopeProps> = ({
  samples,
  tDetect,
  tClear,
  systemType = '1ph_230v',
  currentType = 'ac',
  kappaPeakFactor = 1.45,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [timeScale, setTimeScale] = useState<number>(1.0); // 0.25x, 0.5x, 1.0x
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<number>(0);

  const is3Phase = systemType === '3ph_400v';
  const isDC = currentType === 'dc';

  // Multi-touch tracking for pinch-to-zoom
  const lastTouchDistRef = useRef<number | null>(null);

  // Draw 60fps Canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !samples.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Padding margins
    const padL = 45;
    const padR = 15;
    const padT = 25;
    const padB = 25;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Find min/max values
    let maxI = 10;
    let maxV = 350;
    const maxT = samples[samples.length - 1].time / timeScale;

    for (const s of samples) {
      if (Math.abs(s.current) > maxI) maxI = Math.abs(s.current);
      if (Math.abs(s.voltage) > maxV) maxV = Math.abs(s.voltage);
    }
    maxI *= 1.15; // 15% headroom

    // Draw Grid Lines & Labels
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';

    // Horizontal Grid Lines
    const hLines = 4;
    for (let i = 0; i <= hLines; i++) {
      const y = padT + (plotH / hLines) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();

      const val = maxI - (2 * maxI / hLines) * i;
      ctx.fillText(`${val.toFixed(0)}A`, 5, y + 3);
    }

    // Time Mapping Helper
    const timeToX = (t: number) => {
      const norm = t / Math.max(1e-6, maxT);
      const zoomedNorm = (norm - panOffset) * zoomScale;
      return padL + zoomedNorm * plotW;
    };

    // Draw Voltage Waveform v(t) - Cyan / Arc Voltage Tail / TRV Spike
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (const s of samples) {
      const x = timeToX(s.time);
      let vVal = s.voltage;

      // Arc voltage tail (2-3ms arc voltage tail V_arc ~ 25V)
      if (tClear > 0 && s.time >= tClear - 0.0025 && s.time <= tClear) {
        vVal = 35; // Arc voltage
      }
      // TRV Spike on voltage extinction
      if (tClear > 0 && Math.abs(s.time - tClear) < 0.0005) {
        vVal = isDC ? maxV * 1.4 : maxV * 1.3;
      }

      const y = padT + plotH / 2 - (vVal / maxV) * (plotH / 2);
      if (x >= padL && x <= width - padR) {
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();

    // Draw Current Waveforms
    if (is3Phase && !isDC) {
      // 3-Phase Current Traces: Phase A (Emerald), Phase B (Amber), Phase C (Cyan)
      const colors = ['#10b981', '#f59e0b', '#06b6d4'];
      const phaseShifts = [0, - (2 * Math.PI / 3), +(2 * Math.PI / 3)];

      colors.forEach((color, idx) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        let pStarted = false;

        for (const s of samples) {
          const x = timeToX(s.time);
          const phaseI = s.current * Math.cos(phaseShifts[idx]);
          const y = padT + plotH / 2 - (phaseI / maxI) * (plotH / 2);
          if (x >= padL && x <= width - padR) {
            if (!pStarted) {
              ctx.moveTo(x, y);
              pStarted = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      });
    } else {
      // 1-Phase Current Waveform i(t) - Emerald/Red
      ctx.strokeStyle = maxI > 100 ? '#f43f5e' : '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      started = false;
      for (const s of samples) {
        const x = timeToX(s.time);
        const y = padT + plotH / 2 - (s.current / maxI) * (plotH / 2);
        if (x >= padL && x <= width - padR) {
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // Draw IEC 60909 Kappa Peak Marker
    if (maxI > 50 && !isDC) {
      const peakVal = kappaPeakFactor * Math.SQRT2 * (maxI / 1.15);
      const xPeak = timeToX(0.005);
      const yPeak = padT + plotH / 2 - (peakVal / maxI) * (plotH / 2);

      if (xPeak >= padL && xPeak <= width - padR) {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(xPeak, yPeak, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '10px monospace';
        ctx.fillText(`κ-peak (${kappaPeakFactor.toFixed(2)}x)`, xPeak + 6, yPeak + 3);
      }
    }

    // Draw Vertical Markers: t_detect & t_clear
    if (tDetect > 0) {
      const xDet = timeToX(tDetect);
      if (xDet >= padL && xDet <= width - padR) {
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xDet, padT);
        ctx.lineTo(xDet, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('t_detect', xDet + 3, padT + 12);
      }
    }

    if (tClear > 0) {
      const xClr = timeToX(tClear);
      if (xClr >= padL && xClr <= width - padR) {
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xClr, padT);
        ctx.lineTo(xClr, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('t_clear', xClr + 3, padT + 24);
      }
    }

    // Synchronized Interactive Crosshair
    if (hoverIndex !== null && samples[hoverIndex]) {
      const hoverSample = samples[hoverIndex];
      const hX = timeToX(hoverSample.time);

      if (hX >= padL && hX <= width - padR) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hX, padT);
        ctx.lineTo(hX, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        const hY = padT + plotH / 2 - (hoverSample.current / maxI) * (plotH / 2);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(hX, hY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
    }
  }, [samples, tDetect, tClear, hoverIndex, zoomScale, panOffset, timeScale, systemType, currentType, kappaPeakFactor, is3Phase, isDC]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Pointer & Touch Handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !samples.length) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const padL = 45;
    const padR = 15;
    const plotW = rect.width - padL - padR;

    const maxT = samples[samples.length - 1].time / timeScale;
    const normX = (x - padL) / plotW;
    const unzoomedNorm = normX / zoomScale + panOffset;
    const targetTime = unzoomedNorm * maxT;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < samples.length; i++) {
      const diff = Math.abs(samples[i].time - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setHoverIndex(closestIdx);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      if (lastTouchDistRef.current !== null) {
        const delta = dist - lastTouchDistRef.current;
        if (delta > 5) {
          setZoomScale((z) => Math.min(5.0, z * 1.05));
        } else if (delta < -5) {
          setZoomScale((z) => Math.max(1.0, z * 0.95));
        }
      }
      lastTouchDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistRef.current = null;
  };

  const activeSample = hoverIndex !== null && samples[hoverIndex] ? samples[hoverIndex] : samples[samples.length - 1];

  return (
    <div ref={containerRef} className={cn('relative flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-xl select-none touch-none font-mono', className)}>
      
      {/* DC WARNING CHIP */}
      {isDC && (
        <div className="mb-2 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>DC: NO NATURAL CURRENT ZERO — LONGER ARCING TIME (L·di/dt Overvoltage)</span>
        </div>
      )}

      {/* Header Bar & Time-Scale Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            60fps Oscilloscope [{is3Phase ? 'ia, ib, ic' : 'i(t)'}, v(t)]
          </span>
        </div>

        {/* Time-Scale Selectors (0.25x, 0.5x, 1.0x) */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px]">
          {([0.25, 0.5, 1.0] as const).map(scale => (
            <button
              key={scale}
              onClick={() => setTimeScale(scale)}
              className={cn(
                "px-2 py-0.5 rounded font-bold transition-all cursor-pointer min-h-[32px]",
                timeScale === scale ? "bg-orange-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
              )}
            >
              {scale}x
            </button>
          ))}
        </div>
      </div>

      {/* HTML5 Canvas Element */}
      <div className="relative w-full h-[200px]">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full cursor-crosshair touch-none rounded-lg"
        />
      </div>

      {/* Live Active Sample Readouts */}
      {activeSample && (
        <div className="flex items-center justify-between text-[10px] font-mono mt-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              t: {(activeSample.time * 1000).toFixed(1)}ms
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
              I²t: {activeSample.i2t.toFixed(1)} A²s
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-rose-400">
              Ip: {activeSample.peakIp.toFixed(1)} A
            </span>
          </div>

          <span className="text-slate-500 hidden sm:inline">Pinch/Scroll to zoom • Touch crosshair</span>
        </div>
      )}
    </div>
  );
};
