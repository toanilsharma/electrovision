import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/src/lib/utils';

interface SnapPoint {
  multiple: number; // e.g. 1.13
  label: string;    // e.g. "1.13x Int"
}

interface CustomSnapSliderProps {
  label: string;
  value: number; // Current value in Amperes
  min: number;   // Min Amperes
  max: number;   // Max Amperes
  step?: number;
  In: number;    // Rated current (e.g. 16A)
  snapPoints?: SnapPoint[];
  onChange: (val: number) => void;
  unit?: string;
  className?: string;
}

const DEFAULT_SNAP_POINTS: SnapPoint[] = [
  { multiple: 1.13, label: '1.13x Int' },
  { multiple: 1.45, label: '1.45x It' },
  { multiple: 5.0, label: '5x Mag' },
  { multiple: 10.0, label: '10x Mag' }
];

export const CustomSnapSlider: React.FC<CustomSnapSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.1,
  In,
  snapPoints = DEFAULT_SNAP_POINTS,
  onChange,
  unit = 'A',
  className
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastSnappedRef = useRef<number | null>(null);

  // Calculate percentages for colored track zones
  const p113 = Math.min(100, Math.max(0, (((1.13 * In) - min) / (max - min)) * 100));
  const p145 = Math.min(100, Math.max(0, (((1.45 * In) - min) / (max - min)) * 100));
  const currentPercentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const currentMultiple = (value / In).toFixed(2);

  const calculateValueFromPointer = useCallback((clientX: number): number => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const rawPercentage = relativeX / rect.width;
    let rawValue = min + rawPercentage * (max - min);

    // Check for magnetic snap points
    const snapThresholdAbs = (max - min) * 0.025; // 2.5% magnetic snap zone
    let activeSnap: number | null = null;

    for (const sp of snapPoints) {
      const snapVal = sp.multiple * In;
      if (Math.abs(rawValue - snapVal) <= snapThresholdAbs) {
        rawValue = snapVal;
        activeSnap = sp.multiple;
        break;
      }
    }

    // Trigger haptic feedback if snapped to a new point
    if (activeSnap !== null && activeSnap !== lastSnappedRef.current) {
      lastSnappedRef.current = activeSnap;
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch {
          // Ignore vibration block policy errors
        }
      }
    } else if (activeSnap === null) {
      lastSnappedRef.current = null;
    }

    // Quantize by step
    const stepped = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, parseFloat(stepped.toFixed(2))));
  }, [min, max, step, In, snapPoints, value]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const newValue = calculateValueFromPointer(e.clientX);
    onChange(newValue);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newValue = calculateValueFromPointer(e.clientX);
    onChange(newValue);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore release capture errors
    }
  };

  return (
    <div className={cn('flex flex-col gap-2 select-none touch-none', className)}>
      {/* Header Label and Values */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-300 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-xs">
            {value.toFixed(1)}{unit} ({currentMultiple}x In)
          </span>
        </div>
      </div>

      {/* Slider Container */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative py-4 cursor-pointer flex items-center group touch-none"
      >
        {/* Track (8px height) */}
        <div className="relative w-full h-2 rounded-full overflow-hidden bg-slate-800 border border-slate-700/50">
          {/* Green zone (0 - 1.13x In) */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-emerald-500/80"
            style={{ width: `${p113}%` }}
          />
          {/* Amber zone (1.13x - 1.45x In) */}
          <div
            className="absolute top-0 bottom-0 bg-amber-500/80"
            style={{ left: `${p113}%`, width: `${Math.max(0, p145 - p113)}%` }}
          />
          {/* Red zone (> 1.45x In) */}
          <div
            className="absolute top-0 bottom-0 right-0 bg-rose-500/80"
            style={{ left: `${p145}%` }}
          />

          {/* Active fill overlay */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/20 pointer-events-none"
            style={{ width: `${currentPercentage}%` }}
          />
        </div>

        {/* Magnetic Snap Markers */}
        {snapPoints.map((sp) => {
          const spVal = sp.multiple * In;
          if (spVal < min || spVal > max) return null;
          const posPct = ((spVal - min) / (max - min)) * 100;
          const isCurrentSnap = lastSnappedRef.current === sp.multiple;

          return (
            <div
              key={sp.multiple}
              className="absolute top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
              style={{ left: `${posPct}%` }}
            >
              <div
                className={cn(
                  'w-1.5 h-3 rounded-full transition-transform duration-150',
                  isCurrentSnap ? 'bg-white scale-125 ring-2 ring-emerald-400' : 'bg-slate-900/90 border border-slate-400'
                )}
              />
            </div>
          );
        })}

        {/* 44x44px Touch Target Container with 28x28px Visible Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none transition-transform active:scale-110"
          style={{
            left: `${currentPercentage}%`,
            width: '44px',
            height: '44px'
          }}
        >
          {/* Visible 28x28px Thumb */}
          <div
            className={cn(
              'w-[28px] h-[28px] rounded-full bg-white shadow-lg border-2 flex items-center justify-center transition-colors',
              value > 1.45 * In
                ? 'border-rose-500 shadow-rose-500/30'
                : value > 1.13 * In
                ? 'border-amber-500 shadow-amber-500/30'
                : 'border-emerald-500 shadow-emerald-500/30',
              isDragging ? 'ring-4 ring-white/20' : ''
            )}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                value > 1.45 * In ? 'bg-rose-500' : value > 1.13 * In ? 'bg-amber-500' : 'bg-emerald-500'
              )}
            />
          </div>
        </div>
      </div>

      {/* Snap Points Legend Labels below slider */}
      <div className="relative w-full h-4 text-[10px] text-slate-400 font-mono">
        {snapPoints.map((sp) => {
          const spVal = sp.multiple * In;
          if (spVal < min || spVal > max) return null;
          const posPct = ((spVal - min) / (max - min)) * 100;

          return (
            <button
              key={sp.multiple}
              type="button"
              onClick={() => onChange(spVal)}
              className="absolute -translate-x-1/2 hover:text-white transition-colors cursor-pointer"
              style={{ left: `${posPct}%` }}
            >
              {sp.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
