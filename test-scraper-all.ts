import { runScrapers } from "./scripts/scraper/index.ts";

async function main() {
    console.log("Pornim scraperul principal de test...");
    const data = await runScrapers("Bulevardul Tomis 47, Constanta");
    console.log("Rezultatele au fost extrase!");
    
    // Test that delivery fees are numbers
    console.log("---- TAXE DE LIVRARE ----");
    console.log(JSON.stringify(data.fees, null, 2));
    
    // Check menus to see if products are extracted and don't contain NaN
    console.log("---- SUMAR MENIURI ----");
    for (const [platform, menus] of Object.entries(data.menus)) {
        console.log(`Platforma: ${platform}`);
        for (const [restId, products] of Object.entries(menus as Record<string, any[]>)) {
            const numProducts = Array.isArray(products) ? products.length : 0;
            console.log(`  - ${restId}: ${numProducts} produse`);
            if (numProducts > 0) {
                console.log(`    Exemplu:`, products.slice(0, 2).map(p => ({
                    nume: p.name,
                    pret: p.prices?.[0]?.price ?? p.price,
                    imagine: p.imageUrl ? "Prezenta" : "Lipsa"
                })));
            }
        }
    }
}

main().catch(console.error);
