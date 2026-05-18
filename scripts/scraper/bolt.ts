import { BrowserContext } from "playwright";

export async function scrapeBolt(context: BrowserContext, address: string) {
  const page = await context.newPage();
  const fees: Record<string, any> = {};

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
      { id: "mcdonalds-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/99435-mcdonalds-vivo-mall/" },
      { id: "dabo-doner-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/200293-dabo-doner-mircea-constanta/" }
    ];

    for (const rest of restaurantsToScrape) {
      console.log(`Deschidem pagina restaurantului Bolt: ${rest.id}`);
      // Folosim o pagină nouă izolată per restaurant pentru a evita cumularea coșului de cumpărături
      const restPage = await context.newPage();
      
      try {
        await restPage.goto(rest.url, { waitUntil: 'domcontentloaded' });
        await restPage.waitForTimeout(2000);

        // 1. Apăsăm pe primul produs din listă
        const firstProduct = restPage.locator('div[data-test="restaurant-menu-item"]').first();
        if (await firstProduct.count() > 0) {
          await firstProduct.click();
          await restPage.waitForTimeout(1000);

          // 2. Apăsăm adaugă în coș
          const addToCartBtn = restPage.locator('button[data-test="add-to-cart"]').first();
          if (await addToCartBtn.count() > 0) {
            await addToCartBtn.click();
            await restPage.waitForTimeout(2000); // așteptăm ca produsul să fie adăugat și coșul să se deschidă
          }
        }

        // 3. Extragem datele reale din componentele de prețuri ale coșului Bolt Food
        let extracted = {
          deliveryFee: 3.00, // Valoare inițială fallback rezonabilă
          serviceFeePercent: null,
          serviceFee: 0,
          smallOrderFee: 0,
          smallOrderThreshold: 40, // Pragul standard
        };

        const feeItems = await restPage.locator('[data-testid="components.OrderFees.feeItem"]').all();

        for (const item of feeItems) {
          const text = await item.textContent() || "";
          const match = text.match(/([\d,]+)\s*lei/i);
          const val = match ? parseFloat(match[1].replace(',', '.')) : 0;

          if (text.toLowerCase().includes('livrare') || text.toLowerCase().includes('delivery')) {
            extracted.deliveryFee = val;
          } else if (text.toLowerCase().includes('serviciu') || text.toLowerCase().includes('service')) {
            extracted.serviceFee = val;
          } else if (text.toLowerCase().includes('minimă') || text.toLowerCase().includes('comandă mică') || text.toLowerCase().includes('small')) {
            extracted.smallOrderFee = val;
          }
        }

        fees[rest.id] = {
          bolt: {
            ...extracted,
            dynamicSmallOrderFee: false, // Folosim suma fixă extrasă din coș
            deliveryTime: 25
          }
        };
        console.log(`Bolt Fees extrase pentru ${rest.id}:`, extracted);

      } catch (e) {
        console.error(`Eroare scraping Bolt pentru ${rest.id}:`, e);
      } finally {
        await restPage.close(); // Închidem pagina restaurantului
      }
    }

  } finally {
    await page.close(); // Închidem pagina principală de geolocalizare
  }

  return fees;
}
