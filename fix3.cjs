const fs = require('fs');
let file = 'src/components/Simulators/EarthFaultSimulator.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/onMouseDown=\{[^\n]+\n\s+onMouseUp=\{[^\n]+\n\s+onMouseLeave=\{[^\n]+\n\s+onTouchStart=\{[^\n]+\n\s+onTouchEnd=\{[^\n]+/g, 
`onPointerDown={(e) => { 
              if (isLoadEnergized) {
                e.currentTarget.setPointerCapture(e.pointerId);
                setIsSimulating(true); 
              }
            }}
            onPointerUp={(e) => { 
              e.currentTarget.releasePointerCapture(e.pointerId);
              setIsSimulating(false); 
            }}
            onPointerLeave={() => setIsSimulating(false)}
            onPointerCancel={() => setIsSimulating(false)}
            onContextMenu={(e) => e.preventDefault()}
            style={{ touchAction: 'none' }}`);
fs.writeFileSync(file, content);
console.log("Done3")
