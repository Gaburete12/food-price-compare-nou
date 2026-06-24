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

  console.log("Navigating to Glovo homepage...");
  await page.goto("https://glovoapp.com/ro/ro/");
  await page.waitForTimeout(3000);

  // Accept cookies
  try {
    await page.locator('button:has-text("Acceptați toate"), button:has-text("Accept all"), #onetrust-accept-btn-handler').first().click({ force: true });
    await page.waitForTimeout(1000);
  } catch(e) {}

  // Let's set address via UI, but let's do it with a click on "Utilizează locația curentă" or let's try to find what input works
  try {
    // Click the readonly input
    await page.locator('input[placeholder="Care este adresa ta?"]').first().click({ force: true });
    await page.waitForTimeout(2000);

    // Take screenshot of modal to see what input is there
    await page.screenshot({ path: 'scratch/modal.png' });
    console.log("Saved modal screenshot to scratch/modal.png");

    // Print all inputs in the modal
    const inputsInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(i => ({
        outerHTML: i.outerHTML,
        placeholder: i.placeholder,
        value: i.value,
        id: i.id,
        className: i.className,
        readOnly: i.readOnly
      }));
    });
    console.log("Inputs after modal open:", inputsInfo);
  } catch(e) {
    console.error(e);
  }

  await browser.close();
}

main().catch(console.error);
