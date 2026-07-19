const fs = require('fs');
let content = fs.readFileSync('src/components/HazardOverlay.tsx', 'utf8');

const correctStyle = `<style dangerouslySetInnerHTML={{__html: \`
                body { animation: screen-shake 0.4s cubic-bezier(.36,.07,.19,.97) both infinite; }
                @keyframes screen-shake {
                  0%, 100% { transform: translate3d(0, 0, 0); }
                  10%, 30%, 50%, 70%, 90% { transform: translate3d(-\${4 * intensity}px, 0, 0); }
                  20%, 40%, 60%, 80% { transform: translate3d(\${4 * intensity}px, 0, 0); }
                }
              \`}} />`;

content = content.replace(/<style dangerouslySetInnerHTML=\{\{__html: `body \{ animation: screen-shake 0\.4s cubic-bezier\(\.36,\.07,\.19,\.97\) both infinite; \}[\s\S]*?`\}\} \/>/, correctStyle);

fs.writeFileSync('src/components/HazardOverlay.tsx', content);
console.log("Fixed screen shake");
