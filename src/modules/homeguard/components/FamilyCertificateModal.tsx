/**
 * FamilyCertificateModal.tsx
 * 
 * Usability Audit Item 20: Printable / Downloadable "Family Safety Inspector Certificate"
 * & "Refrigerator Magnet Household Checklist".
 * Personalizable, celebratory, and printable for home display.
 */

import React, { useState } from 'react';
import {
  Award,
  Printer,
  CheckCircle2,
  X,
  ShieldCheck,
  Calendar,
  Sparkles,
  CheckSquare
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface FamilyCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalScore: number;
}

export const FamilyCertificateModal: React.FC<FamilyCertificateModalProps> = ({
  isOpen,
  onClose,
  totalScore
}) => {
  const [recipientName, setRecipientName] = useState<string>('The Safety-Smart Family');
  const [activeTab, setActiveTab] = useState<'certificate' | 'checklist'>('certificate');

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Top Header */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Family Safety Certificate & Fridge Magnet Checklist</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Official completion badge & printable household safety checklist
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Name Input */}
        <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className={cn(
                "px-3 py-1 rounded-lg font-bold transition-all cursor-pointer",
                activeTab === 'certificate'
                  ? "bg-amber-500 text-slate-950 shadow font-black"
                  : "text-slate-400 hover:text-white"
              )}
            >
              🎓 Safety Certificate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={cn(
                "px-3 py-1 rounded-lg font-bold transition-all cursor-pointer",
                activeTab === 'checklist'
                  ? "bg-amber-500 text-slate-950 shadow font-black"
                  : "text-slate-400 hover:text-white"
              )}
            >
              📋 Fridge Magnet Checklist
            </button>
          </div>

          {activeTab === 'certificate' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Issued To:</span>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter Student or Family Name"
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* TAB 1: CERTIFICATE */}
        {activeTab === 'certificate' && (
          <div className="p-4 sm:p-8 flex-1 overflow-y-auto flex items-center justify-center bg-slate-900/40 print:p-6 print:bg-white">
            <div className="w-full max-w-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-4 border-amber-500/60 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center flex flex-col items-center print:border-4 print:border-amber-600 print:bg-white print:text-black">
              
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

              {/* Seal Badge */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg mb-3">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div className="text-[11px] font-mono tracking-[0.25em] text-amber-400 uppercase font-black print:text-amber-800">
                ElectroLive™ Safety Academy
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white font-serif tracking-wide uppercase mt-1 print:text-black">
                Certificate of Electrical Safety Mastery
              </h1>

              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-3" />

              <p className="text-xs text-slate-400 font-sans print:text-gray-600">
                This certifies that
              </p>

              <div className="text-lg sm:text-2xl font-black text-amber-300 font-serif tracking-wider py-1.5 border-b border-amber-500/40 min-w-[240px] mt-1 print:text-black print:border-black">
                {recipientName || 'The Safety-Smart Family'}
              </div>

              <p className="text-xs text-slate-300 font-sans max-w-lg mt-3 leading-relaxed print:text-gray-700">
                Has successfully navigated the <strong>HomeGuard™ 230V Residential Simulator</strong>, demonstrating practical competence in <strong>MCB thermal overload limits, 30mA RCCB touch protection, the 3-month Test ('T') button habit</strong>, and life-saving shock rescue protocols.
              </p>

              <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono print:border-gray-300">
                <div className="text-left space-y-0.5">
                  <span className="text-slate-500 block print:text-gray-500">Date Awarded</span>
                  <strong className="text-slate-200 print:text-black">{currentDate}</strong>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-slate-500 block print:text-gray-500">Safety Score Achieved</span>
                  <strong className="text-emerald-400 font-bold print:text-emerald-700">{totalScore} / 500 PTS</strong>
                </div>
              </div>

              <div className="mt-4 text-[9px] font-mono text-slate-500 print:text-gray-500">
                Standard: IEC 60364-4-41 • Certified Residential Safety Literacy
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: REFRIGERATOR MAGNET CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="p-4 sm:p-8 flex-1 overflow-y-auto flex items-center justify-center bg-slate-900/40 print:p-6 print:bg-white">
            <div className="w-full max-w-xl bg-slate-950 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left print:border-2 print:border-black print:bg-white print:text-black">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:border-black">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    🧲
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider print:text-black">
                      Home Electrical Safety Magnet Checklist
                    </h3>
                    <span className="text-[10px] text-slate-400 font-sans print:text-gray-600">
                      Stick on your Refrigerator or DB Box Door
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 print:border-black print:text-black">
                  5 GOLDEN RULES
                </span>
              </div>

              <ul className="mt-4 space-y-3 text-xs font-sans text-slate-200 print:text-black">
                <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                  <div className="w-5 h-5 rounded border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-white block print:text-black">1. The 1st of the Month 'T' Test:</strong>
                    <span className="text-slate-300 print:text-gray-700">Every 3 months, push the small round 'T' button on the RCCB. It must snap down with a loud CLACK to prove internal springs aren't stuck!</span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                  <div className="w-5 h-5 rounded border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-white block print:text-black">2. No Heavy Eaters on Multi-Plugs:</strong>
                    <span className="text-slate-300 print:text-gray-700">Never plug two 2,000W appliances (Room Heater + Electric Kettle) into the same socket strip. Max safe capacity is 3,500W!</span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                  <div className="w-5 h-5 rounded border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-white block print:text-black">3. Unplug Before Pushing Breaker Up:</strong>
                    <span className="text-slate-300 print:text-gray-700">If a breaker trips, ALWAYS unplug the heater or kettle FIRST before flipping the lever back UP at the DB box.</span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                  <div className="w-5 h-5 rounded border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-white block print:text-black">4. 100% Dry Hands & Footwear:</strong>
                    <span className="text-slate-300 print:text-gray-700">Wet skin drops body resistance from 2,000 Ohms to 500 Ohms, stripping your skin armor. Never plug switches with wet hands!</span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                  <div className="w-5 h-5 rounded border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-white block print:text-black">5. Shock Rescue Rule: Never Touch Directly:</strong>
                    <span className="text-slate-300 print:text-gray-700">If someone is in shock, flip the DB main switch OFF or push them with a dry wooden stick or plastic broom. Never grab with bare hands!</span>
                  </div>
                </li>
              </ul>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500 print:border-black print:text-gray-600">
                <span>Emergency Numbers: 112 / 911</span>
                <span>HomeGuard™ Safety Habit Guide</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
