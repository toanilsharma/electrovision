import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceDot, CartesianGrid } from 'recharts';
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

  // Convert working distance mm -> meters for distance curve calculation
  const workingDistanceMeters = Number((workingDistance / 1000).toFixed(2));

  // =========================================================================
  // Generate Tab A Data: Energy vs Clearing Time (0 to 500 ms)
  // =========================================================================
  const timeData = React.useMemo(() => {
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
  // Generate Tab B Data: Energy vs Distance (0.3m to 10.0m)
  // =========================================================================
  const distanceData = React.useMemo(() => {
    const points: Array<{ distMeters: number; energy: number }> = [];
    for (let d = 300; d <= 5000; d += 200) {
      const res = calculateIEEE1584_2018({
        voltage,
        boltedFaultCurrent,
        gap,
        workingDistance: d,
        clearingTimeMs,
        electrodeConfig,
        enclosureWidth,
        enclosureHeight,
        enclosureDepth,
        grounding,
      });
      points.push({
        distMeters: Number((d / 1000).toFixed(2)),
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
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'time' ? 'bg-orange-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Tab A: Energy vs Time</span>
          </button>

          <button
            onClick={() => setActiveTab('distance')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'distance' ? 'bg-orange-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>Tab B: Energy vs Distance</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-56 md:h-64 relative bg-slate-950/80 p-2 rounded-xl border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'time' ? (
            <LineChart data={timeData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="timeMs" 
                stroke="#94a3b8" 
                tick={{ fontSize: 10 }}
                label={{ value: 'Clearing Time (ms)', position: 'insideBottom', offset: -10, fill: '#cbd5e1' }}
              />
              <YAxis 
                domain={[0, 60]} 
                stroke="#94a3b8" 
                tick={{ fontSize: 10 }}
                label={{ value: 'Energy (cal/cm²)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} 
                formatter={(val: any) => [`${val} cal/cm²`, 'Incident Energy']}
                labelFormatter={(lbl: any) => `Time: ${lbl} ms`}
              />
              
              {/* Category Threshold Reference Lines */}
              <ReferenceLine y={4} stroke="#22c55e" strokeDasharray="2 2" label={{ value: 'Cat 1 (4 cal)', fill: '#22c55e', position: 'top' } as any} />
              <ReferenceLine y={8} stroke="#eab308" strokeDasharray="2 2" label={{ value: 'Cat 2 (8 cal)', fill: '#eab308', position: 'top' } as any} />
              <ReferenceLine y={25} stroke="#f97316" strokeDasharray="2 2" label={{ value: 'Cat 3 (25 cal)', fill: '#f97316', position: 'top' } as any} />
              <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="2 2" label={{ value: 'Danger (40 cal)', fill: '#ef4444', position: 'top' } as any} />
              
              {/* Current Clearing Time Reference Line */}
              <ReferenceLine x={clearingTimeMs} stroke="#38bdf8" strokeWidth={2} label={{ value: `${clearingTimeMs}ms`, fill: '#38bdf8', position: 'top' } as any} />
              <ReferenceDot x={clearingTimeMs} y={currentIncidentEnergy} r={5} fill="#f97316" stroke="#fff" strokeWidth={2} />

              <Line type="monotone" dataKey="energy" stroke="#f97316" strokeWidth={2.5} dot={{ r: 2 }} />
            </LineChart>
          ) : (
            <LineChart data={distanceData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="distMeters" 
                stroke="#94a3b8" 
                tick={{ fontSize: 10 }}
                label={{ value: 'Working Distance D (meters)', position: 'insideBottom', offset: -10, fill: '#cbd5e1' }}
              />
              <YAxis 
                domain={[0, 60]} 
                stroke="#94a3b8" 
                tick={{ fontSize: 10 }}
                label={{ value: 'Energy (cal/cm²)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} 
                formatter={(val: any) => [`${val} cal/cm²`, 'Incident Energy']}
                labelFormatter={(lbl: any) => `Distance: ${lbl} m`}
              />

              {/* 1.2 cal/cm2 Arc Flash Boundary Reference Line */}
              <ReferenceLine y={1.2} stroke="#ef4444" strokeWidth={2} label={{ value: 'AFB (1.2 cal/cm²)', fill: '#ef4444', position: 'top' } as any} />
              <ReferenceLine x={workingDistanceMeters} stroke="#38bdf8" strokeDasharray="3 3" label={{ value: `D=${workingDistanceMeters}m`, fill: '#38bdf8', position: 'top' } as any} />
              <ReferenceLine x={currentBoundaryRadius} stroke="#f97316" strokeDasharray="3 3" label={{ value: `AFB=${currentBoundaryRadius}m`, fill: '#f97316', position: 'top' } as any} />
              
              <ReferenceDot x={workingDistanceMeters} y={currentIncidentEnergy} r={5} fill="#f97316" stroke="#fff" strokeWidth={2} />

              <Line type="monotone" dataKey="energy" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 2 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend / Status Footer */}
      <div className="flex items-center justify-between mt-2 text-[10px] md:text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
          <span>Current Exposure: <strong className="text-white">{currentIncidentEnergy.toFixed(2)} cal/cm²</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
          <span>Boundary Radius (D_b): <strong className="text-white">{currentBoundaryRadius.toFixed(2)} m</strong></span>
        </div>
      </div>
    </div>
  );
}
