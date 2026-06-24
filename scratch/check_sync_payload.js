async function testSync() {
  console.log("Triggering sync via API using fetch...");
  try {
    const res = await fetch("https://food-price-compare-nou-production.up.railway.app/api/admin/delivery-fees/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-token": "demo-token"
      },
      body: JSON.stringify({
        address: "Bulevardul Tomis 47, Constanta"
      })
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("OK:", data.ok);
    console.log("UpdatedAt:", data.updatedAt);
    
    if (data.scrapedData) {
      const fees = data.scrapedData.fees;
      const menus = data.scrapedData.menus;
      
      console.log("Fees platforms:", Object.keys(fees));
      for (const plat of Object.keys(fees)) {
        console.log(`  - Platform ${plat} has restaurants:`, Object.keys(fees[plat]));
      }
      
      console.log("Menus platforms:", Object.keys(menus));
      for (const plat of Object.keys(menus)) {
        console.log(`  - Platform ${plat} has restaurants:`, Object.keys(menus[plat]));
        if (menus[plat]["cin-cin-constanta"]) {
          console.log(`    * cin-cin-constanta menu length:`, menus[plat]["cin-cin-constanta"].length);
        }
      }
    } else {
      console.log("No scrapedData returned in response.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testSync();
