import fs from 'fs';

const code = fs.readFileSync('scripts/scraper/glovo.ts', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('menus') || line.includes('menu')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
}
