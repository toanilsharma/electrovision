import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, ShieldAlert, Zap, Flame, Skull, CheckCircle2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface FailureScenario {
  stepId: number;
  title: string;
  mistake: string;
  consequence: string;
  physics: string;
  injury: string;
  oshaStat: string;
  preventedBy: string;
  severity: "FATAL" | "CRITICAL" | "SEVERE";
}

export const LOTO_FAILURE_SCENARIOS: Record<number, FailureScenario> = {
  0: {
    stepId: 1,
    title: "Skipped Energy Identification: Hidden 2500 PSI Hydraulic Line",
    mistake: "Technician only looked at the electrical switchboard, forgetting that the machine had a 2500 PSI hydraulic clamp accumulator.",
    consequence: "When loosening the flange bolts, a micro-jet of hydraulic oil at 2500 PSI pierced through leather work gloves directly into the palm.",
    physics: "Fluid velocity exceeded 280 m/s. Pressure > 100 PSI easily breaches human dermis, causing deep sub-fascial compartment necrosis and systemic oil toxicity.",
    injury: "High-Pressure Fluid Injection Injury · Immediate surgical debridement and compartment release fasciotomy required within 4 hours to prevent amputation.",
    oshaStat: "OSHA reports > 250 high-pressure fluid injection accidents annually during unverified servicing.",
    preventedBy: "Perform a complete 6-energy audit (OSHA 1910.147(c)(4)) and consult manufacturer piping & instrumentation diagrams (P&ID) before touching tools.",
    severity: "FATAL"
  },
  1: {
    stepId: 2,
    title: "Skipped Normal Stop: Disconnect Opened Under 68A Inductive Load",
    mistake: "Technician opened the 400A knife switch while the 3-phase induction motor was still running at full speed under load.",
    consequence: "The knife switch contacts pulled open under 68A of inductive current. High back-EMF ionized the surrounding air, creating a violent 480V arc blast explosion.",
    physics: "Arc temperature reached ~12,000°C (hotter than the surface of the sun). Copper busbars vaporized instantly, expanding 67,000 times into molten metal shrapnel and acoustic overpressure (140 dB).",
    injury: "Third-degree facial flash burns, ruptured eardrums, and inhalation of vaporized heavy copper particles.",
    oshaStat: "Arc flashes from opening disconnects under load account for 15% of all fatal industrial electrical switchgear accidents.",
    preventedBy: "Always press the normal STOP push button first, confirm 0 RPM and 0A ammeter reading, then operate isolation devices.",
    severity: "FATAL"
  },
  2: {
    stepId: 3,
    title: "Incomplete Isolation: Auxiliary Control Power Backfeed",
    mistake: "Main 480V feeder was opened, but the 120V auxiliary control transformer and pneumatic safety pilot line were not disconnected.",
    consequence: "While replacing an internal limit switch, an automated interlock pulse fired, cycling the pneumatic clamp unexpectedly onto the technician's arm.",
    physics: "Pneumatic reservoir had 120 PSI trapped across a 4-inch cylinder bore, generating 1,500 lbs of instantaneous mechanical compressive force.",
    injury: "Compound radius and ulna fractures with severe nerve impingement and crush lacerations.",
    oshaStat: "30% of LOTO injuries involve secondary or auxiliary energy sources that workers assumed were powered down.",
    preventedBy: "Achieve positive isolation of EVERY energy source: open all disconnects, close all isolation ball valves, and verify physical air gaps.",
    severity: "CRITICAL"
  },
  3: {
    stepId: 4,
    title: "Tag Applied Without a Lock: Inadvertent Re-Energization",
    mistake: "Worker hung a paper danger tag on the handle without applying a padlock because 'it was only going to take 2 minutes'.",
    consequence: "A shift-change supervisor walked past, thought the work had wrapped up, pulled off the paper tag, and flipped the breaker back ON.",
    physics: "480V 3-phase power was restored instantly to the open motor junction box where the technician was reconnecting stator leads with bare hands.",
    injury: "Bilateral hand-to-hand AC electrocution (current > 450 mA), immediate ventricular fibrillation, and full cardiac arrest.",
    oshaStat: "OSHA 1910.147 explicitly states that a TAG is only a warning — ONLY A PHYSICAL PADLOCK guarantees isolation.",
    preventedBy: "One Worker, One Lock: Every technician must attach their personal safety padlock and key. Never depend on a tag alone.",
    severity: "FATAL"
  },
  4: {
    stepId: 5,
    title: "Skipped Stored Energy Bleed: 680V DC Bus Capacitor Shock",
    mistake: "Power switch was locked out, but the variable frequency drive (VFD) electrolytic capacitor bank was not allowed to discharge through a bleeder resistor.",
    consequence: "Technician touched the DC+ and DC- terminals inside the drive cabinet, discharging 680V of stored capacitive energy directly across their chest.",
    physics: "Capacitor bank held E = 1/2 C V² = 0.5 × (4700 µF) × (680V)² ≈ 1,086 Joules of energy. A lethal discharge takes less than 2 milliseconds.",
    injury: "Violent muscle tetany throwing the worker backwards, cardiac dysrhythmia (VFib), and severe internal deep-tissue electrical entry/exit burns.",
    oshaStat: "Stored capacitor and hydraulic accumulator energy causes 28% of unexpected energization fatalities.",
    preventedBy: "Wait for bleed-down timers, measure residual DC voltage with a calibrated meter, and apply a grounded discharge wand.",
    severity: "FATAL"
  },
  5: {
    stepId: 6,
    title: "Skipped Zero-Energy Verification: Welded Switch Blade Contact",
    mistake: "Worker saw the switch handle in the 'OFF' position and assumed it was safe without testing with a multimeter ('Test-Before-Touch').",
    consequence: "One internal copper knife blade had welded shut due to a previous short-circuit fault. Phase L3 was still fully energized at 277V to ground!",
    physics: "Although the handle showed 'OFF', the welded blade maintained circuit continuity. Touching Phase L3 completed a circuit through the technician's body to ground.",
    injury: "Severe 277V shock, 'no-let-go' flexor muscle paralysis, ventricular fibrillation, and secondary fall from height.",
    oshaStat: "NFPA 70E Article 120.5 mandates the 3-Point Live-Dead-Live test because switches fail internally while showing external OFF.",
    preventedBy: "NEVER ASSUME — ALWAYS TEST! Execute the Live-Dead-Live protocol with a calibrated multimeter before touching any conductor.",
    severity: "FATAL"
  }
};

