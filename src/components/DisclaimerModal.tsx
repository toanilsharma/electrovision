import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldCheck, Shield, BookOpen, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DisclaimerProps {
  onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 pb-12 sm:pb-14 bg-[#020617]/85 backdrop-blur-xl overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md lg:max-w-4xl xl:max-w-5xl overflow-hidden bg-slate-900 border shadow-[0_0_50px_rgba(249,115,22,0.12)] border-white/10 rounded-2xl flex flex-col max-h-[calc(100vh-3.5rem)] my-auto"
      >
        {/* Top Commercial Tool Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-5 border-b bg-gradient-to-r from-slate-900 via-slate-900/90 to-orange-950/30 border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                  Enterprise Platform
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">Pro Version</span>
              </div>
              <h2 className="text-base sm:text-xl font-black tracking-wide text-white uppercase mt-0.5 sm:mt-1">
                ElectroLive • Electrical Safety Simulator
              </h2>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 max-w-xs leading-tight sm:leading-relaxed sm:text-right hidden sm:block">
            Interactive hazard analysis & virtual simulation environment.
          </p>
        </div>

        {/* Commercial Grid / Disclaimer Cards */}
        <div className="p-3 sm:p-7 space-y-2.5 sm:space-y-6 overflow-y-auto sm:overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-4">
            {/* Card 1: Educational Scope */}
            <div className="p-3 sm:p-5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-slate-700 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5 sm:mb-3 text-sky-400">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <h3 className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-slate-200">
                    Training & Awareness
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-normal sm:leading-relaxed">
                  Visualizes electrical hazards safely without danger. Models align with <strong className="text-slate-300">OSHA, NFPA 70E, IEEE 1584, & IEC</strong> standards.
                </p>
              </div>
              <div className="mt-2 sm:mt-4 pt-1.5 sm:pt-3 border-t border-white/10 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-sky-400/90 font-medium">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Educational visualization
              </div>
            </div>

            {/* Card 2: Risk Factors */}
            <div className="p-3 sm:p-5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-slate-700 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5 sm:mb-3 text-amber-400">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <h3 className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-slate-200">
                    Variable Real-World Risk
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-normal sm:leading-relaxed">
                  Actual shock and arc flash severity depends on body resistance, contact surface, path, duration, voltage, and PPE.
                </p>
              </div>
              <div className="mt-2 sm:mt-4 pt-1.5 sm:pt-3 border-t border-white/10 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-amber-400/90 font-medium">
                <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Dynamic hazard variables
              </div>
            </div>

            {/* Card 3: Usage Limitations */}
            <div className="p-3 sm:p-5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-slate-700 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5 sm:mb-3 text-orange-400">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <h3 className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-slate-200">
                    Important Usage Notice
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-normal sm:leading-relaxed">
                  Not for engineering design, medical diagnosis, or legal compliance. Never attempt physical recreation of hazards.
                </p>
              </div>
              <div className="mt-2 sm:mt-4 pt-1.5 sm:pt-3 border-t border-white/10 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-orange-400/90 font-medium">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Professional safety terms
              </div>
            </div>
          </div>

          {/* Acknowledgement & Launch Section */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0">
            <label className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none w-full sm:w-auto">
              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
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
              <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white transition-colors leading-tight">
                I have read & agree to the educational safety terms
              </span>
            </label>

            <button
              disabled={!accepted}
              onClick={onAccept}
              className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shrink-0 ${
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

      {/* Persistent Bottom Footer Attribution */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-2.5 bg-slate-950/90 border-t border-slate-800 text-center text-[9px] sm:text-[10px] text-white font-black uppercase tracking-widest z-20 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
        <span>Concept, Visualisation & Engineering: Anil Sharma</span>
        <span className="text-slate-600">|</span>
        <a href="https://designcalculators.co.in" target="_blank" rel="noopener noreferrer" className="text-orange-400 font-bold hover:underline">designcalculators.co.in</a>
        <span className="text-slate-600">|</span>
        <a href="https://reliabilitytools.co.in" target="_blank" rel="noopener noreferrer" className="text-sky-400 font-bold hover:underline">reliabilitytools.co.in</a>
      </div>
    </div>
  );
}
