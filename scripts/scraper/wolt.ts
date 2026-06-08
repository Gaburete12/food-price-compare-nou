import { BrowserContext } from "playwright";

export async function scrapeWolt(context: BrowserContext, address: string) {
  const page = await context.newPage();
  const fees: Record<string, any> = {};
  const menus: Record<string, any[]> = {};

  try {
    await page.goto("https://wolt.com/ro/rou/constanta/", { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const restaurantsToScrape = [
{ id: "pizzahut-constanta", url: "https://wolt.com/en/rou/constanta/restaurant/pizza-hut-constanta-67dc2390b93a5300e8efd498" },
      { id: "kfc-buc-1", url: "https://wolt.com/en/rou/constanta/restaurant/kfc-city-park-67ee912b0231e21086424409" },
      { id: "mcdonalds-constanta", url: "https://wolt.com/en/rou/constanta/restaurant/mcdonalds-tomis-67ed2703c86a467a0cecf401" },
      { id: "dabo-doner-constanta", url: "https://wolt.com/en/rou/constanta/restaurant/dabo-doner-mircea-constana-00a224" },
      { id: "sabroso-constanta", url: "https://wolt.com/ro/rou/constanta/restaurant/sabroso-67dac2825416f96b8fd40493" },
      { id: "cin-cin-constanta", url: "https://wolt.com/ro/rou/constanta/restaurant/cin-cin" },
      { id: "mesopotamia-constanta", url: "https://wolt.com/ro/rou/constanta/restaurant/mesopotamia-city-park-67e179195493f87b1eb0ce12" },
      { id: "tacoseria-constanta", url: "https://wolt.com/ro/rou/constanta/restaurant/tacoseria-67e18559a54a3ee61d3b13ec" }
    ];

    for (const rest of restaurantsToScrape) {
      await page.goto(rest.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      try {
        // 1. Apăsăm pe primul produs
        const firstProduct = page.locator('div[data-test-id="MenuItem"]').first();
        if (await firstProduct.count() > 0) {
          await firstProduct.click();
          await page.waitForTimeout(1000);

          // 2. Apăsăm adaugă în coș
          const addToCartBtn = page.locator('button[data-test-id="ProductModalAddButton"]').first();
          if (await addToCartBtn.count() > 0) {
            await addToCartBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        // 3. Extragem datele reale din componentele Wolt
        let extracted = {
          deliveryFee: 10.19,
          serviceFeePercent: 0.07, // Extras din textul lor "7%"
          serviceFeeMin: 2.49,     // Extras din "minimum 2,49"
          serviceFeeMax: 7.99,     // Extras din "maximum 7,99"
          serviceFee: 0, 
          smallOrderFee: 0,
          smallOrderThreshold: 35, // Extras din "mai mic decât 35,00 RON"
        };

        const feeRows = await page.locator('[data-test-id="AmountRow"]').all();

        for (const row of feeRows) {
          const text = await row.textContent() || "";
          const match = text.match(/([\d,]+)\s*RON/i);
          const val = match ? parseFloat(match[1].replace(',', '.')) : 0;

          if (text.toLowerCase().includes('livrare')) {
            extracted.deliveryFee = val;
          } else if (text.toLowerCase().includes('operațional') || text.toLowerCase().includes('serviciu')) {
            extracted.serviceFee = val;
          } else if (text.toLowerCase().includes('comandă mică')) {
            extracted.smallOrderFee = val;
          }
        }

        fees[rest.id] = {
          wolt: {
            ...extracted,
            dynamicSmallOrderFee: true, // Diferența dintre comandă și prag, exact ca la Glovo
            deliveryTime: 20
          }
        };

        // --- Extragere Meniu ---
        console.log(`Începem extragerea meniului pentru ${rest.id} de pe Wolt...`);

        // Scroll pentru a încărca produsele lazy-loaded
        await page.evaluate(async () => {
          for(let i = 0; i < 10; i++) {
             window.scrollBy(0, 800);
             await new Promise(r => setTimeout(r, 600));
          }
        });

        const menuItems = await page.evaluate((url) => {
          const items: any[] = [];
          // Wolt folosește data-test-id pentru produse
          const productElements = Array.from(document.querySelectorAll('[data-test-id="MenuItem"], [class*="MenuItem"], [class*="ProductItem"], .product-card, .item-card'));

          console.log(`Wolt: Found ${productElements.length} product elements`);

          productElements.forEach(card => {
            // Numele produsului
            const nameEl = card.querySelector('[data-test-id="MenuItemName"], h3, h4, [class*="name"], [class*="title"]');
            let name = nameEl ? nameEl.textContent?.trim() || "" : "";

            // Prețul produsului
            const priceEl = card.querySelector('[data-test-id="MenuItemPrice"], [class*="price"], .price');
            const priceText = priceEl ? priceEl.textContent?.trim() || "" : "";
            const priceMatch = priceText.match(/([\d,]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;

            // Descrierea
            const descEl = card.querySelector('[data-test-id="MenuItemDescription"], [class*="description"], p');
            const description = descEl ? descEl.textContent?.trim() || "" : "";

            // Imaginea
            const imgEl = card.querySelector('img');
            const imageUrl = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || "") : "";

            // Categoria
            let category = "Meniu";
            let parent = card.parentElement;
            let depth = 0;
            while(parent && depth < 8) {
              const heading = parent.querySelector('h2, h3, [class*="category"], [class*="Category"]');
              if (heading && heading.textContent) {
                category = heading.textContent.trim();
                break;
              }
              parent = parent.parentElement;
              depth++;
            }

            if (name && price > 0 && name.length < 100) {
              const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              items.push({
                id,
                name,
                description,
                category,
                imageUrl,
                prices: [{
                  platform: "wolt",
                  available: true,
                  price: price,
                  deepLink: url
                }]
              });
            }
          });

          // Eliminăm duplicatele după id
          const uniqueItems: any[] = [];
          const seenIds = new Set();
          for (const item of items) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              uniqueItems.push(item);
            }
          }

          return uniqueItems;
        }, rest.url);

        console.log(`Au fost extrase ${menuItems.length} produse pentru ${rest.id} de pe Wolt.`);
        menus[rest.id] = menuItems;

      } catch (e) {
        console.error(`Eroare scraping Wolt pentru ${rest.id}:`, e);
      }
    }

  } finally {
    await page.close();
  }

  return { fees, menus };
}
