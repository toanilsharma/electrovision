import React from 'react';
import { cn } from '@/src/lib/utils';
import { FastForward } from 'lucide-react';

export interface TimeWarpBarProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  speeds?: readonly number[];
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export const TimeWarpBar: React.FC<TimeWarpBarProps> = ({
  speed,
  onSpeedChange,
  speeds = [0.25, 1, 10, 100],
  label = 'TIME WARP:',
  showIcon = false,
  className
}) => {
  return (
    <div
      data-tour="timewarp"
      className={cn(
        "flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] shrink-0 gap-0.5 font-mono select-none",
        className
      )}
    >
      {showIcon && <FastForward className="w-3.5 h-3.5 text-orange-400 ml-1 shrink-0" />}
      {label && <span className="text-slate-400 font-bold px-1.5 hidden md:inline">{label}</span>}
      {speeds.map((s) => (
        <button
          key={s}
          onClick={() => onSpeedChange(s)}
          className={cn(
            "px-2 py-0.5 rounded font-black transition-all cursor-pointer min-h-[30px] shrink-0",
            speed === s
              ? "bg-orange-500 text-slate-950 shadow font-black"
              : "text-slate-400 hover:text-white"
          )}
          title={`Set simulation time warp speed to ${s}x`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
};
