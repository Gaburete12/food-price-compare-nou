import { execSync } from 'child_process';

const oldJson = execSync('git show f0d78ab:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');
const newJson = execSync('git show origin/main:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');

const oldDb = JSON.parse(oldJson);
const newDb = JSON.parse(newJson);

console.log('Old keys:', Object.keys(oldDb.menus || oldDb));
console.log('New keys:', Object.keys(newDb.menus || newDb));

const oldKFC = (oldDb.menus && oldDb.menus['kfc-constanta']) || oldDb['kfc-constanta'] || oldDb.menus['kfc'] || oldDb['kfc'];
const newKFC = (newDb.menus && newDb.menus['kfc-constanta']) || newDb['kfc-constanta'] || newDb.menus['kfc'] || newDb['kfc'];

console.log('Old KFC menu exists:', !!oldKFC, 'Length:', oldKFC ? oldKFC.length : 0);
console.log('New KFC menu exists:', !!newKFC, 'Length:', newKFC ? newKFC.length : 0);

if (oldKFC && newKFC) {
  console.log('First 5 old items:');
  console.log(oldKFC.slice(0, 5).map(item => ({ name: item.name, imageUrl: item.imageUrl, price: item.price })));
  console.log('First 5 new items:');
  console.log(newKFC.slice(0, 5).map(item => ({ name: item.name, imageUrl: item.imageUrl, price: item.price })));
}
