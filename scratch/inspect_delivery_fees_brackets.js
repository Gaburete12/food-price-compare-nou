import fs from 'fs';

const content = fs.readFileSync('data/delivery-fees.json', 'utf8');

let openBraces = 0;
let inString = false;
let escaped = false;
let lineNum = 1;

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (c === '\n') {
    lineNum++;
  }
  if (escaped) {
    escaped = false;
    continue;
  }
  if (c === '\\') {
    escaped = true;
    continue;
  }
  if (c === '"') {
    inString = !inString;
    continue;
  }
  if (!inString) {
    if (c === '{') openBraces++;
    else if (c === '}') {
      openBraces--;
      if (openBraces <= 0) {
        console.log(`openBraces = ${openBraces} at index ${i}, line ${lineNum}. Context: ${JSON.stringify(content.slice(Math.max(0, i - 30), i + 30))}`);
      }
    }
  }
}
