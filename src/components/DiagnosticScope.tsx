import React, { useEffect, useRef, useState } from 'react';
import { useAudioHaptics } from './useAudioHaptics';
import {
  ECGStateParameters,
  NSR_PARAMS,
  blendECGParameters,
  computeECGSample,
  resolvePhysiologicalState
} from '../utils/ecgGenerator';

interface DiagnosticScopeProps {
  type: 'ac' | 'dc' | 'ecg';
  isActive: boolean;
  intensity: number; // 0 to 1
  voltage?: number;
  currentMA?: number;
  skinCondition?: 'dry' | 'wet';
  path?: 'hand-to-hand' | 'hand-to-foot';
  isPPESafe?: boolean;
  durationMs?: number;
}

export function DiagnosticScope({
  type,
  isActive,
  intensity,
  voltage = 230,
  currentMA = 0,
  skinCondition = 'dry',
  path = 'hand-to-foot',
  isPPESafe = false,
  durationMs = 0
}: DiagnosticScopeProps) {
  const [points, setPoints] = useState<string>('');
  const [rhythmBadge, setRhythmBadge] = useState<{ name: string; color: string; isPulse: boolean }>({
    name: 'NORMAL SINUS (72 BPM)',
    color: '#22c55e',
    isPulse: false
  });

  const { startHeartbeat, stopHeartbeat } = useAudioHaptics();

  // Internal state tracking for continuous smooth transitions
  const currentParamsRef = useRef<ECGStateParameters>({ ...NSR_PARAMS });
  const vfSecondsRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(performance.now());
  const globalTimeRef = useRef<number>(0);

  // Effective current calculated from inputs
  const effectiveMA = isPPESafe || !isActive ? 0 : currentMA;
  const isFibrillation = isActive && !isPPESafe && (effectiveMA >= 75 || (skinCondition === 'wet' && path === 'hand-to-foot' && effectiveMA >= 50));

  // Sync Audio Engine Heartbeat
  useEffect(() => {
    if (type === 'ecg' && isActive) {
      startHeartbeat(isFibrillation);
    } else if (type === 'ecg') {
      stopHeartbeat();
    }
    return () => {
      if (type === 'ecg') {
        stopHeartbeat();
      }
    };
  }, [type, isActive, isFibrillation, startHeartbeat, stopHeartbeat]);

  useEffect(() => {
    let animationFrameId: number;

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestampRef.current) / 1000, 0.1);
      lastTimestampRef.current = now;
      globalTimeRef.current += dt;

      // Update VF timer
      if (isActive && !isPPESafe && effectiveMA >= 75) {
        vfSecondsRef.current += dt;
      } else if (!isActive || isPPESafe) {
        // Slowly recover from VF if shock interrupted
        vfSecondsRef.current = Math.max(0, vfSecondsRef.current - dt * 0.5);
      }

      // Resolve target physiological state from live parameters
      const { targetParams, rhythm } = resolvePhysiologicalState(
        effectiveMA,
        isActive,
        isPPESafe,
        vfSecondsRef.current
      );

      // Smooth exponential interpolation towards target parameters (tau ~ 0.12s)
      const blendRate = 1 - Math.exp(-dt / 0.12);
      currentParamsRef.current = blendECGParameters(
        currentParamsRef.current,
        targetParams,
        blendRate
      );

      const width = 300;
      const height = 100;
      const pointsArray: string[] = [];

      if (type === 'ac') {
        // AC Waveform - Pure Sine
        const maxVoltsAC = 1000;
        const amplitude = 15 + 25 * Math.min(voltage / maxVoltsAC, 1);
        const freq = 0.05;
        for (let x = 0; x <= width; x += 2) {
          const y = height / 2 + Math.sin(x * freq - globalTimeRef.current * 15) * amplitude;
          pointsArray.push(`${x},${y.toFixed(1)}`);
        }
      } else if (type === 'dc') {
        // DC Waveform - Pure DC line with slight ripple
        const maxVoltsDC = 1500;
        const offset = 35 * Math.min(voltage / maxVoltsDC, 1);
        const ripple = isActive ? Math.sin(globalTimeRef.current * 30) * 0.8 : 0;
        for (let x = 0; x <= width; x += 2) {
          const y = height / 2 - offset + ripple;
          pointsArray.push(`${x},${y.toFixed(1)}`);
        }
      } else if (type === 'ecg') {
        // McSharry Synthetic ECG Waveform
        const timeWindow = 2.0; // 2-second oscilloscope display window
        const sweepSpeed = 1.0; // 1 second per second

        for (let x = 0; x <= width; x += 2) {
          const normalizedX = x / width; // 0 to 1 across screen
          const sampleTime = globalTimeRef.current * sweepSpeed - (1 - normalizedX) * timeWindow;
          const ecgVal = computeECGSample(sampleTime, currentParamsRef.current, vfSecondsRef.current);

          // Center at height / 2 = 50, invert voltage so positive R is upward (-ecgVal)
          const y = 50 - ecgVal;
          const clampedY = Math.max(4, Math.min(96, y));
          pointsArray.push(`${x},${clampedY.toFixed(1)}`);
        }

        // Update badge telemetry
        if (rhythm === 'asystole') {
          setRhythmBadge({
            name: 'ASYSTOLE (CARDIAC ARREST - FLATLINE)',
            color: '#ef4444',
            isPulse: true
          });
        } else if (rhythm === 'vfib') {
          const isFine = vfSecondsRef.current >= 3.5;
          setRhythmBadge({
            name: isFine ? 'FINE V-FIB (EXTREME ISCHEMIA)' : 'COARSE VENTRICULAR FIBRILLATION',
            color: '#ef4444',
            isPulse: true
          });
        } else if (rhythm === 'vtach') {
          setRhythmBadge({
            name: `V-TACH (${currentParamsRef.current.bpm} BPM - WIDE QRS)`,
            color: '#f97316',
            isPulse: true
          });
        } else {
          setRhythmBadge({
            name: currentParamsRef.current.rhythmName,
            color: isActive && effectiveMA > 0 ? '#eab308' : '#22c55e',
            isPulse: isActive && effectiveMA > 0
          });
        }
      }

      setPoints(pointsArray.join(' '));
      animationFrameId = requestAnimationFrame(render);
    };

    lastTimestampRef.current = performance.now();
    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [type, isActive, intensity, voltage, effectiveMA, isPPESafe]);

  const strokeColor =
    type === 'ecg'
      ? rhythmBadge.color
      : type === 'ac'
      ? '#38bdf8'
      : '#14b8a6';

  return (
    <div className="relative w-full h-full min-h-0 bg-[#020617] rounded-lg border border-slate-700/50 shadow-inner overflow-hidden select-none">
      {/* Precision Medical Oscilloscope Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:15px_15px] opacity-40" />

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
        {/* Isoelectric Baseline Center line */}
        <line
          x1="0"
          y1="50"
          x2="300"
          y2="50"
          stroke="#334155"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="4 4"
        />

        {/* Dynamic Waveform Trace */}
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: `drop-shadow(0 0 4px ${strokeColor}) drop-shadow(0 0 8px ${strokeColor}44)`
          }}
        />
      </svg>

      {/* Real-Time Live Physiological Rhythm Badge */}
      {type === 'ecg' && (
        <div
          className={`absolute top-1.5 right-1.5 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border backdrop-blur-md shadow-md ${
            rhythmBadge.isPulse ? 'animate-pulse' : ''
          }`}
          style={{
            color: rhythmBadge.color,
            borderColor: `${rhythmBadge.color}66`,
            backgroundColor: `${rhythmBadge.color}18`
          }}
        >
          {rhythmBadge.name}
        </div>
      )}
    </div>
  );
}


