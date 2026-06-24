const items = [
  { name: "Carlsberg", category: "BEERS" },
  { name: "Ursus", category: "BEERS" },
  { name: "Tuborg", category: "BEERS" },
  { name: "Schweppes Kinley", category: "Beer" },
  { name: "Still Water", category: "Beer" },
  { name: "Sparkling Water", category: "Beer" },
  { name: "BERE TUBORG ALC 5.0% vol", category: "B\uFFFDuturi alcoolice" },
  { name: "BERE URSUS ALC 5 % vol", category: "B\uFFFDuturi alcoolice" }
];

function cleanRestaurantCategory(restaurantId: string, name: string, originalCategory: string): string {
  const n = name.toLowerCase();
  const c = (originalCategory || "").toLowerCase();

  // 1. Pizza & Paste
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

  // 2. Meniuri și Buckets
  if (
    (n.includes("meniu") || n.includes("bucket") || n.includes("box") || n.includes("combo") || n.includes("family") || n.includes("smart") || c.includes("meniu") || c.includes("bucket") || c.includes("cele mai") || c.includes("popular")) &&
    !n.includes("sos") && !n.includes("sauce") && !n.includes("dip") && !n.includes("jucărie") && !n.includes("jucarie") && !n.includes("pahar") && !n.includes("carte") && !n.includes("cărți") && !n.includes("carti")
  ) {
    return "Meniuri și Buckets";
  }

  // 3. Promoții & Noutăți
  if (n.includes("promo") || n.includes("noutat") || n.includes("ediție limitat") || n.includes("limitata") || n.includes("ediție specială") || n.includes("speciala") || n.includes("oferta") || n.includes("ofertă") || n.includes("jucărie") || n.includes("jucarie") || n.includes("carte") || n.includes("cărți") || n.includes("carti") || c.includes("promo") || c.includes("noutat")) {
    return "Promoții și Noutăți";
  }

  // 4. Băuturi
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

  // Fallback absolut în funcție de restaurant:
  const restLower = restaurantId.toLowerCase();
  if (restLower.includes("pizza")) {
    return "Pizza și Paste";
  }

  return "Promoții și Noutăți";
}

console.log("Testing with NEW rules:");
items.forEach(item => {
  const cat = cleanRestaurantCategory("pizzahut-constanta", item.name, item.category);
  console.log(`Name: "${item.name}" | Original: "${item.category}" => Result: "${cat}"`);
});
