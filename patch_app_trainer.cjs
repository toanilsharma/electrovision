const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("import { AssessmentModule } from './components/AssessmentModule';", "import { AssessmentModule } from './components/AssessmentModule';\nimport { TrainerToolbar } from './components/TrainerToolbar';");
app = app.replace(/<div className="max-w-\[1600px\] w-full p-2 lg:p-4 mx-auto flex flex-col h-full overflow-hidden">/, '<TrainerToolbar />\n          <div className="max-w-[1600px] w-full p-2 lg:p-4 mx-auto flex flex-col h-full overflow-hidden">');
fs.writeFileSync('src/App.tsx', app);

console.log("Patched App.tsx with TrainerToolbar");
