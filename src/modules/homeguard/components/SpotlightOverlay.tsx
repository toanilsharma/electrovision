/**
 * SpotlightOverlay.tsx
 * 
 * SPOTLIGHT SYSTEM for HomeGuard Simple Shell:
 * - Dims everything except the focused element to 30% brightness (70% opacity dark veil)
 * - Highlights the focused target with a soft pulsing halo ring
 * - Annotates tap target with an attention-grabbing bouncing hand 👆
 * - Direct tap on the spotlight zone or hand triggers the action seamlessly
 */

import React from 'react';
import { cn } from '@/src/lib/utils';

export interface SpotlightOverlayProps {
  /** Target coordinates relative to 720x540 SVG stage or container */
  targetCoords?: { x: number; y: number; radius: number } | null;
  /** Whether the spotlight is active */
  isActive: boolean;
  /** Callback when the user taps directly on the spotlighted area */
  onTargetTap: () => void;
  /** Optional target label */
  targetLabel?: string;
  /** Container dimensions or style hook */
  className?: string;
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
  targetCoords,
  isActive,
  onTargetTap,
  targetLabel,
  className
}) => {
  if (!isActive || !targetCoords) return null;

  // Convert coordinate percentages based on 720x540 viewBox
  const leftPct = (targetCoords.x / 720) * 100;
  const topPct = (targetCoords.y / 540) * 100;

  return (
    <div 
      className={cn(
        "absolute inset-0 z-20 pointer-events-none select-none transition-opacity duration-300",
        className
      )}
    >
      {/* SVG Mask to create 70% dimming veil with 100% clear cutout circle */}
      <svg className="w-full h-full absolute inset-0">
        <defs>
          <mask id="spotlight-mask">
            {/* White area = keep background veil */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout = clear hole for spotlight */}
            <circle
              cx={`${leftPct}%`}
              cy={`${topPct}%`}
              r={targetCoords.radius || 60}
              fill="black"
            />
          </mask>
        </defs>

        {/* 70% Dimming Overlay (Leaves spotlight 100% visible, rest is 30% brightness) */}
        <rect
          x="0"
          y="0"
          width="100%" height="100%"
          fill="rgba(15, 23, 42, 0.70)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Interactive Interactive Clickable Target with Pulsing Halo & Bouncing Hand */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer flex flex-col items-center justify-center"
        style={{
          left: `${leftPct}%`,
          top: `${topPct}%`,
          width: `${(targetCoords.radius || 60) * 2}px`,
          height: `${(targetCoords.radius || 60) * 2}px`
        }}
        onClick={(e) => {
          e.stopPropagation();
          onTargetTap();
        }}
        role="button"
        tabIndex={0}
        aria-label={targetLabel || "Tap this highlighted target"}
      >
        {/* Soft Pulse Ring (Outer glow) */}
        <div className="absolute inset-0 rounded-full border-4 border-amber-400/80 animate-ping opacity-60 pointer-events-none" />

        {/* Soft Glow Ring (Middle) */}
        <div className="absolute inset-1 rounded-full border-3 border-amber-300 bg-amber-400/10 shadow-[0_0_25px_rgba(251,191,36,0.8)] pointer-events-none" />

        {/* Bouncing Hand 👆 (Positioned right above or inside the target) */}
        <div className="absolute -top-12 flex flex-col items-center animate-bounce z-30 pointer-events-none">
          <span className="text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform -scale-x-100">
            👆
          </span>
          {targetLabel && (
            <span className="mt-1 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-lg uppercase tracking-wide border-2 border-white whitespace-nowrap">
              {targetLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
