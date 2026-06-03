import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ExternalLink, Filter, Heart, ArrowUpDown, Clock } from "lucide-react";
import type { ProductSearchResult } from "../shared/product-search";

interface ProductSearchProps {
  results?: ProductSearchResult[];
  isLoading?: boolean;
  onSearch: (query: string) => void;
}

interface SelectedProduct extends ProductSearchResult {
  selectedPlatforms: string[];
}

export function ProductSearch({ results, isLoading, onSearch }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [platforms, setPlatforms] = useState({
    glovo: true,
    bolt: true,
    wolt: true,
  });
  const [sortBy, setSortBy] = useState<"relevance" | "price-asc" | "price-desc">("relevance");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  // Load favorites and recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
    
    const recent = localStorage.getItem("recentSearches");
    if (recent) setRecentSearches(JSON.parse(recent));
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = useCallback(
    (productId: string) => {
      setFavorites((prev) => {
        const updated = prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
        localStorage.setItem("favorites", JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value);

      // Add to recent searches
      if (value.trim()) {
        setRecentSearches((prev) => {
          const updated = [value, ...prev.filter((s) => s !== value)].slice(0, 5);
          localStorage.setItem("recentSearches", JSON.stringify(updated));
          return updated;
        });
      }
    },
    [onSearch]
  );

  const filteredResults = useMemo(() => {
    let results_arr = results || [];
    
    // Filter by selected platforms
    const platformFiltered = results_arr.filter((result) =>
      result.prices.some((p) => platforms[p.platform as keyof typeof platforms] && p.available)
    );

    // Sort
    let sorted = [...platformFiltered];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => a.cheapestOption.totalEstimated - b.cheapestOption.totalEstimated);
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => b.cheapestOption.totalEstimated - a.cheapestOption.totalEstimated);
    }

    return sorted.slice(0, 10);
  }, [results, platforms, sortBy]);

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Caută produse... (ex: burger, pizza, nuggets)"
          value={query}
          onChange={handleSearch}
          className="pl-10 h-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Platform Filters */}
      {query && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm font-medium text-muted-foreground">Platforme:</span>
            {(["glovo", "bolt", "wolt"] as const).map((platform) => (
              <button
                key={platform}
                onClick={() =>
                  setPlatforms((prev) => ({
                    ...prev,
                    [platform]: !prev[platform],
                  }))
                }
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  platforms[platform]
                    ? platform === "glovo"
                      ? "bg-yellow-400 text-black"
                      : platform === "bolt"
                        ? "bg-green-500 text-white"
                        : "bg-blue-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 opacity-50"
                }`}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort Button */}
          <div className="ml-auto flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
            >
              <option value="relevance">📊 Relevanță</option>
              <option value="price-asc">📈 Preț crescător</option>
              <option value="price-desc">📉 Preț descrescător</option>
            </select>
          </div>
        </div>
      )}

      {/* Recent Searches Dropdown */}
      {!query && recentSearches.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowRecent(!showRecent)}
            className="w-full flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-left"
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Recent:</span>
            <div className="flex gap-1 flex-wrap">
              {recentSearches.slice(0, 3).map((search) => (
                <Badge key={search} variant="secondary" className="text-xs">
                  {search}
                </Badge>
              ))}
            </div>
          </button>
          {showRecent && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => {
                    setQuery(search);
                    onSearch(search);
                    setShowRecent(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm transition-colors border-b last:border-b-0 border-slate-200 dark:border-slate-700"
                >
                  <Clock className="w-3 h-3 inline mr-2 text-muted-foreground" />
                  {search}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results List */}
      {query && filteredResults.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2 bg-slate-50 dark:bg-slate-900">
          {filteredResults.map((result) => (
            <button
              key={result.id}
              onClick={() => {
                setSelectedProduct({
                  ...result,
                  selectedPlatforms: result.prices
                    .filter((p) => p.available)
                    .map((p) => p.platform),
                });
                setShowComparison(true);
              }}
              className="w-full text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="flex gap-3 items-start">
                <img
                  src={result.imageUrl}
                  alt={result.name}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/64";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm line-clamp-2">{result.name}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(result.id);
                      }}
                      className="flex-shrink-0 transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.includes(result.id)
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground hover:text-red-500"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                    {result.restaurant.name}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {result.prices
                      .filter((p) => p.available)
                      .map((p) => (
                        <Badge
                          key={p.platform}
                          variant={
                            p.platform === result.cheapestOption.platform
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {p.platform}: {p.totalEstimated.toFixed(2)} RON
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {query && filteredResults.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nu s-au găsit produse pentru „{query}"</p>
        </div>
      )}

      {/* Comparison Modal */}
      {selectedProduct && (
        <ProductComparisonModal
          product={selectedProduct}
          isOpen={showComparison}
          onClose={() => {
            setShowComparison(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

interface ProductComparisonModalProps {
  product: SelectedProduct;
  isOpen: boolean;
  onClose: () => void;
}

function ProductComparisonModal({
  product,
  isOpen,
  onClose,
}: ProductComparisonModalProps) {
  if (!isOpen) return null;

  const availablePrices = product.prices.filter((p) => p.available);
  const cheapestIdx = availablePrices.findIndex(
    (p) => p.platform === product.cheapestOption.platform
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex gap-4 pb-4 border-b">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-24 h-24 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/96";
              }}
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold">{product.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {product.restaurant.name}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {product.description}
              </p>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-center uppercase tracking-wide">
            Comparație Prețuri
          </h3>

          {/* Price Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availablePrices.map((price, idx) => (
              <div
                key={price.platform}
                className={`p-4 rounded-lg border-2 ${
                  idx === cheapestIdx
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                {/* Platform Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                      price.platform === "glovo"
                        ? "bg-yellow-400"
                        : price.platform === "bolt"
                          ? "bg-green-500"
                          : "bg-blue-500"
                    }`}
                  >
                    {price.platform.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{price.platform}</p>
                    <p className="text-xs text-muted-foreground">
                      {/* Estimated delivery time would go here */}
                    </p>
                  </div>
                  {idx === cheapestIdx && (
                    <Badge className="ml-auto bg-yellow-400 text-black">
                      CEL MAI IEFTIN
                    </Badge>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preț produs</span>
                    <span className="font-medium">{price.basePrice.toFixed(2)} RON</span>
                  </div>

                  {price.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxă livrare</span>
                      <span className="font-medium">{price.deliveryFee.toFixed(2)} RON</span>
                    </div>
                  )}

                  {price.serviceFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxă serviciu</span>
                      <span className="font-medium">{price.serviceFee.toFixed(2)} RON</span>
                    </div>
                  )}

                  {price.smallOrderFee && price.smallOrderFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        ⚠️ Comandă mică
                      </span>
                      <span className="font-medium text-xs">
                        {price.smallOrderFee.toFixed(2)} RON
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                    <span>Total estimat</span>
                    <span>{price.totalEstimated.toFixed(2)} RON</span>
                  </div>
                </div>

                {/* Order Button */}
                <Button
                  asChild
                  className="w-full mt-3 capitalize"
                  variant={
                    idx === cheapestIdx
                      ? "default"
                      : price.platform === "bolt"
                        ? "secondary"
                        : "outline"
                  }
                >
                  <a
                    href={price.deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    Comandă pe {price.platform}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center border-t pt-3">
            * Prețurile sunt estimate pentru locația curentă. Taxa de livrare finală poate
            varia. Verifică varianta finală pe aplicația respectivă.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
