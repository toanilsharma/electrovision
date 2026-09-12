/**
 * ScavengerHuntModal.tsx
 * 
 * Usability Audit Item 11: "Where is This in My House?" (Physical Scavenger Hunt)
 * An approachable, visual guide for families, homemakers, and children to locate
 * their real-world Distribution Board (Consumer Unit) and verify its safety switches.
 */

import React from 'react';
import {
  MapPin,
  X,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Eye,
  CheckCircle2,
  Home,
  DoorOpen,
  Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface ScavengerHuntModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDBBoxView?: () => void;
}

export const ScavengerHuntModal: React.FC<ScavengerHuntModalProps> = ({
  isOpen,
  onClose,
  onOpenDBBoxView
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Where is This in My House?</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Physical Scavenger Hunt
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Find your real-life Consumer Unit (DB Box) in under 60 seconds
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-sans text-slate-200">
          
          {/* Step 1: Typical Locations */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5 font-mono">
              <DoorOpen className="w-4 h-4" />
              1. Where to Look in Your Home
            </span>
            <p className="text-slate-300 leading-relaxed">
              Walk around your house right now and look for a <strong>grey metal or white plastic box mounted at eye level</strong>. It is almost always in one of these 3 places:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center flex flex-col items-center gap-1">
                <span className="text-lg">🚪</span>
                <strong className="text-white">Behind Front Door</strong>
                <span className="text-[10px] text-slate-400">Near the main entryway</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center flex flex-col items-center gap-1">
                <span className="text-lg">🏡</span>
                <strong className="text-white">Hallway / Corridor</strong>
                <span className="text-[10px] text-slate-400">High on the wall or alcove</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center flex flex-col items-center gap-1">
                <span className="text-lg">🍳</span>
                <strong className="text-white">Utility / Kitchen</strong>
                <span className="text-[10px] text-slate-400">Next to the electric meter</span>
              </div>
            </div>
          </div>

          {/* Step 2: What It Looks Like Inside */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
              <Eye className="w-4 h-4" />
              2. Open the Plastic Flap Door: What to Spot
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-900/90 border border-cyan-800/60 p-3 rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono flex items-center justify-center text-xs">
                    1
                  </span>
                  <strong className="text-cyan-300 font-mono text-xs uppercase">The Wide Life-Saver Switch (RCCB)</strong>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Look for a double-width switch with a small round button stamped with a <strong>"T" (Test)</strong>. This is the RCCB that stops electrocution! If you don't have one, your home has no shock protection!
                </p>
              </div>

              <div className="bg-slate-900/90 border border-amber-800/60 p-3 rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono flex items-center justify-center text-xs">
                    2
                  </span>
                  <strong className="text-amber-300 font-mono text-xs uppercase">The Narrow Flip Switches (MCBs)</strong>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  A row of single switches labeled <strong>B10, C16, or C20</strong>. These protect individual room wires from melting when too many heaters or appliances are plugged in.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Crucial Safety Rules for Families */}
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4" />
              3. Family Safety Rules: How to Touch It
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Dry Hands & Footwear:</strong> Always ensure hands are dry and wear slippers or shoes before touching any switch on the DB box.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Only Touch Plastic Levers:</strong> Never unscrew the faceplate or touch bare metallic screws or wires.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>The 3-Month 'T' Test:</strong> Press the 'T' button every 3 months. It should snap OFF immediately with a loud CLACK. If it doesn't move, call an electrician!</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 font-mono text-xs">
          <span className="text-slate-400 text-[11px]">
            Home Safety Practice: Know Your Panel
          </span>

          <div className="flex items-center gap-2">
            {onOpenDBBoxView && (
              <button
                type="button"
                onClick={() => {
                  onOpenDBBoxView();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-black transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>View Virtual DB Box</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
            >
              Got It!
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
