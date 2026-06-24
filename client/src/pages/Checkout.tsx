import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Minus, Plus, ShoppingBasket, Sparkles, TrendingDown, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { type Restaurant, type Platform, PLATFORM_INFO } from "@/lib/data";

function fmt(n: number) {
  return `${n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cartItems, activeRestaurantId, updateQuantity, removeFromCart, getCartTotals } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch restaurant details
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!activeRestaurantId) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/restaurants");
        if (!response.ok) throw new Error("Failed to load");
        const data = await response.json();
        const found = data.restaurants.find((r: Restaurant) => r.id === activeRestaurantId);
        if (isMounted) {
          setRestaurant(found || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [activeRestaurantId]);

  const results = useMemo(() => {
    if (!restaurant) return [];
    const totals = getCartTotals(restaurant);
    // Return only available platforms (which have all products and exist)
    return totals.filter((t) => t.available && t.total < Infinity);
  }, [restaurant, getCartTotals]);

  // Find cheapest and priciest for savings calculation
  const cheapest = useMemo(() => {
    if (results.length === 0) return null;
    return results.reduce((a, b) => (a.total <= b.total ? a : b));
  }, [results]);

  const priciest = useMemo(() => {
    if (results.length === 0) return null;
    return results.reduce((a, b) => (a.total >= b.total ? a : b));
  }, [results]);

  const { savings, savingsPct } = useMemo(() => {
    const s = cheapest && priciest ? +(priciest.total - cheapest.total).toFixed(2) : 0;
    const sPct = priciest && priciest.total > 0 ? (s / priciest.total) * 100 : 0;
    return { savings: s, savingsPct: sPct };
  }, [cheapest, priciest]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Încărcare...</div>
      </div>
    );
  }

  // Get dynamic styles for official brand colors
  const getPlatformStyles = (platform: Platform) => {
    switch (platform) {
      case "glovo": return {
        accent: "from-[#FFC244] to-[#f5b324]",
        ring: "ring-[#FFC244]",
        dot: "bg-[#FFC244]",
      };
      case "bolt": return {
        accent: "from-[#34D186] to-[#2bb874]",
        ring: "ring-[#34D186]",
        dot: "bg-[#34D186]",
      };
      case "wolt": return {
        accent: "from-[#009DE0] to-[#0089c4]",
        ring: "ring-[#009DE0]",
        dot: "bg-[#009DE0]",
      };
      default: return {
        accent: "from-primary to-primary/80",
        ring: "ring-primary",
        dot: "bg-primary",
      };
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-6 py-16">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => setLocation("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi la restaurante
        </Button>
        <header className="mb-12 flex flex-col items-start gap-4">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-secondary">
            <Sparkles className="h-3 w-3" /> Comparator inteligent de coș
          </Badge>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight md:text-6xl">
            Mănâncă mai ieftin de la <span className="text-primary">{restaurant?.name || "restaurant"}</span>.
            <span className="block bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent mt-2">
              Comparăm în timp real.
            </span>
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Construiește-ți coșul o singură dată. Calculăm comisioanele, taxa de livrare și totalul pe toate platformele și îți spunem care câștigă — instant.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          {/* Basket */}
          <Card className="overflow-hidden border-border/60 p-0 shadow-md">
            <div className="flex items-center justify-between border-b border-border/60 bg-card px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                  <ShoppingBasket className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Coșul tău</h2>
                  <p className="text-xs text-muted-foreground">
                    {cartItems.reduce((s, i) => s + i.quantity, 0)} produse
                  </p>
                </div>
              </div>
            </div>

            <ul className="divide-y divide-border/60">
              {cartItems.length === 0 && (
                <li className="px-6 py-12 text-center text-sm text-muted-foreground">
                  Coșul tău este gol. Întoarce-te pe pagina principală și adaugă produse pentru a compara.
                </li>
              )}
              {cartItems.map((i) => {
                // Afisam pretul de baza pentru claritate (media sau primul gasit)
                const defaultPrice = i.menuItem.prices[0]?.price || 0;
                
                return (
                  <li key={i.menuItem.id} className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40">
                    <div className="flex-1">
                      <div className="font-medium">{i.menuItem.name}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        Aprox. {fmt(defaultPrice)} / buc.
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background p-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(i.menuItem.id, i.quantity - 1)}
                        className="h-7 w-7 rounded-full"
                        aria-label={`Decrease ${i.menuItem.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{i.quantity}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(i.menuItem.id, i.quantity + 1)}
                        className="h-7 w-7 rounded-full"
                        aria-label={`Increase ${i.menuItem.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFromCart(i.menuItem.id)}
                      className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove ${i.menuItem.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Comparison */}
          <div className="flex flex-col gap-4">
            {cartItems.length > 0 && cheapest && (
              <Card
                className="overflow-hidden border-0 p-6 text-[oklch(0.15_0.02_260)] shadow-md"
                style={{ background: "linear-gradient(135deg, oklch(0.88 0.14 95), oklch(0.82 0.17 75))" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                      <TrendingDown className="h-3.5 w-3.5" /> Cel mai ieftin acum
                    </div>
                    <div className="mt-2 text-3xl font-bold tracking-tight">{PLATFORM_INFO[cheapest.platform].name}</div>
                    <div className="mt-1 text-sm opacity-80">
                      {savings > 0 && priciest
                        ? `Economisești ${fmt(savings)} (${savingsPct.toFixed(1).replace(".", ",")}%) față de ${PLATFORM_INFO[priciest.platform].name}`
                        : "Ambele platforme sunt la egalitate."}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider opacity-70">Total</div>
                    <div className="text-4xl font-bold tabular-nums">{fmt(cheapest.total)}</div>
                  </div>
                </div>
              </Card>
            )}

            {results.length === 0 && cartItems.length > 0 && (
               <div className="p-4 text-center text-muted-foreground border rounded-lg bg-muted/30">
                 Aceste produse nu sunt disponibile pe nicio platformă de livrare din zona ta.
               </div>
            )}

            {results.map((result) => {
              const { platform, subtotal, deliveryFee, serviceFee, total } = result;
              const isWinner = cheapest && platform === cheapest.platform && savings > 0;
              const styles = getPlatformStyles(platform);
              const info = PLATFORM_INFO[platform];

              return (
                <Card
                  key={platform}
                  className={cn(
                    "relative overflow-hidden p-5 transition-colors",
                    isWinner
                      ? cn("ring-2 shadow-md", styles.ring)
                      : "opacity-95",
                  )}
                >
                  <div
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                      styles.accent,
                    )}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={cn("h-2.5 w-2.5 rounded-full", styles.dot)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{info.name}</h3>
                          {isWinner && (
                            <Badge className="rounded-full bg-foreground text-background hover:bg-foreground">
                              Cea mai bună ofertă
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Prețurile finale includ și taxele oficiale.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold tabular-nums">{fmt(total)}</div>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <Row label="Produse" value={fmt(subtotal)} />
                    <Row
                      label="Taxă livrare"
                      value={deliveryFee === 0 ? "Gratuit" : fmt(deliveryFee)}
                    />
                    <Row label="Comision servicii" value={fmt(serviceFee)} />
                  </dl>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
