import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { PPE_ITEMS, PPEOption } from "./PPESelectionCard";
import { ShieldCheck, ShieldAlert, Info, RotateCcw, CheckCircle2 } from "lucide-react";

interface PPEMannequinProps {
  voltage: number;
  isPPESafe: boolean;
  activePPENames: string[];
  onSafetyChange: (safe: boolean, names: string[]) => void;
  disabled?: boolean;
}

// Body resistance model per published IEC 60479-1:2018 Table 1 data
const BASE_BODY_RESISTANCE = 1000; // Internal body resistance (Ohms)
const SKIN_DRY = 5000;             // Dry skin contact resistance per hand/foot
const SKIN_WET = 350;              // Wet skin contact resistance per hand/foot

// PPE-added protection resistance values (approximate order-of-magnitude model)
const PPE_RESISTANCE_BONUS: Record<string, number> = {
  glove_ac_00:    100_000,   // 500V class-00: ~100 kOhm effective
  glove_ac_0:     500_000,   // 1kV class-0: ~500 kOhm effective
  boots_eh:       200_000,   // EH boots: ~200 kOhm effective
  glasses_safety:       0,   // Face shield: no resistance path contribution
};

type ZoneId = "hands" | "feet" | "face";

const ZONE_LABELS: Record<ZoneId, string> = {
  hands: "Insulating Gloves",
  feet:  "Dielectric Boots",
  face:  "Arc Face Shield",
};

const ZONE_PPE_MAP: Record<ZoneId, string[]> = {
  hands: ["glove_ac_00", "glove_ac_0"],
  feet:  ["boots_eh"],
  face:  ["glasses_safety"],
};

