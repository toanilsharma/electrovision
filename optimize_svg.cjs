const fs = require('fs');

let content = fs.readFileSync('src/components/HumanBodyTwin.tsx', 'utf8');

// Remove defs
content = content.replace(/<defs>[\s\S]*?<\/defs>/, '');

// Replace filters with CSS drop-shadows
content = content.replace(/filter="url\(#glow-heavy\)"/g, 'className="drop-shadow-[0_0_10px_currentColor]"');
content = content.replace(/filter="url\(#glow-extreme\)"/g, 'className="drop-shadow-[0_0_20px_currentColor]"');

// Also the mix-blend-screen can be heavy if used in multiple places, but we can leave it for now.
// Let's remove the heavy motion.rect blur
content = content.replace(/<motion\.rect[^>]+fill="#f97316" filter="blur\(20px\)"[^>]+>/, '<motion.rect x="0" y="80" width="200" height="200" fill="#f97316" className="opacity-50 mix-blend-screen" initial={{opacity:0}} animate={{opacity:0.3}} exit={{opacity:0}} />');

fs.writeFileSync('src/components/HumanBodyTwin.tsx', content);
console.log("Optimized HumanBodyTwin.tsx");
