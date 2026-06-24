import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
chromium.use(stealthPlugin());
import fs from "fs";

async function testBolt() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto("https://food.bolt.eu/ro-ro/462-constanta/p/56615-shaormeria-baneasa-cismelei/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  
  const content = await page.content();
  fs.writeFileSync("scratch/bolt_shaormeria.html", content);
  
  await browser.close();
}

testBolt().catch(console.error);
