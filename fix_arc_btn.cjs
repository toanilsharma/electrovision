const fs = require('fs');
let file = 'src/components/Simulators/ArcFlashSimulator.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<button\s+onPointerDown=\{\(e\) => \{ e\.currentTarget\.setPointerCapture\(e\.pointerId\); handleInitiate\(\); \}\}/, 
`<div className="fixed bottom-4 left-4 right-4 z-[80] lg:static lg:w-full lg:mt-4">
            <button 
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handleInitiate(); }}`);
              
content = content.replace(/HOLD TO INITIATE ARC\s*<\/button>/, 
`HOLD TO INITIATE ARC
            </button>
            </div>`);

content = content.replace(/className="w-full py-3 mt-4 font-black text-\[10px\] md:text-xs uppercase tracking-\[0\.2em\] text-slate-900 transition-all rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 flex items-center justify-center gap-2 select-none shadow-\[0_0_20px_rgba\(249,115,22,0\.3\)\] hover:shadow-\[0_0_30px_rgba\(249,115,22,0\.5\)\] shrink-0"/,
`className="w-full py-4 lg:py-3 font-black text-xs uppercase tracking-[0.2em] text-slate-900 transition-all rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 flex items-center justify-center gap-2 select-none shadow-2xl lg:shadow-[0_0_20px_rgba(249,115,22,0.3)] shrink-0"`);

fs.writeFileSync(file, content);
console.log("Done");
