const fs = require('fs');

const simulators = [
  'ACShockSimulator.tsx',
  'DCShockSimulator.tsx',
  'ShortCircuitSimulator.tsx',
  'StepTouchSimulator.tsx'
];

simulators.forEach(file => {
  const path = 'src/components/Simulators/' + file;
  if (!fs.existsSync(path)) return;
  
  let content = fs.readFileSync(path, 'utf8');
  
  // Find the primary simulation button that we wrapped in <div className="hidden lg:block...">
  // We can just find the button that has "HOLD TO" or "SIMULATE" or "HOLD TO SHOCK"
  // Let's use a regex that matches the whole button element inside the hidden div.
  
  const hiddenDivRegex = /<div className="hidden lg:block[^>]*>([\s\S]*?<button[\s\S]*?<\/button>\s*)<\/div>/;
  const match = content.match(hiddenDivRegex);
  
  if (match) {
    const originalButton = match[1]; // The raw button string
    
    // Create the mobile button by modifying the classes of the original button
    let mobileButton = originalButton.replace(/lg:py-[^\s"]+/, ''); // remove lg overrides
    mobileButton = mobileButton.replace(/lg:text-[^\s"]+/, ''); 
    mobileButton = mobileButton.replace(/w-full py-[^\s"]+/, 'w-full py-4');
    mobileButton = mobileButton.replace(/text-[^\s"]+/, 'text-[14px]');
    mobileButton = mobileButton.replace(/shadow-\[[^\]]+\]/g, 'shadow-[0_15px_30px_rgba(0,0,0,0.6)]'); 
    mobileButton = mobileButton.replace(/hover:shadow-\[[^\]]+\]/g, ''); 
    
    if (!content.includes('<MobileActionButton>')) {
      // Add the portal right after the hidden div
      const insertionPoint = `\n<MobileActionButton>\n${mobileButton}\n</MobileActionButton>\n`;
      content = content.replace(match[0], match[0] + insertionPoint);
      
      // Ensure the import exists
      if (!content.includes('MobileActionButton')) {
        content = content.replace(/(import React.*?from 'react';)/, "$1\nimport { MobileActionButton } from '../MobileActionButton';");
      }
      
      fs.writeFileSync(path, content);
      console.log(`Added MobileActionButton to ${file}`);
    } else {
      console.log(`MobileActionButton already exists in ${file}`);
    }
  } else {
    // If not found inside a hidden div, it might not be wrapped yet.
    console.log(`Could not find hidden div in ${file}`);
  }
});
