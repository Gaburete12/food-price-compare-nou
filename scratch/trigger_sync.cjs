const fs = require('fs');
const path = require('path');

(async () => {
  console.log("Triggering live sync on Railway production server (this may take up to 2 minutes)...");
  try {
    const response = await fetch("https://food-price-compare-nou-production.up.railway.app/api/admin/delivery-fees/sync", {
      method: "POST",
      headers: {
        "x-sync-token": "demo-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ address: "Bulevardul Tomis 47, Constanta" })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    console.log("Sync response received successfully!");
    
    // Save to a file for backup
    const outPath = path.join(__dirname, 'sync_result_live.json');
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved sync results to: ${outPath}`);

    // Extract Burger King logs
    if (data.scrapedData && data.scrapedData.menus && data.scrapedData.menus.glovo) {
      const bkItems = data.scrapedData.menus.glovo["burgerking-constanta"] || [];
      console.log(`Burger King scraped items count (including debug entries): ${bkItems.length}`);
      
      const debugLogsEntry = bkItems.find(item => item.id === "debug-logs");
      if (debugLogsEntry) {
        console.log("\n=================== BURGER KING SCRAPER LOGS ===================");
        console.log(debugLogsEntry.description);
        console.log("=================================================================\n");
      } else {
        console.log("No debug-logs item found for Burger King!");
      }
      
      const cleanItems = bkItems.filter(item => item.id !== "debug-logs" && item.id !== "debug-screenshot");
      console.log(`Clean items count: ${cleanItems.length}`);
      if (cleanItems.length > 0) {
        console.log("Sample clean items:", cleanItems.slice(0, 3));
      }
    } else {
      console.log("No glovo menus data in response!");
    }
  } catch (err) {
    console.error("Failed to run sync:", err);
  }
})();
