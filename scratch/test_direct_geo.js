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
  
  // Set geolocation context
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 28.6348, latitude: 44.1792 },
    permissions: ['geolocation']
  });
  
  const page = await context.newPage();

  console.log("Navigating directly to Mesopotamia on Glovo...");
  await page.goto("https://glovoapp.com/ro/ro/constanta/stores/mesopotamia-constanta", { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const nextF = await page.evaluate(() => window.__next_f || self.__next_f || null);
  console.log("Mesopotamia nextF length with direct geo navigation:", nextF?.length);

  await browser.close();
}

main().catch(console.error);
