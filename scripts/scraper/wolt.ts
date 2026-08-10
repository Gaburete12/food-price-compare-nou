import { BrowserContext } from "playwright";

export async function scrapeWolt(context: BrowserContext, address: string) {
  const page = await context.newPage();
  const fees: Record<string, any> = {};
  const menus: Record<string, any[]> = {};

  try {
    await page.goto("https://wolt.com/ro/rou/constanta/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const restaurantsToScrape = [
      { id: "pizzahut-constanta", url: "https://wolt.com/en/rou/constanta/restaurant/pizza-hut-constanta-67dc2390b93a5300e8efd498" },
      { id: "kfc-buc-1", url: "https://wolt.com/en/rou/constanta/restaurant/kfc-city-park-67ee912b0231e21086424409" },
      { id: "mcdonalds-constanta", url: "https://wolt.com/en/rou/constanta/restaurant/mcdonalds-tomis-67ed2703c86a467a0cecf401" },
      { id: "dabo-doner-constanta", url: "https://wolt.com/en/rou/constanta/restaurant/dabo-doner-mircea-constana-00a224" },
      { id: "sabroso-constanta", url: "https://wolt.com/ro/rou/constanta/restaurant/sabroso-67dac2825416f96b8fd40493" },
      { id: "cin-cin-constanta", url: "https://wolt.com/ro/rou/constanta/restaurant/cin-cin" },
      { id: "mesopotamia-constanta", url: "https://wolt.com/ro/rou/constanta/restaurant/mesopotamia-city-park-67e179195493f87b1eb0ce12" },
      { id: "tacoseria-constanta", url: "https://wolt.com/ro/rou/constanta/restaurant/tacoseria-67e18559a54a3ee61d3b13ec" },
      { id: "burgerking-constanta", url: "https://wolt.com/en/rou/constanta/restaurant/burger-king-constanta-tom" },
      { id: "splendid-chicken", url: "https://wolt.com/ro/rou/constanta/restaurant/splendid-chicken" },
      { id: "tacos-king", url: "https://wolt.com/ro/rou/constanta/restaurant/tacos-king" },
      // Restaurante noi aug 2026 — URL-uri actualizate
      {
        id: "shaormeria-baneasa-constanta",
        url: "https://wolt.com/ro/rou/constanta/restaurant/shaormeria-bneasa-690c68f51c16f26f8358cef0",
      },
      {
        id: "new-dimico",
        url: "https://wolt.com/ro/rou/constanta/restaurant/new-dimico-6855408dfed8b72a16338cfe",
      },
      // Sarmola Street Food nu mai este pe Wolt (verificat manual aug 2026)
    ];

    for (const rest of restaurantsToScrape) {
      await page.goto(rest.url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2500);

      try {
        // 0. Accept cookies dacă banner-ul e prezent
        try {
          const cookieBtn = page
            .locator(
              'button[data-test-id="cookie-consent-accept"], button[data-test-id="allow-button"], button:has-text("Accept"), button:has-text("Acceptă")'
            )
            .first();
          if (await cookieBtn.count() > 0) {
            await cookieBtn.click();
            await page.waitForTimeout(800);
          }
        } catch (_) {}

        // 1. Verificăm că pagina există (nu 404)
        const noContent = await page.locator('[data-test-id="venue-page-no-content.error"]').count();
        if (noContent > 0) {
          console.warn(`[Wolt] Pagina pentru ${rest.id} returnează eroare (restaurant indisponibil sau URL greșit). Sărim.`);
          continue;
        }

        // 2. Apăsăm pe primul produs pentru a deschide coșul și obține taxele
        const firstProduct = page
          .locator('[data-test-id="horizontal-item-card-button"], [data-test-id="MenuItem"]')
          .first();
        if (await firstProduct.count() > 0) {
          await firstProduct.click();
          await page.waitForTimeout(1000);
          const addToCartBtn = page.locator('button[data-test-id="ProductModalAddButton"]').first();
          if (await addToCartBtn.count() > 0) {
            await addToCartBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        // 3. Extragem taxele din rândurile de sumă din coș
        let extracted = {
          deliveryFee: 10.19,
          serviceFeePercent: 0.07,
          serviceFeeMin: 2.49,
          serviceFeeMax: 7.99,
          serviceFee: 0,
          smallOrderFee: 0,
          smallOrderThreshold: 35,
        };

        const feeRows = await page.locator('[data-test-id="AmountRow"]').all();
        for (const row of feeRows) {
          const text = await row.textContent() || "";
          const match = text.match(/([\d,.]+)\s*RON/i);
          const val = match ? parseFloat(match[1].replace(",", ".")) : 0;
          if (text.toLowerCase().includes("livrare")) {
            extracted.deliveryFee = val;
          } else if (
            text.toLowerCase().includes("operațional") ||
            text.toLowerCase().includes("serviciu")
          ) {
            extracted.serviceFee = val;
          } else if (text.toLowerCase().includes("comandă mică")) {
            extracted.smallOrderFee = val;
          }
        }

        fees[rest.id] = {
          wolt: {
            ...extracted,
            dynamicSmallOrderFee: true,
            deliveryTime: 20,
          },
        };

        // 4. Scroll pentru a încărca produsele lazy-loaded (20 pași × 800px)
        console.log(`[Wolt] Extragere meniu pentru ${rest.id}...`);
        await page.evaluate(async () => {
          for (let i = 0; i < 20; i++) {
            window.scrollBy(0, 800);
            await new Promise((r) => setTimeout(r, 500));
          }
        });
        await page.waitForTimeout(500);

        // 5. Extragere produse cu selectorii actualizați (aug 2026)
        const menuItems = await page.evaluate((url) => {
          const items: any[] = [];

          // Selector primar aug 2026: 'horizontal-item-card'
          // Selectorul vechi 'MenuItem' nu mai există în noul DOM Wolt
          let productElements = Array.from(
            document.querySelectorAll(
              '[data-test-id="horizontal-item-card"], [data-test-id="MenuItem"], [data-test-id="MenuProduct"]'
            )
          );

          // Fallback: articole cu preț vizibil
          if (productElements.length === 0) {
            productElements = Array.from(
              document.querySelectorAll("article, div[role=\"listitem\"]")
            ).filter((card) => {
              const txt = card.textContent || "";
              return (txt.includes("lei") || txt.includes("RON")) && txt.length < 500;
            });
          }

          console.log(`Wolt: Found ${productElements.length} product elements`);

          productElements.forEach((card) => {
            // Selectori activi aug 2026
            const nameEl =
              card.querySelector('[data-test-id="horizontal-item-card-header"]') ||
              card.querySelector('[data-test-id="MenuItemName"]') ||
              card.querySelector("h3, h4") ||
              card.querySelector('[class*="name"], [class*="title"]');
            const name = nameEl?.textContent?.trim() || "";

            const priceEl =
              card.querySelector('[data-test-id="horizontal-item-card-price"]') ||
              card.querySelector('[data-test-id="MenuItemPrice"]') ||
              card.querySelector('[class*="price"]') ||
              Array.from(card.querySelectorAll("span, p, div")).find((el) => {
                const t = el.textContent || "";
                return (t.includes("lei") || t.includes("RON")) && t.length < 25;
              }) ||
              null;

            const priceText = priceEl ? priceEl.textContent?.trim() || "" : "";
            const priceMatch = priceText.match(/([\d,.]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : 0;

            const descEl =
              card.querySelector('[data-test-id="horizontal-item-card-description"]') ||
              card.querySelector('[data-test-id="MenuItemDescription"]') ||
              card.querySelector("p");
            const description = descEl?.textContent?.trim() || "";

            const imgEl = card.querySelector("img");
            const imageUrl = imgEl
              ? imgEl.getAttribute("src") || imgEl.getAttribute("data-src") || ""
              : "";

            let category = "Meniu";
            let parent = card.parentElement;
            let depth = 0;
            while (parent && depth < 8) {
              const heading = parent.querySelector(
                'h2, h3, [class*="category"], [class*="Category"]'
              );
              if (heading && heading.textContent) {
                category = heading.textContent.trim();
                break;
              }
              parent = parent.parentElement;
              depth++;
            }

            if (name && price > 0 && name.length < 100) {
              const id = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
              items.push({
                id,
                name,
                description,
                category,
                imageUrl,
                prices: [
                  { platform: "wolt", available: true, price, deepLink: url },
                ],
              });
            }
          });

          // Deduplicare după id
          const seenIds = new Set<string>();
          return items.filter((item) => {
            if (seenIds.has(item.id)) return false;
            seenIds.add(item.id);
            return true;
          });
        }, rest.url);

        console.log(
          `[Wolt] ${menuItems.length} produse extrase pentru ${rest.id}.`
        );
        menus[rest.id] = menuItems;
      } catch (e) {
        console.error(`Eroare scraping Wolt pentru ${rest.id}:`, e);
      }
    }
  } finally {
    await page.close();
  }

  return { fees, menus };
}
