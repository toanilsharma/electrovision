const fs = require('fs');
let content = fs.readFileSync('src/components/HumanBodyTwin.tsx', 'utf8');

// Add InfoTooltip import
content = content.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\nimport { InfoTooltip } from './InfoTooltip';");

// Update getEffects
const newGetEffects = `
  const getEffects = (int: number) => {
    if (!isAnimating || int === 0) return [];
    const effects = [];
    if (int >= 0.1) effects.push({ id: 'perception', label: 'Sensory Perception', desc: 'Mild tingling sensation at the points of contact. Current is above the perception threshold of ~0.5mA.', top: '15%', left: '5%', color: 'text-yellow-400', border: 'border-yellow-500/30' });
    if (int >= 0.4) effects.push({ id: 'tetanization', label: 'Muscle Tetanization', desc: 'Involuntary muscle contractions occur, making it impossible to let go of the energized conductor (Let-go threshold ~10mA).', top: '35%', left: '0%', color: 'text-orange-500', border: 'border-orange-500/30' });
    if (int >= 0.6) effects.push({ id: 'respiratory', label: 'Respiratory Paralysis', desc: 'Current passing through the chest causes the diaphragm muscles to spasm, preventing breathing.', top: '25%', right: '0%', color: 'text-red-400', border: 'border-red-400/30' });
    if (int >= 0.7) effects.push({ id: 'vfib', label: 'Ventricular Fibrillation', desc: 'Current passing through the heart disrupts the electrical rhythm, leading to fatal cardiac arrest if not treated with an AED.', top: '45%', right: '2%', color: 'text-red-500', border: 'border-red-500/30' });
    if (int >= 0.8) effects.push({ id: 'burns', label: 'Severe Tissue Burns', desc: 'High specific energy (I²t) causes resistive heating, resulting in severe 3rd degree burns at current entry and exit points.', top: '65%', right: '8%', color: 'text-orange-600', border: 'border-orange-600/30' });
    return effects;
  };
`;
content = content.replace(/const getEffects = \(int: number\) => \{[\s\S]*?return effects;\n  \};/, newGetEffects.trim());

// Update desktop render
content = content.replace(/<span className="text-\[10px\] lg:text-xs font-black uppercase tracking-widest whitespace-nowrap">\s*\{effect\.label\}\s*<\/span>/, '<InfoTooltip title={effect.label} description={effect.desc}><span className="text-[10px] lg:text-xs font-black uppercase tracking-widest whitespace-nowrap cursor-help">{effect.label}</span></InfoTooltip>');

fs.writeFileSync('src/components/HumanBodyTwin.tsx', content);
console.log("Patched HumanBodyTwin");
