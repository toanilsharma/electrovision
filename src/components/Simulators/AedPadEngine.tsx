import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Target, CheckCircle2, AlertTriangle, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  PadPosition,
  AedVectorResult,
  calculatePadVector,
  IDEAL_PAD_STERNAL,
  IDEAL_PAD_APICAL,
} from '@/src/utils/aedVector';
import { triggerHaptic } from '@/src/utils/haptics';

interface AedPadEngineProps {
  onVectorUpdate: (result: AedVectorResult) => void;
}

export function AedPadEngine({ onVectorUpdate }: AedPadEngineProps) {
  // Pad positions in percentage of container (0 - 100)
  const [pad1, setPad1] = useState<PadPosition>({ x: 82, y: 15, isAttached: false });
  const [pad2, setPad2] = useState<PadPosition>({ x: 18, y: 15, isAttached: false });

  const [activeDrag, setActiveDrag] = useState<'pad1' | 'pad2' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute live vector on state change
  const vectorResult = calculatePadVector(pad1, pad2);

  useEffect(() => {
    onVectorUpdate(vectorResult);
  }, [pad1, pad2, onVectorUpdate]);

  // Handle Drag Move
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!activeDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const xPct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));

    if (activeDrag === 'pad1') {
      setPad1(prev => ({ ...prev, x: Math.round(xPct), y: Math.round(yPct) }));
    } else if (activeDrag === 'pad2') {
      setPad2(prev => ({ ...prev, x: Math.round(xPct), y: Math.round(yPct) }));
    }
  }, [activeDrag]);

  // Handle Drag Release & Snap-to-Target
  const handlePointerUp = useCallback(() => {
    if (!activeDrag) return;

    if (activeDrag === 'pad1') {
      // Check snap to Sternal target
      const dist = Math.hypot(pad1.x - IDEAL_PAD_STERNAL.x, pad1.y - IDEAL_PAD_STERNAL.y);
      if (dist < 14) {
        setPad1({ x: IDEAL_PAD_STERNAL.x, y: IDEAL_PAD_STERNAL.y, isAttached: true });
        triggerHaptic([30, 50, 30]);
      } else {
        setPad1(prev => ({ ...prev, isAttached: true }));
        triggerHaptic([20]);
      }
    } else if (activeDrag === 'pad2') {
      // Check snap to Apical target
      const dist = Math.hypot(pad2.x - IDEAL_PAD_APICAL.x, pad2.y - IDEAL_PAD_APICAL.y);
      if (dist < 14) {
        setPad2({ x: IDEAL_PAD_APICAL.x, y: IDEAL_PAD_APICAL.y, isAttached: true });
        triggerHaptic([30, 50, 30]);
      } else {
        setPad2(prev => ({ ...prev, isAttached: true }));
        triggerHaptic([20]);
      }
    }

    setActiveDrag(null);
  }, [activeDrag, pad1, pad2]);

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [activeDrag, handlePointerMove, handlePointerUp]);

  // Auto-snap one-click action
  const handleAutoSnapPads = () => {
    setPad1({ x: IDEAL_PAD_STERNAL.x, y: IDEAL_PAD_STERNAL.y, isAttached: true });
    setPad2({ x: IDEAL_PAD_APICAL.x, y: IDEAL_PAD_APICAL.y, isAttached: true });
    triggerHaptic([40, 80, 40]);
  };

  const handleResetPads = () => {
    setPad1({ x: 82, y: 15, isAttached: false });
    setPad2({ x: 18, y: 15, isAttached: false });
  };

  // Cable lead connection points at AED Socket (Bottom Center)
  const aedSocket1 = { x: 55, y: 96 };
  const aedSocket2 = { x: 45, y: 96 };

  return (
    <div className="flex flex-col h-full w-full justify-between gap-2 select-none font-mono">
      {/* Pad Vector Placement Header */}
      <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] shrink-0">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-white font-bold uppercase">Anterolateral Pad Vector:</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded font-black text-[9px] uppercase",
            vectorResult.padContactQuality === 'ideal' ? "bg-emerald-950 text-emerald-300 border border-emerald-500"
            : vectorResult.padContactQuality === 'acceptable' ? "bg-amber-950 text-amber-300 border border-amber-500"
            : "bg-red-950 text-red-300 border border-red-500"
          )}>
            {vectorResult.padContactQuality} ({Math.round(vectorResult.transcardiacCurrentFraction * 100)}% Transcardiac Current)
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleAutoSnapPads}
            className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[9px] uppercase transition-colors cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Auto-Attach
          </button>
          <button
            onClick={handleResetPads}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[9px] uppercase transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Interactive Chest Torso & Drag Stage */}
      <div
        ref={containerRef}
        className="relative flex-1 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-center overflow-hidden min-h-[160px] max-h-[220px]"
      >
        {/* Torso SVG with Target Snap Zones & Silicone Cables */}
        <svg viewBox="0 0 100 100" className="w-full h-full pointer-events-none">
          {/* Patient Chest Silhouette */}
          <path
            d="M 22,12 Q 35,5 50,5 Q 65,5 78,12 Q 86,30 84,80 Q 50,86 16,80 Q 14,30 22,12 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Sternal Notch & Nipple Landmarks */}
          <circle cx="50" cy="14" r="1.5" fill="#64748b" />
          <circle cx="34" cy="38" r="1.2" fill="#475569" />
          <circle cx="66" cy="38" r="1.2" fill="#475569" />

          {/* Cardiac Ventricle Orientation Vector Line */}
          {vectorResult.isBothAttached && (
            <line
              x1={pad1.x}
              y1={pad1.y}
              x2={pad2.x}
              y2={pad2.y}
              stroke={vectorResult.padContactQuality === 'ideal' ? "#10b981" : "#f59e0b"}
              strokeWidth="0.8"
              strokeDasharray="2,1.5"
              opacity="0.8"
            />
          )}

          {/* Target Snap Ring 1: Sternal (Right Upper Clavicle) */}
          <g transform={`translate(${IDEAL_PAD_STERNAL.x}, ${IDEAL_PAD_STERNAL.y})`}>
            <circle cx="0" cy="0" r="7" fill="none" stroke="#38bdf8" strokeWidth="0.7" strokeDasharray="1.5,1.5" opacity="0.7" />
            <circle cx="0" cy="0" r="1.5" fill="#38bdf8" opacity="0.6" />
            <text x="0" y="-8" textAnchor="middle" fill="#7dd3fc" fontSize="3" fontWeight="bold">PAD 1 (STERNUM)</text>
          </g>

          {/* Target Snap Ring 2: Apical (Left Lower Ribs) */}
          <g transform={`translate(${IDEAL_PAD_APICAL.x}, ${IDEAL_PAD_APICAL.y})`}>
            <circle cx="0" cy="0" r="7" fill="none" stroke="#38bdf8" strokeWidth="0.7" strokeDasharray="1.5,1.5" opacity="0.7" />
            <circle cx="0" cy="0" r="1.5" fill="#38bdf8" opacity="0.6" />
            <text x="0" y="10" textAnchor="middle" fill="#7dd3fc" fontSize="3" fontWeight="bold">PAD 2 (APEX)</text>
          </g>

          {/* Coiled Silicone Lead Cables (Bezier curves from AED Socket to Pads) */}
          <path
            d={`M ${aedSocket1.x},${aedSocket1.y} C ${aedSocket1.x + 10},70 ${pad1.x + 5},${pad1.y + 15} ${pad1.x},${pad1.y}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d={`M ${aedSocket2.x},${aedSocket2.y} C ${aedSocket2.x - 10},70 ${pad2.x - 5},${pad2.y + 15} ${pad2.x},${pad2.y}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* AED Machine Cable Plug Connector Socket */}
          <rect x="42" y="93" width="16" height="6" rx="1.5" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
          <circle cx="47" cy="96" r="1" fill="#0f172a" />
          <circle cx="53" cy="96" r="1" fill="#0f172a" />
        </svg>

        {/* ── DRAGGABLE ELECTRODE PAD 1 (STERNUM) ── */}
        <div
          onPointerDown={e => {
            e.stopPropagation();
            setActiveDrag('pad1');
          }}
          className={cn(
            "absolute w-12 h-14 rounded-lg flex flex-col items-center justify-between p-1 cursor-grab active:cursor-grabbing select-none transition-transform shadow-xl border-2 z-20",
            pad1.isAttached
              ? "bg-gradient-to-b from-blue-600 to-blue-800 border-white text-white"
              : "bg-gradient-to-b from-slate-700 to-slate-800 border-amber-400 text-amber-300 animate-pulse",
            activeDrag === 'pad1' && "scale-110 shadow-2xl ring-4 ring-amber-400/50"
          )}
          style={{
            left: `${pad1.x}%`,
            top: `${pad1.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-full flex justify-between items-center text-[7px] font-black border-b border-white/30 pb-0.5">
            <span>PAD 1</span>
            <span>STERNUM</span>
          </div>
          <div className="text-[6px] text-center font-bold leading-tight">
            Upper Right Chest
          </div>
          <div className="w-full text-center text-[7px] bg-black/40 rounded py-0.5 font-bold">
            {pad1.isAttached ? '✓ ATTACHED' : 'DRAG ME'}
          </div>
        </div>

        {/* ── DRAGGABLE ELECTRODE PAD 2 (APEX) ── */}
        <div
          onPointerDown={e => {
            e.stopPropagation();
            setActiveDrag('pad2');
          }}
          className={cn(
            "absolute w-12 h-14 rounded-lg flex flex-col items-center justify-between p-1 cursor-grab active:cursor-grabbing select-none transition-transform shadow-xl border-2 z-20",
            pad2.isAttached
              ? "bg-gradient-to-b from-emerald-600 to-teal-800 border-white text-white"
              : "bg-gradient-to-b from-slate-700 to-slate-800 border-amber-400 text-amber-300 animate-pulse",
            activeDrag === 'pad2' && "scale-110 shadow-2xl ring-4 ring-amber-400/50"
          )}
          style={{
            left: `${pad2.x}%`,
            top: `${pad2.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-full flex justify-between items-center text-[7px] font-black border-b border-white/30 pb-0.5">
            <span>PAD 2</span>
            <span>APEX</span>
          </div>
          <div className="text-[6px] text-center font-bold leading-tight">
            Lower Left Ribs
          </div>
          <div className="w-full text-center text-[7px] bg-black/40 rounded py-0.5 font-bold">
            {pad2.isAttached ? '✓ ATTACHED' : 'DRAG ME'}
          </div>
        </div>
      </div>

      {/* Real-Time Placement Guidance Banner */}
      <div className={cn(
        "px-2.5 py-1.5 rounded-lg border text-[10px] flex items-center gap-2 font-bold",
        vectorResult.padContactQuality === 'ideal'
          ? "bg-emerald-950/70 border-emerald-500/60 text-emerald-300"
          : vectorResult.padContactQuality === 'acceptable'
          ? "bg-amber-950/70 border-amber-500/60 text-amber-300"
          : "bg-red-950/70 border-red-500/60 text-red-300"
      )}>
        {vectorResult.isBothAttached ? (
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
        ) : (
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
        )}
        <span>{vectorResult.placementFeedback}</span>
      </div>
    </div>
  );
}
