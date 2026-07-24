import React, { useState, useMemo, useEffect } from 'react';
import { Shield, HardHat, Footprints, Flame, HandMetal, Glasses, CheckCircle, XCircle, AlertTriangle, UserCheck, UserX, Lightbulb, Info } from 'lucide-react';
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
  { id: 'arc_head_12', name: 'AR Face Shield (12 cal)', category: 'head_face', rating: 12, icon: <HardHat className="w-4 h-4" /> },
  { id: 'arc_head_40', name: 'Arc Flash Hood (40 cal)', category: 'head_face', rating: 40, icon: <HardHat className="w-4 h-4" /> },
  { id: 'arc_hands', name: 'Heavy Leather Gloves', category: 'hands', rating: 100, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'arc_acc', name: 'Safety Glasses & Earplugs', category: 'accessories', rating: 100, icon: <Glasses className="w-4 h-4" /> },
];

const SHOCK_AC_PPE: PPEItemDef[] = [
  { id: 'glove_ac_00', name: 'Class 00 Gloves (500V)', standard: 'ASTM D120', category: 'hands', rating: 500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_ac_0', name: 'Class 0 Gloves (1kV)', standard: 'ASTM D120', category: 'hands', rating: 1000, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_ac_1', name: 'Class 1 Gloves (7.5kV)', standard: 'ASTM D120', category: 'hands', rating: 7500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_ac_2', name: 'Class 2 Gloves (17kV)', standard: 'ASTM D120', category: 'hands', rating: 17000, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'shoes_eh', name: 'Dielectric Boots (18kV)', standard: 'ASTM F2413', category: 'feet', rating: 18000, icon: <Footprints className="w-4 h-4" /> },
];

const SHOCK_DC_PPE: PPEItemDef[] = [
  { id: 'glove_dc_00', name: 'Class 00 Gloves (750V)', standard: 'ASTM D120', category: 'hands', rating: 750, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_dc_0', name: 'Class 0 Gloves (1.5kV)', standard: 'ASTM D120', category: 'hands', rating: 1500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_dc_1', name: 'Class 1 Gloves (11.2kV)', standard: 'ASTM D120', category: 'hands', rating: 11250, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'glove_dc_2', name: 'Class 2 Gloves (25.5kV)', standard: 'ASTM D120', category: 'hands', rating: 25500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'shoes_eh_dc', name: 'Dielectric Boots (30kV)', standard: 'ASTM F2413', category: 'feet', rating: 30000, icon: <Footprints className="w-4 h-4" /> },
];

const EARTH_FAULT_PPE: PPEItemDef[] = [
  { id: 'ef_glove_1', name: 'Class 1 Gloves (7.5kV)', standard: 'ASTM D120', category: 'hands', rating: 7500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'ef_shoes_eh', name: 'Dielectric Boots (20kV)', standard: 'ASTM F1117', category: 'feet', rating: 20000, icon: <Footprints className="w-4 h-4" /> },
  { id: 'ef_helmet', name: 'Class E Helmet (20kV)', standard: 'ANSI Z89.1', category: 'head_face', rating: 20000, icon: <HardHat className="w-4 h-4" /> },
  { id: 'ef_mat', name: 'Insulating Mat (10kV)', standard: 'ASTM D178', category: 'accessories', rating: 10000, icon: <Shield className="w-4 h-4" /> },
];

const STEP_TOUCH_PPE: PPEItemDef[] = [
  { id: 'st_shoes_1', name: 'Dielectric Boots (7.5kV)', standard: 'ASTM F1117', category: 'feet', rating: 7500, icon: <Footprints className="w-4 h-4" /> },
  { id: 'st_shoes_2', name: 'Dielectric Boots (20kV)', standard: 'ASTM F1117', category: 'feet', rating: 20000, icon: <Footprints className="w-4 h-4" /> },
  { id: 'st_glove', name: 'Class 00 Gloves (500V)', standard: 'ASTM D120', category: 'hands', rating: 500, icon: <HandMetal className="w-4 h-4" /> },
  { id: 'st_acc', name: 'Safety Glasses', standard: 'ANSI Z87.1', category: 'accessories', rating: 1000, icon: <Glasses className="w-4 h-4" /> },
];

interface PPEValidatorProps {
  hazardType: HazardType;
  hazardMagnitude: number; // cal/cm2 for arc, V for shock
  onSafetyChange?: (isSafe: boolean, selectedPPENames?: string[]) => void;
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

  const selectQuickArcPreset = (calLevel: number) => {
    const next = new Set<string>();
    if (calLevel === 4) {
      next.add('arc_body_4'); next.add('arc_head_12'); next.add('arc_hands'); next.add('arc_acc');
    } else if (calLevel === 8) {
      next.add('arc_body_8'); next.add('arc_head_12'); next.add('arc_hands'); next.add('arc_acc');
    } else if (calLevel === 25) {
      next.add('arc_body_25'); next.add('arc_head_40'); next.add('arc_hands'); next.add('arc_acc');
    } else if (calLevel === 40) {
      next.add('arc_body_40'); next.add('arc_head_40'); next.add('arc_hands'); next.add('arc_acc');
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

      if (!hasBody) missing.push("Arc-Rated Suit");
      else if (hasBody.rating < hazardMagnitude) missing.push(`Suit rated ≥ ${hazardMagnitude.toFixed(0)} cal`);

      if (!hasFace) missing.push("Arc Hood");
      else if (hasFace.rating < hazardMagnitude) missing.push(`Hood rated ≥ ${hazardMagnitude.toFixed(0)} cal`);

      if (!hasHands) missing.push("Leather Gloves");
      if (!hasAcc) missing.push("Safety Glasses");

      safe = missing.length === 0;
    } else {
      const hasGloves = selected.find(i => i.category === 'hands');

      if (!hasGloves) missing.push(`Insulating Gloves rated ≥ ${hazardMagnitude}V`);
      else if (hasGloves.rating < hazardMagnitude) missing.push(`Gloves rated ≥ ${hazardMagnitude}V (Current: ${hasGloves.rating}V)`);

      safe = !!hasGloves && hasGloves.rating >= hazardMagnitude;
    }

    return { safe, missing, selectedNames: selected.map(s => s.name) };
  }, [selectedItemIds, availableItems, hazardType, hazardMagnitude]);

  useEffect(() => {
    onSafetyChange?.(evalResult.safe, evalResult.selectedNames);
  }, [evalResult.safe, evalResult.selectedNames, onSafetyChange]);

  // Find recommended item to achieve safety easily
  const recommendedItem = useMemo(() => {
    if (evalResult.safe) return null;
    return availableItems.find(i => i.rating >= hazardMagnitude);
  }, [evalResult.safe, availableItems, hazardMagnitude]);

  return (
    <div className="p-3 border-2 rounded-2xl bg-slate-950/95 border-slate-800 shadow-xl flex flex-col mt-2 relative shrink-0">
      {/* Background glow when safe */}
      <motion.div 
        className="absolute inset-0 bg-emerald-500/10 pointer-events-none rounded-2xl" 
        animate={{ opacity: evalResult.safe ? 1 : 0 }} 
        transition={{ duration: 0.5 }}
      />
      
      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2 z-10 shrink-0">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-white uppercase tracking-wider">
          <Shield className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0", evalResult.safe ? "text-emerald-400" : "text-sky-400")} /> 
          <span>Safety Verification Engine</span>
        </div>
        
        {/* Pass/Fail Status Badge */}
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md border shrink-0",
          evalResult.safe
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
            : "bg-rose-500/25 text-rose-200 border-rose-500/60 animate-pulse"
        )}>
          {evalResult.safe ? <><UserCheck className="w-3.5 h-3.5 text-emerald-400" /> PASS (Insulated)</> : <><UserX className="w-3.5 h-3.5 text-rose-400" /> UNPROTECTED (Hazard Risk)</>}
        </span>
      </div>

      {/* Clear Instruction Banner with Vibrant Visibility */}
      <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/50 to-slate-900 border border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] rounded-xl p-2.5 mb-2.5 flex items-start sm:items-center gap-2 text-xs sm:text-sm font-semibold text-slate-100 z-10 leading-snug">
        <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 animate-pulse drop-shadow-[0_0_8px_rgba(252,211,77,0.8)] mt-0.5 sm:mt-0" />
        <div>
          <span className="font-black text-amber-300 uppercase tracking-wide mr-1 block sm:inline">Instruction:</span>
          <span>To get safety & PASS status, select the required PPE gear buttons below rated for your system voltage (</span>
          <span className="text-amber-300 font-black font-mono px-1.5 py-0.5 bg-amber-950 rounded border border-amber-400/60 shadow-sm">
            {hazardMagnitude.toFixed(0)}{hazardType === 'arc_flash' ? ' cal/cm²' : 'V'}
          </span>
          <span>).</span>
        </div>
      </div>

      {/* Quick Cal Presets for Arc Flash */}
      {hazardType === 'arc_flash' && (
        <div className="flex items-center gap-1.5 mb-2.5 z-10 flex-wrap">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Presets:</span>
          {[4, 8, 25, 40].map(cal => (
            <button
              key={cal}
              onClick={() => selectQuickArcPreset(cal)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border active:scale-95",
                cal === requiredCalLevel
                  ? "bg-orange-500/30 border-orange-500 text-orange-300 ring-1 ring-orange-500"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
              )}
            >
              {cal} CAL
            </button>
          ))}
        </div>
      )}
      
      {/* High-Visibility PPE Selection Buttons Grid (1-column on mobile, 2-column on tablet/desktop) */}
      <div className="flex flex-col gap-2 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableItems.map(item => {
            const isSelected = selectedItemIds.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={cn(
                  "p-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider flex items-center justify-between gap-2.5 transition-all border cursor-pointer active:scale-98 shadow-sm min-h-[44px]",
                  isSelected 
                    ? "bg-sky-500/25 border-sky-400 text-white shadow-[0_0_14px_rgba(56,189,248,0.4)] ring-1 ring-sky-400" 
                    : "bg-slate-900/90 border-slate-750 text-slate-200 hover:border-slate-600 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn("p-1.5 rounded-lg shrink-0 transition-colors", isSelected ? "bg-sky-400 text-slate-950 font-bold" : "bg-slate-950 text-slate-400 border border-slate-800")}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="block font-black tracking-wide text-xs text-white truncate">{item.name}</span>
                    {item.standard && <span className="text-[9px] font-mono text-slate-400 font-bold">{item.standard}</span>}
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle className="w-4 h-4 text-sky-300 shrink-0" />
                ) : (
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 shrink-0">
                    SELECT
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Status / Suggestion Banner */}
        <div className={cn(
          "p-2.5 rounded-xl border flex items-center gap-2.5 transition-all shrink-0 mt-0.5",
          evalResult.safe 
            ? "bg-emerald-950/60 border-emerald-500/60" 
            : "bg-rose-950/60 border-rose-500/60"
        )}>
          <div className="shrink-0">
            {evalResult.safe ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
            )}
          </div>

          <div className="flex-1 min-w-0 text-left">
            {evalResult.safe ? (
              <div className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                ✓ PPE Insulation Active — Full Body Protection Confirmed
              </div>
            ) : (
              <div className="text-xs font-medium text-rose-200 leading-tight">
                <span className="font-black uppercase text-rose-300">Action Required: </span>
                {recommendedItem ? (
                  <span>Click <strong className="text-white underline font-black">{recommendedItem.name}</strong> above to protect against {hazardMagnitude.toFixed(0)}{hazardType === 'arc_flash' ? ' cal' : 'V'} hazard.</span>
                ) : (
                  <span>Select required PPE items above to insulate operator.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
