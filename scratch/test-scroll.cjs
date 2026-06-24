const { chromium } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(stealthPlugin());

async function testScroll() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://food.bolt.eu/ro-ro/462-constanta/p/56615-shaormeria-baneasa-cismelei/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const allItemsHtml = new Set();

  await page.evaluate(async () => {
    window.allItemsHtml = new Set();
    
    await new Promise(resolve => {
      let scrollAttempts = 0;
      let lastHeight = document.body.scrollHeight;
      
      const timer = setInterval(() => {
        // Colectăm elementele curente
        document.querySelectorAll('[data-testid="components.DishList.DishRow.view"]').forEach(el => {
          window.allItemsHtml.add(el.innerHTML);
        });

        window.scrollBy(0, 800);
        
        let newHeight = document.body.scrollHeight;
        if (newHeight === lastHeight) {
          scrollAttempts++;
          if (scrollAttempts >= 5) {
            clearInterval(timer);
            resolve(true);
          }
        } else {
          lastHeight = newHeight;
          scrollAttempts = 0;
        }
      }, 500);
    });
  });
  
  await page.waitForTimeout(2000);
  
  const finalSetSize = await page.evaluate(() => {
    document.querySelectorAll('[data-testid="components.DishList.DishRow.view"]').forEach(el => {
      window.allItemsHtml.add(el.innerHTML);
    });
    return window.allItemsHtml.size;
  });
  
  console.log('Total unique items found during scroll:', finalSetSize);
  await browser.close();
}
testScroll().catch(console.error);
