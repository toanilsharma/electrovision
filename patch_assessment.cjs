const fs = require('fs');

let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/'first_aid' \| 'certification' \| 'learning-center'/, "'first_aid' | 'certification' | 'learning-center' | 'assessment'");
fs.writeFileSync('src/types.ts', types);

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("import { LearningCenter } from './components/LearningCenter';", "import { LearningCenter } from './components/LearningCenter';\nimport { AssessmentModule } from './components/AssessmentModule';");
app = app.replace(/case 'learning-center':\s*return <LearningCenter config=\{userConfig\} \/>;/, "case 'learning-center':\n        return <LearningCenter config={userConfig} />;\n      case 'assessment':\n        return <AssessmentModule />;\n");
fs.writeFileSync('src/App.tsx', app);

let top = fs.readFileSync('src/components/TopNavigation.tsx', 'utf8');
top = top.replace(/\{ id: 'learning-center', label: 'Learning Center', icon: BookOpen \},/, "{ id: 'learning-center', label: 'Learning Center', icon: BookOpen },\n  { id: 'assessment', label: 'Assessment Mode', icon: ShieldCheck },");
fs.writeFileSync('src/components/TopNavigation.tsx', top);

console.log("Patched Assessment Mode");
