import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { scrapeGlovo } from "./scripts/scraper/glovo.ts";

chromium.use(stealthPlugin());

async function main() {
    console.log("Pornim scraperul de test stealth pentru Glovo...");
    const browser = await chromium.launch({ headless: false, args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"] });
    
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 720 },
        geolocation: { longitude: 28.6348, latitude: 44.1792 },
        permissions: ["geolocation"],
        extraHTTPHeaders: {
          "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7"
        }
    });

    try {
        const data = await scrapeGlovo(context, "Bulevardul Tomis 47, Constanta");
        console.log("Rezultatele au fost extrase!");
        
        for (const [restId, products] of Object.entries(data.menus)) {
            const numProducts = Array.isArray(products) ? products.length : 0;
            console.log(`  - ${restId}: ${numProducts} produse`);
        }
    } finally {
        await browser.close();
    }
}

main().catch(console.error);
