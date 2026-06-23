// Build script: genera public/tactics.js desde src/lib/tactics.ts
// El output expone las funciones en window para compatibilidad con el HTML.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src/lib/tactics.ts');
const tmpDir = path.join(root, '.tmp/tactics');
const outFile = path.join(root, 'public/tactics.js');

// Limpiar y compilar
fs.rmSync(tmpDir, { recursive: true, force: true });
const tsc = path.join(root, 'node_modules/typescript/lib/tsc.js');
const result = spawnSync('node', [
  tsc,
  src,
  '--outDir', tmpDir,
  '--module', 'esnext',
  '--target', 'es2020',
  '--declaration', 'false',
  '--esModuleInterop', 'false',
  '--skipLibCheck', 'true',
], { cwd: root, stdio: 'pipe' });

if (result.status !== 0) {
  console.error(result.stderr.toString());
  process.exit(result.status || 1);
}

const compiled = path.join(tmpDir, 'tactics.js');
let code = fs.readFileSync(compiled, 'utf8');

// Quitar keywords export
const exportedNames = [];

code = code.replace(/^export\s+(const|function|var)\s+(\w+)/gm, (match, kind, name) => {
  exportedNames.push(name);
  return `${kind} ${name}`;
});

code = code.replace(/\bexport\s+\{/g, '');
code = code.replace(/\bexport\s+\b/g, '');

// Header + IIFE + window assignments
const windowAssignments = exportedNames.map(n => `window.${n}=${n};`).join('\n');
const output = `// Generated from src/lib/tactics.ts — do not edit manually
// Run: npm run build:tactics
(function(){\n${code}\n${windowAssignments}\n})();\n`;

fs.writeFileSync(outFile, output);
console.log(`Built ${outFile} (${exportedNames.length} functions exported to window)`);
