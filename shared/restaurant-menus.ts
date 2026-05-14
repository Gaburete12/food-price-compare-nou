import type { MenuItem, Restaurant } from "../client/src/lib/data";

export interface RestaurantMenusDataset {
  updatedAt: string;
  source?: string;
  menus: Record<string, MenuItem[]>;
}

export const EMPTY_RESTAURANT_MENUS_DATASET: RestaurantMenusDataset = {
  updatedAt: new Date(0).toISOString(),
  menus: {},
};

function isProductPlatformPrice(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.platform === "string" &&
    typeof candidate.available === "boolean" &&
    typeof candidate.price === "number" &&
    typeof candidate.deepLink === "string"
  );
}

function isMenuItem(value: unknown): value is MenuItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.imageUrl === "string" &&
    Array.isArray(candidate.prices) &&
    candidate.prices.every(isProductPlatformPrice)
  );
}

export function normalizeRestaurantMenusDataset(
  input: unknown
): RestaurantMenusDataset {
  if (!input || typeof input !== "object") {
    return { ...EMPTY_RESTAURANT_MENUS_DATASET };
  }

  const candidate = input as Partial<RestaurantMenusDataset>;
  const menus: Record<string, MenuItem[]> = {};

  if (candidate.menus && typeof candidate.menus === "object") {
    for (const [restaurantId, items] of Object.entries(candidate.menus)) {
      if (!Array.isArray(items)) {
        continue;
      }

      const validItems = items.filter(isMenuItem);
      if (validItems.length > 0) {
        menus[restaurantId] = validItems;
      }
    }
  }

  return {
    updatedAt:
      typeof candidate.updatedAt === "string" && candidate.updatedAt
        ? candidate.updatedAt
        : new Date().toISOString(),
    source:
      typeof candidate.source === "string" && candidate.source.trim()
        ? candidate.source.trim()
        : undefined,
    menus,
  };
}

export function applyRestaurantMenus(
  restaurants: Restaurant[],
  dataset: RestaurantMenusDataset
): Restaurant[] {
  return restaurants.map((restaurant) => {
    const menu = dataset.menus[restaurant.id];
    if (!menu) {
      return restaurant;
    }

    return {
      ...restaurant,
      menu,
    };
  });
}
