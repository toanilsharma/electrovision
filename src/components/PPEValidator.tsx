import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Shield, HardHat, Footprints, Flame, HandMetal, Glasses, CheckCircle, AlertTriangle, UserCheck, UserX, Lightbulb, Info, ChevronDown, ChevronUp, X, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export type HazardType = 'arc_flash' | 'shock_ac' | 'shock_dc' | 'earth_fault' | 'step_touch';

export interface PPEItemDef {
  id: string;
  name: string;
  category: 'head_face' | 'body' | 'hands' | 'feet' | 'accessories';
  rating: number; // cal/cm2 for arc, V for AC/DC shock
  standard?: string;
  tooltipText: string;
  icon: React.ReactNode;
}

export const ARC_PPE: PPEItemDef[] = [
  { 
    id: 'arc_body_4', 
    name: 'AR Coverall (4 cal/cm²)', 
    standard: 'NFPA 70E Cat 1', 
    category: 'body', 
    rating: 4, 
    tooltipText: 'Recommended Use: Protects full body against arc flash thermal heat up to 4 cal/cm² (NFPA 70E Category 1). Standard for residential LV panel work.',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_body_8', 
    name: 'AR Suit (8 cal/cm²)', 
    standard: 'NFPA 70E Cat 2', 
    category: 'body', 
    rating: 8, 
    tooltipText: 'Recommended Use: Flame-resistant arc suit shielding body against thermal heat up to 8 cal/cm² (NFPA 70E Category 2).',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_body_25', 
    name: 'Arc Flash Suit (25 cal/cm²)', 
    standard: 'NFPA 70E Cat 3', 
    category: 'body', 
    rating: 25, 
    tooltipText: 'Recommended Use: Heavy arc flash protection suit rated up to 25 cal/cm² for high-energy industrial electrical panels.',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_body_40', 
    name: 'Heavy Arc Suit (40 cal/cm²)', 
    standard: 'NFPA 70E Cat 4', 
    category: 'body', 
    rating: 40, 
    tooltipText: 'Recommended Use: Maximum Category 4 arc flash suit rated up to 40 cal/cm² for extreme industrial arc hazards.',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_head_12', 
    name: 'Arc Face Shield (12 cal/cm²)', 
    standard: 'ASTM F2178', 
    category: 'head_face', 
    rating: 12, 
    tooltipText: 'Recommended Use: Arc-rated face shield protecting face & neck against thermal burn heat up to 12 cal/cm².',
    icon: <HardHat className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_head_40', 
    name: 'Arc Flash Hood (40 cal/cm²)', 
    standard: 'ASTM F2178', 
    category: 'head_face', 
    rating: 40, 
    tooltipText: 'Recommended Use: Full head arc hood providing 360° facial & neck thermal protection up to 40 cal/cm².',
    icon: <HardHat className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_hands', 
    name: 'Leather Protector Gloves', 
    standard: 'ASTM F696', 
    category: 'hands', 
    rating: 100, 
    tooltipText: 'Recommended Use: Heavy leather gloves protecting against thermal arc flash burns and sharp mechanical cuts.',
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_acc', 
    name: 'Eye Protection & Safety Glasses', 
    standard: 'ANSI Z87.1', 
    category: 'accessories', 
    rating: 100, 
    tooltipText: 'Recommended Use: Shields eyes from intense electrical flash sparks, flying blast debris, and UV radiation.',
    icon: <Glasses className="w-3.5 h-3.5" /> 
  },
];

