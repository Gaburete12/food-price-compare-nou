import { readDeliveryFeeDataset } from "../server/deliveryFeeStore";
import { readRestaurantMenusDataset } from "../server/restaurantMenuStore";
import { applyRestaurantMenus } from "../shared/restaurant-menus";
import { RESTAURANTS } from "../client/src/lib/data";

async function main() {
  const deliveryFees = await readDeliveryFeeDataset();
  const menus = await readRestaurantMenusDataset();
  const restaurants = applyRestaurantMenus(RESTAURANTS, menus);
  
  const mcd = restaurants.find(r => r.id === "mcdonalds-constanta");
  if (!mcd || !mcd.menu) {
    console.log("McDonalds menu not found!");
    return;
  }
  
  const categories = Array.from(new Set(mcd.menu.map(i => i.category)));
  console.log("McDonald's categories in API:", categories);
  console.log("Number of items:", mcd.menu.length);
}

main().catch(console.error);
