import React from "react";
import { motion } from "framer-motion";
import { Star, TrendingDown, ChevronRight } from "lucide-react";
import { type Restaurant, getCheapestPlatform, PLATFORM_INFO } from "@/lib/data";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  index: number;
}

export function RestaurantCard({ restaurant, onClick, index }: RestaurantCardProps) {
  const cheapest = getCheapestPlatform(restaurant.platforms);
  const availableCount = restaurant.platforms.filter((p) => p.available).length;
  const cheapestData = cheapest ? restaurant.platforms.find((p) => p.platform === cheapest) : null;
  const minTotal = cheapestData && cheapestData.available ? (cheapestData.deliveryFee + cheapestData.serviceFee) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-ring/30 transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      <div className="flex items-center gap-4 p-5">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
          <img 
            src={restaurant.imageUrl} 
            alt={restaurant.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-extrabold font-['Outfit'] text-foreground text-lg leading-tight tracking-tight">
                {restaurant.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {restaurant.category} · {restaurant.city}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-lg border border-border flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="text-xs font-bold text-foreground">{restaurant.rating}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1.5">
              {restaurant.platforms.map((p) => p.available ? (
                <div 
                  key={p.platform} 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm" 
                  style={{ backgroundColor: PLATFORM_INFO[p.platform].color }} 
                  title={PLATFORM_INFO[p.platform].name}
                >
                  {PLATFORM_INFO[p.platform].name[0]}
                </div>
              ) : null)}
              <span className="text-xs text-muted-foreground ml-1.5 font-medium flex items-center">
                {availableCount} surse
              </span>
            </div>
            {minTotal && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  de la {minTotal.toFixed(2)} lei
                </span>
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-ring group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
      </div>
    </motion.div>
  );
}
