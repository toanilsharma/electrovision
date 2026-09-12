import React, { useMemo } from 'react';
import { cn } from '@/src/lib/utils';

export interface SmileyGaugeProps {
  percentage: number; // 0 - 150+
  isTripped?: boolean;
  isFault?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const SmileyGauge: React.FC<SmileyGaugeProps> = ({
  percentage,
  isTripped = false,
  isFault = false,
  size = 'md',
  showLabel = true,
  className
}) => {
  // Determine active emotional state
  const state = useMemo(() => {
    if (isTripped || isFault || percentage > 100) {
      return {
        emoji: '🚨',
        label: isTripped ? 'Power Cut Safely!' : 'Danger! Danger!',
        color: 'text-red-500',
        bg: 'bg-red-50 border-red-200',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        zone: 'danger',
        angle: 60 // right side
      };
    }
    if (percentage > 70) {
      return {
        emoji: '😐',
        label: 'Getting Warm...',
        color: 'text-amber-500',
        bg: 'bg-amber-50 border-amber-200',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
        zone: 'warn',
        angle: 0 // top center
      };
    }
    return {
      emoji: '😊',
      label: 'All Safe & Happy',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 border-emerald-200',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      zone: 'safe',
      angle: -60 // left side
    };
  }, [percentage, isTripped, isFault]);

  // Needle angle from -70 deg to +70 deg
  const needleAngle = useMemo(() => {
    if (isTripped) return 70;
    const clamped = Math.min(130, Math.max(0, percentage));
    // 0% -> -70deg, 100% -> +50deg, 130% -> +70deg
    return -70 + (clamped / 100) * 120;
  }, [percentage, isTripped]);

  const dimensions = {
    sm: { width: 110, height: 75, radius: 42, stroke: 8, emojiSize: 'text-2xl', text: 'text-xs' },
    md: { width: 140, height: 95, radius: 54, stroke: 10, emojiSize: 'text-3xl', text: 'text-sm' },
    lg: { width: 180, height: 120, radius: 70, stroke: 12, emojiSize: 'text-4xl', text: 'text-base' }
  }[size];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 select-none",
      state.bg,
      state.glow,
      "border",
      className
    )}>
      {/* Gauge SVG */}
      <div className="relative flex items-center justify-center">
        <svg 
          width={dimensions.width} 
          height={dimensions.height} 
          viewBox="0 0 140 95" 
          className="overflow-visible"
        >
          {/* Background tracks */}
          <path
            d="M 20 80 A 50 50 0 0 1 50 35"
            fill="none"
            stroke="#10b981"
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 54 32 A 50 50 0 0 1 86 32"
            fill="none"
            stroke="#f59e0b"
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 90 35 A 50 50 0 0 1 120 80"
            fill="none"
            stroke="#ef4444"
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Center Emoji Face */}
          <text 
            x="70" 
            y="65" 
            textAnchor="middle" 
            dominantBaseline="central" 
            className="text-2xl transition-transform duration-300"
          >
            {state.emoji}
          </text>

          {/* Sweeping Indicator Needle */}
          <g 
            transform={`translate(70, 78) rotate(${needleAngle})`} 
            className="transition-transform duration-500 ease-out"
          >
            <polygon points="-3,-5 0,-48 3,-5" fill="#1e293b" />
            <circle cx="0" cy="0" r="4.5" fill="#1e293b" />
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Friendly Emotion Label */}
      {showLabel && (
        <span className={cn(
          "font-extrabold tracking-tight text-center mt-1 leading-tight",
          dimensions.text,
          state.color
        )}>
          {state.label}
        </span>
      )}
    </div>
  );
};
