import { useState, useRef } from 'react';
import { Wind, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { calculateBVMVentilation, evaluateAirwayPatency, VentilationResult } from '@/src/utils/ventilationPhysics';
import { resuscitationCoach } from '@/src/utils/resuscitationAudioCoach';

interface BVMVentilationEngineProps {
  currentSpO2: number;
  onSpO2Change?: (newSpO2: number) => void;
  onBreathDelivered?: (result: VentilationResult) => void;
  className?: string;
}

export function BVMVentilationEngine({
  currentSpO2,
  onSpO2Change,
  onBreathDelivered,
  className,
}: BVMVentilationEngineProps) {
  const [headTiltAngle, setHeadTiltAngle] = useState<number>(35); // default slightly tilted
  const [jawThrust, setJawThrust] = useState<boolean>(false);
  const [isBagSqueezing, setIsBagSqueezing] = useState<boolean>(false);
  const [squeezeVolume, setSqueezeVolume] = useState<number>(550); // standard 550 mL
  const [gastricAccumulationMl, setGastricAccumulationMl] = useState<number>(0);
  const [lastResult, setLastResult] = useState<VentilationResult | null>(null);

  const squeezeStartTime = useRef<number>(0);

  const airwayState = evaluateAirwayPatency(headTiltAngle, jawThrust);

  const handleStartSqueeze = () => {
    setIsBagSqueezing(true);
    squeezeStartTime.current = performance.now();
    resuscitationCoach.playBVMBreath(true);
  };

  const handleReleaseSqueeze = () => {
    if (!isBagSqueezing) return;
    setIsBagSqueezing(false);
    const durationSec = Math.max(0.3, (performance.now() - squeezeStartTime.current) / 1000.0);
    resuscitationCoach.playBVMBreath(false);

    const result = calculateBVMVentilation({
      squeezeVolumeMl: squeezeVolume,
      squeezeDurationSec: durationSec,
      headTiltAngleDeg: headTiltAngle,
      jawThrustActive: jawThrust,
      currentGastricVolumeMl: gastricAccumulationMl,
      currentSpO2,
      hasSpontaneousCirculation: false,
    });

    setLastResult(result);
    setGastricAccumulationMl(result.totalGastricAccumulationMl);

    if (onSpO2Change) {
      onSpO2Change(result.spO2AfterBreath);
    }
    if (onBreathDelivered) {
      onBreathDelivered(result);
    }

    // AI Voice feedback for ventilation
    if (result.clinicalFeedback.status === 'occluded') {
      resuscitationCoach.speak('Open the airway! Tilt head, lift chin.', 'urgent');
    } else if (result.clinicalFeedback.status === 'optimal') {
      resuscitationCoach.speak('Good breath. Visible chest rise.');
    } else if (result.clinicalFeedback.status === 'hyperventilation') {
      resuscitationCoach.speak('Squeeze gently over one second.');
    }
  };

  const handleResetStomach = () => {
    setGastricAccumulationMl(0);
    setLastResult(null);
  };

  return (
    <div className={cn("rounded-2xl border border-sky-500/30 bg-slate-950 p-3.5 flex flex-col gap-3 shadow-xl font-mono", className)}>
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
            <Wind className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-black text-white text-xs uppercase tracking-wider block">
              Bag-Valve-Mask (BVM) & Pulmonary Mechanics
            </span>
            <span className="text-[9px] text-slate-400">
              AHA BLS 30:2 Ventilation · Tidal Volume (500–600 mL) · Airway Patency
            </span>
          </div>
        </div>

        {/* Live SpO2 Pill */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className={cn(
            "w-2 h-2 rounded-full",
            currentSpO2 >= 90 ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : currentSpO2 >= 75 ? "bg-amber-400 animate-pulse" : "bg-red-500 animate-ping"
          )} />
          <span className="text-[10px] text-slate-400">SpO₂:</span>
          <span className={cn(
            "text-sm font-black tabular-nums",
            currentSpO2 >= 90 ? "text-emerald-400" : currentSpO2 >= 75 ? "text-amber-400" : "text-red-400"
          )}>
            {Math.round(currentSpO2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* LEFT: Airway Management Anatomy & Controls (5 Cols) */}
        <div className="md:col-span-5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-300 uppercase">Airway Management</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
              airwayState.isAirwayOpen
                ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                : "bg-red-950 border-red-500 text-red-400 animate-pulse"
            )}>
              {airwayState.isAirwayOpen ? "✓ AIRWAY OPEN" : "⚠️ OCCLUDED (TONGUE)"}
            </span>
          </div>

          {/* SVG Head-Tilt Chin-Lift Anatomical Pivot Schematic */}
          <div className="relative w-full h-[120px] rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 200 120" className="w-full h-full">
              {/* Cervical spine vertebrae */}
              <path
                d="M 50,90 Q 70,80 90,82 T 130,95"
                fill="none"
                stroke="#475569"
                strokeWidth="4"
                strokeDasharray="4,4"
              />

              {/* Pivoting Head Silhouette */}
              <g transform={`rotate(${-headTiltAngle * 0.4}, 110, 85)`}>
                {/* Cranium */}
                <ellipse cx="110" cy="50" rx="35" ry="30" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                {/* Nose and Chin profile */}
                <path d="M 140,55 L 152,65 L 140,75 L 145,85 L 125,85" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />

                {/* Oral cavity & Pharynx */}
                <path
                  d="M 140,68 Q 120,68 115,85"
                  fill="none"
                  stroke={airwayState.isAirwayOpen ? "#10b981" : "#ef4444"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Tongue: Occludes when angle is low */}
                <ellipse
                  cx={airwayState.isAirwayOpen ? "123" : "118"}
                  cy={airwayState.isAirwayOpen ? "72" : "78"}
                  rx="9"
                  ry="5"
                  fill="#f43f5e"
                  opacity="0.85"
                />

                {/* Trachea tube (Lungs) */}
                <line x1="115" y1="85" x2="110" y2="115" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />

                {/* Esophagus tube (Stomach) */}
                <line x1="105" y1="88" x2="98" y2="115" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3,2" />
              </g>

              {/* Airway lumen flow arrows if open */}
              {isBagSqueezing && airwayState.isAirwayOpen && (
                <path
                  d="M 145,60 Q 120,65 110,110"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="4,3"
                  className="animate-pulse"
                />
              )}

              {/* Airflow into stomach if occluded */}
              {isBagSqueezing && !airwayState.isAirwayOpen && (
                <path
                  d="M 145,60 Q 115,75 98,115"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeDasharray="4,3"
                  className="animate-pulse"
                />
              )}
            </svg>

            <div className="absolute bottom-1 left-2 text-[8px] font-mono text-slate-500">
              Airway Resistance: {airwayState.airwayResistanceCmH2O.toFixed(1)} cmH₂O
            </div>
          </div>

          {/* Interactive Airway Sliders & Toggles */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Head-Tilt / Chin-Lift Angle</span>
              <span className="font-black text-white">{headTiltAngle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              step="5"
              value={headTiltAngle}
              onChange={(e) => setHeadTiltAngle(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[8px] text-slate-500">
              <span>0° (Supine / Occluded)</span>
              <span className="text-emerald-400 font-bold">35° (Optimal Alignment)</span>
              <span>45°</span>
            </div>

            <button
              onClick={() => setJawThrust(j => !j)}
              className={cn(
                "mt-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border",
                jawThrust
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
              )}
            >
              <Sparkles className="w-3 h-3" />
              {jawThrust ? "✓ Jaw-Thrust Active (Trauma-Safe)" : "Enable Jaw-Thrust Maneuver"}
            </button>
          </div>
        </div>

        {/* CENTER: Silicone BVM Resuscitator Bag & Compression Stage (4 Cols) */}
        <div className="md:col-span-4 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 flex flex-col justify-between items-center gap-2">
          <div className="w-full flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-300 uppercase">Silicone BVM Bag</span>
            <span className="text-[10px] text-sky-400 font-black">{squeezeVolume} mL</span>
          </div>

          {/* Interactive BVM Bag Visual */}
          <div className="relative w-full h-[120px] flex items-center justify-center">
            <svg viewBox="0 0 160 100" className="w-36 h-28 overflow-visible">
              {/* Patient Facial Mask with silicone air cushion */}
              <ellipse cx="140" cy="50" rx="14" ry="24" fill="#38bdf8" opacity="0.3" stroke="#0284c7" strokeWidth="2" />
              <path d="M 126,35 L 115,45 L 115,55 L 126,65" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />

              {/* One-way Duckbill Valve Housing */}
              <rect x="105" y="42" width="12" height="16" rx="2" fill="#0284c7" />

              {/* Squeezable Silicone Ellipsoid Resuscitator Bag */}
              <ellipse
                cx="60"
                cy="50"
                rx={isBagSqueezing ? "30" : "44"}
                ry={isBagSqueezing ? "18" : "28"}
                fill={isBagSqueezing ? "#0284c7" : "#0369a1"}
                stroke="#38bdf8"
                strokeWidth="2.5"
                className="transition-all duration-150 cursor-pointer"
              />

              {/* Bag Grip Ridges */}
              <path d="M 45,35 Q 50,50 45,65" fill="none" stroke="#bae6fd" strokeWidth="1.5" opacity="0.6" />
              <path d="M 60,32 Q 65,50 60,68" fill="none" stroke="#bae6fd" strokeWidth="1.5" opacity="0.6" />
              <path d="M 75,35 Q 80,50 75,65" fill="none" stroke="#bae6fd" strokeWidth="1.5" opacity="0.6" />

              {/* Oxygen Reservoir Port & Tubing at rear */}
              <rect x="8" y="45" width="10" height="10" rx="2" fill="#64748b" />
              <path d="M 8,50 L 0,50" stroke="#38bdf8" strokeWidth="3" />
            </svg>
          </div>

          {/* Squeeze Bag Button (Press and Hold for 1.0s) */}
          <button
            onMouseDown={handleStartSqueeze}
            onMouseUp={handleReleaseSqueeze}
            onTouchStart={handleStartSqueeze}
            onTouchEnd={handleReleaseSqueeze}
            className={cn(
              "w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5",
              isBagSqueezing
                ? "bg-sky-400 text-slate-950 scale-95 shadow-sky-400/40"
                : "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/30"
            )}
          >
            <Wind className="w-3.5 h-3.5" />
            {isBagSqueezing ? "DELIVERING BREATH... (HOLD ~1.0s)" : "SQUEEZE BVM (HOLD 1.0 SEC)"}
          </button>

          {/* Volume Preset Selector */}
          <div className="flex gap-1 w-full text-[9px]">
            {[450, 550, 750].map(vol => (
              <button
                key={vol}
                onClick={() => setSqueezeVolume(vol)}
                className={cn(
                  "flex-1 py-1 rounded border font-bold cursor-pointer transition-colors",
                  squeezeVolume === vol
                    ? "bg-sky-950 border-sky-400 text-sky-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                )}
              >
                {vol} mL {vol === 550 ? '(AHA)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Pulmonary Excursion & Gastric Distension Telemetry (3 Cols) */}
        <div className="md:col-span-3 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-300 uppercase">Ventilation Output</span>
            {gastricAccumulationMl > 0 && (
              <button
                onClick={handleResetStomach}
                className="text-[8px] text-amber-400 hover:underline cursor-pointer"
              >
                Reset Stomach
              </button>
            )}
          </div>

          {/* Lung Tidal Volume Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>LUNG VOLUME</span>
              <span className="text-sky-400 font-bold">{lastResult ? lastResult.pulmonaryVolumeMl : 0} mL</span>
            </div>
            <div className="h-4 w-full bg-slate-950 rounded border border-slate-800 p-0.5 overflow-hidden flex items-center">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-emerald-400 rounded transition-all duration-200"
                style={{ width: `${Math.min(100, ((lastResult ? lastResult.pulmonaryVolumeMl : 0) / 650) * 100)}%` }}
              />
            </div>
            <span className="text-[8px] text-slate-500">Target: 500–600 mL (Visible chest rise)</span>
          </div>

          {/* Gastric Distension Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>STOMACH (DISTENSION)</span>
              <span className={cn(
                "font-bold",
                gastricAccumulationMl >= 300 ? "text-red-400 animate-pulse" : "text-amber-400"
              )}>
                {gastricAccumulationMl} mL
              </span>
            </div>
            <div className="h-4 w-full bg-slate-950 rounded border border-slate-800 p-0.5 overflow-hidden flex items-center">
              <div
                className={cn(
                  "h-full rounded transition-all duration-200",
                  gastricAccumulationMl >= 300 ? "bg-red-500" : "bg-amber-500"
                )}
                style={{ width: `${Math.min(100, (gastricAccumulationMl / 400) * 100)}%` }}
              />
            </div>
            <span className="text-[8px] text-slate-500">
              {gastricAccumulationMl >= 300 ? "⚠️ Regurgitation & aspiration risk!" : "< 150 mL safe threshold"}
            </span>
          </div>

          {/* Peak Pressure Readout */}
          <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[9px] flex justify-between items-center font-mono">
            <span className="text-slate-400">Peak Airway P:</span>
            <span className={cn(
              "font-black text-xs",
              lastResult && lastResult.peakInspiratoryPressureCmH2O > 25 ? "text-red-400" : "text-sky-400"
            )}>
              {lastResult ? lastResult.peakInspiratoryPressureCmH2O : 0} cmH₂O
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Clinical Feedback Banner */}
      {lastResult && (
        <div className={cn(
          "rounded-xl border p-2.5 text-xs flex items-center gap-2",
          lastResult.clinicalFeedback.status === 'optimal'
            ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
            : lastResult.clinicalFeedback.status === 'occluded'
            ? "border-red-500/50 bg-red-950/40 text-red-300"
            : "border-amber-500/40 bg-amber-950/30 text-amber-300"
        )}>
          {lastResult.clinicalFeedback.status === 'optimal' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : lastResult.clinicalFeedback.status === 'occluded' ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <div className="flex-1">
            <span className="font-black block">{lastResult.clinicalFeedback.message}</span>
            {lastResult.clinicalFeedback.warning && (
              <span className="text-[10px] opacity-80 block">{lastResult.clinicalFeedback.warning}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
