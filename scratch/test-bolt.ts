import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
chromium.use(stealthPlugin());

async function testBolt() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto("https://food.bolt.eu/ro-ro/462-constanta/p/56615-shaormeria-baneasa-cismelei/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  
  const items = await page.$$('li[role="button"], div[role="button"], div[class*="ProductCard"], div[data-test-id*="product"]');
  console.log("Cards found:", items.length);
  
  for (const item of items.slice(0, 5)) {
    const text = await item.innerText();
    console.log("--- Card Text ---");
    console.log(text);
  }
  
  await browser.close();
}

testBolt().catch(console.error);
