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

  console.log("Navigating directly to Constanta city page...");
  await page.goto("https://glovoapp.com/ro/ro/constanta/", { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Accept cookies
  try {
    await page.locator('button:has-text("Acceptați toate"), button:has-text("Accept all"), #onetrust-accept-btn-handler').first().click({ force: true });
    await page.waitForTimeout(1000);
  } catch(e) {}

  console.log("Navigating to Mesopotamia page...");
  await page.goto("https://glovoapp.com/ro/ro/constanta/stores/mesopotamia-constanta", { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const nextF = await page.evaluate(() => window.__next_f || self.__next_f || null);
  console.log("Mesopotamia nextF length after city navigation:", nextF?.length);

  await browser.close();
}

main().catch(console.error);
