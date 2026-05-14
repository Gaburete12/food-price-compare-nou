import fs from "node:fs/promises";
import path from "node:path";
import {
  EMPTY_RESTAURANT_MENUS_DATASET,
  normalizeRestaurantMenusDataset,
  type RestaurantMenusDataset,
} from "../shared/restaurant-menus";

const DATA_DIR = path.resolve(process.cwd(), "data");
const RESTAURANT_MENUS_FILE = path.join(DATA_DIR, "restaurant-menus.json");

export async function readRestaurantMenusDataset(): Promise<RestaurantMenusDataset> {
  try {
    const raw = await fs.readFile(RESTAURANT_MENUS_FILE, "utf8");
    return normalizeRestaurantMenusDataset(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { ...EMPTY_RESTAURANT_MENUS_DATASET };
    }
    throw error;
  }
}
