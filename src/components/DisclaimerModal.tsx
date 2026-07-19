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
          <AlertTriangle className="w-8 h-8 text-orange-500" />
          <h2 className="text-lg font-black tracking-[0.2em] uppercase text-white">IMPORTANT DISCLAIMER</h2>
        </div>
        
        <div className="p-6 space-y-4 text-sm leading-relaxed text-slate-300">
          <p className="font-bold text-white tracking-wide">
            This simulator is intended solely for educational and training purposes.
          </p>
          <p className="text-xs opacity-80 leading-loose">
            The effects shown are visual educational approximations based on publicly available electrical safety principles, IEC, IEEE, OSHA, NFPA and other international guidance.
          </p>
          <p className="text-xs opacity-80 leading-loose">
            Actual electrical incidents depend upon many factors including body resistance, contact area, duration, voltage, current path, environment, moisture, health condition, and protective devices.
          </p>
          <div className="p-4 rounded-lg bg-orange-500/10 text-orange-200 border border-orange-500/30">
            <strong className="text-orange-500 font-black tracking-widest text-xs uppercase">⚠️ WARNING:</strong>
            <p className="mt-2 text-[10px] uppercase tracking-wider leading-relaxed">The simulator must never be used for engineering design, medical diagnosis, legal decisions or risk assessment. DesignCalculators.co.in does not guarantee absolute accuracy of results. Never attempt to recreate any simulated scenario in real life.</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-slate-900/80 border-white/10 backdrop-blur-md">
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
      </motion.div>
    </div>
  );
}
