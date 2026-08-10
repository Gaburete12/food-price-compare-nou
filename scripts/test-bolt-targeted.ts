// Script de test izolat pentru Bolt Food - cele 3 restaurante noi
// Rulare: npx tsx scripts/test-bolt-targeted.ts

import { chromium } from "playwright";

const TARGET_RESTAURANTS = [
  {
    id: "shaormeria-baneasa-constanta",
    name: "Shaormeria Băneasa",
    url: "https://food.bolt.eu/ro-ro/462-constanta/p/56615-shaormeria-baneasa-cismelei/",
  },
  {
    id: "new-dimico",
    name: "New Dimico",
    url: "https://food.bolt.eu/ro-ro/462-constanta/p/149785-new-dimico/",
  },
  {
    id: "sarmola-street-food",
    name: "Sarmola Street Food",
    url: "https://food.bolt.eu/ro-ro/462-constanta/p/194320-sarmola-street-food/",
  },
];

async function testBolt() {
  console.log("=== TEST BOLT FOOD - Restaurante Constanța ===\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  const results: Record<string, any> = {};

  for (const rest of TARGET_RESTAURANTS) {
    console.log(`\n--- Testăm: ${rest.name} ---`);
    console.log(`URL: ${rest.url}`);

    const page = await context.newPage();
    try {
      await page.goto(rest.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(3000);

      const title = await page.title();
      console.log(`Titlu pagină: "${title}"`);

      // === TEST 1: Selector primar (data-testid) ===
      const primaryCount = await page.locator('[data-testid="components.DishList.DishRow.view"]').count();
      console.log(`[Selector primar] '[data-testid="components.DishList.DishRow.view"]': ${primaryCount} elemente`);

      // === TEST 2: Verificăm alte data-testid disponibile pe pagină ===
      const allTestIds = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll("[data-testid]"));
        const ids = [...new Set(els.map((e) => e.getAttribute("data-testid")).filter(Boolean))];
        return ids.slice(0, 30); // primele 30
      });
      console.log(`[data-testid disponibile]:`, allTestIds);

      // === TEST 3: Câte elemente cu "lei" / "RON" există? ===
      const priceCount = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("span, div, p")).filter((e) => {
          const t = e.textContent || "";
          return (t.includes("lei") || t.includes("RON")) && t.length < 20;
        }).length;
      });
      console.log(`[Elemente cu preț "lei"/"RON" (< 20 chars)]: ${priceCount}`);

      // === TEST 4: Auto-scroll și re-test ===
      console.log("[Auto-scroll] Rulăm 20 scroll-uri de 600px...");
      const bb = await page.locator("body").boundingBox();
      if (bb) await page.mouse.move(bb.width / 2, bb.height / 2);

      let foundItems = 0;
      for (let i = 0; i < 20; i++) {
        await page.mouse.wheel(0, 600);
        await page.waitForTimeout(300);

        // Re-verificăm selectorii după fiecare scroll
        const cnt = await page.locator('[data-testid="components.DishList.DishRow.view"]').count();
        if (cnt > foundItems) {
          console.log(`  scroll ${i + 1}: ${cnt} produse cu selector primar`);
          foundItems = cnt;
        }
      }

      // === TEST 5: Extragere completă cu selectorii curenți ===
      const items = await page.evaluate(() => {
        const extracted: any[] = [];
        let productElements = Array.from(
          document.querySelectorAll('[data-testid="components.DishList.DishRow.view"]')
        );

        // Fallback: elemente cu preț
        if (productElements.length === 0) {
          productElements = Array.from(document.querySelectorAll("div, li, article")).filter((card) => {
            const txt = card.textContent || "";
            return (txt.includes("lei") || txt.includes("RON")) && txt.length > 5 && txt.length < 800;
          });
        }

        productElements.forEach((card) => {
          // Testăm mai mulți selectori de nume
          const nameEl =
            card.querySelector('[data-testid="components.DishList.DishRow.title"]') ||
            card.querySelector("h3") ||
            card.querySelector("h4") ||
            card.querySelector('[class*="name"]') ||
            card.querySelector('[class*="title"]');
          let name = nameEl?.textContent?.trim() || "";

          // Fallback pentru nume
          if (!name) {
            const texts = Array.from(card.querySelectorAll("span, div, p"))
              .map((e) => e.textContent?.trim() || "")
              .filter((t) => t.length > 2 && !t.match(/^\d/) && !t.includes("lei") && !t.includes("RON"));
            name = texts[0] || "";
          }

          // Testăm mai mulți selectori de preț
          let priceEl =
            card.querySelector('[data-testid="components.Price.originalPrice"]') ||
            card.querySelector('[data-testid="components.Price.discountedPrice"]') ||
            card.querySelector('[class*="price"]') ||
            card.querySelector('[class*="Price"]');

          if (!priceEl) {
            priceEl =
              Array.from(card.querySelectorAll("span, div, p")).find((el) => {
                const t = el.textContent || "";
                return (t.includes("lei") || t.includes("RON")) && t.length < 25;
              }) || null;
          }

          const priceText = priceEl?.textContent?.trim() || "";
          const priceMatch = priceText.match(/([\d,.]+)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : 0;

          if (name && price > 0 && name.length < 100) {
            extracted.push({ name, price, priceText });
          }
        });

        return extracted;
      });

      console.log(`\n[REZULTAT] ${items.length} produse extrase pentru ${rest.name}:`);
      items.slice(0, 8).forEach((item, i) => {
        console.log(`  ${i + 1}. "${item.name}" — ${item.price} lei (raw: "${item.priceText}")`);
      });
      if (items.length > 8) console.log(`  ... și încă ${items.length - 8} produse`);

      // === TEST 6: Taxă de livrare ===
      const feeInfo = await page.evaluate(() => {
        // Strategie 1: data-testid pentru taxă
        const feeEl =
          document.querySelector('[data-testid="delivery-fee"]') ||
          document.querySelector('[data-testid="DeliveryFee"]');
        if (feeEl) return { method: "data-testid", text: feeEl.textContent?.trim() };

        // Strategie 2: text "livrare" / "delivery" în proximitate
        const labelEl = Array.from(document.querySelectorAll("div, span")).find((e) => {
          const t = (e.textContent || "").toLowerCase().trim();
          return t === "livrare" || t === "delivery" || t === "taxă livrare";
        });
        if (labelEl) {
          const parent = labelEl.parentElement;
          return { method: "label-parent", text: parent?.textContent?.trim() };
        }

        // Strategie 3: text care conține "RON" sau "lei" în proximitatea unor cuvinte cheie
        const deliveryText = Array.from(document.querySelectorAll("div, span, p")).find((e) => {
          const t = e.textContent || "";
          return (
            (t.includes("livrare") || t.includes("Livrare") || t.includes("delivery")) &&
            (t.includes("lei") || t.includes("RON")) &&
            t.length < 80
          );
        });
        return { method: "keyword-search", text: deliveryText?.textContent?.trim() };
      });
      console.log(`[Taxa de livrare]: ${JSON.stringify(feeInfo)}`);

      results[rest.id] = {
        title,
        primarySelectorCount: primaryCount,
        finalItemsCount: items.length,
        feeInfo,
        sampleItems: items.slice(0, 3),
      };
    } catch (err) {
      console.error(`Eroare pentru ${rest.name}:`, err);
      results[rest.id] = { error: String(err) };
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log("\n\n=== SUMAR FINAL ===");
  for (const [id, r] of Object.entries(results)) {
    if (r.error) {
      console.log(`❌ ${id}: ERROR - ${r.error}`);
    } else {
      const ok = r.finalItemsCount > 0 ? "✅" : "⚠️";
      console.log(`${ok} ${id}: ${r.finalItemsCount} produse extrase | titlu: "${r.title}"`);
    }
  }
}

testBolt().catch(console.error);
