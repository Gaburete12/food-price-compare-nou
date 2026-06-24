import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type MenuItem, type Restaurant, calculateTotalFees } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";
import { PlatformCard } from "./PlatformCard";

interface ComparisonModalProps {
  selectedMenuItem: MenuItem | null;
  selectedRestaurant: Restaurant | null;
  onClose: () => void;
}

export function ComparisonModal({
  selectedMenuItem,
  selectedRestaurant,
  onClose,
}: ComparisonModalProps) {
  const [customPriceStr, setCustomPriceStr] = React.useState<string>("");

  React.useEffect(() => {
    if (selectedMenuItem) {
      const defaultPrice = selectedMenuItem.prices.find((p) => p.available)?.price || 0;
      setCustomPriceStr(defaultPrice.toString());
    }
  }, [selectedMenuItem]);
  return (
    <AnimatePresence>
      {selectedMenuItem && selectedRestaurant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="w-10 h-10 bg-secondary/80 backdrop-blur-md text-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:bg-secondary transition-all"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-xl flex-shrink-0 border border-border">
                  <img
                    src={selectedMenuItem.imageUrl}
                    alt={selectedMenuItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="inline-block text-[10px] font-black text-ring uppercase tracking-[0.25em] mb-2">
                    Comparație Prețuri
                  </span>
                  <h4 className="font-extrabold font-['Outfit'] text-2xl sm:text-3xl text-foreground leading-tight mb-3 tracking-tight">
                    {selectedMenuItem.name}
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-xl leading-relaxed mx-auto sm:mx-0">
                    {selectedMenuItem.description}
                  </p>
                </div>
              </div>

              <div className="mb-6 bg-secondary/30 p-5 rounded-2xl border border-border">
                <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
                  <Calculator className="w-4 h-4 text-ring" /> Simulează valoarea totală a produselor (RON)
                </label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={customPriceStr} 
                  onChange={(e) => setCustomPriceStr(e.target.value)} 
                  className="bg-card font-bold text-lg max-w-xs h-12 border-border/50 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(() => {
                  const simulatedPrice = parseFloat(customPriceStr) || 0;
                  let minTotal = Infinity;
                  let cheapestPlatform: string | null = null;

                  const platformsWithTotals = selectedRestaurant.platforms.map((platformData) => {
                    const productPriceData = selectedMenuItem.prices.find(
                      (p) => p.platform === platformData.platform
                    );
                    const effectiveAvailable =
                      (productPriceData?.available ?? false) && platformData.available;

                    if (effectiveAvailable) {
                      const { totalFee } = calculateTotalFees(platformData, simulatedPrice);
                      const total = simulatedPrice + totalFee;
                      if (total < minTotal) {
                        minTotal = total;
                        cheapestPlatform = platformData.platform;
                      }
                    }
                    return { platformData, effectiveAvailable };
                  });

                  return platformsWithTotals.map(({ platformData, effectiveAvailable }, i) => {
                    const isCheapest = cheapestPlatform === platformData.platform;
                    return (
                      <PlatformCard
                        key={platformData.platform}
                        platform={platformData.platform}
                        data={{ ...platformData, available: effectiveAvailable }}
                        productPrice={simulatedPrice}
                        isCheapest={isCheapest}
                        index={i}
                      />
                    );
                  });
                })()}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-muted-foreground text-center mt-8 pt-4 border-t border-border/50 font-medium"
              >
                * Prețul produsului este preluat în timp real. Taxa de livrare finală poate fi
                estimativă — vă rugăm verificați și pe platforma respectivă.
              </motion.p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
