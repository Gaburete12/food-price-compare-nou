import { BrowserContext } from "playwright";

export async function scrapeGlovo(context: BrowserContext, address: string) {
  const page = await context.newPage();
  
  // Forțăm limba română pentru a ne asigura că textele și placeholder-ele se potrivesc cu selectorii noștri!
  await page.setExtraHTTPHeaders({
      'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7'
  });

  const fees: Record<string, any> = {};
  const menus: Record<string, any[]> = {};
  
  const debugLogs: string[] = [];
  const log = (msg: string) => { console.log(msg); debugLogs.push(msg); };

  try {
    const restaurantsToScrape = [
      { id: "mcdonalds-constanta", url: "https://glovoapp.com/ro/ro/constanta/stores/mcdonald-s-cta" }
    ];

    for (const rest of restaurantsToScrape) {
      log(`Navigating directly to ${rest.url}`);
      await page.goto(rest.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const title = await page.title();
      log(`Page title: ${title}`);

      // Detecție blocare anti-bot (Datadome/Cloudflare)
      if (title.toLowerCase().includes("access denied") || 
          title.toLowerCase().includes("attention required") || 
          title.toLowerCase().includes("security check") ||
          title.toLowerCase().includes("cloudflare") ||
          title.toLowerCase().includes("datadome")) {
        throw new Error(`Scraper-ul a fost blocat de sistemul anti-bot Glovo (Datadome/Cloudflare)! Titlul paginii: "${title}"`);
      }

      const bodyHtml = await page.locator('body').innerHTML().catch(() => "");
      if (bodyHtml.includes("dd-captcha") || bodyHtml.toLowerCase().includes("captcha") || bodyHtml.toLowerCase().includes("please enable js")) {
        throw new Error("Scraper-ul a fost blocat de o provocare CAPTCHA Glovo!");
      }

      // Accept cookies if they appear
      try {
          const cookieBtn = page.locator('button:has-text("Acceptați toate"), button:has-text("Accept all"), #onetrust-accept-btn-handler').first();
          if (await cookieBtn.count() > 0) {
             log("Accepting cookies...");
             await cookieBtn.click();
             await page.waitForTimeout(1000);
          }
      } catch(e) {}

      // Verificăm dacă apare popup-ul de 'în afara zonei' sau butonul de adresă și setăm manual locația corectă:
      try {
          const editBtn = page.locator('button:has-text("Editeaz"), button:has-text("Edit"), [data-test-id="address-button"], button:has-text("Livrăm la")').first();
          if (await editBtn.count() > 0) {
              log("Found address trigger button. Clicking it to set address manually...");
              await editBtn.click();
              await page.waitForTimeout(2000);
          }

          // Căutăm câmpul de text pentru introducerea adresei
          const addressInput = page.locator('input[placeholder*="caută"], input[placeholder*="adresă"], input[placeholder*="Address"], input[placeholder*="Unde dorești"], input[placeholder*="livrăm"], #delivery-address-input, .address-input input').first();
          
          if (await addressInput.count() > 0) {
              log("Found address input field! Typing address: Bulevardul Tomis 47, Constanța...");
              await addressInput.fill("Bulevardul Tomis 47, Constanța");
              await page.waitForTimeout(2500);
              
              // Selectăm prima sugestie din listă care conține textul relevant
              const firstSuggestion = page.locator('[class*="address-suggestion"], [class*="Suggestion"], [class*="suggestion"], li:has-text("Tomis"), div:has-text("Tomis"), [class*="SuggestionRow"]').first();
              if (await firstSuggestion.count() > 0) {
                  log("Clicking address suggestion...");
                  await firstSuggestion.click();
                  await page.waitForTimeout(3000);
              }
              
              // Dacă cere tipul de locație
              const typeBtn = page.locator('button:has-text("Altele"), button:has-text("Other"), button:has-text("Acasă"), button:has-text("Home"), button:has-text("Casă")').first();
              if (await typeBtn.count() > 0) {
                  await typeBtn.click();
                  await page.waitForTimeout(1500);
              }

              // Confirmare finală
              const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Confirmă"), button:has-text("Salvează")').first();
              if (await confirmBtn.count() > 0) {
                  log("Clicking final Confirm button to save address!");
                  await confirmBtn.click();
                  await page.waitForTimeout(4000);
              }
          }
      } catch (e: any) {
          log(`Eroare la setarea manuală a adresei: ${e.message}`);
      }

      try {
        // 1. Dăm click pe primul produs disponibil
        const firstAddButton = page.locator('button[data-test-id="add-button"]').first();
        if (await firstAddButton.count() > 0) {
          await firstAddButton.click();
          await page.waitForTimeout(1500);
          
          // Dacă apare un modal cu opțiuni, dăm adaugă în coș
          const addToCartModalBtn = page.locator('button[data-test-id="add-to-cart-button"]').first();
          if (await addToCartModalBtn.count() > 0) {
            await addToCartModalBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        // 2. Apăsăm pe "i" pentru a deschide popup-ul cu detalii taxe
        // Încercăm selectori comuni pentru butonul de info taxe
        const infoButton = page.locator('[data-test-id="service-fee-info"], .store-service-fee-info-icon, button:has-text("Cum calculăm")').first();
        if (await infoButton.count() > 0) {
          await infoButton.click();
          await page.waitForTimeout(1000);
        } else {
          // Alternative: click pe sumarul de taxe din coș
          const cartSummary = page.locator('[data-test-id="cart-summary-total"]').first();
          if (await cartSummary.count() > 0) {
             await cartSummary.click();
             await page.waitForTimeout(1000);
             const innerInfoBtn = page.locator('[data-test-id="service-fee-info"]').first();
             if (await innerInfoBtn.count() > 0) {
                 await innerInfoBtn.click();
                 await page.waitForTimeout(1000);
             }
          }
        }

        // Verificăm dacă suntem pe o pagină validă de magazin și nu s-a încărcat greșit sau incomplet
        const bodyText = await page.locator('body').textContent() || "";
        if (!bodyText.toLowerCase().includes("mcdonald") && !bodyText.toLowerCase().includes("big mac")) {
          throw new Error("Eroare: Pagina magazinului McDonald's nu s-a încărcat complet (sau a fost blocată de securitate)!");
        }

        // 3. Extragem datele reale din DOM (cu fallback pe valorile default dacă selectorii nu găsesc nimic)
        let extracted = {
          deliveryFee: 2.99,
          serviceFeePercent: 0.08,
          serviceFeeMin: 1.99,
          serviceFeeMax: 9.99,
          smallOrderFee: 5.99,
          smallOrderThreshold: 40.0,
        };

        // Încercăm să citim taxa de livrare direct din textul paginii magazinului (extrem de robust la A/B testing)
        try {
          const bodyText = await page.locator('body').textContent() || "";
          const headerText = bodyText.substring(0, 3000);
          log(`Smart header parser read top page text: ${headerText}`);

          let foundFee = 2.99; // Fallback implicit
          const priceMatches = [...headerText.matchAll(/([\d,]+)\s*(lei|RON)/gi)].map(m => parseFloat(m[1].replace(',', '.')));
          log(`All parsed prices in header: ${priceMatches.join(', ')}`);

          // Filtrăm prețurile mici care sunt specifice taxelor de livrare (sub 20 RON)
          const candidateFees = priceMatches.filter(p => p < 20);
          if (candidateFees.length > 0) {
            foundFee = candidateFees[0];
            log(`Found candidate standard delivery fee: ${foundFee} RON`);
          }

          // Verificăm dacă există promoție activă de livrare gratuită
          if (headerText.toLowerCase().includes("gratuit") || headerText.toLowerCase().includes("free")) {
            extracted.deliveryFee = 0;
            log(`Smart header parser resolved delivery fee: 0.00 RON (GRATUIT)`);
          } else {
            extracted.deliveryFee = foundFee;
            log(`Smart header parser resolved delivery fee: ${extracted.deliveryFee} RON`);
          }
        } catch (e: any) {
          log(`Eroare la noul smart header parser: ${e.message}`);
        }

        const feeBlocks = await page.locator('[class*="FeesModal_feeInformation"]').all();
        
        for (const block of feeBlocks) {
          const headerText = await block.locator('[class*="FeesModal_feeHeader"] p').first().textContent() || "";
          
          if (headerText.includes("Serviciu")) {
            const detailsText = await block.locator('span[class*="FeesModal_secondaryColor"]').textContent() || "";
            const minMatch = detailsText.match(/de la ([\d,]+)\s*RON/);
            const percentMatch = detailsText.match(/reprezintă (\d+)\s*%/);
            const maxMatch = detailsText.match(/limitată la ([\d,]+)\s*RON/);

            if (minMatch) extracted.serviceFeeMin = parseFloat(minMatch[1].replace(',', '.'));
            if (percentMatch) extracted.serviceFeePercent = parseFloat(percentMatch[1]) / 100;
            if (maxMatch) extracted.serviceFeeMax = parseFloat(maxMatch[1].replace(',', '.'));
          }
          
          if (headerText.includes("Comandă mică")) {
            const thresholdMatch = headerText.match(/sub ([\d,]+)\s*RON/);
            if (thresholdMatch) extracted.smallOrderThreshold = parseFloat(thresholdMatch[1].replace(',', '.'));
            
            const amountText = await block.locator('[class*="FeesModal_feeAmountContainer"] p').last().textContent() || "";
            const feeMatch = amountText.match(/([\d,]+)\s*RON/);
            if (feeMatch) extracted.smallOrderFee = parseFloat(feeMatch[1].replace(',', '.'));
          }

          if (headerText.includes("Livrare")) {
            const amountText = await block.locator('[class*="FeesModal_feeAmountContainer"] p').last().textContent() || "";
            const feeMatch = amountText.match(/([\d,]+)\s*RON/);
            if (feeMatch) extracted.deliveryFee = parseFloat(feeMatch[1].replace(',', '.'));
          }
        }

        fees[rest.id] = {
          ...extracted,
          dynamicSmallOrderFee: true, // Glovo folosește o suprataxă dinamică limitată (cap) la 5.99 lei sub pragul de comandă!
          deliveryTime: 30
        };

        // 4. Extragem meniul
        console.log(`Începem extragerea meniului pentru ${rest.id}...`);
        
        // Închidem modalul de taxe apasând de mai multe ori pe X sau oriunde pe ecran
        await page.mouse.click(10, 10);
        await page.waitForTimeout(1000);

        // Scroll pentru lazy loading
        await page.evaluate(async () => {
          for(let i = 0; i < 8; i++) {
             window.scrollBy(0, 1200);
             await new Promise(r => setTimeout(r, 800));
          }
        });

        const menuItems = await page.evaluate((url) => {
          const items: any[] = [];
          let productElements = Array.from(document.querySelectorAll('.product-row, .store-product, [data-test-id="product-row"], .product-card, [data-test-id="product-layout"]'));
          
          const evaluateDebug: string[] = [];
          evaluateDebug.push(`Found ${productElements.length} product elements using standard selectors.`);
          
          // Hybrid approach: If Glovo removed data-test-id (A/B testing), we fallback to h2 heuristic
          if (productElements.length === 0) {
              evaluateDebug.push("Falling back to h2 heuristic...");
              const h2s = Array.from(document.querySelectorAll('h2'));
              h2s.forEach(h2 => {
                  let name = h2.textContent?.trim() || "";
                  if (name.length > 2 && name.length < 100) {
                      // Find price nearby
                      let parent = h2.parentElement;
                      let price = 0;
                      let priceText = "";
                      let depth = 0;
                      let cardContainer = parent;
                      while(parent && depth < 4) {
                          const text = parent.textContent || "";
                          const priceMatch = text.match(/([\d,]+)\s*(RON|lei)/i);
                          if (priceMatch) {
                              priceText = priceMatch[0];
                              price = parseFloat(priceMatch[1].replace(',', '.'));
                              cardContainer = parent;
                              break;
                          }
                          parent = parent.parentElement;
                          depth++;
                      }
                      
                      if (price > 0) {
                         // Find category
                         let category = "Meniu";
                         let catParent = cardContainer?.parentElement;
                         let catDepth = 0;
                         while(catParent && catDepth < 10) {
                             // The category is usually a previous sibling or in a parent wrapper
                             const siblingH2 = catParent.previousElementSibling?.querySelector('h2');
                             if (siblingH2 && siblingH2 !== h2) {
                                 category = siblingH2.textContent?.trim() || category;
                                 break;
                             }
                             catParent = catParent.parentElement;
                             catDepth++;
                         }

                         const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                         const imgEl = cardContainer?.querySelector('img');
                         items.push({
                             id, name, description: "", category,
                             imageUrl: imgEl ? (imgEl.getAttribute('src') || "") : "",
                             prices: [{ platform: "glovo", available: true, price, deepLink: url }]
                         });
                         evaluateDebug.push(`Heuristic found: ${name} - ${price}`);
                      }
                  }
              });
          } else {
              productElements.forEach(card => {
                 // Numele produsului
                 const nameEl = card.querySelector('[data-test-id="product-row-name"] span, [data-test-id="product-name"], [data-test-id="product-row-name"], h2, .product-row__name, .product-card-title, h3, h4, span[class*="name"]');
                 let name = nameEl ? nameEl.textContent?.trim() || "" : "";
                 
                 // Prețul produsului
                 const priceEl = card.querySelector('[data-test-id="product-row-price"], [data-test-id="product-price"], .product-row__price, .product-price, .price, span[class*="price"]');
                 const priceText = priceEl ? priceEl.textContent?.trim() || "" : "";
                 const priceMatch = priceText.match(/([\d,]+)/);
                 const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
                 
                 evaluateDebug.push(`Card innerText length: ${card.textContent?.length}. Name extracted: '${name}', Price extracted: ${price} (from '${priceText}')`);
                 
                 // Descrierea
                 const descEl = card.querySelector('[data-test-id="product-description"], .product-row__info, span[class*="description"]');
                 const description = descEl ? descEl.textContent?.trim() || "" : "";
                 
                 // Imaginea
                 const imgEl = card.querySelector('img');
                 const imageUrl = imgEl ? (imgEl.getAttribute('src') || "") : "";
                 
                 // Categoria
                 let category = "Meniu";
                 let parent = card.parentElement;
                 let depth = 0;
                 while(parent && depth < 10) {
                     // De obicei titlul categoriei este într-un h2 anterior cardurilor
                     const heading = parent.querySelector('h2');
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
                             platform: "glovo",
                             available: true,
                             price: price,
                             deepLink: url
                         }]
                     });
                 } else {
                     evaluateDebug.push(`SKIPPED: Name='${name}', Price=${price}, NameLen=${name.length}`);
                 }
              });
          }
          
          // Eliminăm duplicatele după id
          const uniqueItems: any[] = [];
          const seenIds = new Set();
          for (const item of items) {
              if (!seenIds.has(item.id)) {
                  seenIds.add(item.id);
                  uniqueItems.push(item);
              }
          }

          return { uniqueItems, evaluateDebug };
        }, rest.url);
        
        // DEBUG: Jurnale de execuție
        menuItems.evaluateDebug.forEach((d: string) => debugLogs.push("EVAL: " + d));
        const finalItems = menuItems.uniqueItems;
        
        // DEBUG: Jurnale de execuție
        finalItems.push({
            id: "debug-logs",
            name: "Debug Logs",
            description: debugLogs.join('\n')
        });

        // DEBUG: Facem și un screenshot
        try {
            const screenshot = await page.screenshot({ type: 'jpeg', quality: 30 });
            finalItems.push({
               id: "debug-screenshot",
               name: "Screenshot",
               description: screenshot.toString('base64')
            });
        } catch (e) {}

        console.log(`Au fost extrase ${finalItems.length} produse pentru ${rest.id}.`);
        menus[rest.id] = finalItems;

      } catch (e) {
        console.error(`Eroare scraping pentru ${rest.id}:`, e);
      }
    }

  } finally {
    await page.close();
  }

  return { fees, menus };
}

