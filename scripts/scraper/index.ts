import { chromium } from "playwright";
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
    permissions: ['geolocation']
  });

  try {
    console.log("-> Începem scraping pe Glovo...");
    const glovoData = await scrapeGlovo(context, address).catch(e => {
      console.error("Eroare la Glovo:", e.message);
      return { fees: {}, menus: {} };
    });

    console.log("-> Începem scraping pe Wolt...");
    const woltFees = await scrapeWolt(context, address).catch(e => {
      console.error("Eroare la Wolt:", e.message);
      return {};
    });

    console.log("-> Începem scraping pe Bolt Food...");
    const boltFees = await scrapeBolt(context, address).catch(e => {
      console.error("Eroare la Bolt:", e.message);
      return {};
    });

    console.log("Scraping finalizat cu succes.");
    return {
      fees: {
        glovo: glovoData.fees,
        wolt: woltFees,
        bolt: boltFees
      },
      menus: {
        glovo: glovoData.menus || {},
        wolt: {},
        bolt: {}
      }
    };
  } finally {
    await browser.close();
  }
}

