import React from 'react';
import { X, Printer, ShieldAlert, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { ElectrodeConfig } from '../utils/ieee1584-2018';

interface ArcFlashLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  voltage: number;
  boltedFaultCurrent: number;
  incidentEnergy: number; // cal/cm2
  incidentEnergyJoules: number; // J/cm2
  boundaryRadius: number; // meters
  workingDistance: number; // mm
  clearingTimeMs: number;
  electrodeConfig: ElectrodeConfig;
  hrcLevel: number;
  unit: 'cal' | 'joules';
}

export function ArcFlashLabelModal({
  isOpen,
  onClose,
  voltage,
  boltedFaultCurrent,
  incidentEnergy,
  incidentEnergyJoules,
  boundaryRadius,
  workingDistance,
  clearingTimeMs,
  electrodeConfig,
  hrcLevel,
  unit,
}: ArcFlashLabelModalProps) {
  if (!isOpen) return null;

  const isExtremeDanger = incidentEnergy >= 40;
  const voltagekV = (voltage / 1000).toFixed(2);
  const workingDistanceInches = Math.round(workingDistance / 25.4);
  const currentDate = new Date().toLocaleDateString();

  // NFPA 70E Approach Boundaries calculation
  let limitedApproach = "1.5 m (5.0 ft)";
  let restrictedApproach = "0.7 m (2.2 ft)";
  if (voltage <= 750) {
    limitedApproach = "1.0 m (3.5 ft)";
    restrictedApproach = "0.3 m (1.0 ft)";
  } else if (voltage <= 15000) {
    limitedApproach = "1.5 m (5.0 ft)";
    restrictedApproach = "0.7 m (2.2 ft)";
  } else {
    limitedApproach = "3.0 m (10.0 ft)";
    restrictedApproach = "1.0 m (3.3 ft)";
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:w-full print:max-w-none print:bg-white print:text-black">
        
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="p-4 border-b border-white/10 bg-slate-950 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              NFPA 70E Standard Arc Flash Warning Label
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs uppercase tracking-wide cursor-pointer transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE LABEL CONTAINER (ANSI Z535 / NFPA 70E COMPLIANT) */}
        <div className="p-4 md:p-6 print:p-0">
          <div className="border-4 border-black bg-white text-black font-sans rounded-lg overflow-hidden shadow-xl print:shadow-none print:rounded-none">
            
            {/* LABEL HEADER BANNER */}
            <div className={`${isExtremeDanger ? 'bg-red-600' : 'bg-orange-500'} text-white text-center py-2 px-4 border-b-4 border-black`}>
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="w-8 h-8 fill-yellow-300 stroke-black font-bold shrink-0" />
                <span className="text-3xl font-black uppercase tracking-tighter drop-shadow">
                  {isExtremeDanger ? 'DANGER' : 'WARNING'}
                </span>
              </div>
              <div className="text-xs font-black uppercase tracking-widest mt-0.5">
                ARC FLASH &amp; SHOCK HAZARD APPROPRIATE PPE REQUIRED
              </div>
            </div>

            {/* LABEL MAIN CONTENT BODY */}
            <div className="p-4 space-y-3">
              
              {/* Incident Energy & Arc Flash Boundary Highlight Box */}
              <div className="grid grid-cols-2 gap-3 border-2 border-black p-3 bg-yellow-50 rounded">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block text-slate-700">
                    Incident Energy At {workingDistance}mm ({workingDistanceInches}in)
                  </span>
                  <div className="text-2xl md:text-3xl font-black tracking-tight text-black font-mono">
                    {unit === 'cal' ? `${incidentEnergy.toFixed(2)} cal/cm²` : `${incidentEnergyJoules.toFixed(1)} J/cm²`}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block text-slate-700">
                    Arc Flash Boundary
                  </span>
                  <div className="text-2xl md:text-3xl font-black tracking-tight text-black font-mono">
                    {boundaryRadius.toFixed(2)} m ({Math.round(boundaryRadius * 3.28084)} ft)
                  </div>
                </div>
              </div>

              {/* PPE Category & Required Clothing */}
              <div className="border-2 border-black p-3 bg-slate-50 rounded">
                <span className="text-[10px] font-black uppercase tracking-wider block text-slate-700">
                  NFPA 70E PPE Level / Rating Required
                </span>
                <div className="text-base md:text-lg font-black uppercase text-black font-mono">
                  {hrcLevel === 5 ? (
                    <span className="text-red-700">DANGER: &gt;40 cal/cm² - NO LIVE WORK PERMITTED</span>
                  ) : (
                    <span>PPE Category {hrcLevel} (Min. {hrcLevel === 1 ? '4' : hrcLevel === 2 ? '8' : hrcLevel === 3 ? '25' : '40'} cal/cm² Arc Suit)</span>
                  )}
                </div>
              </div>

              {/* Shock Hazard & Approach Boundaries */}
              <div className="grid grid-cols-2 gap-3 border-2 border-black p-3 bg-white rounded text-xs font-bold">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block text-slate-500">
                    Nominal System Voltage
                  </span>
                  <div className="text-sm font-black font-mono text-black">{voltage} VAC ({voltagekV} kV)</div>

                  <span className="text-[10px] font-black uppercase tracking-wider block text-slate-500 mt-2">
                    Limited Approach Boundary
                  </span>
                  <div className="text-xs font-mono text-black">{limitedApproach}</div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block text-slate-500">
                    Bolted Fault Current (Ibf)
                  </span>
                  <div className="text-sm font-black font-mono text-black">{boltedFaultCurrent} kA</div>

                  <span className="text-[10px] font-black uppercase tracking-wider block text-slate-500 mt-2">
                    Restricted Approach Boundary
                  </span>
                  <div className="text-xs font-mono text-black">{restrictedApproach}</div>
                </div>
              </div>

              {/* Equipment Info & Footer Metadata */}
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-600 border-t border-black pt-2">
                <div>
                  <span>Equipment: <strong>Switchgear Panel A</strong></span>
                  <span className="mx-2">|</span>
                  <span>Config: <strong>{electrodeConfig}</strong></span>
                </div>
                <div>
                  <span>Clearing: <strong>{clearingTimeMs.toFixed(1)} ms</strong></span>
                  <span className="mx-2">|</span>
                  <span>Date: <strong>{currentDate}</strong></span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-950 border-t border-white/10 text-center text-xs text-slate-400 font-mono print:hidden">
          Standardized label format according to NFPA 70E 2021 &amp; IEEE 1584-2018 calculation guidelines.
        </div>

      </div>
    </div>
  );
}
