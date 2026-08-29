import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MCBTrippingCurve } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Layers } from 'lucide-react';

interface CanvasTCCChartProps {
  ratedCurrent: number;   // In (A)
  faultCurrent: number;   // I_fault (A)
  activeCurve: MCBTrippingCurve;
  bimetalTemp: number;
  isTripped: boolean;
  className?: string;
}

export const CanvasTCCChart: React.FC<CanvasTCCChartProps> = ({
  ratedCurrent,
  faultCurrent,
  activeCurve,
  bimetalTemp,
  isTripped,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Operating Point Animation Progress (0.0 to 1.0)
  const [animProgress, setAnimProgress] = useState<number>(0);

  useEffect(() => {
    let animationFrameId: number;
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min(1.0, (timestamp - start) / 1200); // 1.2s tracer animation
      setAnimProgress(progress);

      if (progress < 1.0) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    setAnimProgress(0);
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [faultCurrent, ratedCurrent, activeCurve]);

  // Log-Log transformation functions
  const xMinLog = Math.log10(0.1);
  const xMaxLog = Math.log10(100);
  const yMinLog = Math.log10(0.001); // 1 ms
  const yMaxLog = Math.log10(10000); // 10,000 s

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Dark background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const padL = 45;
    const padR = 20;
    const padT = 25;
    const padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const multipleToX = (m: number) => {
      const logM = Math.log10(Math.max(0.1, m));
      const norm = (logM - xMinLog) / (xMaxLog - xMinLog);
      return padL + norm * plotW;
    };

    const timeToY = (t: number) => {
      const logT = Math.log10(Math.max(0.001, Math.min(10000, t)));
      const norm = (yMaxLog - logT) / (yMaxLog - yMinLog);
      return padT + norm * plotH;
    };

    // Draw Log-Log Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';

    // X-Axis Log Ticks (0.1, 1, 10, 100)
    [0.1, 1, 10, 100].forEach((val) => {
      const x = multipleToX(val);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
      ctx.fillText(`${val}x`, x - 8, height - 8);
    });

    // Y-Axis Log Ticks (0.001s, 0.01s, 0.1s, 1s, 10s, 100s, 1000s, 10000s)
    [0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000].forEach((val) => {
      const y = timeToY(val);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();

      let label = `${val}s`;
      if (val === 0.001) label = '1ms';
      if (val === 0.01) label = '10ms';
      ctx.fillText(label, 5, y + 3);
    });

    // Helper to calculate theoretical trip time for a given multiple x
    const getTripTimeForMultiple = (m: number, c: MCBTrippingCurve) => {
      const bounds = { B: [3, 5], C: [5, 10], D: [10, 20] }[c];
      if (m < 1.13) return 10000;

      if (m >= bounds[1]) return 0.0025; // Instantaneous magnetic trip 2.5ms

      if (m >= bounds[0] && m < bounds[1]) {
        // Tolerance zone: interpolated 10ms - 100ms
        const frac = (m - bounds[0]) / (bounds[1] - bounds[0]);
        return 0.1 - frac * 0.09;
      }

      // Thermal zone: 1.13x to magnetic lower bound
      const R_th = 70.4832 / (ratedCurrent * ratedCurrent);
      const C_th = 2000;
      const T_ss = 30 + (m * ratedCurrent) * (m * ratedCurrent) * R_th;
      if (T_ss <= 130) return 10000;
      const ratio = (T_ss - 130) / (T_ss - 30);
      return -C_th * Math.log(ratio);
    };

    // Draw Tripping Curves & Shaded Tolerance Bands
    const curvesConfig: { name: MCBTrippingCurve; color: string; dash: number[] }[] = [
      { name: 'B', color: '#38bdf8', dash: [4, 4] },
      { name: 'C', color: '#34d399', dash: [] },
      { name: 'D', color: '#a855f7', dash: [6, 2] }
    ];

    curvesConfig.forEach(({ name, color, dash }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = name === activeCurve ? 3 : 1.5;
      ctx.setLineDash(dash);
      ctx.beginPath();

      let started = false;
      for (let m = 1.13; m <= 30; m += 0.2) {
        const t = getTripTimeForMultiple(m, name);
        const x = multipleToX(m);
        const y = timeToY(t);

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw Animated Operating Point Tracer
    const currentMultiple = faultCurrent / ratedCurrent;
    const targetTripTime = getTripTimeForMultiple(currentMultiple, activeCurve);

    const startX = multipleToX(1.0);
    const startY = timeToY(1000);
    const targetX = multipleToX(currentMultiple);
    const targetY = timeToY(targetTripTime);

    // Animate point along path
    let currX = startX;
    let currY = startY;

    if (animProgress <= 0.5) {
      // Horizontal move to fault current
      const p = animProgress / 0.5;
      currX = startX + p * (targetX - startX);
      currY = startY;
    } else {
      // Vertical drop to trip time
      const p = (animProgress - 0.5) / 0.5;
      currX = targetX;
      currY = startY + p * (targetY - startY);
    }

    // Tracer path line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currX, currY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing Operating Point Dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(currX, currY, 6, 0, Math.PI * 2);
    ctx.fill();

    if (isTripped) {
      // Pulsing outer ring on trip
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(currX, currY, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [ratedCurrent, faultCurrent, activeCurve, animProgress, isTripped, xMinLog, xMaxLog, yMinLog, yMaxLog]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <div className={cn('relative flex flex-col bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl select-none touch-none', className)}>
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 font-mono">
            Log-Log Time-Current Characteristic (TCC)
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-sky-400">Curve B</span>
          <span className="text-emerald-400">Curve C</span>
          <span className="text-purple-400">Curve D</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-[220px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none rounded-lg"
        />
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800">
        <span>X-Axis: Current Multiple (I / In)</span>
        <span>Y-Axis: Trip Time t (seconds)</span>
      </div>
    </div>
  );
};
