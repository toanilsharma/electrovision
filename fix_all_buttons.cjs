const fs = require('fs');

const simulators = [
  'ACShockSimulator.tsx',
  'DCShockSimulator.tsx',
  'EarthFaultSimulator.tsx',
  'ShortCircuitSimulator.tsx',
  'ArcFlashSimulator.tsx',
  'StepTouchSimulator.tsx'
];

simulators.forEach(file => {
  const path = 'src/components/Simulators/' + file;
  if (!fs.existsSync(path)) return;
  
  let content = fs.readFileSync(path, 'utf8');
  
  const buttonRegex = /(<button[\s\S]*?active:scale-95[\s\S]*?<\/button>)/;
  const match = content.match(buttonRegex);
  
  if (match) {
    if (!content.includes('MobileActionButton')) {
      content = content.replace(/(import React.*?from 'react';)/, "$1\nimport { MobileActionButton } from '../MobileActionButton';");
    }
    const originalButton = match[1];
    
    let mobileButton = originalButton.replace(/w-full\s+py-[^\s"]+/g, 'w-full py-4');
    mobileButton = mobileButton.replace(/text-(?:\[10px\]|xs)(?:\s+md:text-xs|\s+lg:text-(?:\[10px\]|xs))?/g, 'text-[14px]');
    mobileButton = mobileButton.replace(/shadow-\[[^\]]+\]/g, 'shadow-[0_15px_30px_rgba(0,0,0,0.6)]'); 
    mobileButton = mobileButton.replace(/hover:shadow-\[[^\]]+\]/g, ''); 
    
    content = content.replace(/<div className="fixed bottom-4 left-4 right-4 z-\[[^\]]+\] lg:static lg:mt-auto lg:pt-4 shrink-0">/, '<div className="hidden lg:block mt-auto pt-4 shrink-0">');
    content = content.replace(/<div className="fixed bottom-4 left-4 right-4 z-\[[^\]]+\] lg:static lg:w-full lg:z-auto pointer-events-auto">/, '<div className="hidden lg:block w-full pointer-events-auto">');
    content = content.replace(/<div className="fixed bottom-4 left-4 right-4 z-\[[^\]]+\] lg:static lg:w-full lg:mt-4">/, '<div className="hidden lg:block w-full mt-4">');
    
    if (file === 'ShortCircuitSimulator.tsx') {
      content = content.replace(/<div className="mt-4 shrink-0">/, '<div className="hidden lg:block mt-4 shrink-0">');
    }
    
    if (!content.includes('<MobileActionButton>')) {
      const insertionPoint = `\n<MobileActionButton>\n${mobileButton}\n</MobileActionButton>\n`;
      content = content.replace(originalButton, `${originalButton}\n${insertionPoint}`);
    }
    
    fs.writeFileSync(path, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`No match in ${file}`);
  }
});
