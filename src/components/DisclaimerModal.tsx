import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface DisclaimerProps {
  onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl overflow-hidden bg-slate-900 border shadow-[0_0_40px_rgba(249,115,22,0.15)] border-white/10 rounded-2xl"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-orange-500/10 border-white/10 backdrop-blur-md">
          <AlertTriangle className="w-8 h-8 text-orange-500 shrink-0" />
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-widest uppercase text-white leading-tight">
              WELCOME TO ELECTROLIVE - ELECTRICAL SAFETY SIMULATOR
            </h2>
            <p className="text-xs font-bold text-orange-400 mt-0.5">
              Built to help people feel and understand the hazard without facing it. For training and awareness purposes.
            </p>
          </div>
        </div>
        
        <div className="p-6 space-y-4 text-sm leading-relaxed text-slate-300">
          <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/60 text-amber-300 shadow-md">
            <strong className="text-amber-400 font-black tracking-widest text-xs uppercase block mb-1">
              ⚠️ CRITICAL HAZARD FACTOR NOTICE:
            </strong>
            <p className="text-sm sm:text-base font-black tracking-wide leading-relaxed text-amber-300">
              Actual electrical incidents depend upon many factors including body resistance, contact area, duration, voltage, current path, environment, moisture, health condition, and protective devices.
            </p>
          </div>

          <p className="text-xs opacity-80 leading-loose">
            The effects shown are visual educational approximations based on publicly available electrical safety principles, IEC, IEEE, OSHA, NFPA and other international guidance.
          </p>

          <div className="p-4 rounded-lg bg-orange-500/10 text-orange-200 border border-orange-500/30">
            <strong className="text-orange-500 font-black tracking-widest text-xs uppercase">⚠️ WARNING:</strong>
            <p className="mt-1.5 text-[11px] uppercase tracking-wider leading-relaxed">The simulator must never be used for engineering design, medical diagnosis, legal decisions or risk assessment. DesignCalculators.co.in does not guarantee absolute accuracy of results. Never attempt to recreate any simulated scenario in real life.</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 sm:p-6 border-t bg-slate-900/80 border-white/10 backdrop-blur-md">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center w-6 h-6 border rounded border-white/20 bg-white/5 group-hover:border-orange-500 transition-colors">
              <input
                type="checkbox"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              {accepted && <ShieldCheck className="w-4 h-4 text-orange-500" />}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest select-none text-slate-400 group-hover:text-white transition-colors">
              I have read and understood this warning
            </span>
          </label>

          <button
            disabled={!accepted}
            onClick={onAccept}
            className={`px-6 py-3 font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-2 ${
              accepted
                ? 'bg-orange-500 text-slate-900 hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-105'
                : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
            }`}
          >
            Enter Simulator
          </button>
        </div>

        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-white font-black uppercase tracking-wider flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>Concept, Visualisation & Engineering: Anil Sharma</span>
          <span className="text-slate-600">|</span>
          <a href="https://designcalculators.co.in" target="_blank" rel="noopener noreferrer" className="text-orange-400 font-bold hover:underline">designcalculators.co.in</a>
          <span className="text-slate-600">|</span>
          <a href="https://reliabilitytools.co.in" target="_blank" rel="noopener noreferrer" className="text-sky-400 font-bold hover:underline">reliabilitytools.co.in</a>
        </div>
      </motion.div>
    </div>
  );
}
