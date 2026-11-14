import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['node_modules', '.next', '.git', 'dist', 'build', '.turbo', 'coverage'].includes(file)) continue;
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, fileList);
    } else if (/\.(tsx|ts|jsx|js|mjs)$/.test(file)) {
      fileList.push(filepath);
    }
  }
  return fileList;
}

const targets = ['apps/guest/src', 'apps/host/src', 'apps/admin/src', 'apps/cms/src', 'packages/shared/src'];
const results = [];

for (const target of targets) {
  const fullTarget = path.resolve(target);
  const files = walk(fullTarget);
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    const lineCount = lines.length;
    let maxLineLen = 0;
    let longLines = 0;
    for (const l of lines) {
      const len = l.trimEnd().length;
      if (len > maxLineLen) maxLineLen = len;
      if (len > 140) longLines++;
    }
    const rel = path.relative(process.cwd(), f).replace(/\\/g, '/');
    results.push({ path: rel, lineCount, maxLineLen, longLines });
  }
}

results.sort((a, b) => b.lineCount - a.lineCount);

console.log('=== TOP 35 LARGEST FILES (BY LINE COUNT) ===');
results.slice(0, 35).forEach((r, i) => {
  const idx = String(i + 1).padStart(2);
  const lines = String(r.lineCount).padStart(4);
  const maxL = String(r.maxLineLen).padStart(3);
  const longL = String(r.longLines).padStart(3);
  console.log(`${idx}. [${lines} lines | max ${maxL} chars | ${longL} lines >140] ${r.path}`);
});

console.log('\n=== SUMMARY BY APP (> 400 lines) ===');
const apps = ['apps/guest', 'apps/host', 'apps/admin', 'apps/cms', 'packages/shared'];
for (const app of apps) {
  const appFiles = results.filter(r => r.path.startsWith(app) && r.lineCount > 400);
  console.log(`\n--- ${app} (${appFiles.length} files > 400 lines) ---`);
  appFiles.forEach(r => {
    console.log(`  - [${r.lineCount} lines] ${r.path}`);
  });
}

