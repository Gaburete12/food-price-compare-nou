import fs from 'fs';

const rscData = JSON.parse(fs.readFileSync('scratch/rsc_decoded.json', 'utf8'));

let storeContent = null;
function findStoreContent(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (obj.initialStoreContent && obj.initialStoreContent.data) {
    storeContent = obj.initialStoreContent.data;
    return;
  }
  for (const k of Object.keys(obj)) {
    findStoreContent(obj[k]);
  }
}
findStoreContent(rscData);

if (!storeContent) {
  console.error("Could not find initialStoreContent!");
  process.exit(1);
}

const products = [];
const seenNames = new Set();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // remove diacritics
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

storeContent.body.forEach(section => {
  if (section.type === 'LIST' && section.data && section.data.title && Array.isArray(section.data.elements)) {
    const categoryName = section.data.title;
    if (categoryName === 'Cele mai vândute') return; // Skip popular section to avoid duplicates
    
    console.log(`Processing category: "${categoryName}" with ${section.data.elements.length} elements`);
    
    section.data.elements.forEach(element => {
      if (element.type === 'PRODUCT_ROW' && element.data && element.data.name && element.data.price !== undefined) {
        const item = element.data;
        const nameLower = item.name.toLowerCase().trim();
        
        if (seenNames.has(nameLower)) return;
        seenNames.add(nameLower);

        const prices = [
          { platform: "glovo", available: true, price: item.price, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/wrap-n-go-cta" },
          { platform: "bolt", available: false, price: 0, deepLink: "" },
          { platform: "wolt", available: false, price: 0, deepLink: "" }
        ];

        products.push({
          id: `splendid-chicken-${slugify(categoryName)}-${slugify(item.name)}`,
          name: item.name,
          description: item.description || '',
          category: categoryName,
          imageUrl: item.imageUrl || '',
          prices: prices
        });
      }
    });
  }
});

console.log("Total unique products extracted for Splendid Chicken:", products.length);
if (products.length > 0) {
  fs.writeFileSync('scratch/splendid_products.json', JSON.stringify(products, null, 2));
  console.log("Saved to scratch/splendid_products.json");
  console.log("Sample:", products.slice(0, 3));
}
