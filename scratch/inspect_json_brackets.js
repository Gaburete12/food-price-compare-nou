import { execSync } from 'child_process';
const newJson = execSync('git show origin/main:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');

let openBraces = 0;
let openBrackets = 0;
let inString = false;
let escaped = false;
let lineNum = 1;

for (let i = 0; i < newJson.length; i++) {
  const c = newJson[i];
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
        console.log(`openBraces = ${openBraces} at index ${i}, line ${lineNum}. Context: ${JSON.stringify(newJson.slice(Math.max(0, i - 50), i + 50))}`);
      }
    }
    else if (c === '[') openBrackets++;
    else if (c === ']') openBrackets--;
  }
}
