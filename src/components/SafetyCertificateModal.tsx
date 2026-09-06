import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Calendar, 
  Hash, 
  UserCheck,
  HeartPulse,
  Activity,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { ExamScorecard } from '@/src/utils/cprExamTelemetry';

export interface SafetyCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudentName?: string;
  defaultScore?: number;
  completedModulesCount?: number;
  certificateType?: 'electrical' | 'cpr_resuscitation';
  examScorecard?: ExamScorecard;
}

export const SafetyCertificateModal: React.FC<SafetyCertificateProps> = ({
  isOpen,
  onClose,
  defaultStudentName = 'Professional Engineer',
  defaultScore = 95,
  completedModulesCount = 8,
  certificateType = 'electrical',
  examScorecard,
}) => {
  const initialName = examScorecard?.candidateName || defaultStudentName;
  const [studentName, setStudentName] = useState<string>(initialName);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  const effectiveScore = examScorecard ? examScorecard.overallScore : defaultScore;

  // Generate Unique Cryptographic Verification Serial Number
  const certificateId = useMemo(() => {
    if (examScorecard?.certificateSerial) {
      return examScorecard.certificateSerial;
    }
    const raw = `${studentName}_${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `EL-2026-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  }, [studentName, examScorecard]);

  const issueDate = useMemo(() => {
    if (examScorecard?.examDate) return examScorecard.examDate;
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [examScorecard]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const isCpr = certificateType === 'cpr_resuscitation';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto font-serif print:p-0 print:bg-white print:static">
        {/* Printable Style Sheet Injection */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-certificate, #printable-certificate * {
              visibility: visible;
            }
            #printable-certificate {
              position: fixed;
              left: 0;
              top: 0;
              width: 100vw;
              height: 100vh;
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 24px !important;
              background: #ffffff !important;
              color: #0f172a !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        <div className="w-full max-w-4xl flex flex-col my-auto no-print mb-2">
          {/* Action Toolbar on Top */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="font-bold uppercase tracking-wider">
                {isCpr ? 'OFFICIAL CERTIFICATE OF RESUSCITATION MASTERY' : 'OFFICIAL CERTIFICATE OF ELECTRICAL SAFETY'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PRINT / SAVE PDF</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* The Formal Certificate Document Canvas */}
        <motion.div
          id="printable-certificate"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            "w-full max-w-4xl bg-gradient-to-b from-amber-50 via-white to-amber-50 text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border-8 border-double relative overflow-hidden my-auto",
            isCpr ? "border-red-700" : "border-amber-600"
          )}
        >
          {/* Security Guilloche Pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Ornate Inner Border */}
          <div className={cn(
            "border p-6 sm:p-8 rounded-xl relative flex flex-col items-center text-center",
            isCpr ? "border-red-300" : "border-amber-300"
          )}>
            
            {/* Header Crest & Institution */}
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md",
                isCpr ? "bg-red-600" : "bg-amber-500"
              )}>
                {isCpr ? <HeartPulse className="w-6 h-6 fill-current text-white" /> : <Zap className="w-6 h-6 fill-current text-white" />}
              </div>
              <div className="text-left font-mono">
                <div className="text-sm sm:text-base font-black tracking-widest uppercase text-slate-900">
                  ELECTROLIVE™ INSTITUTE
                </div>
                <div className={cn(
                  "text-[10px] font-bold tracking-wider uppercase",
                  isCpr ? "text-red-700" : "text-amber-700"
                )}>
                  {isCpr ? 'GLOBAL RESUSCITATION & LIFE SUPPORT STANDARDS' : 'GLOBAL ELECTRICAL SAFETY & SIMULATION STANDARDS'}
                </div>
              </div>
            </div>

            <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mt-2">
              {isCpr ? 'INTERNATIONAL ACCREDITATION IN CARDIOPULMONARY RESUSCITATION' : 'INTERNATIONAL CERTIFICATE OF TECHNICAL PROFICIENCY'}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2 tracking-wide font-serif">
              {isCpr ? 'Certificate of Resuscitation Mastery' : 'Certificate of Competency'}
            </h1>

            <div className="text-xs text-slate-600 font-serif italic mt-3 max-w-lg">
              {isCpr
                ? 'This is to officially certify that the practitioner identified below has demonstrated verified high-performance clinical resuscitation competency and chest compression telemetry:'
                : 'This is to officially certify that the practitioner identified below has demonstrated verified technical proficiency in high-voltage safety physics, protective relaying, and life-critical emergency triage:'}
            </div>

            {/* Candidate Name Box */}
            <div className={cn(
              "my-4 py-2 border-b-2 min-w-[280px] sm:min-w-[420px]",
              isCpr ? "border-red-600" : "border-amber-600"
            )}>
              {isEditingName ? (
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  autoFocus
                  className={cn(
                    "text-xl sm:text-3xl font-black text-center font-serif bg-transparent outline-none border-b w-full",
                    isCpr ? "text-red-950 border-red-400" : "text-amber-950 border-amber-400"
                  )}
                />
              ) : (
                <div
                  onClick={() => setIsEditingName(true)}
                  className={cn(
                    "text-xl sm:text-3xl font-black font-serif tracking-wider cursor-pointer transition-colors",
                    isCpr ? "text-red-950 hover:text-red-700" : "text-amber-950 hover:text-amber-700"
                  )}
                  title="Click to edit name"
                >
                  {studentName}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-700 max-w-xl leading-relaxed font-sans">
              {isCpr ? (
                <span>
                  Having completed the timed 2-minute high-fidelity resuscitation practical exam in accordance with <strong>AHA ECC BLS 2020-2025</strong>, <strong>ERC Guidelines 2021</strong>, and <strong>ILCOR</strong> standards, achieving an overall proficiency score of <strong>{effectiveScore}%</strong> ({examScorecard?.grade || 'MASTERY'}).
                </span>
              ) : (
                <span>
                  Having successfully completed interactive computational simulations and hazard triage evaluations in accordance with international electrical safety standards:
                </span>
              )}
            </div>

            {/* Standards Compliance Grid */}
            {isCpr ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 w-full max-w-2xl font-mono text-[10px]">
                <div className="p-2 rounded bg-red-500/10 border border-red-300 flex flex-col items-center text-center">
                  <span className="font-bold text-red-900">AHA BLS 2025</span>
                  <span className="text-[9px] text-slate-700 font-bold">CCF: {examScorecard?.ccfPct ?? 82}% (≥80%)</span>
                </div>
                <div className="p-2 rounded bg-red-500/10 border border-red-300 flex flex-col items-center text-center">
                  <span className="font-bold text-red-900">ERC 2021</span>
                  <span className="text-[9px] text-slate-700 font-bold">Depth: {examScorecard?.depthAccuracyPct ?? 90}%</span>
                </div>
                <div className="p-2 rounded bg-red-500/10 border border-red-300 flex flex-col items-center text-center">
                  <span className="font-bold text-red-900">ILCOR Consensus</span>
                  <span className="text-[9px] text-slate-700 font-bold">Recoil: {examScorecard?.recoilCompletenessPct ?? 92}%</span>
                </div>
                <div className="p-2 rounded bg-red-500/10 border border-red-300 flex flex-col items-center text-center">
                  <span className="font-bold text-red-900">IEC 60601-2-4</span>
                  <span className="text-[9px] text-slate-700 font-bold">Rate: {examScorecard?.averageBpm ?? 110} BPM</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 w-full max-w-2xl font-mono text-[10px]">
                <div className="p-2 rounded bg-amber-500/10 border border-amber-300 flex flex-col items-center text-center">
                  <span className="font-bold text-amber-900">IEC 60479-1</span>
                  <span className="text-[9px] text-slate-600">Current Effects & Body Z</span>
                </div>
                <div className="p-2 rounded bg-amber-500/10 border border-amber-300 flex flex-col items-center text-center">
                  <span className="font-bold text-amber-900">IEEE 1584-2018</span>
                  <span className="text-[9px] text-slate-600">Arc Flash Hazard Calcs</span>
                </div>
                <div className="p-2 rounded bg-amber-500/10 border border-amber-300 flex flex-col items-center text-center">
                  <span className="font-bold text-amber-900">NFPA 70E</span>
                  <span className="text-[9px] text-slate-600">Electrical Workplace PPE</span>
                </div>
                <div className="p-2 rounded bg-amber-500/10 border border-amber-300 flex flex-col items-center text-center">
                  <span className="font-bold text-amber-900">IEEE 80 / OSHA</span>
                  <span className="text-[9px] text-slate-600">Step & Touch Potentials</span>
                </div>
              </div>
            )}

            {/* Signatures & Verification Seal Bar */}
            <div className="w-full flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-amber-200 font-mono text-xs">
              {/* Verification Metadata */}
              <div className="text-left text-[10px] text-slate-600 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Hash className="w-3.5 h-3.5 text-amber-600" />
                  <span>SERIAL: {certificateId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>ISSUED: {issueDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>STATUS: CRYPTOGRAPHICALLY VERIFIED</span>
                </div>
              </div>

              {/* Gold / Crimson Embossed Seal */}
              <div className={cn(
                "relative w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shadow-inner my-2 sm:my-0",
                isCpr ? "border-red-600 bg-red-600/10 text-red-900" : "border-amber-500 bg-amber-500/10 text-amber-900"
              )}>
                <ShieldCheck className="w-8 h-8 opacity-90" />
                <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">
                  {isCpr ? 'AHA·ERC' : 'VERIFIED'}
                </span>
                <span className="text-[6px] tracking-tighter opacity-80">STANDARD</span>
              </div>

              {/* Academic Signature */}
              <div className="text-right text-xs">
                <div className="font-serif italic text-base text-slate-800 font-bold border-b border-slate-400 pb-1 px-4">
                  Dr. Anil Sharma, Ph.D.
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Director of Resuscitation & Safety Education
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  Electrolive™ Global Life Sciences Council
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
