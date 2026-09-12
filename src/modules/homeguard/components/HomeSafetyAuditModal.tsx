/**
 * Home Safety Audit Modal Component (HG7)
 * 
 * Reusable snapshot & PDF export, per-circuit verdicts, and electrician shopping list
 * featuring exact part strings and shareable URL state.
 */

import React, { useState, useMemo } from 'react';
import {
  generateHomeSafetyAuditSnapshot
} from '../../../core/ui/export/snapshotComposite';
import {
  generateAuditReport,
  BreakerConfigurationMode,
  buildHomeGuardShareableUrl,
  updateHomeGuardUrl
} from '../data/auditReportData';
import { ResidentialScenario } from '../data/residentialProfile';
import {
  FileText,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Copy,
  Check,
  X,
  Zap,
  ShoppingBag,
  Info,
  MessageSquare,
  Send
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface HomeSafetyAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedScenario: ResidentialScenario;
  circuitStates: Record<string, { state: string; currentAmps: number; tripCause?: string; bimetalTempC?: number }>;
  livingCountdownSec?: number;
  leakageCurrentMA?: number;
  breakerMode: BreakerConfigurationMode;
  onChangeBreakerMode?: (mode: BreakerConfigurationMode) => void;
}

export const HomeSafetyAuditModal: React.FC<HomeSafetyAuditModalProps> = ({
  isOpen,
  onClose,
  selectedScenario,
  circuitStates,
  livingCountdownSec,
  leakageCurrentMA,
  breakerMode,
  onChangeBreakerMode
}) => {
  const [activeTab, setActiveTab] = useState<'verdicts' | 'shopping_list'>('verdicts');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const auditReport = useMemo(() => {
    return generateAuditReport(
      selectedScenario,
      breakerMode,
      circuitStates,
      livingCountdownSec,
      leakageCurrentMA
    );
  }, [selectedScenario, breakerMode, circuitStates, livingCountdownSec, leakageCurrentMA]);

  if (!isOpen) return null;

  // Handle Export Canvas Snapshot PNG
  const handleExportPNG = () => {
    generateHomeSafetyAuditSnapshot({
      propertyTitle: 'RESIDENTIAL PROPERTY ELECTRICAL SAFETY AUDIT',
      breakerConfiguration: auditReport.breakerConfigLabel,
      scenarioTitle: selectedScenario.title,
      overallRating: auditReport.overallGrade,
      verdicts: auditReport.verdicts,
      shoppingList: auditReport.shoppingList,
      autoDownload: true,
      filename: `HomeGuard_Safety_Audit_${breakerMode}_${Date.now()}.png`
    });

    setCopyStatus('PNG Snapshot Downloaded!');
    setTimeout(() => setCopyStatus(null), 3000);
  };

  // Handle Print / Save PDF
  const handlePrintPDF = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Handle Copy Shareable Link
  const handleCopyShareLink = () => {
    const shareUrl = buildHomeGuardShareableUrl(selectedScenario.id, breakerMode);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopyStatus('Shareable Link Copied to Clipboard!');
        setTimeout(() => setCopyStatus(null), 3000);
      });
    }
  };

  // Handle Copy Entire Shopping List
  const handleCopyShoppingList = () => {
    const listText = [
      '⚡ HOMEGUARD™ CERTIFIED ELECTRICIAN BILL OF MATERIALS (BOM)',
      `Property: Residential 230V TN-S (Single Phase 50Hz)`,
      `Audit Date: ${auditReport.inspectionDate}`,
      `Inspection Status: ${auditReport.overallGrade}`,
      '-------------------------------------------------------',
      ...auditReport.shoppingList.map(
        (item, i) => `${i + 1}. [${item.quantity}x] ${item.partString}\n   Target: ${item.circuitTarget}\n   Standard: ${item.standard}\n   Notes: ${item.notes || 'N/A'}`
      ),
      '-------------------------------------------------------',
      'Generated via ElectroLive™ HomeGuard Safety Core Engine (IEC 60898-1 / IEC 61008-1 / IEC 61009-1)'
    ].join('\n\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(listText).then(() => {
        setCopyStatus('Electrician BOM Copied to Clipboard!');
        setTimeout(() => setCopyStatus(null), 3000);
      });
    }
  };

  // Usability Audit Item 15: "Send to Electrician on WhatsApp" Formatted Message
  const whatsappMessage = useMemo(() => {
    const needsRCCB = breakerMode === 'mcb_only' || breakerMode === 'velcb' || auditReport.overallGrade.includes('GRADE F');
    return [
      '⚡ *URGENT ELECTRICAL SAFETY UPGRADE REQUEST*',
      'Namaste / Hello Electrician Bhaiya,',
      '',
      'Please inspect and service our home Distribution Board (DB Box) for electrical safety:',
      '',
      needsRCCB 
        ? '🔴 *CRITICAL PRIORITY: Install 30mA RCCB (Residual Current Breaker)*\n   - Rating: 40A, 30mA Type A (2-Pole / 230V)\n   - Purpose: Direct shock & wet bathroom life protection (IEC 61008-1)'
        : '🟢 *Main RCCB Check:*\n   - Please test mechanical trip spring using the Test "T" button and measure tripping time (<40ms at 30mA).',
      '',
      '🔌 *Circuit Breakers (MCBs):*',
      '   - Replace aging or wrong-rated switches with C16 MCBs (16-Amp, C-Curve, 10kA) for power sockets (AC, Geyser, Microwave).',
      '   - Ensure lighting circuits use B10 MCBs (10-Amp, B-Curve).',
      '',
      '🌱 *Earth Electrode Pit Check:*',
      '   - Test the green Earth ground wire and ground rod pit with an Earth Tester.',
      '   - Earth resistance must be below 5 Ohms.',
      '',
      `Property Scenario: ${selectedScenario.title}`,
      `Safety Grade: ${auditReport.overallGrade}`,
      '',
      'Generated via HomeGuard™ Residential Electrical Safety Inspector'
    ].join('\n');
  }, [breakerMode, auditReport, selectedScenario]);

  const handleCopyWhatsAppNote = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(whatsappMessage).then(() => {
        setCopyStatus('WhatsApp Note Copied! Paste directly in chat with your electrician.');
        setTimeout(() => setCopyStatus(null), 4000);
      });
    }
  };

  const handleOpenWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(url, '_blank');
    }
  };

  const isCriticalHazard = auditReport.overallGrade.includes('GRADE F');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* 1. TOP HEADER */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 print:bg-white print:border-b-2 print:border-black">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
              isCriticalHazard 
                ? "bg-rose-500/20 border-rose-500/50 text-rose-400" 
                : "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
            )}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider print:text-black">
                  Home Safety Audit Report
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950 text-orange-300 border border-orange-800 print:border-black print:text-black">
                  IEC 60364-4-41
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 print:text-gray-600">
                Per-Circuit Safety Inspection, Fault Verdicts & Certified Electrician Shopping List
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportPNG}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Export High-Resolution PNG Certificate"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export PNG</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy Shareable URL (?scenario=&breaker=)"
            >
              <Share2 className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Share Link</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION PILL */}
        {copyStatus && (
          <div className="bg-emerald-900/90 text-emerald-200 px-4 py-1.5 text-xs font-bold text-center border-b border-emerald-700 flex items-center justify-center gap-2 animate-in fade-in duration-150 print:hidden">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{copyStatus}</span>
          </div>
        )}

        {/* 2. STATUS & CONFIGURATION BAR */}
        <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:bg-gray-100 print:text-black">
          <div className="flex items-center gap-3">
            <div className={cn(
              "px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm tracking-wider flex items-center gap-2 border",
              isCriticalHazard 
                ? "bg-rose-950/90 text-rose-300 border-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.3)]" 
                : "bg-emerald-950/90 text-emerald-300 border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            )}>
              {isCriticalHazard ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              <span>{auditReport.overallGrade}</span>
            </div>
            
            <div className="text-xs font-mono">
              <span className="text-slate-400">Score: </span>
              <span className={cn("font-bold", auditReport.safetyScore >= 80 ? "text-emerald-400" : auditReport.safetyScore >= 50 ? "text-amber-400" : "text-rose-400")}>
                {auditReport.safetyScore} / 100
              </span>
            </div>
          </div>

          {/* BREAKER CONFIGURATION SELECTOR */}
          <div className="flex items-center gap-2 print:hidden">
            <span className="text-[11px] font-mono text-slate-400 hidden md:inline">Audited DB Config:</span>
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              {(['rccb_mcb', 'mcb_only', 'rcbo', 'velcb'] as BreakerConfigurationMode[]).map(mode => {
                const labelMap = {
                  rccb_mcb: 'RCCB+MCB',
                  mcb_only: 'MCB-Only',
                  rcbo: 'RCBO',
                  velcb: 'v-ELCB (Obsolete)'
                };
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      if (onChangeBreakerMode) {
                        onChangeBreakerMode(mode);
                        updateHomeGuardUrl(selectedScenario.id, mode);
                      }
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded font-bold transition-all cursor-pointer text-[11px]",
                      breakerMode === mode
                        ? "bg-orange-500 text-slate-950 shadow-sm"
                        : "text-slate-300 hover:text-white"
                    )}
                  >
                    {labelMap[mode]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. TABS NAVIGATION */}
        <div className="px-4 pt-2 bg-slate-900 border-b border-slate-800 flex gap-4 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('verdicts')}
            className={cn(
              "pb-2 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2",
              activeTab === 'verdicts'
                ? "text-sky-400 border-sky-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            )}
          >
            <Zap className="w-4 h-4" />
            <span>Per-Circuit Verdicts</span>
            <span className="px-1.5 py-0.2 bg-slate-800 rounded text-[10px] text-slate-300">
              {auditReport.verdicts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shopping_list')}
            className={cn(
              "pb-2 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2",
              activeTab === 'shopping_list'
                ? "text-amber-400 border-amber-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Electrician Shopping List</span>
            <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-800 rounded text-[10px]">
              Exact Parts
            </span>
          </button>
        </div>

        {/* 4. MODAL CONTENT BODY */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-slate-200 print:text-black">
          
          {/* TAB 1: PER-CIRCUIT VERDICTS */}
          {(activeTab === 'verdicts' || typeof window !== 'undefined') && (
            <div className={cn("space-y-4", activeTab !== 'verdicts' && "print:block hidden")}>
              
              {/* Circuit Verdicts Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 print:border-black print:bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700 print:bg-gray-200 print:text-black">
                        <th className="p-2.5 font-bold">Circuit Identifier</th>
                        <th className="p-2.5 font-bold">Installed Breaker / Rating</th>
                        <th className="p-2.5 font-bold">Live Load / Leakage</th>
                        <th className="p-2.5 font-bold">Clearing Time</th>
                        <th className="p-2.5 font-bold">Safety Verdict</th>
                        <th className="p-2.5 font-bold">Standard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono print:divide-gray-300">
                      {auditReport.verdicts.map((v) => {
                        const isSafe = v.status === 'COMPLIANT' || v.status === 'TRIPPED_SAFE';
                        const isOverload = v.status === 'OVERLOAD';
                        return (
                          <tr key={v.circuitId} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-2.5 font-bold text-white print:text-black">
                              {v.name}
                            </td>
                            <td className="p-2.5 text-slate-300 print:text-black">
                              {v.rating}
                            </td>
                            <td className="p-2.5">
                              {v.leakageMA && v.leakageMA > 0 ? (
                                <span className="text-rose-400 font-bold">
                                  {v.loadAmps.toFixed(1)}A | {v.leakageMA}mA Leak
                                </span>
                              ) : (
                                <span className="text-slate-300 print:text-black">
                                  {v.loadAmps.toFixed(1)}A normal
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-cyan-300 font-bold print:text-black">
                              {v.clearingTime}
                            </td>
                            <td className="p-2.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 border",
                                isSafe 
                                  ? "bg-emerald-950 text-emerald-300 border-emerald-800" 
                                  : isOverload
                                  ? "bg-amber-950 text-amber-300 border-amber-800"
                                  : "bg-rose-950 text-rose-300 border-rose-800 animate-pulse"
                              )}>
                                {isSafe ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {v.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-400 text-[11px] print:text-gray-700">
                              {v.standard}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Findings & Physiological Autopsy Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2 print:border-black print:bg-white">
                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Inspector Observations & Findings
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300 font-sans print:text-black">
                    {auditReport.findingsSummary.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold shrink-0">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2 print:border-black print:bg-white">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Remediation & Compliance Action
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans print:text-black">
                    {auditReport.remediationAdvice}
                  </p>
                  <div className="mt-auto pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <button
                      type="button"
                      onClick={() => setActiveTab('shopping_list')}
                      className="px-2 py-1 rounded bg-emerald-950 border border-emerald-500/70 text-emerald-300 font-bold flex items-center gap-1 hover:bg-emerald-900 cursor-pointer print:hidden"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp Note for Electrician</span>
                    </button>
                    <span className="text-cyan-400 font-bold">Standard: IEC 60364-4-41</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ELECTRICIAN SHOPPING LIST */}
          {(activeTab === 'shopping_list' || typeof window !== 'undefined') && (
            <div className={cn("space-y-4", activeTab !== 'shopping_list' && "print:block hidden")}>
              
              <div className="flex items-center justify-between gap-2 bg-amber-950/30 border border-amber-800/50 p-3 rounded-xl print:border-black print:bg-white">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2 print:text-black">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    Standardized Electrician Bill of Materials (BOM)
                  </h3>
                  <p className="text-[11px] text-slate-300 font-sans print:text-gray-700">
                    Exact manufacturer & wholesaler order strings for compliant residential panel upgrades.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyShoppingList}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 print:hidden"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Shopping List</span>
                </button>
              </div>

              {/* Usability Audit Item 15: 1-Click WhatsApp Note for Electrician */}
              <div className="bg-gradient-to-r from-emerald-950/70 via-teal-950/60 to-slate-900 border border-emerald-500/60 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg print:border-black print:bg-white">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
                        <span>Send to Electrician on WhatsApp</span>
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-slate-950">
                        1-Click Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-snug print:text-gray-700">
                      Plain-language trade text your local electrician can instantly understand to quote and install the right RCCB, MCBs, and ground pit checks.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center print:hidden">
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppNote}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow"
                    title="Copy pre-formatted WhatsApp message"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow"
                    title="Open WhatsApp directly with message"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Exact Parts Cards */}
              <div className="grid grid-cols-1 gap-2.5">
                {auditReport.shoppingList.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono print:border-black print:bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 font-bold text-xs shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        {/* EXACT PART STRING HIGHLIGHT */}
                        <div className="text-xs sm:text-sm font-bold text-sky-300 selection:bg-sky-500 selection:text-slate-950 print:text-black">
                          {item.partString}
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5 print:text-gray-600">
                          Target: <span className="text-white font-medium print:text-black">{item.circuitTarget}</span>
                          {item.notes && <span className="block text-[10px] text-slate-400 mt-0.5">{item.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          Qty: {item.quantity}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.standard}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(item.partString);
                            setCopyStatus(`Copied: "${item.partString}"`);
                            setTimeout(() => setCopyStatus(null), 2500);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors cursor-pointer print:hidden"
                        title="Copy exact part string"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. FOOTER ACTIONS & SHAREABLE URL BAR */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono print:hidden">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] overflow-hidden">
            <span className="text-orange-400 font-bold shrink-0">Shareable URL State:</span>
            <code className="bg-slate-900 px-2 py-1 rounded text-cyan-300 text-[10px] truncate max-w-[280px] sm:max-w-md">
              ?scenario={selectedScenario.id}&breaker={breakerMode}
            </code>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-600/60 hover:bg-purple-900 text-purple-200 font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Copy Link</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-white font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
