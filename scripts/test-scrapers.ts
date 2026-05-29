import { chromium } from "playwright";
import { scrapeBolt } from "./scraper/bolt.js";
import { scrapeWolt } from "./scraper/wolt.js";

async function testScrapers() {
  console.log("=== TEST SCRAPERS BOLT ȘI WOLT ===\n");
  
  const browser = await chromium.launch({
    headless: false, // Setăm false pentru a vedea ce se întâmplă
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 28.6348, latitude: 44.1792 },
    permissions: ['geolocation']
  });

  const testAddress = "Bulevardul Tomis 47, Constanța";

  try {
    console.log("1. Testare Bolt Scraper...");
    const boltData = await scrapeBolt(context, testAddress);
    console.log("✓ Bolt scraping complet");
    console.log(`  - Taxe extrase pentru ${Object.keys(boltData.fees).length} restaurante`);
    console.log(`  - Meniuri extrase pentru ${Object.keys(boltData.menus).length} restaurante`);
    
    // Afișăm detalii pentru primul restaurant
    const firstBoltRest = Object.keys(boltData.fees)[0];
    if (firstBoltRest) {
      console.log(`  - Exemplu ${firstBoltRest}:`);
      console.log(`    Taxe:`, boltData.fees[firstBoltRest]);
      console.log(`    Produse în meniu: ${boltData.menus[firstBoltRest]?.length || 0}`);
      if (boltData.menus[firstBoltRest] && boltData.menus[firstBoltRest].length > 0) {
        console.log(`    Primul produs:`, boltData.menus[firstBoltRest][0]);
      }
    }

    console.log("\n2. Testare Wolt Scraper...");
    const woltData = await scrapeWolt(context, testAddress);
    console.log("✓ Wolt scraping complet");
    console.log(`  - Taxe extrase pentru ${Object.keys(woltData.fees).length} restaurante`);
    console.log(`  - Meniuri extrase pentru ${Object.keys(woltData.menus).length} restaurante`);
    
    // Afișăm detalii pentru primul restaurant
    const firstWoltRest = Object.keys(woltData.fees)[0];
    if (firstWoltRest) {
      console.log(`  - Exemplu ${firstWoltRest}:`);
      console.log(`    Taxe:`, woltData.fees[firstWoltRest]);
      console.log(`    Produse în meniu: ${woltData.menus[firstWoltRest]?.length || 0}`);
      if (woltData.menus[firstWoltRest] && woltData.menus[firstWoltRest].length > 0) {
        console.log(`    Primul produs:`, woltData.menus[firstWoltRest][0]);
      }
    }

    console.log("\n=== REZUMAT TEST ===");
    console.log("✓ Ambi scrapers au rulat cu succes");
    console.log(`✓ Bolt: ${Object.keys(boltData.menus).reduce((sum, id) => sum + (boltData.menus[id]?.length || 0), 0)} produse totale`);
    console.log(`✓ Wolt: ${Object.keys(woltData.menus).reduce((sum, id) => sum + (woltData.menus[id]?.length || 0), 0)} produse totale`);

  } catch (error) {
    console.error("❌ Eroare la testare:", error);
  } finally {
    await browser.close();
  }
}

testScrapers();
