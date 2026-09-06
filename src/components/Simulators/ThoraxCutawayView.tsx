import React, { useState } from 'react';
import { Layers, Eye, Shield, Activity, Target } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type ThoraxLayer = 'surface' | 'skeletal' | 'cardiac' | 'pulmonary';

interface ThoraxCutawayViewProps {
  phase: 'compress' | 'release';
  compressionDepthCm: number;
  forceNewtons: number;
  coronaryPerfusionPressure: number; // mmHg
  breathPhase?: boolean;
  demographic?: 'adult' | 'child' | 'infant';
}

export function ThoraxCutawayView({
  phase,
  compressionDepthCm,
  forceNewtons,
  coronaryPerfusionPressure,
  breathPhase = false,
  demographic = 'adult',
}: ThoraxCutawayViewProps) {
  const [activeLayer, setActiveLayer] = useState<ThoraxLayer>('cardiac');

  // Interpolated displacement mm for SVG elements
  const isDown = phase === 'compress' || compressionDepthCm > 1.5;
  const displacementY = (compressionDepthCm / 6.0) * 16; // up to 16px displacement

  // Coronary perfusion vector intensity (glow effect based on CPP >= 15 mmHg)
  const isPerfused = coronaryPerfusionPressure >= 15;
  const perfusionGlow = Math.min(1.0, coronaryPerfusionPressure / 25.0);

  return (
    <div className="flex flex-col h-full w-full justify-between gap-2 select-none font-mono">
      {/* Top Layer Control Bar */}
      <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] shrink-0">
        <div className="flex items-center gap-1 text-slate-400 font-bold">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="uppercase text-[9px]">Anatomical Layer:</span>
        </div>
        <div className="flex gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setActiveLayer('surface')}
            className={cn(
              "px-2 py-0.5 rounded transition-all cursor-pointer font-bold",
              activeLayer === 'surface'
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Surface Landmarks
          </button>
          <button
            onClick={() => setActiveLayer('skeletal')}
            className={cn(
              "px-2 py-0.5 rounded transition-all cursor-pointer font-bold",
              activeLayer === 'skeletal'
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Skeletal Ribcage
          </button>
          <button
            onClick={() => setActiveLayer('cardiac')}
            className={cn(
              "px-2 py-0.5 rounded transition-all cursor-pointer font-bold",
              activeLayer === 'cardiac'
                ? "bg-red-700 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Cardiac Pump & CPP
          </button>
          <button
            onClick={() => setActiveLayer('pulmonary')}
            className={cn(
              "px-2 py-0.5 rounded transition-all cursor-pointer font-bold",
              activeLayer === 'pulmonary'
                ? "bg-sky-700 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Lungs & Ventilation
          </button>
        </div>
      </div>

      {/* Main Interactive Thorax Stage SVG */}
      <div className="flex-1 relative flex items-center justify-center min-h-[170px] max-h-[220px]">
        <svg
          viewBox="0 0 320 200"
          className="w-full h-full max-h-[210px] overflow-visible drop-shadow-2xl"
        >
          <defs>
            {/* Ambient Body Shading */}
            <radialGradient id="torsoShade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
            </radialGradient>

            {/* Glowing Coronary Arteries Filter */}
            <filter id="coronaryGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Skin Surface Gradient */}
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* ── Base Human Torso Contour ── */}
          <path
            d="M 60,30 Q 90,15 160,15 Q 230,15 260,30 Q 285,75 275,185 Q 160,195 45,185 Q 35,75 60,30 Z"
            fill="url(#torsoShade)"
            stroke="#475569"
            strokeWidth="2"
          />

          {/* Clavicles (Collarbones) */}
          <path
            d="M 100,32 Q 130,42 160,38 Q 190,42 220,32"
            fill="none"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* ── LAYER 1: DERMATOLOGICAL SURFACE LANDMARKS ── */}
          {activeLayer === 'surface' && (
            <g className="transition-opacity duration-300">
              {/* Pectoral Contours */}
              <path d="M 85,70 Q 120,95 155,75" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d="M 235,70 Q 200,95 165,75" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3,3" />

              {/* Suprasternal Notch */}
              <circle cx="160" cy="38" r="4" fill="#94a3b8" />
              <text x="160" y="30" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">Sternal Notch</text>

              {/* Nipple Line (Intermammary Level Guide) */}
              <line x1="75" y1="90" x2="245" y2="90" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
              <circle cx="95" cy="90" r="3" fill="#f59e0b" />
              <circle cx="225" cy="90" r="3" fill="#f59e0b" />
              <text x="248" y="93" fill="#f59e0b" fontSize="7" fontWeight="bold">Intermammary Line</text>

              {/* Xiphoid Process Base Warning */}
              <polygon points="160,135 156,145 164,145" fill="#ef4444" opacity="0.8" />
              <text x="160" y="156" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">Xiphoid Process (Do Not Compress Below)</text>

              {/* Target Heel-of-Hand / 2-Thumb Placement Zone */}
              <g transform="translate(160, 102)">
                <circle cx="0" cy="0" r="22" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,2" />
                <circle cx="0" cy="0" r="4" fill="#f59e0b" />
                <text x="0" y="-8" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="black">
                  {demographic === 'infant' ? 'BELOW NIPPLE LINE' : 'LOWER HALF STERNUM'}
                </text>
                <text x="0" y="14" textAnchor="middle" fill="#fbbf24" fontSize="7" fontWeight="bold">
                  {demographic === 'infant' ? '2-Thumb Encircling / 2 Fingers' : demographic === 'child' ? '1 Hand (or 2 Hands)' : 'Place Heel of Hand Here'}
                </text>
              </g>

              {/* Infant Specific: Brachial Artery Pulse Check Landmark */}
              {demographic === 'infant' && (
                <g transform="translate(50, 68)">
                  <circle cx="0" cy="0" r="5" fill="#38bdf8" opacity="0.8" className="animate-pulse" />
                  <text x="-8" y="2" textAnchor="end" fill="#38bdf8" fontSize="7" fontWeight="bold">BRACHIAL PULSE</text>
                </g>
              )}
            </g>
          )}

          {/* ── LAYER 2: SKELETAL & 12-RIB VISCOELASTIC CARTILAGE FLEXURE ── */}
          {(activeLayer === 'skeletal' || activeLayer === 'cardiac') && (
            <g opacity={activeLayer === 'cardiac' ? 0.35 : 0.95} className="transition-opacity duration-300">
              {/* Costal Cartilage & Ribs (1-7 Vertebrosternal, 8-10 False Ribs) */}
              {[-36, -24, -12, 0, 14, 28, 42].map((yOff, i) => {
                const flex = isDown ? (i === 3 ? 10 : Math.max(2, 8 - Math.abs(i - 3) * 2)) : 0;
                return (
                  <g key={`rib-${i}`}>
                    {/* Left Rib pair */}
                    <path
                      d={`M 75,${80 + yOff} Q 115,${72 + yOff + flex} 150,${84 + yOff + flex}`}
                      fill="none"
                      stroke={isDown ? "#fbbf24" : "#94a3b8"}
                      strokeWidth={i === 3 ? "2.5" : "2"}
                      strokeLinecap="round"
                    />
                    {/* Right Rib pair */}
                    <path
                      d={`M 245,${80 + yOff} Q 205,${72 + yOff + flex} 170,${84 + yOff + flex}`}
                      fill="none"
                      stroke={isDown ? "#fbbf24" : "#94a3b8"}
                      strokeWidth={i === 3 ? "2.5" : "2"}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* Sternal Body & Manubrium */}
              <g transform={`translate(0, ${displacementY * 0.4})`} className="transition-transform duration-75">
                {/* Manubrium */}
                <path d="M 148,42 L 172,42 L 168,62 L 152,62 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                {/* Gladiolus (Body of Sternum) */}
                <rect x="152" y="66" width="16" height="60" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                {/* Xiphoid process */}
                <polygon points="160,136 156,145 164,145" fill="#94a3b8" />
              </g>
            </g>
          )}

          {/* ── LAYER 3: CARDIAC PUMP, VENTRICLES & CORONARY ARTERY PERFUSION ── */}
          {activeLayer === 'cardiac' && (
            <g className="transition-opacity duration-300">
              {/* Ascending Aorta & Aortic Arch */}
              <path
                d="M 158,80 C 158,55 175,48 185,55 C 190,60 190,75 180,85"
                fill="none"
                stroke={isDown ? "#ef4444" : "#991b1b"}
                strokeWidth={isDown ? "7" : "5"}
                strokeLinecap="round"
                filter={isPerfused ? "url(#coronaryGlow)" : undefined}
                className="transition-all duration-75"
              />

              {/* Pulmonary Artery (Cyan Deoxygenated) */}
              <path
                d="M 146,82 C 144,65 130,55 120,62"
                fill="none"
                stroke="#0284c7"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* Dynamic Ventricular Mass (Left & Right Ventricles) */}
              <g transform="translate(160, 102)">
                {/* Myocardial Outer Wall */}
                <ellipse
                  cx="-4"
                  cy="4"
                  rx={isDown ? 24 : 34}
                  ry={isDown ? 18 : 28}
                  fill={isPerfused ? "rgba(16, 185, 129, 0.2)" : "rgba(220, 38, 38, 0.25)"}
                  stroke={isPerfused ? "#10b981" : "#ef4444"}
                  strokeWidth="2.5"
                  className="transition-all duration-75"
                />

                {/* Left Ventricular Chamber (Compressed during downstroke, refilling during recoil) */}
                <ellipse
                  cx="5"
                  cy="6"
                  rx={isDown ? 10 : 16}
                  ry={isDown ? 7 : 13}
                  fill={isDown ? "#dc2626" : "#7f1d1d"}
                  className="transition-all duration-75"
                />

                {/* Right Ventricular Chamber */}
                <ellipse
                  cx="-14"
                  cy="4"
                  rx={isDown ? 8 : 12}
                  ry={isDown ? 6 : 10}
                  fill="#0369a1"
                  className="transition-all duration-75"
                />

                {/* Coronary Artery Tree Branches (Left Anterior Descending & Circumflex) */}
                <path
                  d="M -4,-8 Q 0,4 2,16 Q 4,24 6,28 M 0,6 Q 8,10 14,14 M -2,12 Q -8,16 -12,20"
                  fill="none"
                  stroke={isPerfused ? "#34d399" : "#f87171"}
                  strokeWidth={isPerfused ? "2" : "1.2"}
                  strokeLinecap="round"
                  filter={isPerfused ? "url(#coronaryGlow)" : undefined}
                />
              </g>

              {/* Live Perfusion Jet Streams Up to Brain (Carotids) on Downstroke */}
              {isDown && (
                <g opacity={perfusionGlow}>
                  <line x1="172" y1="46" x2="178" y2="22" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4,2" />
                  <line x1="152" y1="46" x2="146" y2="22" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4,2" />
                  <text x="160" y="20" textAnchor="middle" fill="#38bdf8" fontSize="7" fontWeight="bold">CAROTID PERFUSION</text>
                </g>
              )}
            </g>
          )}

          {/* ── LAYER 4: PULMONARY LOBES, TRACHEOBRONCHIAL TREE & ALVEOLAR VENTILATION ── */}
          {activeLayer === 'pulmonary' && (
            <g className="transition-opacity duration-300">
              {/* Trachea with horizontal cartilage rings */}
              <rect x="156" y="32" width="8" height="38" rx="2" fill="#38bdf8" opacity="0.4" />
              {[38, 44, 50, 56, 62].map(ry => (
                <line key={ry} x1="156" y1={ry} x2="164" y2={ry} stroke="#0284c7" strokeWidth="1.5" />
              ))}

              {/* Carina and Bronchial Bifurcation */}
              <path d="M 160,70 L 138,82 M 160,70 L 182,82" fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />

              {/* Right Lung (3 lobes: Superior, Middle, Inferior) */}
              <g
                transform={`translate(105, 110) scale(${breathPhase ? 1.12 : 1.0}) translate(-105, -110)`}
                className="transition-transform duration-300"
              >
                <path
                  d="M 135,76 C 110,65 80,85 75,120 C 72,145 90,165 125,160 C 135,158 138,130 135,76 Z"
                  fill={breathPhase ? "rgba(56, 189, 248, 0.45)" : "rgba(30, 58, 138, 0.35)"}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  filter={breathPhase ? "url(#coronaryGlow)" : undefined}
                />
                <line x1="82" y1="115" x2="132" y2="120" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,2" />
                <text x="105" y="125" textAnchor="middle" fill="#7dd3fc" fontSize="7" fontWeight="bold">RIGHT LUNG</text>
              </g>

              {/* Left Lung (2 lobes with Cardiac Notch) */}
              <g
                transform={`translate(215, 110) scale(${breathPhase ? 1.12 : 1.0}) translate(-215, -110)`}
                className="transition-transform duration-300"
              >
                <path
                  d="M 185,76 C 210,65 240,85 245,120 C 248,145 230,165 195,160 C 185,158 178,135 185,115 C 188,105 185,85 185,76 Z"
                  fill={breathPhase ? "rgba(56, 189, 248, 0.45)" : "rgba(30, 58, 138, 0.35)"}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  filter={breathPhase ? "url(#coronaryGlow)" : undefined}
                />
                <text x="215" y="125" textAnchor="middle" fill="#7dd3fc" fontSize="7" fontWeight="bold">LEFT LUNG</text>
              </g>

              {breathPhase && (
                <text x="160" y="24" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="black" className="animate-pulse">
                  ALVEOLAR EXPANSION (TIDAL INFLATION)
                </text>
              )}
            </g>
          )}

          {/* Sinking Sternal Pad with Kelvin-Voigt Force Marker */}
          <g transform={`translate(160, ${102 + displacementY})`} className="transition-transform duration-75">
            <rect x="-42" y="-14" width="84" height="28" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="0" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="black">
              {isDown ? `▼ ${compressionDepthCm.toFixed(1)} cm` : '▲ 100% RECOIL'}
            </text>
            <text x="0" y="9" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="bold">
              {isDown ? `${forceNewtons} N` : '0 N (Elastic Rest)'}
            </text>
          </g>

          {/* Vertical Depth Calibrated Ruler */}
          <g transform="translate(290, 45)">
            <line x1="0" y1="0" x2="0" y2="100" stroke="#475569" strokeWidth="1.5" />
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#475569" strokeWidth="1.5" />
            <line
              x1="-8"
              y1={demographic === 'infant' ? 32 : demographic === 'child' ? 38 : 50}
              x2="8"
              y2={demographic === 'infant' ? 32 : demographic === 'child' ? 38 : 50}
              stroke="#10b981"
              strokeWidth="2"
            />
            <line x1="-5" y1="100" x2="5" y2="100" stroke="#475569" strokeWidth="1.5" />
            {/* Live Indicator Needle */}
            <polygon
              points={`-12,${(compressionDepthCm / 6.0) * 50} -4,${(compressionDepthCm / 6.0) * 50 - 4} -4,${(compressionDepthCm / 6.0) * 50 + 4}`}
              fill="#f59e0b"
            />
            <text
              x="-16"
              y={demographic === 'infant' ? 35 : demographic === 'child' ? 41 : 53}
              textAnchor="end"
              fill="#10b981"
              fontSize="8"
              fontWeight="bold"
            >
              {demographic === 'infant' ? '3.5-4cm' : demographic === 'child' ? '4-5cm' : '5-6cm'}
            </text>
          </g>
        </svg>
      </div>

      {/* Bottom Anatomical Telemetry Legend */}
      <div className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-slate-950/70 border border-slate-800 text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Left Ventricle Squeeze: <strong className="text-white">{isDown ? '45% Stroke Volume' : 'Diastolic Refill'}</strong>
        </span>
        <span className="flex items-center gap-1">
          <span className={cn("w-2 h-2 rounded-full inline-block", isPerfused ? "bg-emerald-400" : "bg-amber-400")} />
          Coronary Bed: <strong className={isPerfused ? "text-emerald-400" : "text-amber-400"}>{coronaryPerfusionPressure} mmHg</strong>
        </span>
      </div>
    </div>
  );
}
