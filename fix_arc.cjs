const fs = require('fs');
let file = 'src/components/Simulators/ArcFlashSimulator.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('z-[110]')) {
  content = content.replace(/<div className="flex flex-col lg:flex-row h-full">/g,
  `<AnimatePresence>
        {isSimulating && (
          <motion.div
            key="screen-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0.8, 0.4, 0] }}
            transition={{ duration: 1.5, times: [0, 0.05, 0.1, 0.3, 0.8, 1] }}
            className="fixed inset-0 pointer-events-none z-[110] bg-white mix-blend-screen"
          />
        )}
      </AnimatePresence>
      <div className="flex flex-col lg:flex-row h-full">`);
  fs.writeFileSync(file, content);
}
console.log("Done");
