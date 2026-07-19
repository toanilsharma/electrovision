const fs = require('fs');

let content = fs.readFileSync('src/components/HumanBodyTwin.tsx', 'utf8');

const originalEffectsCode = `{/* Text Overlays for Organ/Nerve Effects */}
        <AnimatePresence>
          {activeEffects.map((effect, index) => {
            return (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                className={\`absolute flex items-center gap-1.5 bg-slate-950/95 border backdrop-blur-xl px-2 py-1.5 rounded-lg shadow-2xl z-20 \${effect.color} \${effect.border}\`}
                style={{
                  top: effect.top,
                  left: effect.left,
                  right: effect.right,
                }}
              >
                <div className={\`w-1.5 h-1.5 rounded-full animate-ping \${effect.color.replace('text-', 'bg-')}\`} />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                  {effect.label}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>`;

const newEffectsCode = `{/* Mobile List View for Effects (Bottom Left) */}
        <div className="md:hidden absolute bottom-2 left-2 flex flex-col gap-1.5 z-30 pointer-events-none">
          <AnimatePresence>
            {activeEffects.map((effect, index) => (
              <motion.div
                key={\`mobile-\${effect.id}\`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.1 }}
                className={\`flex items-center gap-2 bg-slate-950/95 border backdrop-blur-xl px-2.5 py-1.5 rounded-lg shadow-2xl \${effect.color} \${effect.border}\`}
              >
                <div className={\`w-2 h-2 rounded-full animate-ping \${effect.color.replace('text-', 'bg-')}\`} />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap">
                  {effect.label}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Desktop Absolute Positioned Effects */}
        <div className="hidden md:block">
          <AnimatePresence>
            {activeEffects.map((effect, index) => (
              <motion.div
                key={\`desktop-\${effect.id}\`}
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                className={\`absolute flex items-center gap-1.5 bg-slate-950/95 border backdrop-blur-xl px-2 py-1.5 rounded-lg shadow-2xl z-20 pointer-events-none \${effect.color} \${effect.border}\`}
                style={{
                  top: effect.top,
                  left: effect.left,
                  right: effect.right,
                }}
              >
                <div className={\`w-1.5 h-1.5 rounded-full animate-ping \${effect.color.replace('text-', 'bg-')}\`} />
                <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest whitespace-nowrap">
                  {effect.label}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>`;

if (content.includes('Text Overlays for Organ/Nerve Effects')) {
    // Find the exact string by a rougher match if exact fails
    const match = content.match(/\{\/\* Text Overlays for Organ\/Nerve Effects \*\/\}[\s\S]*?<\/AnimatePresence>/);
    if (match) {
        content = content.replace(match[0], newEffectsCode);
        fs.writeFileSync('src/components/HumanBodyTwin.tsx', content);
        console.log("Updated HumanBodyTwin.tsx effects");
    } else {
        console.log("Could not find exact block to replace");
    }
} else {
    console.log("Not found");
}

