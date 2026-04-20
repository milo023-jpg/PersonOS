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
    
    if (relToMod.startsWith('store/') || relToMod.includes('Store.ts') || relToMod.includes('statsCalculator.ts')) {
      if (relToMod.includes('statsCalculator.ts')) {
        newRelToMod = 'application/services/' + path.basename(relToMod);
      } else {
        newRelToMod = 'application/store/' + path.basename(relToMod);
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
      newRelToMod = 'domain/models/' + relToMod;
    }
    
    if (newRelToMod !== relToMod) {
      const newFile = path.join(modPath, newRelToMod);
      moves.push({ oldFile, newFile });
    }
  }
}

const allSrcFiles = getFiles(srcDir);

// Perform moves
for (const m of moves) {
  const dir = path.dirname(m.newFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.renameSync(m.oldFile, m.newFile);
  console.log(`Moved ${path.relative(__dirname, m.oldFile)} -> ${path.relative(__dirname, m.newFile)}`);
}

// Update imports
for (const file of allSrcFiles) {
  // if file was moved, we need to read from its new location
  const actualFile = moves.find(m => m.oldFile === file)?.newFile || file;
  if (!fs.existsSync(actualFile)) continue;
  
  let content = fs.readFileSync(actualFile, 'utf8');
  let changed = false;
  
  // We need to match import statements and update paths
  const importRegex = /(from|import)\s+['"]([^'"]+)['"]/g;
  
  content = content.replace(importRegex, (match, p1, importPath) => {
    if (!importPath.startsWith('.')) return match; // Not a relative import
    
    const absoluteOriginalImportPath = path.resolve(path.dirname(file), importPath);
    
    // Check if the imported file was moved
    // Import path might omit the extension (.ts, .tsx) or /index.ts
    const possibleImportedFiles = [
      absoluteOriginalImportPath,
      absoluteOriginalImportPath + '.ts',
      absoluteOriginalImportPath + '.tsx',
      path.join(absoluteOriginalImportPath, 'index.ts'),
      path.join(absoluteOriginalImportPath, 'index.tsx')
    ];
    
    let moveRecord = null;
    let newImportedFile = absoluteOriginalImportPath;

    for (const p of possibleImportedFiles) {
      const m = moves.find(move => move.oldFile === p);
      if (m) {
        moveRecord = m;
        // Keep the same extension logic or strip it
        newImportedFile = m.newFile;
        // strip extension if original stripped it
        if (!importPath.endsWith('.ts') && !importPath.endsWith('.tsx')) {
           newImportedFile = newImportedFile.replace(/\.tsx?$/, '');
        }
        break;
      }
    }
    
    // Also, if the current file was moved, we need to recalculate relative path even if the imported file wasn't moved!
    // But since `newImportedFile` defaults to `absoluteOriginalImportPath`, we can just re-relativize always.
    
    const newRelativeStr = Math.random().toString();
    
    // Actually let's just properly resolve
    let finalTarget = moveRecord ? newImportedFile : absoluteOriginalImportPath;
    
    // path.relative from new actualFile dir to finalTarget
    let newCalculatedImport = path.relative(path.dirname(actualFile), finalTarget);
    if (!newCalculatedImport.startsWith('.')) {
      newCalculatedImport = './' + newCalculatedImport;
    }
    
    if (newCalculatedImport !== importPath) {
       changed = true;
       // Quick formatting fix for windows vs posix just in case
       newCalculatedImport = newCalculatedImport.split(path.sep).join('/');
       return `${p1} '${newCalculatedImport}'`;
    }
    
    return match;
  });
  
  if (changed) {
    fs.writeFileSync(actualFile, content, 'utf8');
    console.log(`Updated imports in ${path.relative(__dirname, actualFile)}`);
  }
}

// Clean up empty directories from moves
for (const m of moves) {
  let d = path.dirname(m.oldFile);
  while (d !== modulesDir && d.startsWith(modulesDir)) {
    try {
      if (fs.readdirSync(d).length === 0) {
        fs.rmdirSync(d);
        d = path.dirname(d);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
}

console.log("Done refactoring.");
