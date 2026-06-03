import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Search, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchAnalytics } from "@/hooks/useSearchAnalytics";

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);

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

  if (!analytics || analytics.totalSearches === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>Nu sunt date de analytics încă. Fă niște căutări!</p>
      </div>
    );
  }

  const cheapestPlatform = analytics.avgPriceByPlatform.reduce((min, curr) =>
    curr.avgPrice < min.avgPrice ? curr : min
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Căutări</p>
              <p className="text-3xl font-bold mt-2">{analytics.totalSearches}</p>
            </div>
            <Search className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Platforme Comparat</p>
              <p className="text-3xl font-bold mt-2">{analytics.avgPriceByPlatform.length}</p>
            </div>
            <Trophy className="w-10 h-10 text-yellow-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cea mai ieftină</p>
              <p className="text-3xl font-bold mt-2 capitalize">{cheapestPlatform.platform}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {cheapestPlatform.avgPrice.toFixed(2)} RON (avg)
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Top Queries */}
      {analytics.topQueries.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Căutări
          </h3>
          <div className="space-y-2">
            {analytics.topQueries.slice(0, 5).map((query, idx) => (
              <div
                key={query.query}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground w-8">
                    #{idx + 1}
                  </span>
                  <span className="font-medium">{query.query}</span>
                </div>
                <Badge variant="secondary">{query.count}x</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Platform Performance */}
      {analytics.avgPriceByPlatform.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Preț Mediu pe Platform</h3>
          <div className="space-y-3">
            {analytics.avgPriceByPlatform.map((platform) => (
              <div
                key={platform.platform}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
              >
                <span className="capitalize font-medium">{platform.platform}</span>
                <span className="font-bold text-lg">{platform.avgPrice.toFixed(2)} RON</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Platform Wins */}
      {analytics.platformWins.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Victoria Platformelor (Cea mai ieftină)
          </h3>
          <div className="space-y-2">
            {analytics.platformWins.map((platform) => {
              const percentage = Math.round(
                (platform.winCount / analytics.totalSearches) * 100
              );
              return (
                <div
                  key={platform.platform}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                >
                  <span className="capitalize font-medium">{platform.platform}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${
                          platform.platform === "glovo"
                            ? "bg-yellow-400"
                            : platform.platform === "bolt"
                              ? "bg-green-500"
                              : "bg-blue-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
