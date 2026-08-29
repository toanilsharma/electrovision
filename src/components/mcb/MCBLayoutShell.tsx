import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  RotateCcw,
  Play,
  Pause,
  SlidersHorizontal,
  BarChart3,
  Flame,
  Magnet,
  ShieldCheck,
  Info,
  Layers,
  Volume2,
  VolumeX
} from 'lucide-react';

import { MCBSimulator } from '../../mcb/MCBSimulator';
import { BimetalThermalModel } from '../../mcb/BimetalThermalModel';
import { CustomSnapSlider } from './CustomSnapSlider';
import { BottomSheet } from './BottomSheet';
import { SingleLineDiagram } from './SingleLineDiagram';
import { BreakerCutaway } from './BreakerCutaway';

import { CanvasOscilloscope } from './CanvasOscilloscope';
import { CanvasTCCChart } from './CanvasTCCChart';

import { useHaptics } from '../../hooks/useHaptics';
import { useArcFlash } from '../../hooks/useArcFlash';
import { useAudioTrip } from '../../hooks/useAudioTrip';
import { useMCBWorker } from '../../hooks/useMCBWorker';

import { MCBState, MCBTrippingCurve, SimulationSnapshot, TripCause } from '../../mcb/types';
import { cn } from '@/src/lib/utils';

