const fs = require('fs');
let content = fs.readFileSync('src/components/HumanBodyTwin.tsx', 'utf8');

content = content.replace(/className="md:hidden absolute bottom-2 left-2 flex flex-col gap-1\.5 z-30 pointer-events-none"/, 'className="md:hidden absolute top-14 left-2 flex flex-col gap-1.5 z-30 pointer-events-none"');

fs.writeFileSync('src/components/HumanBodyTwin.tsx', content);
