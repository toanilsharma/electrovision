const fs = require('fs');

let content = fs.readFileSync('src/components/HazardOverlay.tsx', 'utf8');

// Replace the setInterval block for the oscillator to use intensity
const newAudioStr = `
        let high = true;
        interval = setInterval(() => {
          const baseVol = 0.05 + (0.2 * intensity);
          if (high) {
            osc.frequency.setValueAtTime(800 + (200 * intensity), audioCtx.currentTime);
            gain.gain.setValueAtTime(baseVol, audioCtx.currentTime);
          } else {
            osc.frequency.setValueAtTime(600 + (200 * intensity), audioCtx.currentTime);
            gain.gain.setValueAtTime(baseVol, audioCtx.currentTime);
          }
          high = !high;
        }, Math.max(80, 200 - (100 * intensity)));
`;

content = content.replace(/let high = true;\s*interval = setInterval\(\(\) => \{[\s\S]*?\}, 150\);/, newAudioStr.trim());

fs.writeFileSync('src/components/HazardOverlay.tsx', content);
console.log("Updated HazardOverlay audio intensity");
