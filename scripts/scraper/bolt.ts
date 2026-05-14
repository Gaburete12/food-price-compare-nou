import { BrowserContext } from "playwright";

export async function scrapeBolt(context: BrowserContext, address: string) {
  const page = await context.newPage();
  const fees: Record<string, any> = {};

  try {
    await page.goto("https://food.bolt.eu/ro-ro/462-constanta/", { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const restaurantsToScrape = [
{ id: "pizzahut-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/86990-pizza-hut-constanta/" },
      { id: "kfc-buc-1", url: "https://food.bolt.eu/ro-ro/462-constanta/p/135512-kfc-city-park-constanta/" },
      { id: "mcdonalds-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/99435-mcdonalds-vivo-mall/" },
      { id: "dabo-doner-constanta", url: "https://food.bolt.eu/ro-ro/462-constanta/p/200293-dabo-doner-mircea-constanta/" }
    ];

    for (const rest of restaurantsToScrape) {
      await page.goto(rest.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      try {
        // 1. Apăsăm pe primul produs
        const firstProduct = page.locator('div[data-test="restaurant-menu-item"]').first();
        if (await firstProduct.count() > 0) {
          await firstProduct.click();
          await page.waitForTimeout(1000);

          // 2. Apăsăm adaugă în coș
          const addToCartBtn = page.locator('button[data-test="add-to-cart"]').first();
          if (await addToCartBtn.count() > 0) {
            await addToCartBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        // 3. Extragem datele reale din componentele Bolt Food
        let extracted = {
          deliveryFee: 7.99,
          serviceFeePercent: null, // Bolt Food are adesea o taxă fixă de serviciu
          serviceFee: 0,
          smallOrderFee: 0,
          smallOrderThreshold: 40, // Fallback
        };

        const feeItems = await page.locator('[data-testid="components.OrderFees.feeItem"]').all();

        for (const item of feeItems) {
          const text = await item.textContent() || "";
          const match = text.match(/([\d,]+)\s*lei/i);
          const val = match ? parseFloat(match[1].replace(',', '.')) : 0;

          if (text.toLowerCase().includes('livrare')) {
            extracted.deliveryFee = val;
          } else if (text.toLowerCase().includes('serviciu')) {
            extracted.serviceFee = val;
          } else if (text.toLowerCase().includes('minimă')) {
            // Bolt afișează suprataxa fixă pentru comanda curentă (nu diferența calculabilă, ci suma exactă)
            extracted.smallOrderFee = val;
          }
        }

        fees[rest.id] = {
          bolt: {
            ...extracted,
            dynamicSmallOrderFee: false, // Folosim suma fixă extrasă
            deliveryTime: 25
          }
        };

      } catch (e) {
        console.error(`Eroare scraping Bolt pentru ${rest.id}:`, e);
      }
    }

  } finally {
    await page.close();
  }

  return fees;
}
