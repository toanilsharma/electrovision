const fs = require('fs');
let content = fs.readFileSync('src/components/Simulators/EarthFaultSimulator.tsx', 'utf8');

const malformedRegex = /<MobileActionButton>[\s\S]*?<\/MobileActionButton>/;
if (malformedRegex.test(content)) {
  content = content.replace(malformedRegex, '');
  
  const triggerBtnRegex = /<button[^>]*?onPointerDown[\s\S]*?HOLD TO TRIGGER INTERNAL CASING FAULT[\s\S]*?<\/button>/;
  const match = content.match(triggerBtnRegex);
  
  if (match) {
    const origBtn = match[0];
    const wrappedDesktop = `<div className="hidden lg:block mt-auto pt-4 shrink-0">\n${origBtn}\n</div>`;
    
    let mobileBtn = origBtn.replace(/w-full py-[^\s"]+/, 'w-full py-4');
    mobileBtn = mobileBtn.replace(/text-\[10px\] md:text-xs/, 'text-[14px]');
    
    const mobilePortal = `\n<MobileActionButton>\n${mobileBtn}\n</MobileActionButton>\n`;
    
    content = content.replace(origBtn, wrappedDesktop + mobilePortal);
    fs.writeFileSync('src/components/Simulators/EarthFaultSimulator.tsx', content);
    console.log("Fixed EarthFaultSimulator");
  } else {
    console.log("Trigger button not found");
  }
} else {
  console.log("Malformed block not found");
}
