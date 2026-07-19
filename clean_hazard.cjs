const fs = require('fs');

let content = fs.readFileSync('src/components/HazardOverlay.tsx', 'utf8');

// First replace the double keys
content = content.replace(/key="hazard-fullscreen"\s*key="hazard-overlay-panel"/g, 'key="hazard-overlay-panel"');
content = content.replace(/key="hazard-fullscreen"\s*/g, '');

// Now we need to add the key specifically to the motion.div that is a direct child of AnimatePresence
content = content.replace(/<motion\.div\s*initial=\{\{ opacity: 0 \}\}/, '<motion.div key="hazard-fullscreen" initial={{ opacity: 0 }}');

fs.writeFileSync('src/components/HazardOverlay.tsx', content);
console.log("Fixed HazardOverlay keys");
