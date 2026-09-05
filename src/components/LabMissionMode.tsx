import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical, ChevronRight, CheckCircle2, XCircle, RotateCcw,
  BookOpen, Trophy, ChevronDown, Printer, Lightbulb, X
} from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface LabMission {
  id: string;
  title: string;
  objective: string;
  formulaHint: string;
  formulaSource: string;
  task: string;
  validateFn: (params: Record<string, number>) => boolean;
  correctExplanation: string;
  incorrectHint: string;
}

interface LabMissionModeProps {
  simulatorName: string;
  missions: LabMission[];
  currentParams: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
}

type MissionState = "idle" | "active" | "passed" | "failed";

export function LabMissionMode({ simulatorName, missions, currentParams, isOpen, onClose }: LabMissionModeProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [missionState, setMissionState] = useState<MissionState>("idle");
  const [passedMissions, setPassedMissions] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);

  const mission = missions[currentIdx];
  const totalMissions = missions.length;
  const allCompleted = passedMissions.size === totalMissions;

  const handleEvaluate = useCallback(() => {
    if (!mission) return;
    setMissionState("active");
    const passed = mission.validateFn(currentParams);
    setTimeout(() => {
      if (passed) {
        setMissionState("passed");
        setPassedMissions(prev => new Set([...prev, mission.id]));
      } else {
        setMissionState("failed");
      }
    }, 600);
  }, [mission, currentParams]);

  const handleNext = useCallback(() => {
    if (currentIdx < totalMissions - 1) {
      setCurrentIdx(prev => prev + 1);
      setMissionState("idle");
      setShowHint(false);
    }
  }, [currentIdx, totalMissions]);

  const handleReset = useCallback(() => {
    setCurrentIdx(0);
    setMissionState("idle");
    setPassedMissions(new Set());
    setShowHint(false);
  }, []);

  const handlePrintReport = useCallback(() => {
    const html = `<!DOCTYPE html><html><head><title>ElectroLive Lab Report - ${simulatorName}</title>
<style>body{font-family:monospace;padding:2rem;color:#000}h1{border-bottom:2px solid #000;padding-bottom:.5rem}.mission{margin:1rem 0;padding:1rem;border:1px solid #000}.pass{color:#059669}.fail{color:#dc2626}.formula{background:#f3f4f6;padding:.5rem;font-style:italic}footer{margin-top:2rem;font-size:.75rem;color:#6b7280}</style>
</head><body>
<h1>ElectroLive&#8482; Lab Experiment Report</h1>
<p><strong>Simulator:</strong> ${simulatorName}</p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
<p><strong>Score:</strong> ${passedMissions.size} / ${totalMissions} missions completed</p><hr/>
${missions.map((m, i) => `<div class="mission"><h3>${i + 1}. ${m.title} <span class="${passedMissions.has(m.id) ? "pass" : "fail"}">${passedMissions.has(m.id) ? "&#10003; PASSED" : "&#9675; NOT COMPLETED"}</span></h3><p><strong>Objective:</strong> ${m.objective}</p><div class="formula"><strong>Formula:</strong> ${m.formulaHint} | ${m.formulaSource}</div>${passedMissions.has(m.id) ? `<p class="pass"><strong>Result:</strong> ${m.correctExplanation}</p>` : ""}</div>`).join("")}
<footer>ElectroLive&#8482; is an independent educational platform. Physics calculated using formulae from published IEEE and IEC engineering literature. Not affiliated with, endorsed by, or certified by any standards body. For educational use only.</footer>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }, [simulatorName, missions, passedMissions, totalMissions]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-sm bg-slate-950 border-l border-emerald-500/30 flex flex-col shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-emerald-950/30 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <FlaskConical className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Lab Mission Mode</div>
                  <div className="text-xs font-bold text-slate-200">{simulatorName}</div>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress */}
            <div className="px-4 pt-3 pb-0 shrink-0">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                <span>EXPERIMENT PROGRESS</span>
                <span className="text-emerald-400">{passedMissions.size}/{totalMissions} COMPLETE</span>
              </div>
              <div className="flex gap-1">
                {missions.map((m, i) => (
                  <div key={m.id} className={cn("flex-1 h-1.5 rounded-full transition-colors duration-500",
                    passedMissions.has(m.id) ? "bg-emerald-500" : i === currentIdx ? "bg-sky-500" : "bg-slate-800")} />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {allCompleted ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                  <div className="p-5 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
                    <Trophy className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-white uppercase tracking-wide">All Experiments Complete!</div>
                    <div className="text-xs text-slate-400 mt-1">You completed all {totalMissions} lab experiments.</div>
                  </div>
                  <div className="flex gap-2 w-full">
                    <button onClick={handlePrintReport} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer">
                      <Printer className="w-3.5 h-3.5" /> Print Report
                    </button>
                    <button onClick={handleReset} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase tracking-wider">
                      Experiment {currentIdx + 1} of {totalMissions}
                    </span>
                    {passedMissions.has(mission?.id) && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black">&#10003; PASSED</span>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="text-sm font-black text-white">{mission?.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{mission?.objective}</p>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Physics Formula</span>
                    </div>
                    <div className="font-mono text-sm text-amber-300 font-bold">{mission?.formulaHint}</div>
                    <div className="text-[10px] text-amber-500/70 mt-1">{mission?.formulaSource}</div>
                  </div>

                  <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-3">
                    <div className="text-[10px] font-black uppercase text-sky-400 tracking-wider mb-1.5">Your Task</div>
                    <p className="text-xs text-sky-200 leading-relaxed">{mission?.task}</p>
                  </div>

                  <button onClick={() => setShowHint(h => !h)} className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer">
                    <span>Need a hint?</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showHint && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {showHint && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 text-xs text-purple-200">{mission?.incorrectHint}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {(missionState === "passed" || missionState === "failed") && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={cn("rounded-xl border p-3.5", missionState === "passed" ? "border-emerald-500/40 bg-emerald-950/40" : "border-red-500/40 bg-red-950/30")}>
                        <div className="flex items-center gap-2 mb-1.5">
                          {missionState === "passed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                          <span className={cn("text-xs font-black uppercase tracking-wider", missionState === "passed" ? "text-emerald-400" : "text-red-400")}>
                            {missionState === "passed" ? "Experiment Passed!" : "Not quite — try again"}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          {missionState === "passed" ? mission?.correctExplanation : mission?.incorrectHint}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Footer Actions */}
            {!allCompleted && (
              <div className="p-4 border-t border-slate-800 flex gap-2 shrink-0">
                <div className="flex gap-1 shrink-0">
                  {missions.map((m, i) => (
                    <button key={m.id} onClick={() => { setCurrentIdx(i); setMissionState("idle"); setShowHint(false); }}
                      className={cn("w-7 h-7 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center",
                        passedMissions.has(m.id) ? "bg-emerald-600 text-white" : i === currentIdx ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
                      {passedMissions.has(m.id) ? "?" : i + 1}
                    </button>
                  ))}
                </div>
                <button onClick={missionState === "passed" ? handleNext : handleEvaluate}
                  disabled={missionState === "active"}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
                    missionState === "passed" ? "bg-emerald-600 hover:bg-emerald-500 text-white" :
                    missionState === "active" ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-500 text-white")}>
                  {missionState === "passed" ? <><ChevronRight className="w-3.5 h-3.5" /> Next Experiment</> : missionState === "active" ? "Evaluating..." : <><CheckCircle2 className="w-3.5 h-3.5" /> Evaluate Answer</>}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- Pre-built Mission Sets ---------------------------------------------------
export const AC_SHOCK_MISSIONS: LabMission[] = [
  {
    id: "ac_joule_doubling",
    title: "Joule Heating Quadrupling Law",
    objective: "Prove that doubling the touch voltage quadruples heat energy deposited in human tissue at the same contact duration.",
    formulaHint: "Q = I\u00b2Rt = (V/Z_body)\u00b2 \u00d7 R_body \u00d7 t",
    formulaSource: "Joule's First Law; body impedance model from published IEC 60479-1:2018 \u00a75.4 research data",
    task: "Set voltage to 115V and note the Joule heat value. Double the voltage to 230V. Click Evaluate when the result shows approximately 4\u00d7 the first reading.",
    validateFn: (p) => p.voltage >= 220 && p.voltage <= 240,
    correctExplanation: "Correct! At 230V vs 115V, current doubles (I = V/Z), so Q = I\u00b2Rt quadruples. This is why high-voltage contacts are catastrophically more lethal.",
    incorrectHint: "Set voltage to 230V (double of 115V). Joule heating Q = I\u00b2Rt. If I doubles, Q quadruples.",
  },
  {
    id: "ac_letgo_threshold",
    title: "Let-Go Threshold Discovery",
    objective: "Find the minimum current level causing sustained involuntary muscle contraction (let-go threshold).",
    formulaHint: "I_letgo \u2248 10 mA AC at 50/60Hz \u2014 muscle tetanus onset",
    formulaSource: "Current-effect thresholds from published IEC 60479-1:2018 \u00a75 research and body of electrical safety literature",
    task: "Increase current from 1 mA gradually. Find the level where the MUSCLE LOCK indicator activates. Click Evaluate when active.",
    validateFn: (p) => p.shockCurrentMa >= 10,
    correctExplanation: "Correct! ~10 mA AC causes involuntary muscle tetanus. The victim cannot release the conductor, extending exposure and worsening injury.",
    incorrectHint: "Increase current slowly. The MUSCLE LOCK status activates between 8\u201315 mA at 50Hz.",
  },
  {
    id: "ac_vfib_zone",
    title: "Ventricular Fibrillation Zone",
    objective: "Enter the cardiac ventricular fibrillation danger zone and observe how quickly it is reached.",
    formulaHint: "V-Fib risk > 50% when I > 500 mA for t > 200ms",
    formulaSource: "Current-time-fibrillation relationship from IEC 60479-1:2018 Annex A published research data",
    task: "Set current above 500 mA and duration above 200ms. Click Evaluate when the ECG shows ventricular fibrillation pattern.",
    validateFn: (p) => p.shockCurrentMa >= 400 && p.durationMs >= 200,
    correctExplanation: "Correct! Above 500 mA for > 200ms, V-Fib onset probability exceeds 50%. This zone requires immediate defibrillation.",
    incorrectHint: "Increase current above 400 mA and duration to at least 200ms. Watch for the V-Fib ECG pattern.",
  },
];

export const ARC_FLASH_MISSIONS: LabMission[] = [
  {
    id: "arc_cat2_boundary",
    title: "Category 2 Working Distance",
    objective: "Find the working distance where incident energy equals 8 cal/cm\u00b2 \u2014 the Category 2 PPE threshold.",
    formulaHint: "E = 4.184 \u00d7 Cf \u00d7 En \u00d7 (t/0.2) \u00d7 (610^x / D^x)",
    formulaSource: "Incident energy distance relationship from IEEE 1584-2018 published equations",
    task: "Adjust working distance until incident energy reads 8 cal/cm\u00b2 (\u00b11.5). Click Evaluate.",
    validateFn: (p) => Math.abs((p.incidentEnergy ?? 0) - 8.0) <= 1.5,
    correctExplanation: "Correct! At 8 cal/cm\u00b2 you are at the Category 2 PPE boundary. Workers here need a minimum Category 2 arc-rated suit.",
    incorrectHint: "Adjust the working distance slider. Incident energy decreases with distance from the arc source.",
  },
  {
    id: "arc_fatal_zone",
    title: "Fatal Blast Zone",
    objective: "Identify where incident energy reaches the fatal 40 cal/cm\u00b2 threshold \u2014 incurable third-degree burns.",
    formulaHint: "E \u221d 1/D^x from the arc source",
    formulaSource: "Distance-energy scaling from IEEE 1584-2018 published distance exponent model",
    task: "Maximize system parameters and move close enough for the red Fatal zone ring to appear. Click Evaluate.",
    validateFn: (p) => (p.incidentEnergy ?? 0) >= 35,
    correctExplanation: "Correct! The red 40 cal/cm\u00b2 fatal zone represents incurable burns. No PPE available commercially withstands this \u2014 the only protection is exclusion.",
    incorrectHint: "Increase arc current and decrease working distance. The red Fatal ring appears inside the orange Cat 2 ring.",
  },
];

export const SHORT_CIRCUIT_MISSIONS: LabMission[] = [
  {
    id: "sc_lorentz_limit",
    title: "Insulator Failure by Lorentz Force",
    objective: "Find the short-circuit current where Lorentz force exceeds the 12 kN/m LV busbar insulator withstand rating.",
    formulaHint: "F/L = \u03bc\u2080 \u00d7 I\u00b2 / (2\u03c0 \u00d7 d), \u03bc\u2080 = 4\u03c0\u00d710\u207b\u2077 H/m, d = 0.1m",
    formulaSource: "Amp\u00e8re's force law; busbar mechanical stress methodology from IEC 60865-1:2011 published formulae",
    task: "Increase Isc until the Lorentz Force telemetry shows > 12 kN/m. Click Evaluate.",
    validateFn: (p) => {
      const lorentz = (0.2 * Math.pow(p.peakCurrentKA ?? 0, 2)) / 0.1 / 1000;
      return lorentz >= 12;
    },
    correctExplanation: "Correct! At this current, electromagnetic repulsion between parallel busbars exceeds 12 kN/m \u2014 explaining catastrophic busbar deformation during uncleared short-circuits.",
    incorrectHint: "Increase Isc. The Lorentz Force chip turns red at > 12 kN/m. Use F = 0.2 \u00d7 Ip\u00b2 / 0.1 kN/m.",
  },
];

export const FIRST_AID_MISSIONS: LabMission[] = [
  {
    id: "cpr_rhythm",
    title: "CPR Compression Rate",
    objective: "Achieve 30 consecutive compressions within 100\u2013120 BPM (AHA BLS published guideline rate).",
    formulaHint: "BPM = 60,000 / avg_interval_ms | Target: 500\u2013600ms per compression",
    formulaSource: "AHA Basic Life Support 2024 \u2014 publicly published CPR compression rate recommendation",
    task: "Start the metronome and tap COMPRESS CHEST in sync for 30 compressions. Click Evaluate.",
    validateFn: (p) => {
      const bpm = p.userBPM ?? 0;
      return bpm >= 95 && bpm <= 125 && (p.compCount ?? 0) >= 30;
    },
    correctExplanation: "Correct! 100\u2013120 BPM ensures adequate cardiac output. Too slow (<80 BPM) is insufficient; too fast (>130 BPM) reduces depth and recoil.",
    incorrectHint: "Follow the metronome exactly. Your BPM readout should show 100\u2013120. Complete at least 30 compressions.",
  },
];
