import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { RESTAURANTS } from "../client/src/lib/data";
import { applyDeliveryFeeOverrides } from "../shared/delivery-fees";
import { applyRestaurantMenus } from "../shared/restaurant-menus";
import {
  readDeliveryFeeDataset,
  writeDeliveryFeeDataset,
} from "./deliveryFeeStore";
import { readRestaurantMenusDataset } from "./restaurantMenuStore";
import { runScrapers } from "../scripts/scraper/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const syncToken = process.env.DELIVERY_FEES_SYNC_TOKEN || "demo-token";
  const syncSourceUrl = process.env.DELIVERY_FEES_SOURCE_URL;

  app.use(express.json());

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("/api/restaurants", async (_req, res) => {
    try {
      const deliveryFees = await readDeliveryFeeDataset();
      const menus = await readRestaurantMenusDataset();
      const restaurants = applyRestaurantMenus(
        applyDeliveryFeeOverrides(RESTAURANTS, deliveryFees),
        menus
      );
      res.json({
        restaurants,
        deliveryFeesUpdatedAt: deliveryFees.updatedAt,
        deliveryFeesSource: deliveryFees.source ?? null,
        menusUpdatedAt: menus.updatedAt,
        menusSource: menus.source ?? null,
      });
    } catch (error) {
      console.error("Failed to load restaurants", error);
      res.status(500).json({ error: "Failed to load restaurants" });
    }
  });

  app.get("/api/delivery-fees", async (_req, res) => {
    try {
      const dataset = await readDeliveryFeeDataset();
      res.json(dataset);
    } catch (error) {
      console.error("Failed to load delivery fees", error);
      res.status(500).json({ error: "Failed to load delivery fees" });
    }
  });

  app.post("/api/admin/delivery-fees/sync", async (req, res) => {
    const providedToken = req.header("x-sync-token");

    if (!syncToken || providedToken !== syncToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      console.log("Pornim scraper-ul pentru Bulevardul Tomis, 47...");
      const addressToScrape = req.body.address || "Bulevardul Tomis 47, Constanta";
      const scrapedData = await runScrapers(addressToScrape);

      // Încărcăm datele existente din baza de date pentru a le îmbina (mergui) cu cele noi
      const existingDataset = await readDeliveryFeeDataset();
      const updatedFees = { ...existingDataset.fees };

      const restaurantIds = [
        "kfc-buc-1", 
        "kfc-ct-1", 
        "pizzahut-constanta", 
        "pizza-hut-ct-1", 
        "mcdonalds-constanta", 
        "dabo-doner-constanta",
        "burgerking-constanta",
        "sabroso-constanta"
      ];
      
      for (const restId of restaurantIds) {
        if (!updatedFees[restId]) {
          updatedFees[restId] = {};
        }

        // Glovo: actualizăm doar dacă scraper-ul a returnat date noi valide
        if (scrapedData.fees.glovo?.[restId] && Object.keys(scrapedData.fees.glovo[restId]).length > 0) {
          updatedFees[restId].glovo = {
            ...updatedFees[restId].glovo,
            ...scrapedData.fees.glovo[restId]
          };
        }

        // Bolt: actualizăm doar dacă scraper-ul a returnat date noi valide
        if (scrapedData.fees.bolt?.[restId] && Object.keys(scrapedData.fees.bolt[restId]).length > 0) {
          updatedFees[restId].bolt = {
            ...updatedFees[restId].bolt,
            ...scrapedData.fees.bolt[restId]
          };
        }

        // Wolt: actualizăm doar dacă scraper-ul a returnat date noi valide
        if (scrapedData.fees.wolt?.[restId] && Object.keys(scrapedData.fees.wolt[restId]).length > 0) {
          updatedFees[restId].wolt = {
            ...updatedFees[restId].wolt,
            ...scrapedData.fees.wolt[restId]
          };
        }
      }

      const dataset = {
        updatedAt: new Date().toISOString(),
        source: "playwright-scraper-merged",
        fees: updatedFees
      };

      await writeDeliveryFeeDataset(dataset as any);

      // Save Menus (merging what we already have with the new data)
      const existingMenusDataset = await readRestaurantMenusDataset();
      const updatedMenus = { ...existingMenusDataset.menus };

      // Salvăm toate meniurile returnate de Glovo pentru restaurantele configurate
      if (scrapedData.menus.glovo) {
        for (const [restId, items] of Object.entries(scrapedData.menus.glovo)) {
          if (Array.isArray(items) && items.length > 0) {
            // Filtrăm elementele de debug din meniu înainte de salvare
            const cleanItems = items.filter(
              (item) => item.id !== "debug-logs" && item.id !== "debug-screenshot"
            );
            if (cleanItems.length > 0) {
              updatedMenus[restId] = cleanItems;
              console.log(`[Sync] Saved scraped Glovo menu for ${restId} (${cleanItems.length} products)`);
            }
          }
        }
      }

      // Salvăm toate meniurile returnate de Bolt pentru restaurantele configurate
      if (scrapedData.menus.bolt) {
        for (const [restId, items] of Object.entries(scrapedData.menus.bolt)) {
          if (Array.isArray(items) && items.length > 0) {
            // Dacă există deja meniu de la Glovo, îmbinăm prețurile pe aceleași produse
            if (updatedMenus[restId]) {
              updatedMenus[restId] = updatedMenus[restId].map((existingItem) => {
                const boltItem = items.find((b) => b.id === existingItem.id);
                if (boltItem && boltItem.prices && boltItem.prices.length > 0) {
                  // Adăugăm prețul Bolt la lista de prețuri existentă
                  const existingPrices = existingItem.prices || [];
                  const boltPrice = boltItem.prices.find((p) => p.platform === "bolt");
                  if (boltPrice && !existingPrices.find((p) => p.platform === "bolt")) {
                    return {
                      ...existingItem,
                      prices: [...existingPrices, boltPrice]
                    };
                  }
                }
                return existingItem;
              });
              console.log(`[Sync] Merged Bolt prices for ${restId}`);
            } else {
              // Dacă nu există meniu de la Glovo, salvăm meniul Bolt ca sursă principală
              updatedMenus[restId] = items;
              console.log(`[Sync] Saved scraped Bolt menu for ${restId} (${items.length} products)`);
            }
          }
        }
      }

      // Salvăm toate meniurile returnate de Wolt pentru restaurantele configurate
      if (scrapedData.menus.wolt) {
        for (const [restId, items] of Object.entries(scrapedData.menus.wolt)) {
          if (Array.isArray(items) && items.length > 0) {
            // Dacă există deja meniu, îmbinăm prețurile pe aceleași produse
            if (updatedMenus[restId]) {
              updatedMenus[restId] = updatedMenus[restId].map((existingItem) => {
                const woltItem = items.find((w) => w.id === existingItem.id);
                if (woltItem && woltItem.prices && woltItem.prices.length > 0) {
                  // Adăugăm prețul Wolt la lista de prețuri existentă
                  const existingPrices = existingItem.prices || [];
                  const woltPrice = woltItem.prices.find((p) => p.platform === "wolt");
                  if (woltPrice && !existingPrices.find((p) => p.platform === "wolt")) {
                    return {
                      ...existingItem,
                      prices: [...existingPrices, woltPrice]
                    };
                  }
                }
                return existingItem;
              });
              console.log(`[Sync] Merged Wolt prices for ${restId}`);
            } else {
              // Dacă nu există meniu, salvăm meniul Wolt ca sursă principală
              updatedMenus[restId] = items;
              console.log(`[Sync] Saved scraped Wolt menu for ${restId} (${items.length} products)`);
            }
          }
        }
      }

      const menusDatasetToSave = {
        updatedAt: new Date().toISOString(),
        source: "playwright-scraper-multi-platform",
        menus: updatedMenus
      };

      // Importăm fs aici ca un mic hack pentru a scrie manual, deși ideal foloseam writeRestaurantMenusDataset
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      await fs.writeFile(
        path.resolve(process.cwd(), "data", "restaurant-menus.json"),
        JSON.stringify(menusDatasetToSave, null, 2),
        "utf8"
      );

      res.json({
        ok: true,
        updatedAt: dataset.updatedAt,
        source: dataset.source ?? null,
        restaurantCount: RESTAURANTS.length,
        scrapedData
      });
    } catch (error) {
      console.error("Delivery fee sync failed", error);
      res.status(500).json({ error: "Delivery fee sync failed" });
    }
  });

  app.post("/api/admin/delivery-fees/update", async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object" || !payload.fees) {
        res.status(400).json({ error: "Invalid payload" });
        return;
      }
      
      const dataset = {
        updatedAt: new Date().toISOString(),
        source: "admin-dashboard-manual",
        fees: payload.fees
      };
      
      await writeDeliveryFeeDataset(dataset as any);
      
      res.json({ 
        ok: true, 
        updatedAt: dataset.updatedAt,
        source: dataset.source,
        fees: dataset.fees
      });
    } catch (error: any) {
      console.error("Failed to update delivery fees manually", error);
      res.status(500).json({ error: error.message || "Failed to update delivery fees" });
    }
  });

  // Endpoint temporar pentru extragerea meniului Sabroso
  app.post("/api/admin/extract-sabroso-menu", async (req, res) => {
    try {
      console.log("Începem extragerea meniului Sabroso...");
      const { chromium } = await import("playwright");
      const sabrosoUrl = "https://glovoapp.com/ro/ro/constanta/stores/sabrosso";

      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 720 },
        geolocation: { longitude: 28.6348, latitude: 44.1792 },
        permissions: ['geolocation']
      });

      const page = await context.newPage();
      await page.goto(sabrosoUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Acceptăm cookies
      try {
        const cookieButton = page.locator('button').filter({ hasText: /accept/i }).first();
        if (await cookieButton.isVisible({ timeout: 2000 })) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        console.log("Nu am găsit banner cookies");
      }

      // Scroll pentru a încărca produsele
      await page.evaluate(async () => {
        for(let i = 0; i < 15; i++) {
           window.scrollBy(0, 800);
           await new Promise(r => setTimeout(r, 600));
        }
      });

      const menuItems = await page.evaluate(() => {
        const items: any[] = [];
        const productElements = Array.from(document.querySelectorAll('[data-test-id="MenuItem"], [class*="MenuItem"], [class*="ProductItem"], .product-card, .item-card'));

        productElements.forEach(card => {
          const nameEl = card.querySelector('[data-test-id="MenuItemName"], h3, h4, [class*="name"], [class*="title"]');
          let name = nameEl ? nameEl.textContent?.trim() || "" : "";

          const priceEl = card.querySelector('[data-test-id="MenuItemPrice"], [class*="price"], .price');
          const priceText = priceEl ? priceEl.textContent?.trim() || "" : "";
          const priceMatch = priceText.match(/([\d,]+)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;

          const descEl = card.querySelector('[data-test-id="MenuItemDescription"], [class*="description"], p');
          const description = descEl ? descEl.textContent?.trim() || "" : "";

          const imgEl = card.querySelector('img');
          const imageUrl = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || "") : "";

          let category = "Meniu";
          let parent = card.parentElement;
          let depth = 0;
          while(parent && depth < 8) {
            const heading = parent.querySelector('h2, h3, [class*="category"], [class*="Category"]');
            if (heading && heading.textContent) {
              category = heading.textContent.trim();
              break;
            }
            parent = parent.parentElement;
            depth++;
          }

          if (name && price > 0 && name.length < 100) {
            const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            items.push({
              id,
              name,
              description,
              category,
              imageUrl,
              prices: [{
                platform: "glovo",
                available: true,
                price: price,
                deepLink: sabrosoUrl
              }]
            });
          }
        });

        const uniqueItems: any[] = [];
        const seenIds = new Set();
        for (const item of items) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            uniqueItems.push(item);
          }
        }

        return uniqueItems;
      });

      await browser.close();

      // Adăugăm meniul în baza de date
      const existingMenusDataset = await readRestaurantMenusDataset();
      const updatedMenus = { ...existingMenusDataset.menus };
      updatedMenus["sabroso-constanta"] = menuItems;

      const menusDatasetToSave = {
        updatedAt: new Date().toISOString(),
        source: "manual-sabroso-extraction",
        menus: updatedMenus
      };

      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      await fs.writeFile(
        path.resolve(process.cwd(), "data", "restaurant-menus.json"),
        JSON.stringify(menusDatasetToSave, null, 2),
        "utf8"
      );

      console.log(`Meniu Sabroso extras și salvat: ${menuItems.length} produse`);
      res.json({
        success: true,
        itemCount: menuItems.length,
        categories: [...new Set(menuItems.map((i: any) => i.category))],
        sampleItems: menuItems.slice(0, 3)
      });

    } catch (e) {
      console.error("Error extracting Sabroso menu:", e);
      res.status(500).json({ error: "Failed to extract Sabroso menu", details: (e as any).message });
    }
  });

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

// Force deploy trigger: 2026-05-20 20:17:50
