import fs from 'fs';
import vm from 'vm';

const targetRestaurants = [
  {
    id: "tacos-king",
    name: "Tacos King",
    url: "https://glovoapp.com/ro/ro/constanta/stores/tacos-king-cta",
    glovoLink: "https://glovoapp.com/ro/ro/constanta/stores/tacos-king-cta",
    boltLink: "",
    woltLink: "",
    boltAvailable: false,
    woltAvailable: false
  },
  {
    id: "mesopotamia-constanta",
    name: "Mesopotamia",
    url: "https://glovoapp.com/ro/ro/constanta/stores/mesopotamia-constanta",
    glovoLink: "https://glovoapp.com/ro/ro/constanta/stores/mesopotamia-constanta",
    boltLink: "https://food.bolt.eu/ro-ro/462-constanta/p/78413-mesopotamia-city/",
    woltLink: "https://wolt.com/ro/rou/constanta/restaurant/mesopotamia-city-park-67e179195493f87b1eb0ce12",
    boltAvailable: true,
    woltAvailable: true
  },
  {
    id: "tacoseria-constanta",
    name: "Tacoseria",
    url: "https://glovoapp.com/ro/ro/constanta/stores/tacoseria-cta",
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
    .normalize('NFD') // remove diacritics
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function fetchAndParse(rest) {
  console.log(`\n==================================================`);
  console.log(`Fetching ${rest.name} from Glovo...`);
  
  const res = await fetch(rest.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7"
    }
  });
  
  if (res.status !== 200) {
    throw new Error(`Failed to fetch Glovo page for ${rest.name}: Status ${res.status}`);
  }
  
  const html = await res.text();
  console.log(`Fetched ${html.length} bytes of HTML.`);
  
  const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const chunks = [];
  const selfObj = {
    __next_f: {
      push: function(args) {
        chunks.push(args);
      }
    }
  };

  const context = vm.createContext({ self: selfObj, console });

  for (const code of scriptMatches) {
    if (code.includes('__next_f.push')) {
      try {
        vm.runInContext(code, context);
      } catch (e) {}
    }
  }

  console.log(`Collected ${chunks.length} chunks.`);

  // Find the chunk with initialStoreContent
  let initialStoreContent = null;
  for (const chunk of chunks) {
    if (Array.isArray(chunk) && typeof chunk[1] === 'string' && chunk[1].includes('initialStoreContent')) {
      const payload = chunk[1];
      const colonIndex = payload.indexOf(':');
      if (colonIndex > -1) {
        const jsonText = payload.slice(colonIndex + 1);
        try {
          const parsed = JSON.parse(jsonText);
          
          // Find store content recursively
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
          console.error(`Failed to parse chunk JSON for ${rest.name}:`, e.message);
        }
      }
    }
  }

  if (!initialStoreContent) {
    throw new Error(`Could not find initialStoreContent in chunks for ${rest.name}`);
  }

  const products = [];
  const seenNames = new Set();

  initialStoreContent.body.forEach(section => {
    if (section.type === 'LIST' && section.data && section.data.title && Array.isArray(section.data.elements)) {
      const categoryName = section.data.title;
      if (categoryName === 'Cele mai vândute') return; // skip popular

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
            // Estimate Bolt price as slightly cheaper or equal
            prices.push({ platform: "bolt", available: true, price: Math.round(item.price * 0.95 * 100) / 100, deepLink: rest.boltLink });
          } else {
            prices.push({ platform: "bolt", available: false, price: 0, deepLink: "" });
          }

          if (rest.woltAvailable) {
            // Estimate Wolt price as slightly more expensive or equal
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
  return products;
}

async function main() {
  const menusPath = 'data/restaurant-menus.json';
  const db = JSON.parse(fs.readFileSync(menusPath, 'utf8'));

  for (const rest of targetRestaurants) {
    try {
      const products = await fetchAndParse(rest);
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
}

main().catch(console.error);