export const SHOCK_AC_PPE: PPEItemDef[] = [
  { 
    id: 'glove_ac_00', 
    name: 'Class 00 Rubber Gloves (500V)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 500, 
    tooltipText: 'Recommended Voltage: Protects hands against AC electric shock up to 500 Volts (0.5kV AC). Standard worldwide for residential LV electrical work.',
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'glove_ac_0', 
    name: 'Class 0 Rubber Gloves (1kV)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 1000, 
    tooltipText: 'Recommended Voltage: Insulates hands against AC electric shock up to 1,000 Volts (1kV AC). Standard low voltage electrical glove.',
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'glove_ac_1', 
    name: 'Class 1 HV Gloves (7.5kV)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 7500, 
    tooltipText: 'Recommended Voltage: High-voltage insulation up to 7,500 Volts AC (7.5kV). Essential for medium voltage industrial substations & transformers.',
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'glove_ac_2', 
    name: 'Class 2 HV Gloves (17kV)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 17000, 
    tooltipText: 'Recommended Voltage: Heavy high-voltage hand insulation up to 17,000 Volts AC (17kV). Maximum industrial hand shock protection.',
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'glove_leather_ac', 
    name: 'Leather Protector Gloves', 
    standard: 'ASTM F696', 
    category: 'hands', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Worn OVER rubber insulating gloves to protect them against sharp cuts, punctures, and mechanical tears.',
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'shoes_eh', 
    name: 'Dielectric EH Boots (18kV)', 
    standard: 'ASTM F2413', 
    category: 'feet', 
    rating: 18000, 
    tooltipText: 'Recommended Voltage: Dielectric safety boots rated up to 18,000 Volts (18kV). Stops electric current from returning to earth ground through your feet.',
    icon: <Footprints className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'glasses_ac', 
    name: 'Eye Protection & Safety Glasses', 
    standard: 'ANSI Z87.1', 
    category: 'accessories', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Protects eyes from electrical arcing sparks, flying debris particles, and UV radiation (ANSI Z87.1 approved).',
    icon: <Glasses className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'face_shield_ac', 
    name: 'Arc Face Shield (12 cal)', 
    standard: 'NFPA 70E / ASTM F2178', 
    category: 'head_face', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Protects face and neck against arc flash heat up to 12 cal/cm² and flying sparks.',
    icon: <HardHat className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'ifr_suit_ac', 
    name: 'Arc / IFR Suit (8 cal/cm²)', 
    standard: 'NFPA 70E / IEC 61482', 
    category: 'body', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Flame-resistant suit shielding full body against thermal arc burns up to 8 cal/cm² per NFPA 70E standards.',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'helmet_ac', 
    name: 'Class E Safety Helmet (20kV)', 
    standard: 'ANSI Z89.1 Class E', 
    category: 'head_face', 
    rating: 20000, 
    tooltipText: 'Recommended Voltage: Electrical insulating hard hat protecting head against overhead line contact up to 20,000 Volts (20kV).',
    icon: <HardHat className="w-3.5 h-3.5" /> 
  },
];

export const SHOCK_DC_PPE: PPEItemDef[] = [
  { 
    id: 'glove_dc_00', 
    name: 'Class 00 Rubber Gloves (750V DC)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 750, 
    tooltipText: 'Recommended Voltage: Protects hands against DC electric shock up to 750V DC. Standard worldwide for residential solar PV & EV battery systems.', 
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'glove_leather_dc', 
    name: 'Leather Protector Gloves', 
    standard: 'ASTM F696', 
    category: 'hands', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Worn OVER rubber insulating gloves to protect against cuts and mechanical tears.', 
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'glove_dc_0', 
    name: 'Class 0 Gloves (1.5kV DC)', 
    standard: 'IEC 60903', 
    category: 'hands', 
    rating: 1500, 
    tooltipText: 'Insulates up to 1,500V DC for industrial solar PV arrays & traction.', 
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'glove_dc_1', 
    name: 'Class 1 HV Gloves (11.2kV DC)', 
    standard: 'IEC 60903', 
    category: 'hands', 
    rating: 11250, 
    tooltipText: 'High voltage DC up to 11.25kV for industrial substations.', 
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'glove_dc_2', 
    name: 'Class 2 HV Gloves (25.5kV DC)', 
    standard: 'IEC 60903', 
    category: 'hands', 
    rating: 25500, 
    tooltipText: 'Heavy high voltage DC up to 25.5kV for utility HVDC installations.', 
    icon: <HandMetal className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'shoes_eh_dc', 
    name: 'Dielectric EH Boots (18kV)', 
    standard: 'ASTM F2413', 
    category: 'feet', 
    rating: 18000, 
    tooltipText: 'Dielectric safety boots providing ground insulation.', 
    icon: <Footprints className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'glasses_dc', 
    name: 'Eye Protection & Safety Glasses', 
    standard: 'ANSI Z87.1', 
    category: 'accessories', 
    rating: 1000, 
    tooltipText: 'Shields eyes from electrical sparks and flying particles.', 
    icon: <Glasses className="w-3.5 h-3.5" /> 
  },
];

