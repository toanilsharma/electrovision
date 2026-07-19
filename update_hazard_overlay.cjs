const fs = require('fs');

let content = fs.readFileSync('src/components/HazardOverlay.tsx', 'utf8');

// Add intensity prop
content = content.replace(/magnitude\?: string;\n\}/, 'magnitude?: string;\n  intensity?: number;\n}');
content = content.replace(/const HazardOverlay: React\.FC<HazardOverlayProps> = \(\{ isActive, hazardType, dangerLevel, magnitude \}\) => \{/, 'const HazardOverlay: React.FC<HazardOverlayProps> = ({ isActive, hazardType, dangerLevel, magnitude, intensity = 1.0 }) => {');

// Adjust the visual flash based on intensity
// Right now we have:
// opacity: [0.1, 0.4, 0.1], scale: [1, 1.02, 1]
// let's adjust opacity dynamically if intensity is provided
const replacementVisuals = `
            <motion.div key="hazard-fullscreen" 
              animate={{ 
                opacity: [0.1 * intensity, Math.max(0.4 * intensity, 0.1), 0.1 * intensity],
                scale: [1, 1 + (0.05 * intensity), 1] 
              }}
              transition={{ repeat: Infinity, duration: 0.5 - (0.3 * intensity) }}
`;
content = content.replace(/<motion\.div key="hazard-fullscreen"\s*animate=\{\{\s*opacity: \[0\.1, 0\.4, 0\.1\],\s*scale: \[1, 1\.02, 1\]\s*\}\}\s*transition=\{\{ repeat: Infinity, duration: 0\.5 \}\}/, replacementVisuals.trim());

// Also adjust the screen shake intensity based on intensity prop
const shakeStyleStr = `
                body { animation: screen-shake 0.4s cubic-bezier(.36,.07,.19,.97) both infinite; }
                @keyframes screen-shake {
                  0%, 100% { transform: translate3d(0, 0, 0); }
                  10%, 30%, 50%, 70%, 90% { transform: translate3d(-\${4 * intensity}px, 0, 0); }
                  20%, 40%, 60%, 80% { transform: translate3d(\${4 * intensity}px, 0, 0); }
                }
`;

content = content.replace(/body \{ animation: screen-shake 0\.4s cubic-bezier\(\.36,\.07,\.19,\.97\) both infinite; \}[\s\S]*?\}/, shakeStyleStr.trim());

// Ensure the style block is a template literal if we are substituting
content = content.replace(/<style dangerouslySetInnerHTML=\{\{__html: `\s*body/, '<style dangerouslySetInnerHTML={{__html: `body');

fs.writeFileSync('src/components/HazardOverlay.tsx', content);
console.log("Updated HazardOverlay intensity physics");
