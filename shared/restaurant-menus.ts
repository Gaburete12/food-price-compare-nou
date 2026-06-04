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

  // 1. Pizza & Paste (Evaluated at the very top to ensure all pizzas, regardless of being in popular, promos, or having ingredients like rucola/fresh, are correctly categorized)
  if (
    n.includes("pizza") ||
    n.includes("paste") ||
    n.includes("spaghetti") ||
    n.includes("lasagna") ||
    n.includes("penne") ||
    c.includes("pizza") ||
    c.includes("paste")
  ) {
    return "Pizza și Paste";
  }

  // 2. Meniuri și Buckets (High priority!)
  if (
    (n.includes("meniu") || n.includes("bucket") || n.includes("box") || n.includes("combo") || n.includes("family") || n.includes("smart") || c.includes("meniu") || c.includes("bucket") || c.includes("cele mai") || c.includes("popular")) &&
    !n.includes("sos") && !n.includes("sauce") && !n.includes("dip") && !n.includes("jucărie") && !n.includes("jucarie") && !n.includes("pahar") && !n.includes("carte") && !n.includes("cărți") && !n.includes("carti")
  ) {
    return "Meniuri și Buckets";
  }

  // 3. Promoții & Noutăți (Including toys, books, cards, special promos)
  if (n.includes("promo") || n.includes("noutat") || n.includes("ediție limitat") || n.includes("limitata") || n.includes("ediție specială") || n.includes("speciala") || n.includes("oferta") || n.includes("ofertă") || n.includes("jucărie") || n.includes("jucarie") || n.includes("carte") || n.includes("cărți") || n.includes("carti") || c.includes("promo") || c.includes("noutat")) {
    return "Promoții și Noutăți";
  }

  // 4. Băuturi (Avoid matching "rucola" as "cola", and support beers, water, brand sodas, and corrupted characters like 'buturi')
  if (
    (n.includes("cola") && !n.includes("rucola")) ||
    n.includes("sprite") ||
    n.includes("fanta") ||
    n.includes("lipton") ||
    n.includes("fuzetea") ||
    n.includes("suc") ||
    n.includes("băutură") ||
    n.includes("bautura") ||
    n.includes("nectar") ||
    n.includes("shake") ||
    n.includes("apa") ||
    n.includes("apă") ||
    n.includes("water") ||
    n.includes("schweppes") ||
    n.includes("kinley") ||
    n.includes("bere") ||
    n.includes("beer") ||
    n.includes("carlsberg") ||
    n.includes("ursus") ||
    n.includes("tuborg") ||
    n.includes("heineken") ||
    n.includes("somersby") ||
    n.includes("limonada") ||
    n.includes("limonadă") ||
    n.includes("fresh") ||
    c.includes("băutur") ||
    c.includes("bautur") ||
    c.includes("bauturi") ||
    c.includes("băuturi") ||
    c.includes("butur") ||
    c.includes("beer") ||
    c.includes("bere") ||
    c.includes("suc")
  ) {
    return "Băuturi";
  }

  // 5. Cafea & McCafé & Croissante
  if (n.includes("café") || n.includes("cafe") || n.includes("espresso") || n.includes("cappuccino") || n.includes("latte") || n.includes("macchiato") || n.includes("ceai") || n.includes("croissant") || n.includes("gogoașă") || n.includes("gogosa") || n.includes("muffin") || n.includes("briosa") || n.includes("brioșă") || n.includes("flat white") || n.includes("americano") || n.includes("frappe") || c.includes("cafe") || c.includes("mccaf") || c.includes("croiss") || c.includes("muffin")) {
    return "McCafé și Croissante";
  }

  // 6. Cartofi, Sosuri & Garnituri
  if (n.includes("cartofi") || n.includes("fries") || n.includes("sos") || n.includes("sauce") || n.includes("sour") || n.includes("garlic") || n.includes("ketchup") || n.includes("sweet") || n.includes("barbeque") || n.includes("bbq") || n.includes("muștar") || n.includes("mustar") || n.includes("cheddar") || n.includes("dip") || n.includes("maioneza") || n.includes("maioneză") || n.includes("usturoi") || c.includes("cartofi") || c.includes("sos") || c.includes("garnitur") || c.includes("dressing")) {
    return "Cartofi și sosuri";
  }

  // 7. Deserturi (Including pineapple, apple slices, fruits)
  if (n.includes("plăcintă") || n.includes("placinta") || n.includes("înghețată") || n.includes("inghetata") || n.includes("cookie") || n.includes("mcflurry") || n.includes("sundae") || n.includes("donut") || n.includes("clătit") || n.includes("clatit") || n.includes("desert") || n.includes("tiramisu") || n.includes("cheesecake") || n.includes("cake") || n.includes("prajitura") || n.includes("prăjitură") || n.includes("profiterol") || n.includes("ananas") || n.includes("mere") || n.includes("măr") || n.includes("fruct") || c.includes("desert") || c.includes("dulce")) {
    return "Deserturi";
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
  if (restLower.includes("burger") || restLower.includes("king")) {
    return "Burgeri și Pui";
  }
  if (restLower.includes("sabroso")) {
    return "Burgeri și Pui";
  }

  return "Promoții și Noutăți";
}

