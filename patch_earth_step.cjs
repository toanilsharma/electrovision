const fs = require('fs');

['EarthFaultSimulator.tsx', 'StepTouchSimulator.tsx'].forEach(file => {
  let content = fs.readFileSync(`src/components/Simulators/${file}`, 'utf8');
  if (content.includes('<HazardOverlay')) {
    if (!content.includes('intensity={')) {
      content = content.replace(/(magnitude=\{[^}]+\})\s*\/>/g, '$1\n        intensity={isPPESafe ? 0 : 0.8}\n      />');
      fs.writeFileSync(`src/components/Simulators/${file}`, content);
      console.log(`Patched ${file} with intensity`);
    }
  }
});
