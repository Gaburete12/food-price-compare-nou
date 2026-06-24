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

        const menuItemsMap = new Map<string, any>();

        // Focusăm body-ul pentru a permite mouse wheel nativ
        const boundingBox = await restPage.locator('body').boundingBox();
        if (boundingBox) {
            await restPage.mouse.move(boundingBox.width / 2, boundingBox.height / 2);
        }

        let prevSize = 0;
        let noChangeAttempts = 0;

        for (let scrollStep = 0; scrollStep < 40; scrollStep++) {
            const stepItems = await restPage.evaluate((url) => {
                const items: any[] = [];
          // Bolt Food folosește structuri de produse în carduri
          // Deoarece folosesc React Native Web, clasele sunt obfuscate (ex. css-1dbjc4n)
          let productElements = Array.from(document.querySelectorAll('[data-testid="components.DishList.DishRow.view"]'));
          if(productElements.length === 0) productElements = Array.from(document.querySelectorAll('div[role="button"], a, li'));
          
          // Păstrăm doar containerele care au un preț în interior (text rezonabil de scurt)
          productElements = productElements.filter(card => {
             const txt = card.textContent || "";
             return (txt.includes('lei') || txt.includes('Lei') || txt.includes('RON')) && txt.length > 5 && txt.length < 1500;
          });

          // Dacă tot e 0, fallback: urcăm de la orice tag <img> până dăm de un preț
          if (productElements.length === 0) {
              console.log("Bolt: Folosim euristica pe bază de imagini pentru carduri...");
              const allImages = Array.from(document.querySelectorAll('img'));
              allImages.forEach(img => {
                  // Excludem din start imaginile de cover, logo, banner
                  const imgClasses = (img.getAttribute('class') || "").toLowerCase();
                  const imgSrc = (img.getAttribute('src') || "").toLowerCase();
                  if (imgClasses.includes("header") || imgClasses.includes("cover") || 
                      imgClasses.includes("banner") || imgClasses.includes("logo") || 
                      imgClasses.includes("avatar") || imgClasses.includes("hero") ||
                      imgSrc.includes("logo") || imgSrc.includes("cover") || imgSrc.includes("banner")) {
                      return; // Sărim peste această imagine
                  }
                  
                  // Verificăm dimensiunile (ignoram imagini gigantice)
                  if (img.width > 400 || img.height > 400) {
                      return;
                  }

                  let parent = img.parentElement;
                  let depth = 0;
                  let inHeader = false;
                  
                  // Verificăm să nu fim în interiorul unui <header>
                  let checkParent = parent;
                  while(checkParent && depth < 10) {
                      if (checkParent.tagName.toLowerCase() === 'header' || 
                          (checkParent.getAttribute('class') || "").toLowerCase().includes("header")) {
                          inHeader = true;
                          break;
                      }
                      checkParent = checkParent.parentElement;
                      depth++;
                  }
                  if (inHeader) return;
                  
                  depth = 0;
                  while (parent && depth < 8) {
                      const text = parent.textContent || "";
                      if ((text.includes('lei') || text.includes('Lei') || text.includes('RON')) && text.length < 400) {
                          if (!productElements.includes(parent)) {
                              productElements.push(parent);
                          }
                          break;
                      }
                      parent = parent.parentElement;
                      depth++;
                  }
              });
          }

          console.log(`Bolt: Found ${productElements.length} product elements`);

          productElements.forEach(card => {
            // Numele produsului
            const nameEl = card.querySelector('[data-testid="components.DishList.DishRow.title"], h3, h4, [class*="name"], [class*="title"], [class*="Name"], [class*="Title"]');
            let name = nameEl ? nameEl.textContent?.trim() || "" : "";
            
            // Fallback dacă h3/h4 nu există: primul text semnificativ din card
            if (!name) {
                const allTexts = Array.from(card.querySelectorAll('div, span, p'))
                    .map(el => el.textContent?.trim() || "")
                    .filter(t => t.length > 2 && !t.includes('lei') && !t.includes('Lei') && !t.includes('RON') && !t.match(/^\d+$/));
                if (allTexts.length > 0) {
                    name = allTexts[0];
                }
            }

            // Prețul produsului
            // Căutăm clasele clasice de preț
            let priceEl = card.querySelector('[data-testid="components.Price.originalPrice"], [data-testid="components.Price.discountedPrice"], [class*="price"], [class*="Price"], .price');

            // Dacă nu găsește clasa, căutăm manual un element care conține textul "lei" sau "RON"
            if (!priceEl) {
              const elements = Array.from(card.querySelectorAll('span, div, p'));
              priceEl = elements.find(el => {
                const txt = el.textContent || "";
                return txt.includes('lei') || txt.includes('Lei') || txt.includes('RON');
              }) || null;
            }
            const priceText = priceEl ? priceEl.textContent?.trim() || "" : "";
            const priceMatch = priceText.match(/([\d,]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;

            // Descrierea
            const descEl = card.querySelector('[data-testid="components.DishList.DishRow.description"], [class*="description"], [class*="Description"], p');
            const description = descEl ? descEl.textContent?.trim() || "" : "";

            // Imaginea
            const imgEl = card.querySelector('[data-testid="components.DishList.DishRow.image"] img, img');
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

          return items;
        }, rest.url);

        for (const item of stepItems) {
            if (!menuItemsMap.has(item.id)) {
                menuItemsMap.set(item.id, item);
            }
        }

        await restPage.mouse.wheel(0, 1000);
        await restPage.waitForTimeout(400);

        if (menuItemsMap.size === prevSize) {
            noChangeAttempts++;
            if (noChangeAttempts >= 6) {
                console.log(`Bolt: Am ajuns la final, extragerea s-a oprit după ${scrollStep} scroll-uri.`);
                break;
            }
        } else {
            noChangeAttempts = 0;
            prevSize = menuItemsMap.size;
        }
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
