import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WaveformSample } from '../../workers/mcbWorker';
import { cn } from '@/src/lib/utils';
import { Activity, Zap } from 'lucide-react';

interface CanvasOscilloscopeProps {
  samples: WaveformSample[];
  tDetect: number;
  tClear: number;
  className?: string;
}

export const CanvasOscilloscope: React.FC<CanvasOscilloscopeProps> = ({
  samples,
  tDetect,
  tClear,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<number>(0);

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
    ctx.fillStyle = '#090d16'; // Deep dark canvas background
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
    const maxT = samples[samples.length - 1].time;

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
      const norm = t / maxT;
      const zoomedNorm = (norm - panOffset) * zoomScale;
      return padL + zoomedNorm * plotW;
    };

    const xToSampleIndex = (x: number) => {
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
      return closestIdx;
    };

    // Draw Voltage Waveform v(t) - Cyan
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (const s of samples) {
      const x = timeToX(s.time);
      const y = padT + plotH / 2 - (s.voltage / maxV) * (plotH / 2);
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

    // Draw Current Waveform i(t) - Emerald/Red
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

    // Draw Synchronized Interactive Crosshair
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

        // Intersection point glowing circle
        const hY = padT + plotH / 2 - (hoverSample.current / maxI) * (plotH / 2);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(hX, hY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
    }
  }, [samples, tDetect, tClear, hoverIndex, zoomScale, panOffset]);

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

    const maxT = samples[samples.length - 1].time;
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

  // Pinch-to-zoom handler
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
    <div ref={containerRef} className={cn('relative flex flex-col bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl select-none touch-none', className)}>
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 font-mono">
            60fps Waveform Oscilloscope [i(t), v(t)]
          </span>
        </div>

        {/* Live HUD Chip (Updates live as crosshair moves) */}
        {activeSample && (
          <div className="flex items-center gap-2 text-[10px] font-mono">
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
        )}
      </div>

      {/* HTML5 Canvas Element */}
      <div className="relative w-full h-[220px]">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full cursor-crosshair touch-none rounded-lg"
        />
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Current i(t)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Voltage v(t)
          </span>
        </div>
        <span className="text-slate-500">Pinch/Scroll to zoom • Touch to inspect</span>
      </div>
    </div>
  );
};