export const MCDONALDS_IMAGE_MAP: Record<string, string> = {
  "6 CHICKEN MCNUGGETS BUCATI DE PUI, 1 SOS 107G": "/mcdonalds/6-chicken-mcnuggets-bucati-de-pui-1-sos-107g.png",
  "9 CHICKEN MCNUGGETS BUCATI DE PUI, 2 SOSURI 161G": "/mcdonalds/9-chicken-mcnuggets-bucati-de-pui-2-sosuri-161g.png",
  "APA MINERALA CARBOGAZOASA 500ML - Plus Garantie Sticla": "/mcdonalds/apa-minerala-carbogazoasa-500ml---plus-garantie-sticla.png",
  "APA MINERALA PLATA 500ML - Plus Garantie Sticla": "/mcdonalds/apa-minerala-plata-500ml---plus-garantie-sticla.png",
  "ARIPIOARE DE PUI 3 BUC PRODUS PICANT 100G": "/mcdonalds/aripioare-de-pui-3-buc-produs-picant-100g.png",
  "ARIPIOARE DE PUI 5 BUC PRODUS PICANT 180G": "/mcdonalds/aripioare-de-pui-5-buc-produs-picant-180g.png",
  "ARIPIOARE DE PUI 9 BUC PRODUS PICANT 300G": "/mcdonalds/aripioare-de-pui-9-buc-produs-picant-300g.png",
  "ARIPIOARE PICANTE 7 BUCATI 235G": "/mcdonalds/aripioare-picante-7-bucati-235g.png",
  "BANANA BREAD PRAJITURA CU BANANE SI ALUNE 65G": "/mcdonalds/banana-bread-prajitura-cu-banane-si-alune-65g.png",
  "BIG MAC BURGER VITA, CASTRAVETI MURATI, SOS 204G": "/mcdonalds/big-mac-burger-vita-castraveti-murati-sos-204g.png",
  "BIG TASTY BURGER VITA, BRANZA, LEGUME, SOS 321G": "/mcdonalds/big-tasty-burger-vita-branza-legume-sos-321g.png",
  "BLUEBERRY CHEESECAKE TARTA CU AFINE, BRANZA 120G": "/mcdonalds/blueberry-cheesecake-tarta-cu-afine-branza-120g.png",
  "Brioșă cu aromă de caramel și nuci,120 g": "/mcdonalds/briosa-cu-aroma-de-caramel-si-nuci120-g.png",
  "Brioșă cu bucăți de ciocolată albă și neagră,120 g": "/mcdonalds/briosa-cu-bucati-de-ciocolata-alba-si-neagra120-g.png",
  "CAFEA AMERICANO REGULAR 180ML": "/mcdonalds/cafea-americano-regular-180ml.png",
  "Cafea rece cu lapte": "/mcdonalds/cafea-rece-cu-lapte.png",
  "CAFFÉ FRAPPÉ TALL 300ML": "/mcdonalds/caff-frapp-tall-300ml.png",
  "CAFFÉ LATTE REGULAR 200ML": "/mcdonalds/caff-latte-regular-200ml.png",
  "CAPPUCCINO REGULAR 200ML": "/mcdonalds/cappuccino-regular-200ml.png",
  "Caramel Caffé Frappé Tall": "/mcdonalds/caramel-caff-frapp-tall.png",
  "CARAMEL MACCHIATO TALL 300ML": "/mcdonalds/caramel-macchiato-tall-300ml.png",
  "CARROT CAKE: PRAJITURA CU MORCOVI 153G": "/mcdonalds/carrot-cake-prajitura-cu-morcovi-153g.png",
  "CARTOFI CRISS CUT 135G": "/mcdonalds/cartofi-criss-cut-135g.png",
  "CARTOFI PRAJITI PORTIE MARE 150G": "/mcdonalds/cartofi-prajiti-portie-mare-150g.png",
  "CARTOFI PRAJITI PORTIE MEDIE 114G": "/mcdonalds/cartofi-prajiti-portie-medie-114g.png",
  "CARTOFI PRAJITI PORTIE MICA 80G": "/mcdonalds/cartofi-prajiti-portie-mica-80g.png",
  "CHEESEBURGER 113G": "/mcdonalds/cheeseburger-113g.png",
  "CHEESY JALAPENO BACON QUARTER POUNDER 180G": "/mcdonalds/cheesy-jalapeno-bacon-quarter-pounder-180g.png",
  "CHILI CHEESE PUI 120G": "/mcdonalds/chili-cheese-pui-120g.png",
  "CHILI CHEESE VITA 110G": "/mcdonalds/chili-cheese-vita-110g.png",
  "CHOCOLATE FUDGE : PRAJITURA DE CIOCOLATA 81G": "/mcdonalds/chocolate-fudge-prajitura-de-ciocolata-81g.png",
  "COCA-COLA": "/mcdonalds/coca-cola.png",
  "Coca-Cola Zero 250 ML": "/mcdonalds/coca-cola-zero-250-ml.png",
  "COCOA & CHERRY CAKE: PRAJITURA CU CACAO, CIRESE 153G": "/mcdonalds/cocoa-cherry-cake-prajitura-cu-cacao-cirese-153g.png",
  "COCOA FRAPPÉ TALL 300ML": "/mcdonalds/cocoa-frapp-tall-300ml.png",
  "CROISSANT CU CREMA DE CACAO SI ALUNE DE PADURE 75G": "/mcdonalds/croissant-cu-crema-de-cacao-si-alune-de-padure-75g.png",
  "CROISSANT CU UMPLUTURA DE FISTIC 76G": "/mcdonalds/croissant-cu-umplutura-de-fistic-76g.png",
  "DECAF CAFÉ LATTE REGULAR 270ML": "/mcdonalds/decaf-caf-latte-regular-270ml.png",
  "DECAF CAFEA AMERICANO REGULAR 180ML": "/mcdonalds/decaf-cafea-americano-regular-180ml.png",
  "DECAF CAPPUCCINO REGULAR 200ML": "/mcdonalds/decaf-cappuccino-regular-200ml.png",
  "DECAF CARAMEL MACCHIATO TALL 320ML": "/mcdonalds/decaf-caramel-macchiato-tall-320ml.png",
  "DECAF ESPRESSO MACCHIATO 30ML": "/mcdonalds/decaf-espresso-macchiato-30ml.png",
  "DECAF ESPRESSO REGULAR 30ML": "/mcdonalds/decaf-espresso-regular-30ml.png",
  "DECAF FLAT WHITE REGULAR 200ML": "/mcdonalds/decaf-flat-white-regular-200ml.png",
  "DECAF LATTE MACCHIATO TALL 320ML": "/mcdonalds/decaf-latte-macchiato-tall-320ml.png",
  "DECAF VANILLA LATTE TALL 300ML": "/mcdonalds/decaf-vanilla-latte-tall-300ml.png",
  "DUBLU CHEESEBURGER 165G": "/mcdonalds/dublu-cheeseburger-165g.png",
  "ENERGY - CEAI DE FRUCTE CU AROMA DE CIRESE 300ML": "/mcdonalds/energy---ceai-de-fructe-cu-aroma-de-cirese-300ml.png",
  "ENGLISH BREAKFAST - CEAI NEGRU 300ML": "/mcdonalds/english-breakfast---ceai-negru-300ml.png",
  "ESPRESSO MACCHIATO 30ML": "/mcdonalds/espresso-macchiato-30ml.png",
  "ESPRESSO REGULAR 30ML": "/mcdonalds/espresso-regular-30ml.png",
  "Fanta": "/mcdonalds/fanta.png",
  "FELIE DE ANANAS 60G": "/mcdonalds/felie-de-ananas-60g.png",
  "FELII DE MAR 80G": "/mcdonalds/felii-de-mar-80g.png",
  "FILET O FISH  SENDVIS CU PESTE, BRANZA, SOS 136G": "/mcdonalds/filet-o-fish-sendvis-cu-peste-branza-sos-136g.png",
  "FLAT WHITE REGULAR 200ML": "/mcdonalds/flat-white-regular-200ml.png",
  "FRAPPE AROMA MIGDALE 300ML": "/mcdonalds/frappe-aroma-migdale-300ml.png",
  "FRESH DELUXE BURGER DE VITA CU LEGUME 239G": "/mcdonalds/fresh-deluxe-burger-de-vita-cu-legume-239g.png",
  "FRESH GRAPEFRUIT 300ML": "/mcdonalds/fresh-grapefruit-300ml.png",
  "FRESH PORTOCALE 300ML": "/mcdonalds/fresh-portocale-300ml.png",
  "GOGOASA CU GLAZURA DIN CREMA DE VANILIE 71G": "/mcdonalds/gogoasa-cu-glazura-din-crema-de-vanilie-71g.png",
  "GRANDE HOME MENU": "/mcdonalds/grande-home-menu.png",
  "HAMBURGER 100G": "/mcdonalds/hamburger-100g.png",
  "Happy Meal™ Cheeseburger": "/mcdonalds/happy-meal-cheeseburger.png",
  "Happy Meal™ Hamburger": "/mcdonalds/happy-meal-hamburger.png",
  "Happy Meal™ McNuggets 4": "/mcdonalds/happy-meal-mcnuggets-4.png",
  "Happy Meal™ McPuisor": "/mcdonalds/happy-meal-mcpuisor.png",
  "Happy Meal™ McToast": "/mcdonalds/happy-meal-mctoast.png",
  "HERBS & HONEY - CEAI DE PLANTE CU AROMA DE MIERE 300ML": "/mcdonalds/herbs-honey---ceai-de-plante-cu-aroma-de-miere-300ml.png",
  "HOME MENU": "/mcdonalds/home-menu.png",
  "HOT HOT DEVIL SOS PICANT 25ML": "/mcdonalds/hot-hot-devil-sos-picant-25ml.png",
  "ICED LATTE AROMA MIGDALE 300ML": "/mcdonalds/iced-latte-aroma-migdale-300ml.png",
  "JASMINE - CEAI VERDE CU FLORI DE IASOMIE 300ML": "/mcdonalds/jasmine---ceai-verde-cu-flori-de-iasomie-300ml.png",
  "KETCHUP 10ML": "/mcdonalds/ketchup-10ml.png",
  "LATTE AROMA MIGDALE 300ML": "/mcdonalds/latte-aroma-migdale-300ml.png",
  "LATTE MACCHIATO TALL 300ML": "/mcdonalds/latte-macchiato-tall-300ml.png",
  "LIMONADA 400ML": "/mcdonalds/limonada-400ml.png",
  "Lipton": "/mcdonalds/lipton.png",
  "MAIONEZA 20ML": "/mcdonalds/maioneza-20ml.png",
  "MCCHICKEN BURGER CARNE PUI, SALATA, SOS 181G": "/mcdonalds/mcchicken-burger-carne-pui-salata-sos-181g.png",
  "MCCRISPY FRESH 210G PUI, SOS, ROSIE, SALATA": "/mcdonalds/mccrispy-fresh-210g-pui-sos-rosie-salata.png",
  "MCCRISPY SENDVIS PUI, CHEDDAR, MURATURI, SOS MCBACON 185GR": "/mcdonalds/mccrispy-fresh-210g-pui-sos-rosie-salata.png",
  "MCPOPS MIX 66GR": "/mcdonalds/mcpops-mix-66gr.png",
  "MCPOPS: GOGOASA AROMA DE CAISE 22G": "/mcdonalds/mcpops-gogoasa-aroma-de-caise-22g.png",
  "MCPOPS: GOGOASA AROMA DE CIOCOLATA SI ALBA 22G": "/mcdonalds/mcpops-gogoasa-aroma-de-ciocolata-si-alba-22g.png",
  "MCPOPS: GOGOASA AROMA DE CIOCOLATA SI ALUNE 22G": "/mcdonalds/mcpops-gogoasa-aroma-de-ciocolata-si-alune-22g.png",
  "MCPUISOR BURGER CARNE PUI, CASTRAVETI MURATI 109G": "/mcdonalds/mcpuisor-burger-carne-pui-castraveti-murati-109g.png",
  "MCTOAST  SENDVIS CU BRANZA SI SUNCA 94G": "/mcdonalds/mctoast-sendvis-cu-branza-si-sunca-94g.png",
  "MENIU ARIPIOARE DE PUI 5 BUCATI MARE": "/mcdonalds/meniu-aripioare-de-pui-5-bucati-mare.png",
  "MENIU ARIPIOARE DE PUI 9 BUCATI MARE": "/mcdonalds/meniu-aripioare-de-pui-9-bucati-mare.png",
  "MENIU CHEESY JALAPENO BACON QUARTER POUNDER MARE": "/mcdonalds/meniu-cheesy-jalapeno-bacon-quarter-pounder-mare.png",
  "MENIU FRESH DELUXE MARE": "/mcdonalds/meniu-fresh-deluxe-mare.png",
  "MENIU MARE CHICKEN MCNUGGETS 9 BUCATI": "/mcdonalds/meniu-maxi-chicken-mcnuggets-6-buc.png",
  "Meniu Maxi Aripioare de pui (7 buc.)": "/mcdonalds/meniu-maxi-aripioare-de-pui-7-buc.png",
  "Meniu Maxi Big Mac™": "/mcdonalds/meniu-maxi-big-mac.png",
  "Meniu Maxi Big Tasty™": "/mcdonalds/meniu-maxi-big-tasty.png",
  "Meniu Maxi Chicken McNuggets™ (6 buc.)": "/mcdonalds/meniu-maxi-chicken-mcnuggets-6-buc.png",
  "Meniu Maxi Dublu Cheeseburger": "/mcdonalds/meniu-maxi-dublu-cheeseburger.png",
  "Meniu Maxi Filet-O-Fish™": "/mcdonalds/meniu-maxi-filet-o-fish.png",
  "Meniu Maxi McChicken™": "/mcdonalds/meniu-maxi-mcchicken.png",
  "MENIU MCCRISPY FRESH MARE": "/mcdonalds/meniu-mccrispy-fresh-mare.png",
  "MENIU MCCRISPY MARE": "/mcdonalds/meniu-mccrispy-mare.png",
  "MENIU QUARTER POUNDER WITH CHEESE MARE": "/mcdonalds/meniu-quarter-pounder-with-cheese-mare.png",
  "MOCHA FRAPPÉ TALL 300ML": "/mcdonalds/mocha-frapp-tall-300ml.png",
  "MOZZA SNACKS 72G": "/mcdonalds/mozza-snacks-72g.png",
  "ORIENTAL APPLE - CEAI DE FRUCTE CU AROMA DE MERE 300ML": "/mcdonalds/oriental-apple---ceai-de-fructe-cu-aroma-de-mere-300ml.png",
  "PEPPERMINT - CEAI DE PLANTE CU AROMA DE MERE 300ML": "/mcdonalds/peppermint---ceai-de-plante-cu-aroma-de-mere-300ml.png",
  "PLACINTA CU CAPSUNE SI CREMA CU IAURT  70G": "/mcdonalds/placinta-cu-capsune-si-crema-cu-iaurt-70g.png",
  "PLACINTA CU VISINE 70G": "/mcdonalds/placinta-cu-visine-70g.png",
  "PROFITEROL ALB 90G": "/mcdonalds/profiterol-alb-90g.png",
  "QUARTER POUNDER WITH CHEESE BURGER VITA  200G": "/mcdonalds/quarter-pounder-with-cheese-burger-vita-200g.png",
  "SALATA COLESLAW CU MIX LEGUME, SOS CREMOS CU LAMAIE 200G": "/mcdonalds/salata-coleslaw-cu-mix-legume-sos-cremos-cu-lamaie-200g.png",
  "SALATZIKOS CU PUI: SALATA CU PUI CROCANT 250G+1SOS": "/mcdonalds/salatzikos-cu-pui-salata-cu-pui-crocant-250g1sos.png",
  "SHAKE CU AROMA CAPSUNE 250 ML": "/mcdonalds/shake-cu-aroma-capsune-250-ml.png",
  "SHAKE CU AROMA CIOCOLATA 250 ML": "/mcdonalds/shake-cu-aroma-ciocolata-250-ml.png",
  "SHAKE CU AROMA VANILIE 250 ML": "/mcdonalds/shake-cu-aroma-vanilie-250-ml.png",
  "SOS BARBEQUE 25ML": "/mcdonalds/sos-barbeque-25ml.png",
  "SOS DULCE ACRISOR 25ML": "/mcdonalds/sos-dulce-acrisor-25ml.png",
  "SOS IAURT 50 ML": "/mcdonalds/sos-iaurt-50-ml.png",
  "SOS SMANTANA": "/mcdonalds/sos-smantana.png",
  "SOS USTUROI 25ML": "/mcdonalds/sos-usturoi-25ml.png",
  "SOS VINAIGRETTE CU ULEI SI OTET 50 ML": "/mcdonalds/sos-vinaigrette-cu-ulei-si-otet-50-ml.png",
  "Sprite": "/mcdonalds/sprite.png",
  "STRAWBERRY CAKE: PRAJITURA CU CAPSUNE 146G": "/mcdonalds/strawberry-cake-prajitura-cu-capsune-146g.png",
  "SUC DE MERE 250ML": "/mcdonalds/suc-de-mere-250ml.png",
  "Suc de portocale": "/mcdonalds/suc-de-portocale.png",
  "TRILE CHOCO CHOOKIE: FURSEC CACAO 71G": "/mcdonalds/trile-choco-chookie-fursec-cacao-71g.png",
  "VANILLA LATTE TALL 300ML": "/mcdonalds/vanilla-latte-tall-300ml.png",
};

function getMcDonaldsImage(name: string, originalImage: string): string {
  // 1. Direct lookup in our new high-quality local image map
  if (MCDONALDS_IMAGE_MAP[name]) {
    return MCDONALDS_IMAGE_MAP[name];
  }

  // 2. If the original image is a local path (starts with /), return it directly!
  if (originalImage && originalImage.startsWith("/")) {
    return originalImage;
  }

  // 3. Fallback to scrape image if valid
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

  // Sosuri / Dressing
  if (n.includes("sos") || n.includes("dressing") || n.includes("ketchup") || n.includes("maionez") || n.includes("muștar") || n.includes("mustar")) {
    return "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=400&q=80"; // Sauce bowl
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

  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80"; // General food // General food
}

function shouldExcludeMenuItem(name: string): boolean {
  const n = name.replace(/\u200E/g, "").trim().toLowerCase();
  
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
    "cafea",
    "comanda ta"
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
    if (!menu || menu.length === 0) {
      // Dacă nu există meniu în baza de date sau e gol, folosim meniul static și îi normalizăm categoriile
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
