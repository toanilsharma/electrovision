import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  AlertTriangle,
  Flame,
  Magnet,
  ShieldAlert,
  BarChart3,
  FileText,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';
import { MCBState, TripCause, SimulationSnapshot } from '../../mcb/types';
import { CanvasTCCChart } from './CanvasTCCChart';
import { cn } from '@/src/lib/utils';

export interface AlertFeedItem {
  id: string;
  timeMs: number;
  title: string;
  detail: string;
  type: 'info' | 'warning' | 'danger' | 'trip';
  icon: 'zap' | 'flame' | 'magnet' | 'shield' | 'clock';
}

interface MCBHazardConsoleProps {
  snapshot: SimulationSnapshot | null;
  In: number;
  curve: 'B' | 'C' | 'D';
  faultCurrent: number;
  ambientTemp: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  className?: string;
}

export const MCBHazardConsole: React.FC<MCBHazardConsoleProps> = ({
  snapshot,
  In,
  curve,
  faultCurrent,
  ambientTemp,
  isOpen,
  onToggleOpen,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'tcc' | 'trace' | 'safety'>('alerts');
  const [feedItems, setFeedItems] = useState<AlertFeedItem[]>([]);

  // Automatically add alert feed items on state/physics events
  useEffect(() => {
    if (!snapshot) return;

    const newItems: AlertFeedItem[] = [];
    const timeMs = Math.round(snapshot.time * 1000);

    // Overload alert (>1.13In)
    if (faultCurrent > 1.13 * In && snapshot.state === MCBState.CLOSED) {
      newItems.push({
        id: `overload-${timeMs}`,
        timeMs,
        title: `OVERLOAD >1.13In (${(faultCurrent / In).toFixed(2)}x In)`,
        detail: `Continuous loading exceeds 1.13x In non-tripping threshold. Bimetal heating active.`,
        type: 'warning',
        icon: 'flame'
      });
    }

    // Magnetic Pickup
    if (snapshot.magnetic.isTripped) {
      newItems.push({
        id: `mag-${timeMs}`,
        timeMs,
        title: `MAGNETIC PICKUP TRIGGERED (<10ms)`,
        detail: `Instantaneous electromagnetic solenoid fired at ${snapshot.magnetic.peakCurrent.toFixed(1)}A peak.`,
        type: 'danger',
        icon: 'magnet'
      });
    }

    // Trip Completed
    if (snapshot.state === MCBState.OPEN_CLEARED) {
      newItems.push({
        id: `trip-${timeMs}`,
        timeMs,
        title: `MCB TRIPPED & CLEARED (${snapshot.tripCause})`,
        detail: `Clearing time: ${(snapshot.letThrough.clearingTime * 1000).toFixed(1)}ms | Let-through I²t: ${snapshot.letThrough.i2t.toFixed(1)} A²s`,
        type: 'trip',
        icon: 'shield'
      });
    }

    if (newItems.length > 0) {
      setFeedItems((prev) => [...newItems, ...prev].slice(0, 30));
    }
  }, [snapshot?.state, snapshot?.tripCause, faultCurrent, In]);

  return (
    <div className={cn("relative flex h-full z-40 select-none font-mono", className)}>
      
      {/* 48px COLLAPSED RIGHT ICON RAIL */}
      <div className="w-[48px] h-full bg-slate-900 border-l border-slate-800 flex flex-col items-center justify-between py-3 shrink-0">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onToggleOpen}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
            title={isOpen ? "Collapse Rail" : "Expand Rail"}
          >
            {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {/* Tab Buttons */}
          {(['alerts', 'tcc', 'trace', 'safety'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (!isOpen) onToggleOpen();
              }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative",
                activeTab === tab && isOpen
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "bg-slate-800/80 text-slate-400 hover:text-white"
              )}
              title={tab.toUpperCase()}
            >
              {tab === 'alerts' && <Zap className="w-4 h-4" />}
              {tab === 'tcc' && <BarChart3 className="w-4 h-4" />}
              {tab === 'trace' && <FileText className="w-4 h-4" />}
              {tab === 'safety' && <ShieldAlert className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* EXPANDABLE HAZARD CONSOLE DRAWER (360px) */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="h-full bg-slate-900/95 border-l border-slate-800 flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="h-[48px] px-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
              <span className="text-xs font-black uppercase text-white flex items-center gap-2">
                {activeTab === 'alerts' && <Zap className="w-4 h-4 text-emerald-400" />}
                {activeTab === 'tcc' && <BarChart3 className="w-4 h-4 text-sky-400" />}
                {activeTab === 'trace' && <FileText className="w-4 h-4 text-amber-400" />}
                {activeTab === 'safety' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                {activeTab.toUpperCase()} CONSOLE
              </span>
              <button
                onClick={onToggleOpen}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-xs">
              {activeTab === 'alerts' && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Live Animated Hazard Feed</span>
                  {feedItems.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500">
                      No active hazard alerts recorded. Apply fault current to inspect feed.
                    </div>
                  ) : (
                    feedItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-2.5 rounded-xl border flex flex-col gap-1",
                          item.type === 'danger' ? "bg-rose-950/60 border-rose-500/50 text-rose-200" :
                          item.type === 'warning' ? "bg-amber-950/60 border-amber-500/50 text-amber-200" :
                          item.type === 'trip' ? "bg-purple-950/60 border-purple-500/50 text-purple-200" :
                          "bg-slate-950 border-slate-800 text-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="flex items-center gap-1">
                            {item.icon === 'flame' && <Flame className="w-3 h-3 text-amber-400" />}
                            {item.icon === 'magnet' && <Magnet className="w-3 h-3 text-rose-400" />}
                            {item.icon === 'shield' && <ShieldAlert className="w-3 h-3 text-purple-400" />}
                            {item.title}
                          </span>
                          <span className="text-slate-400">{item.timeMs} ms</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{item.detail}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'tcc' && (
                <CanvasTCCChart
                  ratedCurrent={In}
                  faultCurrent={faultCurrent}
                  activeCurve={curve}
                  bimetalTemp={snapshot?.thermal.temperature || ambientTemp}
                  isTripped={snapshot?.state === MCBState.OPEN_CLEARED}
                />
              )}

              {activeTab === 'trace' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-400 text-xs block">IEC 60898-1 Derivations</span>
                    <p className="text-[11px] text-slate-300">
                      <strong>1. Bimetal Equation:</strong><br />
                      dT/dt = (I²·R_th - (T - T_amb)) / C_th
                    </p>
                    <p className="text-[11px] text-slate-300">
                      <strong>2. Ambient Derating:</strong><br />
                      In_eff = In · [1 - 0.005 · (Tamb - 30)]
                    </p>
                    <p className="text-[11px] text-slate-300">
                      <strong>3. IEC 60909 κ-Peak Factor:</strong><br />
                      κ = 1.02 + 0.98 · e^(-3 / (X/R))
                    </p>
                    <p className="text-[11px] text-slate-300">
                      <strong>4. Let-Through Energy:</strong><br />
                      I²t = ∫ i(t)² dt (A²s)
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'safety' && (
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-200">
                    <span className="font-bold text-rose-300 block mb-1">SAFETY & HAZARD RULES</span>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li>Never reset an MCB immediately after a short-circuit trip without inspecting line impedance.</li>
                      <li>Hot re-close (bimetal &gt;60°C) accelerates thermal tripping time due to accumulated thermal memory.</li>
                      <li>DC currents lack natural zero crossings, drawing longer plasma arcs across splitter plates.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

    </div>
  );
};
