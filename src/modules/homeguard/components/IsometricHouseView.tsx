/**
 * 2.5D Isometric House View with X-Ray Peel & Live Physics Particle Overlay
 * 
 * Visual-First Interactive Architecture:
 * - 2.5D Isometric architectural layout (Living Room, Kitchen, Upstairs Bedroom/Bathroom, Outdoor Ground Pit)
 * - X-Ray Peel Toggle: Peels walls and roof to reveal concealed conduit runs and copper wires
 * - Live animated electron flow particles scaling with real-time circuit current
 * - Rich visual fault diagrams:
 *   1. Overload: Fiery conduit thermal glow + rising heat shimmer particles
 *   2. Short Circuit: Blinding electrical arc flash + spark particle fountain
 *   3. Child Shock: Child figure with hairpin at socket, animated shock current tracing to ground
 *   4. Wet Bath: Conductive water spill puddle, ripple leakage current escaping to earth pipe
 *   5. Broken Earth: Outdoor copper grounding electrode pit + severed CPC wire alert
 * - Interactive appliances that can be toggled to alter real-time circuit loading
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { cn } from '@/src/lib/utils';
import {
  Eye,
  Layers,
  Zap,
  Flame,
  AlertTriangle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Check,
  Info,
  Droplets,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { Appliance, AVAILABLE_APPLIANCES } from '../data/residentialProfile';
import { CircuitState } from '../hooks/useHomeGuardEngine';

export interface IsometricHouseViewProps {
  isXRay: boolean;
  onToggleXRay?: () => void;
  circuitStates: Record<string, CircuitState>;
  activeApplianceIds: string[];
  onToggleAppliance: (applianceId: string) => void;
  isTripped: boolean;
  isShortCircuit: boolean;
  isOverloaded: boolean;
  scenarioId?: string;
  onOpenDBBox?: () => void;
  isDaisyChainActive?: boolean;
  onToggleDaisyChain?: () => void;
  className?: string;
}

interface WireParticle {
  x: number;
  y: number;
  progress: number;
  speed: number;
  pathId: 'c1' | 'c2' | 'c3' | 'shock' | 'leak' | 'mains';
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const IsometricHouseView: React.FC<IsometricHouseViewProps> = ({
  isXRay,
  onToggleXRay,
  circuitStates,
  activeApplianceIds,
  onToggleAppliance,
  isTripped,
  isShortCircuit,
  isOverloaded,
  scenarioId = 'winter_overload_145',
  onOpenDBBox,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const c2State = circuitStates.c2_living_sockets;
  const rccbState = circuitStates.main_rccb;
  const currentMult = c2State ? c2State.currentAmps / 16 : 1;

  const [isDaisyChainActive, setIsDaisyChainActive] = useState<boolean>(false);

  // Usability Audit Item 18: Live Wall Socket Wattage Budget
  const livingRoomWatts = useMemo(() => {
    let total = 0;
    if (activeApplianceIds.includes('tv_console')) total += 150;
    if (activeApplianceIds.includes('space_heater')) total += 2000;
    if (activeApplianceIds.includes('kettle')) total += 2200;
    return total;
  }, [activeApplianceIds]);

  const maxSafeWatts = 3680; // 16A * 230V
  const wattPercentage = Math.round((livingRoomWatts / maxSafeWatts) * 100);

  const isChildShock = scenarioId === 'child_touch_shock' || scenarioId === 'preset_child_shock';
  const isWetBath = scenarioId === 'kettle_earth_leakage' || scenarioId === 'preset_wet_bath';
  const isBrokenEarth = scenarioId === 'broken_earth_velcb' || scenarioId === 'preset_broken_earth';

  // Particle Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: WireParticle[] = [];
    let sparks: SparkParticle[] = [];

    // Define 2.5D Isometric projection paths
    const conduits = {
      mains: [
        { x: 390, y: 440 },
        { x: 380, y: 350 },
        { x: 380, y: 260 }
      ],
      c1: [
        { x: 380, y: 260 },
        { x: 380, y: 180 },
        { x: 440, y: 140 }
      ],
      c2: [
        { x: 380, y: 260 },
        { x: 310, y: 300 },
        { x: 230, y: 350 }
      ],
      c3: [
        { x: 380, y: 260 },
        { x: 480, y: 310 },
        { x: 600, y: 350 }
      ],
      shock: [
        { x: 230, y: 345 },
        { x: 218, y: 348 },
        { x: 180, y: 372 },
        { x: 180, y: 422 }
      ],
      leak: [
        { x: 600, y: 350 },
        { x: 620, y: 380 },
        { x: 660, y: 400 }
      ]
    };

    // Initialize flowing electron particles
    const particleCount = isOverloaded ? 42 : 28;
    for (let i = 0; i < particleCount; i++) {
      const paths: ('mains' | 'c1' | 'c2' | 'c3')[] = ['mains', 'c1', 'c2', 'c3'];
      particles.push({
        x: 0,
        y: 0,
        progress: Math.random(),
        speed: 0.006 + Math.random() * 0.007,
        pathId: paths[i % paths.length]
      });
    }

    // Add shock particles if child shock active and not tripped
    if (isChildShock && !isTripped) {
      for (let i = 0; i < 12; i++) {
        particles.push({
          x: 0,
          y: 0,
          progress: Math.random(),
          speed: 0.025 + Math.random() * 0.02,
          pathId: 'shock'
        });
      }
    }

    // Add leakage particles if wet bath active and not tripped
    if (isWetBath && !isTripped) {
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: 0,
          y: 0,
          progress: Math.random(),
          speed: 0.015 + Math.random() * 0.012,
          pathId: 'leak'
        });
      }
    }

    const interpolatePath = (path: { x: number; y: number }[], t: number) => {
      if (path.length === 2) {
        return {
          x: path[0].x + (path[1].x - path[0].x) * t,
          y: path[0].y + (path[1].y - path[0].y) * t
        };
      }
      if (path.length === 3) {
        if (t < 0.5) {
          const segT = t * 2;
          return {
            x: path[0].x + (path[1].x - path[0].x) * segT,
            y: path[0].y + (path[1].y - path[0].y) * segT
          };
        }
        const segT = (t - 0.5) * 2;
        return {
          x: path[1].x + (path[2].x - path[1].x) * segT,
          y: path[1].y + (path[2].y - path[1].y) * segT
        };
      }
      // 4-point path
      const seg = Math.min(2, Math.floor(t * 3));
      const segT = (t * 3) - seg;
      const p1 = path[seg];
      const p2 = path[seg + 1];
      return {
        x: p1.x + (p2.x - p1.x) * segT,
        y: p1.y + (p2.y - p1.y) * segT
      };
    };

    let frameCount = 0;

    const loop = () => {
      frameCount++;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Coordinate scaling
      const scaleX = width / 800;
      const scaleY = height / 500;

      // 1. Draw Flowing Electron Energy Pulses with Glowing Comet Trails
      if (isXRay && !isTripped) {
        particles.forEach(p => {
          const speedFactor = isOverloaded && p.pathId === 'c2' ? 3.0 : 1.0;
          p.progress += p.speed * speedFactor;
          if (p.progress > 1) p.progress = 0;

          const path = conduits[p.pathId];
          if (!path) return;

          // Head position
          const pos = interpolatePath(path, p.progress);
          const px = pos.x * scaleX;
          const py = pos.y * scaleY;

          // Tail position (slightly behind)
          const tailProg = Math.max(0, p.progress - 0.04 * speedFactor);
          const tailPos = interpolatePath(path, tailProg);
          const tx = tailPos.x * scaleX;
          const ty = tailPos.y * scaleY;

          if (p.pathId === 'shock') {
            // High-voltage lethal shock red pulse
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(px, py);
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(px, py, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#f87171';
            ctx.shadowBlur = 10;
            ctx.fill();
          } else if (p.pathId === 'leak') {
            // Water leakage yellow/amber pulse
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#facc15';
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 8;
            ctx.fill();
          } else {
            // Normal / Overloaded circuit flow
            const isHot = isOverloaded && p.pathId === 'c2';
            
            // Draw energy comet tail
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(px, py);
            ctx.strokeStyle = isHot ? '#f59e0b' : '#38bdf8';
            ctx.lineWidth = isHot ? 3.5 : 2.5;
            ctx.shadowColor = isHot ? '#ea580c' : '#0284c7';
            ctx.shadowBlur = isHot ? 10 : 6;
            ctx.stroke();

            // Draw glowing electron head
            ctx.beginPath();
            ctx.arc(px, py, isHot ? 4 : 3, 0, Math.PI * 2);
            ctx.fillStyle = isHot ? '#fef08a' : '#e0f2fe';
            ctx.shadowColor = isHot ? '#f59e0b' : '#38bdf8';
            ctx.shadowBlur = isHot ? 12 : 8;
            ctx.fill();
          }
        });
      }

      // 2. Short Circuit: Blinding Arc Explosion + Branching Lightning Bolts
      if (isShortCircuit) {
        // Draw dramatic branching lightning bolts
        const arcX = 230 * scaleX;
        const arcY = 350 * scaleY;

        // Lightning flash glow core
        ctx.beginPath();
        ctx.arc(arcX, arcY, 16 + (frameCount % 6) * 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 24;
        ctx.fill();

        // 3-4 Jagged Lightning Arcs radiating out
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.moveTo(arcX, arcY);
          let currX = arcX;
          let currY = arcY;
          const targetAngle = (j * Math.PI / 2) + ((frameCount * 0.4) % 1.5) - 0.75;
          const length = 20 + Math.random() * 25;
          const steps = 4;
          for (let s = 1; s <= steps; s++) {
            currX += Math.cos(targetAngle) * (length / steps) + (Math.random() - 0.5) * 14;
            currY += Math.sin(targetAngle) * (length / steps) + (Math.random() - 0.5) * 14;
            ctx.lineTo(currX, currY);
          }
          ctx.strokeStyle = Math.random() > 0.3 ? '#ffffff' : '#38bdf8';
          ctx.lineWidth = 2 + Math.random() * 1.5;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.stroke();
        }

        // Shower of exploding sparks
        if (sparks.length < 50 && Math.random() < 0.8) {
          for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 5.5;
            sparks.push({
              x: arcX,
              y: arcY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 1.5,
              life: 1,
              maxLife: 20 + Math.random() * 20,
              color: Math.random() > 0.4 ? '#fef08a' : '#fb923c',
              size: 2 + Math.random() * 2.5
            });
          }
        }
      }

      // 3. Child Shock: Electrical Crackles at Socket Needle
      if (isChildShock && !isTripped) {
        const needleX = 215 * scaleX;
        const needleY = 352 * scaleY;

        // Flickering crackle corona
        ctx.beginPath();
        ctx.arc(needleX, needleY, 6 + (frameCount % 4) * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.fill();

        if (sparks.length < 25 && Math.random() < 0.5) {
          for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2.5;
            sparks.push({
              x: needleX,
              y: needleY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 0.5,
              life: 1,
              maxLife: 15 + Math.random() * 12,
              color: '#38bdf8',
              size: 1.5 + Math.random() * 1.5
            });
          }
        }
      }

      // 4. Overload: Rising Smoke Wisps & Heat Waves
      if (isOverloaded && !isTripped) {
        // Smoke wisps drifting upward from the hot cable run
        if (Math.random() < 0.35) {
          sparks.push({
            x: (250 + Math.random() * 60) * scaleX,
            y: 330 * scaleY,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -0.9 - Math.random() * 0.9,
            life: 1,
            maxLife: 45 + Math.random() * 25,
            color: 'rgba(251, 191, 36, 0.5)',
            size: 2.5 + Math.random() * 3
          });
        }
      }

      // 5. Wet Bath: Concentric Expanding Water Ripples
      if (isWetBath && !isTripped && frameCount % 20 === 0) {
        sparks.push({
          x: 620 * scaleX,
          y: 375 * scaleY,
          vx: 0,
          vy: 0,
          life: 1,
          maxLife: 40,
          color: 'rgba(56, 189, 248, 0.5)',
          size: 4
        });
      }

      // Render and update all dynamic spark, smoke & ripple particles
      sparks = sparks.filter(s => s.life < s.maxLife);
      sparks.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;

        const alpha = 1 - s.life / s.maxLife;

        // If it's a ripple (vx=0, vy=0)
        if (s.vx === 0 && s.vy === 0) {
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.size * (s.life * 0.6), s.size * (s.life * 0.3), 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * (s.life > 15 ? alpha * 1.5 : 1), 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 8;
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isXRay, isTripped, isOverloaded, isShortCircuit, isChildShock, isWetBath]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-gradient-to-b from-slate-950 via-[#0a101d] to-[#060a14] overflow-hidden flex flex-col font-mono select-none",
        className
      )}
    >
      {/* MAIN 2.5D ISOMETRIC SVG & PARTICLE CANVAS STAGE */}
      <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden flex items-center justify-center">
        
        {/* SVG Projection (Optimized zoom viewBox) */}
        <svg
          viewBox="30 40 740 440"
          className="w-full h-full max-h-full object-contain overflow-visible select-none"
        >
          <defs>
            {/* Lawn Radial Gradient */}
            <radialGradient id="lawnGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f2b20" />
              <stop offset="100%" stopColor="#05120c" />
            </radialGradient>

            {/* Wall Shading */}
            <linearGradient id="wallLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="wallRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Roof Shading */}
            <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Conduit Heat Glow Filter */}
            <filter id="conduitGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={isOverloaded ? "5" : "2"} result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>

            {/* Shock Arc Glow */}
            <filter id="shockGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* 1. ISOMETRIC GROUND BASE SLAB */}
          <g transform="translate(0, 0)">
            <polygon
              points="400,90 760,270 400,450 40,270"
              fill="url(#lawnGrad)"
              stroke="#1e3a2f"
              strokeWidth="2"
            />
            {/* Front walkway */}
            <polygon
              points="400,450 470,415 430,360 360,395"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
          </g>

          {/* 2. OUTDOOR GROUNDING ELECTRODE PIT (EARTH SPIKE & CHAMBER) */}
          <g id="ground-earth-pit" transform="translate(100, 370)">
            {/* Pit cover ellipse */}
            <ellipse cx="0" cy="0" rx="36" ry="18" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <ellipse cx="0" cy="0" rx="28" ry="14" fill="#0f172a" stroke="#16a34a" strokeWidth="1.5" />
            
            {/* Copper Rod driving into soil */}
            <line x1="0" y1="0" x2="0" y2="70" stroke="#b45309" strokeWidth="6" strokeLinecap="round" />
            <line x1="0" y1="0" x2="0" y2="70" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            
            {/* Earth symbol marks in soil */}
            <line x1="-14" y1="50" x2="14" y2="50" stroke="#16a34a" strokeWidth="2" />
            <line x1="-9" y1="58" x2="9" y2="58" stroke="#16a34a" strokeWidth="1.5" />
            <line x1="-4" y1="65" x2="4" y2="65" stroke="#16a34a" strokeWidth="1" />
            
            <text x="0" y="-22" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="black" fontFamily="monospace">
              EARTH ELECTRODE PIT
            </text>
            <text x="0" y="24" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">
              Ra ≈ 5.2 Ω (Solid Soil Ground)
            </text>

            {/* Protective Earth (PE) Green/Yellow Conductor to DB Box */}
            <path
              d="M 0 0 L 100 -40 L 260 -110"
              fill="none"
              stroke={isBrokenEarth ? "#ef4444" : "#22c55e"}
              strokeWidth={isBrokenEarth ? "3" : "2.5"}
              strokeDasharray={isBrokenEarth ? "6,4" : undefined}
            />

            {/* Broken Earth Fault Callout */}
            {isBrokenEarth && (
              <g transform="translate(100, -40)">
                <circle cx="0" cy="0" r="16" fill="#ef4444" fillOpacity="0.4" className="animate-ping" />
                <circle cx="0" cy="0" r="12" fill="#991b1b" stroke="#ef4444" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="black">✕</text>
                <text x="0" y="-18" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="black" fontFamily="monospace">
                  ⚠️ SEVERED EARTH WIRE (CPC BROKEN)!
                </text>
              </g>
            )}
          </g>

          {/* 3. ARCHITECTURAL SHELL (PEELS WHEN X-RAY IS ACTIVE) */}
          {!isXRay ? (
            <g id="exterior-house">
              {/* Ground Floor Left Wall */}
              <polygon
                points="160,250 400,370 400,230 160,110"
                fill="url(#wallLeft)"
                stroke="#475569"
                strokeWidth="2"
              />
              {/* Ground Floor Right Wall */}
              <polygon
                points="400,370 640,250 640,110 400,230"
                fill="url(#wallRight)"
                stroke="#64748b"
                strokeWidth="2"
              />

              {/* Front Door */}
              <polygon
                points="380,340 400,350 400,280 380,270"
                fill="#b45309"
                stroke="#d97706"
                strokeWidth="1.5"
              />

              {/* Living Room Window */}
              <polygon
                points="220,260 320,310 320,240 220,190"
                fill="#fef08a"
                fillOpacity="0.3"
                stroke="#facc15"
                strokeWidth="1.5"
              />

              {/* Kitchen Window */}
              <polygon
                points="480,310 580,260 580,190 480,240"
                fill="#38bdf8"
                fillOpacity="0.3"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />

              {/* Sloped Roof */}
              <polygon
                points="130,110 400,10 400,90 130,190"
                fill="url(#roofGrad)"
                stroke="#64748b"
                strokeWidth="2"
              />
              <polygon
                points="400,10 670,110 670,190 400,90"
                fill="#334155"
                stroke="#64748b"
                strokeWidth="2"
              />

              {/* Chimney */}
              <polygon points="460,30 500,50 500,10 460,-10" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1" />

              {/* Exterior Inspection Callout */}
              <g transform="translate(400, 410)" onClick={onToggleXRay} className="cursor-pointer">
                <rect x="-130" y="-14" width="260" height="28" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  👆 CLICK "PEEL WALLS (X-RAY)" TO SEE WIRES
                </text>
              </g>
            </g>
          ) : (
            /* ========================================================= */
            /* 4. X-RAY CONCEALED WIRING, CONDUITS & INTERIOR ROOMS      */
            /* ========================================================= */
            <g id="xray-house">
              {/* Room Floor Outlines */}
              <polygon points="160,250 400,370 340,340 160,250" fill="#1e293b" fillOpacity="0.45" stroke="#334155" strokeWidth="1" />
              <polygon points="400,370 640,250 580,220 400,370" fill="#1e293b" fillOpacity="0.45" stroke="#334155" strokeWidth="1" />
              <polygon points="260,170 540,170 400,240 260,170" fill="#0f172a" fillOpacity="0.55" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />

              {/* ROOM LABELS */}
              <text x="240" y="235" fill="#94a3b8" fontSize="12" fontWeight="black" fontFamily="sans-serif">
                LIVING ROOM
              </text>
              <text x="520" y="235" fill="#94a3b8" fontSize="12" fontWeight="black" fontFamily="sans-serif">
                KITCHEN
              </text>
              <text x="320" y="105" fill="#94a3b8" fontSize="11" fontWeight="black" fontFamily="sans-serif">
                UPSTAIRS BEDROOM & BATH
              </text>

              {/* MAINS INCOMING SERVICE CABLE (UNDERGROUND TO DB BOX) */}
              <g id="mains-incomer">
                <path
                  d="M 400 450 L 380 360 L 380 260"
                  fill="none"
                  stroke="#475569"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M 400 450 L 380 360 L 380 260"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="6,4"
                />
                <text x="405" y="430" fill="#f97316" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  230V MAINS INCOMING
                </text>
              </g>

              {/* MAIN CONSUMER UNIT (DB BOX) NODE */}
              <g
                id="db-box-node"
                transform="translate(360, 226)"
                onClick={onOpenDBBox}
                className="cursor-pointer group"
              >
                <rect
                  x="0" y="0" width="50" height="46" rx="6"
                  fill="#0f172a"
                  stroke={isTripped ? "#ef4444" : "#10b981"}
                  strokeWidth="2.5"
                  filter="drop-shadow(0 0 10px rgba(0,0,0,0.8))"
                />
                <rect x="4" y="4" width="42" height="38" rx="3" fill="#1e293b" />
                {/* 4 Miniature Breakers on DIN rail */}
                {/* C1 Lighting */}
                <rect x="7" y="10" width="6" height="24" rx="1" fill="#0f172a" />
                <line x1="10" y1="12" x2="10" y2="22" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
                {/* C3 Kitchen */}
                <rect x="16" y="10" width="6" height="24" rx="1" fill="#0f172a" />
                <line x1="19" y1="12" x2="19" y2="22" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                {/* C2 Sockets (trips DOWN when overload or short) */}
                <rect x="25" y="10" width="7" height="24" rx="1" fill="#0f172a" />
                <line
                  x1="28.5"
                  y1={c2State.state !== 'CLOSED' ? 22 : 12}
                  x2="28.5"
                  y2={c2State.state !== 'CLOSED' ? 32 : 22}
                  stroke={c2State.state !== 'CLOSED' ? "#ef4444" : "#10b981"}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* RCCB (trips DOWN when earth leakage or shock) */}
                <rect x="35" y="10" width="7" height="24" rx="1" fill="#0f172a" />
                <line
                  x1="38.5"
                  y1={rccbState.state !== 'CLOSED' ? 22 : 12}
                  x2="38.5"
                  y2={rccbState.state !== 'CLOSED' ? 32 : 22}
                  stroke={rccbState.state !== 'CLOSED' ? "#ef4444" : "#10b981"}
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Status indicator LED */}
                <circle
                  cx="43" cy="7" r="3"
                  fill={isTripped ? "#ef4444" : "#10b981"}
                  className={isTripped ? "animate-ping" : undefined}
                />

                <text x="25" y="58" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="black" fontFamily="monospace">
                  DB BOX
                </text>
              </g>

              {/* CONDUIT C1: UPSTAIRS LIGHTING */}
              <g id="conduit-c1">
                <path d="M 380 260 L 380 180 L 440 140" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <path d="M 380 260 L 380 180 L 440 140" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                {/* Light bulb */}
                <circle cx="440" cy="140" r="10" fill="#fef08a" fillOpacity="0.85" stroke="#facc15" strokeWidth="1.5" />
                <text x="440" y="158" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold">
                  Lights (1.5A)
                </text>
              </g>

              {/* CONDUIT C3: KITCHEN HEAVY SOCKETS */}
              <g id="conduit-c3">
                <path d="M 380 260 L 480 310 L 600 350" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <path d="M 380 260 L 480 310 L 600 350" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                {/* Kitchen Counter Socket */}
                <circle cx="600" cy="350" r="12" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                <text x="600" y="375" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">
                  Kitchen Sockets
                </text>

                {/* Wet Bathroom / Water Leakage Diagram */}
                {isWetBath && (
                  <g transform="translate(600, 350)">
                    {/* Conductive Water Spill Puddle */}
                    <ellipse cx="20" cy="30" rx="35" ry="15" fill="#0284c7" fillOpacity="0.6" stroke="#38bdf8" strokeWidth="1.5" />
                    {/* Ripple animation */}
                    <ellipse cx="20" cy="30" rx="45" ry="20" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4,4" className="animate-pulse" />
                    
                    {/* Water Droplets */}
                    <Droplets className="w-5 h-5 text-cyan-300" x="10" y="15" />

                    {/* Earth Water Pipe Escape Route */}
                    <line x1="55" y1="30" x2="80" y2="60" stroke="#b45309" strokeWidth="4" />
                    <text x="30" y="55" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      💧 45mA LEAKAGE → WATER PIPE
                    </text>

                    {/* Skin Armor Metaphor */}
                    <g transform="translate(20, 60)">
                      <rect x="-105" y="-11" width="210" height="22" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                      <text x="0" y="4" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                        💧 WET SKIN: 2,000Ω ARMOR DROPS TO 500Ω!
                      </text>
                    </g>

                    {isTripped ? (
                      <g transform="translate(20, -10)">
                        <rect x="-65" y="-12" width="130" height="24" rx="12" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                        <text x="0" y="4" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="bold">
                          🛡️ RCCB TRIPPED IN 32ms
                        </text>
                      </g>
                    ) : (
                      <g transform="translate(20, -10)">
                        <rect x="-65" y="-12" width="130" height="24" rx="12" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                        <text x="0" y="4" textAnchor="middle" fill="#fecaca" fontSize="9" fontWeight="bold" className="animate-pulse">
                          ⚠️ WATER INGRESS LEAKAGE!
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </g>

              {/* CONDUIT C2: LIVING ROOM SOCKET CIRCUIT */}
              <g id="conduit-c2">
                <path d="M 380 260 L 310 300 L 230 350" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                
                {/* Copper Conductor with dynamic heat color */}
                <path
                  d="M 380 260 L 310 300 L 230 350"
                  fill="none"
                  stroke={
                    isTripped ? "#475569" :
                    isOverloaded ? "#f59e0b" :
                    currentMult > 1.0 ? "#fbbf24" : "#10b981"
                  }
                  strokeWidth={isOverloaded ? "5" : "3"}
                  strokeLinecap="round"
                  filter={isOverloaded ? "url(#conduitGlow)" : undefined}
                />

                {/* Overload Heat Wave Banner */}
                {isOverloaded && !isTripped && (
                  <g transform="translate(280, 296)">
                    <rect x="-60" y="-12" width="120" height="24" rx="12" fill="#78350f" stroke="#f59e0b" strokeWidth="2" className="animate-pulse" />
                    <text x="0" y="4" textAnchor="middle" fill="#fef08a" fontSize="9.5" fontWeight="black" fontFamily="monospace">
                      🔥 CABLE OVERHEATING!
                    </text>
                  </g>
                )}

                {/* Wall Socket Board */}
                <g transform="translate(210, 330)">
                  <rect
                    x="0" y="0" width="40" height="36" rx="4"
                    fill="#0f172a"
                    stroke={isShortCircuit ? "#ef4444" : isOverloaded ? "#f59e0b" : "#38bdf8"}
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="18" r="3" fill="#1e293b" stroke="#64748b" />
                  <circle cx="28" cy="18" r="3" fill="#1e293b" stroke="#64748b" />
                  <line x1="20" y1="8" x2="20" y2="14" stroke="#16a34a" strokeWidth="1.5" />
                  <text x="20" y="48" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    SOCKET 16A
                  </text>
                </g>

                {/* 4-Way Multi-Plug Extension Strip */}
                <g
                  transform="translate(195, 322)"
                  onClick={() => setIsDaisyChainActive(v => !v)}
                  className="cursor-pointer group"
                >
                  <rect
                    x="0" y="0" width="46" height="18" rx="4"
                    fill={isDaisyChainActive ? "#334155" : "#1e293b"}
                    stroke={isDaisyChainActive ? (livingRoomWatts > 3500 ? "#ef4444" : "#f59e0b") : "#475569"}
                    strokeWidth={isDaisyChainActive ? 2 : 1}
                  />
                  <circle cx="8" cy="9" r="2.2" fill="#0f172a" />
                  <circle cx="18" cy="9" r="2.2" fill="#0f172a" />
                  <circle cx="28" cy="9" r="2.2" fill="#0f172a" />
                  <circle cx="38" cy="9" r="2.2" fill="#0f172a" />
                  <text x="23" y="13" textAnchor="middle" fill="#94a3b8" fontSize="4.8" fontWeight="bold" fontFamily="monospace">
                    MULTI-PLUG
                  </text>
                  {isDaisyChainActive && livingRoomWatts > 3500 && !isTripped && (
                    <g transform="translate(23, -12)">
                      <rect x="-65" y="-10" width="130" height="20" rx="10" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#fecaca" fontSize="7" fontWeight="black" fontFamily="monospace">
                        🔥 MULTI-PLUG MELTING!
                      </text>
                    </g>
                  )}
                </g>

                {/* Short Circuit Fault Arc Flash */}
                {isShortCircuit && (
                  <g transform="translate(230, 350)">
                    <circle cx="0" cy="0" r="28" fill="#ef4444" fillOpacity="0.45" className="animate-ping" />
                    <polygon points="0,-22 6,-6 22,-5 10,5 14,20 0,10 -14,20 -10,5 -22,-5 -6,-6" fill="#fef08a" stroke="#f97316" strokeWidth="2" filter="url(#shockGlow)" />
                    <text x="0" y="-30" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="black" fontFamily="monospace">
                      ⚡ BOLTED SHORT CIRCUIT (250A)!
                    </text>
                  </g>
                )}

                {/* CHILD TOUCH SHOCK DIAGRAM */}
                {isChildShock && (
                  <g id="child-shock-diagram" transform="translate(180, 340)">
                    {/* Child figure */}
                    {/* Head */}
                    <circle cx="0" cy="10" r="10" fill="#fed7aa" stroke="#f97316" strokeWidth="1.5" />
                    {/* Hair */}
                    <path d="M -10 8 Q 0 -3 10 8" fill="#78350f" stroke="#78350f" strokeWidth="3" />
                    
                    {/* Torso / Shirt */}
                    <polygon points="-8,20 8,20 12,50 -12,50" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />

                    {/* Left Arm holding metallic hairpin into socket */}
                    <line x1="4" y1="26" x2="30" y2="10" stroke="#fed7aa" strokeWidth="3.5" strokeLinecap="round" />
                    {/* Hairpin needle entering socket */}
                    <line x1="28" y1="11" x2="40" y2="8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

                    {/* Right Arm */}
                    <line x1="-8" y1="26" x2="-18" y2="38" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" />

                    {/* Legs standing on floor */}
                    <line x1="-5" y1="50" x2="-8" y2="80" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                    <line x1="5" y1="50" x2="8" y2="80" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

                    {/* Bare Feet on Ground */}
                    <ellipse cx="-10" cy="82" rx="5" ry="2.5" fill="#fed7aa" />
                    <ellipse cx="10" cy="82" rx="5" ry="2.5" fill="#fed7aa" />

                    {/* LIVE SHOCK MANIFESTATION (When not tripped) */}
                    {!isTripped ? (
                      <>
                        {/* Electrical Crackle Corona at Pin */}
                        <circle cx="38" cy="8" r="8" fill="#38bdf8" fillOpacity="0.5" className="animate-ping" />
                        
                        {/* Path of shock current through heart */}
                        <path
                          d="M 38 8 L 15 25 L 0 35 L 0 55 L 8 82"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2.5"
                          strokeDasharray="4,2"
                          className="animate-pulse"
                        />

                        {/* Heart Fibrillation Icon */}
                        <g transform="translate(0, 32)">
                          <circle cx="0" cy="0" r="7" fill="#ef4444" className="animate-ping" />
                          <HeartPulse className="w-3.5 h-3.5 text-white -translate-x-1.5 -translate-y-1.5" />
                        </g>

                        {/* Danger callout */}
                        <g transform="translate(0, -18)">
                          <rect x="-70" y="-12" width="140" height="24" rx="12" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                          <text x="0" y="4" textAnchor="middle" fill="#fecaca" fontSize="8.5" fontWeight="black" fontFamily="monospace">
                            ⚡ 230mA SHOCK CURRENT!
                          </text>
                        </g>
                      </>
                    ) : (
                      /* SAVED BY RCCB FORCE-FIELD SHIELD */
                      <g transform="translate(0, 42)">
                        {/* Radiant Emerald Force-Field Bubble */}
                        <circle cx="0" cy="0" r="54" fill="#10b981" fillOpacity="0.16" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6,3" className="animate-pulse" />
                        <circle cx="0" cy="0" r="46" fill="none" stroke="#34d399" strokeWidth="1.5" />
                        
                        {/* Safe Shield Callout Badge */}
                        <g transform="translate(0, -66)">
                          <rect x="-85" y="-14" width="170" height="28" rx="14" fill="#064e3b" stroke="#10b981" strokeWidth="2" filter="drop-shadow(0 0 10px rgba(16,185,129,0.7))" />
                          <text x="0" y="4" textAnchor="middle" fill="#a7f3d0" fontSize="9.5" fontWeight="black">
                            🛡️ SAVED! SHOCK CUT IN 0.03s
                          </text>
                        </g>
                      </g>
                    )}
                  </g>
                )}
              </g>

              {/* 5. INTERACTIVE APPLIANCES IN ROOMS */}
              {/* Space Heater in Living Room */}
              <g
                transform="translate(136, 346)"
                onClick={() => onToggleAppliance('space_heater')}
                className="cursor-pointer group"
              >
                <rect
                  x="0" y="0" width="58" height="46" rx="6"
                  fill={activeApplianceIds.includes('space_heater') ? "#7c2d12" : "#1e293b"}
                  stroke={activeApplianceIds.includes('space_heater') ? "#ea580c" : "#475569"}
                  strokeWidth="2"
                  filter="drop-shadow(0 0 6px rgba(0,0,0,0.6))"
                />
                {/* Glowing element coils */}
                <line x1="8" y1="12" x2="50" y2="12" stroke={activeApplianceIds.includes('space_heater') ? "#fb923c" : "#64748b"} strokeWidth="2" />
                <line x1="8" y1="18" x2="50" y2="18" stroke={activeApplianceIds.includes('space_heater') ? "#fb923c" : "#64748b"} strokeWidth="2" />
                <Flame className={cn("w-3 h-3 mx-auto mt-5", activeApplianceIds.includes('space_heater') ? "text-orange-400 animate-pulse" : "text-slate-500")} />
                <text x="29" y="34" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                  HEATER (2000W)
                </text>
                <text x="29" y="42" textAnchor="middle" fill="#fb923c" fontSize="6" fontWeight="black">
                  HEAVY EATER 🔴
                </text>

                {/* Animated Rising Thermal Waves when Heater is ON */}
                {activeApplianceIds.includes('space_heater') && !isTripped && (
                  <g transform="translate(29, -8)">
                    <path d="M -12 0 Q -8 -6 -12 -12" fill="none" stroke="#fb923c" strokeWidth="1.5" className="animate-pulse" />
                    <path d="M 0 0 Q 4 -6 0 -12" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />
                    <path d="M 12 0 Q 16 -6 12 -12" fill="none" stroke="#fb923c" strokeWidth="1.5" className="animate-pulse" />
                  </g>
                )}
              </g>

              {/* Electric Kettle */}
              <g
                transform="translate(136, 290)"
                onClick={() => onToggleAppliance('kettle')}
                className="cursor-pointer group"
              >
                <rect
                  x="0" y="0" width="58" height="44" rx="6"
                  fill={activeApplianceIds.includes('kettle') ? "#0369a1" : "#1e293b"}
                  stroke={activeApplianceIds.includes('kettle') ? "#0284c7" : "#475569"}
                  strokeWidth="2"
                  filter="drop-shadow(0 0 6px rgba(0,0,0,0.6))"
                />
                <Zap className={cn("w-3 h-3 mx-auto mt-1", activeApplianceIds.includes('kettle') ? "text-cyan-400" : "text-slate-500")} />
                <text x="29" y="28" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                  KETTLE (2200W)
                </text>
                <text x="29" y="38" textAnchor="middle" fill="#38bdf8" fontSize="6" fontWeight="black">
                  HEAVY EATER 🔴
                </text>

                {/* Animated Steam Puffs when Kettle is ON */}
                {activeApplianceIds.includes('kettle') && !isTripped && (
                  <g transform="translate(48, 4)">
                    <circle cx="0" cy="0" r="3" fill="#e0f2fe" fillOpacity="0.7" className="animate-ping" />
                  </g>
                )}
              </g>

              {/* Microwave in Kitchen */}
              <g
                transform="translate(616, 308)"
                onClick={() => onToggleAppliance('microwave')}
                className="cursor-pointer group"
              >
                <rect
                  x="0" y="0" width="58" height="42" rx="6"
                  fill={activeApplianceIds.includes('microwave') ? "#065f46" : "#1e293b"}
                  stroke={activeApplianceIds.includes('microwave') ? "#10b981" : "#475569"}
                  strokeWidth="2"
                />
                <text x="29" y="22" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="bold">
                  MICROWAVE (1200W)
                </text>
                <text x="29" y="34" textAnchor="middle" fill="#a7f3d0" fontSize="6" fontWeight="black">
                  MEDIUM EATER 🟡
                </text>

                {/* Microwave Chamber Glow when ON */}
                {activeApplianceIds.includes('microwave') && !isTripped && (
                  <rect x="6" y="6" width="24" height="24" rx="2" fill="#fef08a" fillOpacity="0.3" className="animate-pulse" />
                )}
              </g>

              {/* Living Room TV Unit */}
              <g
                transform="translate(206, 260)"
                onClick={() => onToggleAppliance('tv_console')}
                className="cursor-pointer group"
              >
                <rect
                  x="0" y="0" width="52" height="34" rx="4"
                  fill={activeApplianceIds.includes('tv_console') ? "#1e1b4b" : "#0f172a"}
                  stroke={activeApplianceIds.includes('tv_console') ? "#6366f1" : "#334155"}
                  strokeWidth="1.5"
                />
                {activeApplianceIds.includes('tv_console') && !isTripped ? (
                  <rect x="3" y="3" width="46" height="24" rx="2" fill="#3b82f6" fillOpacity="0.35" className="animate-pulse" />
                ) : (
                  <rect x="3" y="3" width="46" height="24" rx="2" fill="#020617" />
                )}
                <text x="26" y="31" textAnchor="middle" fill="#a5b4fc" fontSize="5.5" fontWeight="bold">
                  TV UNIT (150W)
                </text>
              </g>
            </g>
          )}
        </svg>

        {/* PIXI / CANVAS PARTICLE OVERLAY */}
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      </div>
    </div>
  );
};