export const MCBLayoutShell: React.FC = () => {
  // Simulator configuration state
  const [ratedCurrent, setRatedCurrent] = useState<number>(16);
  const [curve, setCurve] = useState<MCBTrippingCurve>('C');
  const [ambientTemp, setAmbientTemp] = useState<number>(30);
  const [faultCurrent, setFaultCurrent] = useState<number>(23.2); // Default ~1.45x In
  const [xrRatio, setXrRatio] = useState<number>(5);
  const [inceptionAngleDeg, setInceptionAngleDeg] = useState<number>(45);

  // Simulation execution state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentSnapshot, setCurrentSnapshot] = useState<SimulationSnapshot | null>(null);

  // Visceral Animation & Sound State
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [centerView, setCenterView] = useState<'sld' | 'cutaway'>('sld');

  // Mobile layout state
  const [mobileTab, setMobileTab] = useState<'sld' | 'charts' | 'controls'>('sld');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(false);
  const [expandedTooltip, setExpandedTooltip] = useState<string | null>(null);

  // Visceral Feedback Hooks
  const { triggerOverloadHaptic, triggerShortCircuitHaptic } = useHaptics();
  const { triggerArcFlash, ArcFlashOverlay } = useArcFlash();
  const { playTripAudio } = useAudioTrip();

  // High-Performance Web Worker Pipeline Hook
  const { data: workerData, calculateWaveform } = useMCBWorker();

  // Simulator instance ref
  const simulatorRef = useRef<MCBSimulator>(
    new MCBSimulator(BimetalThermalModel.createCalibratedSpec(16, 'C', 30), 30)
  );

  const previousStateRef = useRef<MCBState>(MCBState.CLOSED);

  // Re-initialize simulator and compute background worker waveform when parameters change
  useEffect(() => {
    const spec = BimetalThermalModel.createCalibratedSpec(ratedCurrent, curve, ambientTemp);
    simulatorRef.current = new MCBSimulator(spec, ambientTemp);

    calculateWaveform({
      In: ratedCurrent,
      curve,
      ambientTemp,
      faultCurrent,
      xrRatio,
      inceptionAngleDeg
    });

    resetSimulation();
  }, [ratedCurrent, curve, ambientTemp, faultCurrent, xrRatio, inceptionAngleDeg, calculateWaveform]);

  const resetSimulation = useCallback(() => {
    setIsSimulating(false);
    previousStateRef.current = MCBState.CLOSED;
    simulatorRef.current.reset(ambientTemp);
    simulatorRef.current.setFaultWaveform({
      I_rms: faultCurrent,
      frequency: 50,
      inceptionAngle: (inceptionAngleDeg * Math.PI) / 180,
      xrRatio: xrRatio
    });
    const initialSnap = simulatorRef.current.step(0, faultCurrent);
    setCurrentSnapshot(initialSnap);
  }, [ambientTemp, faultCurrent, inceptionAngleDeg, xrRatio]);

  // Handle Visceral Trip Effects
  const handleTripVisceralEffects = useCallback((snap: SimulationSnapshot) => {
    const isShortCircuit = snap.tripCause === TripCause.MAGNETIC || snap.tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE;

    // 1. Audio Cue
    if (!isSoundMuted) {
      playTripAudio(isShortCircuit);
    }

    // 2. Haptics Feedback
    if (isShortCircuit) {
      triggerShortCircuitHaptic();
    } else {
      triggerOverloadHaptic();
    }

    // 3. Arc Flash & Screen Shake
    if (isShortCircuit || snap.current > 5 * ratedCurrent) {
      triggerArcFlash();
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 300);
    }
  }, [isSoundMuted, playTripAudio, triggerShortCircuitHaptic, triggerOverloadHaptic, triggerArcFlash, ratedCurrent]);

  // Run live animation step loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (!isSimulating) return;

      const elapsedRealSec = (now - lastTime) / 1000;
      lastTime = now;

      // Step interval
      const dt = faultCurrent > 3 * ratedCurrent ? 0.0002 : 1.0;

      const snap = simulatorRef.current.step(dt, faultCurrent);
      setCurrentSnapshot(snap);

      // Check state transition from CLOSED to UNLATCHED/ARCING
      if (previousStateRef.current === MCBState.CLOSED && snap.state !== MCBState.CLOSED) {
        handleTripVisceralEffects(snap);
      }
      previousStateRef.current = snap.state;

      if (snap.state === MCBState.OPEN_CLEARED) {
        setIsSimulating(false);
        return;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    if (isSimulating) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isSimulating, faultCurrent, ratedCurrent, handleTripVisceralEffects]);

  // Fast thermal test simulation runner
  const handleRunThermalFastTest = (multiple: number) => {
    resetSimulation();
    const testCurrent = multiple * ratedCurrent;
    setFaultCurrent(testCurrent);

    const result = simulatorRef.current.runThermalSimulation(testCurrent, 3600, 5.0);
    setCurrentSnapshot(result);

    if (result.state !== MCBState.CLOSED) {
      handleTripVisceralEffects(result);
    }
  };

  // Render Controls Form
  const renderControls = () => (
    <div className="flex flex-col gap-5 text-slate-200">
      {/* Rated Current & Curve Selection */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Rated Current (In)</label>
          <select
            value={ratedCurrent}
            onChange={(e) => setRatedCurrent(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={6}>6A</option>
            <option value={10}>10A</option>
            <option value={16}>16A</option>
            <option value={25}>25A</option>
            <option value={32}>32A</option>
            <option value={63}>63A</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Tripping Curve</label>
          <div className="grid grid-cols-3 gap-1">
            {(['B', 'C', 'D'] as MCBTrippingCurve[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurve(c)}
                className={cn(
                  'py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer',
                  curve === c
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                )}
              >
                Curve {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ambient Temperature Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs">
          <span className="font-semibold text-slate-400">Ambient Temperature (Tamb)</span>
          <span className="font-mono text-amber-400">{ambientTemp}°C</span>
        </div>
        <input
          type="range"
          min={10}
          max={60}
          value={ambientTemp}
          onChange={(e) => setAmbientTemp(Number(e.target.value))}
          className="accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
        />
        <span className="text-[10px] text-slate-400">
          Ref: 30°C. Ambient derating: -0.5%/°C above 30°C
        </span>
      </div>

      {/* Touch-Optimized Custom Snap Slider */}
      <CustomSnapSlider
        label="Load / Fault Current (I_rms)"
        value={faultCurrent}
        min={0}
        max={15 * ratedCurrent}
        In={ratedCurrent}
        onChange={(val) => setFaultCurrent(val)}
      />

      {/* Waveform Parameters */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400">X/R Ratio (τ)</label>
          <input
            type="number"
            min={1}
            max={30}
            value={xrRatio}
            onChange={(e) => setXrRatio(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400">Fault Angle (θ)</label>
          <input
            type="number"
            min={0}
            max={180}
            value={inceptionAngleDeg}
            onChange={(e) => setInceptionAngleDeg(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200"
          />
        </div>
      </div>

      {/* Preset Compliance Buttons */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
        <span className="text-xs font-semibold text-slate-400">IEC 60898-1 Compliance Tests</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleRunThermalFastTest(1.13)}
            className="py-2.5 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1.13x In (No Trip)</span>
          </button>

          <button
            type="button"
            onClick={() => handleRunThermalFastTest(1.45)}
            className="py-2.5 px-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Flame className="w-4 h-4" />
            <span>1.45x In (Trip &le; 1h)</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Control Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => setIsSimulating(!isSimulating)}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer',
            isSimulating
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
          )}
        >
          {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isSimulating ? 'Pause Simulation' : 'Run Real-time Fault'}</span>
        </button>

        <button
          type="button"
          onClick={resetSimulation}
          className="py-3 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          title="Reset Simulation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none touch-manipulation overscroll-none relative">
      {/* Arc Flash Overlay */}
      <ArcFlashOverlay />

      {/* Header Bar */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800 py-3 px-4 sticky top-0 z-30 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-none">IEC 60898-1 MCB Physics Engine</h1>
            <p className="text-[11px] text-slate-400 leading-tight">60fps HTML5 Canvas & Web Worker Pipeline</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isSoundMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setIsBottomSheetOpen(true)}
            className="md:hidden py-1.5 px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Controls</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex items-center bg-slate-900 border-b border-slate-800 px-2 py-1">
        {(['sld', 'charts', 'controls'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={cn(
              'flex-1 py-2 text-xs font-semibold rounded-md transition-colors capitalize',
              mobileTab === tab
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {tab === 'sld' ? 'SLD & Visuals' : tab === 'charts' ? 'Canvas Charts' : 'Full Controls'}
          </button>
        ))}
      </div>

      {/* Main Layout Body Container with Motion Screen Shake */}
      <motion.main
        animate={isScreenShaking ? { x: [-8, 8, -6, 6, -3, 3, 0], y: [-6, 6, -4, 4, -2, 2, 0] } : { x: 0, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex-1 p-3 md:p-6 max-w-7xl w-full mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Controls & Specification (Desktop cols 3) */}
          <div className={cn('md:col-span-4 lg:col-span-3 flex-col gap-4', mobileTab === 'controls' ? 'flex' : 'hidden md:flex')}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-200">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <span>MCB Configuration</span>
              </div>
              {renderControls()}
            </div>
          </div>

          {/* CENTER COLUMN: Single Line Diagram & 2D Breaker Cutaway (Desktop cols 5) */}
          <div className={cn('md:col-span-8 lg:col-span-5 flex-col gap-4', mobileTab === 'sld' ? 'flex' : 'hidden md:flex')}>
            {/* View Selector Toggle */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Breaker Visualizer</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCenterView('sld')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                    centerView === 'sld' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                  )}
                >
                  Single Line Diagram
                </button>
                <button
                  type="button"
                  onClick={() => setCenterView('cutaway')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                    centerView === 'cutaway' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                  )}
                >
                  2D Cutaway
                </button>
              </div>
            </div>

            {/* Active Visualizer Component */}
            {centerView === 'sld' ? (
              <SingleLineDiagram
                current={currentSnapshot?.current || 0}
                In={ratedCurrent}
                state={currentSnapshot?.state || MCBState.CLOSED}
                tripCause={currentSnapshot?.tripCause || TripCause.NONE}
                bimetalTemp={currentSnapshot?.thermal.temperature || ambientTemp}
                bimetalTripTemp={ambientTemp + 100}
                isToleranceZone={currentSnapshot?.magnetic.isToleranceZone || false}
              />
            ) : (
              <BreakerCutaway
                temperature={currentSnapshot?.thermal.temperature || ambientTemp}
                bimetalTripTemp={ambientTemp + 100}
                state={currentSnapshot?.state || MCBState.CLOSED}
                tripCause={currentSnapshot?.tripCause || TripCause.NONE}
              />
            )}

            {/* Live Telemetry */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bimetal Temp</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">1st-Order ODE</span>
                </div>
                <div className="text-xl font-bold font-mono text-amber-400">
                  {currentSnapshot?.thermal.temperature.toFixed(1)}°C
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-amber-500 h-full transition-all duration-200"
                    style={{ width: `${(currentSnapshot?.thermal.thermalMemoryRatio || 0) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Magnet className="w-3.5 h-3.5 text-blue-400" />
                    <span>Magnetic Peak</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Instant Peak</span>
                </div>
                <div className="text-xl font-bold font-mono text-blue-400">
                  {currentSnapshot?.magnetic.multipleOfIn.toFixed(2)}x In
                </div>
                <span className="text-[10px] text-slate-400">
                  {currentSnapshot?.magnetic.isToleranceZone
                    ? '⚠️ Inside Tolerance Band'
                    : `Curve ${curve} (${curve === 'B' ? '3-5x' : curve === 'C' ? '5-10x' : '10-20x'})`}
                </span>
              </div>
            </div>

            {/* Read-more Tooltip */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
              <div className="flex items-center justify-between mb-1 font-semibold text-emerald-400">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  IEC 60898-1 Compliance Note
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedTooltip(expandedTooltip ? null : 'iec')}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  {expandedTooltip === 'iec' ? 'Show less' : 'Read more'}
                </button>
              </div>
              <p className={cn('text-slate-400 transition-all', expandedTooltip === 'iec' ? '' : 'line-clamp-2')}>
                Standard IEC 60898-1 regulates low-voltage miniature circuit breakers. At 1.13x rated current (Int), the thermal bimetal must never trip. At 1.45x rated current (It), it must trip in &le; 3600s starting from ambient state. Magnetic tripping occurs instantaneously based on peak AC current.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: HTML5 Canvas Oscilloscope & Canvas TCC Chart (Desktop cols 4) */}
          <div className={cn('md:col-span-12 lg:col-span-4 flex-col gap-4', mobileTab === 'charts' ? 'flex' : 'hidden md:flex')}>
            {/* HTML5 Canvas Oscilloscope */}
            <CanvasOscilloscope
              samples={workerData?.samples || []}
              tDetect={workerData?.tDetect || -1}
              tClear={workerData?.tClear || -1}
            />

            {/* HTML5 Canvas Log-Log TCC Chart */}
            <CanvasTCCChart
              ratedCurrent={ratedCurrent}
              faultCurrent={faultCurrent}
              activeCurve={curve}
              bimetalTemp={currentSnapshot?.thermal.temperature || ambientTemp}
              isTripped={currentSnapshot?.state !== MCBState.CLOSED}
            />
          </div>
        </div>
      </motion.main>

      {/* Swipeable Bottom Sheet */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title="MCB Control Panel"
      >
        {renderControls()}
      </BottomSheet>
    </div>
  );
};
