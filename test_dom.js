const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    geolocation: { longitude: 28.6348, latitude: 44.1792 },
    permissions: ['geolocation'],
    locale: 'ro-RO',
    extraHTTPHeaders: { 'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7' }
  });
  const page = await context.newPage();
  await page.goto('https://glovoapp.com/ro/ro/constanta/stores/mcdonald-s-cta');
  
  await page.waitForTimeout(5000);
  const locBtn = page.locator('button:has-text("Utilizeaza loca?ia curenta")').first();
  if (await locBtn.count() > 0) {
    await locBtn.click();
    await page.waitForTimeout(2000);
    const typeBtn = page.locator('button:has-text("Acasa")').first();
    if (await typeBtn.count() > 0) await typeBtn.click();
    await page.waitForTimeout(1000);
    const confBtn = page.locator('button:has-text("Confirma")').first();
    if (await confBtn.count() > 0) await confBtn.click();
  }
  
  await page.waitForTimeout(5000);
  const html = await page.evaluate(() => {
     const products = document.querySelectorAll('[data-test-id="product-row"]');
     if (products.length > 0) return products[0].outerHTML;
     return "No product row found";
  });
  
  fs.writeFileSync('dom_dump.html', html);
  await browser.close();
})();
