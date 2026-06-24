import { execSync } from 'child_process';

const sParent = execSync('git show f0d78ab:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');
let sChild = execSync('git show origin/main:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8').trim();
if (sChild.endsWith('}')) {
  sChild = sChild.slice(0, -1).trim();
}

const parentDb = JSON.parse(sParent);
const childDb = JSON.parse(sChild);

const pKFC = parentDb.menus['kfc-ct-1'];
const cKFC = childDb.menus['kfc-ct-1'];

console.log('pKFC length:', pKFC ? pKFC.length : 'undefined');
console.log('cKFC length:', cKFC ? cKFC.length : 'undefined');

if (pKFC && cKFC) {
  // Let's compare items by id or name
  let diffCount = 0;
  for (let i = 0; i < Math.min(pKFC.length, cKFC.length); i++) {
    const pItem = pKFC[i];
    const cItem = cKFC[i];
    if (pItem.imageUrl !== cItem.imageUrl) {
      console.log(`Difference in item ${i}: Name: ${pItem.name}`);
      console.log(`  Parent Image: ${pItem.imageUrl}`);
      console.log(`  Child Image: ${cItem.imageUrl}`);
      diffCount++;
      if (diffCount > 10) {
        console.log('Too many differences, stopping comparison print...');
        break;
      }
    }
  }
}
