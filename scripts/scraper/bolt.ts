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
      { id: "sabroso-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/55329-sabroso/" },
      { id: "cin-cin-constanta", url: "https://food.bolt.eu/ro/rou/constanta/cin-cin" },
      { id: "mesopotamia-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/78413-mesopotamia-city/" },
      { id: "tacoseria-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/68860-tacoseria/" },
      { id: "burgerking-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/237190-burger-king-constanta-tom" },
      { id: "splendid-chicken", url: "https://food.bolt.eu/ro-ro/462-constanta/p/splendid-chicken" },
      { id: "tacos-king", url: "https://food.bolt.eu/ro-ro/462-constanta/p/tacos-king" }
    ,
  {
    id: "shaormeria-baneasa-constanta",
    url: "https://food.bolt.eu/ro-ro/462-constanta/p/56615-shaormeria-baneasa-cismelei/",
    name: "Shaormeria Băneasa"
  },
  {
    id: "new-dimico",
    url: "https://food.bolt.eu/ro-ro/462-constanta/p/149785-new-dimico/",
    name: "New Dimico"
  },
  {
    id: "sarmola-street-food",
    url: "https://food.bolt.eu/ro-ro/462-constanta/p/194320-sarmola-street-food/",
    name: "Sarmola Street Food"
  }

];

    for (const rest of restaurantsToScrape) {
      console.log(`Deschidem pagina restaurantului Bolt: ${rest.id}`);
      // Folosim o pagină nouă izolată per restaurant pentru a evita cumularea coșului de cumpărături
      const restPage = await context.newPage();
      restPage.on('console', msg => console.log(`[Browser Bolt] ${msg.text()}`));

      try {
        await restPage.goto(rest.url, { waitUntil: 'domcontentloaded' });
        await restPage.waitForTimeout(3000);

        let deliveryFee = 3.00; // Valoare inițială fallback rezonabilă
        let deliveryTime = 25;

        // --- Extragere Taxă Livrare ---
        try {
          // Strategia 1: data-testid explicit pentru fee
          const feeTestId = restPage.locator('[data-testid*="delivery"][data-testid*="fee"], [data-testid*="DeliveryFee"]').first();
          if (await feeTestId.count() > 0) {
            const text = (await feeTestId.innerText()) || "";
            const match = text.match(/([\d,.]+)/);
            if (match) deliveryFee = parseFloat(match[1].replace(',', '.'));
            console.log(`[Bolt] Delivery fee via data-testid: ${text} => ${deliveryFee}`);
          } else {
            // Strategia 2: label-parent (caută textul "livrare" / "delivery" și extrage prețul din parent)
            const deliveryLabel = restPage.locator('[data-testid="screens.Provider.MenuHeader.deliveryInfoRow.infoBlock.view.delivery"]').first();
            if (await deliveryLabel.count() > 0) {
              const text = (await deliveryLabel.innerText()) || "";
              console.log(`[Bolt] Raw delivery info block: ${text}`);
              if (text.toLowerCase().includes('gratuit') || text.toLowerCase().includes('free')) {
                deliveryFee = 0;
              } else {
                const match = text.match(/([\d,.]+)/);
                if (match) deliveryFee = parseFloat(match[1].replace(',', '.'));
              }
            } else {
              // Strategia 3: text "lei" în apropierea cuvântului "livrare"
              const feeEl = await restPage.evaluate(() => {
                const allEls = Array.from(document.querySelectorAll('span, div, p'));
                const el = allEls.find(e => {
                  const t = e.textContent || '';
                  return (t.includes('livrare') || t.includes('delivery')) && (t.includes('lei') || t.includes('RON')) && t.length < 80;
                });
                return el ? el.textContent?.trim() : null;
              });
              if (feeEl) {
                console.log(`[Bolt] Raw delivery text (fallback): ${feeEl}`);
                if (feeEl.toLowerCase().includes('gratuit') || feeEl.toLowerCase().includes('free')) {
                  deliveryFee = 0;
                } else {
                  const match = feeEl.match(/([\d,.]+)/);
                  if (match) deliveryFee = parseFloat(match[1].replace(',', '.'));
                }
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

        const menuItemsMap = new Map<string, any>();

        // Focusăm body-ul pentru a permite mouse wheel nativ
        const boundingBox = await restPage.locator('body').boundingBox();
        if (boundingBox) {
            await restPage.mouse.move(boundingBox.width / 2, boundingBox.height / 2);
        }

        // --- Auto-scroll bidirectional pentru VirtualizedList ---
        // Bolt Food folosește un VirtualizedList care reciclează noduri DOM.
        // Strategia: scroll progresiv în jos (pas mare) + scroll înapoi în sus la final,
        // acumulând toate produsele vizibile la fiecare pas într-un Map pentru deduplicare.
        const MAX_SCROLL_STEPS = 80;  // mai multe scroll-uri pentru meniuri mari
        const SCROLL_STEP_PX = 800;   // pas mai mare pentru a avansa rapid
        const NO_CHANGE_LIMIT = 8;    // oprim după 8 iterații fără produs nou

        let prevSize = 0;
        let noChangeAttempts = 0;

        // PASUL A: Scroll în jos
        for (let scrollStep = 0; scrollStep < MAX_SCROLL_STEPS; scrollStep++) {
            const stepItems = await restPage.evaluate((url) => {
                const items: any[] = [];
          let productElements = Array.from(document.querySelectorAll('[data-testid="components.DishList.DishRow.view"]'));
          
          // Fallback dacă selectorii primari lipsesc
          if (productElements.length === 0) {
            productElements = Array.from(document.querySelectorAll('div, li, article')).filter(card => {
               const txt = card.textContent || "";
               return (txt.includes('lei') || txt.includes('Lei') || txt.includes('RON')) && txt.length > 5 && txt.length < 800;
            });
          }

          console.log(`Bolt: Found ${productElements.length} product elements`);

          productElements.forEach(card => {
            const nameEl = card.querySelector('[data-testid="components.DishList.DishRow.title"], h3, h4, [class*="name"], [class*="title"], [class*="Name"], [class*="Title"]');
            let name = nameEl ? nameEl.textContent?.trim() || "" : "";
            
            if (!name) {
                const allTexts = Array.from(card.querySelectorAll('div, span, p'))
                    .map(el => el.textContent?.trim() || "")
                    .filter(t => t.length > 2 && !t.includes('lei') && !t.includes('Lei') && !t.includes('RON') && !t.match(/^\d+$/));
                if (allTexts.length > 0) name = allTexts[0];
            }

            // Preț: selector primar cu data-testid, fallback pe text "lei"
            let priceEl: Element | null = card.querySelector('[data-testid="components.Price.originalPrice"], [data-testid="components.Price.discountedPrice"], [class*="price"], [class*="Price"]');
            if (!priceEl) {
              priceEl = Array.from(card.querySelectorAll('span, div, p')).find(el => {
                const txt = el.textContent || "";
                return (txt.includes('lei') || txt.includes('Lei') || txt.includes('RON')) && txt.length < 25;
              }) || null;
            }
            const priceText = priceEl ? priceEl.textContent?.trim() || "" : "";
            const priceMatch = priceText.match(/([\d,.]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;

            const descEl = card.querySelector('[data-testid="components.DishList.DishRow.description"], [class*="description"], p');
            const description = descEl ? descEl.textContent?.trim() || "" : "";

            const imgEl = card.querySelector('[data-testid="components.DishList.DishRow.image"] img, img');
            const imageUrl = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || "") : "";

            let category = "Meniu";
            let parent = card.parentElement;
            let depth = 0;
            while(parent && depth < 8) {
              const heading = parent.querySelector('h2, h3, [class*="category"], [class*="Category"]');
              if (heading && heading.textContent) { category = heading.textContent.trim(); break; }
              parent = parent.parentElement;
              depth++;
            }

            if (name && price > 0 && name.length < 100) {
              const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              items.push({ id, name, description, category, imageUrl, prices: [{ platform: "bolt", available: true, price, deepLink: url }] });
            }
          });
          return items;
        }, rest.url);

        for (const item of stepItems) {
            if (!menuItemsMap.has(item.id)) menuItemsMap.set(item.id, item);
        }

        await restPage.mouse.wheel(0, SCROLL_STEP_PX);
        await restPage.waitForTimeout(350);

        if (menuItemsMap.size === prevSize) {
            noChangeAttempts++;
            if (noChangeAttempts >= NO_CHANGE_LIMIT) {
                console.log(`Bolt: Scroll jos oprit după ${scrollStep} pași (${menuItemsMap.size} produse acumulate).`);
                break;
            }
        } else {
            noChangeAttempts = 0;
            prevSize = menuItemsMap.size;
        }
      }

      // PASUL B: Scroll înapoi la top și re-colectare (pentru itemele VirtualizedList reciclate)
      console.log(`Bolt: Scroll înapoi la top pentru a recupera itemele reciclate...`);
      await restPage.evaluate(() => window.scrollTo(0, 0));
      await restPage.waitForTimeout(600);
      
      // Re-colectăm itemele de la top (acum afișate din nou)
      for (let upStep = 0; upStep < 5; upStep++) {
        const topItems = await restPage.evaluate((url) => {
          const items: any[] = [];
          const productElements = Array.from(document.querySelectorAll('[data-testid="components.DishList.DishRow.view"]'));
          productElements.forEach(card => {
            const nameEl = card.querySelector('[data-testid="components.DishList.DishRow.title"], h3, h4');
            let name = nameEl ? nameEl.textContent?.trim() || "" : "";
            let priceEl: Element | null = card.querySelector('[data-testid="components.Price.originalPrice"], [data-testid="components.Price.discountedPrice"]');
            if (!priceEl) {
              priceEl = Array.from(card.querySelectorAll('span, div, p')).find(el => {
                const t = el.textContent || "";
                return (t.includes('lei') || t.includes('RON')) && t.length < 25;
              }) || null;
            }
            const priceText = priceEl?.textContent?.trim() || "";
            const priceMatch = priceText.match(/([\d,.]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
            if (name && price > 0 && name.length < 100) {
              const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              items.push({ id, name, description: '', category: 'Meniu', imageUrl: '', prices: [{ platform: 'bolt', available: true, price, deepLink: url }] });
            }
          });
          return items;
        }, rest.url);
        for (const item of topItems) {
          if (!menuItemsMap.has(item.id)) menuItemsMap.set(item.id, item);
        }
        await restPage.mouse.wheel(0, 500);
        await restPage.waitForTimeout(300);
      }

      const menuItems = Array.from(menuItemsMap.values());
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
