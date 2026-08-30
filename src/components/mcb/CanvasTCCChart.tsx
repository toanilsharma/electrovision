import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MCBTrippingCurve } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Layers, ShieldCheck, Info } from 'lucide-react';

export type OEMManufacturer = 'schneider' | 'abb' | 'siemens' | 'none';

interface CanvasTCCChartProps {
  ratedCurrent: number;   // In (A)
  faultCurrent: number;   // I_fault (A)
  activeCurve: MCBTrippingCurve;
  bimetalTemp: number;
  isTripped: boolean;
  oemManufacturer?: OEMManufacturer;
  className?: string;
}

export const CanvasTCCChart: React.FC<CanvasTCCChartProps> = ({
  ratedCurrent,
  faultCurrent,
  activeCurve,
  bimetalTemp,
  isTripped,
  oemManufacturer = 'none',
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animProgress, setAnimProgress] = useState<number>(0);
  const [selectedOEM, setSelectedOEM] = useState<OEMManufacturer>(oemManufacturer);

  useEffect(() => {
    setSelectedOEM(oemManufacturer);
  }, [oemManufacturer]);

  useEffect(() => {
    let animationFrameId: number;
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min(1.0, (timestamp - start) / 1200);
      setAnimProgress(progress);

      if (progress < 1.0) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    setAnimProgress(0);
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [faultCurrent, ratedCurrent, activeCurve]);

  // Log-Log transformation constants
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

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const padL = 40;
    const padR = 15;
    const padT = 25;
    const padB = 25;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const valToX = (val: number) => {
      const logVal = Math.log10(Math.max(0.1, val));
      const norm = (logVal - xMinLog) / (xMaxLog - xMinLog);
      return padL + norm * plotW;
    };

    const timeToY = (timeSec: number) => {
      const logTime = Math.log10(Math.max(0.001, timeSec));
      const norm = (logTime - yMinLog) / (yMaxLog - yMinLog);
      return padT + (1 - norm) * plotH;
    };

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.8;

    [0.1, 1, 1.13, 1.45, 5, 10, 20, 50, 100].forEach(mult => {
      const x = valToX(mult);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    });

    [0.001, 0.01, 0.1, 1, 10, 100, 1000, 3600].forEach(t => {
      const y = timeToY(t);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
    });

    // Draw Tripping Bands for Curve (B, C, or D)
    let magLower = 5;
    let magUpper = 10;
    if (activeCurve === 'B') { magLower = 3; magUpper = 5; }
    if (activeCurve === 'D') { magLower = 10; magUpper = 20; }

    // Draw Base IEC 60898-1 Band
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;

    const x113 = valToX(1.13);
    const x145 = valToX(1.45);
    const xMagL = valToX(magLower);
    const xMagU = valToX(magUpper);

    const y3600 = timeToY(3600);
    const y01 = timeToY(0.01);
    const yMax = timeToY(10000);

    ctx.beginPath();
    ctx.moveTo(x145, y3600);
    ctx.lineTo(x145, yMax);
    ctx.lineTo(xMagL, yMax);
    ctx.lineTo(xMagL, y01);
    ctx.lineTo(xMagU, y01);
    ctx.lineTo(xMagU, padT + plotH);
    ctx.lineTo(x113, padT + plotH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw OEM Overlay Band if selected
    if (selectedOEM !== 'none') {
      ctx.strokeStyle = selectedOEM === 'schneider' ? '#38bdf8' : selectedOEM === 'abb' ? '#fbbf24' : '#c084fc';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;

      let oemLower = magLower * 1.02;
      let oemUpper = magUpper * 0.98;

      const xoLower = valToX(oemLower);
      const xoUpper = valToX(oemUpper);

      ctx.beginPath();
      ctx.moveTo(xoLower, yMax);
      ctx.lineTo(xoLower, y01);
      ctx.lineTo(xoUpper, y01);
      ctx.lineTo(xoUpper, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Operating Point Marker
    const currentMult = faultCurrent / ratedCurrent;
    const opX = valToX(currentMult);
    const opY = isTripped ? timeToY(0.005) : timeToY(200);

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(opX, opY, 6 * animProgress, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

  }, [faultCurrent, ratedCurrent, activeCurve, isTripped, animProgress, selectedOEM, xMinLog, xMaxLog, yMinLog, yMaxLog]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <div className={cn("relative flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-xl select-none font-mono", className)}>
      
      {/* Header Bar & OEM Selection */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>TCC Curve {activeCurve} (IEC 60898-1)</span>
        </div>

        {/* OEM Manufacturer Selector */}
        <select
          value={selectedOEM}
          onChange={(e) => setSelectedOEM(e.target.value as OEMManufacturer)}
          className="bg-slate-900 border border-slate-750 text-[10px] font-bold text-white rounded px-2 py-1 cursor-pointer min-h-[30px]"
        >
          <option value="none">Generic IEC 60898-1</option>
          <option value="schneider">Schneider Acti9 iC60N</option>
          <option value="abb">ABB S200 Series</option>
          <option value="siemens">Siemens 5SY (C16/C25)</option>
        </select>
      </div>

      {/* OEM Deviation Badge */}
      {selectedOEM !== 'none' && (
        <div className="mb-2 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/60 text-sky-300 text-[10px] font-bold flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Digitized OEM Band: {selectedOEM === 'schneider' ? 'Schneider Acti9 iC60N' : selectedOEM === 'abb' ? 'ABB S200' : 'Siemens 5SY'}
          </span>
          <span className="text-amber-300 font-bold">Deviation: ±2.5% vs Generic</span>
        </div>
      )}

      {/* Canvas */}
      <div className="relative w-full h-[200px]">
        <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
      </div>
    </div>
  );
};
