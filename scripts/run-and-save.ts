import { runScrapers } from "./scraper/index.ts";
import { writeDeliveryFeeDataset } from "../server/deliveryFeeStore.ts";
import { readRestaurantMenusDataset, writeRestaurantMenusDataset } from "../server/restaurantMenuStore.ts";

async function main() {
  console.log("Pornim scraping-ul complet local...");
  const data = await runScrapers("Bulevardul Tomis 47, Constanta");
  
  await writeDeliveryFeeDataset({
    fees: data.fees,
    updatedAt: new Date().toISOString(),
    source: "local-scraper",
  });

  const existingMenus = await readRestaurantMenusDataset();
  const updatedMenus = { ...existingMenus.menus };

  const platforms = ['wolt', 'bolt', 'glovo'];
  for (const plat of platforms) {
     if (data.menus[plat as keyof typeof data.menus]) {
       for (const [restId, items] of Object.entries((data.menus as any)[plat])) {
         const menuItems = items as any[];
         if (menuItems && menuItems.length > 0) {
           updatedMenus[restId] = menuItems;
         }
       }
     }
  }

  await writeRestaurantMenusDataset({
    updatedAt: new Date().toISOString(),
    source: "local-scraper",
    menus: updatedMenus
  });
  
  console.log("Datele au fost salvate cu succes in data/delivery-fees.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
