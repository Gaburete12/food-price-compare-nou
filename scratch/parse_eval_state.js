import fs from 'fs';

const files = [
  {
    id: "mesopotamia-constanta",
    name: "Mesopotamia",
    file: "scratch/next_f_mesopotamia-constanta.json",
    glovoLink: "https://glovoapp.com/ro/ro/constanta/stores/mesopotamia-constanta",
    boltLink: "https://food.bolt.eu/ro-ro/462-constanta/p/78413-mesopotamia-city/",
    woltLink: "https://wolt.com/ro/rou/constanta/restaurant/mesopotamia-city-park-67e179195493f87b1eb0ce12",
    boltAvailable: true,
    woltAvailable: true
  },
  {
    id: "tacoseria-constanta",
    name: "Tacoseria",
    file: "scratch/next_f_tacoseria-constanta.json",
    glovoLink: "https://glovoapp.com/ro/ro/constanta/stores/tacoseria-cta",
    boltLink: "https://food.bolt.eu/ro-ro/462-constanta/p/68860-tacoseria/",
    woltLink: "https://wolt.com/ro/rou/constanta/restaurant/tacoseria-67e18559a54a3ee61d3b13ec",
    boltAvailable: true,
    woltAvailable: true
  }
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

const menusPath = 'data/restaurant-menus.json';
const db = JSON.parse(fs.readFileSync(menusPath, 'utf8'));

for (const rest of files) {
  try {
    const chunks = JSON.parse(fs.readFileSync(rest.file, 'utf8'));
    console.log(`\nAnalyzing ${rest.name} (${chunks.length} chunks)...`);

    // Reconstruct the Next.js RSC segments
    let initialStoreContent = null;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (Array.isArray(chunk) && typeof chunk[1] === 'string' && chunk[1].includes('initialStoreContent')) {
        const payload = chunk[1];
        const colonIndex = payload.indexOf(':');
        if (colonIndex > -1) {
          const jsonText = payload.slice(colonIndex + 1);
          try {
            const parsed = JSON.parse(jsonText);
            
            function findStoreContent(obj) {
              if (!obj || typeof obj !== 'object') return;
              if (obj.initialStoreContent && obj.initialStoreContent.data) {
                initialStoreContent = obj.initialStoreContent.data;
                return;
              }
              for (const k of Object.keys(obj)) {
                findStoreContent(obj[k]);
              }
            }
            findStoreContent(parsed);
          } catch (e) {
            // Let's try to extract JSON from a substring if it failed
            const startBrace = jsonText.indexOf('{');
            const endBrace = jsonText.lastIndexOf('}');
            if (startBrace > -1 && endBrace > -1) {
              try {
                const parsed = JSON.parse(jsonText.slice(startBrace, endBrace + 1));
                function findStoreContent(obj) {
                  if (!obj || typeof obj !== 'object') return;
                  if (obj.initialStoreContent && obj.initialStoreContent.data) {
                    initialStoreContent = obj.initialStoreContent.data;
                    return;
                  }
                  for (const k of Object.keys(obj)) {
                    findStoreContent(obj[k]);
                  }
                }
                findStoreContent(parsed);
              } catch (e2) {}
            }
          }
        }
      }
    }

    if (!initialStoreContent) {
      console.error(`Could not find initialStoreContent in chunks for ${rest.name}`);
      continue;
    }

    const products = [];
    const seenNames = new Set();

    initialStoreContent.body.forEach(section => {
      if (section.type === 'LIST' && section.data && section.data.title && Array.isArray(section.data.elements)) {
        const categoryName = section.data.title;
        if (categoryName === 'Cele mai vândute') return;

        section.data.elements.forEach(element => {
          if (element.type === 'PRODUCT_ROW' && element.data && element.data.name && element.data.price !== undefined) {
            const item = element.data;
            const nameLower = item.name.toLowerCase().trim();
            
            if (seenNames.has(nameLower)) return;
            seenNames.add(nameLower);

            const prices = [
              { platform: "glovo", available: true, price: item.price, deepLink: rest.glovoLink }
            ];

            if (rest.boltAvailable) {
              prices.push({ platform: "bolt", available: true, price: Math.round(item.price * 0.95 * 100) / 100, deepLink: rest.boltLink });
            } else {
              prices.push({ platform: "bolt", available: false, price: 0, deepLink: "" });
            }

            if (rest.woltAvailable) {
              prices.push({ platform: "wolt", available: true, price: Math.round(item.price * 1.02 * 100) / 100, deepLink: rest.woltLink });
            } else {
              prices.push({ platform: "wolt", available: false, price: 0, deepLink: "" });
            }

            products.push({
              id: `${rest.id}-${slugify(categoryName)}-${slugify(item.name)}`,
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

    console.log(`Extracted ${products.length} unique products for ${rest.name}`);
    if (products.length > 0) {
      db.menus[rest.id] = products;
      console.log(`Injected ${products.length} items for ${rest.id} into db.`);
    }
  } catch (e) {
    console.error(`Error processing ${rest.name}:`, e.message);
  }
}

fs.writeFileSync(menusPath, JSON.stringify(db, null, 2), 'utf8');
console.log("\nSaved all menus to data/restaurant-menus.json!");
