const fs = require('fs');
let file = 'src/components/HumanBodyTwin.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-300"/g,
`className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-300"`);

content = content.replace(/background: \`radial-gradient\\(circle at center, transparent 30%, \\\$\\{intensity > 0\.7 \? '#ef4444' : '#f97316'\\} 150%\\)\`/g,
`background: \`radial-gradient(circle at center, transparent 10%, \${intensity > 0.7 ? 'rgba(239,68,68,0.4)' : 'rgba(249,115,22,0.3)'} 100%)\``);

fs.writeFileSync(file, content);
console.log("Done");
