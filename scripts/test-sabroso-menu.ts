import { chromium } from "playwright";

async function testSabrosoMenu() {
  console.log("=== TEST EXTRAGERE MENIU SABROSO CONSTANTA ===\n");
  
  const browser = await chromium.launch({
    headless: false, // Setăm false pentru a vedea ce se întâmplă
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 28.6348, latitude: 44.1792 }, // Constanța
    permissions: ['geolocation']
  });

  const page = await context.newPage();
  const sabrosoUrl = "https://glovoapp.com/ro/ro/constanta/stores/sabrosso";

  try {
    console.log(`Navigăm pe pagina Sabroso: ${sabrosoUrl}`);
    await page.goto(sabrosoUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Acceptăm cookies dacă bannerul este vizibil
    try {
      const cookieButton = page.locator('button').filter({ hasText: /accept/i }).first();
      if (await cookieButton.isVisible({ timeout: 2000 })) {
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log("Nu am găsit banner cookies sau nu era vizibil");
    }

    console.log("Începem extragerea meniului...");

    // Scroll pentru a încărca produsele lazy-loaded
    await page.evaluate(async () => {
      for(let i = 0; i < 15; i++) {
         window.scrollBy(0, 800);
         await new Promise(r => setTimeout(r, 600));
      }
    });

    const menuItems = await page.evaluate(() => {
      const items: any[] = [];
      
      // Încercăm mai mulți selectori pentru produse
      const productElements = Array.from(document.querySelectorAll('[data-test-id="MenuItem"], [class*="MenuItem"], [class*="ProductItem"], .product-card, .item-card'));

      console.log(`Found ${productElements.length} product elements`);

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
              platform: "glovo",
              available: true,
              price: price,
              deepLink: "https://glovoapp.com/ro/ro/constanta/stores/sabrosso"
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
    });

    console.log(`\n✓ Meniu extras cu succes!`);
    console.log(`  - Număr produse: ${menuItems.length}`);
    
    if (menuItems.length > 0) {
      console.log(`\n  Primele 3 produse:`);
      menuItems.slice(0, 3).forEach((item, index) => {
        console.log(`    ${index + 1}. ${item.name} - ${item.prices[0].price} RON`);
        console.log(`       Categoria: ${item.category}`);
        console.log(`       Imagine: ${item.imageUrl ? 'DA' : 'NU'}`);
      });

      console.log(`\n  Categorii găsite:`);
      const categories = [...new Set(menuItems.map(item => item.category))];
      categories.forEach(cat => {
        console.log(`    - ${cat} (${menuItems.filter(i => i.category === cat).length} produse)`);
      });

      // Salvăm meniul într-un fișier JSON pentru verificare
      const fs = await import('fs');
      const path = await import('path');
      const menuData = {
        restaurantId: "sabroso-constanta",
        restaurantName: "Sabroso",
        extractedAt: new Date().toISOString(),
        menu: menuItems
      };
      
      const outputPath = path.resolve(process.cwd(), 'data', 'sabroso-menu-test.json');
      fs.writeFileSync(outputPath, JSON.stringify(menuData, null, 2), 'utf8');
      console.log(`\n  Meniu salvat în: ${outputPath}`);
    } else {
      console.log(`\n  ❌ Nu s-au găsit produse!`);
      console.log(`  Posibile cauze:`);
      console.log(`    - Selectorii CSS nu sunt corecți`);
      console.log(`    - Pagina are o structură diferită`);
      console.log(`    - Produsele sunt încărcate dinamic`);
    }

  } catch (error) {
    console.error("❌ Eroare la testare:", error);
  } finally {
    await browser.close();
  }
}

testSabrosoMenu();
