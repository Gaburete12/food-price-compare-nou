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

function cleanMcDonaldsCategory(name: string, originalCategory: string): string {
  const n = name.toLowerCase();
  
  if (n.includes("promo") || n.includes("noutat") || n.includes("ediție limitat") || n.includes("limitata") || n.includes("ediție specială")) {
    return "Promoții și Noutăți";
  }
  
  // Cele mai vândute / Meniuri reprezentative
  if (n.includes("meniu maxi big tasty") || n.includes("meniu maxi big mac") || n.includes("meniu 5 crispy") || n.includes("meniu 8 crispy") || n.includes("dublu cheeseburger") || n.includes("mctoast")) {
    return "Cele mai vândute";
  }

  // McCafé
  if (n.includes("café") || n.includes("espresso") || n.includes("cappuccino") || n.includes("latte") || n.includes("macchiato") || n.includes("ceai") || n.includes("croissant") || n.includes("gogoașă") || n.includes("gogosa") || n.includes("muffin")) {
    return "McCafé";
  }

  // Deserturi
  if (n.includes("plăcintă") || n.includes("placinta") || n.includes("înghețată") || n.includes("inghetata") || n.includes("cookie") || n.includes("shake") || n.includes("mcflurry") || n.includes("sundae") || n.includes("donut") || n.includes("clătit") || n.includes("clatit") || n.includes("desert") || n.includes("tiramisu")) {
    return "Deserturi";
  }

  // Cartofi și sosuri
  if (n.includes("cartofi") || n.includes("sos") || n.includes("sour") || n.includes("garlic") || n.includes("ketchup") || n.includes("sweet") || n.includes("barbeque") || n.includes("muștar") || n.includes("mustar")) {
    return "Cartofi și sosuri";
  }

  // Burgeri și pui
  if (n.includes("burger") || n.includes("big mac") || n.includes("mcchicken") || n.includes("cheeseburger") || n.includes("tasty") || n.includes("dublu") || n.includes("hamburger") || n.includes("crispy") || n.includes("chicken") || n.includes("pui") || n.includes("junior") || n.includes("royal") || n.includes("quarter") || n.includes("strips") || n.includes("nuggets") || n.includes("wings")) {
    return "Burgeri și pui";
  }

  // Sandvișuri
  if (n.includes("sandviș") || n.includes("sandvis") || n.includes("toast") || n.includes("wrap") || n.includes("baghetă") || n.includes("bagheta")) {
    return "Sandvișuri";
  }

  // Băuturi
  if (n.includes("cola") || n.includes("sprite") || n.includes("fanta") || n.includes("lipton") || n.includes("fuzetea") || n.includes("suc") || n.includes("băutură") || n.includes("bautura") || n.includes("nectar") || n.includes("shake")) {
    return "Băuturi";
  }

  if (originalCategory && !originalCategory.toLowerCase().includes("meniu maxi") && !originalCategory.toLowerCase().includes("meniu mediu")) {
    return originalCategory;
  }
  
  return "Cele mai vândute";
}

function getMcDonaldsImage(name: string, originalImage: string): string {
  if (originalImage && originalImage.trim() !== "" && !originalImage.includes("placeholder") && originalImage.startsWith("http")) {
    return originalImage;
  }

  const n = name.toLowerCase();

  // Burgeri & Meniuri Big Mac
  if (n.includes("big mac")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80"; // Big Mac look
  }
  if (n.includes("tasty")) {
    return "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&q=80"; // Large Big Tasty look
  }
  if (n.includes("mcchicken") || n.includes("chicken") || n.includes("pui")) {
    if (n.includes("nuggets")) {
      return "https://images.unsplash.com/photo-1562967914-6c822e12a610?w=400&q=80"; // Nuggets
    }
    return "https://images.unsplash.com/photo-1627662236973-4f825912447a?w=400&q=80"; // Chicken Burger
  }
  if (n.includes("cheeseburger")) {
    return "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&q=80"; // Cheeseburger
  }
  if (n.includes("hamburger")) {
    return "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80"; // Hamburger
  }

  // Cartofi
  if (n.includes("cartofi")) {
    return "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80"; // French Fries
  }

  // Deserturi
  if (n.includes("flurry") || n.includes("flur") || n.includes("înghețată") || n.includes("inghetata") || n.includes("shake")) {
    return "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80"; // Milkshake
  }
  if (n.includes("plăcintă") || n.includes("placinta")) {
    return "https://images.unsplash.com/photo-1519869325930-281384150729?w=400&q=80"; // Sweet Pie
  }

  // Cafea / Croissant
  if (n.includes("caf") || n.includes("espresso") || n.includes("latte") || n.includes("cappuccino")) {
    return "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80"; // Latte
  }
  if (n.includes("croissant")) {
    return "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80"; // Croissant
  }

  // Băuturi
  if (n.includes("cola") || n.includes("sprite") || n.includes("fanta") || n.includes("lipton") || n.includes("fuzetea") || n.includes("suc")) {
    return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80"; // Soda
  }
  if (n.includes("apă") || n.includes("apa")) {
    return "https://images.unsplash.com/photo-1608885898957-a599fb15ec35?w=400&q=80"; // Water bottle
  }

  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80"; // General food
}

export function applyRestaurantMenus(
  restaurants: Restaurant[],
  dataset: RestaurantMenusDataset
): Restaurant[] {
  return restaurants.map((restaurant) => {
    let menu = dataset.menus[restaurant.id];
    if (!menu) {
      return restaurant;
    }

    // Curățăm și normalizăm categoriile și imaginile pentru o experiență perfectă
    if (restaurant.id === "mcdonalds-constanta") {
      menu = menu.map((item) => {
        const cleanedCategory = cleanMcDonaldsCategory(item.name, item.category);
        const cleanedImage = getMcDonaldsImage(item.name, item.imageUrl);
        return {
          ...item,
          category: cleanedCategory,
          imageUrl: cleanedImage
        };
      });
    }

    return {
      ...restaurant,
      menu,
    };
  });
}
