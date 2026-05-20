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

function cleanRestaurantCategory(restaurantId: string, name: string, originalCategory: string): string {
  const n = name.toLowerCase();
  const c = (originalCategory || "").toLowerCase();

  // 1. Meniuri și Buckets (High priority!)
  if (
    (n.includes("meniu") || n.includes("bucket") || n.includes("box") || n.includes("combo") || n.includes("family") || n.includes("smart") || c.includes("meniu") || c.includes("bucket") || c.includes("cele mai") || c.includes("popular")) &&
    !n.includes("sos") && !n.includes("sauce") && !n.includes("dip") && !n.includes("jucărie") && !n.includes("jucarie") && !n.includes("pahar") && !n.includes("carte") && !n.includes("cărți") && !n.includes("carti")
  ) {
    return "Meniuri și Buckets";
  }

  // 2. Promoții & Noutăți (Including toys, books, cards, special promos)
  if (n.includes("promo") || n.includes("noutat") || n.includes("ediție limitat") || n.includes("limitata") || n.includes("ediție specială") || n.includes("speciala") || n.includes("oferta") || n.includes("ofertă") || n.includes("jucărie") || n.includes("jucarie") || n.includes("carte") || n.includes("cărți") || n.includes("carti") || c.includes("promo") || c.includes("noutat")) {
    return "Promoții și Noutăți";
  }

  // 3. Băuturi
  if (n.includes("cola") || n.includes("sprite") || n.includes("fanta") || n.includes("lipton") || n.includes("fuzetea") || n.includes("suc") || n.includes("băutură") || n.includes("bautura") || n.includes("nectar") || n.includes("shake") || n.includes("apa") || n.includes("apă") || n.includes("limonada") || n.includes("limonadă") || n.includes("fresh") || c.includes("băutur") || c.includes("bautur") || c.includes("bauturi") || c.includes("băuturi") || c.includes("suc")) {
    return "Băuturi";
  }

  // 4. Cafea & McCafé & Croissante
  if (n.includes("café") || n.includes("cafe") || n.includes("espresso") || n.includes("cappuccino") || n.includes("latte") || n.includes("macchiato") || n.includes("ceai") || n.includes("croissant") || n.includes("gogoașă") || n.includes("gogosa") || n.includes("muffin") || n.includes("briosa") || n.includes("brioșă") || n.includes("flat white") || n.includes("americano") || n.includes("frappe") || c.includes("cafe") || c.includes("mccaf") || c.includes("croiss") || c.includes("muffin")) {
    return "McCafé și Croissante";
  }

  // 5. Cartofi, Sosuri & Garnituri
  if (n.includes("cartofi") || n.includes("fries") || n.includes("sos") || n.includes("sauce") || n.includes("sour") || n.includes("garlic") || n.includes("ketchup") || n.includes("sweet") || n.includes("barbeque") || n.includes("bbq") || n.includes("muștar") || n.includes("mustar") || n.includes("cheddar") || n.includes("dip") || n.includes("maioneza") || n.includes("maioneză") || n.includes("usturoi") || c.includes("cartofi") || c.includes("sos") || c.includes("garnitur") || c.includes("dressing")) {
    return "Cartofi și sosuri";
  }

  // 6. Deserturi (Including pineapple, apple slices, fruits)
  if (n.includes("plăcintă") || n.includes("placinta") || n.includes("înghețată") || n.includes("inghetata") || n.includes("cookie") || n.includes("mcflurry") || n.includes("sundae") || n.includes("donut") || n.includes("clătit") || n.includes("clatit") || n.includes("desert") || n.includes("tiramisu") || n.includes("cheesecake") || n.includes("cake") || n.includes("prajitura") || n.includes("prăjitură") || n.includes("profiterol") || n.includes("ananas") || n.includes("mere") || n.includes("măr") || n.includes("fruct") || c.includes("desert") || c.includes("dulce")) {
    return "Deserturi";
  }

  // 7. Pizza & Paste (în special pentru Pizza Hut)
  if (n.includes("pizza") || n.includes("paste") || n.includes("spaghetti") || n.includes("lasagna") || n.includes("penne") || c.includes("pizza") || c.includes("paste")) {
    return "Pizza și Paste";
  }

  // 8. Burgeri, Pui & Sandvișuri
  if (n.includes("burger") || n.includes("mac") || n.includes("chicken") || n.includes("pui") || n.includes("cheeseburger") || n.includes("tasty") || n.includes("dublu") || n.includes("hamburger") || n.includes("crispy") || n.includes("junior") || n.includes("royal") || n.includes("quarter") || n.includes("strips") || n.includes("nuggets") || n.includes("wings") || n.includes("fillet") || n.includes("bites") || n.includes("hot wings") || n.includes("mcpuisor") || n.includes("mctoast") || n.includes("sandviș") || n.includes("sandvis") || n.includes("toast") || n.includes("wrap") || n.includes("baghetă") || n.includes("bagheta") || n.includes("chili cheese") || n.includes("doner") || n.includes("kebab") || n.includes("shawarma") || c.includes("burger") || c.includes("pui") || c.includes("sandviș") || c.includes("mancare") || c.includes("kebab") || c.includes("sandvis")) {
    return "Burgeri și Pui";
  }

  // Fallback absolut în funcție de restaurant:
  const restLower = restaurantId.toLowerCase();
  if (restLower.includes("pizza")) {
    return "Pizza și Paste";
  }
  if (restLower.includes("kfc")) {
    return "Burgeri și Pui";
  }
  if (restLower.includes("dabo")) {
    return "Burgeri și Pui";
  }
  if (restLower.includes("mcdonald")) {
    return "Burgeri și Pui";
  }

  return "Promoții și Noutăți";
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

function shouldExcludeMenuItem(name: string): boolean {
  const n = name.trim().toLowerCase();
  
  const badNames = [
    "cele mai vândute",
    "cele mai vandute",
    "cele mai vãndute",
    "cele mai vndute",
    "cele mai vândute?",
    "promoții",
    "promotii",
    "ediție limitată și noutăți",
    "editie limitata si noutati",
    "burgeri și pui",
    "burgeri si pui",
    "sandvișuri",
    "sandvisuri",
    "cartofi și sosuri",
    "cartofi si sosuri",
    "happy meal",
    "happy meal™",
    "salate",
    "deserturi",
    "deserturi?",
    "mccafé",
    "mccafe",
    "mccafé?",
    "băuturi",
    "bauturi",
    "intrebari frecvente",
    "întrebări frecvente",
    "informații comerciale",
    "informatii comerciale",
    "cafea rece cu lapte",
    "galerie",
    "meniu",
    "meniuri",
    "sos",
    "sosuri",
    "desert",
    "cafea"
  ];

  return badNames.includes(n);
}

export function applyRestaurantMenus(
  restaurants: Restaurant[],
  dataset: RestaurantMenusDataset
): Restaurant[] {
  return restaurants.map((restaurant) => {
    // Încercăm să luăm meniul folosind ID-ul curent din baza de date sau echivalentele lor
    let menuKey = restaurant.id;
    if (restaurant.id === "kfc-constanta") menuKey = "kfc-ct-1";
    if (restaurant.id === "pizzahut-constanta") menuKey = "pizza-hut-ct-1";

    let menu = dataset.menus[menuKey] || dataset.menus[restaurant.id];
    if (!menu) {
      // Dacă nu există meniu în baza de date, folosim meniul static și îi normalizăm categoriile
      menu = restaurant.menu || [];
    }

    // Curățăm și normalizăm categoriile și imaginile pentru o experiență perfectă
    menu = menu
      .filter((item) => !shouldExcludeMenuItem(item.name))
      .map((item) => {
        const cleanedCategory = cleanRestaurantCategory(restaurant.id, item.name, item.category);
        const cleanedImage = getMcDonaldsImage(item.name, item.imageUrl);

        // Replicăm prețurile pe toate platformele active pentru a permite comparația
        const refPriceObj = item.prices.find(p => p.available && p.price > 0) || item.prices[0];
        const replicatedPrices = restaurant.platforms.map((platformData) => {
          const existing = item.prices.find(p => p.platform === platformData.platform);
          if (existing) {
            return existing;
          }
          // Dacă nu există preț pe această platformă, îl creăm folosind prețul de referință de pe Glovo
          return {
            platform: platformData.platform,
            available: platformData.available,
            price: refPriceObj ? refPriceObj.price : 0,
            deepLink: platformData.deepLink
          };
        });

        return {
          ...item,
          category: cleanedCategory,
          imageUrl: cleanedImage,
          prices: replicatedPrices
        };
      });

    return {
      ...restaurant,
      menu,
    };
  });
}
