const fs = require('fs');
let content = fs.readFileSync('src/components/Simulators/ArcFlashSimulator.tsx', 'utf8');

if (content.includes('magnitude={')) {
    content = content.replace(/(magnitude=\{[^}]+\})\s*\/>/g, '$1\n        intensity={Math.min(incidentEnergy / 40.0, 1.0)}\n      />');
    fs.writeFileSync('src/components/Simulators/ArcFlashSimulator.tsx', content);
    console.log(`Patched ArcFlashSimulator.tsx with intensity`);
}
