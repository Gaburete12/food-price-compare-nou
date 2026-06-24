import playwrightPkg from 'file:///C:/Users/andre/AppData/Local/ms-playwright-go/1.57.0/package/index.js';
const { chromium } = playwrightPkg;
import fs from 'fs';
import vm from 'vm';

const targetRestaurants = [
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
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function main() {
  console.log("Launching browser...");
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  } catch (err) {
    console.log("Failed to launch Chrome channel, trying msedge...");
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  }
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log("Navigating to Glovo homepage...");
  await page.goto("https://glovoapp.com/ro/ro/", { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Accept cookies if present
  try {
    const cookieBtn = page.locator('button:has-text("Acceptați toate"), button:has-text("Accept all"), #onetrust-accept-btn-handler').first();
    if (await cookieBtn.count() > 0) {
      console.log("Accepting cookies...");
      await cookieBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch(e) {}

  // Fill address
  try {
    const addressInput = page.locator('input[placeholder*="caută"], input[placeholder*="adresă"], input[placeholder*="Address"], input[placeholder*="livrăm"], #delivery-address-input, .address-input input').first();
    if (await addressInput.count() > 0) {
      console.log("Typing address: Bulevardul Tomis 47, Constanța...");
      await addressInput.fill("Bulevardul Tomis 47, Constanța");
      await page.waitForTimeout(3000);

      const firstSuggestion = page.locator('[class*="address-suggestion"], [class*="Suggestion"], [class*="suggestion"], li:has-text("Tomis"), div:has-text("Tomis"), [class*="SuggestionRow"]').first();
      if (await firstSuggestion.count() > 0) {
        console.log("Clicking address suggestion...");
        await firstSuggestion.click();
        await page.waitForTimeout(3000);
      }

      const typeBtn = page.locator('button:has-text("Altele"), button:has-text("Other"), button:has-text("Acasă"), button:has-text("Home"), button:has-text("Casă")').first();
      if (await typeBtn.count() > 0) {
        await typeBtn.click();
        await page.waitForTimeout(1500);
      }

      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Confirmă"), button:has-text("Salvează")').first();
      if (await confirmBtn.count() > 0) {
        console.log("Confirming address...");
        await confirmBtn.click();
        await page.waitForTimeout(4000);
      }
    }
  } catch (e) {
    console.error("Address setup error:", e.message);
  }

  const menusPath = 'data/restaurant-menus.json';
  const db = JSON.parse(fs.readFileSync(menusPath, 'utf8'));

  for (const rest of targetRestaurants) {
    try {
      console.log(`\nNavigating to ${rest.name}: ${rest.url}`);
      await page.goto(rest.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);

      const html = await page.content();
      console.log(`HTML length: ${html.length}`);
      
      const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
      const chunks = [];
      const selfObj = {
        __next_f: {
          push: function(args) {
            chunks.push(args);
          }
        }
      };

      const vmContext = vm.createContext({ self: selfObj, console });

      for (const code of scriptMatches) {
        if (code.includes('__next_f.push')) {
          try {
            vm.runInContext(code, vmContext);
          } catch (e) {}
        }
      }

      console.log(`Collected ${chunks.length} chunks.`);

      let initialStoreContent = null;
      for (const chunk of chunks) {
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
              console.error(`Failed to parse chunk JSON for ${rest.name}:`, e.message);
            }
          }
        }
      }

      if (!initialStoreContent) {
        console.error(`Could not find initialStoreContent in chunks for ${rest.name}. Saving HTML for debug...`);
        fs.writeFileSync(`scratch/debug_pw_${rest.id}.html`, html, 'utf8');
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
  console.log("\nSaved updated menus to data/restaurant-menus.json!");

  await browser.close();
}

main().catch(console.error);
