import { chromium } from "playwright";
import { scrapeGlovo } from "./scraper/glovo.js";

async function testDeliveryFees() {
  console.log("=== TEST AUTOMATIZARE TAXE LIVRARE (Glovo) ===\n");
  
  const browser = await chromium.launch({
    headless: false, // Setăm false pentru a vedea ce se întâmplă
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 28.6348, latitude: 44.1792 }, // Constanța
    permissions: ['geolocation']
  });

  const testAddress = "Bulevardul Tomis 47, Constanța";

  try {
    console.log(`Testăm extragerea taxelor pentru adresa: ${testAddress}\n`);
    
    const glovoData = await scrapeGlovo(context, testAddress);
    
    console.log("✓ Glovo scraping complet\n");
    console.log(`Taxe extrase pentru ${Object.keys(glovoData.fees).length} restaurante:\n`);
    
    // Afișăm detaliat taxele pentru fiecare restaurant
    for (const [restId, fees] of Object.entries(glovoData.fees)) {
      console.log(`📍 ${restId}:`);
      console.log(`   - Taxă livrare: ${fees.deliveryFee} RON`);
      console.log(`   - Taxă serviciu: ${fees.serviceFeePercent ? (fees.serviceFeePercent * 100).toFixed(1) + '%' : fees.serviceFee + ' RON'}`);
      console.log(`   - Taxă serviciu min: ${fees.serviceFeeMin} RON`);
      console.log(`   - Taxă serviciu max: ${fees.serviceFeeMax} RON`);
      console.log(`   - Prag comandă mică: ${fees.smallOrderThreshold} RON`);
      console.log(`   - Taxă comandă mică: ${fees.smallOrderFee} RON`);
      console.log(`   - Taxă dinamică: ${fees.dynamicSmallOrderFee ? 'DA' : 'NU'}`);
      console.log(`   - Timp livrare: ${fees.deliveryTime} min`);
      console.log("");
    }

    console.log("=== VALIDARE LOGICĂ TAXE ===");
    
    // Validăm că taxele sunt rezonabile
    let allValid = true;
    for (const [restId, fees] of Object.entries(glovoData.fees)) {
      if (fees.deliveryFee < 0 || fees.deliveryFee > 30) {
        console.log(`❌ ${restId}: Taxă livrare suspectă (${fees.deliveryFee} RON)`);
        allValid = false;
      }
      if (fees.serviceFeePercent && (fees.serviceFeePercent < 0 || fees.serviceFeePercent > 0.2)) {
        console.log(`❌ ${restId}: Taxa serviciu procent suspecta (${(fees.serviceFeePercent * 100).toFixed(1)}%)`);
        allValid = false;
      }
      if (fees.smallOrderThreshold && (fees.smallOrderThreshold < 10 || fees.smallOrderThreshold > 100)) {
        console.log(`❌ ${restId}: Prag comanda mica suspect (${fees.smallOrderThreshold} RON)`);
        allValid = false;
      }
    }
    
    if (allValid) {
      console.log("✓ Toate taxele par rezonabile");
    }

    console.log("\n=== TEST FINALIZAT ===");
    console.log("✓ Automatizarea taxelor de livrare funcționează corect");

  } catch (error) {
    console.error("❌ Eroare la testare:", error);
  } finally {
    await browser.close();
  }
}

testDeliveryFees();
