const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'restaurant-menus.json'), 'utf8');
const cleanJson = raw.trim().replace(/^\uFEFF/, "");
const data = JSON.parse(cleanJson);
console.log('Source:', data.source);
console.log('UpdatedAt:', data.updatedAt);
if (data.menus) {
  for (const [key, items] of Object.entries(data.menus)) {
    console.log(`${key}: ${items.length} items`);
  }
} else {
  console.log('No menus found!');
}
