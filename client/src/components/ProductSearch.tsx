import React, { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ExternalLink } from "lucide-react";
import type { ProductSearchResult } from "../shared/product-search";

interface ProductSearchProps {
  results: ProductSearchResult[];
  isLoading: boolean;
  onSearch: (query: string) => void;
}

interface SelectedProduct extends ProductSearchResult {
  selectedPlatforms: string[];
}

export function ProductSearch({ results, isLoading, onSearch }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value);
    },
    [onSearch]
  );

  const filteredResults = useMemo(() => results.slice(0, 10), [results]);

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
                  <h4 className="font-semibold text-sm line-clamp-2">{result.name}</h4>
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
