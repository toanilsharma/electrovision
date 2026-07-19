import React, { useState } from 'react';
import { Shield, CheckCircle, Circle, AlertTriangle, Lock } from 'lucide-react';
import { UserConfig } from '@/src/types';

export function LOTOSimulator({ config }: { config?: UserConfig }) {
  const [step, setStep] = useState(0);
  
  const steps = [
    { title: "Preparation", desc: "Identify all energy sources and hazards." },
    { title: "Shutdown", desc: "Turn off the equipment at the control panel." },
    { title: "Isolation", desc: "Isolate the machine from its energy sources." },
    { title: "Lockout/Tagout", desc: "Apply physical locks and tags to isolation points." },
    { title: "Stored Energy", desc: "Release or block any residual or stored energy." },
    { title: "Verification", desc: "Test the equipment to ensure it cannot be started." }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="w-8 h-8 text-orange-500" />
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-white">LOTO Procedure</h2>
          <p className="text-xs font-mono text-slate-400">Lockout/Tagout Interactive Sequence</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {steps.map((s, i) => {
            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <div 
                key={i} 
                className={`flex gap-4 p-4 rounded-xl border ${isActive ? 'bg-orange-500/10 border-orange-500/50' : isCompleted ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-900 border-white/5'} transition-all`}
              >
                <div className="shrink-0 mt-1">
                  {isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-slate-600'}`} />}
                </div>
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isActive ? 'text-orange-400' : isCompleted ? 'text-green-400' : 'text-slate-300'}`}>Step {i + 1}: {s.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-slate-900 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
          {step < steps.length ? (
            <>
              <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center mb-6 relative">
                <Shield className="w-16 h-16 text-slate-500" />
                {step > 2 && <Lock className="w-10 h-10 text-orange-500 absolute -bottom-2 -right-2" />}
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2 text-center">{steps[step].title}</h3>
              <p className="text-sm text-slate-400 text-center mb-8 max-w-xs">{steps[step].desc}</p>
              
              <button 
                onClick={() => setStep(s => s + 1)}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-widest rounded-lg transition-colors"
              >
                Complete Step
              </button>
            </>
          ) : (
            <>
              <div className="w-32 h-32 rounded-full border-4 border-green-500 flex items-center justify-center mb-6 relative">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-green-400 uppercase tracking-wider mb-2 text-center">Equipment Safe</h3>
              <p className="text-sm text-slate-400 text-center mb-8 max-w-xs">All Lockout/Tagout procedures have been successfully verified. The equipment is safe to work on.</p>
              
              <button 
                onClick={() => setStep(0)}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold uppercase tracking-widest rounded-lg transition-colors"
              >
                Reset Sequence
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
