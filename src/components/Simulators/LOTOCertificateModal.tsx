import React, { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, X, Printer, Shield, CheckCircle, Lock, Download, Sparkles } from "lucide-react";

interface LOTOCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  score?: number;
}

export function LOTOCertificateModal({
  isOpen,
  onClose,
  candidateName = "Authorized Electrical Specialist",
  score = 100
}: LOTOCertificateModalProps) {
  const certRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const certSerial = `OSHA-LOTO-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Control Bar */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-black uppercase text-white tracking-wider">
                Official Accredited Safety Certificate
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 transition-all text-xs font-bold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Formal Certificate Body */}
          <div className="p-4 sm:p-6 overflow-y-auto" ref={certRef}>
            <div className="border-4 border-double border-amber-500/80 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-center relative overflow-hidden shadow-2xl">
              {/* Guilloche Corner Accents */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/80" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/80" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/80" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/80" />

              {/* Certificate Header */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow-md">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block mb-1">
                ELECTROLIVE™ INDUSTRIAL SAFETY ACADEMY
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mb-3">
                CERTIFICATE OF COMPETENCY
              </h1>
              <p className="text-xs text-slate-400 font-serif italic mb-4">
                This is to certify that
              </p>

              {/* Candidate Name */}
              <div className="border-b-2 border-amber-500/40 pb-2 mb-4 max-w-md mx-auto">
                <h2 className="text-lg sm:text-xl font-black text-amber-300 font-serif tracking-wide">
                  {candidateName}
                </h2>
              </div>

              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed mb-6 font-medium">
                has demonstrated complete mastery in the control of hazardous energy, positive mechanical & electrical isolation, and verified zero-energy protocols in full compliance with:
              </p>

              {/* Regulatory Accreditations */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-slate-200">
                  OSHA 29 CFR 1910.147
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-slate-200">
                  NFPA 70E Article 120
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-slate-200">
                  ISO 14118 / EN 1037
                </span>
              </div>

              {/* Verification & Serial Footprint */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[9px] font-mono text-slate-400">
                <div className="text-left">
                  <span className="block text-slate-500">Date Issued</span>
                  <span className="text-white font-bold">{currentDate}</span>
                </div>

                <div className="text-center">
                  <span className="block text-slate-500">Exam Mastery Score</span>
                  <span className="text-emerald-400 font-black text-xs">{score}% VERIFIED</span>
                </div>

                <div className="text-right">
                  <span className="block text-slate-500">Cryptographic Serial</span>
                  <span className="text-amber-400 font-bold">{certSerial}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
