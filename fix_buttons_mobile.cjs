const fs = require('fs');

const files = [
  'src/components/Simulators/ACShockSimulator.tsx',
  'src/components/Simulators/DCShockSimulator.tsx',
  'src/components/Simulators/ArcFlashSimulator.tsx',
  'src/components/Simulators/EarthFaultSimulator.tsx',
  'src/components/Simulators/ShortCircuitSimulator.tsx',
  'src/components/Simulators/StepTouchSimulator.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // For EarthFaultSimulator
    if (file.includes('EarthFaultSimulator')) {
      content = content.replace(/\{(\/\*\s*Trigger simulator\s*\*\/)\}\s*<button/, 
        `<div className="fixed bottom-4 left-4 right-4 z-[100] lg:static lg:w-full lg:z-auto pointer-events-auto">\n          {$1}\n          <button`);
      content = content.replace(/className=\{cn\(\s*"w-full py-2\.5 font-black text-\[10px\] md:text-xs uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 select-none shadow-lg",/g,
        `className={cn(\n              "w-full py-3.5 lg:py-2.5 font-black text-xs uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 select-none shadow-2xl lg:shadow-lg",`);
      content = content.replace(/<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Column 2/, 
        `</button>\n          </div>\n          </div>\n        </div>\n        </div>\n\n        {/* Column 2`);
    }

  }
});
