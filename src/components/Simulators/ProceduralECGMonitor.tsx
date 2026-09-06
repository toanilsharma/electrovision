import { useState, useEffect, useRef } from 'react';
import { ECGRhythmType, ECGLead, sampleECGVoltage } from '@/src/utils/ecgSynthesizer';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ProceduralECGMonitorProps {
  rhythm: ECGRhythmType;
  isCompressing?: boolean;
  compressionDepthCm?: number;
  heartRateBpm?: number;
  amsaValue?: number;
  className?: string;
  showLeadSelector?: boolean;
}

export function ProceduralECGMonitor({
  rhythm,
  isCompressing = false,
  compressionDepthCm = 0,
  heartRateBpm = 75,
  amsaValue,
  className,
  showLeadSelector = true,
}: ProceduralECGMonitorProps) {
  const [selectedLead, setSelectedLead] = useState<ECGLead>('Lead II');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const timeOffsetRef = useRef<number>(0);

  // Monitor canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000.0;
      lastTime = now;
      timeOffsetRef.current += dt;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2.0;
      const pxPerMv = height * 0.32;

      // 1. CRT Black Background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // 2. Calibrated Medical ECG Grid (0.2s major, 0.04s minor squares)
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)'; // faint green grid
      const gridStep = 16;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Major grid lines (every 5 minor boxes)
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.16)';
      for (let x = 0; x < width; x += gridStep * 5) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep * 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Phosphor Persistence ECG Waveform Trace
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // CRT Glow Pass
      ctx.shadowBlur = 8;
      ctx.shadowColor = rhythm === 'sinus' ? '#10b981' : rhythm === 'asystole' ? '#ef4444' : '#f59e0b';
      ctx.strokeStyle = rhythm === 'sinus' ? '#34d399' : rhythm === 'asystole' ? '#f87171' : '#fbbf24';

      ctx.beginPath();
      const timeWindowSec = 3.2; // 3.2 seconds display span
      const sampleStep = 2; // pixel step

      for (let x = 0; x <= width; x += sampleStep) {
        const t = timeOffsetRef.current + (x / width) * timeWindowSec;
        const sample = sampleECGVoltage(t, {
          rhythm,
          lead: selectedLead,
          heartRateBpm,
          isCompressing,
          compressionDepthCm,
        });

        const y = centerY - sample.totalMillivolts * pxPerMv;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset blur

      // Sweep head highlight point
      const sweepX = (timeOffsetRef.current * (width / timeWindowSec)) % width;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const currentSample = sampleECGVoltage(timeOffsetRef.current, {
        rhythm,
        lead: selectedLead,
        heartRateBpm,
        isCompressing,
        compressionDepthCm,
      });
      ctx.arc(sweepX, centerY - currentSample.totalMillivolts * pxPerMv, 2.5, 0, Math.PI * 2);
      ctx.fill();

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [rhythm, selectedLead, heartRateBpm, isCompressing, compressionDepthCm]);

  // Rhythm labels and diagnostics
  const rhythmLabels: Record<ECGRhythmType, { name: string; status: string; color: string }> = {
    sinus: { name: 'NORMAL SINUS RHYTHM', status: 'NON-SHOCKABLE / ROSC', color: 'text-emerald-400' },
    coarse_vf: { name: 'VENTRICULAR FIBRILLATION (COARSE)', status: 'SHOCKABLE — HIGH EFFICACY', color: 'text-amber-400' },
    fine_vf: { name: 'FINE VENTRICULAR FIBRILLATION', status: 'SHOCKABLE — CPR REQUIRED', color: 'text-orange-400' },
    pvt: { name: 'PULSELESS VENTRICULAR TACHYCARDIA', status: 'SHOCKABLE — IMMEDIATE DEFIB', color: 'text-red-400' },
    asystole: { name: 'ASYSTOLE (FLATLINE)', status: 'NON-SHOCKABLE — CONTINUE CPR', color: 'text-red-500' },
    pea: { name: 'PULSELESS ELECTRICAL ACTIVITY', status: 'NON-SHOCKABLE — CHECK REVERSIBLE CAUSES', color: 'text-yellow-400' },
  };

  const labelInfo = rhythmLabels[rhythm] || rhythmLabels.coarse_vf;

  return (
    <div className={cn("relative rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex flex-col gap-2 overflow-hidden shadow-2xl", className)}>
      {/* CRT Scanline Overlay Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between z-10 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div>
            <span className={cn("font-black tracking-wide text-[11px]", labelInfo.color)}>
              {labelInfo.name}
            </span>
            <span className="text-[9px] text-slate-500 block leading-tight">
              {labelInfo.status} {amsaValue !== undefined ? `· AMSA: ${amsaValue.toFixed(1)} mV-Hz` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompressing && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold animate-pulse">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>CPR ARTIFACT (~1.8Hz)</span>
            </div>
          )}

          {showLeadSelector && (
            <div className="flex rounded bg-slate-900 border border-slate-800 p-0.5 text-[10px]">
              <button
                onClick={() => setSelectedLead('Lead II')}
                className={cn("px-1.5 py-0.5 rounded font-bold cursor-pointer", selectedLead === 'Lead II' ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white")}
              >
                II
              </button>
              <button
                onClick={() => setSelectedLead('V1')}
                className={cn("px-1.5 py-0.5 rounded font-bold cursor-pointer", selectedLead === 'V1' ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white")}
              >
                V1
              </button>
            </div>
          )}

          <div className="text-right">
            <span className="text-[9px] text-slate-500 block">HR</span>
            <span className={cn("text-sm font-black tabular-nums leading-none", labelInfo.color)}>
              {rhythm === 'asystole' ? '0' : rhythm === 'sinus' ? heartRateBpm : rhythm === 'pvt' ? '180' : '---'}
            </span>
          </div>
        </div>
      </div>

      {/* Calibrated CRT Canvas */}
      <div className="relative w-full h-[110px] rounded-lg overflow-hidden border border-slate-900 bg-slate-950 z-10 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={580}
          height={110}
          className="w-full h-full object-cover"
        />
        
        {/* Scale indicator legend */}
        <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-500 pointer-events-none bg-slate-950/70 px-1 rounded">
          25 mm/s · 10 mm/mV
        </div>
      </div>

      {/* Artifact Explanation Footer */}
      {isCompressing && (
        <div className="flex items-center gap-1.5 text-[9px] text-amber-300/90 bg-amber-950/30 px-2 py-1 rounded border border-amber-500/20 z-10">
          <Cpu className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Notice motion waveform distortion: Chest compressions inject sinusoidal noise. Rescuers must stand clear during AED rhythm analysis!</span>
        </div>
      )}
    </div>
  );
}
