import React from 'react';
import { ShieldAlert, Zap, ShieldCheck, Battery, Activity, Shield, ActivitySquare, BookOpen } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { SimulationType, UserConfig } from '@/src/types';
import { TrainerToolbar } from './TrainerToolbar';

interface TopNavProps {
  activeModule: SimulationType;
  onSelect: (module: SimulationType) => void;
  userConfig?: UserConfig;
  onReconfigure?: () => void;
}

const modules: { id: SimulationType; label: string; icon: React.ElementType }[] = [
  { id: 'ac_shock', label: 'AC Shock', icon: Activity },
  { id: 'dc_shock', label: 'DC Shock', icon: Battery },
  { id: 'earth_fault', label: 'Earth Fault', icon: Shield },
  { id: 'short_circuit', label: 'Short Circuit', icon: Zap },
  { id: 'step_touch', label: 'Step & Touch', icon: ActivitySquare },
  { id: 'arc_flash', label: 'Arc Flash', icon: ShieldAlert },
  { id: 'loto', label: 'LOTO Procedure', icon: Shield },
  { id: 'first_aid', label: 'First Aid & CPR', icon: Activity },
  { id: 'assessment', label: 'Assessment Mode', icon: ShieldCheck },
];

export function TopNavigation({ activeModule, onSelect, userConfig, onReconfigure }: TopNavProps) {
  return (
    <div className="flex flex-col border-b bg-slate-900 border-slate-800 shrink-0 z-50 relative shadow-md">
      {/* Top Header Row - Thin and clean */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-1.5 lg:py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 rounded-md bg-orange-500 transform rotate-45 shrink-0 shadow-md shadow-orange-500/20">
            <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-slate-950 -rotate-45" />
          </div>
          <div>
            <h1 className="text-sm lg:text-base font-black tracking-tight text-white leading-none">
              ELECTROVISION<span className="text-orange-500 underline decoration-2 underline-offset-4 font-normal text-[8px] align-top ml-1">™</span>
            </h1>
            <p className="text-[6.5px] tracking-widest uppercase text-slate-400 mt-0.5">Developed by DesignCalculators</p>
          </div>
        </div>
        
        {userConfig && (
          <div className="flex items-center gap-2 md:gap-4">
            <TrainerToolbar />
            <button 
              onClick={onReconfigure}
              className="hidden sm:block px-3 py-1 bg-slate-950/60 rounded-full border border-slate-800 text-[9px] md:text-[10px] font-black text-slate-200 tracking-wider uppercase hover:bg-slate-800 hover:border-orange-500/50 transition-colors cursor-pointer"
            >
              {userConfig.environment} | {userConfig.profile.replace('_', ' ')}
            </button>
            <button 
              onClick={onReconfigure}
              className="w-6 h-6 flex items-center justify-center font-black text-slate-900 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border border-white/20 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] hover:scale-105 transition-all text-xs shrink-0 cursor-pointer"
            >
              {userConfig.profile.charAt(0).toUpperCase()}
            </button>
          </div>
        )}
      </div>
      
      {/* Scrollable Module Selector Row */}
      <div className="px-4 overflow-x-auto pb-2 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
        <nav className="flex space-x-1.5 lg:space-x-2 no-scrollbar">
          {modules.map((m) => {
            const isActive = m.id === activeModule;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={cn(
                  "flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1.5 text-[9px] lg:text-[10px] font-bold tracking-wider transition-all rounded-lg uppercase whitespace-nowrap shrink-0 border cursor-pointer",
                  isActive 
                    ? "bg-orange-500 text-slate-950 border-orange-400 shadow-md shadow-orange-500/10" 
                    : "bg-slate-950/40 text-slate-300 border-slate-800/80 hover:text-white hover:bg-slate-800 hover:border-slate-700/60"
                )}
              >
                <Icon className={cn("w-3 h-3 lg:w-3.5 lg:h-3.5", isActive ? "text-slate-950" : "text-slate-400")} />
                {m.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
