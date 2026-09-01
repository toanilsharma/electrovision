import React, { useState, useEffect, useRef } from 'react';
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
import { MCBState, TripCause, SimulationSnapshot, MCBTrippingCurve } from '../../mcb/types';
import { CanvasTCCChart } from './CanvasTCCChart';
import { cn } from '@/src/lib/utils';

export interface AlertFeedItem {
  id: string;
  timeMs: number;
  title: string;
  detail: string;
  type: 'info' | 'warning' | 'danger' | 'trip';
  icon: 'zap' | 'flame' | 'magnet' | 'shield' | 'clock';
  durationMs?: number;
}

interface MCBHazardConsoleProps {
  snapshot: SimulationSnapshot | null;
  In: number;
  curve: MCBTrippingCurve;
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

  // Track overload sessions for de-duplication
  const overloadSessionRef = useRef<{
    active: boolean;
    startTimeMs: number;
    itemId: string;
    lastFaultCurrent: number;
  }>({
    active: false,
    startTimeMs: 0,
    itemId: '',
    lastFaultCurrent: 0
  });

  const lastTrippedStateRef = useRef<boolean>(false);

  // Helper for magnetic bounds
  const getMagLimits = (c: MCBTrippingCurve) => {
    switch (c) {
      case 'B': return { min: 3, max: 5 };
      case 'D': return { min: 10, max: 20 };
      case 'C':
      default: return { min: 5, max: 10 };
    }
  };

