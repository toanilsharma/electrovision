const fs = require('fs');
let content = fs.readFileSync('src/components/HazardOverlay.tsx', 'utf8');

// Fix layout (row instead of column on mobile)
content = content.replace(/flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left/g, 'flex flex-row items-center gap-3 md:gap-4 text-left');

// Fix title font size (base to lg on mobile)
content = content.replace(/text-base md:text-lg/g, 'text-lg md:text-xl');

// Fix description font size (xs to sm on mobile)
content = content.replace(/text-xs md:text-sm/g, 'text-sm md:text-base');

fs.writeFileSync('src/components/HazardOverlay.tsx', content);
console.log("Updated HazardOverlay.tsx layout and font");