export const EARTH_FAULT_PPE: PPEItemDef[] = [
  { id: 'ef_glove_0', name: 'Class 0 Rubber Gloves (1kV)', standard: 'IEC 60903', category: 'hands', rating: 1000, tooltipText: 'Safe up to 1,000 Volts.', icon: <HandMetal className="w-3.5 h-3.5" /> },
  { id: 'ef_glove_1', name: 'Class 1 HV Gloves (7.5kV)', standard: 'IEC 60903', category: 'hands', rating: 7500, tooltipText: 'High-voltage insulation up to 7.5kV.', icon: <HandMetal className="w-3.5 h-3.5" /> },
  { id: 'ef_shoes_eh', name: 'Dielectric Boots (20kV)', standard: 'ASTM F1117', category: 'feet', rating: 20000, tooltipText: 'Dielectric boots up to 20kV.', icon: <Footprints className="w-3.5 h-3.5" /> },
  { id: 'ef_glasses', name: 'Eye Protection & Glasses', standard: 'ANSI Z87.1', category: 'accessories', rating: 1000, tooltipText: 'Eye protection.', icon: <Glasses className="w-3.5 h-3.5" /> },
];

export const STEP_TOUCH_PPE: PPEItemDef[] = [
  { id: 'st_shoes_1', name: 'Dielectric Boots (7.5kV)', standard: 'ASTM F1117', category: 'feet', rating: 7500, tooltipText: 'Dielectric boots up to 7.5kV.', icon: <Footprints className="w-3.5 h-3.5" /> },
  { id: 'st_shoes_2', name: 'Dielectric Boots (20kV)', standard: 'ASTM F1117', category: 'feet', rating: 20000, tooltipText: 'High-voltage dielectric boots up to 20kV.', icon: <Footprints className="w-3.5 h-3.5" /> },
  { id: 'st_glove_00', name: 'Class 00 Gloves (500V)', standard: 'IEC 60903', category: 'hands', rating: 500, tooltipText: 'Safe up to 500 Volts.', icon: <HandMetal className="w-3.5 h-3.5" /> },
  { id: 'st_glove_1', name: 'Class 1 HV Gloves (7.5kV)', standard: 'IEC 60903', category: 'hands', rating: 7500, tooltipText: 'High-voltage gloves up to 7.5kV.', icon: <HandMetal className="w-3.5 h-3.5" /> },
];

interface PPEValidatorProps {
  hazardType: HazardType;
  hazardMagnitude: number;
  environment?: 'residential' | 'industrial';
  onSafetyChange?: (isSafe: boolean, selectedPPENames?: string[]) => void;
}

