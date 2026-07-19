const fs = require('fs');
let file = 'src/components/Simulators/EarthFaultSimulator.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<button\s+onMouseDown=\{[^\}]+\}\s+onMouseUp=\{[^\}]+\}\s+onMouseLeave=\{[^\}]+\}\s+onTouchStart=\{[^\}]+\}\s+onTouchEnd=\{[^\}]+\}/g, 
`<button 
            onPointerDown={(e) => { 
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
console.log("Done2")
