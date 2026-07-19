import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const scenarios = [
  { id: 1, title: 'Medium Voltage Switchgear Maintenance', desc: 'You are tasked with racking out an 11kV vacuum circuit breaker. The enclosure has an arc flash boundary of 1.2m and an incident energy of 12.5 cal/cm² at working distance.', ppeNeeded: ['Arc Suit (min 25 cal)', 'Voltage Rated Gloves (Class 2)', 'Safety Glasses'] },
  { id: 2, title: 'Low Voltage Motor Troubleshooting', desc: 'A 415V 3-phase motor is tripping. You need to measure current while it is running. The floor is slightly damp.', ppeNeeded: ['Voltage Rated Gloves (Class 0)', 'Dielectric Boots', 'Safety Glasses'] },
  { id: 3, title: 'Overhead Line Inspection', desc: 'Inspecting a 33kV overhead line after a storm. A conductor has fallen to the ground but may still be energized. You are 5 meters away.', ppeNeeded: ['Maintain Safe Clearance (>10m)', 'Dielectric Boots'] },
];

const ppeOptions = [
  'Voltage Rated Gloves (Class 00)',
  'Voltage Rated Gloves (Class 0)',
  'Voltage Rated Gloves (Class 2)',
  'Dielectric Boots',
  'Safety Glasses',
  'Arc Face Shield (12 cal)',
  'Arc Suit (min 25 cal)',
  'Maintain Safe Clearance (>10m)'
];

export function AssessmentModule() {
  const [activeScenario, setActiveScenario] = useState(0);
  const [selectedPPE, setSelectedPPE] = useState<string[]>([]);
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);

  const scenario = scenarios[activeScenario];

  const togglePPE = (ppe: string) => {
    setSelectedPPE(prev => prev.includes(ppe) ? prev.filter(p => p !== ppe) : [...prev, ppe]);
  };

  const evaluate = () => {
    // Check if all needed PPE is selected, and no critical wrong PPE
    const hasAllNeeded = scenario.ppeNeeded.every(p => selectedPPE.includes(p));
    setResult(hasAllNeeded ? 'pass' : 'fail');
  };

  const nextScenario = () => {
    setActiveScenario((prev) => (prev + 1) % scenarios.length);
    setSelectedPPE([]);
    setResult(null);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 p-4 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-orange-500" />
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Gamified Safety Assessment</h2>
          <p className="text-slate-400 text-sm">Test your knowledge against real-world scenarios.</p>
        </div>
      </div>

      <div className="bg-slate-900 border-2 border-slate-700 p-6 rounded-2xl mb-6 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <span className="bg-orange-500 text-slate-900 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest">Scenario {activeScenario + 1}</span>
          <button onClick={nextScenario} className="text-slate-400 hover:text-white flex items-center gap-2 text-xs uppercase font-bold"><RefreshCw className="w-3 h-3" /> Skip</button>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{scenario.title}</h3>
        <p className="text-slate-300 leading-relaxed">{scenario.desc}</p>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Select Required Mitigations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ppeOptions.map((ppe) => (
            <button
              key={ppe}
              onClick={() => togglePPE(ppe)}
              disabled={result !== null}
              className={cn("p-4 rounded-xl border-2 text-left transition-all", selectedPPE.includes(ppe) ? "border-sky-500 bg-sky-950/30 text-sky-400" : "border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600")}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0", selectedPPE.includes(ppe) ? "border-sky-500 bg-sky-500" : "border-slate-600")}>
                  {selectedPPE.includes(ppe) && <ShieldCheck className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-bold">{ppe}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end mb-8">
        {!result ? (
          <button onClick={evaluate} className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-slate-900 font-black rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all">
            Evaluate Safety Plan
          </button>
        ) : (
          <button onClick={nextScenario} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-xl uppercase tracking-widest transition-all">
            Next Scenario
          </button>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("p-6 rounded-2xl border-2 flex items-start gap-4", result === 'pass' ? "bg-green-950/30 border-green-500" : "bg-red-950/30 border-red-500")}
          >
            {result === 'pass' ? <ShieldCheck className="w-8 h-8 text-green-500 shrink-0" /> : <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />}
            <div>
              <h3 className={cn("text-lg font-black uppercase tracking-widest mb-1", result === 'pass' ? "text-green-500" : "text-red-500")}>
                {result === 'pass' ? 'Safe to Proceed' : 'Lethal Configuration'}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {result === 'pass' 
                  ? 'Your selected mitigations adequately protect against the hazards in this scenario.' 
                  : `Incorrect mitigation. The required minimum PPE was: ${scenario.ppeNeeded.join(', ')}. Entering this environment would result in critical injury or fatality.`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