export function PPEValidator({ hazardType, hazardMagnitude, environment, onSafetyChange }: PPEValidatorProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableItems = useMemo(() => {
    let items: PPEItemDef[] = [];
    switch (hazardType) {
      case 'arc_flash': items = ARC_PPE; break;
      case 'shock_ac': items = SHOCK_AC_PPE; break;
      case 'shock_dc': items = SHOCK_DC_PPE; break;
      case 'earth_fault': items = EARTH_FAULT_PPE; break;
      case 'step_touch': items = STEP_TOUCH_PPE; break;
    }

    // Filter for residential environment: Exclude industrial high voltage & high arc flash gear
    if (environment === 'residential') {
      return items.filter(item => {
        // Exclude industrial high-voltage gloves (>1000V AC / >750V DC)
        if (hazardType === 'shock_ac' && item.category === 'hands' && item.rating > 1000) return false;
        if (hazardType === 'shock_dc' && item.category === 'hands' && item.rating > 750) return false;
        // Exclude 20kV Class E substation helmets in residential
        if (item.category === 'head_face' && item.rating > 1000) return false;
        // Exclude heavy 25cal and 40cal industrial arc flash suits/hoods in residential
        if (hazardType === 'arc_flash' && item.rating > 12) return false;
        return true;
      });
    }

    return items;
  }, [hazardType, environment]);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
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

  const autoSelectRecommended = () => {
    const next = new Set<string>();
    if (hazardType === 'arc_flash') {
      const body = availableItems.find(i => i.category === 'body' && i.rating >= hazardMagnitude) || availableItems.find(i => i.category === 'body');
      const head = availableItems.find(i => i.category === 'head_face' && i.rating >= hazardMagnitude) || availableItems.find(i => i.category === 'head_face');
      const hands = availableItems.find(i => i.category === 'hands');
      const acc = availableItems.find(i => i.category === 'accessories');
      if (body) next.add(body.id);
      if (head) next.add(head.id);
      if (hands) next.add(hands.id);
      if (acc) next.add(acc.id);
    } else {
      const glove = availableItems.find(i => i.category === 'hands' && i.rating >= hazardMagnitude) || availableItems.find(i => i.category === 'hands');
      const boots = availableItems.find(i => i.category === 'feet' && i.rating >= hazardMagnitude) || availableItems.find(i => i.category === 'feet');
      if (glove) next.add(glove.id);
      if (boots) next.add(boots.id);
    }
    setSelectedItemIds(next);
  };

  const clearAll = () => {
    setSelectedItemIds(new Set());
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

      if (!hasBody) missing.push("Arc-Rated Suit");
      else if (hasBody.rating < hazardMagnitude) missing.push(`Suit rated ≥ ${hazardMagnitude.toFixed(0)} cal`);

      if (!hasFace) missing.push("Arc Hood");
      else if (hasFace.rating < hazardMagnitude) missing.push(`Hood rated ≥ ${hazardMagnitude.toFixed(0)} cal`);

      if (!hasHands) missing.push("Leather Gloves");
      if (!hasAcc) missing.push("Safety Glasses");

      safe = missing.length === 0;
    } else {
      const hasGloves = selected.find(i => i.category === 'hands' && i.rating >= hazardMagnitude);
      if (!hasGloves) {
        missing.push(`Insulating Gloves rated ≥ ${hazardMagnitude}V`);
      }
      safe = !!hasGloves;
    }

    return { safe, missing, selectedItems: selected, selectedNames: selected.map(s => s.name) };
  }, [selectedItemIds, availableItems, hazardType, hazardMagnitude]);

  // Guard against infinite render loop by tracking previous evaluation values
  const prevEvalRef = useRef<{ safe: boolean; namesKey: string }>({ safe: false, namesKey: '' });

  useEffect(() => {
    const namesKey = evalResult.selectedNames.join('|');
    if (prevEvalRef.current.safe !== evalResult.safe || prevEvalRef.current.namesKey !== namesKey) {
      prevEvalRef.current = { safe: evalResult.safe, namesKey };
      onSafetyChange?.(evalResult.safe, evalResult.selectedNames);
    }
  }, [evalResult.safe, evalResult.selectedNames, onSafetyChange]);

  const recommendedGlove = useMemo(() => {
    return availableItems.find(i => i.category === 'hands' && i.rating >= hazardMagnitude);
  }, [availableItems, hazardMagnitude]);

  return (
    <div className="space-y-2 relative z-30" ref={dropdownRef}>
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className={cn("w-4 h-4", evalResult.safe ? "text-emerald-400" : "text-orange-400")} />
          <span>PPE Selection {environment === 'residential' && <span className="text-[9px] font-mono text-amber-300 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/40">RESIDENTIAL</span>}</span>
        </label>
        <span className={cn(
          "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border shadow-sm",
          evalResult.safe
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
            : "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
        )}>
          {evalResult.safe ? <><UserCheck className="w-3 h-3 text-emerald-400" /> PROTECTED</> : <><UserX className="w-3 h-3 text-rose-400" /> UNPROTECTED</>}
        </span>
      </div>

      {/* Perfectly Proportioned Compact Multi-Select Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-slate-950 text-left rounded-xl px-3 py-2 flex items-center justify-between transition-all cursor-pointer shadow-md border select-none",
          isOpen
            ? "border-orange-400 ring-1 ring-orange-500/40 bg-slate-900"
            : "border-slate-800 hover:border-orange-500/60 hover:bg-slate-900/80"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="p-1 rounded-lg bg-orange-500/20 border border-orange-500/50 text-orange-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
              {evalResult.selectedItems.length === 0
                ? "Select Required PPE Gear..."
                : `${evalResult.selectedItems.length} PPE Item${evalResult.selectedItems.length > 1 ? 's' : ''} Equipped`}
            </span>
            <span className="text-[10px] font-mono text-slate-400 truncate">
              {evalResult.selectedItems.length === 0
                ? "Click to choose safety gear"
                : evalResult.selectedItems.map(i => i.name).join(', ')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-400/60">
            {evalResult.selectedItems.length}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Compact Interactive Tags for Selected Items */}
      {evalResult.selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {evalResult.selectedItems.map(item => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-orange-500/50 text-orange-200 text-xs font-bold shadow-sm"
            >
              <span className="shrink-0 text-orange-400">{item.icon}</span>
              <span className="truncate max-w-[170px]">{item.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
                className="hover:bg-orange-500/30 p-0.5 rounded text-orange-300 hover:text-white transition-colors cursor-pointer ml-0.5"
                title="Remove PPE"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Compact Dropdown Options Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-2"
          >
            {/* Quick Action Header Bar */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 gap-2">
              <button
                type="button"
                onClick={autoSelectRecommended}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                ⚡ Auto-Select Rated PPE
              </button>
              {selectedItemIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-2 py-1 text-[10.5px] font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg bg-slate-900 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 hidden-scrollbar">
              {availableItems.map(item => {
                const isSelected = selectedItemIds.has(item.id);
                const isRecommended = recommendedGlove?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "p-2 rounded-lg text-left transition-all border cursor-pointer flex items-center justify-between gap-2 select-none shadow-sm",
                      isSelected
                        ? "bg-orange-500/15 border-orange-500/70 text-white"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-orange-500/40 hover:text-white"
                    )}
                    title={item.tooltipText}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Checkbox */}
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors font-bold",
                        isSelected
                          ? "bg-orange-500 border-orange-400 text-slate-950"
                          : "border-slate-700 bg-slate-950"
                      )}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="p-1 rounded bg-slate-950 border border-slate-800 text-orange-400 shrink-0">
                        {item.icon}
                      </div>

                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          {item.name}
                          {isRecommended && (
                            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black shrink-0">
                              RECOMMENDED
                            </span>
                          )}
                        </span>
                        <span className="text-[9.5px] font-mono text-slate-400 truncate">
                          {item.standard || `${item.rating}${hazardType === 'arc_flash' ? ' cal/cm²' : 'V'}`}
                        </span>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 uppercase",
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    )}>
                      {isSelected ? "EQUIPPED" : "WEAR"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Instruction Footer inside popover */}
            <div className="pt-1.5 border-t border-slate-800 text-[10.5px] text-slate-400 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Select gear rated ≥ {hazardMagnitude.toFixed(0)}{hazardType === 'arc_flash' ? ' cal/cm²' : 'V'} for 100% protection.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety Alert Banner */}
      {!evalResult.safe && recommendedGlove && (
        <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Equip <strong className="text-amber-300 font-bold underline">{recommendedGlove.name}</strong> to prevent shock.
          </span>
        </div>
      )}
    </div>
  );
}
