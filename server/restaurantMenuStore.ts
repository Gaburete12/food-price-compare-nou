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
    const cleanJson = raw.trim().replace(/^\uFEFF/, "");
    return normalizeRestaurantMenusDataset(JSON.parse(cleanJson));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { ...EMPTY_RESTAURANT_MENUS_DATASET };
    }
    throw error;
  }
}

export async function writeRestaurantMenusDataset(dataset: RestaurantMenusDataset): Promise<void> {
  const DATA_DIR = path.resolve(process.cwd(), "data");
  await fs.mkdir(DATA_DIR, { recursive: true });
  const normalized = normalizeRestaurantMenusDataset(dataset);
  await fs.writeFile(
    RESTAURANT_MENUS_FILE,
    JSON.stringify(normalized, null, 2),
    "utf8"
  );
}
