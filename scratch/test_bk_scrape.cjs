const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 28.6348, latitude: 44.1792 },
    permissions: ['geolocation']
  });
  const page = await context.newPage();

  await page.setExtraHTTPHeaders({
      'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7'
  });

  const debugLogs = [];
  const log = (msg) => { console.log(msg); debugLogs.push(msg); };

  try {
    log("Navigating to Glovo homepage...");
    await page.goto("https://glovoapp.com/ro/ro/", { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Accept cookies
    try {
        const cookieBtn = page.locator('button:has-text("Acceptați toate"), button:has-text("Accept all"), #onetrust-accept-btn-handler').first();
        if (await cookieBtn.count() > 0) {
           log("Accepting cookies...");
           await cookieBtn.click();
           await page.waitForTimeout(1000);
        }
    } catch(e) {}

    // Căutăm câmpul de adresă de pe prima pagină
    try {
        const addressInput = page.locator('input[placeholder*="caută"], input[placeholder*="adresă"], input[placeholder*="Address"], input[placeholder*="livrăm"], #delivery-address-input, .address-input input').first();
        if (await addressInput.count() > 0) {
            log("Found home address input! Typing address...");
            await addressInput.fill("Bulevardul Tomis 47, Constanța");
            await page.waitForTimeout(3000);

            const firstSuggestion = page.locator('[class*="address-suggestion"], [class*="Suggestion"], [class*="suggestion"], li:has-text("Tomis"), div:has-text("Tomis"), [class*="SuggestionRow"]').first();
            if (await firstSuggestion.count() > 0) {
                log("Clicking address suggestion...");
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
                log("Confirming address!");
                await confirmBtn.click();
                await page.waitForTimeout(4000);
            }
        }
    } catch (e) {
        log(`Eroare la setarea adresei: ${e.message}`);
    }

    log("Navigating to Burger King Constanta store page...");
    await page.goto("https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta", { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const title = await page.title();
    log(`Page title: ${title}`);

    if (title.toLowerCase().includes("access denied") || 
        title.toLowerCase().includes("attention required") || 
        title.toLowerCase().includes("security check") ||
        title.toLowerCase().includes("cloudflare") ||
        title.toLowerCase().includes("datadome")) {
      log(`Warning: Blocat de anti-bot!`);
      return;
    }

    // Scroll
    await page.evaluate(async () => {
      for(let i = 0; i < 5; i++) {
         window.scrollBy(0, 900);
         await new Promise(r => setTimeout(r, 500));
      }
    });

    const menuItems = await page.evaluate((url) => {
      const items = [];
      let productElements = Array.from(document.querySelectorAll('.product-row, .store-product, [data-test-id="product-row"], .product-card, [data-test-id="product-layout"]'));
      
      const evaluateDebug = [];
      evaluateDebug.push(`Found ${productElements.length} product elements using standard selectors.`);
      
      if (productElements.length === 0) {
          evaluateDebug.push("Falling back to h2 heuristic...");
          const h2s = Array.from(document.querySelectorAll('h2'));
          h2s.forEach(h2 => {
              let name = h2.textContent?.trim() || "";
              if (name.length > 2 && name.length < 100) {
                  let parent = h2.parentElement;
                  let price = 0;
                  let depth = 0;
                  let cardContainer = parent;
                  while(parent && depth < 4) {
                      const text = parent.textContent || "";
                      const priceMatch = text.match(/([\d,]+)\s*(RON|lei)/i);
                      if (priceMatch) {
                          price = parseFloat(priceMatch[1].replace(',', '.'));
                          cardContainer = parent;
                          break;
                      }
                      parent = parent.parentElement;
                      depth++;
                  }
                  
                  if (price > 0) {
                     let category = "Meniu";
                     let catParent = cardContainer?.parentElement;
                     let catDepth = 0;
                     while(catParent && catDepth < 10) {
                         const siblingH2 = catParent.previousElementSibling?.querySelector('h2');
                         if (siblingH2 && siblingH2 !== h2) {
                             category = siblingH2.textContent?.trim() || category;
                             break;
                         }
                         catParent = catParent.parentElement;
                         catDepth++;
                     }

                     const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                     items.push({ id, name, category, price });
                  }
              }
          });
      } else {
          productElements.forEach(card => {
             const nameEl = card.querySelector('[data-test-id="product-row-name"] span, [data-test-id="product-name"], [data-test-id="product-row-name"], h2, .product-row__name, .product-card-title, h3, h4, span[class*="name"]');
             let name = nameEl ? nameEl.textContent?.trim() || "" : "";
             
             const priceEl = card.querySelector('[data-test-id="product-row-price"], [data-test-id="product-price"], .product-row__price, .product-price, .price, span[class*="price"]');
             const priceText = priceEl ? priceEl.textContent?.trim() || "" : "";
             const priceMatch = priceText.match(/([\d,]+)/);
             const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
             
             if (name && price > 0 && name.length < 100) {
                 const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                 items.push({ id, name, price });
             }
          });
      }
      return { items, evaluateDebug };
    }, "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta");

    console.log("Scraped items count:", menuItems.items.length);
    console.log("Evaluation debug:", menuItems.evaluateDebug);
    if (menuItems.items.length > 0) {
      console.log("First 3 items scraped:", menuItems.items.slice(0, 3));
    }
  } catch (err) {
    console.error("Scraper crash:", err);
  } finally {
    await browser.close();
  }
})();
