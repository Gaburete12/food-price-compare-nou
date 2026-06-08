import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { type MenuItem } from "@/lib/data";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface MenuSectionProps {
  menu: MenuItem[];
  selectedMenuItem: MenuItem | null;
  onSelectItem: (item: MenuItem | null) => void;
  restaurantId: string;
}

export function MenuSection({ menu, selectedMenuItem, onSelectItem, restaurantId }: MenuSectionProps) {
  const { cartItems, addToCart } = useCart();

  const categoryOrder = [
    "Promoții și Noutăți",
    "Meniuri și Buckets",
    "Cele mai vândute",
    "Burgeri și Pui",
    "Pizza și Paste",
    "Cartofi și sosuri",
    "Deserturi",
    "McCafé și Croissante",
    "Băuturi"
  ];

  const categories = Array.from(new Set(menu.map((i) => i.category))).sort((a, b) => {
    const idxA = categoryOrder.indexOf(a);
    const idxB = categoryOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const [activeCategory, setActiveCategory] = useState(categories[0] || "");

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const element = document.getElementById(`category-${cat}`);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
          Meniul Restaurantului
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sticky Sidebar */}
        <div className="w-full md:w-56 sticky top-24 z-30 md:z-auto">
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[calc(100vh-150px)] pb-2 md:pb-0 scrollbar-none no-scrollbar bg-card/80 backdrop-blur-xl p-2 rounded-2xl border border-border/50 shadow-sm">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 flex-shrink-0 text-left cursor-pointer ${
                  activeCategory === cat
                    ? "bg-ring text-white shadow-lg shadow-ring/20 translate-x-1"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 space-y-12 w-full">
          {categories.map((cat) => (
            <div key={cat} id={`category-${cat}`} className="scroll-mt-32">
              <h3 className="text-xl font-extrabold font-['Outfit'] text-foreground mb-6 flex items-center gap-4">
                {cat}
                <div className="h-px flex-1 bg-border" />
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {menu.filter((item) => item.category === cat).map((item) => {
                  const minPrice = item.prices && item.prices.length > 0
                    ? Math.min(...item.prices.filter(p => p.available && p.price > 0).map(p => p.price))
                    : null;

                  const cartItem = cartItems.find((ci) => ci.menuItem.id === item.id);
                  const quantity = cartItem ? cartItem.quantity : 0;

                  return (
                    <motion.div
                      key={item.id}
                      layoutId={item.id}
                      className={`flex gap-5 p-4 rounded-2xl border transition-all duration-300 group relative ${
                        selectedMenuItem?.id === item.id
                          ? "bg-secondary/50 border-ring shadow-xl shadow-ring/10 ring-1 ring-ring/50"
                          : "bg-card border-border hover:border-ring/40 hover:shadow-lg"
                      }`}
                    >
                      {/* Left image part - Click triggers Compare modal */}
                      <div
                        onClick={() => onSelectItem(item)}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 shadow-md cursor-pointer relative"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                      
                      {/* Right info part */}
                      <div className="flex-1 py-1 flex flex-col justify-between">
                        <div onClick={() => onSelectItem(item)} className="cursor-pointer">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className={`font-bold text-sm leading-tight ${
                              selectedMenuItem?.id === item.id ? "text-ring" : "text-foreground"
                            }`}>
                              {item.name}
                            </p>
                            {selectedMenuItem?.id === item.id && (
                              <Zap className="w-4 h-4 text-ring fill-ring flex-shrink-0 drop-shadow-sm" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div onClick={() => onSelectItem(item)} className="cursor-pointer">
                            {minPrice !== null && (
                              <span className="text-xs font-extrabold text-ring font-['Outfit']">
                                {minPrice.toFixed(2)} RON
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onSelectItem(item)}
                              className="text-[10px] font-bold bg-secondary text-secondary-foreground px-2.5 py-1.5 rounded-md uppercase tracking-wider hover:bg-ring/10 hover:text-ring transition-colors cursor-pointer"
                            >
                              Compară
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(item, restaurantId);
                                toast.success("Adăugat în coș!", {
                                  description: `${item.name} a fost adăugat în coșul tău.`,
                                  duration: 1500,
                                });
                              }}
                              className="text-[10px] font-black bg-ring text-white px-2.5 py-1.5 rounded-md uppercase tracking-wider hover:bg-orange-500 transition-colors shadow-sm cursor-pointer flex items-center gap-1"
                            >
                              + Adaugă
                              {quantity > 0 && (
                                <span className="bg-white text-ring text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                                  {quantity}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
