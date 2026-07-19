const fs = require('fs');
let file = 'src/components/HazardOverlay.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/try \{\s*if \(gain\) \{\s*gain\.gain\.exponentialRampToValueAtTime\(0\.01, audioCtx\.currentTime \+ 0\.1\);\s*\}\s*if \(osc\) \{\s*setTimeout\(\(\) => osc\.stop\(\), 100\);\s*\}\s*\} catch \(e\) \{\}/g,
`try {
          if (gain) {
            gain.gain.setValueAtTime(0, gain.context.currentTime);
          }
          if (osc) {
            osc.stop();
          }
        } catch (e) {}`);

fs.writeFileSync(file, content);
console.log("Done");
