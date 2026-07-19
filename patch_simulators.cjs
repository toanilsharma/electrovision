const fs = require('fs');

['ACShockSimulator.tsx', 'DCShockSimulator.tsx'].forEach(file => {
  let content = fs.readFileSync(`src/components/Simulators/${file}`, 'utf8');
  if (content.includes('magnitude={')) {
    content = content.replace(/(magnitude=\{[^}]+\})\s*\/>/g, '$1\n        intensity={results.intensity}\n      />');
    fs.writeFileSync(`src/components/Simulators/${file}`, content);
    console.log(`Patched ${file} with intensity`);
  }
});
