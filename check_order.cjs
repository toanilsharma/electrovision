const fs = require('fs');

const simulators = [
  'ACShockSimulator.tsx',
  'DCShockSimulator.tsx',
  'EarthFaultSimulator.tsx',
  'ShortCircuitSimulator.tsx',
  'ArcFlashSimulator.tsx',
  'StepTouchSimulator.tsx'
];

simulators.forEach(file => {
  const path = 'src/components/Simulators/' + file;
  if (!fs.existsSync(path)) return;
  const content = fs.readFileSync(path, 'utf8');
  console.log(`\n--- ${file} ---`);
  
  // Find all order- classes
  const regex = /order-\d+ lg:order-\d+/g;
  const matches = content.match(regex);
  if (matches) {
    console.log(matches.join(', '));
  } else {
    console.log("No order classes found");
  }
});
