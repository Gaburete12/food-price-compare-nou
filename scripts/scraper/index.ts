import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";

// Activare Stealth Plugin
chromium.use(stealthPlugin());
import { scrapeGlovo } from "./glovo";
import { scrapeWolt } from "./wolt";
import { scrapeBolt } from "./bolt";

export async function runScrapers(address: string) {
  console.log(`Pornim browser-ul virtual pentru adresa: ${address}`);
  
  // Lansăm browser-ul. Pe Railway va rula în mod 'headless' (fără interfață grafică).
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necesar pe servere Linux/Railway
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 28.6348, latitude: 44.1792 }, // Setat aproximativ pentru Constanța
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"'
    }
  });

  // Stealth Avansat: Evitarea detectării de bază a Playwright/Puppeteer
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
    // Evităm detectarea prin plugin-uri (imităm plugin-urile default din Chrome)
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin' },
        { name: 'Chrome PDF Viewer' },
        { name: 'Native Client' }
      ]
    });
    // Spoofing pentru limbi
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ro-RO', 'ro', 'en-US', 'en']
    });
  });

  try {
    console.log("-> Sărim peste scraping pe Glovo (pauză anti-bot)...");
    const glovoData = { fees: {}, menus: {} };

    console.log("-> Începem scraping pe Wolt...");
    // const woltData = await scrapeWolt(context, address).catch(e => {
    //   console.error("Eroare la Wolt:", e.message);
    //   return { fees: {}, menus: {} };
    // });
    const woltData = { fees: {}, menus: {} };

    console.log("-> Începem scraping pe Bolt Food...");
    const boltData = await scrapeBolt(context, address).catch(e => {
      console.error("Eroare la Bolt:", e.message);
      return { fees: {}, menus: {} };
    });

    console.log("Scraping finalizat cu succes.");
    return {
      fees: {
        glovo: glovoData.fees,
        wolt: woltData.fees,
        bolt: boltData.fees
      },
      menus: {
        glovo: glovoData.menus || {},
        wolt: woltData.menus || {},
        bolt: boltData.menus || {}
      }
    };
  } finally {
    await browser.close();
  }
}

