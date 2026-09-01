import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MCBState, TripCause } from '../../mcb/types';
import { BreakerCutaway } from './BreakerCutaway';
import { cn } from '@/src/lib/utils';
import { Eye, Layers, Zap, Sparkles, RotateCcw, Box, ShieldAlert, Clock, Info } from 'lucide-react';

interface CutawayView3DProps {
  temperature: number;      // Bimetal temp °C
  bimetalTripTemp?: number;  // °C threshold (130°C)
  state: MCBState;          // CLOSED, UNLATCHED, ARCING, OPEN_CLEARED
  tripCause: TripCause;
  current?: number;          // Instantaneous current (A)
  In?: number;
  remainingTimeSec?: number; // Countdown timer until trip
  className?: string;
}

export const CutawayView3D: React.FC<CutawayView3DProps> = ({
  temperature,
  bimetalTripTemp = 130,
  state,
  tripCause,
  current = 0,
  In = 16,
  remainingTimeSec,
  className
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // Controls State
  const [explodedRatio, setExplodedRatio] = useState<number>(0);
  const [housingOpacityMode, setHousingOpacityMode] = useState<'transparent' | 'xray' | 'solid'>('transparent');
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  const isTripped = state !== MCBState.CLOSED;
  const isMagneticTrip = tripCause === TripCause.MAGNETIC || tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE;

  // Check WebGL Support
  useEffect(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  // Three.js 3D WebGL Scene Lifecycle
  useEffect(() => {
    if (!webglSupported || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 320;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(4.5, 2.8, 6.0);

    // Renderer (DPR Cap 2)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.5;
    controls.maxDistance = 12.0;
    controls.target.set(0, 0, 0);

    // Lighting setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.8);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.7);
    rimLight.position.set(-5, 2, -5);
    scene.add(rimLight);

    // Internal Arc PointLight for Flash & Trip
    const arcLight = new THREE.PointLight(0x38bdf8, 0, 4);
    arcLight.position.set(-0.8, 0.2, 0);
    scene.add(arcLight);

    // Ground Contact Shadow Grid Plane
    const groundGeo = new THREE.PlaneGeometry(14, 14);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.8;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(12, 24, 0x334155, 0x1e293b);
    gridHelper.position.y = -1.79;
    scene.add(gridHelper);

    // ==========================================
    // PARAMETRIC 3D MCB MODEL CONSTRUCTION
    // ==========================================
    const mcbGroup = new THREE.Group();
    scene.add(mcbGroup);

    // 1. Polycarbonate Outer Housing (Front & Back Shells)
    const housingMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: housingOpacityMode === 'solid' ? 0.92 : housingOpacityMode === 'xray' ? 0.15 : 0.45,
      roughness: 0.15,
      metalness: 0.1,
      transmission: housingOpacityMode === 'solid' ? 0.1 : 0.75,
      ior: 1.5,
      depthWrite: housingOpacityMode === 'solid'
    });

    const frontShellGeo = new THREE.BoxGeometry(3.6, 3.2, 0.35);
    const frontShell = new THREE.Mesh(frontShellGeo, housingMat);
    frontShell.position.set(0, 0, 0.45);
    frontShell.castShadow = true;
    mcbGroup.add(frontShell);

    const backShellGeo = new THREE.BoxGeometry(3.6, 3.2, 0.35);
    const backShell = new THREE.Mesh(backShellGeo, housingMat);
    backShell.position.set(0, 0, -0.45);
    backShell.receiveShadow = true;
    mcbGroup.add(backShell);

    // 2. Terminal Blocks (Top Line & Bottom Load)
    const terminalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const topTerminal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.6), terminalMat);
    topTerminal.position.set(-0.9, 1.6, 0);
    mcbGroup.add(topTerminal);

    const bottomTerminal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.6), terminalMat);
    bottomTerminal.position.set(0.9, -1.6, 0);
    mcbGroup.add(bottomTerminal);

    // 3. Operating Toggle Handle
    const handleGroup = new THREE.Group();
    handleGroup.position.set(0.6, 1.2, 0);

    const handlePivotMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 });
    const handlePivot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 16), handlePivotMat);
    handlePivot.rotation.x = Math.PI / 2;
    handleGroup.add(handlePivot);

    const handleKnobMat = new THREE.MeshStandardMaterial({
      color: isTripped ? 0xef4444 : 0x10b981,
      roughness: 0.3,
      metalness: 0.2
    });
    const handleKnob = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 0.4), handleKnobMat);
    handleKnob.position.set(0.2, 0.35, 0);
    handleKnob.rotation.z = -0.3;
    handleGroup.add(handleKnob);
    mcbGroup.add(handleGroup);

    // 4. Fixed & Moving Contact Assembly
    const contactArmMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.1 });

    const fixedContact = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.2), contactArmMat);
    fixedContact.position.set(-0.8, 0.3, 0);
    const fixedTip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), tipMat);
    fixedTip.position.set(0.15, 0, 0);
    fixedContact.add(fixedTip);
    mcbGroup.add(fixedContact);

    const movingContactGroup = new THREE.Group();
    movingContactGroup.position.set(-0.4, -0.3, 0);
    const movingArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.15), contactArmMat);
    movingArm.position.set(0, 0.35, 0);
    const movingTip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), tipMat);
    movingTip.position.set(-0.06, 0.7, 0);
    movingArm.add(movingTip);
    movingContactGroup.add(movingArm);
    mcbGroup.add(movingContactGroup);

    // 5. Arc Chute Stack (7 Steel De-ionizing Plates)
    const arcChuteGroup = new THREE.Group();
    arcChuteGroup.position.set(-1.1, -0.2, 0);

    const plateMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    for (let i = 0; i < 7; i++) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.5), plateMat);
      plate.position.set(0, (i - 3) * 0.14, 0);
      arcChuteGroup.add(plate);
    }
    mcbGroup.add(arcChuteGroup);

    // 6. Magnetic Solenoid Coil & Plunger
    const solenoidGroup = new THREE.Group();
    solenoidGroup.position.set(0.2, -0.2, 0);

    const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.7, roughness: 0.3 });
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.65, 20), coilMat);
    coil.rotation.z = Math.PI / 2;
    solenoidGroup.add(coil);

    const plungerMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 });
    const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16), plungerMat);
    plunger.rotation.z = Math.PI / 2;
    plunger.position.set(-0.15, 0, 0);
    solenoidGroup.add(plunger);
    mcbGroup.add(solenoidGroup);

    // 7. Bimetal Thermal Element (Layered Strip)
    const bimetalGroup = new THREE.Group();
    bimetalGroup.position.set(1.0, -0.6, 0);

    const bimetalMat = new THREE.MeshStandardMaterial({
      color: temperature >= bimetalTripTemp ? 0xef4444 : temperature > 60 ? 0xf59e0b : 0x38bdf8,
      emissive: temperature > 60 ? (temperature >= bimetalTripTemp ? 0xef4444 : 0xf59e0b) : 0x000000,
      emissiveIntensity: temperature > 60 ? 0.6 : 0,
      metalness: 0.5,
      roughness: 0.4
    });

    const bimetalStrip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.25), bimetalMat);
    bimetalStrip.position.set(0, 0.6, 0);
    bimetalGroup.add(bimetalStrip);
    mcbGroup.add(bimetalGroup);

    // Animation & State Update Variables
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Orbit controls update
      controls.update();

      // Exploded View Interpolation
      frontShell.position.z = 0.45 + explodedRatio * 1.5;
      backShell.position.z = -0.45 - explodedRatio * 1.5;
      arcChuteGroup.position.x = -1.1 - explodedRatio * 0.8;
      bimetalGroup.position.x = 1.0 + explodedRatio * 0.8;
      solenoidGroup.position.y = -0.2 - explodedRatio * 0.6;
      topTerminal.position.y = 1.6 + explodedRatio * 0.5;
      bottomTerminal.position.y = -1.6 - explodedRatio * 0.5;

      // Contact Arm Opening & Handle Snap
      if (isTripped) {
        movingContactGroup.rotation.z = THREE.MathUtils.lerp(movingContactGroup.rotation.z, -0.75, 0.15);
        handleGroup.rotation.z = THREE.MathUtils.lerp(handleGroup.rotation.z, -0.85, 0.15);
      } else {
        movingContactGroup.rotation.z = THREE.MathUtils.lerp(movingContactGroup.rotation.z, 0, 0.15);
        handleGroup.rotation.z = THREE.MathUtils.lerp(handleGroup.rotation.z, 0, 0.15);
      }

      // Solenoid Plunger Stroke
      if (isMagneticTrip) {
        plunger.position.x = THREE.MathUtils.lerp(plunger.position.x, -0.45, 0.2);
      } else {
        plunger.position.x = THREE.MathUtils.lerp(plunger.position.x, -0.15, 0.1);
      }

      // Bimetal Thermal Deflection
      const bimetalBend = Math.min(0.5, ((temperature - 30) / (bimetalTripTemp - 30)) * 0.5);
      bimetalStrip.rotation.z = THREE.MathUtils.lerp(bimetalStrip.rotation.z, -bimetalBend, 0.1);

      // Arc PointLight Flash on Trip
      if (state === MCBState.ARCING) {
        arcLight.intensity = 2.5 + Math.random() * 2.0;
      } else {
        arcLight.intensity = THREE.MathUtils.lerp(arcLight.intensity, 0, 0.1);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, [webglSupported, explodedRatio, housingOpacityMode, isTripped, isMagneticTrip, temperature, bimetalTripTemp, state]);

  // Fallback to SVG Cutaway if WebGL unavailable
  if (!webglSupported) {
    return (
      <BreakerCutaway
        temperature={temperature}
        bimetalTripTemp={bimetalTripTemp}
        state={state}
        tripCause={tripCause}
        remainingTimeSec={remainingTimeSec}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative w-full h-full min-h-[320px] bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between overflow-hidden font-mono select-none',
        className
      )}
    >
      {/* Top Header Overlay & Controls */}
      <div className="w-full flex flex-wrap items-center justify-between gap-1.5 mb-1.5 z-20 shrink-0 border-b border-slate-800/80 pb-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
        <div className="flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            WebGL 3D Cutaway Cockpit
          </span>
        </div>

        {/* Action Toggles: Transparency & Exploded View Slider */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Transparency Mode Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] shrink-0">
            <span className="text-slate-400 pl-1 font-bold">Shell:</span>
            {(['transparent', 'xray', 'solid'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setHousingOpacityMode(mode)}
                className={cn(
                  "px-2 py-0.5 rounded uppercase font-black transition-all cursor-pointer min-h-[28px] shrink-0",
                  housingOpacityMode === mode ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                )}
              >
                {mode === 'transparent' ? 'Glass' : mode === 'xray' ? 'X-Ray' : 'Solid'}
              </button>
            ))}
          </div>

          {/* EXPLODED-VIEW SLIDER */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px] shrink-0">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-bold">EXPLODED VIEW:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={explodedRatio}
              onChange={(e) => setExplodedRatio(parseFloat(e.target.value))}
              className="w-20 sm:w-28 h-1.5 accent-cyan-500 cursor-pointer rounded bg-slate-800"
            />
            <span className="text-cyan-400 font-mono text-[10px] tabular-nums">
              {(explodedRatio * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="relative w-full flex-1 min-h-[180px] rounded-lg overflow-hidden border border-slate-850 bg-[#090d16]">
        
        {/* Real-time Status Overlay Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
          {isTripped ? (
            <span className="px-2.5 py-0.5 rounded bg-rose-950/90 border border-rose-500 text-rose-300 text-[11px] font-black uppercase shadow flex items-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> TRIPPED ({tripCause})
            </span>
          ) : remainingTimeSec !== undefined && remainingTimeSec < 3600 ? (
            <span className="px-2.5 py-0.5 rounded bg-amber-950/90 border border-amber-500 text-amber-300 text-[11px] font-black uppercase shadow flex items-center gap-1 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> TRIP IN: {remainingTimeSec.toFixed(1)}s
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-[11px] font-bold shadow flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> CLOSED &amp; ENERGIZED
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2 z-10 pointer-events-none text-[10px] text-slate-500 font-sans">
          Left Drag: Orbit • Right Drag: Pan • Scroll: Zoom (Cap DPR: 2)
        </div>

        {/* Mounting element for Three.js WebGL canvas */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>

      {/* Footer Metrics */}
      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-1.5 mt-1.5 shrink-0">
        <span>Bimetal Temp: <strong className="text-amber-400">{temperature.toFixed(1)}°C</strong></span>
        <span>Solenoid: <strong className={isMagneticTrip ? 'text-cyan-400' : 'text-slate-400'}>{isMagneticTrip ? 'PULLED (<10ms)' : 'STANDBY'}</strong></span>
        <span>Contact: <strong className={isTripped ? 'text-rose-400' : 'text-emerald-400'}>{isTripped ? 'SEPARATED (Ag/C)' : 'CLOSED'}</strong></span>
      </div>
    </div>
  );
};
