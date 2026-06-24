import fs from 'fs';

const menusPath = 'data/restaurant-menus.json';
const db = JSON.parse(fs.readFileSync(menusPath, 'utf8'));

const cincinItems = JSON.parse(fs.readFileSync('scratch/extracted_products.json', 'utf8'));

// Inject or overwrite cin-cin-constanta menu items
db.menus['cin-cin-constanta'] = cincinItems;

fs.writeFileSync(menusPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Successfully injected ${cincinItems.length} products for cin-cin-constanta into data/restaurant-menus.json!`);
