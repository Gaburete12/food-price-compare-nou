import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type MenuItem, type Restaurant, getCheapestForProduct } from "@/lib/data";
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {selectedRestaurant.platforms.map((platformData, i) => {
                  const productPriceData = selectedMenuItem.prices.find(
                    (p) => p.platform === platformData.platform
                  );
                  const effectiveAvailable =
                    (productPriceData?.available ?? false) && platformData.available;
                  const isCheapest =
                    getCheapestForProduct(selectedMenuItem, selectedRestaurant) ===
                      platformData.platform && effectiveAvailable;
                  return (
                    <PlatformCard
                      key={platformData.platform}
                      platform={platformData.platform}
                      data={{ ...platformData, available: effectiveAvailable }}
                      productPrice={productPriceData?.price}
                      isCheapest={isCheapest}
                      index={i}
                    />
                  );
                })}
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
