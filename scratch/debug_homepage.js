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
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log("Navigating to Glovo homepage...");
  await page.goto("https://glovoapp.com/ro/ro/");
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'scratch/homepage.png' });
  console.log("Saved screenshot to scratch/homepage.png");

  // Save HTML
  const html = await page.content();
  fs.writeFileSync('scratch/homepage.html', html, 'utf8');
  console.log("Saved HTML to scratch/homepage.html");

  await browser.close();
}

main().catch(console.error);
