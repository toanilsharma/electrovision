import React, { useState, useMemo, useEffect } from 'react';
import { Shield, HardHat, Footprints, Flame, HandMetal, Glasses, CheckCircle, AlertTriangle, UserCheck, UserX, Lightbulb, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export type HazardType = 'arc_flash' | 'shock_ac' | 'shock_dc' | 'earth_fault' | 'step_touch';

interface PPEItemDef {
  id: string;
  name: string;
  category: 'head_face' | 'body' | 'hands' | 'feet' | 'accessories';
  rating: number; // cal/cm2 for arc, V for AC/DC shock
  standard?: string;
  tooltipText: string; // Plain easy English hover description
  icon: React.ReactNode;
}

const ARC_PPE: PPEItemDef[] = [
  { 
    id: 'arc_body_4', 
    name: 'AR Coverall (4 cal)', 
    standard: 'NFPA 70E Cat 1', 
    category: 'body', 
    rating: 4, 
    tooltipText: 'Recommended Use: Protects full body against arc flash thermal heat up to 4 cal/cm² (NFPA 70E Category 1).',
    icon: <Flame className="w-4 h-4" /> 
  },
  { 
    id: 'arc_body_8', 
    name: 'AR Suit (8 cal)', 
    standard: 'NFPA 70E Cat 2', 
    category: 'body', 
    rating: 8, 
    tooltipText: 'Recommended Use: Flame-resistant arc suit shielding body against thermal heat up to 8 cal/cm² (NFPA 70E Category 2).',
    icon: <Flame className="w-4 h-4" /> 
  },
  { 
    id: 'arc_body_25', 
    name: 'Arc Flash Suit (25 cal)', 
    standard: 'NFPA 70E Cat 3', 
    category: 'body', 
    rating: 25, 
    tooltipText: 'Recommended Use: Heavy arc flash protection suit rated up to 25 cal/cm² for high-energy electrical panels.',
    icon: <Flame className="w-4 h-4" /> 
  },
  { 
    id: 'arc_body_40', 
    name: 'Heavy Arc Suit (40 cal)', 
    standard: 'NFPA 70E Cat 4', 
    category: 'body', 
    rating: 40, 
    tooltipText: 'Recommended Use: Maximum Category 4 arc flash suit rated up to 40 cal/cm² for extreme arc hazards.',
    icon: <Flame className="w-4 h-4" /> 
  },
  { 
    id: 'arc_head_12', 
    name: 'AR Shield (12 cal)', 
    standard: 'ASTM F2178', 
    category: 'head_face', 
    rating: 12, 
    tooltipText: 'Recommended Use: Arc-rated face shield protecting face & neck against thermal burn heat up to 12 cal/cm².',
    icon: <HardHat className="w-4 h-4" /> 
  },
  { 
    id: 'arc_head_40', 
    name: 'Arc Flash Hood (40 cal)', 
    standard: 'ASTM F2178', 
    category: 'head_face', 
    rating: 40, 
    tooltipText: 'Recommended Use: Full head arc hood providing 360° facial & neck thermal protection up to 40 cal/cm².',
    icon: <HardHat className="w-4 h-4" /> 
  },
  { 
    id: 'arc_hands', 
    name: 'Leather Protectors', 
    standard: 'ASTM F696', 
    category: 'hands', 
    rating: 100, 
    tooltipText: 'Recommended Use: Heavy leather gloves protecting against thermal arc flash burns and sharp mechanical cuts.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'arc_acc', 
    name: 'Eye Goggles / Glasses', 
    standard: 'ANSI Z87.1', 
    category: 'accessories', 
    rating: 100, 
    tooltipText: 'Recommended Use: Shields eyes from intense electrical flash sparks, flying blast debris, and UV radiation.',
    icon: <Glasses className="w-4 h-4" /> 
  },
];

const SHOCK_AC_PPE: PPEItemDef[] = [
  { 
    id: 'glove_ac_00', 
    name: 'Class 00 Rubber Gloves (500V)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 500, 
    tooltipText: 'Recommended Voltage: Protects hands against AC electric shock up to 500 Volts (0.5kV). Safe for residential & low voltage work.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'glove_ac_0', 
    name: 'Class 0 Rubber Gloves (1kV)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 1000, 
    tooltipText: 'Recommended Voltage: Insulates hands against AC electric shock up to 1,000 Volts (1kV AC). Standard commercial electrical glove.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'glove_ac_1', 
    name: 'Class 1 HV Gloves (7.5kV)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 7500, 
    tooltipText: 'Recommended Voltage: High-voltage insulation up to 7,500 Volts AC (7.5kV). Essential for medium voltage substations & transformers.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'glove_ac_2', 
    name: 'Class 2 HV Gloves (17kV)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 17000, 
    tooltipText: 'Recommended Voltage: Heavy high-voltage hand insulation up to 17,000 Volts AC (17kV). Maximum hand shock protection.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'glove_leather_ac', 
    name: 'Leather Protectors', 
    standard: 'ASTM F696', 
    category: 'hands', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Worn OVER rubber insulating gloves to protect them against sharp cuts, punctures, and mechanical tears.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'shoes_eh', 
    name: 'Dielectric EH Boots (18kV)', 
    standard: 'ASTM F2413', 
    category: 'feet', 
    rating: 18000, 
    tooltipText: 'Recommended Voltage: Dielectric safety boots rated up to 18,000 Volts (18kV). Stops electric current from returning to earth ground through your feet.',
    icon: <Footprints className="w-4 h-4" /> 
  },
  { 
    id: 'glasses_ac', 
    name: 'Eye Goggles & Safety Glasses', 
    standard: 'ANSI Z87.1', 
    category: 'accessories', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Protects eyes from electrical arcing sparks, flying debris particles, and UV radiation (ANSI Z87.1 approved).',
    icon: <Glasses className="w-4 h-4" /> 
  },
  { 
    id: 'face_shield_ac', 
    name: 'Arc Face Shield (12 cal)', 
    standard: 'NFPA 70E / ASTM F2178', 
    category: 'head_face', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Protects face and neck against arc flash heat up to 12 cal/cm² and flying sparks.',
    icon: <HardHat className="w-4 h-4" /> 
  },
  { 
    id: 'ifr_suit_ac', 
    name: 'Arc / IFR Suit (8 cal/cm²)', 
    standard: 'NFPA 70E / IEC 61482', 
    category: 'body', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Flame-resistant suit shielding full body against thermal arc burns up to 8 cal/cm² per NFPA 70E standards.',
    icon: <Flame className="w-4 h-4" /> 
  },
  { 
    id: 'helmet_ac', 
    name: 'Class E Safety Helmet (20kV)', 
    standard: 'ANSI Z89.1 Class E', 
    category: 'head_face', 
    rating: 20000, 
    tooltipText: 'Recommended Voltage: Electrical insulating hard hat protecting head against overhead line contact up to 20,000 Volts (20kV).',
    icon: <HardHat className="w-4 h-4" /> 
  },
];

const SHOCK_DC_PPE: PPEItemDef[] = [
  { 
    id: 'glove_dc_00', 
    name: 'Class 00 Gloves (750V DC)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 750, 
    tooltipText: 'Recommended Voltage: Safe up to 750 Volts DC. Protects hands during battery bank & low-voltage DC maintenance.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'glove_dc_0', 
    name: 'Class 0 Gloves (1.5kV DC)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 1500, 
    tooltipText: 'Recommended Voltage: Insulates hands against DC shock up to 1,500 Volts DC (1.5kV). Essential for EV battery packs & solar PV farms.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'glove_dc_1', 
    name: 'Class 1 HV Gloves (11.2kV DC)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 11250, 
    tooltipText: 'Recommended Voltage: High-voltage DC hand insulation up to 11,250 Volts DC. Required for high-voltage DC substations & traction power.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'glove_dc_2', 
    name: 'Class 2 HV Gloves (25.5kV DC)', 
    standard: 'IEC 60903 / ASTM D120', 
    category: 'hands', 
    rating: 25500, 
    tooltipText: 'Recommended Voltage: Heavy high-voltage DC insulation up to 25,500 Volts DC. Maximum DC shock protection.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'glove_leather_dc', 
    name: 'Leather Protector Gloves', 
    standard: 'ASTM F696', 
    category: 'hands', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Mechanical barrier worn over rubber gloves to prevent cuts, punctures, and mechanical abrasion.',
    icon: <HandMetal className="w-4 h-4" /> 
  },
  { 
    id: 'shoes_eh_dc', 
    name: 'Dielectric EH Boots (30kV)', 
    standard: 'ASTM F2413 / ASTM F1117', 
    category: 'feet', 
    rating: 30000, 
    tooltipText: 'Recommended Voltage: Heavy dielectric safety boots rated up to 30,000 Volts DC. Prevents ground fault return current through feet.',
    icon: <Footprints className="w-4 h-4" /> 
  },
  { 
    id: 'glasses_dc', 
    name: 'Eye Goggles & Safety Glasses', 
    standard: 'ANSI Z87.1', 
    category: 'accessories', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Shields eyes from DC arcing sparks, acid battery splashes, and flying particles per ANSI Z87.1 standard.',
    icon: <Glasses className="w-4 h-4" /> 
  },
  { 
    id: 'face_shield_dc', 
    name: 'Arc Face Shield (12 cal)', 
    standard: 'NFPA 70E / ASTM F2178', 
    category: 'head_face', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Arc-rated face shield protecting face & neck against thermal heat up to 12 cal/cm².',
    icon: <HardHat className="w-4 h-4" /> 
  },
  { 
    id: 'ifr_suit_dc', 
    name: 'Arc / IFR Suit (8 cal/cm²)', 
    standard: 'NFPA 70E / IEC 61482', 
    category: 'body', 
    rating: 1000, 
    tooltipText: 'Recommended Use: Insulating flame-resistant suit shielding body against thermal arc flash burns up to 8 cal/cm².',
    icon: <Flame className="w-4 h-4" /> 
  },
  { 
    id: 'helmet_dc', 
    name: 'Class E Safety Helmet (20kV)', 
    standard: 'ANSI Z89.1 Class E', 
    category: 'head_face', 
    rating: 20000, 
    tooltipText: 'Recommended Voltage: Electrical hard hat tested for head protection against contacts up to 20,000 Volts (20kV).',
    icon: <HardHat className="w-4 h-4" /> 
  },
];

const EARTH_FAULT_PPE: PPEItemDef[] = [
  { id: 'ef_glove_0', name: 'Class 0 Rubber Gloves (1kV)', standard: 'IEC 60903', category: 'hands', rating: 1000, tooltipText: 'Recommended Voltage: Safe up to 1,000 Volts AC/DC for ground fault maintenance.', icon: <HandMetal className="w-4 h-4" /> },
  { id: 'ef_glove_1', name: 'Class 1 HV Gloves (7.5kV)', standard: 'IEC 60903', category: 'hands', rating: 7500, tooltipText: 'Recommended Voltage: High-voltage insulation up to 7,500 Volts.', icon: <HandMetal className="w-4 h-4" /> },
  { id: 'ef_shoes_eh', name: 'Dielectric Boots (20kV)', standard: 'ASTM F1117', category: 'feet', rating: 20000, tooltipText: 'Recommended Voltage: Dielectric boots rated up to 20,000 Volts for step/touch protection.', icon: <Footprints className="w-4 h-4" /> },
  { id: 'ef_glasses', name: 'Eye Goggles & Glasses', standard: 'ANSI Z87.1', category: 'accessories', rating: 1000, tooltipText: 'Recommended Use: Protects eyes from flying ground fault sparks.', icon: <Glasses className="w-4 h-4" /> },
  { id: 'ef_helmet', name: 'Class E Helmet (20kV)', standard: 'ANSI Z89.1', category: 'head_face', rating: 20000, tooltipText: 'Recommended Voltage: Head protection rated up to 20,000 Volts.', icon: <HardHat className="w-4 h-4" /> },
  { id: 'ef_suit', name: 'Arc / IFR Coverall (8 cal)', standard: 'NFPA 70E', category: 'body', rating: 1000, tooltipText: 'Recommended Use: Thermal arc protective coverall up to 8 cal/cm².', icon: <Flame className="w-4 h-4" /> },
  { id: 'ef_mat', name: 'Insulating Rubber Mat (10kV)', standard: 'ASTM D178', category: 'accessories', rating: 10000, tooltipText: 'Recommended Voltage: Insulating mat rated up to 10,000 Volts under feet.', icon: <Shield className="w-4 h-4" /> },
];

const STEP_TOUCH_PPE: PPEItemDef[] = [
  { id: 'st_shoes_1', name: 'Dielectric Boots (7.5kV)', standard: 'ASTM F1117', category: 'feet', rating: 7500, tooltipText: 'Recommended Voltage: Dielectric boots up to 7.5kV for step potential protection.', icon: <Footprints className="w-4 h-4" /> },
  { id: 'st_shoes_2', name: 'Dielectric Boots (20kV)', standard: 'ASTM F1117', category: 'feet', rating: 20000, tooltipText: 'Recommended Voltage: High-voltage dielectric boots up to 20kV for ground potential rise.', icon: <Footprints className="w-4 h-4" /> },
  { id: 'st_glove_00', name: 'Class 00 Gloves (500V)', standard: 'IEC 60903', category: 'hands', rating: 500, tooltipText: 'Recommended Voltage: Safe up to 500 Volts.', icon: <HandMetal className="w-4 h-4" /> },
  { id: 'st_glove_1', name: 'Class 1 HV Gloves (7.5kV)', standard: 'IEC 60903', category: 'hands', rating: 7500, tooltipText: 'Recommended Voltage: High-voltage gloves up to 7,500 Volts for touch voltage safety.', icon: <HandMetal className="w-4 h-4" /> },
  { id: 'st_glasses', name: 'Eye Goggles & Glasses', standard: 'ANSI Z87.1', category: 'accessories', rating: 1000, tooltipText: 'Recommended Use: Eye protection against ground fault arcing.', icon: <Glasses className="w-4 h-4" /> },
  { id: 'st_suit', name: 'Arc / IFR Suit (8 cal)', standard: 'NFPA 70E', category: 'body', rating: 1000, tooltipText: 'Recommended Use: Thermal arc protective suit rated up to 8 cal/cm².', icon: <Flame className="w-4 h-4" /> },
];

interface PPEValidatorProps {
  hazardType: HazardType;
  hazardMagnitude: number;
  onSafetyChange?: (isSafe: boolean, selectedPPENames?: string[]) => void;
}

// Visual category theme & badge map for instant visual recognition
const getPPECategoryTheme = (category: PPEItemDef['category'], isSelected: boolean) => {
  switch (category) {
    case 'hands':
      return {
        categoryTag: '🖐️ HANDS',
        badgeBg: 'bg-amber-500/25 text-amber-300 border-amber-500/50',
        iconBg: isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-amber-950/80 text-amber-400 border border-amber-500/50',
        cardBorder: isSelected
          ? 'bg-amber-950/80 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-2 ring-amber-400'
          : 'bg-slate-900/95 border-slate-750 text-slate-200 hover:border-amber-400 hover:bg-slate-850',
      };
    case 'feet':
      return {
        categoryTag: '👣 FEET',
        badgeBg: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50',
        iconBg: isSelected ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50',
        cardBorder: isSelected
          ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400'
          : 'bg-slate-900/95 border-slate-750 text-slate-200 hover:border-emerald-400 hover:bg-slate-850',
      };
    case 'head_face':
      return {
        categoryTag: '🪖 HEAD',
        badgeBg: 'bg-orange-500/25 text-orange-300 border-orange-500/50',
        iconBg: isSelected ? 'bg-orange-400 text-slate-950 font-bold' : 'bg-orange-950/80 text-orange-400 border border-orange-500/50',
        cardBorder: isSelected
          ? 'bg-orange-950/80 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] ring-2 ring-orange-400'
          : 'bg-slate-900/95 border-slate-750 text-slate-200 hover:border-orange-400 hover:bg-slate-850',
      };
    case 'body':
      return {
        categoryTag: '🔥 BODY',
        badgeBg: 'bg-rose-500/25 text-rose-300 border-rose-500/50',
        iconBg: isSelected ? 'bg-rose-400 text-slate-950 font-bold' : 'bg-rose-950/80 text-rose-400 border border-rose-500/50',
        cardBorder: isSelected
          ? 'bg-rose-950/80 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] ring-2 ring-rose-400'
          : 'bg-slate-900/95 border-slate-750 text-slate-200 hover:border-rose-400 hover:bg-slate-850',
      };
    case 'accessories':
    default:
      return {
        categoryTag: '🥽 EYES',
        badgeBg: 'bg-sky-500/25 text-sky-300 border-sky-500/50',
        iconBg: isSelected ? 'bg-sky-400 text-slate-950 font-bold' : 'bg-sky-950/80 text-sky-400 border border-sky-500/50',
        cardBorder: isSelected
          ? 'bg-sky-950/80 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] ring-2 ring-sky-400'
          : 'bg-slate-900/95 border-slate-750 text-slate-200 hover:border-sky-400 hover:bg-slate-850',
      };
  }
};

export function PPEValidator({ hazardType, hazardMagnitude, onSafetyChange }: PPEValidatorProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<PPEItemDef | null>(null);

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
      const hasGloves = selected.find(i => i.category === 'hands' && i.rating >= hazardMagnitude);

      if (!hasGloves) {
        missing.push(`Insulating Gloves rated ≥ ${hazardMagnitude}V`);
      }

      safe = !!hasGloves;
    }

    return { safe, missing, selectedNames: selected.map(s => s.name) };
  }, [selectedItemIds, availableItems, hazardType, hazardMagnitude]);

  useEffect(() => {
    onSafetyChange?.(evalResult.safe, evalResult.selectedNames);
  }, [evalResult.safe, evalResult.selectedNames, onSafetyChange]);

  const recommendedItem = useMemo(() => {
    if (evalResult.safe) return null;
    return availableItems.find(i => i.category === 'hands' && i.rating >= hazardMagnitude) || availableItems.find(i => i.rating >= hazardMagnitude);
  }, [evalResult.safe, availableItems, hazardMagnitude]);

  return (
    <div className="p-2.5 sm:p-3 border-2 rounded-2xl bg-slate-950/95 border-slate-800 shadow-xl flex flex-col relative shrink-0">
      <motion.div 
        className="absolute inset-0 bg-emerald-500/10 pointer-events-none rounded-2xl" 
        animate={{ opacity: evalResult.safe ? 1 : 0 }} 
        transition={{ duration: 0.5 }}
      />
      
      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center gap-1.5 mb-2 z-10 shrink-0">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-white uppercase tracking-wider">
          <Shield className={cn("w-4 h-4 sm:w-5 sm:h-5 shrink-0", evalResult.safe ? "text-emerald-400" : "text-amber-400")} /> 
          <span>Choose from below PPEs to save your self.</span>
        </div>
        
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md border shrink-0",
          evalResult.safe
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
            : "bg-rose-500/25 text-rose-200 border-rose-500/60 animate-pulse"
        )}>
          {evalResult.safe ? <><UserCheck className="w-3.5 h-3.5 text-emerald-400" /> PASS (100% Protected)</> : <><UserX className="w-3.5 h-3.5 text-rose-400" /> UNPROTECTED (Shock Risk)</>}
        </span>
      </div>

      {/* Dynamic Instruction & Hover Guidance Banner */}
      <div className={cn(
        "border shadow-md rounded-xl p-2 sm:p-2.5 mb-2 flex items-center gap-2 text-xs font-semibold z-10 leading-snug transition-all",
        hoveredItem
          ? "bg-amber-950/95 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
          : "bg-gradient-to-r from-amber-950/90 via-amber-900/50 to-slate-900 border-amber-400/80 text-slate-100"
      )}>
        {hoveredItem ? (
          <Info className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
        ) : (
          <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
        )}
        <div className="flex-1 min-w-0">
          {hoveredItem ? (
            <div>
              <span className="font-black text-amber-300 uppercase tracking-wide mr-1.5">{hoveredItem.name}:</span>
              <span className="text-amber-100 font-bold">{hoveredItem.tooltipText}</span>
            </div>
          ) : (
            <div>
              <span className="font-black text-amber-300 uppercase tracking-wide mr-1.5">Instruction:</span>
              <span>Hover over buttons to see recommended voltage! Select gear rated for </span>
              <span className="text-amber-300 font-black font-mono px-1.5 py-0.5 bg-amber-950 rounded border border-amber-400/60">
                {hazardMagnitude.toFixed(0)}{hazardType === 'arc_flash' ? ' cal/cm²' : 'V'}
              </span>
              <span> to protect yourself!</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Cal Presets for Arc Flash */}
      {hazardType === 'arc_flash' && (
        <div className="flex items-center gap-1.5 mb-2 z-10 flex-wrap">
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
      
      {/* High-Visibility Enlarged PPE Selection Buttons Grid:
          Buttons are larger, prominent, with large font sizes and distinct category color themes.
          On Laptops & Desktops: 5-column grid (lg:grid-cols-5) keeps all 10 items in 2 rows without scrolling! */}
      <div className="flex flex-col gap-2 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:max-h-none sm:overflow-visible p-0.5">
          {availableItems.map(item => {
            const isSelected = selectedItemIds.has(item.id);
            const theme = getPPECategoryTheme(item.category, isSelected);

            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                title={item.tooltipText}
                className={cn(
                  "p-2 rounded-xl text-left font-black uppercase tracking-wider flex items-center justify-between gap-2 transition-all border-2 cursor-pointer active:scale-98 shadow-md min-h-[42px]",
                  theme.cardBorder
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("p-1.5 rounded-lg shrink-0 transition-colors shadow-sm", theme.iconBg)}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="block font-black text-xs text-white truncate">{item.name}</span>
                    <span className="text-[8.5px] font-mono text-slate-300 font-bold truncate mt-0.5">{item.standard || theme.categoryTag}</span>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0 drop-shadow" />
                ) : (
                  <span className={cn("text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded-md border shrink-0 uppercase", theme.badgeBg)}>
                    WEAR
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Status Banner */}
        <div className={cn(
          "p-2.5 rounded-xl border flex items-center gap-2.5 transition-all shrink-0 text-xs mt-0.5",
          evalResult.safe 
            ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300" 
            : "bg-rose-950/60 border-rose-500/60 text-rose-200"
        )}>
          <div className="shrink-0">
            {evalResult.safe ? (
              <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4.5 h-4.5 text-rose-400 animate-bounce" />
            )}
          </div>

          <div className="flex-1 min-w-0 text-left truncate">
            {evalResult.safe ? (
              <span className="font-black uppercase tracking-wider">
                ✓ 100% PROTECTED: Rated PPE gear is blocking electric current safely.
              </span>
            ) : (
              <span className="font-medium">
                <strong className="font-black uppercase text-rose-300">Action Needed: </strong>
                {recommendedItem ? (
                  <span>Click <strong className="text-white underline font-black">{recommendedItem.name}</strong> above to protect against {hazardMagnitude.toFixed(0)}{hazardType === 'arc_flash' ? ' cal' : 'V'} electric shock.</span>
                ) : (
                  <span>Select required safety gloves above to protect operator.</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
