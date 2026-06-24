import playwrightPkg from 'file:///C:/Users/andre/AppData/Local/ms-playwright-go/1.57.0/package/index.js';
const { chromium } = playwrightPkg;

async function main() {
  console.log("Launching browser...");
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  } catch (err) {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  }
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const page = await context.newPage();

  console.log("Setting address on Glovo homepage...");
  await page.goto("https://glovoapp.com/ro/ro/", { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  try {
    await page.locator('button:has-text("Acceptați toate"), button:has-text("Accept all"), #onetrust-accept-btn-handler').first().click({ force: true });
    await page.waitForTimeout(1000);
  } catch(e) {}

  try {
    await page.locator('input[placeholder="Care este adresa ta?"]').first().click({ force: true });
    await page.waitForTimeout(1000);
    const activeInput = page.locator('input[placeholder*="caută"], input[placeholder*="adresă"], input[placeholder*="Address"], input[placeholder*="livrăm"], #delivery-address-input, .address-input input').first();
    await activeInput.fill("Bulevardul Tomis 47, Constanța");
    await page.waitForTimeout(2000);
    await page.locator('[class*="address-suggestion"], [class*="SuggestionRow"]').first().click({ force: true });
    await page.waitForTimeout(2000);
    try {
      await page.locator('button:has-text("Altele"), button:has-text("Other"), button:has-text("Acasă")').first().click({ force: true });
      await page.waitForTimeout(1000);
    } catch(e) {}
    try {
      await page.locator('button:has-text("Confirm"), button:has-text("Confirmă")').first().click({ force: true });
      await page.waitForTimeout(3000);
    } catch(e) {}
  } catch(e) {}

  console.log("Navigating to Mesopotamia...");
  await page.goto("https://glovoapp.com/ro/ro/constanta/stores/mesopotamia-constanta", { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const arr = window.__next_f || self.__next_f || [];
    return {
      type: typeof arr,
      isArray: Array.isArray(arr),
      length: arr.length,
      keys: Object.keys(arr),
      keysCount: Object.keys(arr).length,
      arrayFromLength: Array.from(arr).length,
      sliceLength: Array.prototype.slice.call(arr).length
    };
  });

  console.log("Inspection info:", info);
  await browser.close();
}

main().catch(console.error);
