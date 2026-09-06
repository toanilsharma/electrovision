import React, { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, X, Printer, ShieldCheck, CheckCircle2, Lock, AlertTriangle, Building, User, Calendar } from "lucide-react";

interface LOTOPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  completedStepsCount: number;
}

export function LOTOPermitModal({
  isOpen,
  onClose,
  candidateName = "Authorized Electrical Specialist",
  completedStepsCount
}: LOTOPermitModalProps) {
  const permitRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toISOString().split("T")[0];
  const permitId = "PTW-LOTO-2026-8842";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Modal Navigation Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-black uppercase text-orange-400 tracking-widest block">
                  OSHA 29 CFR 1910.147 · FORMAL DOCUMENT
                </span>
                <h3 className="text-sm font-black uppercase text-white tracking-wide">
                  Hazardous Energy Control Permit-to-Work (PTW)
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-xs font-bold cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline">Print / Save PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Document Content Container */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-200" ref={permitRef}>
            {/* Formal PTW Header Certificate Box */}
            <div className="border-2 border-orange-500/60 rounded-xl p-4 bg-slate-950/80 relative overflow-hidden">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono text-[9px] font-black uppercase">
                      ACTIVE PERMIT
                    </span>
                    <span className="text-xs font-mono font-black text-orange-400">{permitId}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-white">
                    ELECTROLIVE™ CERTIFIED LOTO ISOLATION PERMIT
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono">
                    NFPA 70E Standard for Electrical Safety in the Workplace · ISO 14118
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>

              {/* Document Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono mb-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[8.5px] uppercase">Equipment Name</span>
                  <span className="font-bold text-white">MCC Unit #4 (480V)</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[8.5px] uppercase">Authorized Tech</span>
                  <span className="font-bold text-white truncate block">{candidateName}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[8.5px] uppercase">Issue Date</span>
                  <span className="font-bold text-white">{currentDate}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[8.5px] uppercase">LOTO Status</span>
                  <span className="font-bold text-emerald-400">
                    {completedStepsCount === 6 ? "VERIFIED DE-ENERGIZED" : `${completedStepsCount}/6 IN PROGRESS`}
                  </span>
                </div>
              </div>

              {/* Isolation Points Log Table */}
              <div className="rounded-lg border border-slate-800 overflow-hidden mb-3">
                <table className="w-full text-left text-[10px] font-mono">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[8.5px] border-b border-slate-800">
                    <tr>
                      <th className="p-2">Point ID</th>
                      <th className="p-2">Energy Type</th>
                      <th className="p-2">Isolating Device</th>
                      <th className="p-2">Lock / Tag #</th>
                      <th className="p-2 text-right">Zero-Energy State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    <tr>
                      <td className="p-2 font-bold text-white">ISO-E-01</td>
                      <td className="p-2 text-amber-400">480V Electrical</td>
                      <td className="p-2 text-slate-300">400A Knife Switch</td>
                      <td className="p-2 text-slate-300">ML-410-RED (0482)</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">0.00 V AC ✓</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-white">ISO-P-02</td>
                      <td className="p-2 text-cyan-400">120 PSI Pneumatic</td>
                      <td className="p-2 text-slate-300">Main Ball Valve 90°</td>
                      <td className="p-2 text-slate-300">TAG #DANGER-992</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">0.0 PSI BLED ✓</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-white">ISO-DC-03</td>
                      <td className="p-2 text-violet-400">Stored Capacitance</td>
                      <td className="p-2 text-slate-300">VFD Bleeder Resistor</td>
                      <td className="p-2 text-slate-300">Grounding Wand Clamped</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">0.0 V DC SAFE ✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sign-off & Legal Compliance Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px]">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Authorized Lead Sign-off</span>
                    <span className="text-[9px] text-slate-400 font-mono">Digitally Approved by {candidateName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <Lock className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">OSHA 1910.147 Verified</span>
                    <span className="text-[9px] text-slate-400 font-mono">Test-Before-Touch live dead live logged</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Strip */}
          <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono text-slate-400">
              Permit Validity: Shift Duration (8 Hours Max)
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
