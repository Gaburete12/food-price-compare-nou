const fs = require('fs');
const path = require('path');

function isProductPlatformPrice(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value;
  return (
    typeof candidate.platform === "string" &&
    typeof candidate.available === "boolean" &&
    typeof candidate.price === "number" &&
    typeof candidate.deepLink === "string"
  );
}

function isMenuItem(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value;
  const matches = (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.imageUrl === "string" &&
    Array.isArray(candidate.prices) &&
    candidate.prices.every(isProductPlatformPrice)
  );
  if (!matches) {
    console.log('Validation failed for item:', candidate.name);
    console.log('- id is string:', typeof candidate.id === "string");
    console.log('- name is string:', typeof candidate.name === "string");
    console.log('- description is string:', typeof candidate.description === "string");
    console.log('- category is string:', typeof candidate.category === "string");
    console.log('- imageUrl is string:', typeof candidate.imageUrl === "string");
    console.log('- prices is array:', Array.isArray(candidate.prices));
    if (Array.isArray(candidate.prices)) {
      console.log('- prices match:', candidate.prices.map(isProductPlatformPrice));
    }
  }
  return matches;
}

const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'restaurant-menus.json'), 'utf8');
const cleanJson = raw.trim().replace(/^\uFEFF/, "");
const data = JSON.parse(cleanJson);

console.log('Source:', data.source);
console.log('UpdatedAt:', data.updatedAt);

if (data.menus) {
  for (const [key, items] of Object.entries(data.menus)) {
    const valid = items.filter(isMenuItem);
    console.log(`${key}: ${items.length} total, ${valid.length} valid`);
  }
} else {
  console.log('No menus found!');
}
