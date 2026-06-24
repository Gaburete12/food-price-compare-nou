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
  console.log("Waiting 8 seconds for dynamic popups...");
  await page.waitForTimeout(8000);

  // Take screenshot to see if cookie banner is visible
  await page.screenshot({ path: 'scratch/homepage_8s.png' });
  console.log("Saved screenshot to scratch/homepage_8s.png");

  // Find all buttons, even inside shadow DOMs
  const buttonsInfo = await page.evaluate(() => {
    const list = [];
    
    // Recursive function to search in elements and their shadow roots
    function search(node) {
      if (!node) return;
      if (node.tagName === 'BUTTON' || node.tagName === 'INPUT') {
        const rect = node.getBoundingClientRect();
        list.push({
          tagName: node.tagName,
          className: node.className,
          placeholder: node.placeholder || '',
          text: node.textContent?.trim().slice(0, 100) || '',
          id: node.id,
          visible: rect.width > 0 && rect.height > 0
        });
      }
      
      // Search shadow root if present
      if (node.shadowRoot) {
        search(node.shadowRoot);
      }
      
      // Search children
      const children = node.children || node.childNodes || [];
      for (const child of children) {
        search(child);
      }
    }
    
    search(document.body);
    return list;
  });

  console.log("All buttons and inputs after 8 seconds (including shadow DOMs):", buttonsInfo);
  await browser.close();
}

main().catch(console.error);
