import React from 'react';
import { MCBTrippingCurve } from '../../mcb/types';
import { cn } from '@/src/lib/utils';
import { Gauge } from 'lucide-react';

interface MultiplierGaugeProps {
  multiplier: number;
  curve: MCBTrippingCurve;
  ratedCurrent: number;
  faultCurrent: number;
  className?: string;
}

export const MultiplierGauge: React.FC<MultiplierGaugeProps> = ({
  multiplier,
  curve,
  ratedCurrent,
  faultCurrent,
  className
}) => {
  // Magnetic Thresholds by Curve
  const magLower = curve === 'B' ? 3 : curve === 'C' ? 5 : 10;
  const magUpper = curve === 'B' ? 5 : curve === 'C' ? 10 : 20;

  // Active Zone Determination
  let zoneColor = 'text-emerald-400';
  let zoneName = 'CONTINUOUS LOAD (<1.13x)';
  let barColor = 'bg-emerald-500';

  if (multiplier >= magUpper) {
    zoneColor = 'text-rose-400';
    zoneName = `INSTANTANEOUS MAGNETIC TRIP (≥${magUpper}x)`;
    barColor = 'bg-rose-500';
  } else if (multiplier >= magLower) {
    zoneColor = 'text-sky-400';
    zoneName = `MAGNETIC TOLERANCE ZONE (${magLower}-${magUpper}x)`;
    barColor = 'bg-sky-400';
  } else if (multiplier > 2.55) {
    zoneColor = 'text-orange-400';
    zoneName = `RAPID THERMAL OVERLOAD (2.55-${magLower}x)`;
    barColor = 'bg-orange-500';
  } else if (multiplier >= 1.13) {
    zoneColor = 'text-amber-400';
    zoneName = 'CONVENTIONAL OVERLOAD (1.13-2.55x)';
    barColor = 'bg-amber-500';
  }

  // Max gauge scale based on curve
  const maxScale = curve === 'D' ? 25 : curve === 'C' ? 15 : 8;
  const fillPercent = Math.min(100, (multiplier / maxScale) * 100);

  return (
    <div className={cn("p-2 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono text-xs select-none", className)}>
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
        <span className="flex items-center gap-1">
          <Gauge className="w-3.5 h-3.5 text-sky-400" /> MULTIPLIER GAUGE
        </span>
        <span className={cn("font-black tabular-nums", zoneColor)}>
          {multiplier.toFixed(2)}× In ({faultCurrent.toFixed(1)}A)
        </span>
      </div>

      {/* Multi-Zone Color Track */}
      <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
        {/* Zone 1: Green <1.13x */}
        <div style={{ width: `${(1.13 / maxScale) * 100}%` }} className="h-full bg-emerald-500/40 border-r border-slate-900" title="Green: Continuous (<1.13x)" />
        {/* Zone 2: Amber 1.13-2.55x */}
        <div style={{ width: `${((2.55 - 1.13) / maxScale) * 100}%` }} className="h-full bg-amber-500/40 border-r border-slate-900" title="Amber: Overload (1.13-2.55x)" />
        {/* Zone 3: Orange 2.55x to magLower */}
        <div style={{ width: `${(Math.max(0, magLower - 2.55) / maxScale) * 100}%` }} className="h-full bg-orange-500/40 border-r border-slate-900" title={`Orange: Fast Thermal (2.55-${magLower}x)`} />
        {/* Zone 4: Blue/Cyan magLower to magUpper */}
        <div style={{ width: `${((magUpper - magLower) / maxScale) * 100}%` }} className="h-full bg-sky-500/40 border-r border-slate-900" title={`Sky: Tolerance (${magLower}-${magUpper}x)`} />
        {/* Zone 5: Red >= magUpper */}
        <div className="flex-1 h-full bg-rose-500/40" title={`Red: Instant Magnetic (≥${magUpper}x)`} />

        {/* Live Indicator Needle / Progress Bar */}
        <div
          className={cn("absolute top-0 bottom-0 transition-all duration-150 shadow-md", barColor)}
          style={{ width: `${fillPercent}%`, opacity: 0.85 }}
        />
      </div>

      {/* Zone Label */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
        <span className={zoneColor}>{zoneName}</span>
        <span className="text-slate-500">Max: {maxScale}×</span>
      </div>
    </div>
  );
};
