import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceDot, CartesianGrid, ReferenceArea } from 'recharts';
import { ElectrodeConfig, GroundingSystem, calculateIEEE1584_2018 } from '../utils/ieee1584-2018';
import { Activity, MapPin, Layers } from 'lucide-react';

interface ChartsPanelProps {
  voltage: number;
  boltedFaultCurrent: number;
  gap: number;
  workingDistance: number; // mm
  clearingTimeMs: number; // ms
  electrodeConfig: ElectrodeConfig;
  enclosureWidth: number;
  enclosureHeight: number;
  enclosureDepth: number;
  grounding: GroundingSystem;
  currentIncidentEnergy: number; // cal/cm2
  currentBoundaryRadius: number; // meters
}

export function ChartsPanel({
  voltage,
  boltedFaultCurrent,
  gap,
  workingDistance,
  clearingTimeMs,
  electrodeConfig,
  enclosureWidth,
  enclosureHeight,
  enclosureDepth,
  grounding,
  currentIncidentEnergy,
  currentBoundaryRadius,
}: ChartsPanelProps) {
  const [activeTab, setActiveTab] = useState<'time' | 'distance'>('time');

  // Working distance mm -> meters
  const workingDistanceMeters = Number((workingDistance / 1000).toFixed(2));

  // =========================================================================
  // Generate Tab A Data: Incident Energy vs Clearing Time (20 to 500 ms)
  // =========================================================================
  const timeData = useMemo(() => {
    const points: Array<{ timeMs: number; energy: number }> = [];
    for (let t = 20; t <= 500; t += 20) {
      const res = calculateIEEE1584_2018({
        voltage,
        boltedFaultCurrent,
        gap,
        workingDistance,
        clearingTimeMs: t,
        electrodeConfig,
        enclosureWidth,
        enclosureHeight,
        enclosureDepth,
        grounding,
      });
      points.push({
        timeMs: t,
        energy: Number(res.incidentEnergy.toFixed(2)),
      });
    }
    return points;
  }, [voltage, boltedFaultCurrent, gap, workingDistance, electrodeConfig, enclosureWidth, enclosureHeight, enclosureDepth, grounding]);

  // =========================================================================
  // Generate Tab B Data: Incident Energy vs Distance (0.2m to 10.0m Log Scale)
  // =========================================================================
  const distanceData = useMemo(() => {
    const points: Array<{ distMeters: number; energy: number }> = [];
    // Logarithmically spaced distance points from 0.2m to 10m
    const dists = [0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0];
    for (const dM of dists) {
      const res = calculateIEEE1584_2018({
        voltage,
        boltedFaultCurrent,
        gap,
        workingDistance: Math.round(dM * 1000),
        clearingTimeMs,
        electrodeConfig,
        enclosureWidth,
        enclosureHeight,
        enclosureDepth,
        grounding,
      });
      points.push({
        distMeters: dM,
        energy: Number(res.incidentEnergy.toFixed(2)),
      });
    }
    return points;
  }, [voltage, boltedFaultCurrent, gap, clearingTimeMs, electrodeConfig, enclosureWidth, enclosureHeight, enclosureDepth, grounding]);

  return (
    <div className="p-3.5 md:p-4 rounded-xl bg-slate-900 border border-slate-750 shadow-lg shrink-0">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 border-b border-white/10 pb-2.5">
        <h3 className="text-xs md:text-sm font-black tracking-wider uppercase text-orange-400 border-l-3 border-orange-500 pl-2 flex items-center gap-1.5">
          <Activity className="w-4 h-4" /> IEEE 1584 DYNAMIC CHARTS
        </h3>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab('time')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
              activeTab === 'time' ? 'bg-orange-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tab A: Energy vs Time</span>
          </button>

          <button
            onClick={() => setActiveTab('distance')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
              activeTab === 'distance' ? 'bg-orange-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Tab B: Energy vs Distance</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="w-full h-64 md:h-72 relative bg-slate-950/80 p-2 rounded-xl border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'time' ? (
            <LineChart data={timeData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              
              {/* Shaded NFPA 70E Category Bands */}
              <ReferenceArea y1={0} y2={4} fill="rgba(34, 197, 94, 0.08)" stroke="none" />
              <ReferenceArea y1={4} y2={8} fill="rgba(234, 179, 8, 0.08)" stroke="none" />
              <ReferenceArea y1={8} y2={25} fill="rgba(249, 115, 22, 0.08)" stroke="none" />
              <ReferenceArea y1={25} y2={40} fill="rgba(239, 68, 68, 0.08)" stroke="none" />
              <ReferenceArea y1={40} y2={60} fill="rgba(185, 28, 28, 0.15)" stroke="none" />

              {/* Category Threshold Reference Lines with >=11px Labels */}
              <ReferenceLine y={4} stroke="#22c55e" strokeWidth={1} label={{ value: 'Cat 1 (4 cal)', fill: '#22c55e', position: 'top', fontSize: 11, fontWeight: 'bold' } as any} />
              <ReferenceLine y={8} stroke="#eab308" strokeWidth={1} label={{ value: 'Cat 2 (8 cal)', fill: '#eab308', position: 'top', fontSize: 11, fontWeight: 'bold' } as any} />
              <ReferenceLine y={25} stroke="#f97316" strokeWidth={1} label={{ value: 'Cat 3 (25 cal)', fill: '#f97316', position: 'top', fontSize: 11, fontWeight: 'bold' } as any} />
              <ReferenceLine y={40} stroke="#ef4444" strokeWidth={1.5} label={{ value: 'Danger (40 cal)', fill: '#ef4444', position: 'top', fontSize: 11, fontWeight: 'black' } as any} />

              <XAxis 
                dataKey="timeMs" 
                stroke="#94a3b8" 
                tick={{ fontSize: 11, fill: '#cbd5e1' }}
                label={{ value: 'Clearing Time t (ms)', position: 'insideBottom', offset: -15, fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }}
              />
              <YAxis 
                domain={[0, 60]} 
                stroke="#94a3b8" 
                tick={{ fontSize: 11, fill: '#cbd5e1' }}
                label={{ value: 'Incident Energy E (cal/cm²)', angle: -90, position: 'insideLeft', fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }}
              />
              
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const energy = payload[0].value;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-slate-100 font-mono text-xs space-y-1">
                        <div className="font-bold text-orange-400">Clearing Time t: {label} ms</div>
                        <div>Incident Energy E: <strong className="text-white">{energy} cal/cm²</strong></div>
                        <div>Working Distance D: <strong className="text-white">{workingDistanceMeters} m</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              {/* Current Operating Point Marker */}
              <ReferenceLine x={clearingTimeMs} stroke="#38bdf8" strokeWidth={2} strokeDasharray="3 3" label={{ value: `t=${clearingTimeMs}ms`, fill: '#38bdf8', position: 'top', fontSize: 11, fontWeight: 'bold' } as any} />
              <ReferenceDot x={clearingTimeMs} y={currentIncidentEnergy} r={6} fill="#f97316" stroke="#ffffff" strokeWidth={2} />

              <Line type="monotone" dataKey="energy" stroke="#f97316" strokeWidth={3} dot={{ r: 2 }} />
            </LineChart>
          ) : (
            <LineChart data={distanceData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              
              {/* Shaded Bands */}
              <ReferenceArea y1={0} y2={4} fill="rgba(34, 197, 94, 0.08)" stroke="none" />
              <ReferenceArea y1={4} y2={8} fill="rgba(234, 179, 8, 0.08)" stroke="none" />
              <ReferenceArea y1={8} y2={25} fill="rgba(249, 115, 22, 0.08)" stroke="none" />
              <ReferenceArea y1={25} y2={40} fill="rgba(239, 68, 68, 0.08)" stroke="none" />
              <ReferenceArea y1={40} y2={60} fill="rgba(185, 28, 28, 0.15)" stroke="none" />

              <XAxis 
                dataKey="distMeters" 
                type="number"
                scale="log"
                domain={[0.2, 10]}
                allowDataOverflow
                stroke="#94a3b8" 
                tick={{ fontSize: 11, fill: '#cbd5e1' }}
                label={{ value: 'Working Distance D (meters - Log Scale)', position: 'insideBottom', offset: -15, fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }}
              />
              <YAxis 
                domain={[0, 60]} 
                stroke="#94a3b8" 
                tick={{ fontSize: 11, fill: '#cbd5e1' }}
                label={{ value: 'Incident Energy E (cal/cm²)', angle: -90, position: 'insideLeft', fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }}
              />

              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-slate-100 font-mono text-xs space-y-1">
                        <div className="font-bold text-sky-400">Distance D: {data.distMeters} m</div>
                        <div>Incident Energy E: <strong className="text-white">{data.energy} cal/cm²</strong></div>
                        <div>Clearing Time t: <strong className="text-white">{clearingTimeMs} ms</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* 1.2 cal/cm2 Arc Flash Boundary Line */}
              <ReferenceLine y={1.2} stroke="#ef4444" strokeWidth={2} label={{ value: 'AFB 1.2 cal/cm²', fill: '#ef4444', position: 'top', fontSize: 11, fontWeight: 'bold' } as any} />
              
              {/* Vertical Markers at D (Working Distance) and Db (Arc Boundary) */}
              <ReferenceLine x={workingDistanceMeters} stroke="#38bdf8" strokeWidth={2} label={{ value: `D=${workingDistanceMeters}m`, fill: '#38bdf8', position: 'top', fontSize: 11, fontWeight: 'bold' } as any} />
              <ReferenceLine x={currentBoundaryRadius} stroke="#f97316" strokeWidth={2} strokeDasharray="3 3" label={{ value: `Db=${currentBoundaryRadius}m`, fill: '#f97316', position: 'top', fontSize: 11, fontWeight: 'bold' } as any} />
              
              {/* Operating Point Dot */}
              <ReferenceDot x={workingDistanceMeters} y={currentIncidentEnergy} r={6} fill="#38bdf8" stroke="#ffffff" strokeWidth={2} />

              <Line type="monotone" dataKey="energy" stroke="#06b6d4" strokeWidth={3} dot={{ r: 2 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend / Readout Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-slate-300 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
          <span>Operating Point E: <strong className="text-white">{currentIncidentEnergy.toFixed(2)} cal/cm²</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-sky-400 inline-block"></span>
          <span>Arc Boundary Db: <strong className="text-white">{currentBoundaryRadius.toFixed(2)} m</strong></span>
        </div>
      </div>
    </div>
  );
}
