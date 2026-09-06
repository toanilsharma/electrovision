import React from 'react';
import { cn } from '@/src/lib/utils';

interface ProtocolVisualEngineProps {
  scene: string;
  pulse?: boolean;
  className?: string;
}

export function ProtocolVisualEngine({ scene, pulse = true, className }: ProtocolVisualEngineProps) {
  return (
    <div className={cn("relative w-full h-full flex items-center justify-center select-none overflow-hidden", className)}>
      <svg
        viewBox="0 0 400 300"
        className="w-full h-full max-h-full object-contain"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Radial Glow Filters */}
          <filter id="glow-danger" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.6" />
          </filter>

          {/* Gradients */}
          <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#090d16" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>

          <linearGradient id="floor-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="hazard-stripe" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <linearGradient id="body-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          <linearGradient id="vest-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>

          <linearGradient id="loto-steel" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <radialGradient id="arc-flash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Industrial Background */}
        <rect x="0" y="0" width="400" height="300" fill="url(#bg-grad)" rx="16" />
        <rect x="0" y="220" width="400" height="80" fill="url(#floor-grad)" />
        <line x1="0" y1="220" x2="400" y2="220" stroke="#334155" strokeWidth="1.5" />

        {/* Grid lines on floor */}
        <line x1="40" y1="220" x2="10" y2="300" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="120" y1="220" x2="90" y2="300" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="200" y1="220" x2="190" y2="300" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="280" y1="220" x2="290" y2="300" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="360" y1="220" x2="380" y2="300" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

        {/* =================================================================== */}
        {/* SCENE 1: DANGER — High Voltage Arc & Ground Potential Hazard */}
        {/* =================================================================== */}
        {scene === 'danger' && (
          <g>
            {/* Danger Perimeter Zone (Red Laser Ring on Floor) */}
            <ellipse cx="230" cy="245" rx="140" ry="36" fill="#ef4444" fillOpacity="0.08" stroke="#ef4444" strokeWidth="2" strokeDasharray="8 6">
              <animate attributeName="stroke-dashoffset" values="0;28" dur="2s" repeatCount="indefinite" />
            </ellipse>
            <text x="230" y="278" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="900" letterSpacing="2" fontFamily="monospace">
              ⚡ 5M EXCLUSION ZONE — LIVE ARC HAZARD ⚡
            </text>

            {/* Industrial Conduit / Severed Overhead Cable */}
            <path d="M 0 30 Q 80 40 100 120 T 110 235" fill="none" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" />
            <path d="M 0 30 Q 80 40 100 120 T 110 235" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />

            {/* Exposed Copper Conductor & Arcing Sparks */}
            <circle cx="110" cy="235" r="7" fill="#fb923c" filter="url(#glow-danger)" />
            {pulse && (
              <>
                <circle cx="110" cy="235" r="30" fill="url(#arc-flash)">
                  <animate attributeName="r" values="20;38;20" dur="0.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.4s" repeatCount="indefinite" />
                </circle>
                {/* Lightning bolts */}
                <polyline points="110,235 125,220 120,228 135,215" fill="none" stroke="#38bdf8" strokeWidth="2.5" filter="url(#glow-cyan)" />
                <polyline points="110,235 95,225 102,228 85,220" fill="none" stroke="#fef08a" strokeWidth="2.5" filter="url(#glow-danger)" />
                <polyline points="110,235 118,248 112,246 128,258" fill="none" stroke="#ffffff" strokeWidth="2" />
              </>
            )}

            {/* Fallen Worker Figure (Supine / Collapsed) */}
            <g transform="translate(140, 200)">
              {/* Shadow */}
              <ellipse cx="90" cy="38" rx="80" ry="14" fill="#000000" fillOpacity="0.5" />
              {/* Work Boots */}
              <ellipse cx="20" cy="32" rx="10" ry="6" fill="#78350f" />
              <ellipse cx="32" cy="34" rx="10" ry="6" fill="#78350f" />
              {/* Trousers */}
              <path d="M 24 30 L 75 25 L 75 40 L 28 35 Z" fill="#1e3a8a" />
              {/* Torso with Hi-Vis Reflective Vest */}
              <rect x="75" y="16" width="55" height="26" rx="8" fill="url(#vest-grad)" filter="url(#subtle-shadow)" />
              {/* Silver Reflective Bands */}
              <rect x="88" y="16" width="6" height="26" fill="#e2e8f0" fillOpacity="0.9" />
              <rect x="108" y="16" width="6" height="26" fill="#e2e8f0" fillOpacity="0.9" />
              {/* Head with Hardhat */}
              <circle cx="145" cy="27" r="14" fill="#fcd34d" />
              {/* Hardhat Brim */}
              <path d="M 132 24 Q 146 12 160 24" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
              {/* Arms fallen back */}
              <path d="M 85 30 L 105 45" stroke="#1d4ed8" strokeWidth="8" strokeLinecap="round" />
            </g>

            {/* Danger Warning Sign HUD on Top Left */}
            <g transform="translate(24, 24)" filter="url(#subtle-shadow)">
              <rect width="170" height="68" rx="10" fill="#1e1b2e" stroke="#ef4444" strokeWidth="1.5" />
              <polygon points="40,20 22,54 58,54" fill="#ef4444" />
              <text x="40" y="49" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="bold">!</text>
              <text x="68" y="36" fill="#ef4444" fontSize="12" fontWeight="900" fontFamily="sans-serif">DO NOT TOUCH</text>
              <text x="68" y="52" fill="#cbd5e1" fontSize="9" fontWeight="600" fontFamily="sans-serif">Victim is Energized</text>
            </g>
          </g>
        )}

        {/* =================================================================== */}
        {/* SCENE 2: ISOLATE — Industrial LOTO & Main Switchboard Disconnect */}
        {/* =================================================================== */}
        {scene === 'isolate' && (
          <g>
            {/* Electrical Switchgear Enclosure (Center-Left) */}
            <g transform="translate(60, 40)" filter="url(#subtle-shadow)">
              {/* Outer Cabinet */}
              <rect width="130" height="190" rx="10" fill="url(#loto-steel)" stroke="#475569" strokeWidth="2" />
              {/* Warning Chevron Header */}
              <rect x="10" y="12" width="110" height="18" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
              <text x="65" y="25" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="900" letterSpacing="1" fontFamily="sans-serif">
                MAIN FEEDER 415V
              </text>

              {/* Digital Voltmeter (Zero Energy Verification) */}
              <rect x="25" y="40" width="80" height="32" rx="4" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
              <text x="65" y="61" textAnchor="middle" fill="#22c55e" fontSize="14" fontWeight="900" fontFamily="monospace" filter="url(#glow-green)">
                0.0 V
              </text>

              {/* Heavy Duty Rotary Isolator Handle (Rotated to OFF) */}
              <circle cx="65" cy="115" r="28" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              <text x="35" y="118" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">ON</text>
              <text x="82" y="118" fill="#22c55e" fontSize="9" fontWeight="bold" fontFamily="monospace">OFF</text>

              {/* Rotary Knob pointing to OFF */}
              <rect x="58" y="110" width="36" height="10" rx="3" fill="#22c55e" stroke="#16a34a" strokeWidth="1.5" />

              {/* Red Padlock Hasp (LOTO) */}
              <g transform="translate(68, 128)">
                <path d="M 6 0 L 6 -10 Q 12 -16 18 -10 L 18 0" fill="none" stroke="#cbd5e1" strokeWidth="3" />
                <rect x="0" y="0" width="24" height="26" rx="4" fill="#dc2626" stroke="#b91c1c" strokeWidth="1" />
                <circle cx="12" cy="10" r="2.5" fill="#ffffff" />
                <line x1="12" y1="12" x2="12" y2="18" stroke="#ffffff" strokeWidth="2" />
              </g>

              {/* LOTO Danger Tag */}
              <g transform="translate(100, 140)">
                <polygon points="0,0 28,0 34,44 6,44" fill="#ffffff" stroke="#dc2626" strokeWidth="1.5" />
                <text x="17" y="16" textAnchor="middle" fill="#dc2626" fontSize="7" fontWeight="900">DANGER</text>
                <text x="17" y="28" textAnchor="middle" fill="#0f172a" fontSize="6" fontWeight="bold">LOCKED</text>
                <text x="17" y="36" textAnchor="middle" fill="#0f172a" fontSize="6" fontWeight="bold">OUT</text>
              </g>
            </g>

            {/* Rescuer with Dielectric Gloves & Test Probe (Right) */}
            <g transform="translate(230, 80)">
              {/* Dielectric Arm & Glove */}
              <path d="M 120 140 L 70 80 L 10 70" fill="none" stroke="#f97316" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              {/* Insulated Test Probe */}
              <rect x="-30" y="65" width="45" height="10" rx="3" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
              <line x1="-30" y1="70" x2="-55" y2="70" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
              <circle cx="-55" cy="70" r="5" fill="#22c55e" filter="url(#glow-green)" />
              {pulse && (
                <circle cx="-55" cy="70" r="14" fill="none" stroke="#22c55e" strokeWidth="1.5">
                  <animate attributeName="r" values="6;16;6" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Confirmation Banner Top Right */}
            <g transform="translate(220, 30)" filter="url(#subtle-shadow)">
              <rect width="155" height="42" rx="8" fill="#052e16" stroke="#22c55e" strokeWidth="1.5" />
              <circle cx="24" cy="21" r="10" fill="#22c55e" />
              <polyline points="19,21 23,25 29,17" fill="none" stroke="#052e16" strokeWidth="2.5" strokeLinecap="round" />
              <text x="42" y="19" fill="#22c55e" fontSize="10" fontWeight="900">POWER ISOLATED</text>
              <text x="42" y="32" fill="#86efac" fontSize="8" fontWeight="600">Zero Energy Confirmed</text>
            </g>
          </g>
        )}

        {/* =================================================================== */}
        {/* SCENE 3: CALL — Emergency Dispatch, Cellular Waves & GPS HUD */}
        {/* =================================================================== */}
        {scene === 'call' && (
          <g>
            {/* Central Smartphone Emergency Interface */}
            <g transform="translate(135, 30)" filter="url(#subtle-shadow)">
              {/* Phone Frame */}
              <rect width="130" height="230" rx="22" fill="#0f172a" stroke="#334155" strokeWidth="3" />
              <rect x="8" y="8" width="114" height="214" rx="16" fill="#020617" />

              {/* Speaker notch */}
              <rect x="45" y="14" width="40" height="4" rx="2" fill="#334155" />

              {/* Active Call UI */}
              <circle cx="65" cy="65" r="26" fill="#dc2626" filter="url(#glow-danger)" />
              <text x="65" y="72" textAnchor="middle" fill="#ffffff" fontSize="22">📞</text>

              <text x="65" y="105" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif">
                112 / 911 ACTIVE
              </text>
              <text x="65" y="120" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="600">
                Electrical Shock Emergency
              </text>

              {/* Audio Waveform Equalizer */}
              <g transform="translate(25, 135)">
                {[4, 12, 22, 16, 28, 14, 20, 8, 24, 10].map((h, i) => (
                  <rect key={i} x={i * 8} y={30 - h} width="5" height={h} rx="2" fill="#38bdf8">
                    <animate attributeName="height" values={`${h};${Math.max(4, (h * 1.5) % 30)};${h}`} dur="0.8s" begin={`${i * 0.08}s`} repeatCount="indefinite" />
                  </rect>
                ))}
              </g>

              {/* GPS Coordinates HUD */}
              <rect x="15" y="175" width="100" height="36" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
              <text x="22" y="190" fill="#94a3b8" fontSize="7" fontFamily="monospace">GPS COORDINATES:</text>
              <text x="22" y="202" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">28.6139°N, 77.2090°E</text>
            </g>

            {/* Expanding Dispatch Radio Waves Left & Right */}
            {pulse && (
              <>
                <circle cx="200" cy="95" r="90" fill="none" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.7">
                  <animate attributeName="r" values="60;140" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="95" r="130" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4">
                  <animate attributeName="r" values="90;170" dur="2s" begin="0.6s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.6;0" dur="2s" begin="0.6s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* Paramedic En Route Status Pill */}
            <g transform="translate(24, 240)" filter="url(#subtle-shadow)">
              <rect width="130" height="34" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
              <text x="12" y="21" fill="#a5b4fc" fontSize="9" fontWeight="bold">PARAMEDIC UNIT 4</text>
              <text x="118" y="21" textAnchor="end" fill="#38bdf8" fontSize="9" fontWeight="black" fontFamily="monospace">ETA 4m</text>
            </g>
          </g>
        )}

        {/* =================================================================== */}
        {/* SCENE 4: ASSESS — Bilateral Shoulder Tap & Shout Stimulus */}
        {/* =================================================================== */}
        {scene === 'assess' && (
          <g>
            {/* Supine Patient */}
            <g transform="translate(60, 170)">
              {/* Torso */}
              <rect x="70" y="30" width="130" height="42" rx="14" fill="url(#body-grad)" filter="url(#subtle-shadow)" />
              {/* Neck & Head */}
              <circle cx="225" cy="48" r="22" fill="#fcd34d" />
              {/* Patient closed eyes */}
              <line x1="220" y1="44" x2="230" y2="44" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Kneeling Rescuer (Top-Center) */}
            <g transform="translate(140, 60)" filter="url(#subtle-shadow)">
              {/* Rescuer Head */}
              <circle cx="60" cy="30" r="20" fill="#fed7aa" />
              <path d="M 45 22 Q 60 12 75 22" fill="#7c2d12" />
              {/* Rescuer Shoulders */}
              <path d="M 25 55 Q 60 45 95 55 L 90 90 L 30 90 Z" fill="#0f766e" />

              {/* Arms reaching down to patient's shoulders */}
              <path d="M 30 70 L 15 135" stroke="#0d9488" strokeWidth="14" strokeLinecap="round" />
              <path d="M 90 70 L 105 135" stroke="#0d9488" strokeWidth="14" strokeLinecap="round" />

              {/* Hands grasping shoulders */}
              <circle cx="15" cy="138" r="10" fill="#fed7aa" />
              <circle cx="105" cy="138" r="10" fill="#fed7aa" />

              {/* Kinetic Tap Shockwaves */}
              {pulse && (
                <>
                  <circle cx="15" cy="138" r="20" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <animate attributeName="r" values="10;26;10" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="105" cy="138" r="20" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <animate attributeName="r" values="10;26;10" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </g>

            {/* Verbal Auditory Command Soundwaves (Speech Bubble) */}
            <g transform="translate(240, 40)" filter="url(#subtle-shadow)">
              <rect width="140" height="46" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="70" y="20" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                &ldquo;CAN YOU HEAR ME?&rdquo;
              </text>
              <text x="70" y="34" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                Firm Shoulder Tap (Max 10s)
              </text>
            </g>
          </g>
        )}

        {/* =================================================================== */}
        {/* SCENE 5: AIRWAY — Head-Tilt Chin-Lift & Patent Airflow Vector */}
        {/* =================================================================== */}
        {scene === 'airway' && (
          <g>
            {/* Anatomical Head Profile (Tilted Back 35 degrees) */}
            <g transform="translate(120, 70)" filter="url(#subtle-shadow)">
              {/* Neck / Cervical Spine */}
              <path d="M 80 120 Q 95 80 120 70 L 150 110" fill="#334155" stroke="#475569" strokeWidth="2" />
              {/* Head Contour */}
              <path d="M 60 70 Q 70 10 130 15 Q 180 20 180 75 Q 180 110 140 120 Z" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />

              {/* Nose and Chin in tilted elevation */}
              <polygon points="180,60 198,72 178,82" fill="#fed7aa" />
              {/* Mandible (Jawbone) lifted up */}
              <path d="M 175 88 Q 182 102 165 110" fill="none" stroke="#c2410c" strokeWidth="3" strokeLinecap="round" />

              {/* Internal Pharynx & Trachea Vector */}
              <path d="M 175 75 Q 140 78 135 130" fill="none" stroke="#0284c7" strokeWidth="14" strokeLinecap="round" />
              {/* Tongue retracted away from posterior pharynx wall */}
              <path d="M 155 78 Q 165 85 150 92" fill="#ef4444" opacity="0.8" />

              {/* Laminar Airflow Cyan Particles */}
              {pulse && (
                <path d="M 195 72 Q 150 78 135 130" fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 6" filter="url(#glow-cyan)">
                  <animate attributeName="stroke-dashoffset" values="28;0" dur="1s" repeatCount="indefinite" />
                </path>
              )}

              {/* Rescuer Hands: Hand 1 on Forehead */}
              <g transform="translate(100, 5)">
                <rect width="40" height="16" rx="6" fill="#f97316" />
                <text x="20" y="11" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">PALM DOWN</text>
              </g>

              {/* Rescuer Hands: Hand 2 Fingertips Under Bony Chin */}
              <g transform="translate(165, 115)">
                <rect width="46" height="16" rx="6" fill="#0284c7" />
                <text x="23" y="11" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">2 FINGERS UP</text>
              </g>
            </g>

            {/* Patency Success Indicator */}
            <g transform="translate(24, 24)" filter="url(#subtle-shadow)">
              <rect width="165" height="50" rx="8" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="14" y="20" fill="#38bdf8" fontSize="10" fontWeight="900">AIRWAY ALIGNED &amp; PATENT</text>
              <text x="14" y="34" fill="#bae6fd" fontSize="8" fontWeight="600">Tongue obstruction relieved</text>
              <text x="14" y="44" fill="#93c5fd" fontSize="7" fontFamily="monospace">Airway Resistance: 2.5 cmH2O</text>
            </g>
          </g>
        )}

        {/* =================================================================== */}
        {/* SCENE 6: CPR — 30:2 High-Quality Chest Compression Biomechanics */}
        {/* =================================================================== */}
        {scene === 'cpr' && (
          <g>
            {/* Supine Victim Torso */}
            <g transform="translate(130, 160)">
              <rect x="0" y="20" width="180" height="46" rx="14" fill="url(#body-grad)" filter="url(#subtle-shadow)" />
              {/* Rib cage markers */}
              <line x1="40" y1="28" x2="140" y2="28" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
              <line x1="45" y1="36" x2="135" y2="36" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />

              {/* Sternal Compression Target Zone */}
              <circle cx="90" cy="36" r="14" fill="#dc2626" fillOpacity="0.4" stroke="#ef4444" strokeWidth="2" />
              {pulse && (
                <circle cx="90" cy="36" r="32" fill="none" stroke="#ef4444" strokeWidth="2" filter="url(#glow-danger)">
                  <animate attributeName="r" values="14;42;14" dur="0.54s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0;0.9" dur="0.54s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Rescuer Vertical Arms (90 Degree Locked Elbows) */}
            <g transform="translate(195, 30)" filter="url(#subtle-shadow)">
              {/* Shoulders */}
              <rect x="0" y="0" width="50" height="26" rx="10" fill="#0f766e" />
              {/* Straight Perpendicular Arms */}
              <line x1="18" y1="24" x2="23" y2="152" stroke="#0d9488" strokeWidth="16" strokeLinecap="round" />
              <line x1="32" y1="24" x2="27" y2="152" stroke="#0d9488" strokeWidth="16" strokeLinecap="round" />

              {/* Interlaced Hands at Sternal Contact */}
              <ellipse cx="25" cy="154" rx="14" ry="8" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />

              {/* Downward Force Vector Arrow */}
              <line x1="25" y1="60" x2="25" y2="110" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
              <polygon points="20,110 30,110 25,125" fill="#facc15" />
            </g>

            {/* Real-time CPR Telemetry HUD Top Left */}
            <g transform="translate(20, 24)" filter="url(#subtle-shadow)">
              <rect width="145" height="72" rx="10" fill="#1e1b2e" stroke="#ef4444" strokeWidth="1.5" />
              <text x="14" y="20" fill="#ef4444" fontSize="10" fontWeight="900" letterSpacing="1">110 BPM CADENCE</text>
              <text x="14" y="36" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="monospace">DEPTH: 5.4 CM</text>
              <text x="14" y="52" fill="#4ade80" fontSize="9" fontWeight="bold">FULL RECOIL (0 CM)</text>
              <text x="14" y="64" fill="#94a3b8" fontSize="8" fontFamily="monospace">RATIO: 30 : 2 BREATHS</text>
            </g>
          </g>
        )}

        {/* =================================================================== */}
        {/* SCENE 7: AED — LIFEPAK CR2 & Biphasic Shock Discharge */}
        {/* =================================================================== */}
        {scene === 'aed' && (
          <g>
            {/* AED Hardware Enclosure (Left) */}
            <g transform="translate(30, 50)" filter="url(#subtle-shadow)">
              <rect width="120" height="160" rx="14" fill="#1e293b" stroke="#22c55e" strokeWidth="2.5" />
              {/* LCD Screen */}
              <rect x="14" y="16" width="92" height="60" rx="6" fill="#020617" stroke="#334155" strokeWidth="1.5" />
              {/* ECG Waveform on AED screen */}
              <path d="M 20 46 L 45 46 L 50 30 L 55 60 L 60 40 L 65 46 L 100 46" fill="none" stroke="#22c55e" strokeWidth="2" filter="url(#glow-green)" />

              {/* Big Flashing Shock Button */}
              <circle cx="60" cy="115" r="22" fill="#ea580c" stroke="#f97316" strokeWidth="3" filter="url(#glow-danger)" />
              <polygon points="56,104 68,114 61,116 66,128 54,118 60,116" fill="#ffffff" />
              {pulse && (
                <circle cx="60" cy="115" r="30" fill="none" stroke="#f97316" strokeWidth="2">
                  <animate attributeName="r" values="22;36;22" dur="0.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0;1" dur="0.6s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Victim Torso with Applied Pads (Right) */}
            <g transform="translate(190, 80)" filter="url(#subtle-shadow)">
              {/* Torso Outline */}
              <rect x="20" y="20" width="140" height="130" rx="20" fill="url(#body-grad)" />

              {/* Pad 1: Right Upper Infraclavicular */}
              <rect x="40" y="35" width="34" height="24" rx="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" filter="url(#subtle-shadow)" />
              <text x="57" y="50" textAnchor="middle" fill="#713f12" fontSize="8" fontWeight="bold">PAD 1</text>

              {/* Pad 2: Left Lower Mid-Axillary Apex */}
              <rect x="105" y="90" width="34" height="24" rx="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" filter="url(#subtle-shadow)" />
              <text x="122" y="105" textAnchor="middle" fill="#713f12" fontSize="8" fontWeight="bold">PAD 2</text>

              {/* Coiled Cables back to AED */}
              <path d="M 40 47 Q -10 60 -40 100" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
              <path d="M 105 102 Q -10 130 -40 120" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />

              {/* Transcardiac Vector Path & Shock Arc */}
              <line x1="57" y1="47" x2="122" y2="102" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 4" filter="url(#glow-cyan)" />
              {pulse && (
                <ellipse cx="90" cy="74" rx="36" ry="24" fill="none" stroke="#facc15" strokeWidth="2">
                  <animate attributeName="rx" values="24;46;24" dur="0.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0;0.9" dur="0.6s" repeatCount="indefinite" />
                </ellipse>
              )}
            </g>

            {/* Stand Clear Warning Banner */}
            <g transform="translate(180, 240)" filter="url(#subtle-shadow)">
              <rect width="190" height="34" rx="8" fill="#450a0a" stroke="#dc2626" strokeWidth="1.5" />
              <text x="95" y="21" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="900" letterSpacing="1">
                STAND CLEAR — DELIVER SHOCK
              </text>
            </g>
          </g>
        )}

        {/* =================================================================== */}
        {/* SCENE 8: RECOVERY — Stable Lateral Position & Aspiration Protection */}
        {/* =================================================================== */}
        {scene === 'recovery' && (
          <g>
            {/* Patient in Lateral Recovery Position (Side-Lying Profile) */}
            <g transform="translate(70, 90)" filter="url(#subtle-shadow)">
              {/* Ground shadow */}
              <ellipse cx="140" cy="110" rx="110" ry="18" fill="#000000" fillOpacity="0.5" />

              {/* Bent Top Leg at 90 degrees forming Tripod Base */}
              <path d="M 60 70 L 60 110 L 95 110" fill="none" stroke="#1d4ed8" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
              {/* Bottom straight leg */}
              <line x1="50" y1="60" x2="-20" y2="60" stroke="#1e3a8a" strokeWidth="18" strokeLinecap="round" />

              {/* Lateral Torso */}
              <rect x="60" y="30" width="110" height="42" rx="14" fill="url(#body-grad)" />

              {/* Head Tilted Back with Hand under cheek */}
              <circle cx="195" cy="45" r="20" fill="#fed7aa" />
              {/* Top Hand supporting cheek */}
              <rect x="180" y="55" width="22" height="14" rx="6" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />

              {/* Downward Mouth Gravity Drainage Line (Prevents Aspiration) */}
              <path d="M 205 52 Q 220 65 220 85" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 3" filter="url(#glow-cyan)">
                <animate attributeName="stroke-dashoffset" values="14;0" dur="1.2s" repeatCount="indefinite" />
              </path>

              {/* Airway Open Vector Indicator */}
              <line x1="180" y1="35" x2="210" y2="35" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* Clinical Benefit Badges */}
            <g transform="translate(24, 24)" filter="url(#subtle-shadow)">
              <rect width="180" height="48" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
              <text x="14" y="20" fill="#6ee7b7" fontSize="10" fontWeight="900">AIRWAY PROTECTION ACTIVE</text>
              <text x="14" y="34" fill="#d1fae5" fontSize="8" fontWeight="600">Free Drainage: Prevents Vomit Aspiration</text>
              <text x="14" y="44" fill="#a7f3d0" fontSize="7" fontFamily="monospace">Stable 3-Point Tripod Support</text>
            </g>
          </g>
        )}

        {/* =================================================================== */}
        {/* SCENE 9: HANDOVER — Paramedic Handover & Hospital Cardiac Telemetry */}
        {/* =================================================================== */}
        {scene === 'handover' && (
          <g>
            {/* ALS Emergency Ambulance (Left) */}
            <g transform="translate(30, 70)" filter="url(#subtle-shadow)">
              {/* Ambulance Body */}
              <rect width="170" height="110" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
              {/* High-Vis Red & Yellow Battenburg Striping */}
              <rect x="0" y="60" width="170" height="24" fill="#dc2626" />
              <rect x="30" y="60" width="30" height="24" fill="#facc15" />
              <rect x="90" y="60" width="30" height="24" fill="#facc15" />
              <rect x="150" y="60" width="20" height="24" fill="#facc15" />

              {/* Cab Window */}
              <polygon points="125,12 160,35 125,35" fill="#38bdf8" fillOpacity="0.8" />
              {/* Star of Life / Red Cross */}
              <circle cx="55" cy="38" r="16" fill="#0284c7" />
              <rect x="52" y="28" width="6" height="20" fill="#ffffff" />
              <rect x="45" y="35" width="20" height="6" fill="#ffffff" />

              {/* Wheels */}
              <circle cx="35" cy="110" r="18" fill="#1e293b" stroke="#475569" strokeWidth="3" />
              <circle cx="135" cy="110" r="18" fill="#1e293b" stroke="#475569" strokeWidth="3" />

              {/* Dual Emergency Strobe Beacons */}
              {pulse && (
                <>
                  <circle cx="20" cy="5" r="8" fill="#ef4444" filter="url(#glow-danger)">
                    <animate attributeName="opacity" values="1;0.2;1" dur="0.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="140" cy="5" r="8" fill="#3b82f6" filter="url(#glow-cyan)">
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="0.4s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </g>

            {/* Hospital Telemetry Monitor HUD (Right) */}
            <g transform="translate(230, 40)" filter="url(#subtle-shadow)">
              <rect width="140" height="150" rx="10" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
              <rect x="10" y="10" width="120" height="24" rx="4" fill="#0f172a" />
              <text x="70" y="26" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                HOSPITAL UPLINK ACTIVE
              </text>

              {/* Real-time Telemetry ECG */}
              <path d="M 15 65 L 35 65 L 40 45 L 46 90 L 52 55 L 58 65 L 90 65 L 95 55 L 102 65 L 125 65" fill="none" stroke="#22c55e" strokeWidth="2" filter="url(#glow-green)" />

              {/* Vitals Grid */}
              <g transform="translate(15, 95)" font-family="monospace" fontSize="8">
                <text x="0" y="12" fill="#94a3b8">HR: <tspan fill="#22c55e" fontWeight="bold">78 BPM</tspan></text>
                <text x="65" y="12" fill="#94a3b8">BP: <tspan fill="#38bdf8" fontWeight="bold">118/74</tspan></text>
                <text x="0" y="28" fill="#94a3b8">SpO2: <tspan fill="#38bdf8" fontWeight="bold">98%</tspan></text>
                <text x="65" y="28" fill="#94a3b8">ROSC: <tspan fill="#22c55e" fontWeight="bold">STABLE</tspan></text>
                <text x="0" y="44" fill="#f59e0b" fontWeight="bold">24hr CARDIAC ICU</text>
              </g>
            </g>

            {/* Clinical Handover SBAR Protocol Badge */}
            <g transform="translate(110, 240)" filter="url(#subtle-shadow)">
              <rect width="180" height="34" rx="8" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
              <text x="90" y="21" textAnchor="middle" fill="#e0e7ff" fontSize="9" fontWeight="900">
                SBAR MEDICAL HANDOVER COMPLETE
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
