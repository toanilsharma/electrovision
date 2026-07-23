import React, { useEffect, useState } from 'react';
import { useAudioHaptics } from './useAudioHaptics';

interface DiagnosticScopeProps {
  type: 'ac' | 'dc' | 'ecg';
  isActive: boolean;
  intensity: number; // 0 to 1
  voltage?: number;
  skinCondition?: 'dry' | 'wet';
  path?: 'hand-to-hand' | 'hand-to-foot';
}

export function DiagnosticScope({
  type,
  isActive,
  intensity,
  voltage = 230,
  skinCondition = 'dry',
  path = 'hand-to-foot'
}: DiagnosticScopeProps) {
  const [points, setPoints] = useState<string>('');
  const { startHeartbeat, stopHeartbeat } = useAudioHaptics();

  const isFibrillation = isActive && skinCondition === 'wet' && path === 'hand-to-foot';

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
    let time = 0;

    const renderPath = () => {
      const width = 300;
      const height = 100;
      const pointsArray = [];

      for (let x = 0; x <= width; x += 2) {
        let y = height / 2;
        const normalizedX = x / width;

        if (type === 'ac') {
          // AC Waveform - Pure Sine
          const maxVoltsAC = 1000;
          const amplitude = 15 + 25 * Math.min(voltage / maxVoltsAC, 1);
          const freq = 0.05;
          y += Math.sin((x * freq) - time * 1.5) * amplitude;
        } else if (type === 'dc') {
          // DC Waveform - Pure DC line
          const maxVoltsDC = 1500;
          const offset = 35 * Math.min(voltage / maxVoltsDC, 1);
          y -= offset;
        } else if (type === 'ecg') {
          // ECG Waveform
          if (isFibrillation) {
            // Chaotic Ventricular Fibrillation Waveform
            y += Math.sin(x * 0.12 - time * 6) * 18 + (Math.random() - 0.5) * 26;
          } else {
            // Normal / Tachycardia ECG Shape (Dry skin / normal beat)
            const bpm = isActive ? 120 : 70;
            const speed = bpm / 60; // beats per second
            const currentPhase = (normalizedX * 5 - time * speed) % 1;
            const phase = currentPhase < 0 ? 1 + currentPhase : currentPhase;

            if (phase > 0.4 && phase < 0.45) {
              y -= 10; // P wave
            } else if (phase > 0.5 && phase < 0.52) {
              y += 5; // Q
            } else if (phase >= 0.52 && phase < 0.55) {
              y -= 40; // R
            } else if (phase >= 0.55 && phase < 0.58) {
              y += 15; // S
            } else if (phase > 0.7 && phase < 0.8) {
              y -= 12; // T wave
            }
            // Mild disturbance if non-fibrillation shock active
            if (isActive && intensity > 0) {
              y += (Math.random() - 0.5) * intensity * 8;
            }
          }
        }

        pointsArray.push(`${x},${y}`);
      }

      setPoints(pointsArray.join(' '));
      time += 0.1;
      animationFrameId = requestAnimationFrame(renderPath);
    };

    renderPath();

    return () => cancelAnimationFrame(animationFrameId);
  }, [type, isActive, intensity, voltage, isFibrillation]);

  const strokeColor = type === 'ecg' ? (isFibrillation ? '#ef4444' : '#22c55e') : '#f97316';

  return (
    <div className="relative w-full h-full min-h-0 bg-[#020617] rounded-lg border border-slate-700/50 shadow-inner overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>
      
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
        {/* Center line */}
        <line x1="0" y1="50" x2="300" y2="50" stroke="#334155" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
        
        {/* The Waveform trace */}
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ 
            filter: `drop-shadow(0 0 4px ${strokeColor})` 
          }}
        />
      </svg>
      {type === 'ecg' && isFibrillation && (
        <div className="absolute top-2 right-2 text-[10px] font-black text-red-500 animate-pulse uppercase tracking-widest bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/40">CHAOTIC V-FIB</div>
      )}
      {type === 'ecg' && isActive && !isFibrillation && (
        <div className="absolute top-2 right-2 text-[10px] font-black text-emerald-400 animate-pulse uppercase tracking-widest bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40">HEART MONITOR</div>
      )}
    </div>
  );
}