export function PPEMannequin({ voltage, isPPESafe, activePPENames, onSafetyChange, disabled }: PPEMannequinProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(PPE_ITEMS.filter(i => activePPENames.includes(i.name)).map(i => i.id))
  );
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);
  const [lastEquipped, setLastEquipped] = useState<string | null>(null);

  const evaluateAndNotify = useCallback((ids: Set<string>) => {
    const selectedItems = PPE_ITEMS.filter(i => ids.has(i.id));
    const names = selectedItems.map(i => i.name);
    const hasAdequateGloves = selectedItems.some(i => i.category === "hands" && i.rating >= voltage);
    const hasBoots = selectedItems.some(i => i.category === "feet");
    const isSafe = hasAdequateGloves || hasBoots;
    onSafetyChange(isSafe, names);
  }, [voltage, onSafetyChange]);

  const toggleZone = useCallback((zone: ZoneId) => {
    if (disabled) return;
    const ppeIds = ZONE_PPE_MAP[zone];
    const next = new Set(selectedIds);
    const allEquipped = ppeIds.every(id => next.has(id));
    if (allEquipped) {
      ppeIds.forEach(id => next.delete(id));
      setLastEquipped(null);
    } else {
      // For gloves: equip the best-rated one for current voltage
      if (zone === "hands") {
        const best = voltage >= 1000 ? "glove_ac_0" : "glove_ac_00";
        ppeIds.forEach(id => next.delete(id));
        next.add(best);
        setLastEquipped(best);
      } else {
        ppeIds.forEach(id => next.add(id));
        setLastEquipped(ppeIds[0]);
      }
    }
    setSelectedIds(next);
    evaluateAndNotify(next);
  }, [disabled, selectedIds, voltage, evaluateAndNotify]);

  const clearAll = useCallback(() => {
    if (disabled) return;
    const empty = new Set<string>();
    setSelectedIds(empty);
    setLastEquipped(null);
    evaluateAndNotify(empty);
  }, [disabled, evaluateAndNotify]);

  const equipAll = useCallback(() => {
    if (disabled) return;
    const best = new Set<string>();
    if (voltage >= 1000) { best.add("glove_ac_0"); } else { best.add("glove_ac_00"); }
    best.add("boots_eh");
    best.add("glasses_safety");
    setSelectedIds(best);
    evaluateAndNotify(best);
  }, [disabled, voltage, evaluateAndNotify]);

  const isZoneEquipped = (zone: ZoneId) => ZONE_PPE_MAP[zone].some(id => selectedIds.has(id));

  // Live resistance computation (simplified model for educational display)
  const totalBodyR = useMemo(() => {
    const glovesOn = isZoneEquipped("hands");
    const bootsOn = isZoneEquipped("feet");
    const glovesR = glovesOn ? PPE_RESISTANCE_BONUS[voltage >= 1000 ? "glove_ac_0" : "glove_ac_00"] : SKIN_DRY;
    const bootsR = bootsOn ? PPE_RESISTANCE_BONUS["boots_eh"] : SKIN_DRY;
    return glovesR + BASE_BODY_RESISTANCE + bootsR;
  }, [selectedIds, voltage]);

  const formatR = (r: number) => r >= 1_000_000 ? `${(r/1_000_000).toFixed(1)} MΩ` : r >= 1_000 ? `${(r/1_000).toFixed(0)} kΩ` : `${r} Ω`;
  const currentMa = voltage > 0 ? ((voltage / totalBodyR) * 1000) : 0;

  const zoneConfig: { id: ZoneId; label: string; equipped: boolean; hovered: boolean; color: string; glowColor: string }[] = [
    { id: "hands", label: ZONE_LABELS["hands"], equipped: isZoneEquipped("hands"), hovered: hoveredZone === "hands", color: "cyan", glowColor: "rgba(34,211,238,0.6)" },
    { id: "feet",  label: ZONE_LABELS["feet"],  equipped: isZoneEquipped("feet"),  hovered: hoveredZone === "feet",  color: "emerald", glowColor: "rgba(52,211,153,0.6)" },
    { id: "face",  label: ZONE_LABELS["face"],  equipped: isZoneEquipped("face"),  hovered: hoveredZone === "face",  color: "blue", glowColor: "rgba(96,165,250,0.6)" },
  ];

  return (
    <div className="flex flex-col gap-1 p-1.5 rounded-xl bg-slate-950 border border-slate-800 shadow-sm select-none shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
        <span className={cn("text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1",
          isPPESafe ? "text-emerald-400" : "text-rose-400")}>
          {isPPESafe ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
          PPE Dressing Room
        </span>
        <div className="flex items-center gap-1">
          <button onClick={equipAll} disabled={disabled}
            className="text-[8.5px] px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition-colors cursor-pointer disabled:opacity-40">
            Full Kit
          </button>
          <button onClick={clearAll} disabled={disabled}
            className="text-[8.5px] px-1.5 py-0.5 rounded font-bold bg-slate-900 text-slate-400 border border-slate-700 hover:text-white transition-colors cursor-pointer disabled:opacity-40">
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-start">
        {/* SVG Mannequin */}
        <div className="relative w-[110px] shrink-0">
          <svg viewBox="0 0 110 240" className="w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="mannequin-glow-hands">
                <feGaussianBlur stdDeviation="4" result="g"/>
                <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="mannequin-glow-feet">
                <feGaussianBlur stdDeviation="4" result="g"/>
                <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="mannequin-glow-face">
                <feGaussianBlur stdDeviation="3" result="g"/>
                <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Body silhouette */}
            {/* Torso */}
            <rect x="32" y="60" width="46" height="80" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
            {/* Neck */}
            <rect x="46" y="40" width="18" height="22" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>

            {/* HEAD ZONE (clickable) */}
            <g
              style={{ cursor: disabled ? "default" : "pointer" }}
              onClick={() => !disabled && toggleZone("face")}
              onMouseEnter={() => setHoveredZone("face")}
              onMouseLeave={() => setHoveredZone(null)}
            >
              {/* Head */}
              <ellipse cx="55" cy="26" rx="19" ry="22" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
              {/* Face shield overlay when equipped */}
              {isZoneEquipped("face") && (
                <ellipse cx="55" cy="26" rx="19" ry="22"
                  fill="rgba(96,165,250,0.18)" stroke="#60a5fa" strokeWidth="2"
                  filter="url(#mannequin-glow-face)"
                />
              )}
              {/* Hover highlight */}
              {hoveredZone === "face" && !isZoneEquipped("face") && (
                <ellipse cx="55" cy="26" rx="19" ry="22" fill="rgba(96,165,250,0.08)" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 2"/>
              )}
              {/* Face features */}
              <ellipse cx="49" cy="22" rx="3.5" ry="4" fill="#0f172a"/>
              <ellipse cx="61" cy="22" rx="3.5" ry="4" fill="#0f172a"/>
              <path d="M 48,33 Q 55,38 62,33" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"/>
              {isZoneEquipped("face") && (
                <text x="55" y="28" textAnchor="middle" fill="#60a5fa" fontSize="7" fontWeight="bold">SHIELD</text>
              )}
            </g>

            {/* LEFT ARM */}
            <rect x="11" y="62" width="19" height="65" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
            {/* RIGHT ARM */}
            <rect x="80" y="62" width="19" height="65" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>

            {/* HANDS ZONE (clickable — left + right hands) */}
            <g
              style={{ cursor: disabled ? "default" : "pointer" }}
              onClick={() => !disabled && toggleZone("hands")}
              onMouseEnter={() => setHoveredZone("hands")}
              onMouseLeave={() => setHoveredZone(null)}
            >
              {/* Left hand */}
              <ellipse cx="20" cy="134" rx="11" ry="8"
                fill={isZoneEquipped("hands") ? "#164e63" : "#0f172a"}
                stroke={isZoneEquipped("hands") ? "#22d3ee" : "#334155"}
                strokeWidth={isZoneEquipped("hands") ? 2 : 1.5}
                filter={isZoneEquipped("hands") ? "url(#mannequin-glow-hands)" : undefined}
              />
              {/* Right hand */}
              <ellipse cx="90" cy="134" rx="11" ry="8"
                fill={isZoneEquipped("hands") ? "#164e63" : "#0f172a"}
                stroke={isZoneEquipped("hands") ? "#22d3ee" : "#334155"}
                strokeWidth={isZoneEquipped("hands") ? 2 : 1.5}
                filter={isZoneEquipped("hands") ? "url(#mannequin-glow-hands)" : undefined}
              />
              {/* Hover rings */}
              {hoveredZone === "hands" && !isZoneEquipped("hands") && (
                <>
                  <ellipse cx="20" cy="134" rx="11" ry="8" fill="rgba(34,211,238,0.08)" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 2"/>
                  <ellipse cx="90" cy="134" rx="11" ry="8" fill="rgba(34,211,238,0.08)" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 2"/>
                </>
              )}
              {isZoneEquipped("hands") && (
                <>
                  <text x="20" y="137" textAnchor="middle" fill="#22d3ee" fontSize="6" fontWeight="bold">GLV</text>
                  <text x="90" y="137" textAnchor="middle" fill="#22d3ee" fontSize="6" fontWeight="bold">GLV</text>
                </>
              )}
            </g>

            {/* LEGS */}
            <rect x="33" y="142" width="18" height="65" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
            <rect x="59" y="142" width="18" height="65" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>

            {/* FEET ZONE (clickable) */}
            <g
              style={{ cursor: disabled ? "default" : "pointer" }}
              onClick={() => !disabled && toggleZone("feet")}
              onMouseEnter={() => setHoveredZone("feet")}
              onMouseLeave={() => setHoveredZone(null)}
            >
              {/* Left foot */}
              <rect x="26" y="204" width="28" height="14" rx="5"
                fill={isZoneEquipped("feet") ? "#064e3b" : "#0f172a"}
                stroke={isZoneEquipped("feet") ? "#34d399" : "#334155"}
                strokeWidth={isZoneEquipped("feet") ? 2 : 1.5}
                filter={isZoneEquipped("feet") ? "url(#mannequin-glow-feet)" : undefined}
              />
              {/* Right foot */}
              <rect x="56" y="204" width="28" height="14" rx="5"
                fill={isZoneEquipped("feet") ? "#064e3b" : "#0f172a"}
                stroke={isZoneEquipped("feet") ? "#34d399" : "#334155"}
                strokeWidth={isZoneEquipped("feet") ? 2 : 1.5}
                filter={isZoneEquipped("feet") ? "url(#mannequin-glow-feet)" : undefined}
              />
              {hoveredZone === "feet" && !isZoneEquipped("feet") && (
                <>
                  <rect x="26" y="204" width="28" height="14" rx="5" fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 2"/>
                  <rect x="56" y="204" width="28" height="14" rx="5" fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 2"/>
                </>
              )}
              {isZoneEquipped("feet") && (
                <>
                  <text x="40" y="215" textAnchor="middle" fill="#34d399" fontSize="6" fontWeight="bold">BOOT</text>
                  <text x="70" y="215" textAnchor="middle" fill="#34d399" fontSize="6" fontWeight="bold">BOOT</text>
                </>
              )}
            </g>
          </svg>
        </div>

        {/* Right side: Zone click legends + live resistance readout */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {/* Zone Toggle Buttons */}
          {zoneConfig.map(z => (
            <button
              key={z.id}
              onClick={() => !disabled && toggleZone(z.id)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left transition-all text-[9.5px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-40 w-full",
                z.equipped
                  ? z.color === "cyan"
                    ? "bg-cyan-950/50 border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                    : z.color === "emerald"
                    ? "bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                    : "bg-blue-950/50 border-blue-500/60 text-blue-300 shadow-[0_0_8px_rgba(96,165,250,0.3)]"
                  : "bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full shrink-0",
                z.equipped
                  ? z.color === "cyan" ? "bg-cyan-400" : z.color === "emerald" ? "bg-emerald-400" : "bg-blue-400"
                  : "bg-slate-600"
              )}/>
              <span className="truncate">{z.label}</span>
              {z.equipped && <CheckCircle2 className="w-2.5 h-2.5 ml-auto shrink-0"/>}
            </button>
          ))}

          {/* Live Resistance Overlay Card */}
          <div className={cn("mt-1 p-1.5 rounded-lg border text-[9px] font-mono",
            isPPESafe ? "bg-emerald-950/30 border-emerald-500/30" : "bg-red-950/30 border-red-500/30")}>
            <div className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Body Circuit R</div>
            <div className={cn("font-black text-sm", isPPESafe ? "text-emerald-300" : "text-red-300")}>
              {formatR(totalBodyR)}
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              I = {voltage}V / {formatR(totalBodyR)} = <span className={cn("font-bold", currentMa < 10 ? "text-emerald-400" : currentMa < 100 ? "text-amber-400" : "text-red-400")}>{currentMa < 1 ? currentMa.toFixed(3) : currentMa.toFixed(1)} mA</span>
            </div>
            <div className="text-[7.5px] text-slate-600 mt-0.5">
              Body R model: IEC 60479-1:2018 §5.4 published data
            </div>
          </div>
        </div>
      </div>

      {/* Equipped PPE Summary Tags */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap gap-0.5 border-t border-slate-800 pt-1 mt-0.5">
          {PPE_ITEMS.filter(i => selectedIds.has(i.id)).map(i => (
            <span key={i.id} className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-slate-900 border border-slate-700 text-slate-300">
              {i.shortName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
