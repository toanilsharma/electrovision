const fs = require('fs');
let content = fs.readFileSync('src/components/Simulators/ACShockSimulator.tsx', 'utf8');

content = content.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\nimport { InfoTooltip } from '../InfoTooltip';\nimport { AfterActionReportModal, IncidentReport } from '../AfterActionReportModal';");

const tooltipImpedance = `<InfoTooltip title="Total Body Impedance (Z_T)" description="According to IEC 60479-1, total body impedance drops significantly at higher voltages due to skin breakdown."><span className="text-[8px] font-bold tracking-widest text-slate-500 uppercase mb-0.5">Impedance (Z_T)</span></InfoTooltip>`;
content = content.replace(/<span className="text-\[8px\] font-bold tracking-widest text-slate-500 uppercase mb-0\.5">Impedance \(Z_T\)<\/span>/g, tooltipImpedance);

const tooltipHeart = `<InfoTooltip title="Heart Current Factor (F)" description="A multiplier representing the proportion of current passing through the heart region. Left-hand to both feet is typically 1.0 (highest risk)."><span className="text-[8px] font-bold tracking-widest text-slate-500 uppercase mb-0.5">Heart Factor</span></InfoTooltip>`;
content = content.replace(/<span className="text-\[8px\] font-bold tracking-widest text-slate-500 uppercase mb-0\.5">Heart Factor<\/span>/g, tooltipHeart);

const tooltipEq = `<InfoTooltip title="Equivalent Heart Current" description="I_eq = Total Body Current x Heart Factor. This value determines the physiological effects on the heart such as Ventricular Fibrillation (V-Fib)."><span className="text-[8px] font-bold tracking-widest text-red-500 uppercase mb-0.5 block">Eq. Heart Current</span></InfoTooltip>`;
content = content.replace(/<span className="text-\[8px\] font-bold tracking-widest text-red-500 uppercase mb-0\.5 block">Eq\. Heart Current<\/span>/g, tooltipEq);

fs.writeFileSync('src/components/Simulators/ACShockSimulator.tsx', content);
console.log("Patched AC tooltips");
