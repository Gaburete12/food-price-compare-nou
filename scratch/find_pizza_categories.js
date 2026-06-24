const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'restaurant-menus.json');
if (!fs.existsSync(dataPath)) {
  console.error("Data file does not exist at " + dataPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
console.log("Available menus:", Object.keys(data.menus));

const daboKeys = Object.keys(data.menus).filter(k => k.toLowerCase().includes('dabo'));
console.log("Dabo keys found:", daboKeys);

for (const key of daboKeys) {
  const items = data.menus[key];
  console.log(`\n--- Items for ${key} (${items.length} items) ---`);
  
  const pizzas = items.filter(item => 
    item.name.toLowerCase().includes('pizza') || 
    (item.category && item.category.toLowerCase().includes('pizza'))
  );
  
  console.log(`Found ${pizzas.length} pizza items:`);
  pizzas.forEach(p => {
    console.log(`Name: "${p.name}" | Original Category: "${p.category}" | Saved ImageUrl: "${p.imageUrl ? p.imageUrl.substring(0, 60) : ''}"`);
  });
}
