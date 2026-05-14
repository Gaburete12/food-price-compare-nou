import { BrowserContext } from "playwright";

export async function scrapeWolt(context: BrowserContext, address: string) {
  const page = await context.newPage();
  const fees: Record<string, any> = {};

  try {
    await page.goto("https://wolt.com/ro/rou/constanta/", { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const restaurantsToScrape = [
{ id: "pizzahut-constanta", url: "https://wolt.com/en/rou/constanta/restaurant/pizza-hut-constanta-67dc2390b93a5300e8efd498" },
      { id: "kfc-buc-1", url: "https://wolt.com/en/rou/constanta/restaurant/kfc-city-park-67ee912b0231e21086424409" },
      { id: "mcdonalds-constanta", url: "https://wolt.com/en/rou/constanta/restaurant/mcdonalds-tomis-67ed2703c86a467a0cecf401" },
      { id: "dabo-doner-constanta", url: "https://wolt.com/en/rou/constanta/restaurant/dabo-doner-mircea-constana-00a224" }
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

      } catch (e) {
        console.error(`Eroare scraping Wolt pentru ${rest.id}:`, e);
      }
    }

  } finally {
    await page.close();
  }

  return fees;
}
