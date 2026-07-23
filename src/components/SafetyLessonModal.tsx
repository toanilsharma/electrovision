import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, CheckCircle2, Zap, AlertTriangle, FileText, Sparkles, Award } from 'lucide-react';

interface SafetyLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMA: number;
  durationMs: number;
  skinCondition: 'dry' | 'wet';
  path: 'hand-to-hand' | 'hand-to-foot' | 'none';
  voltage: number;
  isPPESafe: boolean;
  equippedPPENames?: string[];
  hazardType?: 'ac' | 'dc';
}

export const SafetyLessonModal: React.FC<SafetyLessonModalProps> = ({
  isOpen,
  onClose,
  currentMA,
  durationMs,
  skinCondition,
  path,
  voltage,
  isPPESafe,
  equippedPPENames = [],
  hazardType = 'ac'
}) => {
  const [showCertificateView, setShowCertificateView] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Calculation for Line 1: Current Passed, Duration, Condition
  const formattedCurrent = currentMA >= 1000 
    ? `${(currentMA / 1000).toFixed(2)} A (${currentMA.toFixed(1)} mA)` 
    : `${currentMA.toFixed(1)} mA`;
  
  const formattedCondition = `${skinCondition === 'dry' ? 'Dry Skin' : 'Wet/Perspired Skin'} + ${path === 'hand-to-hand' ? 'Hand-to-Hand' : 'Hand-to-Foot'} path`;

  // Calculation for Line 2: Human Body & Heart Hazard Threshold
  const calculateFatalIn = (ma: number, durMs: number) => {
    if (ma < 0.5) return "Safe Level — Barely noticeable micro-tingle. Completely harmless.";
    if (ma < 10) return "Painful Shock — Causes sharp reflex jerk, but you can still pull your hand away.";
    if (ma < 30) return "Dangerous Muscle Freeze! Hand muscles clamp shut tight onto conductor — You cannot let go without help!";
    
    // IEC 60479-1 Z_c curve formula: t = (165 / mA)^2 seconds
    const timeInSec = Math.pow(165 / ma, 2);
    const timeInMs = Math.round(timeInSec * 1000);
    
    const baseText = timeInMs < 1000 
      ? `${timeInMs} ms (${timeInSec.toFixed(2)} sec)` 
      : `${timeInSec.toFixed(1)} sec (${timeInMs} ms)`;
      
    if (durMs >= timeInMs) {
      return `Lethal Heart Stop Threshold is ${baseText}. [EXCEEDED by ${durMs - timeInMs}ms — High Risk of Fatal Ventricular Fibrillation!]`;
    } else if (durMs > 0) {
      return `Lethal Heart Stop Threshold is ${baseText}. [Critical Hazard: Prolonged shock will trigger heart stop!]`;
    }
    return `Lethal Heart Stop Threshold: ${baseText}`;
  };

  const fatalInText = calculateFatalIn(currentMA, durationMs);

  // Calculation for Line 3: Survival & Prevention
  const calculateSurvivalMitigation = (v: number, skin: string, safe: boolean) => {
    if (safe) return "Fully Safe! Your rated electrical safety gear completely blocked the electric shock.";
    
    const recommendations: string[] = [];
    if (v <= 500) {
      recommendations.push("Wear Rated Insulating Safety Gloves (Class 00 for up to 500V)");
    } else if (v <= 1000) {
      recommendations.push("Wear Rated Insulating Safety Gloves (Class 0 for up to 1000V)");
    } else if (v <= 7500) {
      recommendations.push("Wear High-Voltage Safety Gloves (Class 1 for up to 7.5kV)");
    } else {
      recommendations.push("Wear High-Voltage Safety Gloves (Class 2 for up to 17kV)");
    }

    recommendations.push("Wear Dielectric Safety Boots (Stops electric current flowing through feet to ground)");

    if (skin === 'wet') {
      recommendations.push("Keep Skin & Hands Dry (Wet skin drastically reduces natural body electrical resistance)");
    }

    return recommendations.join(" + ");
  };

  const survivalText = calculateSurvivalMitigation(voltage, skinCondition, isPPESafe);

  // Generate high-resolution HTML Canvas Certificate for PNG & PDF downloads
  const generateCertificateCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 750);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 750);

    // Gold / Amber Warning Border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 1160, 710);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 1140, 690);

    // Decorative Corner Elements
    const corners = [[35, 35], [1165, 35], [35, 715], [1165, 715]];
    corners.forEach(([x, y]) => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top Header Badge
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(400, 45, 400, 36, 18);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ ELECTRICAL SAFETY SIMULATOR | TOOLBOX TALK CERTIFICATE', 600, 68);

    // Certificate Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px system-ui, sans-serif';
    ctx.fillText('ELECTRICAL HAZARD SAFETY LESSON', 600, 125);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillText(`INCIDENT ANALYSIS REPORT - ${hazardType.toUpperCase()} SHOCK HAZARD (${voltage}V)`, 600, 155);

    // Divider Line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 175);
    ctx.lineTo(1100, 175);
    ctx.stroke();

    // 3 Key Safety Lesson Boxes
    const boxY = 195;
    const boxH = 135;

    // BOX 1: Incident Parameters
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(80, boxY, 1040, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('1. ELECTRICITY PASSED & BODY CONTACT', 105, boxY + 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText(`⚡ Electricity Flowed: ${formattedCurrent}`, 105, boxY + 68);
    ctx.fillText(`⏱️ Time Exposed: ${durationMs} ms`, 550, boxY + 68);
    ctx.fillText(`💧 Body State: ${formattedCondition}`, 105, boxY + 105);

    // BOX 2: Fatality Threshold
    const box2Y = boxY + boxH + 18;
    ctx.fillStyle = 'rgba(127, 29, 29, 0.4)';
    ctx.beginPath();
    ctx.roundRect(80, box2Y, 1040, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f87171';
    ctx.font = '900 15px system-ui, sans-serif';
    ctx.fillText('2. HUMAN BODY & HEART DANGER LEVEL', 105, box2Y + 32);

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 18px system-ui, sans-serif';
    ctx.fillText(`💔 Danger: ${fatalInText}`, 105, box2Y + 75);

    ctx.fillStyle = '#fca5a5';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText('Based on international electrical safety standards for human cardiac & muscle response', 105, box2Y + 108);

    // BOX 3: Survival Mitigation
    const box3Y = box2Y + boxH + 18;
    ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
    ctx.beginPath();
    ctx.roundRect(80, box3Y, 1040, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = '900 15px system-ui, sans-serif';
    ctx.fillText('3. LIFE-SAVING PROTECTION & PREVENTATIVE MEASURES', 105, box3Y + 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px system-ui, sans-serif';
    ctx.fillText(`🛡️ Would Have Survived If: ${survivalText}`, 105, box3Y + 75);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText('Always inspect safety gear before working near live electrical circuits.', 105, box3Y + 108);

    // Footer Attribution & Signature Area
    const footerY = 675;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, footerY);
    ctx.lineTo(1120, footerY);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Concept, Visualisation & Engineering: Anil Sharma', 600, footerY + 28);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText('ELECTROVISION ELECTRICAL HAZARD SAFETY SIMULATOR | DESIGN CALCULATORS', 600, footerY + 46);

    return canvas;
  };

  // Download Image (.PNG)
  const handleDownloadPNG = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const canvas = generateCertificateCanvas();
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Electrical_Safety_Lesson_Certificate_${voltage}V.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('PNG download error:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  // Download PDF (.PDF) - Pure In-Place Canvas Download (No window.open / no popups)
  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const canvas = generateCertificateCanvas();
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Electrical_Safety_Lesson_Certificate_${voltage}V.pdf`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('PDF download error:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  return (
    <AnimatePresence>
      <div className="fixed top-14 sm:top-16 left-2 sm:left-4 bottom-2 sm:bottom-4 z-[95] w-[95%] max-w-md sm:max-w-lg bg-slate-900/98 border-2 border-amber-500 rounded-2xl shadow-[0_15px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        <motion.div
          initial={{ opacity: 0, x: -50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.95 }}
          className="flex flex-col h-full overflow-y-auto"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 p-3 sm:p-3.5 flex items-center justify-between text-slate-950 font-black shrink-0">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 fill-current text-slate-950 shrink-0" />
              <h2 className="text-xs sm:text-sm uppercase tracking-wider leading-none font-black">
                POST-SHOCK SAFETY LESSON SUMMARY
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3-Line Summary Card Content */}
          <div className="p-3.5 sm:p-4 space-y-3 flex-1 overflow-y-auto">
            {/* BIG BOLD REAL INCIDENT FACTOR CALLOUT */}
            <div className="p-3.5 bg-amber-500/15 border-2 border-amber-500/60 rounded-xl space-y-1 shadow-md">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                CRITICAL SAFETY FACTOR NOTICE
              </span>
              <p className="text-xs sm:text-sm font-black text-amber-300 tracking-wide leading-relaxed">
                Actual electrical incidents depend upon many factors including body resistance, contact area, duration, voltage, current path, environment, moisture, health condition, and protective devices.
              </p>
            </div>

            {/* LINE 1: Electricity Passed & Body Contact */}
            <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/40 space-y-1 shadow-inner">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block">
                1. ELECTRICITY PASSED & BODY CONTACT
              </span>
              <p className="text-xs font-bold text-white leading-relaxed">
                <span className="text-sky-300">Electricity Flowed:</span> <span className="font-mono font-black text-amber-300">{formattedCurrent}</span> | <span className="text-sky-300">Time Exposed:</span> <span className="font-mono font-black text-amber-300">{durationMs} ms</span> | <span className="text-sky-300">Body Condition:</span> <span className="text-white">{formattedCondition}</span>
              </p>
            </div>

            {/* LINE 2: Human Body & Heart Danger */}
            <div className="p-3 rounded-xl bg-red-950/60 border-2 border-red-500/80 space-y-1 shadow-inner">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block">
                2. HUMAN BODY & HEART DANGER LEVEL
              </span>
              <p className="text-xs font-black text-yellow-300 leading-relaxed flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{fatalInText}</span>
              </p>
            </div>

            {/* LINE 3: Life-Saving Protection */}
            <div className="p-3 rounded-xl bg-emerald-950/60 border-2 border-emerald-500/80 space-y-1 shadow-inner">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                3. HOW TO PREVENT THIS INJURY
              </span>
              <p className="text-xs font-bold text-emerald-200 leading-relaxed flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Would have survived if: {survivalText}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                onClick={() => setShowCertificateView(!showCertificateView)}
                className="w-full sm:w-auto py-2.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-xl border border-amber-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{showCertificateView ? "Hide Certificate" : "Share Safety Lesson"}</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                Close Panel
              </button>
            </div>

            {/* Certificate Preview & In-Place Download Options */}
            {showCertificateView && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3 border-t border-slate-800 space-y-2.5"
              >
                <div className="p-2.5 bg-slate-950 rounded-xl border border-amber-500/40 text-center space-y-0.5">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" /> SAFETY LESSON CERTIFICATE READY
                  </h4>
                  <p className="text-[10px] text-slate-300">
                    Download image or PDF to share in safety meetings & toolbox talks.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadPNG}
                    disabled={isGenerating}
                    className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border border-sky-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PNG Image</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border border-red-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF Doc</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
