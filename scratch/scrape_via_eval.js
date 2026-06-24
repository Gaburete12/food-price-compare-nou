import playwrightPkg from 'file:///C:/Users/andre/AppData/Local/ms-playwright-go/1.57.0/package/index.js';
const { chromium } = playwrightPkg;
import fs from 'fs';

async function main() {
  console.log("Launching browser...");
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  } catch (err) {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  }
  
  // Set geolocation context exactly like runScrapers does
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 28.6348, latitude: 44.1792 }, // Constanta coordinates
    permissions: ['geolocation']
  });
  
  const page = await context.newPage();

  console.log("Setting address on Glovo homepage...");
  await page.goto("https://glovoapp.com/ro/ro/", { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Accept cookies
  try {
    await page.locator('button:has-text("Acceptați toate"), button:has-text("Accept all"), #onetrust-accept-btn-handler').first().click({ force: true });
    await page.waitForTimeout(1500);
  } catch(e) {}

  // Fill address
  try {
    console.log("Clicking 'Utilizează locația curentă'...");
    await page.locator('button:has-text("Utilizează locația curentă"), button:has-text("Use current location")').first().click({ force: true });
    await page.waitForTimeout(5000);
  } catch(e) {
    console.log("Address setup error:", e.message);
  }

  const urls = [
    { id: "mesopotamia-constanta", name: "Mesopotamia", url: "https://glovoapp.com/ro/ro/constanta/stores/mesopotamia-constanta" },
    { id: "tacoseria-constanta", name: "Tacoseria", url: "https://glovoapp.com/ro/ro/constanta/stores/tacoseria-cta" }
  ];

  for (const rest of urls) {
    console.log(`\nNavigating to ${rest.name}: ${rest.url}`);
    await page.goto(rest.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const nextF = await page.evaluate(() => {
      return window.__next_f || self.__next_f || null;
    });

    console.log(`__next_f type: ${typeof nextF}, isArray: ${Array.isArray(nextF)}, length: ${nextF?.length}`);

    if (nextF) {
      fs.writeFileSync(`scratch/next_f_${rest.id}.json`, JSON.stringify(nextF, null, 2), 'utf8');
      console.log(`Saved raw __next_f to scratch/next_f_${rest.id}.json`);
    } else {
      console.log("window.__next_f is undefined. Scraping failed.");
    }
  }

  await browser.close();
}

main().catch(console.error);
