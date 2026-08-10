import { runScrapers } from "./scraper/index.ts";
import { writeDeliveryFeeDataset } from "../server/deliveryFeeStore.ts";
import { readRestaurantMenusDataset, writeRestaurantMenusDataset } from "../server/restaurantMenuStore.ts";

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function normalizeProductName(name: string): string {
  return name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s]/g, " ") // replace punctuation with space
    .replace(/\b\d+(\.\d+)?\s*(g|ml|cm|l|kg|bucati|buc)\b/g, "") // remove quantities
    .replace(/\s+/g, " ") // collapse spaces
    .trim();
}

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
           if (!updatedMenus[restId]) {
             updatedMenus[restId] = [];
           }
           
           for (const scrapedItem of menuItems) {
             const normScraped = normalizeProductName(scrapedItem.name);
             let matched = false;
             
             for (const existingItem of updatedMenus[restId]) {
               const normExisting = normalizeProductName(existingItem.name);
               const maxLength = Math.max(normScraped.length, normExisting.length);
               const similarity = maxLength === 0 ? 1 : 1 - (levenshtein(normScraped, normExisting) / maxLength);
               
               if (similarity >= 0.8) {
                 matched = true;
                 const scrapedPrice = scrapedItem.prices[0];
                 if (scrapedPrice) {
                   const existingPriceIdx = existingItem.prices.findIndex((p: any) => p.platform === scrapedPrice.platform);
                   if (existingPriceIdx !== -1) {
                     existingItem.prices[existingPriceIdx] = scrapedPrice;
                   } else {
                     existingItem.prices.push(scrapedPrice);
                   }
                 }
                 if (!existingItem.imageUrl && scrapedItem.imageUrl) {
                   existingItem.imageUrl = scrapedItem.imageUrl;
                 }
                 break;
               }
             }
             
             if (!matched) {
               updatedMenus[restId].push(scrapedItem);
             }
           }
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
