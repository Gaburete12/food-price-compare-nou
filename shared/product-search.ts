/**
 * Product Search Engine
 * Searches through menu items across all restaurants and platforms
 * Provides fuzzy matching and calculates total price with fees
 */

import type { MenuItem, Restaurant } from "../client/src/lib/data";
import type { DeliveryFeeDataset } from "./delivery-fees";

export interface ProductSearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  restaurant: Restaurant;
  imageUrl: string;
  prices: {
    platform: string;
    available: boolean;
    basePrice: number;
    deepLink: string;
    deliveryFee: number;
    serviceFee: number;
    smallOrderFee?: number;
    totalEstimated: number;
  }[];
  cheapestOption: {
    platform: string;
    totalEstimated: number;
  };
}

// Simple fuzzy search implementation
function fuzzyMatch(needle: string, haystack: string): number {
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();

  if (h === n) return 100;
  if (h.includes(n)) return 90;

  let score = 0;
  let haystackIndex = 0;

  for (const char of n) {
    haystackIndex = h.indexOf(char, haystackIndex);
    if (haystackIndex === -1) return 0;
    score += 1;
    haystackIndex++;
  }

  return Math.min(50, score * 10);
}

function calculateSearchScore(query: string, product: MenuItem): number {
  const nameScore = fuzzyMatch(query, product.name) * 2;
  const descriptionScore = fuzzyMatch(query, product.description);
  const categoryScore = fuzzyMatch(query, product.category) * 1.5;

  return nameScore + descriptionScore + categoryScore;
}

export function searchProducts(
  query: string,
  restaurants: Restaurant[],
  menuItems: Record<string, MenuItem[]>,
  deliveryFees: DeliveryFeeDataset,
  minScore: number = 30
): ProductSearchResult[] {
  if (!query.trim()) return [];

  const results: ProductSearchResult[] = [];
  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));

  // Search through all menu items
  for (const [restaurantId, items] of Object.entries(menuItems)) {
    const restaurant = restaurantMap.get(restaurantId);
    if (!restaurant) continue;

    for (const item of items) {
      const score = calculateSearchScore(query, item);

      if (score >= minScore) {
        const prices = item.prices.map((p) => {
          const platformFees =
            deliveryFees.fees[restaurantId]?.[p.platform] || {};

          const deliveryFee = platformFees.deliveryFee ?? 0;
          const serviceFee = platformFees.serviceFee ?? 0;
          const smallOrderFee = platformFees.smallOrderFee ?? 0;

          const totalEstimated =
            p.price + deliveryFee + serviceFee + smallOrderFee;

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

        results.push({
          id: `${restaurantId}-${item.id}`,
          name: item.name,
          description: item.description,
          category: item.category,
          restaurant,
          imageUrl: item.imageUrl,
          prices,
          cheapestOption: {
            platform: cheapestOption.platform,
            totalEstimated: cheapestOption.totalEstimated,
          },
        });
      }
    }
  }

  // Sort by score descending
  return results.sort((a, b) => {
    const scoreA = calculateSearchScore(query, {
      id: a.id,
      name: a.name,
      description: a.description,
      category: a.category,
      imageUrl: a.imageUrl,
      prices: a.prices.map((p) => ({
        platform: p.platform,
        available: p.available,
        price: p.basePrice,
        deepLink: p.deepLink,
      })),
    } as MenuItem);

    const scoreB = calculateSearchScore(query, {
      id: b.id,
      name: b.name,
      description: b.description,
      category: b.category,
      imageUrl: b.imageUrl,
      prices: b.prices.map((p) => ({
        platform: p.platform,
        available: p.available,
        price: p.basePrice,
        deepLink: p.deepLink,
      })),
    } as MenuItem);

    return scoreB - scoreA;
  });
}
