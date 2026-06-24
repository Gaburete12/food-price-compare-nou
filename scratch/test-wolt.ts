import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
chromium.use(stealthPlugin());

async function testWolt() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto("https://wolt.com/en/rou/constanta/restaurant/shaormeria-baneasa-constanta", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  
  const title = await page.title();
  console.log("Title:", title);
  
  await browser.close();
}

testWolt().catch(console.error);
