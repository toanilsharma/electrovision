import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, AlertTriangle, CheckCircle, Printer, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface IncidentReport {
  hazardType: string;
  severity: string;
  intensity: number; // 0-1
  currentMA?: number;
  energyCal?: number;
  ppeWorn: boolean;
  fatal: boolean;
  description: string;
  preventativeMeasures: string[];
}

export function AfterActionReportModal({ report, onClose }: { report: IncidentReport; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#020617] border-2 border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className={cn("p-4 border-b flex justify-between items-center", report.fatal ? "bg-red-950/50 border-red-900" : "bg-orange-950/50 border-orange-900")}>
          <div className="flex items-center gap-3">
            {report.fatal ? <ShieldAlert className="text-red-500 w-6 h-6" /> : <AlertTriangle className="text-orange-500 w-6 h-6" />}
            <div>
              <h2 className={cn("text-sm font-black tracking-widest uppercase", report.fatal ? "text-red-500" : "text-orange-500")}>
                After-Action Report (AAR)
              </h2>
              <p className="text-[10px] font-mono text-slate-400">Incident Analysis & Physiological Autopsy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-slate-300" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-slate-300" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-4 text-slate-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-slate-900 p-3 rounded-lg border border-white/5">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">Hazard Type</span>
              <span className="text-xs font-bold text-white">{report.hazardType}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-white/5">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">Severity</span>
              <span className={cn("text-xs font-bold uppercase", report.fatal ? "text-red-500" : "text-orange-500")}>{report.severity}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-white/5">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">Outcome</span>
              <span className={cn("text-xs font-bold uppercase", report.fatal ? "text-red-500" : "text-yellow-500")}>{report.fatal ? 'FATAL / CRITICAL' : 'INJURY'}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-white/5">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">PPE Compliance</span>
              <span className={cn("text-xs font-bold uppercase", report.ppeWorn ? "text-green-500" : "text-red-500")}>{report.ppeWorn ? 'COMPLIANT' : 'VIOLATION'}</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
            <h3 className="text-[10px] font-black tracking-widest uppercase text-sky-400 mb-2">Physiological Impact</h3>
            <p className="text-sm leading-relaxed">{report.description}</p>
          </div>

          <div className="bg-green-950/20 border border-green-900/50 rounded-xl p-4">
            <h3 className="text-[10px] font-black tracking-widest uppercase text-green-500 mb-2">IEC / NFPA Preventative Measures</h3>
            <ul className="space-y-2">
              {report.preventativeMeasures.map((pm, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{pm}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
