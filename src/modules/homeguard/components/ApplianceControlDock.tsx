/**
 * ApplianceControlDock.tsx
 * 
 * Interactive Floating Appliance Control Dock (Rec 1)
 * Designed specifically for non-electrical users to easily discover and toggle appliances.
 * 
 * Features:
 * - Clear room filter tabs (All, Living, Kitchen, Bath, Bedroom)
 * - Large, tactile iOS-style toggle pills ([ 🟢 ON ] / [ ⚪ OFF ])
 * - Clear wattage badges (e.g. "2,000W Heavy 🔴" vs "150W Light 🟢")
 * - 1-tap toggle with audio click and haptic feedback
 * - Collapsible drawer to preserve screen real-estate
 */

import React, { useState } from 'react';
import { HOMEGUARD_APPLIANCES, ApplianceDef } from '../data/homeguardAppliances';
import { homeguardAudio } from '../utils/homeguardAudio';
import { cn } from '@/src/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Check,
  Power,
  Flame,
  Snowflake,
  Info
} from 'lucide-react';

export interface ApplianceControlDockProps {
  activeApplianceIds: string[];
  onToggleAppliance: (applianceId: string) => void;
  isTripped?: boolean;
  className?: string;
}

export const ApplianceControlDock: React.FC<ApplianceControlDockProps> = ({
  activeApplianceIds,
  onToggleAppliance,
  isTripped = false,
  className
}) => {
  const [selectedRoom, setSelectedRoom] = useState<'all' | 'living' | 'kitchen' | 'bathroom' | 'bedroom'>('all');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const filteredAppliances = HOMEGUARD_APPLIANCES.filter(app => {
    if (selectedRoom === 'all') return true;
    return app.room === selectedRoom;
  });

  const activeCount = activeApplianceIds.length;
  const totalWatts = HOMEGUARD_APPLIANCES
    .filter(a => activeApplianceIds.includes(a.id))
    .reduce((sum, a) => sum + a.watts, 0);

  const handleToggle = (applianceId: string) => {
    // Audio tactile click
    homeguardAudio.playClickSound();

    // Haptic feedback for touch devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }

    onToggleAppliance(applianceId);
  };

  return (
    <div
      className={cn(
        "w-full transition-all duration-300 select-none z-30",
        className
      )}
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Dock Header & Summary Bar */}
        <div className="h-10 px-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          
          {/* Left: Title & Quick Active Count */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
              <Zap className="w-3 h-3" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-200 truncate">
              APPLIANCE SWITCHBOARD
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 shrink-0">
              {activeCount} ON ({totalWatts.toLocaleString()}W)
            </span>
          </div>

          {/* Center: Room Filter Tabs */}
          {!isCollapsed && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedRoom('all')}
                className={cn(
                  "px-2 py-0.5 rounded-lg transition-colors cursor-pointer",
                  selectedRoom === 'all' ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                All ({HOMEGUARD_APPLIANCES.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoom('living')}
                className={cn(
                  "px-2 py-0.5 rounded-lg transition-colors cursor-pointer",
                  selectedRoom === 'living' ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                🛋️ Living (C2)
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoom('kitchen')}
                className={cn(
                  "px-2 py-0.5 rounded-lg transition-colors cursor-pointer",
                  selectedRoom === 'kitchen' ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                🍳 Kitchen (C3)
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoom('bathroom')}
                className={cn(
                  "px-2 py-0.5 rounded-lg transition-colors cursor-pointer",
                  selectedRoom === 'bathroom' ? "bg-sky-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                🚿 Bath
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoom('bedroom')}
                className={cn(
                  "px-2 py-0.5 rounded-lg transition-colors cursor-pointer",
                  selectedRoom === 'bedroom' ? "bg-amber-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                🛏️ Bed
              </button>
            </div>
          )}

          {/* Right: Collapse / Expand Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(v => !v)}
            className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? "Expand Appliance Dock" : "Minimize Appliance Dock"}
          >
            <span>{isCollapsed ? "Show Appliances" : "Hide"}</span>
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Dock Content: Appliance Cards Grid (Hidden when collapsed) */}
        {!isCollapsed && (
          <div className="p-2 sm:p-2.5 overflow-x-auto no-scrollbar">
            <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 min-w-max sm:min-w-0">
              {filteredAppliances.map(app => {
                const isActive = activeApplianceIds.includes(app.id);

                return (
                  <div
                    key={app.id}
                    onClick={() => handleToggle(app.id)}
                    className={cn(
                      "w-44 sm:w-auto p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden group shadow-md active:scale-98",
                      isActive
                        ? "bg-slate-950/90 border-emerald-500/80 ring-1 ring-emerald-500/50"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-85 hover:opacity-100"
                    )}
                  >
                    {/* Top Row: Icon + Name + Room */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base shrink-0">{app.icon}</span>
                        <div className="min-w-0">
                          <span className={cn(
                            "text-[11px] font-black block truncate leading-tight",
                            isActive ? "text-white" : "text-slate-300"
                          )}>
                            {app.shortName}
                          </span>
                          <span className="text-[9px] text-slate-400 block truncate">
                            {app.roomLabel}
                          </span>
                        </div>
                      </div>

                      {/* Tactile iOS-Style Switch Pill */}
                      <div
                        className={cn(
                          "w-12 h-6 rounded-full p-0.5 flex items-center transition-all shrink-0 border",
                          isActive
                            ? "bg-emerald-500 border-emerald-400 justify-end shadow-sm shadow-emerald-500/50"
                            : "bg-slate-800 border-slate-700 justify-start"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center transition-transform",
                          isActive ? "text-emerald-600" : "text-slate-400"
                        )}>
                          <Power className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Wattage & Status Badge */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                      <span className={cn(
                        "font-bold font-mono",
                        app.loadCategory === 'heavy' ? "text-orange-400" :
                        app.loadCategory === 'medium' ? "text-cyan-400" :
                        "text-emerald-400"
                      )}>
                        {app.watts}W {app.loadCategory === 'heavy' ? '🔴' : app.loadCategory === 'medium' ? '🟡' : '🟢'}
                      </span>

                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                        isActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-400"
                      )}>
                        {isActive ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    {/* Active Accent Ambient Glow Bar */}
                    {isActive && (
                      <div
                        className="absolute bottom-0 inset-x-0 h-0.5"
                        style={{ backgroundColor: app.loadColor }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
