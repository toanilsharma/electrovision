import React from 'react';
import { Droplets, Thermometer, Wind, CloudRain, Mountain } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type SoilType = 'dry_gravel' | 'wet_soil' | 'concrete';

export interface EnvironmentalState {
  soilType: SoilType;
  humidity: number; // 0 to 100
  temperature: number; // Celsius
  isRaining: boolean;
}

interface EnvironmentalControlsProps {
  state: EnvironmentalState;
  onChange: (newState: EnvironmentalState) => void;
  showSoil?: boolean;
  showRain?: boolean;
}

export function EnvironmentalControls({ state, onChange, showSoil = false, showRain = false }: EnvironmentalControlsProps) {
  
  const getSoilResistivity = (t: SoilType) => {
    switch (t) {
       case 'dry_gravel': return '3000 Ω·m';
       case 'concrete': return '200 Ω·m';
       case 'wet_soil': return '50 Ω·m';
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-slate-900/40 border-slate-700/50 shadow-inner flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#cbd5e1] uppercase">
        <Thermometer className="w-4 h-4 text-sky-400" /> Environmental & Soil Factors
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Humidity Control */}
        <div>
           <label className="flex items-center justify-between text-[11px] font-medium text-white uppercase tracking-wider mb-2">
             <span className="flex items-center gap-2"><Droplets className="w-3 h-3 text-sky-400" /> Humidity</span>
             <span className="font-mono text-sky-400 font-bold">{state.humidity}%</span>
           </label>
           <input
             type="range"
             min="0" max="100" step="5"
             value={state.humidity}
             onChange={(e) => onChange({...state, humidity: Number(e.target.value)})}
             className="w-full accent-sky-500"
           />
           <p className="text-[9px] text-slate-500 uppercase mt-1 leading-tight">High humidity exponentially lowers skin resistance.</p>
        </div>

        {/* Rain Toggle */}
        {showRain && (
          <div>
            <label className="flex items-center text-[11px] font-medium text-white uppercase tracking-wider mb-2 gap-2">
              <CloudRain className="w-3 h-3 text-sky-400" /> Precipitation
            </label>
            <button
               onClick={() => onChange({...state, isRaining: !state.isRaining})}
               className={cn(
                 "w-full p-2 rounded border uppercase text-[10px] font-bold tracking-widest transition-colors",
                 state.isRaining 
                   ? "bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                   : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
               )}
            >
              {state.isRaining ? "Heavy Rain Active" : "Dry Conditions"}
            </button>
          </div>
        )}

        {/* Soil Selector */}
        {showSoil && (
          <div className="md:col-span-2">
            <label className="flex items-center justify-between text-[11px] font-medium text-white uppercase tracking-wider mb-2">
              <span className="flex items-center gap-2"><Mountain className="w-3 h-3 text-emerald-500" /> Surface Material (ρ)</span>
              <span className="font-mono text-emerald-400 font-bold">{getSoilResistivity(state.soilType)}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
               {(['dry_gravel', 'concrete', 'wet_soil'] as SoilType[]).map(type => (
                 <button
                   key={type}
                   onClick={() => onChange({...state, soilType: type})}
                   className={cn(
                     "p-2 rounded text-[9px] font-bold uppercase tracking-widest border transition-colors",
                     state.soilType === type
                       ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                       : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                   )}
                 >
                   {type.replace('_', ' ')}
                 </button>
               ))}
            </div>
            <p className="text-[9px] text-slate-500 uppercase mt-2">Surface resistivity (ρ) determines the severity of step voltage gradients.</p>
          </div>
        )}
      </div>
    </div>
  );
}
