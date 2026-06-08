import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, Share2, Sparkles, AlertCircle, Check, ShoppingBag, ExternalLink } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { type Restaurant, PLATFORM_INFO, type Platform } from "@/lib/data";
import { toast } from "sonner";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}

export function CartDrawer({ isOpen, onClose, restaurant }: CartDrawerProps) {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotals } = useCart();

  const totals = useMemo(() => {
    return getCartTotals(restaurant);
  }, [cartItems, restaurant, getCartTotals]);

  // Find the cheapest and most expensive available platforms to calculate savings
  const sortedAvailableTotals = useMemo(() => {
    return [...totals]
      .filter((t) => t.available && t.total < Infinity)
      .sort((a, b) => a.total - b.total);
  }, [totals]);

  const cheapest = sortedAvailableTotals[0] || null;
  const mostExpensive = sortedAvailableTotals[sortedAvailableTotals.length - 1] || null;

  const savings = useMemo(() => {
    if (cheapest && mostExpensive && cheapest.platform !== mostExpensive.platform) {
      return mostExpensive.total - cheapest.total;
    }
    return 0;
  }, [cheapest, mostExpensive]);

  const handleShare = () => {
    if (cartItems.length === 0) return;

    let text = `🛒 *Comanda mea la ${restaurant.name} via FoodRadar*:\n`;
    cartItems.forEach((item) => {
      text += `• ${item.quantity}x ${item.menuItem.name}\n`;
    });

    text += `\n*Comparație totală (Mâncare + Taxe Livrare/Servicii)*:\n`;

    totals.forEach((t) => {
      const info = PLATFORM_INFO[t.platform];
      if (t.available) {
        const isBest = cheapest && cheapest.platform === t.platform;
        text += `${isBest ? "🏆 " : "• "}${info.name}: ${t.total.toFixed(2)} RON${isBest ? " (Cel mai ieftin!)" : ""}\n`;
      } else {
        text += `• ${info.name}: Indisponibil (lipsesc produse)\n`;
      }
    });

    if (savings > 0 && cheapest) {
      text += `\n💡 Economie: *${savings.toFixed(2)} RON* comandând de pe ${PLATFORM_INFO[cheapest.platform].name}!`;
    }

    text += `\n\nCompară și tu pe FoodRadar! 🍔💸`;

    navigator.clipboard.writeText(text);
    toast.success("Rezumatul coșului a fost copiat în clipboard!", {
      description: "Îl poți trimite acum pe WhatsApp sau Messenger.",
    });
  };

  const getPlatformClass = (platform: Platform, isBest: boolean) => {
    if (!isBest) return "border-border/60 bg-card hover:border-border";
    switch (platform) {
      case "glovo": return "border-[#FFC244] bg-amber-500/5 glow-glovo";
      case "bolt": return "border-[#34D186] bg-emerald-500/5 glow-bolt";
      case "wolt": return "border-[#009DE0] bg-sky-500/5 glow-wolt";
      default: return "border-ring";
    }
  };

  const getPlatformBtnClass = (platform: Platform) => {
    switch (platform) {
      case "glovo": return "bg-[#FFC244] hover:bg-[#e5a822] text-black";
      case "bolt": return "bg-[#34D186] hover:bg-[#2bb874] text-white";
      case "wolt": return "bg-[#009DE0] hover:bg-[#0089c4] text-white";
      default: return "bg-primary text-white";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-lg h-full glass-panel flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold font-['Outfit'] text-xl text-foreground flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-ring" /> Coșul tău
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{restaurant.name}</p>
              </div>
              <div className="flex items-center gap-3">
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs font-bold text-muted-foreground hover:text-red-500 transition-colors py-1.5 px-3 rounded-lg hover:bg-red-500/10"
                  >
                    Golește
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-16 h-16 bg-secondary/80 rounded-2xl flex items-center justify-center mb-4 border border-border">
                    <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h4 className="font-bold text-lg text-foreground mb-1">Coșul este gol</h4>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                    Adaugă preparate delicioase din meniul restaurantului pentru a compara taxele în timp real.
                  </p>
                </div>
              ) : (
                <>
                  {/* Cart Items List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">Produse selectate</h4>
                    {cartItems.map((item) => {
                      const minPrice = item.menuItem.prices && item.menuItem.prices.length > 0
                        ? Math.min(...item.menuItem.prices.filter(p => p.available && p.price > 0).map(p => p.price))
                        : 0;

                      return (
                        <motion.div
                          key={item.menuItem.id}
                          layout
                          className="flex items-center gap-4 bg-card border border-border/60 p-3.5 rounded-2xl"
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border/80">
                            <img
                              src={item.menuItem.imageUrl}
                              alt={item.menuItem.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{item.menuItem.name}</p>
                            <p className="text-xs text-ring font-extrabold mt-0.5">{minPrice.toFixed(2)} RON / buc</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-secondary/80 rounded-lg p-1 border border-border/40">
                              <button
                                onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                                className="w-6 h-6 rounded flex items-center justify-center hover:bg-background transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5 text-foreground" />
                              </button>
                              <span className="w-6 text-center text-xs font-black text-foreground">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                className="w-6 h-6 rounded flex items-center justify-center hover:bg-background transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5 text-foreground" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => removeFromCart(item.menuItem.id)}
                              className="w-8 h-8 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-500 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Savings / Recommendation Box */}
                  {cheapest && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 p-4 rounded-3xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-20">
                        <Sparkles className="w-12 h-12 text-emerald-500" />
                      </div>
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-500">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Aplicație recomandată</p>
                          <h5 className="font-black font-['Outfit'] text-base text-foreground mt-0.5">
                            Comandă prin {PLATFORM_INFO[cheapest.platform].name}
                          </h5>
                          {savings > 0 ? (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              Economisești <span className="font-extrabold text-emerald-500">{savings.toFixed(2)} RON</span> față de cea mai scumpă platformă de livrare pentru aceste produse!
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">
                              Toate platformele au tarife identice pentru această selecție.
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Platform Cost Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Comparație prețuri totale</h4>
                      <button
                        onClick={handleShare}
                        className="text-xs font-bold text-ring hover:text-orange-500 transition-colors flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Partajează coș
                      </button>
                    </div>

                    <div className="space-y-3">
                      {totals.map((t) => {
                        const info = PLATFORM_INFO[t.platform];
                        const isBest = cheapest && cheapest.platform === t.platform && t.available;
                        const platformData = restaurant.platforms.find((p) => p.platform === t.platform);

                        return (
                          <div
                            key={t.platform}
                            className={`border rounded-2.5xl p-4.5 transition-all duration-300 ${getPlatformClass(t.platform, !!isBest)}`}
                          >
                            <div className="flex items-center justify-between mb-3.5">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: info.color }}
                                />
                                <span className="font-black text-sm text-foreground">{info.name}</span>
                                {isBest && (
                                  <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                                    Cel mai bun preț
                                  </span>
                                )}
                              </div>
                              {t.available ? (
                                <span className="font-black font-['Outfit'] text-lg text-foreground">
                                  {t.total.toFixed(2)} RON
                                </span>
                              ) : (
                                <span className="text-xs font-extrabold text-red-500 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> Indisponibil
                                </span>
                              )}
                            </div>

                            {t.available && platformData && (
                              <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-2.5 mt-2">
                                <div className="flex justify-between">
                                  <span>Subtotal produse ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} buc)</span>
                                  <span className="font-medium text-foreground/80">{t.subtotal.toFixed(2)} RON</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Taxă livrare</span>
                                  <span className="font-medium text-foreground/80">{t.deliveryFee.toFixed(2)} RON</span>
                                </div>
                                {t.serviceFee > 0 && (
                                  <div className="flex justify-between">
                                    <span>Taxă serviciu</span>
                                    <span className="font-medium text-foreground/80">{t.serviceFee.toFixed(2)} RON</span>
                                  </div>
                                )}
                                {t.smallOrderFee > 0 && (
                                  <div className="flex justify-between text-amber-500">
                                    <span>Supliment comandă mică</span>
                                    <span className="font-bold">{t.smallOrderFee.toFixed(2)} RON</span>
                                  </div>
                                )}
                                {t.missingItemsCount > 0 && (
                                  <div className="flex justify-between text-red-500/80 font-semibold bg-red-500/5 px-2.5 py-1 rounded-lg mt-1">
                                    <span>{t.missingItemsCount} produse lipsesc</span>
                                    <span>netrecute în total</span>
                                  </div>
                                )}
                                
                                <div className="pt-2 mt-1">
                                  <a
                                    href={platformData.deepLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-200 active:scale-[0.98] ${getPlatformBtnClass(t.platform)}`}
                                  >
                                    Comandă pe {info.name} <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            )}

                            {!t.available && t.missingItemsCount > 0 && (
                              <p className="text-xs text-muted-foreground leading-relaxed mt-2 bg-secondary/50 p-2.5 rounded-xl border border-border/40">
                                Această platformă nu are disponibile produsele selectate din coș în meniul său.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
