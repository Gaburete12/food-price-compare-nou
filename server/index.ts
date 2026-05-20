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

      const restaurantIds = ["kfc-buc-1", "pizzahut-constanta", "mcdonalds-constanta"];
      
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

      // Momentan salvăm doar ce găsim pe glovo pentru McDonalds
      if (scrapedData.menus.glovo?.["mcdonalds-constanta"] && scrapedData.menus.glovo["mcdonalds-constanta"].length > 0) {
        updatedMenus["mcdonalds-constanta"] = scrapedData.menus.glovo["mcdonalds-constanta"];
      }

      const menusDatasetToSave = {
        updatedAt: new Date().toISOString(),
        source: "playwright-scraper-glovo",
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
