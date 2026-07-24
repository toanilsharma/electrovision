import React, { useState } from 'react';
import { ShieldAlert, Zap, ShieldCheck, Battery, Activity, Shield, ActivitySquare, ChevronDown, LayoutGrid, X, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { SimulationType, UserConfig } from '@/src/types';
import { TrainerToolbar } from './TrainerToolbar';
import { motion, AnimatePresence } from 'motion/react';

interface TopNavProps {
  activeModule: SimulationType;
  onSelect: (module: SimulationType) => void;
  userConfig?: UserConfig;
  onReconfigure?: () => void;
}

const modules: { id: SimulationType; label: string; icon: React.ElementType; tag?: string }[] = [
  { id: 'ac_shock', label: 'AC Shock', icon: Activity, tag: 'Shock Hazard' },
  { id: 'dc_shock', label: 'DC Shock', icon: Battery, tag: 'Shock Hazard' },
  { id: 'earth_fault', label: 'Earth Fault', icon: Shield, tag: 'Fault Hazard' },
  { id: 'short_circuit', label: 'Short Circuit', icon: Zap, tag: 'Fault Hazard' },
  { id: 'step_touch', label: 'Step & Touch', icon: ActivitySquare, tag: 'Ground Potential' },
  { id: 'arc_flash', label: 'Arc Flash', icon: ShieldAlert, tag: 'Thermal Hazard' },
  { id: 'loto', label: 'LOTO Procedure', icon: Shield, tag: 'Safety Protocol' },
  { id: 'first_aid', label: 'First Aid & CPR', icon: Activity, tag: 'Emergency Rescue' },
  { id: 'assessment', label: 'Assessment Mode', icon: ShieldCheck, tag: 'Test Knowledge' },
];

export function TopNavigation({ activeModule, onSelect, userConfig, onReconfigure }: TopNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeModuleObj = modules.find(m => m.id === activeModule) || modules[0];
  const activeIndex = modules.findIndex(m => m.id === activeModule) + 1;
  const ActiveIcon = activeModuleObj.icon;

  const handleModuleSelect = (id: SimulationType) => {
    onSelect(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col border-b bg-slate-900 border-slate-800 shrink-0 z-50 relative shadow-md">
      {/* Top Header Row */}
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-1.5 lg:py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 rounded-md bg-orange-500 transform rotate-45 shrink-0 shadow-md shadow-orange-500/20">
            <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-slate-950 -rotate-45" />
          </div>
          <div>
            <h1 className="text-sm lg:text-base font-black tracking-tight text-white leading-none">
              ELECTROLIVE<span className="text-orange-500 underline decoration-2 underline-offset-4 font-normal text-[8px] align-top ml-1">™</span>
            </h1>
            <p className="text-[6.5px] tracking-widest uppercase text-slate-400 mt-0.5">Developed by DesignCalculators</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Module Selector Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-500/20 via-slate-800 to-slate-900 border border-orange-500/60 rounded-lg text-xs font-black text-orange-300 shadow-sm cursor-pointer active:scale-95 transition-all"
            aria-label="Open simulator modules list"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="text-[10px] uppercase font-bold text-white tracking-wider truncate max-w-[110px]">
              {activeModuleObj.label}
            </span>
            <span className="text-[9px] font-mono text-orange-400 bg-slate-950 px-1 py-0.2 rounded border border-orange-500/30">
              {activeIndex}/9
            </span>
            <ChevronDown className="w-3 h-3 text-orange-400 shrink-0 ml-0.5" />
          </button>

          {userConfig && (
            <>
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
            </>
          )}
        </div>
      </div>
      
      {/* Scrollable Module Selector Row with Left/Right Gradient Fade & Cue */}
      <div className="relative px-3 sm:px-4 pb-2">
        {/* Right Fade Indicator for horizontal scroll hint on mobile */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent sm:hidden z-10 flex items-center justify-end pr-1 text-slate-400">
          <span className="text-[9px] font-mono font-bold animate-pulse text-orange-400">▶</span>
        </div>

        <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style dangerouslySetInnerHTML={{__html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
          `}} />
          <nav className="flex space-x-1.5 lg:space-x-2 no-scrollbar pr-6 sm:pr-0">
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

      {/* Mobile All Modules Drawer / Modal Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-slate-900 border-t-2 border-orange-500 rounded-t-2xl shadow-2xl p-4 flex flex-col max-h-[85vh] z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-orange-400" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      SELECT SIMULATION MODULE
                    </h3>
                    <p className="text-[10px] text-slate-400">9 Safety & Hazard Modules Available</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Module Grid List */}
              <div className="py-3 grid grid-cols-1 gap-2 overflow-y-auto max-h-[60vh]">
                {modules.map((m, index) => {
                  const isActive = m.id === activeModule;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleModuleSelect(m.id)}
                      className={cn(
                        "p-3 rounded-xl flex items-center justify-between text-left border transition-all cursor-pointer active:scale-98",
                        isActive
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-orange-500/20 font-black"
                          : "bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg shrink-0", isActive ? "bg-slate-950 text-orange-400" : "bg-slate-900 text-slate-400")}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider">
                              {m.label}
                            </span>
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase", isActive ? "bg-slate-950 text-amber-300" : "bg-slate-900 text-slate-400 border border-slate-800")}>
                              {index + 1}/9
                            </span>
                          </div>
                          <span className={cn("text-[10px] block mt-0.5 font-medium", isActive ? "text-slate-900 font-bold" : "text-slate-400")}>
                            {m.tag}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-orange-400 font-bold" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
