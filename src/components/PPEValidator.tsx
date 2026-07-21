import React, { useState, useMemo, useEffect } from 'react';
import { Shield, HardHat, Footprints, Flame, HandMetal, Glasses, CheckCircle, XCircle, AlertTriangle, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export type HazardType = 'arc_flash' | 'shock_ac' | 'shock_dc' | 'earth_fault' | 'step_touch';

interface PPEItemDef {
  id: string;
  name: string;
  category: 'head_face' | 'body' | 'hands' | 'feet' | 'accessories';
  rating: number; // cal/cm2 for arc, V for AC/DC shock, or higher threshold for generic items
  standard?: string;
  icon: React.ReactNode;
}

const ARC_PPE: PPEItemDef[] = [
  { id: 'arc_body_4', name: 'AR Daily Wear (4 cal/cm²)', category: 'body', rating: 4, icon: <Shield className="w-4 h-4" /> },
  { id: 'arc_body_8', name: 'AR Daily Wear (8 cal/cm²)', category: 'body', rating: 8, icon: <Shield className="w-4 h-4" /> },
  { id: 'arc_body_25', name: 'Arc Flash Suit (25 cal/cm²)', category: 'body', rating: 25, icon: <Shield className="w-4 h-4" /> },
  { id: 'arc_body_40', name: 'Arc Flash Suit (40 cal/cm²)', category: 'body', rating: 40, icon: <Shield className="w-4 h-4" /> },
  { id: 'arc_head_12', name: 'AR Face Shield + Balaclava (12 cal)', category: 'head_face', rating: 12, icon: <HardHat className="w-4 h-4" /> },
  { id: 'arc_head_40', name: 'Arc Flash Hood (40 cal/cm²)', category: 'head_face', rating: 40, icon: <HardHat className="w-4 h-4" /> },
  { id: 'arc_hands', name: 'Heavy Leather Gloves', category: 'hands', rating: 100, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'arc_acc', name: 'Safety Glasses & Earplugs', category: 'accessories', rating: 100, icon: <Glasses className="w-4 h-4" /> },
];

const SHOCK_AC_PPE: PPEItemDef[] = [
  { id: 'glove_ac_00', name: 'Class 00 Gloves (500V)', standard: 'ASTM D120', category: 'hands', rating: 500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_ac_0', name: 'Class 0 Gloves (1kV)', standard: 'ASTM D120', category: 'hands', rating: 1000, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_ac_1', name: 'Class 1 Gloves (7.5kV)', standard: 'ASTM D120', category: 'hands', rating: 7500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_ac_2', name: 'Class 2 Gloves (17kV)', standard: 'ASTM D120', category: 'hands', rating: 17000, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'shoes_eh', name: 'Dielectric Hard-Toe Boots', standard: 'ASTM F2413', category: 'feet', rating: 18000, icon: <Footprints className="w-4 h-4" /> },
];

const SHOCK_DC_PPE: PPEItemDef[] = [
  { id: 'glove_dc_00', name: 'Class 00 Gloves (750V)', standard: 'ASTM D120', category: 'hands', rating: 750, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_dc_0', name: 'Class 0 Gloves (1.5kV)', standard: 'ASTM D120', category: 'hands', rating: 1500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_dc_1', name: 'Class 1 Gloves (11.2kV)', standard: 'ASTM D120', category: 'hands', rating: 11250, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_dc_2', name: 'Class 2 Gloves (25.5kV)', standard: 'ASTM D120', category: 'hands', rating: 25500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'shoes_eh_dc', name: 'Dielectric Hard-Toe Boots', standard: 'ASTM F2413', category: 'feet', rating: 30000, icon: <Footprints className="w-4 h-4" /> },
];

const EARTH_FAULT_PPE: PPEItemDef[] = [
  { id: 'ef_glove_1', name: 'Class 1 Insulated Gloves (7.5kV)', standard: 'ASTM D120', category: 'hands', rating: 7500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'ef_shoes_eh', name: 'Dielectric Overboots (20kV)', standard: 'ASTM F1117', category: 'feet', rating: 20000, icon: <Footprints className="w-4 h-4" /> },
  { id: 'ef_helmet', name: 'Class E Industrial Helmet (20kV)', standard: 'ANSI Z89.1', category: 'head_face', rating: 20000, icon: <HardHat className="w-4 h-4" /> },
  { id: 'ef_mat', name: 'Insulating Grounding Mat', standard: 'ASTM D178', category: 'accessories', rating: 10000, icon: <Shield className="w-4 h-4" /> },
];

const STEP_TOUCH_PPE: PPEItemDef[] = [
  { id: 'st_shoes_1', name: 'Dielectric Boots Class 1 (7.5kV)', standard: 'ASTM F1117', category: 'feet', rating: 7500, icon: <Footprints className="w-4 h-4" /> },
  { id: 'st_shoes_2', name: 'Dielectric Boots Class 2 (20kV)', standard: 'ASTM F1117', category: 'feet', rating: 20000, icon: <Footprints className="w-4 h-4" /> },
  { id: 'st_glove', name: 'Class 00 Insulating Gloves (500V)', standard: 'ASTM D120', category: 'hands', rating: 500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'st_acc', name: 'ASTM Non-conductive Safety Glasses', standard: 'ANSI Z87.1', category: 'accessories', rating: 1000, icon: <Glasses className="w-4 h-4" /> },
];

interface PPEValidatorProps {
  hazardType: HazardType;
  hazardMagnitude: number; // cal/cm2 for arc, V for shock
  onSafetyChange?: (isSafe: boolean) => void;
}

export function PPEValidator({ hazardType, hazardMagnitude, onSafetyChange }: PPEValidatorProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const availableItems = useMemo(() => {
    switch (hazardType) {
      case 'arc_flash': return ARC_PPE;
      case 'shock_ac': return SHOCK_AC_PPE;
      case 'shock_dc': return SHOCK_DC_PPE;
      case 'earth_fault': return EARTH_FAULT_PPE;
      case 'step_touch': return STEP_TOUCH_PPE;
    }
  }, [hazardType]);

  // Quick preset selector for Arc Flash (4 CAL, 8 CAL, 25 CAL, 40 CAL)
  const selectQuickArcPreset = (calLevel: number) => {
    const next = new Set<string>();
    if (calLevel === 4) {
      next.add('arc_body_4');
      next.add('arc_head_12');
      next.add('arc_hands');
      next.add('arc_acc');
    } else if (calLevel === 8) {
      next.add('arc_body_8');
      next.add('arc_head_12');
      next.add('arc_hands');
      next.add('arc_acc');
    } else if (calLevel === 25) {
      next.add('arc_body_25');
      next.add('arc_head_40');
      next.add('arc_hands');
      next.add('arc_acc');
    } else if (calLevel === 40) {
      next.add('arc_body_40');
      next.add('arc_head_40');
      next.add('arc_hands');
      next.add('arc_acc');
    }
    setSelectedItemIds(next);
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        const itemCat = availableItems.find(i => i.id === id)?.category;
        Array.from(next).forEach(existingId => {
          if (availableItems.find(i => i.id === existingId)?.category === itemCat) {
            next.delete(existingId);
          }
        });
        next.add(id);
      }
      return next;
    });
  };

  // Required minimum CAL level
  const requiredCalLevel = useMemo(() => {
    if (hazardMagnitude >= 40) return 40;
    if (hazardMagnitude >= 25) return 40;
    if (hazardMagnitude >= 8) return 25;
    if (hazardMagnitude >= 4) return 8;
    return 4;
  }, [hazardMagnitude]);

  // Evaluation Logic
  const evalResult = useMemo(() => {
    const selected = availableItems.filter(i => selectedItemIds.has(i.id));
    const missing: string[] = [];
    let safe = false;

    if (hazardType === 'arc_flash') {
      const hasBody = selected.find(i => i.category === 'body');
      const hasFace = selected.find(i => i.category === 'head_face');
      const hasHands = selected.find(i => i.category === 'hands');
      const hasAcc = selected.find(i => i.category === 'accessories');

      if (!hasBody) missing.push("Arc-Rated Garment required.");
      else if (hasBody.rating < hazardMagnitude) missing.push(`Body protection (${hasBody.rating} cal/cm²) is lower than ${hazardMagnitude.toFixed(1)} cal/cm² hazard.`);

      if (!hasFace) missing.push("Arc-Rated Face/Head hood required.");
      else if (hasFace.rating < hazardMagnitude) missing.push(`Head protection (${hasFace.rating} cal) is insufficient.`);

      if (!hasHands) missing.push("Leather/AR Gloves required.");
      if (!hasAcc) missing.push("Eye & Hearing protection required.");

      safe = missing.length === 0;
    } else {
      const hasGloves = selected.find(i => i.category === 'hands');
      const hasFeet = selected.find(i => i.category === 'feet');

      if (!hasGloves) missing.push(`Insulating Gloves rated ≥ ${hazardMagnitude}V required.`);
      else if (hasGloves.rating < hazardMagnitude) missing.push(`Selected Gloves (${hasGloves.rating}V) inadequate for ${hazardMagnitude}V.`);

      safe = !!hasGloves && hasGloves.rating >= hazardMagnitude;
    }

    return { safe, missing };
  }, [selectedItemIds, availableItems, hazardType, hazardMagnitude]);

  useEffect(() => {
    onSafetyChange?.(evalResult.safe);
  }, [evalResult.safe, onSafetyChange]);

  return (
    <div className="p-3 border rounded-xl bg-[#020617] border-slate-750 shadow-lg flex flex-col mt-2 relative overflow-hidden shrink-0">
      {/* Background glow when safe */}
      <motion.div 
        className="absolute inset-0 bg-green-500/10 pointer-events-none" 
        animate={{ opacity: evalResult.safe ? 1 : 0 }} 
        transition={{ duration: 0.5 }}
      />
      
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-2.5 z-10 shrink-0">
        <div className="flex items-center gap-2 text-xs font-black text-slate-200 uppercase tracking-wider">
          <Shield className={cn("w-4 h-4", evalResult.safe ? "text-green-500" : "text-sky-400")} /> 
          <span>INTERACTIVE SAFETY VERIFICATION ENGINE</span>
        </div>
        
        {/* Pass/Fail Status Badge */}
        <span className={cn(
          "px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm",
          evalResult.safe ? "bg-green-500/20 text-green-300 border border-green-500/40" : "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
        )}>
          {evalResult.safe ? <><UserCheck className="w-3.5 h-3.5" /> PASS (Protected)</> : <><UserX className="w-3.5 h-3.5" /> FAIL (Hazard Exposure)</>}
        </span>
      </div>

      {/* Quick Cal Preset Buttons for Arc Flash */}
      {hazardType === 'arc_flash' && (
        <div className="flex items-center gap-1.5 mb-2.5 z-10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
          {[4, 8, 25, 40].map(cal => (
            <button
              key={cal}
              onClick={() => selectQuickArcPreset(cal)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer border",
                cal === requiredCalLevel
                  ? "bg-orange-500/30 border-orange-500 text-orange-300 ring-1 ring-orange-500"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
              )}
            >
              {cal} CAL {cal === requiredCalLevel && '(Req)'}
            </button>
          ))}
        </div>
      )}
      
      {/* Item Selection Grid */}
      <div className="flex flex-col gap-2 z-10 flex-1 min-h-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
          {availableItems.map(item => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={cn(
                "p-2 rounded-lg text-left text-xs uppercase font-bold tracking-wider flex items-center gap-2 transition-all border cursor-pointer",
                selectedItemIds.has(item.id) 
                  ? "bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm ring-1 ring-sky-500" 
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 hover:border-slate-600 hover:text-white"
              )}
            >
              <div className={cn("p-1 rounded-md shrink-0", selectedItemIds.has(item.id) ? "bg-sky-500/20 text-sky-400" : "bg-slate-900 text-slate-400")}>
                {item.icon}
              </div>
              <div className="flex-1 leading-snug">
                {item.name}
              </div>
              {selectedItemIds.has(item.id) && <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
            </button>
          ))}
        </div>

        {/* Manikin Status Banner */}
        <div className={cn(
          "p-2.5 rounded-xl border flex items-center gap-3 transition-all mt-2 shrink-0",
          evalResult.safe 
            ? "bg-green-500/10 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]" 
            : "bg-red-500/15 border-red-500/50"
        )}>
          {/* Manikin SVG Status Icon */}
          <div className="relative shrink-0">
            <svg viewBox="0 0 40 40" className="w-10 h-10">
              <circle cx="20" cy="10" r="6" fill={evalResult.safe ? "#22c55e" : "#ef4444"} />
              <path d="M 12 18 L 28 18 L 26 36 L 14 36 Z" fill={evalResult.safe ? "#22c55e" : "#ef4444"} />
              {!evalResult.safe && (
                <Flame className="w-5 h-5 text-orange-400 absolute top-1 left-2.5 animate-bounce" />
              )}
            </svg>
          </div>

          <div className="flex-1 text-left">
            <div className="text-xs font-black uppercase tracking-wider flex justify-between items-center">
              <span className={cn("flex items-center gap-1.5", evalResult.safe ? 'text-green-400' : 'text-red-400')}>
                {evalResult.safe ? <><CheckCircle className="w-4 h-4"/> Protected - PPE Rating Adequate</> : <><XCircle className="w-4 h-4"/> PPE Rating Exceeded - Severe Injury Hazard</>}
              </span>
              <span className="text-slate-300 font-mono text-xs font-bold">
                Exposure: {hazardMagnitude.toFixed(1)} cal/cm²
              </span>
            </div>

            {!evalResult.safe && evalResult.missing.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {evalResult.missing.map((mz, i) => (
                  <div key={i} className="text-xs text-red-300 font-mono flex items-start gap-1.5 leading-tight">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{mz}</span>
                  </div>
                ))}
              </div>
            )}
            {evalResult.safe && (
              <p className="text-xs text-green-300 font-mono mt-0.5 leading-snug">
                All selected Personal Protective Equipment exceeds the {hazardMagnitude.toFixed(1)} cal/cm² exposure threshold compliant with NFPA 70E.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
