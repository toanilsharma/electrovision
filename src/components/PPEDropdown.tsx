import React, { useState, useRef, useEffect } from 'react';
import { Shield, ShieldCheck, HandMetal, Footprints, Glasses, ChevronDown, ChevronUp, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export interface PPEOption {
  id: string;
  name: string;
  category: 'hands' | 'feet' | 'accessories';
  rating: number; // Volts
  standard: string;
  description: string;
  icon: React.ReactNode;
}

export const ELECTRICAL_PPE_OPTIONS: PPEOption[] = [
  {
    id: 'glove_ac_00',
    name: 'Class 00 Rubber Gloves (500V)',
    category: 'hands',
    rating: 500,
    standard: 'IEC 60903',
    description: 'Dielectric rubber gloves isolating hands from conductors up to 500V AC.',
    icon: <HandMetal className="w-3.5 h-3.5 text-emerald-400" />
  },
  {
    id: 'glove_ac_0',
    name: 'Class 0 Rubber Gloves (1,000V)',
    category: 'hands',
    rating: 1000,
    standard: 'IEC 60903',
    description: 'Heavy insulating gloves for low/medium voltage up to 1,000V AC / 1,500V DC.',
    icon: <HandMetal className="w-3.5 h-3.5 text-emerald-400" />
  },
  {
    id: 'boots_eh',
    name: 'Dielectric EH Safety Boots (18kV)',
    category: 'feet',
    rating: 18000,
    standard: 'ASTM F2413 / F1117',
    description: 'Electric Hazard (EH) boots isolating feet from earth ground potential.',
    icon: <Footprints className="w-3.5 h-3.5 text-emerald-400" />
  },
  {
    id: 'glasses_safety',
    name: 'Safety Glasses & Arc Shield (ANSI Z87.1)',
    category: 'accessories',
    rating: 1000,
    standard: 'ANSI Z87.1',
    description: 'Impact & dielectric face shielding against electrical flash sparks.',
    icon: <Glasses className="w-3.5 h-3.5 text-emerald-400" />
  }
];

interface PPEDropdownProps {
  voltage: number;
  isPPESafe: boolean;
  activePPENames: string[];
  onSafetyChange: (safe: boolean, names: string[]) => void;
  className?: string;
}

export function PPEDropdown({
  voltage,
  isPPESafe,
  activePPENames,
  onSafetyChange,
  className
}: PPEDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync selectedIds with activePPENames when changed externally (e.g. on Master Reset)
  useEffect(() => {
    if (activePPENames.length === 0) {
      setSelectedIds(new Set());
    }
  }, [activePPENames]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const evaluateSafety = (currentSelectedIds: Set<string>) => {
    const selectedItems = ELECTRICAL_PPE_OPTIONS.filter(item => currentSelectedIds.has(item.id));
    const names = selectedItems.map(i => i.name);
    
    // Safety criteria: Has insulating gloves rated >= voltage OR has dielectric boots
    const hasAdequateGloves = selectedItems.some(i => i.category === 'hands' && i.rating >= voltage);
    const hasBoots = selectedItems.some(i => i.category === 'feet');
    
    const isSafe = hasAdequateGloves || hasBoots;
    onSafetyChange(isSafe, names);
  };

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
    evaluateSafety(next);
  };

  const autoEquipAll = () => {
    const allIds = new Set(ELECTRICAL_PPE_OPTIONS.map(i => i.id));
    setSelectedIds(allIds);
    evaluateSafety(allIds);
  };

  const clearAll = () => {
    const empty = new Set<string>();
    setSelectedIds(empty);
    evaluateSafety(empty);
  };

  const equippedCount = selectedIds.size;

  return (
    <div className={cn("relative inline-block text-left z-30", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-2.5 py-1 sm:py-1.5 rounded-lg border flex items-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider select-none shadow-md cursor-pointer",
          isPPESafe
            ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            : equippedCount > 0
            ? "bg-amber-950/90 text-amber-300 border-amber-500/80"
            : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-700 hover:border-emerald-500/60"
        )}
        title="Equip Dielectric Rubber Gloves & Safety Boots to simulate electrical insulation"
      >
        {isPPESafe ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span>{isPPESafe ? "PPE ACTIVE (0.0 mA)" : "EQUIP PPE"}</span>
        <span className={cn(
          "px-1.5 py-0.2 text-[9px] font-mono rounded font-black",
          isPPESafe
            ? "bg-emerald-500 text-slate-950"
            : "bg-slate-800 text-slate-300 border border-slate-700"
        )}>
          {isPPESafe ? "PROTECTED" : equippedCount}
        </span>
        {isOpen ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
      </button>

      {/* Floating Dropdown Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-80 sm:w-96 bg-slate-950/98 border border-slate-700 rounded-2xl shadow-2xl z-50 p-3 space-y-2.5 backdrop-blur-2xl"
          >
            {/* Header & Quick Action Buttons */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Dielectric Electrical PPE
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={autoEquipAll}
                  className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/60 rounded text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Auto-Equip Kit
                </button>
                {equippedCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-1.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* List of PPE Items */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {ELECTRICAL_PPE_OPTIONS.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const isAdequateForVoltage = item.rating >= voltage;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all select-none shadow-sm",
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500/70 text-white"
                        : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Checkbox */}
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors font-bold",
                          isSelected
                            ? "bg-emerald-500 border-emerald-400 text-slate-950"
                            : "border-slate-700 bg-slate-950"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Icon */}
                      <div className="p-1 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                        {item.icon}
                      </div>

                      {/* Info */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          {item.name}
                        </span>
                        <span className="text-[9.5px] font-mono text-slate-400 truncate">
                          {item.standard} · Rated {item.rating}V
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 uppercase",
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      )}
                    >
                      {isSelected ? "EQUIPPED" : "WEAR"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Educational Engineering Physics Callout */}
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[10.5px] text-slate-300 leading-snug flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>IEC 60903 & ASTM F2413:</strong> Dielectric rubber gloves and boots provide &gt;10 MΩ insulation barrier, reducing current through the human body to <strong>0.0 mA</strong>.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
