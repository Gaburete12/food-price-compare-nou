import { BrowserContext } from "playwright";

export async function scrapeBolt(context: BrowserContext, address: string) {
  const page = await context.newPage();
  const fees: Record<string, any> = {};
  const menus: Record<string, any[]> = {};

  try {
    console.log("Navigăm pe pagina principală Bolt Food Constanța...");
    await page.goto("https://food.bolt.eu/ro-ro/462-constanta/", { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 1. Geolocalizare adresă: 'Bulevardul Tomis 47, Constanța'
    console.log(`Sincronizăm locația pe Bolt Food pentru: ${address}`);
    try {
      // Acceptăm cookies dacă bannerul este vizibil
      const cookieBtn = page.locator('button.cb-btn, button:has-text("Allow"), button:has-text("Acceptă")').first();
      if (await cookieBtn.count() > 0) {
        await cookieBtn.click();
        await page.waitForTimeout(1000);
      }

      // Apăsăm butonul de adresă din header
      const addressBtn = page.locator('button[aria-label*="Adresa de livrare"], button[aria-label*="Delivery address"], button[class*="header"]').first();
      if (await addressBtn.count() > 0) {
        await addressBtn.click();
        await page.waitForTimeout(1500);

        // Introducem adresa în câmpul de căutare
        const addressInput = page.locator('input[placeholder*="Introdu"], input[placeholder*="Enter"], input[placeholder*="adresă"]').first();
        if (await addressInput.count() > 0) {
          await addressInput.fill("Bulevardul Tomis 47, Constan");
          await page.waitForTimeout(2500); // așteptăm sugestiile din API-ul Bolt

          // Apăsăm pe prima sugestie exactă care conține Bulevardul Tomis
          const suggestion = page.locator('button').filter({ hasText: "Tomis 47" }).first();
          if (await suggestion.count() > 0) {
            await suggestion.click();
            console.log("Locația Bolt Food a fost configurată prin sugestie directă!");
          } else {
            const fallbackSuggestion = page.locator('button[role="button"]').filter({ hasText: "Constan" }).first();
            if (await fallbackSuggestion.count() > 0) {
              await fallbackSuggestion.click();
              console.log("Locația Bolt Food a fost configurată prin fallback sugestie!");
            }
          }
          await page.waitForTimeout(3000); // lăsăm platforma să reîncarce restaurantele cu noua livrare
        }
      }
    } catch (addrErr) {
      console.warn("Eroare la setarea adresei pe Bolt Food, continuăm cu valorile implicite:", addrErr);
    }

    const restaurantsToScrape = [
      { id: "pizzahut-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/86990-pizza-hut-constanta/" },
      { id: "kfc-buc-1", url: "https://food.bolt.eu/ro-ro/462-constanta/p/135512-kfc-city-park-constanta/" },
      { id: "mcdonalds-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/97105-mcdonalds-tomis/" },
      { id: "dabo-doner-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/200293-dabo-doner-mircea-constanta/" },
      { id: "sabroso-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/55329-sabroso/" }
    ];

    for (const rest of restaurantsToScrape) {
      console.log(`Deschidem pagina restaurantului Bolt: ${rest.id}`);
      // Folosim o pagină nouă izolată per restaurant pentru a evita cumularea coșului de cumpărături
      const restPage = await context.newPage();

      try {
        await restPage.goto(rest.url, { waitUntil: 'domcontentloaded' });
        await restPage.waitForTimeout(3000);

        let deliveryFee = 3.00; // Valoare inițială fallback rezonabilă
        let deliveryTime = 25;

        // --- Extragere Taxă Livrare folosind strategia relațională cu Text-Content ---
        try {
          const deliveryLabel = restPage.locator('div').filter({ hasText: /^(livrare|delivery)$/i }).first();
          if (await deliveryLabel.count() > 0) {
            const parent = deliveryLabel.locator('xpath=..');
            const feeEl = parent.locator('div').first();
            const text = await feeEl.innerText() || "";
            console.log(`[Bolt] Raw delivery text for ${rest.id}:`, text);
            
            if (text.toLowerCase().includes('gratuit') || text.toLowerCase().includes('free')) {
              deliveryFee = 0;
            } else {
              const match = text.match(/([\d,.]+)/);
              if (match) {
                deliveryFee = parseFloat(match[1].replace(',', '.'));
              }
            }
          }
        } catch (feeErr) {
          console.warn(`[Bolt] Eroare la extragerea taxei de livrare pentru ${rest.id}:`, feeErr);
        }

        // --- Extragere Timp de Livrare ---
        try {
          const timeLabel = restPage.locator('div').filter({ hasText: /^(min|mins)$/i }).first();
          if (await timeLabel.count() > 0) {
            const parent = timeLabel.locator('xpath=..');
            const timeEl = parent.locator('div').first();
            const text = await timeEl.innerText() || "";
            console.log(`[Bolt] Raw delivery time text for ${rest.id}:`, text);
            
            // Dacă e un interval (ex: "15-20" sau "15–20"), luăm valoarea maximă
            const match = text.match(/(\d+)\s*[–-]\s*(\d+)/);
            if (match) {
              deliveryTime = parseInt(match[2]);
            } else {
              const singleMatch = text.match(/(\d+)/);
              if (singleMatch) {
                deliveryTime = parseInt(singleMatch[1]);
              }
            }
          }
        } catch (timeErr) {
          console.warn(`[Bolt] Eroare la extragerea timpului de livrare pentru ${rest.id}:`, timeErr);
        }

        // Deoarece Bolt Food are o taxă fixă de serviciu de 3.00 lei în Constanța și pragul de comandă mică de 40.00 lei,
        // definim aceste reguli direct. Frontend-ul va calcula automat taxa dinamică de comandă mică
        // (Math.max(0, 40.00 - pretProdus)) în mod impecabil!
        fees[rest.id] = {
          deliveryFee,
          serviceFeePercent: null,
          serviceFee: 3.00,
          smallOrderFee: 0,
          smallOrderThreshold: 40.00,
          dynamicSmallOrderFee: true,
          deliveryTime,
          available: true
        };
        console.log(`Bolt Fees extrase pentru ${rest.id}:`, fees[rest.id]);

        // --- Extragere Meniu ---
        console.log(`Începem extragerea meniului pentru ${rest.id} de pe Bolt...`);

        // Scroll pentru a încărca produsele lazy-loaded
        await restPage.evaluate(async () => {
          for(let i = 0; i < 10; i++) {
             window.scrollBy(0, 800);
             await new Promise(r => setTimeout(r, 600));
          }
        });

        const menuItems = await restPage.evaluate((url) => {
          const items: any[] = [];
          // Bolt Food folosește structuri de produse în carduri
          const productElements = Array.from(document.querySelectorAll('[class*="MenuItem"], [class*="ProductItem"], [class*="menu-item"], .product-card, .item-card'));

          console.log(`Bolt: Found ${productElements.length} product elements`);

          productElements.forEach(card => {
            // Numele produsului
            const nameEl = card.querySelector('h3, h4, [class*="name"], [class*="title"], [class*="Name"], [class*="Title"]');
            let name = nameEl ? nameEl.textContent?.trim() || "" : "";

            // Prețul produsului
            const priceEl = card.querySelector('[class*="price"], [class*="Price"], .price, span:has-text("RON")');
            const priceText = priceEl ? priceEl.textContent?.trim() || "" : "";
            const priceMatch = priceText.match(/([\d,]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;

            // Descrierea
            const descEl = card.querySelector('[class*="description"], [class*="Description"], p');
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
                  platform: "bolt",
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

        console.log(`Au fost extrase ${menuItems.length} produse pentru ${rest.id} de pe Bolt.`);
        menus[rest.id] = menuItems;

      } catch (e) {
        console.error(`Eroare scraping Bolt pentru ${rest.id}:`, e);
      } finally {
        await restPage.close(); // Închidem pagina restaurantului
      }
    }

  } finally {
    await page.close(); // Închidem pagina principală de geolocalizare
  }

  return { fees, menus };
}
