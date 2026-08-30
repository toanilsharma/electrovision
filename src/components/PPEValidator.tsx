import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Shield, HardHat, Footprints, Flame, HandMetal, Glasses, CheckCircle, AlertTriangle, UserCheck, UserX, Lightbulb, Info, ChevronDown, ChevronUp, X, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export type HazardType = 'arc_flash' | 'shock_ac' | 'shock_dc' | 'earth_fault' | 'step_touch';

export interface PPEItemDef {
  id: string;
  name: string;
  category: 'head_face' | 'body' | 'hands' | 'feet' | 'accessories' | 'ensemble';
  rating: number; // cal/cm2 for arc, V for AC/DC shock
  standard?: string;
  tooltipText: string;
  icon: React.ReactNode;
}

export const ARC_PPE: PPEItemDef[] = [
  { 
    id: 'arc_ensemble_4', 
    name: 'NFPA 70E Cat 1 Ensemble (4 cal/cm²)', 
    standard: 'NFPA 70E 2024 Cat 1', 
    category: 'ensemble', 
    rating: 4, 
    tooltipText: 'Cat 1 Complete Ensemble: Arc-rated long-sleeve shirt & pants (or AR coverall), arc face shield with balaclava, arc-rated gloves, safety glasses, and ear canal inserts.',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_ensemble_8', 
    name: 'NFPA 70E Cat 2 Ensemble (8 cal/cm²)', 
    standard: 'NFPA 70E 2024 Cat 2', 
    category: 'ensemble', 
    rating: 8, 
    tooltipText: 'Cat 2 Complete Ensemble: Arc-rated shirt & pants (or AR coverall), arc-rated face shield & balaclava (min 8 cal/cm²), arc-rated gloves, leather safety boots, and safety glasses.',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_ensemble_25', 
    name: 'NFPA 70E Cat 3 Ensemble (25 cal/cm²)', 
    standard: 'NFPA 70E 2024 Cat 3', 
    category: 'ensemble', 
    rating: 25, 
    tooltipText: 'Cat 3 Complete Ensemble: Arc flash suit hood (min 25 cal/cm²), arc flash suit jacket & bib trousers, arc flash gloves, and leather safety boots.',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_ensemble_40', 
    name: 'NFPA 70E Cat 4 Ensemble (40 cal/cm²)', 
    standard: 'NFPA 70E 2024 Cat 4', 
    category: 'ensemble', 
    rating: 40, 
    tooltipText: 'Cat 4 Complete Ensemble: Maximum Arc flash suit hood (min 40 cal/cm²), arc flash suit jacket & bib trousers, arc flash heavy gloves, and leather safety boots.',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_body_4', 
    name: 'AR Coverall (4 cal/cm²)', 
    standard: 'NFPA 70E Cat 1', 
    category: 'body', 
    rating: 4, 
    tooltipText: 'Protects full body against arc flash thermal heat up to 4 cal/cm².',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_body_8', 
    name: 'AR Suit (8 cal/cm²)', 
    standard: 'NFPA 70E Cat 2', 
    category: 'body', 
    rating: 8, 
    tooltipText: 'Flame-resistant arc suit shielding body against thermal heat up to 8 cal/cm².',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_body_25', 
    name: 'Arc Flash Suit (25 cal/cm²)', 
    standard: 'NFPA 70E Cat 3', 
    category: 'body', 
    rating: 25, 
    tooltipText: 'Heavy arc flash suit rated up to 25 cal/cm² for high-energy industrial panels.',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
  { 
    id: 'arc_body_40', 
    name: 'Heavy Arc Suit (40 cal/cm²)', 
    standard: 'NFPA 70E Cat 4', 
    category: 'body', 
    rating: 40, 
    tooltipText: 'Maximum Category 4 arc flash suit rated up to 40 cal/cm².',
    icon: <Flame className="w-3.5 h-3.5" /> 
  },
];

export const SHOCK_AC_PPE: PPEItemDef[] = [
  { id: 'glove_ac_00', name: 'Class 00 Rubber Gloves (500V)', standard: 'IEC 60903', category: 'hands', rating: 500, tooltipText: 'Protects against AC electric shock up to 500V AC.', icon: <HandMetal className="w-3.5 h-3.5" /> },
  { id: 'glove_ac_0', name: 'Class 0 Rubber Gloves (1kV)', standard: 'IEC 60903', category: 'hands', rating: 1000, tooltipText: 'Insulates against AC shock up to 1,000V AC.', icon: <HandMetal className="w-3.5 h-3.5" /> },
  { id: 'glove_ac_1', name: 'Class 1 HV Gloves (7.5kV)', standard: 'IEC 60903', category: 'hands', rating: 7500, tooltipText: 'Insulation up to 7,500V AC (7.5kV).', icon: <HandMetal className="w-3.5 h-3.5" /> },
  { id: 'glove_ac_2', name: 'Class 2 HV Gloves (17kV)', standard: 'IEC 60903', category: 'hands', rating: 17000, tooltipText: 'Insulation up to 17,000V AC (17kV).', icon: <HandMetal className="w-3.5 h-3.5" /> },
  { id: 'shoes_eh', name: 'Dielectric EH Boots (18kV)', standard: 'ASTM F2413', category: 'feet', rating: 18000, tooltipText: 'Dielectric safety boots rated up to 18,000V.', icon: <Footprints className="w-3.5 h-3.5" /> },
  { id: 'glasses_ac', name: 'Eye Protection & Safety Glasses', standard: 'ANSI Z87.1', category: 'accessories', rating: 1000, tooltipText: 'Protects eyes from electrical sparks.', icon: <Glasses className="w-3.5 h-3.5" /> },
];

export const SHOCK_DC_PPE: PPEItemDef[] = [
  { id: 'glove_dc_00', name: 'Class 00 Rubber Gloves (750V DC)', standard: 'IEC 60903', category: 'hands', rating: 750, tooltipText: 'Protects hands up to 750V DC.', icon: <HandMetal className="w-3.5 h-3.5" /> },
  { id: 'glove_dc_0', name: 'Class 0 Gloves (1.5kV DC)', standard: 'IEC 60903', category: 'hands', rating: 1500, tooltipText: 'Insulates up to 1,500V DC.', icon: <HandMetal className="w-3.5 h-3.5" /> },
  { id: 'shoes_eh_dc', name: 'Dielectric EH Boots (18kV)', standard: 'ASTM F2413', category: 'feet', rating: 18000, tooltipText: 'Dielectric safety boots.', icon: <Footprints className="w-3.5 h-3.5" /> },
  { id: 'glasses_dc', name: 'Eye Protection & Safety Glasses', standard: 'ANSI Z87.1', category: 'accessories', rating: 1000, tooltipText: 'Shields eyes.', icon: <Glasses className="w-3.5 h-3.5" /> },
];

export const EARTH_FAULT_PPE: PPEItemDef[] = [
  { id: 'ef_glove_0', name: 'Class 0 Rubber Gloves (1kV)', standard: 'IEC 60903', category: 'hands', rating: 1000, tooltipText: 'Safe up to 1,000V.', icon: <HandMetal className="w-3.5 h-3.5" /> },
  { id: 'ef_shoes_eh', name: 'Dielectric Boots (20kV)', standard: 'ASTM F1117', category: 'feet', rating: 20000, tooltipText: 'Dielectric boots up to 20kV.', icon: <Footprints className="w-3.5 h-3.5" /> },
];

export const STEP_TOUCH_PPE: PPEItemDef[] = [
  { id: 'st_shoes_1', name: 'Dielectric Boots (7.5kV)', standard: 'ASTM F1117', category: 'feet', rating: 7500, tooltipText: 'Dielectric boots up to 7.5kV.', icon: <Footprints className="w-3.5 h-3.5" /> },
  { id: 'st_shoes_2', name: 'Dielectric Boots (20kV)', standard: 'ASTM F1117', category: 'feet', rating: 20000, tooltipText: 'High-voltage dielectric boots up to 20kV.', icon: <Footprints className="w-3.5 h-3.5" /> },
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

    if (environment === 'residential') {
      return items.filter(item => {
        if (hazardType === 'shock_ac' && item.category === 'hands' && item.rating > 1000) return false;
        if (hazardType === 'shock_dc' && item.category === 'hands' && item.rating > 750) return false;
        if (hazardType === 'arc_flash' && item.rating > 12) return false;
        return true;
      });
    }

    return items;
  }, [hazardType, environment]);

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
      const ensemble = availableItems.find(i => i.category === 'ensemble' && i.rating >= hazardMagnitude) ||
                       availableItems.find(i => i.category === 'ensemble');
      if (ensemble) {
        next.add(ensemble.id);
      } else {
        const body = availableItems.find(i => i.category === 'body' && i.rating >= hazardMagnitude) || availableItems.find(i => i.category === 'body');
        if (body) next.add(body.id);
      }
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
      const hasEquipped = selected.length > 0;
      const maxRating = Math.max(0, ...selected.map(s => s.rating));

      if (!hasEquipped) {
        missing.push("Arc-Rated PPE Ensemble");
      } else if (maxRating < hazardMagnitude) {
        missing.push(`Arc Ensemble rated ≥ ${hazardMagnitude.toFixed(1)} cal/cm²`);
      }

      safe = hasEquipped && maxRating >= hazardMagnitude;
    } else {
      const hasGloves = selected.find(i => i.category === 'hands' && i.rating >= hazardMagnitude);
      if (!hasGloves) {
        missing.push(`Insulating Gloves rated ≥ ${hazardMagnitude}V`);
      }
      safe = !!hasGloves;
    }

    return { safe, missing, selectedItems: selected, selectedNames: selected.map(s => s.name) };
  }, [selectedItemIds, availableItems, hazardType, hazardMagnitude]);

  const prevEvalRef = useRef<{ safe: boolean; namesKey: string }>({ safe: false, namesKey: '' });

  useEffect(() => {
    const namesKey = evalResult.selectedNames.join('|');
    if (prevEvalRef.current.safe !== evalResult.safe || prevEvalRef.current.namesKey !== namesKey) {
      prevEvalRef.current = { safe: evalResult.safe, namesKey };
      onSafetyChange?.(evalResult.safe, evalResult.selectedNames);
    }
  }, [evalResult.safe, evalResult.selectedNames, onSafetyChange]);

  const recommendedPPE = useMemo(() => {
    return availableItems.find(i => i.rating >= hazardMagnitude);
  }, [availableItems, hazardMagnitude]);

  return (
    <div className="space-y-2 relative z-30" ref={dropdownRef}>
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className={cn("w-4 h-4", evalResult.safe ? "text-emerald-400" : "text-orange-400")} />
          <span>NFPA 70E Arc PPE Selection</span>
        </label>
        <span className={cn(
          "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border shadow-sm",
          evalResult.safe
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
            : "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
        )}>
          {evalResult.safe ? <><UserCheck className="w-3 h-3 text-emerald-400" /> PROTECTED</> : <><UserX className="w-3 h-3 text-rose-400" /> UNDER-PROTECTED</>}
        </span>
      </div>

      {/* Multi-Select Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-slate-950 text-left rounded-xl px-3 py-2 flex items-center justify-between transition-all cursor-pointer shadow-md border select-none min-h-[44px]",
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
                ? "Select NFPA 70E Arc PPE Ensemble..."
                : `${evalResult.selectedItems.length} PPE Item${evalResult.selectedItems.length > 1 ? 's' : ''} Equipped`}
            </span>
            <span className="text-[10px] font-mono text-slate-400 truncate">
              {evalResult.selectedItems.length === 0
                ? "Click to choose arc-rated safety gear"
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

      {/* Selected Tags */}
      {evalResult.selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {evalResult.selectedItems.map(item => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-orange-500/50 text-orange-200 text-xs font-bold shadow-sm"
            >
              <span className="shrink-0 text-orange-400">{item.icon}</span>
              <span className="truncate max-w-[200px]">{item.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
                className="hover:bg-orange-500/30 p-0.5 rounded text-orange-300 hover:text-white transition-colors cursor-pointer ml-0.5 min-h-[28px]"
                title="Remove PPE"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Options Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-2"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 gap-2">
              <button
                type="button"
                onClick={autoSelectRecommended}
                className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 transition-all cursor-pointer flex items-center gap-1 min-h-[36px]"
              >
                ⚡ Auto-Select Rated Arc PPE
              </button>
              {selectedItemIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg bg-slate-900 transition-colors cursor-pointer min-h-[36px]"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {availableItems.map(item => {
                const isSelected = selectedItemIds.has(item.id);
                const isRecommended = recommendedPPE?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "p-2 rounded-lg text-left transition-all border cursor-pointer flex items-center justify-between gap-2 select-none shadow-sm min-h-[44px]",
                      isSelected
                        ? "bg-orange-500/15 border-orange-500/70 text-white"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-orange-500/40 hover:text-white"
                    )}
                    title={item.tooltipText}
                  >
                    <div className="flex items-center gap-2 min-w-0">
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
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          {item.standard || `${item.rating} cal/cm²`}
                        </span>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 uppercase",
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety Alert Banner */}
      {!evalResult.safe && (
        <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            {evalResult.missing.length > 0 ? evalResult.missing.join(' · ') : 'Equip Arc PPE rated ≥ incident energy.'}
          </span>
        </div>
      )}
    </div>
  );
}
