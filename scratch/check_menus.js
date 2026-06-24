const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'restaurant-menus.json'), 'utf8'));
console.log('Source:', data.source);
console.log('UpdatedAt:', data.updatedAt);
if (data.menus) {
  for (const [key, items] of Object.entries(data.menus)) {
    console.log(`${key}: ${items.length} items`);
  }
} else {
  console.log('No menus found!');
}
