import { useEffect, useCallback, useState } from "react";

export interface SearchAnalytics {
  totalSearches: number;
  topQueries: { query: string; count: number }[];
  platformWins: { platform: string; winCount: number }[];
  avgPriceByPlatform: { platform: string; avgPrice: number }[];
}

/**
 * Hook para colectar analytics despre căutări și prețuri
 * Ajută la înțelegerea user behavior și platform performance
 */
export function useSearchAnalytics() {
  const [analytics, setAnalytics] = useState<SearchAnalytics>({
    totalSearches: 0,
    topQueries: [],
    platformWins: [],
    avgPriceByPlatform: [],
  });

  // Load existing analytics
  useEffect(() => {
    const saved = localStorage.getItem("searchAnalytics");
    if (saved) {
      try {
        setAnalytics(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load analytics:", e);
      }
    }
  }, []);

  const trackSearch = useCallback(
    (query: string, results: any[], platformWinner?: string) => {
      setAnalytics((prev) => {
        // Track total searches
        const newTotal = prev.totalSearches + 1;

        // Track top queries
        const topQueries = [...prev.topQueries];
        const existingIdx = topQueries.findIndex((q) => q.query === query);
        if (existingIdx >= 0) {
          topQueries[existingIdx].count++;
        } else {
          topQueries.push({ query, count: 1 });
        }
        topQueries.sort((a, b) => b.count - a.count).slice(0, 10);

        // Track platform wins
        let platformWins = [...prev.platformWins];
        if (platformWinner) {
          const winIdx = platformWins.findIndex((p) => p.platform === platformWinner);
          if (winIdx >= 0) {
            platformWins[winIdx].winCount++;
          } else {
            platformWins.push({ platform: platformWinner, winCount: 1 });
          }
          platformWins.sort((a, b) => b.winCount - a.winCount);
        }

        // Calculate average prices
        const avgPriceByPlatform = new Map<string, { sum: number; count: number }>();
        results.forEach((result) => {
          result.prices?.forEach((price: any) => {
            if (price.available) {
              const key = price.platform;
              const current = avgPriceByPlatform.get(key) || { sum: 0, count: 0 };
              avgPriceByPlatform.set(key, {
                sum: current.sum + price.totalEstimated,
                count: current.count + 1,
              });
            }
          });
        });

        const avgByPlatform = Array.from(avgPriceByPlatform.entries()).map(
          ([platform, data]) => ({
            platform,
            avgPrice: data.sum / data.count,
          })
        );

        const updated = {
          totalSearches: newTotal,
          topQueries,
          platformWins,
          avgPriceByPlatform: avgByPlatform,
        };

        localStorage.setItem("searchAnalytics", JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  return { analytics, trackSearch };
}
