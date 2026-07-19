const fs = require('fs');

let content = fs.readFileSync('src/components/HumanBodyTwin.tsx', 'utf8');

content = content.replace(/<motion\.g initial=\{\{opacity:0\}\} animate=\{\{opacity:0\.8\}\} exit=\{\{opacity:0\}\}/, '<motion.g key="nerves" initial={{opacity:0}} animate={{opacity:0.8}} exit={{opacity:0}}');
content = content.replace(/<motion\.rect x="0" y="80"/, '<motion.rect key="burns" x="0" y="80"');
content = content.replace(/<motion\.g initial=\{\{opacity:0\}\} animate=\{\{opacity:0\.9\}\}/, '<motion.g key="lungs" initial={{opacity:0}} animate={{opacity:0.9}}');
content = content.replace(/<motion\.g initial=\{\{opacity:0\}\} animate=\{\{opacity:1\}\}/, '<motion.g key="heart" initial={{opacity:0}} animate={{opacity:1}}');

fs.writeFileSync('src/components/HumanBodyTwin.tsx', content);
console.log("Fixed missing keys in HumanBodyTwin.tsx");
