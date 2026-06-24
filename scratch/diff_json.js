import { execSync } from 'child_process';

const sParent = execSync('git show 589fbee^:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');
const sChild = execSync('git show 589fbee:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');

function robustParse(str) {
  let current = str;
  while (current.length > 0) {
    try {
      return JSON.parse(current);
    } catch (e) {
      if (e.message.includes('Unexpected non-whitespace character') || e.message.includes('Unexpected token')) {
        const trimmed = current.trimEnd();
        if (trimmed.length === current.length) {
          current = current.slice(0, -1);
        } else {
          current = trimmed;
        }
      } else {
        throw e;
      }
    }
  }
}

const pDb = robustParse(sParent);
const cDb = robustParse(sChild);

// Let's check metadata differences
console.log('Parent updatedAt:', pDb.updatedAt);
console.log('Child updatedAt:', cDb.updatedAt);
console.log('Parent source:', pDb.source);
console.log('Child source:', cDb.source);

// Let's compare contents recursively
function compare(obj1, obj2, path = '') {
  if (typeof obj1 !== typeof obj2) {
    console.log(`Type mismatch at ${path}: ${typeof obj1} vs ${typeof obj2}`);
    return;
  }
  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) {
      console.log(`Array length mismatch at ${path}: ${obj1.length} vs ${obj2.length}`);
      return;
    }
    for (let i = 0; i < obj1.length; i++) {
      compare(obj1[i], obj2[i], `${path}[${i}]`);
    }
    return;
  }
  if (obj1 && typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1).sort();
    const keys2 = Object.keys(obj2).sort();
    if (JSON.stringify(keys1) !== JSON.stringify(keys2)) {
      console.log(`Keys mismatch at ${path}:`, keys1, 'vs', keys2);
      return;
    }
    for (const k of keys1) {
      compare(obj1[k], obj2[k], `${path}.${k}`);
    }
    return;
  }
  if (obj1 !== obj2) {
    console.log(`Value mismatch at ${path}: ${JSON.stringify(obj1)} vs ${JSON.stringify(obj2)}`);
  }
}

compare(pDb, cDb);
