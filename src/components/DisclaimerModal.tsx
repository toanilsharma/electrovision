import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldCheck, Shield, BookOpen, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DisclaimerProps {
  onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pb-14 bg-[#020617]/85 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md lg:max-w-4xl xl:max-w-5xl overflow-hidden bg-slate-900 border shadow-[0_0_50px_rgba(249,115,22,0.12)] border-white/10 rounded-2xl flex flex-col my-auto"
      >
        {/* Top Commercial Tool Header */}
        <div className="px-6 py-5 border-b bg-gradient-to-r from-slate-900 via-slate-900/90 to-orange-950/30 border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                  Enterprise Platform
                </span>
                <span className="text-[10px] font-bold text-slate-400">Pro Version</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide text-white uppercase mt-1">
                ElectroLive • Electrical Safety Simulator
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed sm:text-right">
            Interactive hazard analysis & virtual simulation environment.
          </p>
        </div>

        {/* Commercial Grid / Disclaimer Cards */}
        <div className="p-5 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: Educational Scope */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-slate-700 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3 text-sky-400">
                  <BookOpen className="w-5 h-5 shrink-0" />
                  <h3 className="text-xs font-black tracking-wider uppercase text-slate-200">
                    Training & Awareness
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Engineered to visualize electrical hazards safely without real-world danger. Theoretical models align with international guidelines including <strong className="text-slate-300">OSHA, NFPA 70E, IEEE 1584, and IEC</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-sky-400/90 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Educational visualization
              </div>
            </div>

            {/* Card 2: Risk Factors */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-slate-700 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3 text-amber-400">
                  <Activity className="w-5 h-5 shrink-0" />
                  <h3 className="text-xs font-black tracking-wider uppercase text-slate-200">
                    Variable Real-World Risk
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Actual shock and arc flash severity depends on body resistance, contact surface, current path, contact duration, voltage levels, and protective equipment.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-amber-400/90 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Dynamic hazard variables
              </div>
            </div>

            {/* Card 3: Usage Limitations */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-slate-700 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3 text-orange-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="text-xs font-black tracking-wider uppercase text-slate-200">
                    Important Usage Notice
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Not intended for engineering calculations, medical diagnosis, or legal compliance. Never attempt to recreate simulated electrical hazards in real life.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-orange-400/90 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Professional safety terms
              </div>
            </div>
          </div>

          {/* Acknowledgement & Launch Section */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                accepted 
                  ? 'bg-orange-500 border-orange-500 text-slate-950' 
                  : 'bg-slate-900 border-white/20 group-hover:border-orange-500/60'
              }`}>
                {accepted && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                I have read and agree to the educational safety disclaimers
              </span>
            </label>

            <button
              disabled={!accepted}
              onClick={onAccept}
              className={`w-full sm:w-auto px-6 py-3 font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shrink-0 ${
                accepted
                  ? 'bg-orange-500 text-slate-950 hover:bg-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                  : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
              }`}
            >
              <span>Enter Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Persistent Bottom Footer Attribution (Screen Pinned, Identical to Module Selection Page) */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-slate-950/90 border-t border-slate-800 text-center text-[10px] text-white font-black uppercase tracking-widest z-20 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>Concept, Visualisation & Engineering: Anil Sharma</span>
        <span className="text-slate-600">|</span>
        <a href="https://designcalculators.co.in" target="_blank" rel="noopener noreferrer" className="text-orange-400 font-bold hover:underline">designcalculators.co.in</a>
        <span className="text-slate-600">|</span>
        <a href="https://reliabilitytools.co.in" target="_blank" rel="noopener noreferrer" className="text-sky-400 font-bold hover:underline">reliabilitytools.co.in</a>
      </div>
    </div>
  );
}
