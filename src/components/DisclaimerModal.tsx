import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldCheck, Shield, BookOpen, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DisclaimerProps {
  onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-2 sm:p-4 pb-14 bg-[#020617]/95 backdrop-blur-xl overflow-y-auto">
      <div className="w-full flex-1 flex items-center justify-center my-auto py-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-full sm:max-w-xl lg:max-w-4xl xl:max-w-5xl overflow-hidden bg-slate-900 border shadow-[0_0_50px_rgba(249,115,22,0.25)] border-orange-500/40 rounded-2xl flex flex-col max-h-[calc(100dvh-4.5rem)]"
        >
          {/* Top Commercial Tool Header */}
          <div className="px-3 py-3 sm:px-6 sm:py-4 border-b bg-gradient-to-r from-slate-900 via-slate-900/90 to-orange-950/40 border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    Enterprise Platform
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400">Pro Version</span>
                </div>
                <h2 className="text-sm sm:text-lg md:text-xl font-black tracking-wide text-white uppercase mt-0.5 sm:mt-1">
                  ElectroLive • Safety Simulator
                </h2>
              </div>
            </div>
          </div>

          {/* Step-wise Educational & Risk Disclaimer Cards */}
          <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Card 1: Educational Scope */}
              <div className="p-3.5 sm:p-5 rounded-xl bg-slate-950/80 border border-white/15 hover:border-slate-700 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sky-400">
                    <BookOpen className="w-5 h-5 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-100">
                      Training & Awareness
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-normal sm:leading-relaxed font-medium">
                    Visualizes electrical hazards safely without real danger. Physics models align strictly with <strong className="text-white">OSHA, NFPA 70E, IEEE 1584, & IEC</strong> standards.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 text-xs text-sky-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Educational visualization
                </div>
              </div>

              {/* Card 2: Risk Factors */}
              <div className="p-3.5 sm:p-5 rounded-xl bg-slate-950/80 border border-white/15 hover:border-slate-700 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-amber-400">
                    <Activity className="w-5 h-5 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-100">
                      Variable Real-World Risk
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-normal sm:leading-relaxed font-medium">
                    Actual shock and arc flash severity depends on body resistance, contact surface, current path, duration, system voltage, and rated PPE insulation.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 text-xs text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Dynamic hazard variables
                </div>
              </div>

              {/* Card 3: Usage Limitations */}
              <div className="p-3.5 sm:p-5 rounded-xl bg-slate-950/80 border border-white/15 hover:border-slate-700 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-orange-400">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-100">
                      Important Usage Notice
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-normal sm:leading-relaxed font-medium">
                    Not for engineering design signoff, medical diagnosis, or legal compliance. Never attempt physical recreation of electrical hazards.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 text-xs text-orange-400 font-bold">
                  <ShieldCheck className="w-4 h-4 shrink-0" /> Professional safety terms
                </div>
              </div>
            </div>
          </div>

          {/* Pinned Acknowledgement & Launch Section at Bottom of Modal */}
          <div className="p-3 sm:p-5 bg-slate-950 border-t border-orange-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0 shadow-inner">
            <button
              type="button"
              onClick={() => setAccepted(!accepted)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none w-full sm:w-auto flex-1 text-left ${
                accepted 
                  ? 'bg-orange-500/20 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.25)]' 
                  : 'bg-slate-900 border-orange-500/60 hover:border-orange-400 hover:bg-slate-850 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                accepted 
                  ? 'bg-orange-500 border-orange-500 text-slate-950 scale-110 shadow-[0_0_12px_rgba(249,115,22,0.6)]' 
                  : 'bg-slate-950 border-orange-400 text-orange-400'
              }`}>
                {accepted ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[3]" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-sm bg-orange-500/50" />
                )}
              </div>
              <span className={`text-xs sm:text-sm font-bold transition-colors leading-tight ${
                accepted ? 'text-orange-300' : 'text-slate-100'
              }`}>
                I have read & agree to the educational safety terms
              </span>
            </button>

            <button
              type="button"
              disabled={!accepted}
              onClick={onAccept}
              className={`w-full sm:w-auto min-h-[48px] px-8 py-3.5 font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shrink-0 ${
                accepted
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:from-orange-400 hover:to-amber-400 shadow-[0_0_35px_rgba(249,115,22,0.6)] active:scale-[0.97] cursor-pointer ring-2 ring-orange-400/50'
                  : 'bg-slate-800 text-slate-400 border border-white/10 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Enter Simulator</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Persistent Bottom Footer Attribution */}
      <div className="fixed bottom-0 left-0 right-0 p-2 bg-slate-950/98 border-t border-slate-800 text-center text-[10px] sm:text-[10px] text-white font-black uppercase tracking-widest z-50 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 pointer-events-auto">
        <span>Concept, Visualisation & Engineering: Anil Sharma</span>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <a href="https://designcalculators.co.in" target="_blank" rel="noopener noreferrer" className="text-orange-400 font-bold hover:underline">designcalculators.co.in</a>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <a href="https://reliabilitytools.co.in" target="_blank" rel="noopener noreferrer" className="text-sky-400 font-bold hover:underline">reliabilitytools.co.in</a>
      </div>
    </div>
  );
}
