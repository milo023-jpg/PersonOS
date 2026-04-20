const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const modulesDir = path.join(srcDir, 'modules');

const modules = [
  'auth', 'contexts', 'crm', 'dashboard', 'finance', 'goals', 'habits', 'inbox', 'notes', 'planner', 'routines', 'stats'
];

const moves = [];

// Helper to recursively get all files
function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const res = path.join(dir, file);
    if (fs.statSync(res).isDirectory()) getFiles(res, files);
    else files.push(res);
  }
  return files;
}

// 1. Gather files and determine new paths
for (const mod of modules) {
  const modPath = path.join(modulesDir, mod);
  if (!fs.existsSync(modPath)) continue;
  
  const modFiles = getFiles(modPath);
  
  for (const oldFile of modFiles) {
    const relToMod = path.relative(modPath, oldFile);
    let newRelToMod = relToMod;
    
    // Categorize
    if (relToMod.startsWith('store/') || relToMod.includes('Store.ts') || relToMod.includes('Calculator.ts')) {
      newRelToMod = 'application/' + (relToMod.replace('store/', 'store/').replace('services/', 'services/'));
      if (!newRelToMod.includes('store/') && !newRelToMod.includes('services/')) {
        if (relToMod.includes('Store.ts')) newRelToMod = 'application/store/' + relToMod;
        else if (relToMod.includes('Calculator.ts')) newRelToMod = 'application/services/' + relToMod;
      }
    } else if (relToMod.startsWith('components/') || relToMod.startsWith('pages/') || relToMod.endsWith('Page.tsx') || relToMod === 'Dashboard.tsx') {
      if (relToMod.startsWith('components/')) {
        newRelToMod = 'presentation/' + relToMod;
      } else if (relToMod.startsWith('pages/')) {
        newRelToMod = 'presentation/' + relToMod;
      } else {
        newRelToMod = 'presentation/pages/' + relToMod;
      }
    } else if (relToMod.startsWith('services/')) {
      newRelToMod = 'infrastructure/' + relToMod;
    } else if (relToMod === 'types.ts') {
      newRelToMod = 'domain/models/' + relToMod.replace('.ts', '.ts'); // Will just put in domain/models/types.ts or domain/types.ts. Let's do domain/models/types.ts
    }
    
    if (newRelToMod !== relToMod) {
      const newFile = path.join(modPath, newRelToMod);
      moves.push({ oldFile, newFile });
    }
  }
}

// Ensure unique moves
const uniqueMoves = [];
const seen = new Set();
for (const m of moves) {
  if (!seen.has(m.oldFile)) {
    seen.add(m.oldFile);
    uniqueMoves.push(m);
  }
}

console.log(JSON.stringify(uniqueMoves, null, 2));

