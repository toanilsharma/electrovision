import React, { useState, useMemo, useEffect } from 'react';
import { Shield, HardHat, Footprints, Flame, HandMetal, Glasses, CheckCircle } from 'lucide-react';
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

  // In real life, switching hazard types should reset selections if they differ, or just filter safely.
  const availableItems = useMemo(() => {
    switch (hazardType) {
      case 'arc_flash': return ARC_PPE;
      case 'shock_ac': return SHOCK_AC_PPE;
      case 'shock_dc': return SHOCK_DC_PPE;
      case 'earth_fault': return EARTH_FAULT_PPE;
      case 'step_touch': return STEP_TOUCH_PPE;
    }
  }, [hazardType]);

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        // Enforce single selection per category for simplicity (e.g., only one pair of gloves)
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
      else if (hasBody.rating < hazardMagnitude) missing.push(`Selected AR body protection (${hasBody.rating} cal) is insufficient for ${hazardMagnitude.toFixed(1)} cal/cm² hazard.`);

      if (!hasFace) missing.push("Arc-Rated Face/Head protection required.");
      else if (hasFace.rating < hazardMagnitude) missing.push(`Selected AR head protection (${hasFace.rating} cal) is insufficient.`);

      if (!hasHands) missing.push("Leather/AR Gloves required.");
      if (!hasAcc) missing.push("Eye & Hearing protection required (NFPA 70E).");

      safe = missing.length === 0;
    } else if (hazardType === 'earth_fault') {
      const hasGloves = selected.find(i => i.category === 'hands');
      const hasFeet = selected.find(i => i.category === 'feet');
      const hasHelmet = selected.find(i => i.category === 'head_face');

      if (!hasGloves) missing.push(`Class 1 Insulated Gloves (7.5kV) required for earth fault intervention.`);
      if (!hasFeet) missing.push(`Dielectric Overboots (20kV) required to mitigate Ground Potential Rise.`);
      if (!hasHelmet) missing.push(`Class E Industrial Helmet (20kV) recommended to prevent overhead flashover arc hazards.`);

      safe = !!hasGloves && !!hasFeet;
    } else if (hazardType === 'step_touch') {
      const hasFeet = selected.find(i => i.category === 'feet');
      const hasGloves = selected.find(i => i.category === 'hands');

      if (!hasFeet) missing.push(`Dielectric Boots Class 1 or 2 required to isolate step voltage potential.`);
      else if (hasFeet.rating < hazardMagnitude) missing.push(`Dielectric footwear rating (${hasFeet.rating}V) is inadequate for ${hazardMagnitude}V gradient.`);
      
      // If close to the fault (touch potential zone < 2m), require insulating gloves
      const needsGloves = hazardMagnitude > 5000; // using hazardMagnitude to convey proximity/touch potential voltage in step_touch
      if (needsGloves && !hasGloves) {
        missing.push("Insulating Gloves required within critical touch potential radius (<2m).");
      }

      safe = !!hasFeet && hasFeet.rating >= hazardMagnitude && (!needsGloves || !!hasGloves);
    } else {
      // AC or DC Shock
      const hasGloves = selected.find(i => i.category === 'hands');
      const hasFeet = selected.find(i => i.category === 'feet');

      if (!hasGloves) missing.push(`Insulating Gloves rated for ≥ ${hazardMagnitude}V required.`);
      else if (hasGloves.rating < hazardMagnitude) missing.push(`Selected Gloves (${hasGloves.rating}V) are inadequate for ${hazardMagnitude}V exposure.`);

      // Optional but highly recommended: Di-electric boots
      if (!hasFeet && hazardMagnitude > 50) missing.push("EH Footwear strongly recommended/required depending on step hazard.");
      else if (hasFeet && hasFeet.rating < hazardMagnitude) missing.push(`Selected Footwear may not withstand full system voltage.`);

      safe = !!hasGloves && hasGloves.rating >= hazardMagnitude && (!hasFeet || hasFeet.rating >= hazardMagnitude);
      // Wait, EH shoes are recommended, if they are missing but gloves are fine, we could say "Partial" or "Safe but warning". 
      // Let's enforce both for absolute safety in the sim.
      if (safe && !hasFeet && hazardMagnitude > 50) {
        safe = false; // Overriding to false just to be strict
      }
    }

    return { safe, missing };
  }, [selectedItemIds, availableItems, hazardType, hazardMagnitude]);

  // Synchronize safety status with parent components
  useEffect(() => {
    onSafetyChange?.(evalResult.safe);
  }, [evalResult.safe, onSafetyChange]);

  return (
    <div className="p-2 border rounded-xl bg-[#020617] border-slate-700/50 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] flex flex-col mt-2 relative overflow-hidden shrink-0">
      {/* Background glow when safe */}
      <motion.div 
        className="absolute inset-0 bg-green-500/10 pointer-events-none" 
        animate={{ opacity: evalResult.safe ? 1 : 0 }} 
        transition={{ duration: 0.5 }}
      />
      
      <div className="flex justify-between items-center mb-2 z-10 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-[#cbd5e1] uppercase">
          <Shield className={cn("w-4 h-4", evalResult.safe ? "text-green-500" : "text-sky-400")} /> 
          Interactive Safety Verification Engine
        </div>
        <div className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider hidden sm:block">
           {hazardType === 'arc_flash' ? 'IEC 61482 / NFPA 70E' : 'ASTM D120 / IEC 60903'}
        </div>
      </div>
      
      <div className="flex flex-col gap-2 z-10 flex-1 min-h-0">
         <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-2">
            {availableItems.map(item => (
               <button
                 key={item.id}
                 onClick={() => toggleItem(item.id)}
                 className={cn(
                   "p-1.5 md:p-2 rounded-lg text-left text-[10px] md:text-xs uppercase font-bold tracking-wider flex items-center gap-2 transition-all border cursor-pointer",
                   selectedItemIds.has(item.id) 
                     ? "bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm ring-1 ring-sky-500" 
                     : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 hover:border-slate-600 hover:text-white"
                 )}
               >
                 <div className={cn("p-1 rounded-md", selectedItemIds.has(item.id) ? "bg-sky-500/20 text-sky-400" : "bg-slate-900 text-slate-400")}>
                   {item.icon}
                 </div>
                 <div className="flex-1 leading-snug">
                   {item.name}
                   {item.standard && <span className="block text-[9px] text-slate-400 mt-0.5">{item.standard}</span>}
                 </div>
                 {selectedItemIds.has(item.id) && <CheckCircle className="w-3.5 h-3.5 text-sky-400" />}
               </button>
            ))}
         </div>

         <div className={cn(
            "p-2 rounded-xl border flex flex-col gap-1 transition-all mt-2 shrink-0",
            evalResult.safe 
              ? "bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]" 
              : "bg-red-500/10 border-red-500/30"
         )}>
           <span className="text-xs font-bold uppercase tracking-wide flex justify-between items-center">
              <span className={cn("flex items-center gap-1.5", evalResult.safe ? 'text-green-400' : 'text-red-400')}>
                {evalResult.safe ? <><CheckCircle className="w-4 h-4"/> Criteria Met: Safe</> : <><Flame className="w-4 h-4"/> Inadequate PPE Selected</>}
              </span>
              <span className="text-slate-300 font-mono text-xs">
                Hazard: {hazardType === 'arc_flash' ? `${hazardMagnitude.toFixed(1)} cal/cm²` : `${Math.round(hazardMagnitude)}V`}
              </span>
           </span>
           
           {!evalResult.safe && evalResult.missing.length > 0 && (
             <div className="mt-1 space-y-1">
               {evalResult.missing.map(mz => (
                 <div key={mz} className="text-xs text-red-300 font-mono flex items-start gap-2 leading-tight">
                   <span className="text-red-500 mt-[1px]">●</span> <span className="flex-1">{mz}</span>
                 </div>
               ))}
             </div>
           )}
           {evalResult.safe && (
             <span className="text-xs text-green-300 font-mono mt-0.5 leading-tight">
               All selected Personal Protective Equipment exceeds the incident exposure threshold.
             </span>
           )}
         </div>
      </div>
    </div>
  );
}
