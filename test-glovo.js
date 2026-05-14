const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating...");
  await page.goto("https://glovoapp.com/ro/ro/constanta/stores/mcdonald-s-cta", { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Accept cookies
  const cookieBtn = page.locator('button:has-text("Acceptați toate"), #onetrust-accept-btn-handler').first();
  if (await cookieBtn.count() > 0) {
    console.log("Clicking cookies...");
    await cookieBtn.click();
    await page.waitForTimeout(1000);
  }

  const editAddressBtn = page.locator('text="Editează-ți adresa"').first();
  if (await editAddressBtn.count() > 0) {
    console.log("Found edit address button! TagName: " + await editAddressBtn.evaluate(el => el.tagName));
    await editAddressBtn.click();
    await page.waitForTimeout(2000);

    const inputs = await page.locator('input').evaluateAll(els => els.map(el => ({type: el.type, placeholder: el.placeholder, id: el.id, className: el.className})));
    console.log("Inputs found: ", inputs);

    const addressInput = page.locator('input[type="text"]').last();
    console.log("Typing address...");
    await addressInput.fill("Bulevardul Tomis 47, Constanța");
    await page.waitForTimeout(2000);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);

    const predictions = await page.locator('[data-test-id="address-prediction"], div[class*="prediction"], li, [class*="ListItem"]').evaluateAll(els => els.map(el => el.textContent));
    console.log("Predictions found: ", predictions);
  } else {
    console.log("No edit address button found.");
  }

  await browser.close();
})();
