// Script test izolat Wolt - cele 3 restaurante noi
import { chromium } from "playwright";

const TARGET_RESTAURANTS = [
  {
    id: "shaormeria-baneasa-constanta",
    name: "Shaormeria Băneasă",
    url: "https://wolt.com/ro/rou/constanta/restaurant/shaormeria-bneasa-690c68f51c16f26f8358cef0",
  },
  {
    id: "new-dimico",
    name: "New Dimico",
    url: "https://wolt.com/ro/rou/constanta/restaurant/new-dimico-6855408dfed8b72a16338cfe",
  },
  // Sarmola Street Food nu mai este pe Wolt (verificat manual aug 2026)
];

async function testWolt() {
  console.log("=== TEST WOLT - Restaurante Constanța ===\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  for (const rest of TARGET_RESTAURANTS) {
    console.log(`\n--- Testăm: ${rest.name} ---`);
    console.log(`URL: ${rest.url}`);

    const page = await context.newPage();
    try {
      await page.goto(rest.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(3000);

      const title = await page.title();
      const finalUrl = page.url();
      console.log(`Titlu: "${title}"`);
      console.log(`URL final: ${finalUrl}`);

      // Verificăm dacă pagina este 404 / redirecționat
      if (
        title.toLowerCase().includes("not found") ||
        title.toLowerCase().includes("404") ||
        finalUrl.includes("discovery") ||
        finalUrl !== rest.url
      ) {
        console.log(`⚠️  PAGINA NU EXISTĂ pe Wolt sau a fost redirecționată!`);
        await page.close();
        continue;
      }

      // Accept cookies
      try {
        const cookie = page.locator('button[data-test-id="cookie-consent-accept"]').first();
        if (await cookie.count() > 0) { await cookie.click(); await page.waitForTimeout(500); }
      } catch (_) {}

      // Verificăm data-test-id-uri disponibile
      const testIds = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll("[data-test-id]"));
        return [...new Set(els.map((e) => e.getAttribute("data-test-id")).filter(Boolean))].slice(0, 25);
      });
      console.log(`[data-test-id disponibile]:`, testIds);

      // Numărăm produse cu selectorii cunoscuți
      const menuItemCount = await page.locator('[data-test-id="MenuItem"]').count();
      const horizontalCount = await page.locator('[data-test-id="horizontal-item-card"]').count();
      console.log(`[MenuItem]: ${menuItemCount}, [horizontal-item-card]: ${horizontalCount}`);

      // Scroll pentru lazy-loading
      console.log("[Scroll] Rulăm scroll progresiv...");
      await page.evaluate(async () => {
        for (let i = 0; i < 15; i++) {
          window.scrollBy(0, 700);
          await new Promise((r) => setTimeout(r, 500));
        }
      });
      await page.waitForTimeout(1000);

      const afterScrollCount = await page.locator('[data-test-id="MenuItem"]').count();
      console.log(`[MenuItem după scroll]: ${afterScrollCount}`);

      // Extragere produse
      const items = await page.evaluate((url) => {
        const extracted: any[] = [];
        const productEls = Array.from(
          document.querySelectorAll('[data-test-id="MenuItem"], [data-test-id="horizontal-item-card"]')
        );

        productEls.forEach((card) => {
          const nameEl =
            card.querySelector('[data-test-id="MenuItemName"]') ||
            card.querySelector("h3") ||
            card.querySelector('[class*="name"]');
          const name = nameEl?.textContent?.trim() || "";

          let priceEl =
            card.querySelector('[data-test-id="MenuItemPrice"]') ||
            card.querySelector('[class*="price"]');
          if (!priceEl) {
            priceEl = Array.from(card.querySelectorAll("span, p, div")).find((e) => {
              const t = e.textContent || "";
              return (t.includes("lei") || t.includes("RON")) && t.length < 25;
            }) ?? null;
          }
          const priceText = priceEl?.textContent?.trim() || "";
          const priceMatch = priceText.match(/([\d,.]+)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : 0;

          if (name && price > 0 && name.length < 100) {
            extracted.push({ name, price });
          }
        });
        return extracted;
      }, rest.url);

      console.log(`[Produse extrase]: ${items.length}`);
      items.slice(0, 6).forEach((item, i) => {
        console.log(`  ${i + 1}. "${item.name}" — ${item.price} lei`);
      });
      if (items.length > 6) console.log(`  ... și încă ${items.length - 6}`);

      // Taxa de livrare pe Wolt
      const feeInfo = await page.evaluate(() => {
        // Wolt afișează taxele în cart/order summary
        const feeRows = Array.from(document.querySelectorAll('[data-test-id="AmountRow"]'));
        if (feeRows.length > 0) {
          return feeRows.map((r) => r.textContent?.trim());
        }
        // Alternativ: text în header restaurant
        const headerText = document.querySelector('[data-test-id="venue-delivery-specs"]')?.textContent?.trim();
        return headerText || "nu am găsit taxa";
      });
      console.log(`[Taxa livrare Wolt]:`, feeInfo);
    } catch (err) {
      console.error(`Eroare: ${err}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log("\n=== TEST WOLT COMPLET ===");
}

testWolt().catch(console.error);
