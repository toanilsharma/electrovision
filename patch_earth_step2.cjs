const fs = require('fs');

// Patch EarthFault
let earth = fs.readFileSync('src/components/Simulators/EarthFaultSimulator.tsx', 'utf8');
const earthCalc = `
  const isCasingFaultActive = isSimulating && scenario === 'broken';
  
  // Physics calculation
  const faultCurrent = isCasingFaultActive ? (systemVoltage / 1000) * 1000 : 0; // 1000 ohm body resistance -> mA
  const maxExpectedFaultCurrent = 500; // max mA
  const intensity = Math.min(faultCurrent / maxExpectedFaultCurrent, 1.0);
`;
earth = earth.replace(/const isCasingFaultActive = isSimulating && scenario === 'broken';/, earthCalc.trim());
earth = earth.replace(/(magnitude=\{`\$\{systemVoltage\}V Touch Voltage`\})\s*\/>/, '$1\n        intensity={isPPESafe ? 0 : Math.max(0.1, intensity)}\n      />');
fs.writeFileSync('src/components/Simulators/EarthFaultSimulator.tsx', earth);


// Patch StepTouch
let step = fs.readFileSync('src/components/Simulators/StepTouchSimulator.tsx', 'utf8');
step = step.replace(/(magnitude=\{`\$\{activeActualVoltage\.toFixed\(0\)\}V vs \$\{activeAllowableLimit\.toFixed\(0\)\}V max`\})\s*\/>/, '$1\n        intensity={isPPESafe ? 0 : Math.max(0.1, Math.min(faultCurrent / 1500, 1.0)) * (activeActualVoltage / activeAllowableLimit > 1 ? 1 : 0.5)}\n      />');
fs.writeFileSync('src/components/Simulators/StepTouchSimulator.tsx', step);

console.log("Patched both correctly.");
