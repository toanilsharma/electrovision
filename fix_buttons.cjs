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
    content = content.replace(
      /onMouseDown=\{([^\}]+)\}\s+onMouseUp=\{([^\}]+)\}\s+onMouseLeave=\{([^\}]+)\}\s+onTouchStart=\{([^\}]+)\}\s+onTouchEnd=\{([^\}]+)\}/g,
      `onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); $1(); }}
                onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); $2(); }}
                onPointerLeave={$3}
                onPointerCancel={$3}
                onContextMenu={(e) => e.preventDefault()}
                style={{ touchAction: 'none' }}`
    );
    
    // For EarthFaultSimulator which uses inline arrow function for onMouseDown
    content = content.replace(
      /onMouseDown=\{\(\) => \{ if \(isLoadEnergized\) setIsSimulating\(true\); \}\}\s+onMouseUp=\{handleStop\}\s+onMouseLeave=\{handleStop\}\s+onTouchStart=\{\(\) => \{ if \(isLoadEnergized\) setIsSimulating\(true\); \}\}\s+onTouchEnd=\{handleStop\}/g,
      `onPointerDown={(e) => { 
                  if (isLoadEnergized) {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setIsSimulating(true);
                  }
                }}
                onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); handleStop(); }}
                onPointerLeave={handleStop}
                onPointerCancel={handleStop}
                onContextMenu={(e) => e.preventDefault()}
                style={{ touchAction: 'none' }}`
    );
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed buttons');
