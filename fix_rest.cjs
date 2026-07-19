const fs = require('fs');

const simulators = [
  'EarthFaultSimulator.tsx',
  'ShortCircuitSimulator.tsx',
  'ArcFlashSimulator.tsx',
  'StepTouchSimulator.tsx'
];

simulators.forEach(file => {
  const path = 'src/components/Simulators/' + file;
  if (!fs.existsSync(path)) return;
  
  let content = fs.readFileSync(path, 'utf8');
  
  // They probably still have the wrapper: <div className="flex flex-col lg:flex-row flex-1 gap-4 ... order-2 lg:order-1">
  // or gap-2 etc.
  
  // Let's find the wrapper:
  const wrapperRegex = /<div className="flex flex-col lg:flex-row flex-1[^>]+order-2 lg:order-1[^>]*>/;
  
  if (wrapperRegex.test(content)) {
    // Replace the wrapper opening with an empty string
    content = content.replace(wrapperRegex, '');
    
    // The closing tag of this wrapper is just before the graphics column
    // The graphics column usually starts with:
    // <div className="... order-2 lg:order-3
    // or
    // {/* Column 3: Graphics
    // or 
    // {/* Dynamic single-line & physical diagram */}
    // Let's just find `</div>\n      <div className="[^"]+order-2 lg:order-3`
    
    const closingRegex = /<\/div>\s*<div className="[^"]+order-2 lg:order-3/;
    content = content.replace(closingRegex, (match) => {
      // Remove the </div> from the match
      return match.replace(/<\/div>\s*/, '');
    });
  }

  // Now the two children (Controls and Analysis) are direct children.
  // We need to give them order classes.
  // The Controls div is the first child (usually w-full lg:w-[320px] or lg:w-[350px])
  // The Analysis div is the second child (usually flex-1 min-w-[280px] or similar)
  
  content = content.replace(/(<div className="w-full lg:w-\[\d+px\] shrink-0[^"]+)(")/, (match, p1, p2) => {
    return p1 + ' order-1 lg:order-1' + p2;
  });
  
  content = content.replace(/(<div className="flex-1 min-w-\[\d+px\][^"]+)(")/, (match, p1, p2) => {
    return p1 + ' order-3 lg:order-2' + p2;
  });

  fs.writeFileSync(path, content);
  console.log(`Fixed ${file}`);
});