  // Automatically update alert feed items on state/physics events
  useEffect(() => {
    if (!snapshot) return;

    const simTimeMs = Math.max(1, Math.round(snapshot.time * 1000));
    const multiplier = faultCurrent / In;
    const { min: magMin, max: magMax } = getMagLimits(curve);

    // 1. OVERLOAD DE-DUPLICATION WITH LIVE DURATION
    const isCurrentlyOverloaded = faultCurrent > 1.13 * In && snapshot.state === MCBState.CLOSED;

    if (isCurrentlyOverloaded) {
      if (!overloadSessionRef.current.active) {
        // Start a new overload session
        const itemId = `overload-${Date.now()}`;
        overloadSessionRef.current = {
          active: true,
          startTimeMs: simTimeMs,
          itemId,
          lastFaultCurrent: faultCurrent
        };

        let title = `CONVENTIONAL SLOW THERMAL (1.13–1.45× In)`;
        let detail = `Continuous loading at ${multiplier.toFixed(2)}× In (${faultCurrent.toFixed(1)} A). Bimetal heating active.`;

        if (multiplier > 1.45 && multiplier < magMin) {
          title = `THERMAL OVERLOAD ZONE (1.45–${magMin}× In)`;
          detail = `Thermal overload at ${multiplier.toFixed(2)}× In (${faultCurrent.toFixed(1)} A). Deflection active, trip band 1–60s.`;
        } else if (multiplier >= magMin && multiplier <= magMax) {
          title = `MAGNETIC TOLERANCE ZONE (${magMin}–${magMax}× In)`;
          detail = `Operating in magnetic tolerance band (${multiplier.toFixed(2)}× In, ${faultCurrent.toFixed(1)} A). Solenoid armed.`;
        } else if (multiplier > magMax) {
          title = `INSTANTANEOUS SHORT-CIRCUIT (> ${magMax}× In)`;
          detail = `Fault current exceeds upper magnetic limit (> ${magMax}× In at ${faultCurrent.toFixed(1)} A). Instantaneous trip armed (<10ms).`;
        }

        const newItem: AlertFeedItem = {
          id: itemId,
          timeMs: simTimeMs,
          title,
          detail: `${detail} | Duration: 0 ms`,
          type: multiplier >= magMin ? 'danger' : 'warning',
          icon: multiplier >= magMin ? 'magnet' : 'flame',
          durationMs: 0
        };

        setFeedItems((prev) => [newItem, ...prev.filter(i => i.id !== itemId)].slice(0, 30));
      } else {
        // Update the live duration on the existing overload item
        const duration = Math.max(0, simTimeMs - overloadSessionRef.current.startTimeMs);
        const activeId = overloadSessionRef.current.itemId;

        setFeedItems((prev) =>
          prev.map((item) => {
            if (item.id === activeId) {
              let baseDetail = item.detail.split(' | Duration:')[0];
              return {
                ...item,
                detail: `${baseDetail} | Duration: ${duration} ms (T: ${snapshot.thermal.temperature.toFixed(1)}°C)`,
                durationMs: duration
              };
            }
            return item;
          })
        );
      }
    } else {
      // Not overloaded or circuit opened -> close overload session
      overloadSessionRef.current.active = false;
    }

    // 2. MAGNETIC PICKUP EVENT
    if (snapshot.magnetic.isTripped && !lastTrippedStateRef.current) {
      const isShortCircuit = multiplier > magMax;
      const magItem: AlertFeedItem = {
        id: `mag-${simTimeMs}-${Date.now()}`,
        timeMs: simTimeMs,
        title: isShortCircuit
          ? `INSTANTANEOUS SHORT-CIRCUIT (> ${magMax}× In)`
          : `MAGNETIC TOLERANCE ZONE (${magMin}–${magMax}× In)`,
        detail: isShortCircuit
          ? `Instantaneous magnetic short-circuit (> ${magMax}× In): solenoid fired at ${(snapshot.magnetic.peakCurrent || faultCurrent * 1.414).toFixed(1)} A peak.`
          : `Magnetic tolerance zone (${magMin}–${magMax}× In): solenoid fired at ${(snapshot.magnetic.peakCurrent || faultCurrent * 1.414).toFixed(1)} A peak.`,
        type: 'danger',
        icon: 'magnet'
      };

      setFeedItems((prev) => [magItem, ...prev].slice(0, 30));
    }

    // 3. TRIP COMPLETED EVENT
    if (snapshot.state === MCBState.OPEN_CLEARED && !lastTrippedStateRef.current) {
      lastTrippedStateRef.current = true;
      const clearingMs = Math.max(1, Math.round(snapshot.letThrough.clearingTime * 1000));
      const tripTimeMs = Math.max(clearingMs, simTimeMs);

      let tripTitle = `MCB TRIPPED & CLEARED (${snapshot.tripCause})`;
      let tripDetail = `Clearing time: ${(snapshot.letThrough.clearingTime * 1000).toFixed(1)} ms | Let-through I²t: ${snapshot.letThrough.i2t.toFixed(1)} A²s`;

      if (snapshot.tripCause === TripCause.THERMAL) {
        tripTitle = `THERMAL TRIP CLEARED (1.13–${magMin}× In)`;
        tripDetail = `Bimetal reached 130°C latch threshold at ${tripTimeMs} ms | Clearing time: ${(snapshot.letThrough.clearingTime * 1000).toFixed(1)} ms | I²t: ${snapshot.letThrough.i2t.toFixed(1)} A²s`;
      } else if (snapshot.tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE) {
        tripTitle = `MAGNETIC TOLERANCE TRIP (${magMin}–${magMax}× In)`;
        tripDetail = `Magnetic tolerance zone (${magMin}–${magMax}× In): solenoid plunger unlatched in ${(snapshot.letThrough.clearingTime * 1000).toFixed(1)} ms | I²t: ${snapshot.letThrough.i2t.toFixed(1)} A²s`;
      } else if (snapshot.tripCause === TripCause.MAGNETIC) {
        tripTitle = `INSTANTANEOUS SHORT-CIRCUIT TRIP (> ${magMax}× In)`;
        tripDetail = `Instantaneous magnetic trip (> ${magMax}× In): solenoid cleared in ${(snapshot.letThrough.clearingTime * 1000).toFixed(1)} ms | Peak: ${(snapshot.magnetic.peakCurrent || faultCurrent * 1.414).toFixed(1)} A | I²t: ${snapshot.letThrough.i2t.toFixed(1)} A²s`;
      }

      const tripItem: AlertFeedItem = {
        id: `trip-${tripTimeMs}-${Date.now()}`,
        timeMs: tripTimeMs,
        title: tripTitle,
        detail: tripDetail,
        type: 'trip',
        icon: 'shield'
      };

      setFeedItems((prev) => [tripItem, ...prev].slice(0, 30));
    }

    if (snapshot.state === MCBState.CLOSED) {
      lastTrippedStateRef.current = false;
    }
  }, [snapshot?.state, snapshot?.tripCause, snapshot?.time, faultCurrent, In, curve]);

