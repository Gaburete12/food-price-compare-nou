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
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 28.6348, latitude: 44.1792 },
    permissions: ['geolocation']
  });
  const page = await context.newPage();

  console.log("Navigating to Glovo homepage...");
  await page.goto("https://glovoapp.com/ro/ro/");
  await page.waitForTimeout(5000);

  // Accept cookies
  try {
    await page.locator('button:has-text("Acceptați toate"), button:has-text("Accept all"), #onetrust-accept-btn-handler').first().click({ force: true });
    await page.waitForTimeout(1000);
  } catch(e) {}

  // Find all elements that have text or are inputs
  const elements = await page.evaluate(() => {
    const elList = Array.from(document.querySelectorAll('input, button, a, div[class*="address"], div[class*="input"]'));
    return elList.map(el => {
      const rect = el.getBoundingClientRect();
      return {
        tagName: el.tagName,
        className: el.className,
        placeholder: el.placeholder || '',
        text: el.textContent?.trim().slice(0, 100) || '',
        id: el.id,
        visible: rect.width > 0 && rect.height > 0,
        x: rect.x,
        y: rect.y
      };
    }).filter(e => e.visible && (e.text || e.placeholder || e.tagName === 'INPUT'));
  });

  console.log("Visible elements on homepage:", elements);
  await browser.close();
}

main().catch(console.error);
