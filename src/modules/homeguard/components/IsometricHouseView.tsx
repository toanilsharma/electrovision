/**
 * IsometricHouseView.tsx
 * 
 * Rich 2.5D Architectural Home Cutaway with Clean Wire Routing & Distributed Appliances
 * 
 * 100% Mass-Audience Friendly & Zero Clutter Architecture:
 * - Clean, non-crossing wire conduits running from Central DB Box in separate directions:
 *   1. Left Ground -> 🛋️ Living Room: Space Heater (2000W), Living AC (1500W), Smart TV (150W), Wall Socket
 *   2. Right Ground -> 🍳 Kitchen: Kettle (2200W), OTG Oven (1400W), Refrigerator (200W)
 *   3. Right Upstairs -> 🚿 Bathroom: Water Geyser (2000W), Exhaust Fan
 *   4. Left Upstairs -> 🛏️ Bedroom: Bedroom AC (1500W), Ceiling Lamp
 *   5. Bottom Outdoor -> ⚡ Street Feeder Incomer with 1-Click Mains ON/OFF toggle & 🌱 Earth Ground Pit
 * - Big, high-contrast readable typography (>=12px-16px)
 * - Live animated electron comet trails matching active appliance current
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
  Sparkles,
  Home,
  Power,
  Wind
} from 'lucide-react';
import { CircuitState } from '../hooks/useHomeGuardEngine';
import { HomeGuardSLDView } from './HomeGuardSLDView';

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
  progress: number;
  speed: number;
  pathId: 'mains' | 'living' | 'kitchen' | 'bathroom' | 'bedroom' | 'shock' | 'leak';
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
  scenarioId = 'normal_living',
  onOpenDBBox,
  isDaisyChainActive: externalDaisyChain,
  onToggleDaisyChain: externalToggleDaisyChain,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active View Mode: 'house' | 'sld' | 'xray'
  const [activeViewMode, setActiveViewMode] = useState<'house' | 'sld' | 'xray'>(() => {
    return isXRay ? 'xray' : 'house';
  });

  // Master Mains Supply Switch (User can toggle entire house electricity ON/OFF)
  const [isMainsSupplyOn, setIsMainsSupplyOn] = useState<boolean>(true);

  const [internalDaisyChain, setInternalDaisyChain] = useState<boolean>(false);
  const isDaisyChainActive = externalDaisyChain !== undefined ? externalDaisyChain : internalDaisyChain;
  const toggleDaisyChain = externalToggleDaisyChain || (() => setInternalDaisyChain(v => !v));

  useEffect(() => {
    if (isXRay && activeViewMode === 'house') {
      setActiveViewMode('xray');
    } else if (!isXRay && activeViewMode === 'xray') {
      setActiveViewMode('house');
    }
  }, [isXRay]);

  const handleSelectViewMode = (mode: 'house' | 'sld' | 'xray') => {
    setActiveViewMode(mode);
    if (mode === 'xray' && onToggleXRay && !isXRay) {
      onToggleXRay();
    } else if (mode !== 'xray' && onToggleXRay && isXRay) {
      onToggleXRay();
    }
  };

  const c2State = circuitStates.c2_living_sockets;
  const rccbState = circuitStates.main_rccb;
  const currentMult = c2State ? c2State.currentAmps / 16 : 1;

  // Power Calculation across all rooms
  const powerMetrics = useMemo(() => {
    let livingWatts = 0;
    let kitchenWatts = 0;
    let bathWatts = 0;
    let bedWatts = 0;

    if (activeApplianceIds.includes('tv_console')) livingWatts += 150;
    if (activeApplianceIds.includes('space_heater')) livingWatts += 2000;
    if (activeApplianceIds.includes('air_conditioner')) livingWatts += 1500;

    if (activeApplianceIds.includes('kettle')) kitchenWatts += 2200;
    if (activeApplianceIds.includes('otg_oven') || activeApplianceIds.includes('microwave')) kitchenWatts += 1400;
    if (activeApplianceIds.includes('refrigerator')) kitchenWatts += 200;

    if (activeApplianceIds.includes('water_geyser')) bathWatts += 2000;
    if (activeApplianceIds.includes('exhaust_fan')) bathWatts += 50;

    if (activeApplianceIds.includes('bedroom_ac')) bedWatts += 1500;
    if (activeApplianceIds.includes('bed_lamp')) bedWatts += 100;

    const totalWatts = livingWatts + kitchenWatts + bathWatts + bedWatts;
    return { livingWatts, kitchenWatts, bathWatts, bedWatts, totalWatts };
  }, [activeApplianceIds]);

  // Exact Branch Amperage (Physics Engine Synced: I = P / V)
  const livingAmps = Number((powerMetrics.livingWatts / 230).toFixed(1));
  const kitchenAmps = Number((powerMetrics.kitchenWatts / 230).toFixed(1));
  const bathAmps = Number((powerMetrics.bathWatts / 230).toFixed(1));
  const bedAmps = Number((powerMetrics.bedWatts / 230).toFixed(1));
  const totalAmps = Number((powerMetrics.totalWatts / 230).toFixed(1));

  const isPowerFlowing = isMainsSupplyOn && !isTripped;
  const isChildShock = scenarioId === 'child_touch_shock' || scenarioId === 'preset_child_shock';
  const isWetBath = scenarioId === 'kettle_earth_leakage' || scenarioId === 'preset_wet_bath';
  const isBrokenEarth = scenarioId === 'broken_earth_velcb' || scenarioId === 'preset_broken_earth';

// Live Particle & Thermal Wire Animation Loop (100% Physics Synced)
  useEffect(() => {
    if (activeViewMode === 'sld') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sparks: SparkParticle[] = [];

    // Precise Non-Overlapping Conduit & Appliance Branch Paths (800x500 space)
    const wirePaths = {
      // 1. Street Service Pillar -> Energy Meter -> DB Box
      feederToMeter: [
        { x: 490, y: 440 },
        { x: 420, y: 410 }
      ],
      meterToDB: [
        { x: 420, y: 410 },
        { x: 385, y: 340 },
        { x: 385, y: 240 }
      ],
      // 2. DB Box to Room Sub-Junctions
      dbToLivingJunction: [
        { x: 385, y: 240 },
        { x: 330, y: 260 },
        { x: 275, y: 280 }
      ],
      dbToKitchenJunction: [
        { x: 385, y: 240 },
        { x: 440, y: 260 },
        { x: 495, y: 280 }
      ],
      dbToBathJunction: [
        { x: 385, y: 240 },
        { x: 440, y: 195 },
        { x: 485, y: 155 }
      ],
      dbToBedJunction: [
        { x: 385, y: 240 },
        { x: 335, y: 195 },
        { x: 285, y: 155 }
      ],
      // 3. Living Room Appliance Branch Wires
      livingToTV: [
        { x: 275, y: 280 },
        { x: 245, y: 265 },
        { x: 235, y: 255 }
      ],
      livingToAC: [
        { x: 275, y: 280 },
        { x: 205, y: 280 },
        { x: 165, y: 280 }
      ],
      livingToSocket: [
        { x: 275, y: 280 },
        { x: 255, y: 310 },
        { x: 240, y: 330 }
      ],
      socketToHeater: [
        { x: 215, y: 325 },
        { x: 189, y: 325 }
      ],
      // 4. Kitchen Appliance Branch Wires
      kitchenToFridge: [
        { x: 495, y: 280 },
        { x: 505, y: 260 },
        { x: 515, y: 250 }
      ],
      kitchenToKettle: [
        { x: 495, y: 280 },
        { x: 550, y: 280 },
        { x: 595, y: 280 }
      ],
      kitchenToOTG: [
        { x: 495, y: 280 },
        { x: 550, y: 320 },
        { x: 595, y: 345 }
      ],
      // 5. Bathroom Appliance Branch Wires
      bathToGeyser: [
        { x: 485, y: 155 },
        { x: 525, y: 140 },
        { x: 560, y: 125 }
      ],
      bathToFan: [
        { x: 485, y: 155 },
        { x: 570, y: 155 },
        { x: 635, y: 125 }
      ],
      // 6. Bedroom Appliance Branch Wires
      bedToAC: [
        { x: 285, y: 155 },
        { x: 245, y: 140 },
        { x: 210, y: 125 }
      ],
      bedToLamp: [
        { x: 285, y: 155 },
        { x: 285, y: 135 },
        { x: 285, y: 120 }
      ],
      // 7. Earth Ground Leakage Path (from appliance chassis -> DB -> Earth Pit)
      earthToPit: [
        { x: 385, y: 240 },
        { x: 250, y: 360 },
        { x: 130, y: 445 }
      ],
      shockPath: [
        { x: 240, y: 330 },
        { x: 215, y: 355 },
        { x: 195, y: 385 },
        { x: 195, y: 420 }
      ]
    };


    type PathKey = keyof typeof wirePaths;

    // Build particles tied to individual branch currents with closed-loop direction (Forward Live vs Return Neutral)
    interface ActiveParticle {
      progress: number;
      speed: number;
      pathKey: PathKey;
      isReturn: boolean; // true = Neutral return path (moves from appliance back to DB/Grid)
      color: string;
      glowColor: string;
      size: number;
    }

    const particles: ActiveParticle[] = [];

    const addLoopParticles = (
      pathKey: PathKey,
      count: number,
      speedBase: number,
      liveColor = '#f97316',
      liveGlow = '#ea580c',
      size = 3.5
    ) => {
      // 1. Forward Live Particles (Grid -> DB -> Appliance)
      for (let i = 0; i < count; i++) {
        particles.push({
          progress: Math.random(),
          speed: speedBase * (0.85 + Math.random() * 0.3),
          pathKey,
          isReturn: false,
          color: liveColor,
          glowColor: liveGlow,
          size
        });
      }
      // 2. Return Neutral Particles (Appliance -> DB -> Grid Return)
      for (let i = 0; i < count; i++) {
        particles.push({
          progress: Math.random(),
          speed: speedBase * (0.85 + Math.random() * 0.3),
          pathKey,
          isReturn: true,
          color: '#60a5fa',
          glowColor: '#2563eb',
          size: size * 0.9
        });
      }
    };

    if (isPowerFlowing) {
      // 1. Mains Feeder & Meter Closed Loop (Pillar <-> Meter <-> DB)
      if (totalAmps > 0) {
        const feederSpeed = 0.007 + Math.min(0.025, (totalAmps / 32) * 0.018);
        addLoopParticles('feederToMeter', 8, feederSpeed, '#f97316', '#ea580c', 4);
        addLoopParticles('meterToDB', 10, feederSpeed, '#f97316', '#ea580c', 4);
      }

      // 2. Living Room Closed Loop Branches
      if (c2State && c2State.state === 'CLOSED') {
        const livingSpeed = 0.007 + Math.min(0.03, (livingAmps / 25) * 0.02);
        const liveColor = isOverloaded ? '#fef08a' : '#f97316';
        const liveGlow = isOverloaded ? '#ef4444' : '#ea580c';
        const size = isOverloaded ? 5 : 3.5;

        if (livingAmps > 0) {
          addLoopParticles('dbToLivingJunction', isOverloaded ? 16 : 8, livingSpeed, liveColor, liveGlow, size);
        }

        if (activeApplianceIds.includes('tv_console')) {
          addLoopParticles('livingToTV', 4, 0.006, '#c7d2fe', '#6366f1', 3);
        }
        if (activeApplianceIds.includes('air_conditioner')) {
          addLoopParticles('livingToAC', 6, 0.013, '#7dd3fc', '#0284c7', 4);
        }
        if (activeApplianceIds.includes('space_heater')) {
          addLoopParticles('livingToSocket', isOverloaded ? 10 : 6, livingSpeed, liveColor, liveGlow, size);
          addLoopParticles('socketToHeater', isOverloaded ? 10 : 6, livingSpeed, liveColor, liveGlow, size);
        }
      }

      // 3. Kitchen Closed Loop Branches
      if (kitchenAmps > 0) {
        const kSpeed = 0.007 + Math.min(0.025, (kitchenAmps / 25) * 0.015);
        addLoopParticles('dbToKitchenJunction', 8, kSpeed, '#f97316', '#ea580c', 3.5);

        if (activeApplianceIds.includes('refrigerator')) {
          addLoopParticles('kitchenToFridge', 3, 0.006, '#38bdf8', '#0284c7', 3);
        }
        if (activeApplianceIds.includes('kettle')) {
          addLoopParticles('kitchenToKettle', 7, 0.016, '#f97316', '#ea580c', 4);
        }
        if (activeApplianceIds.includes('otg_oven')) {
          addLoopParticles('kitchenToOTG', 6, 0.013, '#f97316', '#ea580c', 4);
        }
      }

      // 4. Bathroom Closed Loop Branches
      if (bathAmps > 0) {
        const bSpeed = 0.007 + Math.min(0.025, (bathAmps / 20) * 0.015);
        addLoopParticles('dbToBathJunction', 6, bSpeed, '#f97316', '#ea580c', 3.5);

        if (activeApplianceIds.includes('water_geyser')) {
          addLoopParticles('bathToGeyser', 7, 0.015, '#f97316', '#ea580c', 4);
        }
        if (activeApplianceIds.includes('exhaust_fan')) {
          addLoopParticles('bathToFan', 3, 0.005, '#94a3b8', '#475569', 3);
        }
      }

      // 5. Bedroom Closed Loop Branches
      if (bedAmps > 0) {
        const bedSpeed = 0.007 + Math.min(0.025, (bedAmps / 20) * 0.015);
        addLoopParticles('dbToBedJunction', 6, bedSpeed, '#f97316', '#ea580c', 3.5);

        if (activeApplianceIds.includes('bedroom_ac')) {
          addLoopParticles('bedToAC', 6, 0.013, '#7dd3fc', '#0284c7', 4);
        }
        if (activeApplianceIds.includes('bed_lamp')) {
          addLoopParticles('bedToLamp', 3, 0.005, '#fef08a', '#ca8a04', 3);
        }
      }

      // 6. Child Shock Leakage Path (Live to Ground via body)
      if (isChildShock) {
        for (let i = 0; i < 14; i++) {
          particles.push({
            progress: Math.random(),
            speed: 0.025 + Math.random() * 0.02,
            pathKey: 'shockPath',
            isReturn: false,
            color: '#f87171',
            glowColor: '#ef4444',
            size: 4.5
          });
        }
      }

      // 7. Earth Leakage Path to Ground Pit (Appliance Chassis to Earth Rod)
      if (isWetBath && !isBrokenEarth) {
        for (let i = 0; i < 12; i++) {
          particles.push({
            progress: Math.random(),
            speed: 0.018 + Math.random() * 0.012,
            pathKey: 'earthToPit',
            isReturn: false,
            color: '#86efac',
            glowColor: '#22c55e',
            size: 4
          });
        }
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
      const seg = Math.min(path.length - 2, Math.floor(t * (path.length - 1)));
      const segT = (t * (path.length - 1)) - seg;
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

      const scaleX = width / 800;
      const scaleY = height / 500;

      // ── A. DRAW IN-WIRE THERMAL HEATING (Overload case strictly within wire) ──
      if (isOverloaded && isPowerFlowing) {
        const heatPulse = 0.55 + 0.45 * Math.sin(frameCount * 0.1);
        const livingPath = wirePaths.dbToLivingJunction;
        const socketPath = wirePaths.livingToSocket;
        const heaterPath = wirePaths.socketToHeater;

        const drawWireHeat = (path: { x: number; y: number }[]) => {
          ctx.beginPath();
          ctx.moveTo(path[0].x * scaleX, path[0].y * scaleY);
          for (let k = 1; k < path.length; k++) {
            ctx.lineTo(path[k].x * scaleX, path[k].y * scaleY);
          }
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + 0.4 * heatPulse})`;
          ctx.lineWidth = 11 * scaleX;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 18 * heatPulse;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(path[0].x * scaleX, path[0].y * scaleY);
          for (let k = 1; k < path.length; k++) {
            ctx.lineTo(path[k].x * scaleX, path[k].y * scaleY);
          }
          ctx.strokeStyle = `rgba(254, 240, 138, ${0.8 + 0.2 * heatPulse})`;
          ctx.lineWidth = 4.5 * scaleX;
          ctx.stroke();
        };

        drawWireHeat(livingPath);
        drawWireHeat(socketPath);
        drawWireHeat(heaterPath);
      }

      // ── B. DRAW CLOSED-LOOP FLOWING ELECTRICITY PARTICLES (Forward Live + Return Neutral) ──
      if (isPowerFlowing) {
        particles.forEach(p => {
          p.progress += p.speed;
          if (p.progress > 1) p.progress = 0;

          const path = wirePaths[p.pathKey];
          if (!path) return;

          // If return path (Neutral), animate backwards from appliance (1 -> 0)
          const actualProgress = p.isReturn ? (1 - p.progress) : p.progress;
          const pos = interpolatePath(path, actualProgress);
          const px = pos.x * scaleX;
          const py = pos.y * scaleY;

          const tailProg = p.isReturn
            ? Math.min(1, actualProgress + 0.05)
            : Math.max(0, actualProgress - 0.05);
          const tailPos = interpolatePath(path, tailProg);
          const tx = tailPos.x * scaleX;
          const ty = tailPos.y * scaleY;

          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(px, py);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * 0.9;
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = 10;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = 12;
          ctx.fill();
        });
      }

      // ── C. SHORT CIRCUIT FLASH & SPARKS ──
      if (isShortCircuit && isPowerFlowing) {
        const arcX = 240 * scaleX;
        const arcY = 330 * scaleY;

        ctx.beginPath();
        ctx.arc(arcX, arcY, 20 + (frameCount % 6) * 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 24;
        ctx.fill();

        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.moveTo(arcX, arcY);
          let currX = arcX;
          let currY = arcY;
          const targetAngle = (j * Math.PI / 2) + ((frameCount * 0.4) % 1.5) - 0.75;
          const length = 24 + Math.random() * 25;
          const steps = 4;
          for (let s = 1; s <= steps; s++) {
            currX += Math.cos(targetAngle) * (length / steps) + (Math.random() - 0.5) * 14;
            currY += Math.sin(targetAngle) * (length / steps) + (Math.random() - 0.5) * 14;
            ctx.lineTo(currX, currY);
          }
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

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
              color: '#fb923c',
              size: 2.5 + Math.random() * 2.5
            });
          }
        }
      }

      // Update & Render all sparks
      sparks = sparks.filter(s => s.life < s.maxLife);
      sparks.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;
        const alpha = 1 - s.life / s.maxLife;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [activeViewMode, isPowerFlowing, isOverloaded, isShortCircuit, isChildShock, isWetBath, powerMetrics, activeApplianceIds, c2State]);

  // If user selected Dedicated Flow SLD View:
  if (activeViewMode === 'sld') {
    return (
      <div className={cn("relative w-full h-full flex flex-col font-sans select-none", className)}>
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 z-30 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectViewMode('house')}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-blue-400" />
              🏠 3D House Cutaway
            </button>
            <button
              type="button"
              onClick={() => handleSelectViewMode('sld')}
              className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-500 text-slate-950 shadow-md flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-slate-950" />
              ⚡ Flow SLD Diagram
            </button>
            <button
              type="button"
              onClick={() => handleSelectViewMode('xray')}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              🩻 In-Wall Wires (X-Ray)
            </button>
          </div>

          <div className="text-xs font-black text-amber-400">
            ★ Single Line Diagram (Full Flow)
          </div>
        </div>

        <div className="flex-1 min-h-0 w-full h-full">
          <HomeGuardSLDView
            circuitStates={circuitStates}
            activeApplianceIds={activeApplianceIds}
            isTripped={isTripped}
            isShortCircuit={isShortCircuit}
            isOverloaded={isOverloaded}
            scenarioId={scenarioId}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-gradient-to-b from-[#091024] via-[#0d1527] to-[#050a14] overflow-hidden flex flex-col font-sans select-none border border-slate-800 rounded-2xl shadow-2xl",
        className
      )}
    >
      {/* FLOATING TOP-RIGHT CONTROLS (Zero vertical space wasted) */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-30 pointer-events-auto">
        {/* Master Mains Supply Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMainsSupplyOn(v => !v)}
          className={cn(
            "px-3 py-1 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 border",
            isMainsSupplyOn
              ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 shadow-emerald-950/40"
              : "bg-rose-950 hover:bg-rose-900 text-rose-200 border-rose-600 animate-pulse shadow-rose-950/40"
          )}
          title="Switch Main Electricity Supply ON/OFF"
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isMainsSupplyOn ? "⚡ MAINS: ON" : "🔴 MAINS: OFF"}</span>
        </button>

        {/* Living Room Wattage Badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/60 text-xs font-bold shadow-md">
          <span className="text-slate-400">Total:</span>
          <span className="text-amber-400 font-mono font-black">{powerMetrics.totalWatts}W</span>
        </div>
      </div>

      {/* MAIN 2.5D ISOMETRIC ARCHITECTURAL CUTAWAY */}
      <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden flex items-center justify-center">
        
        <svg
          viewBox="20 25 760 460"
          className="w-full h-full max-h-full object-contain overflow-visible select-none"
        >
          <defs>
            {/* Lawn Radial Gradient */}
            <radialGradient id="lawnGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="60%" stopColor="#166534" />
              <stop offset="100%" stopColor="#052e16" />
            </radialGradient>

            {/* Room Floor Gradients */}
            <linearGradient id="livingWoodFloor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="50%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#542e03" />
            </linearGradient>

            <linearGradient id="kitchenTileFloor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            <linearGradient id="bathTileFloor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <linearGradient id="bedCarpetFloor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#831843" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>

            <linearGradient id="roofTileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c2410c" />
              <stop offset="50%" stopColor="#9a3412" />
              <stop offset="100%" stopColor="#431407" />
            </linearGradient>

            <filter id="conduitGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={isOverloaded ? "6" : "2.5"} result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* ========================================================= */}
          {/* 1. OUTDOOR GREEN GARDEN & TERRAIN BASE                    */}
          {/* ========================================================= */}
          <g id="garden-terrain">
            <polygon
              points="400,80 770,265 400,455 30,265"
              fill="url(#lawnGrad)"
              stroke="#22c55e"
              strokeWidth="2.5"
            />
            {/* Garden Pathway */}
            <polygon points="400,455 470,420 430,365 360,400" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
            <ellipse cx="380" cy="415" rx="14" ry="7" fill="#334155" />
            <ellipse cx="420" cy="390" rx="15" ry="7.5" fill="#334155" />
          </g>

          {/* ========================================================= */}
          {/* 2. OUTDOOR EARTH GROUND PIT (OUTDOOR YARD, AWAY FROM HEATER) */}
          {/* ========================================================= */}
          <g id="ground-earth-pit" transform="translate(130, 445)">
            <polygon points="-44,0 44,0 44,75 -44,75" fill="#382314" stroke="#543824" strokeWidth="1.5" />
            <ellipse cx="0" cy="0" rx="38" ry="19" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <ellipse cx="0" cy="0" rx="30" ry="15" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
            
            {/* Solid Copper Grounding Electrode */}
            <line x1="0" y1="0" x2="0" y2="72" stroke="#b45309" strokeWidth="7" strokeLinecap="round" />
            <line x1="0" y1="0" x2="0" y2="72" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Earth symbol */}
            <line x1="-16" y1="50" x2="16" y2="50" stroke="#22c55e" strokeWidth="2.5" />
            <line x1="-10" y1="58" x2="10" y2="58" stroke="#22c55e" strokeWidth="2" />
            <line x1="-5" y1="66" x2="5" y2="66" stroke="#22c55e" strokeWidth="1.5" />
            
            <text x="0" y="-24" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="black">
              🌱 EARTH GROUND PIT
            </text>
            <text x="0" y="24" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="bold">
              Ra ≈ 5.2 Ω (Solid Ground)
            </text>

            {/* Earth Bonding Wire (Green) -> DB Box */}
            <path
              d="M 0 0 L 120 -85 L 255 -205"
              fill="none"
              stroke={isBrokenEarth ? "#ef4444" : "#22c55e"}
              strokeWidth={isBrokenEarth ? "3.5" : "3"}
              strokeDasharray={isBrokenEarth ? "6,4" : undefined}
            />

            {isBrokenEarth && (
              <g transform="translate(120, -85)">
                <circle cx="0" cy="0" r="18" fill="#ef4444" fillOpacity="0.45" className="animate-ping" />
                <circle cx="0" cy="0" r="13" fill="#991b1b" stroke="#ef4444" strokeWidth="2" />
                <text x="0" y="4.5" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="black">✕</text>
                <text x="0" y="-20" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="black">
                  ⚠️ SEVERED EARTH WIRE!
                </text>
              </g>
            )}
          </g>

          {/* ========================================================= */}
          {/* 3. STREET ELECTRICAL SERVICE PILLAR & ENERGY METER        */}
          {/* ========================================================= */}
          {/* A. Electricity Department Feeder Pillar (Street Supply) */}
          <g id="street-feeder-pillar" transform="translate(490, 420)">
            {/* Concrete Plinth Base */}
            <polygon points="-30,30 30,30 38,42 -22,42" fill="#334155" stroke="#475569" strokeWidth="1.5" />
            {/* Metallic Enclosure */}
            <rect x="-24" y="-32" width="48" height="62" rx="4" fill="#14532d" stroke="#22c55e" strokeWidth="2" />
            <polygon points="-24,-32 24,-32 28,-38 -20,-38" fill="#166534" stroke="#22c55e" strokeWidth="1.5" />
            
            {/* Warning Plate */}
            <rect x="-18" y="-22" width="36" height="18" rx="2" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            <text x="0" y="-10" textAnchor="middle" fill="#713f12" fontSize="7.5" fontWeight="black">⚡ 230V / 415V</text>
            <text x="0" y="-3" textAnchor="middle" fill="#713f12" fontSize="6" fontWeight="bold">DANGER / खतरा</text>

            {/* Ventilation Louvers */}
            <line x1="-14" y1="5" x2="14" y2="5" stroke="#166534" strokeWidth="2" />
            <line x1="-14" y1="11" x2="14" y2="11" stroke="#166534" strokeWidth="2" />
            <line x1="-14" y1="17" x2="14" y2="17" stroke="#166534" strokeWidth="2" />

            {/* Utility Lock */}
            <circle cx="16" cy="22" r="2.5" fill="#facc15" />

            <text x="0" y="54" textAnchor="middle" fill="#4ade80" fontSize="10.5" fontWeight="black">
              ⚡ STREET SERVICE PILLAR
            </text>
            <text x="0" y="66" textAnchor="middle" fill="#86efac" fontSize="8.5" fontWeight="bold">
              Electricity Dept. Main Grid (230V)
            </text>
          </g>

          {/* B. Outdoor Digital Energy Meter (kWh Meter) */}
          <g id="outdoor-energy-meter" transform="translate(420, 395)">
            <rect x="-22" y="-18" width="44" height="36" rx="5" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            {/* LCD Display */}
            <rect x="-16" y="-12" width="32" height="14" rx="2" fill="#0284c7" fillOpacity="0.3" stroke="#0284c7" strokeWidth="1" />
            <text x="0" y="-2" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="black" fontFamily="monospace">
              {(powerMetrics.totalWatts / 230).toFixed(1)} A
            </text>
            {/* Pulsing Impulse LED */}
            <circle
              cx="12" cy="10" r="2.5"
              fill={isPowerFlowing ? "#ef4444" : "#64748b"}
              className={isPowerFlowing ? "animate-ping" : undefined}
            />
            <text x="0" y="30" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="black">
              📊 ENERGY METER
            </text>
          </g>

          {/* Armored Cable from Street Pillar -> Meter */}
          <path
            d="M 490 440 L 420 410"
            fill="none"
            stroke={isPowerFlowing ? "#f97316" : "#475569"}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* ========================================================= */}
          {/* 4. 2-STORY HOUSE ROOMS & FLOORS                           */}
          {/* ========================================================= */}
          <g id="house-architecture">
            {/* Living Room Wooden Floor (Ground Left) */}
            <polygon points="160,250 400,370 340,340 160,250" fill="url(#livingWoodFloor)" stroke="#92400e" strokeWidth="2" />
            
            {/* Kitchen Tile Floor (Ground Right) */}
            <polygon points="400,370 640,250 580,220 400,370" fill="url(#kitchenTileFloor)" stroke="#94a3b8" strokeWidth="2" />

            {/* Master Bedroom Floor (Upstairs Left) */}
            <polygon points="250,170 400,240 330,205 250,170" fill="url(#bedCarpetFloor)" stroke="#be185d" strokeWidth="2" />

            {/* Bathroom Floor (Upstairs Right) */}
            <polygon points="400,240 550,170 470,135 400,240" fill="url(#bathTileFloor)" stroke="#0284c7" strokeWidth="2" />

            {/* Roof Overhang */}
            <polygon points="120,100 400,0 400,35 120,135" fill="url(#roofTileGrad)" stroke="#ea580c" strokeWidth="2" />
            <polygon points="400,0 680,100 680,135 400,35" fill="#9a3412" stroke="#ea580c" strokeWidth="2" />
          </g>

          {/* ========================================================= */}
          {/* 5. CLEAN CONDUITS & APPLIANCE BRANCH WIRING (NO TOUCHING) */}
          {/* ========================================================= */}
          <g id="clean-conduits">
            {/* ⚡ Incomer Feed (Meter -> DB Box) */}
            <path d="M 420 410 L 385 340 L 385 240" fill="none" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
            <path
              d="M 420 410 L 385 340 L 385 240"
              fill="none"
              stroke={isPowerFlowing ? "#f97316" : "#475569"}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* ── 🛋️ LIVING ROOM CONDUIT & BRANCH WIRES ── */}
            {/* Main DB -> Living Junction */}
            <path d="M 385 240 L 330 260 L 275 280" fill="none" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
            <path
              d="M 385 240 L 330 260 L 275 280"
              fill="none"
              stroke={!isPowerFlowing ? "#475569" : isOverloaded ? "#f59e0b" : "#38bdf8"}
              strokeWidth={isOverloaded ? "6" : "3.5"}
              strokeLinecap="round"
              filter={isOverloaded ? "url(#conduitGlow)" : undefined}
            />
            {/* Living Junction Box */}
            <circle cx="275" cy="280" r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />

            {/* Branch 1: Junction -> Smart TV */}
            <path
              d="M 275 280 L 245 265 L 235 255"
              fill="none"
              stroke={activeApplianceIds.includes('tv_console') && isPowerFlowing ? "#6366f1" : "#475569"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Branch 2: Junction -> Living AC */}
            <path
              d="M 275 280 L 205 280 L 165 280"
              fill="none"
              stroke={activeApplianceIds.includes('air_conditioner') && isPowerFlowing ? "#38bdf8" : "#475569"}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Branch 3: Junction -> Wall Socket */}
            <path
              d="M 275 280 L 255 310 L 240 330"
              fill="none"
              stroke={isOverloaded && isPowerFlowing ? "#f59e0b" : isPowerFlowing ? "#38bdf8" : "#475569"}
              strokeWidth={isOverloaded ? "5" : "3"}
              strokeLinecap="round"
            />

            {/* Heavy Rubber Cord: Wall Socket -> Space Heater */}
            <path
              d="M 215 325 L 189 325"
              fill="none"
              stroke={activeApplianceIds.includes('space_heater') && isPowerFlowing ? (isOverloaded ? "#ea580c" : "#f97316") : "#475569"}
              strokeWidth={isOverloaded ? "5.5" : "3.5"}
              strokeLinecap="round"
              strokeDasharray={isOverloaded ? "4,2" : undefined}
            />

            {/* ── 🍳 KITCHEN CONDUIT & BRANCH WIRES ── */}
            {/* Main DB -> Kitchen Junction */}
            <path d="M 385 240 L 440 260 L 495 280" fill="none" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
            <path
              d="M 385 240 L 440 260 L 495 280"
              fill="none"
              stroke={isPowerFlowing ? "#10b981" : "#475569"}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Kitchen Junction Box */}
            <circle cx="495" cy="280" r="5" fill="#0f172a" stroke="#10b981" strokeWidth="2" />

            {/* Branch 1: Junction -> Refrigerator */}
            <path
              d="M 495 280 L 505 260 L 515 250"
              fill="none"
              stroke={activeApplianceIds.includes('refrigerator') && isPowerFlowing ? "#10b981" : "#475569"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Branch 2: Junction -> Kettle */}
            <path
              d="M 495 280 L 550 280 L 595 280"
              fill="none"
              stroke={activeApplianceIds.includes('kettle') && isPowerFlowing ? "#0284c7" : "#475569"}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Branch 3: Junction -> OTG Oven */}
            <path
              d="M 495 280 L 550 320 L 595 345"
              fill="none"
              stroke={activeApplianceIds.includes('otg_oven') && isPowerFlowing ? "#10b981" : "#475569"}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* ── 🚿 BATHROOM CONDUIT & BRANCH WIRES ── */}
            {/* Main DB -> Bathroom Junction */}
            <path d="M 385 240 L 440 195 L 485 155" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
            <path
              d="M 385 240 L 440 195 L 485 155"
              fill="none"
              stroke={isPowerFlowing ? "#0284c7" : "#475569"}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="485" cy="155" r="4.5" fill="#0f172a" stroke="#0284c7" strokeWidth="2" />

            {/* Branch 1: Junction -> Water Geyser */}
            <path
              d="M 485 155 L 525 140 L 560 125"
              fill="none"
              stroke={activeApplianceIds.includes('water_geyser') && isPowerFlowing ? "#38bdf8" : "#475569"}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Branch 2: Junction -> Exhaust Fan */}
            <path
              d="M 485 155 L 570 155 L 635 125"
              fill="none"
              stroke={activeApplianceIds.includes('exhaust_fan') && isPowerFlowing ? "#94a3b8" : "#475569"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* ── 🛏️ BEDROOM CONDUIT & BRANCH WIRES ── */}
            {/* Main DB -> Bedroom Junction */}
            <path d="M 385 240 L 335 195 L 285 155" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
            <path
              d="M 385 240 L 335 195 L 285 155"
              fill="none"
              stroke={isPowerFlowing ? "#facc15" : "#475569"}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="285" cy="155" r="4.5" fill="#0f172a" stroke="#facc15" strokeWidth="2" />

            {/* Branch 1: Junction -> Bedroom AC */}
            <path
              d="M 285 155 L 245 140 L 210 125"
              fill="none"
              stroke={activeApplianceIds.includes('bedroom_ac') && isPowerFlowing ? "#38bdf8" : "#475569"}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Branch 2: Junction -> Bed Lamp */}
            <path
              d="M 285 155 L 285 135 L 285 120"
              fill="none"
              stroke={activeApplianceIds.includes('bed_lamp') && isPowerFlowing ? "#fef08a" : "#475569"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* ── 📊 REAL-TIME ELECTRICAL CURRENT TELEMETRY BADGES (100% PHYSICS ENGINE) ── */}
            {/* Mains Incomer Telemetry */}
            <g transform="translate(350, 310)">
              <rect x="-60" y="-10" width="120" height="20" rx="10" fill="#0f172a" stroke="#f97316" strokeWidth="1.5" />
              <text x="0" y="3.5" textAnchor="middle" fill="#fed7aa" fontSize="8" fontWeight="black" fontFamily="monospace">
                ⚡ L: {totalAmps}A ➔ | N: {totalAmps}A ⬅
              </text>
            </g>

            {/* Living Room Branch Telemetry */}
            <g transform="translate(305, 255)">
              <rect x="-44" y="-8" width="88" height="16" rx="8" fill="#0f172a" stroke={isOverloaded ? "#f59e0b" : "#38bdf8"} strokeWidth="1" />
              <text x="0" y="3" textAnchor="middle" fill={isOverloaded ? "#fef08a" : "#7dd3fc"} fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                L: {livingAmps}A ➔ N: {livingAmps}A ⬅
              </text>
            </g>

            {/* Kitchen Branch Telemetry */}
            <g transform="translate(465, 255)">
              <rect x="-44" y="-8" width="88" height="16" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
              <text x="0" y="3" textAnchor="middle" fill="#a7f3d0" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                L: {kitchenAmps}A ➔ N: {kitchenAmps}A ⬅
              </text>
            </g>
          </g>

          {/* ========================================================= */}
          {/* 6. CENTRAL CONSUMER UNIT (DB FUSE BOX ON HALLWAY WALL)    */}
          {/* ========================================================= */}
          <g
            id="db-box-node"
            transform="translate(355, 205)"
            onClick={onOpenDBBox}
            className="cursor-pointer group"
          >
            <rect
              x="0" y="0" width="60" height="54" rx="10"
              fill="#0f172a"
              stroke={isTripped ? "#ef4444" : "#10b981"}
              strokeWidth="2.5"
              filter="drop-shadow(0 0 16px rgba(0,0,0,0.9))"
            />
            <rect x="4" y="4" width="52" height="46" rx="6" fill="#1e293b" />
            
            {/* Miniature Breakers on DIN Rail */}
            <rect x="7" y="10" width="8" height="28" rx="1" fill="#0f172a" />
            <line x1="11" y1="12" x2="11" y2="22" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />

            <rect x="18" y="10" width="8" height="28" rx="1" fill="#0f172a" />
            <line x1="22" y1="12" x2="22" y2="22" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

            <rect x="29" y="10" width="9" height="28" rx="1" fill="#0f172a" />
            <line
              x1="33.5"
              y1={c2State.state !== 'CLOSED' ? 24 : 12}
              x2="33.5"
              y2={c2State.state !== 'CLOSED' ? 34 : 22}
              stroke={c2State.state !== 'CLOSED' ? "#ef4444" : "#10b981"}
              strokeWidth="4"
              strokeLinecap="round"
            />

            <rect x="41" y="10" width="9" height="28" rx="1" fill="#0f172a" />
            <line
              x1="45.5"
              y1={rccbState.state !== 'CLOSED' ? 24 : 12}
              x2="45.5"
              y2={rccbState.state !== 'CLOSED' ? 34 : 22}
              stroke={rccbState.state !== 'CLOSED' ? "#ef4444" : "#10b981"}
              strokeWidth="4"
              strokeLinecap="round"
            />

            <circle
              cx="52" cy="7" r="4"
              fill={isTripped ? "#ef4444" : "#10b981"}
              className={isTripped ? "animate-ping" : undefined}
            />

            <text x="30" y="66" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black">
              DB FUSE BOX
            </text>
          </g>

          {/* ========================================================= */}
          {/* 7. ALL APPLIANCE CARDS (CLEAN DIRECTIONAL LAYOUT)         */}
          {/* ========================================================= */}

          {/* ── 🛋️ LIVING ROOM (GROUND LEFT) ── */}
          <g id="living-room-group">
            {/* Room Header Banner */}
            <g transform="translate(230, 205)">
              <rect x="-70" y="-14" width="140" height="28" rx="14" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
              <text x="0" y="5" textAnchor="middle" fill="#93c5fd" fontSize="13" fontWeight="black">
                🛋️ LIVING ROOM
              </text>
            </g>

            {/* Smart TV (150W) */}
            <g
              transform="translate(190, 225)"
              onClick={() => onToggleAppliance('tv_console')}
              className="cursor-pointer group select-none"
            >
              {/* Card Body */}
              <rect
                x="0" y="0" width="76" height="42" rx="8"
                fill={activeApplianceIds.includes('tv_console') ? "#1e1b4b" : "#0f172a"}
                stroke={activeApplianceIds.includes('tv_console') ? "#818cf8" : "#334155"}
                strokeWidth={activeApplianceIds.includes('tv_console') ? "2.5" : "1.5"}
                filter={activeApplianceIds.includes('tv_console') ? "drop-shadow(0 0 10px rgba(99,102,241,0.6))" : undefined}
                className="transition-all"
              />
              {/* Screen Illumination (Sensory Metaphor) */}
              {activeApplianceIds.includes('tv_console') && (
                <rect x="5" y="4" width="66" height="18" rx="4" fill="#312e81" opacity="0.9" />
              )}
              <text x="38" y="17" textAnchor="middle" fill="#c7d2fe" fontSize="10.5" fontWeight="black">
                📺 SMART TV
              </text>
              {/* Rocker Switch Pill & LED */}
              <rect
                x="8" y="24" width="60" height="14" rx="7"
                fill={activeApplianceIds.includes('tv_console') ? "#312e81" : "#1e293b"}
                stroke={activeApplianceIds.includes('tv_console') ? "#6366f1" : "#475569"}
                strokeWidth="1"
              />
              <circle
                cx={activeApplianceIds.includes('tv_console') ? 16 : 58}
                cy="31"
                r="4.5"
                fill={activeApplianceIds.includes('tv_console') ? "#22c55e" : "#64748b"}
                filter={activeApplianceIds.includes('tv_console') ? "drop-shadow(0 0 4px #22c55e)" : undefined}
              />
              <text
                x={activeApplianceIds.includes('tv_console') ? 42 : 32}
                y="34"
                textAnchor="middle"
                fill={activeApplianceIds.includes('tv_console') ? "#86efac" : "#94a3b8"}
                fontSize="8"
                fontWeight="black"
              >
                {activeApplianceIds.includes('tv_console') ? "ON 150W" : "OFF (TAP)"}
              </text>
            </g>

            {/* Living Room Air Conditioner (1500W) */}
            <g
              transform="translate(85, 250)"
              onClick={() => onToggleAppliance('air_conditioner')}
              className="cursor-pointer group select-none"
            >
              {/* Sensory Metaphor: Cool Breeze Drift Lines blowing out */}
              {activeApplianceIds.includes('air_conditioner') && isPowerFlowing && (
                <g opacity="0.85" className="animate-pulse">
                  <path d="M 82 20 Q 95 18 108 22" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
                  <path d="M 82 28 Q 100 28 116 32" fill="none" stroke="#7dd3fc" strokeWidth="2.5" strokeDasharray="4 3" />
                  <path d="M 82 36 Q 95 38 108 34" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
                </g>
              )}
              {/* Card Body */}
              <rect
                x="0" y="0" width="82" height="46" rx="8"
                fill={activeApplianceIds.includes('air_conditioner') ? "#075985" : "#1e293b"}
                stroke={activeApplianceIds.includes('air_conditioner') ? "#38bdf8" : "#475569"}
                strokeWidth={activeApplianceIds.includes('air_conditioner') ? "2.5" : "1.5"}
                filter={activeApplianceIds.includes('air_conditioner') ? "drop-shadow(0 0 12px rgba(56,189,248,0.7))" : undefined}
              />
              <text x="41" y="17" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black">
                ❄️ LIVING AC
              </text>
              {/* Rocker Switch Pill & LED */}
              <rect
                x="6" y="24" width="70" height="16" rx="8"
                fill={activeApplianceIds.includes('air_conditioner') ? "#0c4a6e" : "#0f172a"}
                stroke={activeApplianceIds.includes('air_conditioner') ? "#38bdf8" : "#334155"}
                strokeWidth="1"
              />
              <circle
                cx={activeApplianceIds.includes('air_conditioner') ? 16 : 66}
                cy="32"
                r="5"
                fill={activeApplianceIds.includes('air_conditioner') ? "#22c55e" : "#64748b"}
                filter={activeApplianceIds.includes('air_conditioner') ? "drop-shadow(0 0 5px #22c55e)" : undefined}
              />
              <text
                x={activeApplianceIds.includes('air_conditioner') ? 45 : 35}
                y="35"
                textAnchor="middle"
                fill={activeApplianceIds.includes('air_conditioner') ? "#7dd3fc" : "#94a3b8"}
                fontSize="8.5"
                fontWeight="black"
              >
                {activeApplianceIds.includes('air_conditioner') ? "ON 1500W" : "OFF (TAP)"}
              </text>
            </g>

            {/* Wall Socket Board */}
            <g transform="translate(215, 310)">
              <rect
                x="0" y="0" width="46" height="42" rx="8"
                fill="#0f172a"
                stroke={isShortCircuit ? "#ef4444" : isOverloaded ? "#f59e0b" : "#38bdf8"}
                strokeWidth="2.5"
              />
              <circle cx="15" cy="21" r="3.5" fill="#1e293b" stroke="#64748b" />
              <circle cx="31" cy="21" r="3.5" fill="#1e293b" stroke="#64748b" />
              <text x="23" y="54" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                WALL SOCKET
              </text>
            </g>

            {/* Portable Space Heater (2000W) - Positioned in Living Room above Ground */}
            <g
              transform="translate(105, 305)"
              onClick={() => onToggleAppliance('space_heater')}
              className="cursor-pointer group select-none"
            >
              {/* Sensory Metaphor: Rising Heat Shimmer Wave Ripples when ON */}
              {activeApplianceIds.includes('space_heater') && isPowerFlowing && (
                <g opacity="0.9" className="animate-pulse">
                  <path d="M 22 -4 Q 28 -12 22 -20" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeDasharray="3 2" />
                  <path d="M 42 -6 Q 48 -15 42 -24" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="3 2" />
                  <path d="M 62 -4 Q 68 -12 62 -20" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeDasharray="3 2" />
                </g>
              )}
              {/* Card Body */}
              <rect
                x="0" y="0" width="84" height="48" rx="8"
                fill={activeApplianceIds.includes('space_heater') ? "#7c2d12" : "#1e293b"}
                stroke={activeApplianceIds.includes('space_heater') ? "#ea580c" : "#475569"}
                strokeWidth={activeApplianceIds.includes('space_heater') ? "2.5" : "1.5"}
                filter={isOverloaded ? "drop-shadow(0 0 16px rgba(234,88,12,1))" : activeApplianceIds.includes('space_heater') ? "drop-shadow(0 0 12px rgba(234,88,12,0.7))" : undefined}
              />
              {/* Internal Glowing Heating Element Coils (Sensory Metaphor) */}
              {activeApplianceIds.includes('space_heater') && (
                <g stroke="#ffedd5" strokeWidth="2" strokeLinecap="round" opacity="0.95">
                  <line x1="12" y1="8" x2="72" y2="8" stroke="#f97316" strokeWidth="3" />
                  <line x1="12" y1="14" x2="72" y2="14" stroke="#f97316" strokeWidth="3" />
                </g>
              )}
              <text x="42" y="20" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black">
                🔥 HEATER
              </text>
              {/* Rocker Switch Pill & LED */}
              <rect
                x="6" y="26" width="72" height="16" rx="8"
                fill={activeApplianceIds.includes('space_heater') ? "#431407" : "#0f172a"}
                stroke={activeApplianceIds.includes('space_heater') ? "#ea580c" : "#334155"}
                strokeWidth="1"
              />
              <circle
                cx={activeApplianceIds.includes('space_heater') ? 16 : 68}
                cy="34"
                r="5"
                fill={activeApplianceIds.includes('space_heater') ? "#22c55e" : "#64748b"}
                filter={activeApplianceIds.includes('space_heater') ? "drop-shadow(0 0 6px #22c55e)" : undefined}
              />
              <text
                x={activeApplianceIds.includes('space_heater') ? 47 : 36}
                y="37"
                textAnchor="middle"
                fill={activeApplianceIds.includes('space_heater') ? "#fdba74" : "#94a3b8"}
                fontSize="8.5"
                fontWeight="black"
              >
                {activeApplianceIds.includes('space_heater') ? "ON 2000W 🔴" : "OFF (TAP)"}
              </text>
            </g>

            {/* Overload Alert Badge */}
            {isOverloaded && isPowerFlowing && (
              <g transform="translate(250, 275)">
                <rect x="-80" y="-15" width="160" height="30" rx="15" fill="#78350f" stroke="#f59e0b" strokeWidth="2" className="animate-pulse" filter="drop-shadow(0 0 12px rgba(245,158,11,0.8))" />
                <text x="0" y="5" textAnchor="middle" fill="#fef08a" fontSize="11" fontWeight="black">
                  🔥 CABLE OVERHEATING!
                </text>
              </g>
            )}
          </g>

          {/* ── 🍳 KITCHEN (GROUND RIGHT) ── */}
          <g id="kitchen-group">
            {/* Room Header Banner */}
            <g transform="translate(570, 205)">
              <rect x="-60" y="-14" width="120" height="28" rx="14" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
              <text x="0" y="5" textAnchor="middle" fill="#a7f3d0" fontSize="13" fontWeight="black">
                🍳 KITCHEN
              </text>
            </g>

            {/* Refrigerator (200W) */}
            <g
              transform="translate(475, 220)"
              onClick={() => onToggleAppliance('refrigerator')}
              className="cursor-pointer group select-none"
            >
              <rect
                x="0" y="0" width="76" height="42" rx="8"
                fill={activeApplianceIds.includes('refrigerator') ? "#064e3b" : "#1e293b"}
                stroke={activeApplianceIds.includes('refrigerator') ? "#10b981" : "#475569"}
                strokeWidth={activeApplianceIds.includes('refrigerator') ? "2.5" : "1.5"}
                filter={activeApplianceIds.includes('refrigerator') ? "drop-shadow(0 0 10px rgba(16,185,129,0.6))" : undefined}
              />
              <text x="38" y="16" textAnchor="middle" fill="#a7f3d0" fontSize="10.5" fontWeight="black">
                🧊 FRIDGE 200W
              </text>
              {/* Rocker Switch Pill & LED */}
              <rect
                x="6" y="22" width="64" height="15" rx="7.5"
                fill={activeApplianceIds.includes('refrigerator') ? "#065f46" : "#0f172a"}
                stroke={activeApplianceIds.includes('refrigerator') ? "#10b981" : "#334155"}
                strokeWidth="1"
              />
              <circle
                cx={activeApplianceIds.includes('refrigerator') ? 15 : 61}
                cy="29.5"
                r="4.5"
                fill={activeApplianceIds.includes('refrigerator') ? "#22c55e" : "#64748b"}
                filter={activeApplianceIds.includes('refrigerator') ? "drop-shadow(0 0 4px #22c55e)" : undefined}
              />
              <text
                x={activeApplianceIds.includes('refrigerator') ? 42 : 32}
                y="32.5"
                textAnchor="middle"
                fill={activeApplianceIds.includes('refrigerator') ? "#a7f3d0" : "#94a3b8"}
                fontSize="8"
                fontWeight="black"
              >
                {activeApplianceIds.includes('refrigerator') ? "ON 200W" : "OFF (TAP)"}
              </text>
            </g>

            {/* Electric Kettle (2200W) */}
            <g
              transform="translate(605, 250)"
              onClick={() => onToggleAppliance('kettle')}
              className="cursor-pointer group select-none"
            >
              {/* Sensory Metaphor: Rising Steam Puffs when active */}
              {activeApplianceIds.includes('kettle') && isPowerFlowing && (
                <g opacity="0.85" className="animate-pulse">
                  <circle cx="15" cy="-8" r="3.5" fill="#e0f2fe" opacity="0.8" />
                  <circle cx="22" cy="-16" r="4.5" fill="#e0f2fe" opacity="0.6" />
                  <circle cx="18" cy="-26" r="6" fill="#e0f2fe" opacity="0.4" />
                </g>
              )}
              <rect
                x="0" y="0" width="82" height="46" rx="8"
                fill={activeApplianceIds.includes('kettle') ? "#0c4a6e" : "#1e293b"}
                stroke={activeApplianceIds.includes('kettle') ? "#0284c7" : "#475569"}
                strokeWidth={activeApplianceIds.includes('kettle') ? "2.5" : "1.5"}
                filter={activeApplianceIds.includes('kettle') ? "drop-shadow(0 0 12px rgba(2,132,199,0.7))" : undefined}
              />
              <text x="41" y="17" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black">
                ☕ KETTLE
              </text>
              {/* Rocker Switch Pill & LED */}
              <rect
                x="6" y="24" width="70" height="16" rx="8"
                fill={activeApplianceIds.includes('kettle') ? "#082f49" : "#0f172a"}
                stroke={activeApplianceIds.includes('kettle') ? "#0284c7" : "#334155"}
                strokeWidth="1"
              />
              <circle
                cx={activeApplianceIds.includes('kettle') ? 16 : 66}
                cy="32"
                r="5"
                fill={activeApplianceIds.includes('kettle') ? "#22c55e" : "#64748b"}
                filter={activeApplianceIds.includes('kettle') ? "drop-shadow(0 0 5px #22c55e)" : undefined}
              />
              <text
                x={activeApplianceIds.includes('kettle') ? 45 : 35}
                y="35"
                textAnchor="middle"
                fill={activeApplianceIds.includes('kettle') ? "#38bdf8" : "#94a3b8"}
                fontSize="8.5"
                fontWeight="black"
              >
                {activeApplianceIds.includes('kettle') ? "ON 2200W 🔴" : "OFF (TAP)"}
              </text>
            </g>

            {/* OTG / Microwave Oven (1400W) */}
            <g
              transform="translate(605, 315)"
              onClick={() => onToggleAppliance('otg_oven')}
              className="cursor-pointer group select-none"
            >
              <rect
                x="0" y="0" width="82" height="46" rx="8"
                fill={activeApplianceIds.includes('otg_oven') ? "#065f46" : "#1e293b"}
                stroke={activeApplianceIds.includes('otg_oven') ? "#10b981" : "#475569"}
                strokeWidth={activeApplianceIds.includes('otg_oven') ? "2.5" : "1.5"}
                filter={activeApplianceIds.includes('otg_oven') ? "drop-shadow(0 0 12px rgba(16,185,129,0.6))" : undefined}
              />
              <text x="41" y="17" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black">
                🍲 OTG OVEN
              </text>
              {/* Rocker Switch Pill & LED */}
              <rect
                x="6" y="24" width="70" height="16" rx="8"
                fill={activeApplianceIds.includes('otg_oven') ? "#064e3b" : "#0f172a"}
                stroke={activeApplianceIds.includes('otg_oven') ? "#10b981" : "#334155"}
                strokeWidth="1"
              />
              <circle
                cx={activeApplianceIds.includes('otg_oven') ? 16 : 66}
                cy="32"
                r="5"
                fill={activeApplianceIds.includes('otg_oven') ? "#22c55e" : "#64748b"}
                filter={activeApplianceIds.includes('otg_oven') ? "drop-shadow(0 0 5px #22c55e)" : undefined}
              />
              <text
                x={activeApplianceIds.includes('otg_oven') ? 45 : 35}
                y="35"
                textAnchor="middle"
                fill={activeApplianceIds.includes('otg_oven') ? "#a7f3d0" : "#94a3b8"}
                fontSize="8.5"
                fontWeight="black"
              >
                {activeApplianceIds.includes('otg_oven') ? "ON 1400W 🟡" : "OFF (TAP)"}
              </text>
            </g>
          </g>

          {/* ── 🚿 BATHROOM & GEYSER (UPSTAIRS RIGHT) ── */}
          <g id="bathroom-group">
            {/* Room Header Banner */}
            <g transform="translate(560, 65)">
              <rect x="-70" y="-14" width="140" height="28" rx="14" fill="#0f172a" stroke="#0284c7" strokeWidth="2" />
              <text x="0" y="5" textAnchor="middle" fill="#7dd3fc" fontSize="13" fontWeight="black">
                🚿 BATHROOM
              </text>
            </g>

            {/* Water Geyser (2000W) */}
            <g
              transform="translate(525, 90)"
              onClick={() => onToggleAppliance('water_geyser')}
              className="cursor-pointer group select-none"
            >
              {/* Sensory Metaphor: Warm Water Tank Glow */}
              {activeApplianceIds.includes('water_geyser') && isPowerFlowing && (
                <ellipse cx="44" cy="52" rx="35" ry="6" fill="#38bdf8" opacity="0.3" className="animate-pulse" />
              )}
              <rect
                x="0" y="0" width="88" height="48" rx="8"
                fill={activeApplianceIds.includes('water_geyser') ? "#0c4a6e" : "#1e293b"}
                stroke={activeApplianceIds.includes('water_geyser') ? "#38bdf8" : "#475569"}
                strokeWidth={activeApplianceIds.includes('water_geyser') ? "2.5" : "1.5"}
                filter={activeApplianceIds.includes('water_geyser') ? "drop-shadow(0 0 12px rgba(56,189,248,0.7))" : undefined}
              />
              <text x="44" y="18" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black">
                🚿 GEYSER
              </text>
              {/* Rocker Switch Pill & LED */}
              <rect
                x="6" y="25" width="76" height="16" rx="8"
                fill={activeApplianceIds.includes('water_geyser') ? "#082f49" : "#0f172a"}
                stroke={activeApplianceIds.includes('water_geyser') ? "#38bdf8" : "#334155"}
                strokeWidth="1"
              />
              <circle
                cx={activeApplianceIds.includes('water_geyser') ? 16 : 72}
                cy="33"
                r="5"
                fill={activeApplianceIds.includes('water_geyser') ? "#22c55e" : "#64748b"}
                filter={activeApplianceIds.includes('water_geyser') ? "drop-shadow(0 0 5px #22c55e)" : undefined}
              />
              <text
                x={activeApplianceIds.includes('water_geyser') ? 48 : 38}
                y="36"
                textAnchor="middle"
                fill={activeApplianceIds.includes('water_geyser') ? "#38bdf8" : "#94a3b8"}
                fontSize="8.5"
                fontWeight="black"
              >
                {activeApplianceIds.includes('water_geyser') ? "ON 2000W 🔴" : "OFF (TAP)"}
              </text>
            </g>

            {/* Exhaust Fan (50W) */}
            <g
              transform="translate(625, 90)"
              onClick={() => onToggleAppliance('exhaust_fan')}
              className="cursor-pointer group select-none"
            >
              <rect
                x="0" y="0" width="66" height="48" rx="8"
                fill={activeApplianceIds.includes('exhaust_fan') ? "#1e293b" : "#0f172a"}
                stroke={activeApplianceIds.includes('exhaust_fan') ? "#94a3b8" : "#334155"}
                strokeWidth={activeApplianceIds.includes('exhaust_fan') ? "2" : "1"}
              />
              <text x="33" y="18" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="black">
                🌀 FAN 50W
              </text>
              {/* Rocker Switch Pill & LED */}
              <rect
                x="5" y="25" width="56" height="16" rx="8"
                fill={activeApplianceIds.includes('exhaust_fan') ? "#334155" : "#0f172a"}
                stroke={activeApplianceIds.includes('exhaust_fan') ? "#94a3b8" : "#334155"}
                strokeWidth="1"
              />
              <circle
                cx={activeApplianceIds.includes('exhaust_fan') ? 14 : 52}
                cy="33"
                r="4.5"
                fill={activeApplianceIds.includes('exhaust_fan') ? "#22c55e" : "#64748b"}
                filter={activeApplianceIds.includes('exhaust_fan') ? "drop-shadow(0 0 4px #22c55e)" : undefined}
              />
              <text
                x={activeApplianceIds.includes('exhaust_fan') ? 37 : 28}
                y="36"
                textAnchor="middle"
                fill={activeApplianceIds.includes('exhaust_fan') ? "#e2e8f0" : "#94a3b8"}
                fontSize="8"
                fontWeight="black"
              >
                {activeApplianceIds.includes('exhaust_fan') ? "ON" : "OFF"}
              </text>
            </g>
          </g>

          {/* ── 🛏️ MASTER BEDROOM (UPSTAIRS LEFT) ── */}
          <g id="bedroom-group">
            {/* Room Header Banner */}
            <g transform="translate(240, 65)">
              <rect x="-65" y="-14" width="130" height="28" rx="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
              <text x="0" y="5" textAnchor="middle" fill="#fef08a" fontSize="13" fontWeight="black">
                🛏️ BEDROOM
              </text>
            </g>

            {/* Bedroom AC (1500W) */}
            <g
              transform="translate(165, 90)"
              onClick={() => onToggleAppliance('bedroom_ac')}
              className="cursor-pointer group select-none"
            >
              {/* Sensory Metaphor: Cool Blue Breeze Lines drifting out */}
              {activeApplianceIds.includes('bedroom_ac') && isPowerFlowing && (
                <g opacity="0.85" className="animate-pulse">
                  <path d="M 88 18 Q 100 16 112 20" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
                  <path d="M 88 26 Q 105 26 120 30" fill="none" stroke="#7dd3fc" strokeWidth="2.5" strokeDasharray="4 3" />
                  <path d="M 88 34 Q 100 36 112 32" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
                </g>
              )}
              <rect
                x="0" y="0" width="88" height="48" rx="8"
                fill={activeApplianceIds.includes('bedroom_ac') ? "#075985" : "#1e293b"}
                stroke={activeApplianceIds.includes('bedroom_ac') ? "#38bdf8" : "#475569"}
                strokeWidth={activeApplianceIds.includes('bedroom_ac') ? "2.5" : "1.5"}
                filter={activeApplianceIds.includes('bedroom_ac') ? "drop-shadow(0 0 12px rgba(56,189,248,0.7))" : undefined}
              />
              <text x="44" y="18" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black">
                ❄️ BEDROOM AC
              </text>
              {/* Rocker Switch Pill & LED */}
              <rect
                x="6" y="25" width="76" height="16" rx="8"
                fill={activeApplianceIds.includes('bedroom_ac') ? "#0c4a6e" : "#0f172a"}
                stroke={activeApplianceIds.includes('bedroom_ac') ? "#38bdf8" : "#334155"}
                strokeWidth="1"
              />
              <circle
                cx={activeApplianceIds.includes('bedroom_ac') ? 16 : 72}
                cy="33"
                r="5"
                fill={activeApplianceIds.includes('bedroom_ac') ? "#22c55e" : "#64748b"}
                filter={activeApplianceIds.includes('bedroom_ac') ? "drop-shadow(0 0 5px #22c55e)" : undefined}
              />
              <text
                x={activeApplianceIds.includes('bedroom_ac') ? 48 : 38}
                y="36"
                textAnchor="middle"
                fill={activeApplianceIds.includes('bedroom_ac') ? "#7dd3fc" : "#94a3b8"}
                fontSize="8.5"
                fontWeight="black"
              >
                {activeApplianceIds.includes('bedroom_ac') ? "ON 1500W 🟡" : "OFF (TAP)"}
              </text>
            </g>

            {/* Bed / Ceiling Lamp (100W) */}
            <g
              transform="translate(265, 90)"
              onClick={() => onToggleAppliance('bed_lamp')}
              className="cursor-pointer group select-none"
            >
              {/* Sensory Metaphor: Radiant Warm Lamp Beam */}
              {activeApplianceIds.includes('bed_lamp') && isPowerFlowing && (
                <polygon points="33,0 10,48 56,48" fill="#fef08a" opacity="0.15" className="animate-pulse" />
              )}
              <rect
                x="0" y="0" width="66" height="48" rx="8"
                fill={activeApplianceIds.includes('bed_lamp') ? "#713f12" : "#1e293b"}
                stroke={activeApplianceIds.includes('bed_lamp') ? "#facc15" : "#475569"}
                strokeWidth={activeApplianceIds.includes('bed_lamp') ? "2" : "1"}
                filter={activeApplianceIds.includes('bed_lamp') ? "drop-shadow(0 0 10px rgba(250,204,21,0.6))" : undefined}
              />
              <text x="33" y="18" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="black">
                💡 LAMP
              </text>
              {/* Rocker Switch Pill & LED */}
              <rect
                x="5" y="25" width="56" height="16" rx="8"
                fill={activeApplianceIds.includes('bed_lamp') ? "#422006" : "#0f172a"}
                stroke={activeApplianceIds.includes('bed_lamp') ? "#facc15" : "#334155"}
                strokeWidth="1"
              />
              <circle
                cx={activeApplianceIds.includes('bed_lamp') ? 14 : 52}
                cy="33"
                r="4.5"
                fill={activeApplianceIds.includes('bed_lamp') ? "#22c55e" : "#64748b"}
                filter={activeApplianceIds.includes('bed_lamp') ? "drop-shadow(0 0 4px #22c55e)" : undefined}
              />
              <text
                x={activeApplianceIds.includes('bed_lamp') ? 37 : 28}
                y="36"
                textAnchor="middle"
                fill={activeApplianceIds.includes('bed_lamp') ? "#fef08a" : "#94a3b8"}
                fontSize="8"
                fontWeight="black"
              >
                {activeApplianceIds.includes('bed_lamp') ? "ON 100W" : "OFF"}
              </text>
            </g>
          </g>

          {/* Child Shock Rescue Emerald Force-Field */}
          {isChildShock && isTripped && (
            <g transform="translate(175, 375)">
              <circle cx="0" cy="0" r="60" fill="#10b981" fillOpacity="0.22" stroke="#10b981" strokeWidth="3" strokeDasharray="6,3" className="animate-pulse" />
              <g transform="translate(0, -75)">
                <rect x="-105" y="-16" width="210" height="32" rx="16" fill="#064e3b" stroke="#10b981" strokeWidth="2" filter="drop-shadow(0 0 14px rgba(16,185,129,0.8))" />
                <text x="0" y="5" textAnchor="middle" fill="#a7f3d0" fontSize="11.5" fontWeight="black">
                  🛡️ SAVED IN 0.03s! CHILD IS SAFE! ✨
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

      {/* FLOATING TOP-RIGHT HUD PILL (Leaves bottom terrain & Earth pit 100% visible) */}
      <div className="absolute top-2 right-3 max-w-[96%] px-3 sm:px-4 py-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-700/70 rounded-full shadow-2xl flex flex-wrap items-center justify-center gap-2.5 text-[11px] z-30 pointer-events-auto">
        <div className="flex items-center gap-1.5 font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-sm shadow-orange-500/50" />
          <span className="text-orange-400">Live:</span>
          <span className="text-white font-black">{isPowerFlowing ? `${totalAmps}A ➔` : '0.0A'}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
          <span className="text-blue-400">Neutral:</span>
          <span className="text-white font-black">{isPowerFlowing ? `${totalAmps}A ⬅` : '0.0A'}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="text-emerald-400">Earth:</span>
          <span className={cn(
            "font-black",
            isWetBath && isPowerFlowing ? "text-amber-400 animate-pulse" :
            isChildShock && isPowerFlowing ? "text-rose-400 animate-pulse" :
            "text-emerald-400"
          )}>
            {isWetBath && isPowerFlowing ? '45mA ⤓' :
             isChildShock && isPowerFlowing ? '230mA ⤓' :
             '0.0mA (Safe)'}
          </span>
        </div>

        {/* Closed Loop Status Summary */}
        <div className="flex items-center gap-1.5 border-l border-slate-700/60 pl-2">
          {isTripped ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600 font-bold text-[10px]">
              🔒 Circuit Tripped (Power Isolated)
            </span>
          ) : !isMainsSupplyOn ? (
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold text-[10px]">
              ⚪ Mains Switched OFF (0V)
            </span>
          ) : isOverloaded ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500 font-bold text-[10px] animate-pulse">
              🔥 Overload Alert ({livingAmps}A &gt; 16A)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold text-[10px]">
              ✓ Closed-Loop Balanced (100% Correct)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
