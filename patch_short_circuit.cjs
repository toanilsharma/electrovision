const fs = require('fs');
let content = fs.readFileSync('src/components/Simulators/ShortCircuitSimulator.tsx', 'utf8');

if (content.includes('magnitude={')) {
    content = content.replace(/(magnitude=\{[^}]+\})\s*\/>/g, '$1\n        intensity={Math.max(0.1, Math.min(faultCurrent / prospectiveFaultCurrent, 1.0))}\n      />');
    fs.writeFileSync('src/components/Simulators/ShortCircuitSimulator.tsx', content);
    console.log(`Patched ShortCircuitSimulator.tsx with intensity`);
}
