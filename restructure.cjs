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
  
  // Remove the inner flex wrapper for Column 1 & 2
  // It looks like: <div className="flex flex-col lg:flex-row flex-1 gap-2 h-auto lg:h-full shrink-0 order-2 lg:order-1">
  const wrapperRegex = /<div className="flex flex-col lg:flex-row flex-1 gap-2 h-auto lg:h-full shrink-0 [^"]+">\s*(\{\/\* Column 1: Controls \*\/\}|<!-- Column 1)/;
  
  if (wrapperRegex.test(content)) {
    // Replace the wrapper opening with just the comment
    content = content.replace(wrapperRegex, '$1');
    
    // Now we need to remove the closing tag of this wrapper.
    // The closing tag is right before {/* Column 3: Graphics
    const closingRegex = /<\/div>\s*\{\/\* Column 3: Graphics/;
    content = content.replace(closingRegex, '{/* Column 3: Graphics');
  }

  // Adjust order classes on the 3 main columns
  
  // Column 1:
  content = content.replace(/(\{\/\* Column 1: Controls \*\/}[\s\S]*?<div className="[^"]+)(")/, (match, p1, p2) => {
    return p1 + ' order-1 lg:order-1' + p2;
  });

  // Column 2:
  content = content.replace(/(\{\/\* Column 2: Analysis & PPE \*\/}[\s\S]*?<div className="[^"]+)(")/, (match, p1, p2) => {
    return p1 + ' order-3 lg:order-2' + p2;
  });

  // Column 3:
  // It might already have order-1 lg:order-2. We need to replace it with order-2 lg:order-3
  content = content.replace(/order-1 lg:order-2/g, 'order-2 lg:order-3');
  
  // For EarthFault, the Column 3 isn't labeled "Column 3" but has "order-1 lg:order-2"
  
  // Let's also shrink the graphics height on mobile
  // Replace min-h-[300px] md:min-h-[400px] with h-[200px] min-h-[200px] lg:min-h-[400px]
  content = content.replace(/min-h-\[300px\] md:min-h-\[400px\]/g, 'h-[220px] min-h-[220px] lg:h-auto lg:min-h-[400px]');
  content = content.replace(/h-64 lg:h-full/g, 'h-[220px] min-h-[220px] lg:h-full'); // For StepTouch and EarthFault
  content = content.replace(/min-h-\[300px\] lg:h-full/g, 'h-[220px] min-h-[220px] lg:h-full'); // For DC Shock
  
  // Shrink waveforms
  content = content.replace(/h-20 lg:h-28/g, 'h-16 lg:h-28');
  content = content.replace(/h-20 shrink-0/g, 'h-16 lg:h-20 shrink-0');

  fs.writeFileSync(path, content);
  console.log(`Restructured ${file}`);
});
