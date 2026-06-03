import { Router } from "express";
import { searchProducts } from "../shared/product-search";
import { RESTAURANTS } from "../client/src/lib/data";
import { readDeliveryFeeDataset } from "./deliveryFeeStore";
import { readRestaurantMenusDataset } from "./restaurantMenuStore";

export function setupProductRoutes(router: Router) {
  // GET /api/products/search?q=burger
  router.get("/api/products/search", async (req, res) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string" || q.trim().length < 2) {
        return res.status(400).json({
          error: "Query parameter 'q' must be at least 2 characters",
        });
      }

      // Load data
      const deliveryFees = await readDeliveryFeeDataset();
      const menus = await readRestaurantMenusDataset();

      // Search products
      const results = searchProducts(q, RESTAURANTS, menus.menus, deliveryFees);

      res.json({
        query: q,
        count: results.length,
        results: results.slice(0, 20), // Limit to 20 results
      });
    } catch (error) {
      console.error("Failed to search products", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  // GET /api/products/:id - Get full product details
  router.get("/api/products/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      const [restaurantId, itemId] = productId.split("-", 2);

      if (!restaurantId || !itemId) {
        return res.status(400).json({ error: "Invalid product ID format" });
      }

      // Load data
      const deliveryFees = await readDeliveryFeeDataset();
      const menus = await readRestaurantMenusDataset();
      const restaurant = RESTAURANTS.find((r) => r.id === restaurantId);

      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const items = menus.menus[restaurantId];
      if (!items) {
        return res.status(404).json({ error: "Restaurant menu not found" });
      }

      const item = items.find((i) => i.id === itemId);
      if (!item) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Build detailed response
      const prices = item.prices.map((p) => {
        const platformFees = deliveryFees.fees[restaurantId]?.[p.platform] || {};

        const deliveryFee = platformFees.deliveryFee ?? 0;
        const serviceFee = platformFees.serviceFee ?? 0;
        const smallOrderFee = platformFees.smallOrderFee ?? 0;
        const totalEstimated = p.price + deliveryFee + serviceFee + smallOrderFee;

        return {
          platform: p.platform,
          available: p.available,
          basePrice: p.price,
          deepLink: p.deepLink,
          deliveryFee,
          serviceFee,
          smallOrderFee: smallOrderFee > 0 ? smallOrderFee : undefined,
          totalEstimated,
        };
      });

      const cheapestOption = prices.reduce((min, p) =>
        p.totalEstimated < min.totalEstimated ? p : min
      );

      res.json({
        id: productId,
        name: item.name,
        description: item.description,
        category: item.category,
        imageUrl: item.imageUrl,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          image: restaurant.image,
        },
        prices,
        cheapestOption: {
          platform: cheapestOption.platform,
          totalEstimated: cheapestOption.totalEstimated,
        },
        dataUpdatedAt: deliveryFees.updatedAt,
      });
    } catch (error) {
      console.error("Failed to get product details", error);
      res.status(500).json({ error: "Failed to get product details" });
    }
  });
}
