import fs from 'fs';

const menusPath = 'data/restaurant-menus.json';
const db = JSON.parse(fs.readFileSync(menusPath, 'utf8'));

const splendidItems = JSON.parse(fs.readFileSync('scratch/splendid_products.json', 'utf8'));

// Inject or overwrite splendid-chicken menu items
db.menus['splendid-chicken'] = splendidItems;

fs.writeFileSync(menusPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Successfully injected ${splendidItems.length} products for splendid-chicken into data/restaurant-menus.json!`);
