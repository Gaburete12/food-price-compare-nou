import { chromium } from "playwright";
import { scrapeWolt } from "./scripts/scraper/wolt.ts";

async function main() {
    console.log("Pornim scraperul de test pentru Wolt...");
    const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 720 },
    });

    try {
        const data = await scrapeWolt(context, "Bulevardul Tomis 47, Constanta");
        console.log("Rezultatele au fost extrase!");
        
        for (const [restId, products] of Object.entries(data.menus)) {
            const numProducts = Array.isArray(products) ? products.length : 0;
            console.log(`  - ${restId}: ${numProducts} produse`);
            if (numProducts > 0) {
                console.log(`    Exemplu:`, products.slice(0, 3).map(p => ({
                    nume: p.name,
                    pret: p.prices?.[0]?.price ?? p.price,
                    imagine: p.imageUrl ? "Prezenta" : "Lipsa"
                })));
            }
        }
    } finally {
        await browser.close();
    }
}

main().catch(console.error);