interface LOTOFailureConsequenceModalProps {
  stepIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function LOTOFailureConsequenceModal({
  stepIndex,
  isOpen,
  onClose
}: LOTOFailureConsequenceModalProps) {
  if (!isOpen) return null;
  const scenario = LOTO_FAILURE_SCENARIOS[stepIndex];
  if (!scenario) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-xl bg-slate-900 border-2 border-red-500/80 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.4)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 px-4 py-3 border-b border-red-500/50 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 shrink-0">
                <Skull className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono font-black uppercase text-red-400 tracking-widest block">
                  CATASTROPHE SIMULATION · STEP {scenario.stepId} FAILURE
                </span>
                <h3 className="text-sm font-black uppercase text-white truncate">
                  {scenario.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 overflow-y-auto space-y-3 text-slate-200">
            {/* The Fatal Mistake & What Happened */}
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 space-y-1">
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-black uppercase">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>The Fatal Shortcut / Error</span>
              </div>
              <p className="text-xs text-red-200 leading-relaxed font-medium">
                {scenario.mistake}
              </p>
              <div className="pt-1.5 border-t border-red-500/20 text-xs text-slate-100 font-bold leading-relaxed">
                <span className="text-red-400 font-black">Consequence: </span>
                {scenario.consequence}
              </div>
            </div>

            {/* Biophysics & Energy Physics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span>Physics of Failure</span>
                </div>
                <p className="text-[10.5px] text-slate-300 leading-snug font-sans">
                  {scenario.physics}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-black uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>Clinical Injury Pathology</span>
                </div>
                <p className="text-[10.5px] text-rose-200 leading-snug font-sans">
                  {scenario.injury}
                </p>
              </div>
            </div>

            {/* OSHA Real-World Statistics */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
              <span className="font-bold text-orange-400">OSHA Incident Telemetry:</span>
              <span className="text-slate-300 text-right">{scenario.oshaStat}</span>
            </div>

            {/* How LOTO Prevents This Catastrophe */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black uppercase tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>How This Step Guarantees Your Life</span>
              </div>
              <p className="text-xs text-emerald-200 leading-relaxed font-medium">
                {scenario.preventedBy}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[9px] font-mono text-slate-400">
              Standard: OSHA 29 CFR 1910.147 & NFPA 70E
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
            >
              Return to Safe Simulation
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