  return (
    <div className={cn("relative flex h-full select-none font-mono", className)}>
      
      {/* 48px COLLAPSED RIGHT ICON RAIL (PERMANENT FIXED ANCHOR) */}
      <div className="w-[48px] h-full bg-slate-900 border-l border-slate-800 flex flex-col items-center justify-between py-3 shrink-0 z-30">
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

      {/* OVERLAY DRAWER (POSITION: ABSOLUTE RIGHT, ZERO GRID REFLOW, SLIDES OVER CONTENT) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for click-to-close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggleOpen}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden"
            />

            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="absolute top-0 right-[48px] h-full w-[360px] max-w-[calc(100vw-56px)] bg-slate-900/98 border-l border-slate-750 flex flex-col overflow-hidden shadow-[-12px_0_30px_rgba(0,0,0,0.75)] z-50"
            >
              {/* Drawer Header */}
              <div className="h-[48px] px-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
                <span className="text-xs font-black uppercase text-white flex items-center gap-2">
                  {activeTab === 'alerts' && <Zap className="w-4 h-4 text-emerald-400" />}
                  {activeTab === 'tcc' && <BarChart3 className="w-4 h-4 text-sky-400" />}
                  {activeTab === 'trace' && <FileText className="w-4 h-4 text-amber-400" />}
                  {activeTab === 'safety' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                  {activeTab.toUpperCase()} CONSOLE
                </span>
                <button
                  onClick={onToggleOpen}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Console"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body Content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3 text-xs">
                {activeTab === 'alerts' && (
                  <div className="space-y-2.5">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block tracking-wider">
                      Live Animated Hazard Feed
                    </span>
                    {feedItems.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs leading-relaxed">
                        No active hazard alerts recorded. Apply fault current to inspect live feed.
                      </div>
                    ) : (
                      feedItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-3 rounded-xl border flex flex-col gap-1.5 shadow-md",
                            item.type === 'danger' ? "bg-rose-950/70 border-rose-500/60 text-rose-200" :
                            item.type === 'warning' ? "bg-amber-950/70 border-amber-500/60 text-amber-200" :
                            item.type === 'trip' ? "bg-purple-950/70 border-purple-500/60 text-purple-200" :
                            "bg-slate-950 border-slate-800 text-slate-300"
                          )}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="flex items-center gap-1.5">
                              {item.icon === 'flame' && <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              {item.icon === 'magnet' && <Magnet className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                              {item.icon === 'shield' && <ShieldAlert className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                              <span className="truncate">{item.title}</span>
                            </span>
                            <span className="text-slate-400 text-[11px] tabular-nums shrink-0 ml-1">
                              {item.timeMs} ms
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{item.detail}</p>
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
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                      <span className="font-bold text-emerald-400 text-xs block">IEC 60898-1 Derivations</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        <strong className="text-white">1. Bimetal Thermal Equation:</strong><br />
                        <span className="text-amber-300 font-mono">dT/dt = (I²·R_th - (T - T_amb)) / C_th</span>
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        <strong className="text-white">2. Ambient Derating:</strong><br />
                        <span className="text-amber-300 font-mono">In_eff = In · [1 - 0.005 · (Tamb - 30)]</span>
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        <strong className="text-white">3. IEC 60909 κ-Peak Factor:</strong><br />
                        <span className="text-amber-300 font-mono">κ = 1.02 + 0.98 · e^(-3 / (X/R))</span>
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        <strong className="text-white">4. Let-Through Energy:</strong><br />
                        <span className="text-amber-300 font-mono">I²t = ∫ i(t)² dt (A²s)</span>
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'safety' && (
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 space-y-2">
                      <span className="font-bold text-rose-300 text-xs block mb-1">SAFETY &amp; HAZARD RULES</span>
                      <ul className="list-disc list-inside space-y-1.5 text-[11px] leading-relaxed">
                        <li>Never reset an MCB immediately after a short-circuit trip without inspecting line impedance.</li>
                        <li>Hot re-close (bimetal &gt;60°C) accelerates thermal tripping time due to accumulated thermal memory.</li>
                        <li>DC currents lack natural zero crossings, drawing longer plasma arcs across splitter plates.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
