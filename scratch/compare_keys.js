import { execSync } from 'child_process';

const sParent = execSync('git show 589fbee^:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');

let sChild = execSync('git show 589fbee:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');

// Robust JSON parse by trimming trailing extra characters
function robustParse(str) {
  let current = str;
  while (current.length > 0) {
    try {
      return JSON.parse(current);
    } catch (e) {
      if (e.message.includes('Unexpected non-whitespace character') || e.message.includes('Unexpected token')) {
        // Find last non-whitespace character and slice it off
        const trimmed = current.trimEnd();
        if (trimmed.length === current.length) {
          // If already trimmed, slice the last character
          current = current.slice(0, -1);
        } else {
          current = trimmed;
        }
      } else {
        throw e;
      }
    }
  }
  throw new Error("Could not parse JSON even after trimming everything");
}

const pDb = robustParse(sParent);
const cDb = robustParse(sChild);

console.log('Parent keys:', Object.keys(pDb.menus));
console.log('Child keys:', Object.keys(cDb.menus));

for (const k of Object.keys(pDb.menus)) {
  const pLen = pDb.menus[k] ? pDb.menus[k].length : 0;
  const cLen = cDb.menus[k] ? cDb.menus[k].length : 0;
  console.log(`Key ${k}: parent length = ${pLen}, child length = ${cLen}`);
}
