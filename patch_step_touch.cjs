const fs = require('fs');
let content = fs.readFileSync('src/components/Simulators/StepTouchSimulator.tsx', 'utf8');

// Replace the hardcoded 0.8 intensity with ratio to fault current
if (content.includes('intensity={isPPESafe ? 0 : 0.8}')) {
    content = content.replace(/intensity=\{isPPESafe \? 0 : 0\.8\}/g, 'intensity={isPPESafe ? 0 : Math.max(0.1, Math.min(faultCurrent / 1500, 1.0)) * (activeActualVoltage / activeAllowableLimit > 1 ? 1 : 0.5)}');
    fs.writeFileSync('src/components/Simulators/StepTouchSimulator.tsx', content);
    console.log(`Patched StepTouchSimulator.tsx with fault current ratio intensity`);
} else {
    console.log("String not found in StepTouch");
}
