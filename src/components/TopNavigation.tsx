import React, { useState, useMemo } from 'react';
import { ShieldAlert, Zap, ShieldCheck, Battery, Activity, Shield, ActivitySquare, ChevronDown, LayoutGrid, X, Check, Home, Factory, RotateCcw, HelpCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { SimulationType, UserConfig } from '@/src/types';
import { TrainerToolbar } from './TrainerToolbar';
import { motion, AnimatePresence } from 'motion/react';

interface TopNavProps {
  activeModule: SimulationType;
  onSelect: (module: SimulationType) => void;
  userConfig?: UserConfig;
  onReconfigure?: () => void;
  onResetSimulator?: () => void;
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
  { id: 'mcb_simulator', label: 'IEC 60898 MCB', icon: Zap, tag: 'Breaker Physics' },
  { id: 'assessment', label: 'Assessment Mode', icon: ShieldCheck, tag: 'Test Knowledge' },
  { id: 'safety_quiz', label: 'Safety Quiz', icon: HelpCircle, tag: 'IEC Micro-Quiz' },
];

const RESIDENTIAL_MODULE_IDS: SimulationType[] = ['ac_shock', 'earth_fault', 'short_circuit', 'first_aid', 'mcb_simulator', 'assessment', 'safety_quiz'];

export function TopNavigation({ activeModule, onSelect, userConfig, onReconfigure, onResetSimulator }: TopNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const visibleModules = useMemo(() => {
    if (userConfig?.environment === 'residential') {
      return modules.filter(m => RESIDENTIAL_MODULE_IDS.includes(m.id));
    }
    return modules;
  }, [userConfig?.environment]);

  const activeModuleObj = visibleModules.find(m => m.id === activeModule) || visibleModules[0] || modules[0];
  const activeIndex = visibleModules.findIndex(m => m.id === activeModule) + 1;

  const handleModuleSelect = (id: SimulationType) => {
    onSelect(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col border-b bg-slate-900 border-slate-800 shrink-0 z-50 relative shadow-md">
      {/* Professional Compact Top Header Row */}
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-5 py-1 min-h-[36px]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded bg-orange-500 transform rotate-45 shrink-0 shadow-sm shadow-orange-500/20">
            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-950 -rotate-45" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-white leading-none">
              ELECTROLIVE<span className="text-orange-500 underline font-normal text-[8px] align-top ml-0.5">™</span>
            </h1>
            <span className="hidden md:inline text-[8px] tracking-wider uppercase text-slate-400 font-mono font-bold border-l border-slate-700 pl-2">
              DesignCalculators
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-2.5">
          {/* Global Reset Simulator Button */}
          <button
            type="button"
            onClick={onResetSimulator}
            className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-950/90 hover:bg-rose-900 border border-rose-500/70 hover:border-rose-400 rounded-full text-[9px] font-mono font-black text-rose-200 uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Reset active simulator parameters & state back to defaults"
          >
            <RotateCcw className="w-2.5 h-2.5 text-rose-400 stroke-[3]" />
            <span>Reset</span>
          </button>

          {/* Domain Filter Indicator Badge */}
          {userConfig && (
            <span className={cn(
              "hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-colors",
              userConfig.environment === 'residential' 
                ? "bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-sm" 
                : "bg-orange-950/80 text-orange-400 border-orange-500/50 shadow-sm"
            )}
            onClick={onReconfigure}
            title="Click to switch Domain (Residential vs Industrial)"
            >
              {userConfig.environment === 'residential' ? (
                <><Home className="w-2.5 h-2.5 text-amber-400" /> RESIDENTIAL</>
              ) : (
                <><Factory className="w-2.5 h-2.5 text-orange-400" /> INDUSTRIAL</>
              )}
            </span>
          )}

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
              {activeIndex}/{visibleModules.length}
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
                {userConfig.profile.replace('_', ' ')}
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
      
      {/* Scrollable Domain-Filtered Module Selector Row with Edge Fade Mask and Snap */}
      <div className="relative px-3 sm:px-4 pb-2">
        <div 
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
            maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          }}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
        >
          {visibleModules.map(m => {
            const isActive = m.id === activeModule;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => handleModuleSelect(m.id)}
                style={{ scrollSnapAlign: 'start' }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border select-none",
                  isActive
                    ? "bg-orange-500 text-slate-950 border-orange-400 shadow-md shadow-orange-500/10"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-slate-950" : "text-orange-400")} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sm:hidden fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[120] p-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-black uppercase text-white tracking-widest">Select Simulator</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[70vh] overflow-y-auto">
                {visibleModules.map(m => {
                  const isActive = m.id === activeModule;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleModuleSelect(m.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                        isActive
                          ? "bg-orange-500/20 border-orange-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", isActive ? "bg-orange-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-400")}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider">{m.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{m.tag}</p>
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-orange-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
