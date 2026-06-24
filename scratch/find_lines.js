import fs from 'fs';

const content = fs.readFileSync('client/src/lib/data.ts', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('cin-cin-constanta')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
