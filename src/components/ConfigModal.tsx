import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserConfig, Environment, DigitalTwinProfile } from '../types';
import { cn } from '../lib/utils';
import { Home, Factory, User, Users, HardHat, ShieldCheck, X } from 'lucide-react';

interface ConfigModalProps {
  currentConfig: UserConfig;
  onClose: () => void;
  onSave: (config: UserConfig) => void;
}

export function ConfigModal({ currentConfig, onClose, onSave }: ConfigModalProps) {
  const [environment, setEnvironment] = useState<Environment>(currentConfig.environment);
  const [profile, setProfile] = useState<DigitalTwinProfile>(currentConfig.profile);
  
  // ensure valid profile if environment changes
  const handleEnvChange = (env: Environment) => {
    setEnvironment(env);
    if (env === 'residential' && ['electrician', 'engineer', 'technician', 'supervisor'].includes(profile)) {
      setProfile('adult_male');
    }
    if (env === 'industrial' && ['adult_male', 'adult_female', 'teenager', 'child'].includes(profile)) {
      setProfile('electrician');
    }
  };

  const handleSave = () => {
    onSave({ ...currentConfig, environment, profile });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-black tracking-widest uppercase text-slate-100">Configure Simulation Params</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 md:p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Environment */}
          <div className="space-y-3">
             <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">1. Environment</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <button
                 onClick={() => handleEnvChange('residential')}
                 className={cn(
                   "p-3 md:p-4 rounded-xl border transition-all flex flex-col gap-2 items-center text-center",
                   environment === 'residential' ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                 )}
               >
                 <Home className={cn("w-6 h-6", environment === 'residential' ? "text-orange-500" : "text-slate-400")} />
                 <div>
                   <div className={cn("text-xs font-bold uppercase tracking-widest", environment === 'residential' ? "text-orange-400" : "text-slate-300")}>Residential</div>
                 </div>
               </button>
               <button
                 onClick={() => handleEnvChange('industrial')}
                 className={cn(
                   "p-3 md:p-4 rounded-xl border transition-all flex flex-col gap-2 items-center text-center",
                   environment === 'industrial' ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                 )}
               >
                 <Factory className={cn("w-6 h-6", environment === 'industrial' ? "text-orange-500" : "text-slate-400")} />
                 <div>
                   <div className={cn("text-xs font-bold uppercase tracking-widest", environment === 'industrial' ? "text-orange-400" : "text-slate-300")}>Industrial</div>
                 </div>
               </button>
             </div>
          </div>
          
          {/* Profile */}
          <div className="space-y-3">
             <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">2. Digital Twin Profile</label>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
               {environment === 'residential' ? (
                 <>
                   <ProfileBtn id="adult_male" current={profile} set={setProfile} icon={User} label="Adult Male" />
                   <ProfileBtn id="adult_female" current={profile} set={setProfile} icon={Users} label="Adult Female" />
                   <ProfileBtn id="teenager" current={profile} set={setProfile} icon={User} label="Teenager" />
                   <ProfileBtn id="child" current={profile} set={setProfile} icon={Users} label="Child" />
                 </>
               ) : (
                 <>
                   <ProfileBtn id="electrician" current={profile} set={setProfile} icon={HardHat} label="Electrician" />
                   <ProfileBtn id="engineer" current={profile} set={setProfile} icon={ShieldCheck} label="Engineer" />
                   <ProfileBtn id="technician" current={profile} set={setProfile} icon={HardHat} label="Technician" />
                   <ProfileBtn id="supervisor" current={profile} set={setProfile} icon={ShieldCheck} label="Supervisor" />
                 </>
               )}
             </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs tracking-widest uppercase rounded-lg transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95"
          >
            Apply Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileBtn({ id, current, set, icon: Icon, label }: any) {
  const active = current === id;
  return (
    <button
       onClick={() => set(id)}
       className={cn(
         "p-2 md:p-3 rounded-lg border transition-all flex flex-col gap-1 items-center text-center",
         active ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
       )}
     >
       <Icon className={cn("w-5 h-5", active ? "text-orange-500" : "text-slate-400")} />
       <div className={cn("text-[9px] md:text-[10px] font-bold uppercase tracking-widest", active ? "text-orange-400" : "text-slate-300")}>{label}</div>
     </button>
  )
}
