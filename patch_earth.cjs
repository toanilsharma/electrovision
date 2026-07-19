const fs = require('fs');
let content = fs.readFileSync('src/components/Simulators/EarthFaultSimulator.tsx', 'utf8');

// Replace the hardcoded 0.8 intensity with a calculated fault current based on body resistance
if (content.includes('intensity={isPPESafe ? 0 : 0.8}')) {
    const calcStr = `
  const isCasingFaultActive = isSimulating && scenario === 'broken';
  
  // Physics calculation
  const faultCurrent = isCasingFaultActive ? (systemVoltage / 1000) * 1000 : 0; // 1000 ohm body resistance -> mA
  const maxExpectedFaultCurrent = 500; // max mA
  const intensity = Math.min(faultCurrent / maxExpectedFaultCurrent, 1.0);
`;
    content = content.replace(/const isCasingFaultActive = isSimulating && scenario === 'broken';/, calcStr.trim());
    
    content = content.replace(/intensity=\{isPPESafe \? 0 : 0\.8\}/g, 'intensity={isPPESafe ? 0 : Math.max(0.1, intensity)}');
    fs.writeFileSync('src/components/Simulators/EarthFaultSimulator.tsx', content);
    console.log(`Patched EarthFaultSimulator.tsx with fault current ratio intensity`);
} else {
    console.log("String not found in EarthFault");
}
