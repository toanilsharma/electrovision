import React from 'react';
import { Shield, ShieldCheck, HandMetal, Footprints, Glasses, Sparkles, RotateCcw, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface PPEOption {
  id: string;
  name: string;
  shortName: string;
  category: 'hands' | 'feet' | 'accessories';
  rating: number; // Volts
  standard: string;
  description: string;
  icon: React.ReactNode;
}

export const PPE_ITEMS: PPEOption[] = [
  {
    id: 'glove_ac_00',
    name: 'Class 00 Rubber Gloves (500V)',
    shortName: 'Gloves (500V)',
    category: 'hands',
    rating: 500,
    standard: 'IEC 60903',
    description: 'Dielectric rubber gloves isolating hands from conductors up to 500V AC.',
    icon: <HandMetal className="w-4 h-4" />
  },
  {
    id: 'glove_ac_0',
    name: 'Class 0 Rubber Gloves (1,000V)',
    shortName: 'Gloves (1kV)',
    category: 'hands',
    rating: 1000,
    standard: 'IEC 60903',
    description: 'Heavy insulating gloves for low/medium voltage up to 1,000V AC / 1,500V DC.',
    icon: <HandMetal className="w-4 h-4" />
  },
  {
    id: 'boots_eh',
    name: 'Dielectric EH Safety Boots (18kV)',
    shortName: 'EH Boots (18kV)',
    category: 'feet',
    rating: 18000,
    standard: 'ASTM F2413',
    description: 'Electric Hazard (EH) boots isolating feet from earth ground potential.',
    icon: <Footprints className="w-4 h-4" />
  },
  {
    id: 'glasses_safety',
    name: 'Arc Shield & Safety Glasses',
    shortName: 'Arc Face Shield',
    category: 'accessories',
    rating: 1000,
    standard: 'ANSI Z87.1',
    description: 'Impact & dielectric face shielding against electrical flash sparks.',
    icon: <Glasses className="w-4 h-4" />
  }
];

interface PPESelectionCardProps {
  voltage: number;
  isPPESafe: boolean;
  activePPENames: string[];
  onSafetyChange: (safe: boolean, names: string[]) => void;
  disabled?: boolean;
}

export function PPESelectionCard({
  voltage,
  isPPESafe,
  activePPENames,
  onSafetyChange,
  disabled
}: PPESelectionCardProps) {
  const selectedIds = new Set(
    PPE_ITEMS.filter(item => activePPENames.includes(item.name)).map(item => item.id)
  );

  const evaluateSafety = (currentSelectedIds: Set<string>) => {
    const selectedItems = PPE_ITEMS.filter(item => currentSelectedIds.has(item.id));
    const names = selectedItems.map(i => i.name);
    
    // Safety criteria: Has insulating gloves rated >= voltage OR has dielectric boots
    const hasAdequateGloves = selectedItems.some(i => i.category === 'hands' && i.rating >= voltage);
    const hasBoots = selectedItems.some(i => i.category === 'feet');
    
    const isSafe = hasAdequateGloves || hasBoots;
    onSafetyChange(isSafe, names);
  };

  const toggleItem = (id: string) => {
    if (disabled) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    evaluateSafety(next);
  };

  const autoEquipAll = () => {
    if (disabled) return;
    const allIds = new Set(PPE_ITEMS.map(i => i.id));
    evaluateSafety(allIds);
  };

  const clearAll = () => {
    if (disabled) return;
    const empty = new Set<string>();
    evaluateSafety(empty);
  };

  const equippedCount = selectedIds.size;

  return (
    <div className="flex flex-col gap-1 p-1.5 rounded-xl bg-slate-950 border border-slate-800 shadow-md shrink-0 select-none">
      {/* Header & Quick Action Buttons */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-0.5">
        <span className="text-[10.5px] font-black text-slate-200 uppercase tracking-wider flex items-center gap-1">
          {isPPESafe ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>PPE & Safety Gear</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={autoEquipAll}
            disabled={disabled}
            className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/60 rounded text-[9.5px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
            title="Auto-equip full dielectric kit (Gloves + Boots + Shield)"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Auto Kit
          </button>
          {equippedCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              disabled={disabled}
              className="px-1 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded text-[9.5px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Remove all equipped PPE"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid of 4 Direct PPE Item Selectors */}
      <div className="grid grid-cols-2 gap-1">
        {PPE_ITEMS.map((item) => {
          const isSelected = selectedIds.has(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleItem(item.id)}
              disabled={disabled}
              className={cn(
                "px-1.5 py-1 rounded-lg border text-left flex items-center justify-between gap-1 transition-all cursor-pointer active:scale-95 min-h-[32px] disabled:opacity-50",
                isSelected
                  ? "bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                  : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850"
              )}
            >
              <div className="flex items-center gap-1 min-w-0">
                <span className={cn("shrink-0", isSelected ? "text-emerald-400" : "text-slate-400")}>
                  {item.icon}
                </span>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[10px] font-black truncate">
                    {item.shortName}
                  </span>
                  <span className="text-[8px] font-mono text-slate-400 truncate mt-0.5">
                    {item.standard}
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors font-bold",
                  isSelected
                    ? "bg-emerald-500 border-emerald-400 text-slate-950"
                    : "border-slate-700 bg-slate-950"
                )}
              >
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Protection Status Callout Banner */}
      <div
        className={cn(
          "px-1.5 py-0.5 rounded-lg border text-[9.5px] font-mono font-bold flex items-center justify-between gap-1 transition-all",
          isPPESafe
            ? "bg-emerald-950/90 border-emerald-500/70 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
            : "bg-slate-900/80 border-slate-800 text-slate-400"
        )}
      >
        <div className="flex items-center gap-1 truncate">
          {isPPESafe ? (
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
          )}
          <span className="truncate">
            {isPPESafe
              ? "100% PROTECTED: 0.0 mA"
              : equippedCount > 0
              ? "PARTIAL GEAR ACTIVE"
              : "NO PPE: DIRECT CONTACT"}
          </span>
        </div>
        <span
          className={cn(
            "text-[8.5px] px-1 py-0.2 rounded font-black uppercase shrink-0",
            isPPESafe
              ? "bg-emerald-500 text-slate-950"
              : "bg-slate-800 text-slate-400 border border-slate-700"
          )}
        >
          {isPPESafe ? "SAFE" : "EXPOSED"}
        </span>
      </div>
    </div>
  );
}
