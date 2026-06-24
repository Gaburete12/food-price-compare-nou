import React, { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingDown, ShoppingBag, Zap, ArrowRight, Settings, Heart, SearchX } from "lucide-react";
import { toast } from "sonner";
import {
  RESTAURANTS,
  getCheapestPlatform,
  searchRestaurantsInCollection,
  type Restaurant,
  type MenuItem,
} from "@/lib/data";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { RestaurantSkeleton } from "@/components/restaurant/RestaurantSkeleton";
import { PlatformCard } from "@/components/restaurant/PlatformCard";
import { MenuSection } from "@/components/restaurant/MenuSection";
import { ComparisonModal } from "@/components/restaurant/ComparisonModal";
import { ProductSearch } from "@/components/ProductSearch";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useCart } from "@/contexts/CartContext";

type FilterType = "all" | "cheapest_delivery" | "fastest_time" | "under_5_lei";

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Constanța");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [, setLocation] = useLocation();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  useEffect(() => {
    const saved = localStorage.getItem("foodradar_favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleFavorite = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("foodradar_favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const { cartItems } = useCart();

  // Product search hook
  const { results: productResults, isLoading: isSearchingProducts, search: searchProducts } = useProductSearch();

  const syncFeesLive = async () => {
    if (!selectedRestaurant) return;
    setIsSyncing(true);
    try {
      const response = await fetch("/api/admin/delivery-fees/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-sync-token": "demo-token" },
        body: JSON.stringify({ address: "Bulevardul Tomis 47, Constanta" }),
      });
      if (response.ok) {
        await response.json();
        const resResponse = await fetch("/api/restaurants");
        if (resResponse.ok) {
          const resData = await resResponse.json();
          setRestaurants(resData.restaurants);
          const updated = resData.restaurants.find((r: Restaurant) => r.id === selectedRestaurant.id);
          if (updated) setSelectedRestaurant(updated);
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadRestaurants() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/restaurants");
        if (response.ok) {
          const payload = (await response.json()) as { restaurants?: Restaurant[] };
          if (isMounted && Array.isArray(payload.restaurants)) {
            setRestaurants(payload.restaurants);
          }
        } else {
          if (isMounted) setRestaurants(RESTAURANTS);
        }
      } catch (error) {
        console.warn("Falling back to bundled restaurant data.", error);
        if (isMounted) setRestaurants(RESTAURANTS);
      } finally {
        if (isMounted) {
          setTimeout(() => setIsLoading(false), 500);
        }
      }
    }
    void loadRestaurants();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim() && city === "Toate orașele") return;
    setIsSearching(true);
    setSelectedRestaurant(null);
    setTimeout(() => {
      const found = searchRestaurantsInCollection(query, city, restaurants);
      setResults(found);
      setHasSearched(true);
      setIsSearching(false);
    }, 600);
  }, [query, city, restaurants]);

  const resetState = () => {
    setSelectedRestaurant(null);
    setHasSearched(false);
    setResults([]);
    setQuery("");
    setSelectedMenuItem(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const processRestaurants = useCallback((list: Restaurant[]) => {
    let filtered = [...list];
    
    if (activeFilter === "under_5_lei") {
      filtered = filtered.filter(r => r.platforms.some(p => p.available && p.deliveryFee < 5));
    }
    
    if (activeFilter === "cheapest_delivery") {
      filtered.sort((a, b) => {
        const minA = Math.min(...a.platforms.filter(p => p.available).map(p => p.deliveryFee), Infinity);
        const minB = Math.min(...b.platforms.filter(p => p.available).map(p => p.deliveryFee), Infinity);
        return minA - minB;
      });
    } else if (activeFilter === "fastest_time") {
      filtered.sort((a, b) => {
        const minA = Math.min(...a.platforms.filter(p => p.available).map(p => p.deliveryTime), Infinity);
        const minB = Math.min(...b.platforms.filter(p => p.available).map(p => p.deliveryTime), Infinity);
        return minA - minB;
      });
    }

    return filtered;
  }, [activeFilter]);

  const basePopular = restaurants.filter((r) => r.city === city || city === "Toate orașele");
  const popularRestaurants = processRestaurants(basePopular);
  const processedResults = processRestaurants(results);
  const processedFavorites = processRestaurants(restaurants.filter(r => favorites.includes(r.id)));

  const cheapest = selectedRestaurant ? getCheapestPlatform(selectedRestaurant.platforms) : null;

  const EmptyFilterState = () => (
    <div className="col-span-full bg-card border border-border rounded-3xl p-12 text-center shadow-xl shadow-black/20 my-4">
      <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-border">
        <SearchX className="w-8 h-8 text-zinc-600" />
      </div>
      <h3 className="font-bold text-lg text-foreground mb-2">Nu am găsit niciun restaurant care să se potrivească criteriilor tale.</h3>
      <button
        onClick={() => {
          setActiveFilter("all");
          setQuery("");
          if (hasSearched) {
            setHasSearched(false);
            setResults([]);
          }
          toast("Filtrele au fost resetate cu succes! ⚡");
        }}
        className="mt-5 inline-flex items-center justify-center rounded-xl text-sm font-bold bg-ring text-white hover:bg-orange-500 px-6 py-2.5 transition-colors shadow-lg shadow-ring/20"
      >
        Resetează filtrele
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Elegant background glow */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-ring/5 to-transparent pointer-events-none z-0" />

      <Navbar onReset={resetState} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-16 pt-8">
        <AnimatePresence mode="wait">
          {!hasSearched && !selectedRestaurant && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HeroSection
                city={city}
                setCity={setCity}
                query={query}
                setQuery={setQuery}
                onSearch={handleSearch}
                isSearching={isSearching}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Search Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 pt-8"
        >
          <h2 className="text-2xl font-extrabold font-['Outfit'] mb-6 text-foreground">
            🔍 Comparare de Prețuri
          </h2>
          <ProductSearch 
            results={productResults} 
            isLoading={isSearchingProducts} 
            onSearch={searchProducts} 
          />
          
          {productResults && productResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                <p className="text-sm text-muted-foreground mb-4">
                  Am găsit <span className="font-bold text-foreground">{productResults.length}</span> produse
                </p>
              </div>
            </motion.div>
          )}
        </motion.section>

        {/* Filter Bar */}
        {!selectedRestaurant && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-3 overflow-x-auto no-scrollbar pb-4"
          >
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                activeFilter === "all"
                  ? "bg-foreground text-background border-foreground shadow-md"
                  : "bg-secondary text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              Toate
            </button>
            <button
              onClick={() => setActiveFilter("cheapest_delivery")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                activeFilter === "cheapest_delivery"
                  ? "bg-ring text-white border-ring shadow-md shadow-ring/20"
                  : "bg-secondary text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              Cea mai ieftină livrare
            </button>
            <button
              onClick={() => setActiveFilter("fastest_time")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                activeFilter === "fastest_time"
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                  : "bg-secondary text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              Cel mai rapid timp
            </button>
            <button
              onClick={() => setActiveFilter("under_5_lei")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                activeFilter === "under_5_lei"
                  ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20"
                  : "bg-secondary text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              Livrări sub 5 lei
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {hasSearched && !selectedRestaurant && (
            <motion.section
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12 pt-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold font-['Outfit'] text-foreground">
                  {results.length > 0
                    ? `${results.length} rezultat${results.length !== 1 ? "e" : ""} pentru "${
                        query || city
                      }"`
                    : "Niciun rezultat găsit"}
                </h2>
                <button
                  onClick={() => {
                    setHasSearched(false);
                    setResults([]);
                    setQuery("");
                  }}
                  className="text-sm font-bold text-ring hover:text-orange-400 transition-colors"
                >
                  Șterge căutarea
                </button>
              </div>
              {isSearching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <RestaurantSkeleton key={`skeleton-search-${i}`} />
                  ))}
                </div>
              ) : processedResults.length === 0 ? (
                <EmptyFilterState />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {processedResults.map((r, i) => (
                    <RestaurantCard
                      key={r.id}
                      restaurant={r}
                      onClick={() => setSelectedRestaurant(r)}
                      index={i}
                      isFavorite={favorites.includes(r.id)}
                      onToggleFavorite={(e) => toggleFavorite(r.id, e)}
                    />
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {selectedRestaurant && (
            <motion.section
              key="restaurant-detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12 pt-8"
            >
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-6 group"
              >
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Înapoi la rezultate
              </button>

              {/* Restaurant Header */}
              <div className="bg-card border border-border rounded-3xl shadow-xl shadow-black/20 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 mb-8 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-ring/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-border">
                  <img
                    src={selectedRestaurant.imageUrl}
                    alt={selectedRestaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl sm:text-4xl font-black font-['Outfit'] text-foreground tracking-tight mb-2">
                    {selectedRestaurant.name}
                  </h2>
                  <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2 mb-3 text-sm">
                    {selectedRestaurant.category} · {selectedRestaurant.address}
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 text-xs font-extrabold px-3 py-1 rounded-lg border border-amber-500/20">
                      ⭐ {selectedRestaurant.rating} ({selectedRestaurant.reviewCount} recenzii)
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Price Compare Stats */}
              <div className="mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-extrabold font-['Outfit'] text-foreground tracking-tight">
                      Comparație Taxe Livrare
                    </h3>
                    <p className="text-xs text-muted-foreground">Costurile de bază pentru acest local</p>
                  </div>
                  <button
                    onClick={syncFeesLive}
                    disabled={isSyncing}
                    className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wide transition-all duration-300 active:scale-95 shadow-lg ${
                      isSyncing
                        ? "bg-secondary text-muted-foreground cursor-not-allowed"
                        : "bg-card hover:bg-secondary border border-border text-foreground shadow-black/30"
                    }`}
                  >
                    {isSyncing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-4 h-4 text-ring" />
                        </motion.div>
                        Se actualizează...
                      </>
                    ) : (
                      <>
                        <Zap
                          className={`w-4 h-4 ${lastSyncTime ? "text-emerald-500" : "text-ring"}`}
                          fill="currentColor"
                        />
                        Actualizează Taxe Live
                      </>
                    )}
                  </button>
                </div>

                {lastSyncTime && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[11px] font-bold text-emerald-500 mb-4"
                  >
                    ✓ Taxe verificate în timp real la {lastSyncTime}
                  </motion.p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                  {selectedRestaurant.platforms.map((platformData, i) => {
                    const effectiveAvailable = platformData.available;
                    return (
                      <PlatformCard
                        key={platformData.platform}
                        platform={platformData.platform}
                        data={{ ...platformData, available: effectiveAvailable }}
                        isCheapest={cheapest === platformData.platform && effectiveAvailable}
                        index={i}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground/75 text-center mt-3">
                  * Prețurile pentru taxe sunt estimate pentru locația curentă. Verifică varianta
                  finală pe aplicația corespunzătoare.
                </p>
              </div>

              {/* Menu Listing Section */}
              {selectedRestaurant.menu && selectedRestaurant.menu.length > 0 && (
                <MenuSection
                  menu={selectedRestaurant.menu}
                  selectedMenuItem={selectedMenuItem}
                  onSelectItem={setSelectedMenuItem}
                  restaurantId={selectedRestaurant.id}
                />
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Favorite Restaurants */}
        {!hasSearched && !selectedRestaurant && favorites.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-6 pt-4">
              <div>
                <h2 className="text-2xl font-extrabold font-['Outfit'] text-foreground tracking-tight flex items-center gap-2">
                  <Heart className="w-6 h-6 fill-orange-500 text-orange-500" /> Favoritele Tale
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Localurile salvate pentru acces rapid</p>
              </div>
              <span className="text-xs bg-secondary border border-border font-bold px-3 py-1.5 rounded-lg text-muted-foreground">
                {favorites.length} localuri
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                Array.from({ length: Math.min(2, processedFavorites.length || favorites.length) }).map((_, i) => (
                  <RestaurantSkeleton key={`skeleton-fav-${i}`} />
                ))
              ) : processedFavorites.length === 0 ? (
                <EmptyFilterState />
              ) : (
                processedFavorites.map((r, i) => (
                    <RestaurantCard
                      key={r.id}
                      restaurant={r}
                      onClick={() => {
                        setSelectedRestaurant(r);
                        setHasSearched(false);
                      }}
                      index={i}
                      isFavorite={true}
                      onToggleFavorite={(e) => toggleFavorite(r.id, e)}
                    />
                  ))
              )}
            </div>
          </motion.section>
        )}

        {/* Popular Restaurants (Initially visible) */}
        {!hasSearched && !selectedRestaurant && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-6 pt-4">
              <div>
                <h2 className="text-2xl font-extrabold font-['Outfit'] text-foreground tracking-tight">
                  Populare în <span className="text-ring">{city === "Toate orașele" ? "România" : city}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Recomandările FoodRadar din zona ta</p>
              </div>
              <span className="text-xs bg-secondary border border-border font-bold px-3 py-1.5 rounded-lg text-muted-foreground">
                {popularRestaurants.length} localuri
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <RestaurantSkeleton key={`skeleton-popular-${i}`} />
                ))
              ) : popularRestaurants.length === 0 ? (
                <EmptyFilterState />
              ) : (
                popularRestaurants.map((r, i) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    onClick={() => {
                      setSelectedRestaurant(r);
                      setHasSearched(false);
                    }}
                    index={i}
                    isFavorite={favorites.includes(r.id)}
                    onToggleFavorite={(e) => toggleFavorite(r.id, e)}
                  />
                ))
              )}
            </div>
          </motion.section>
        )}

        {/* Features Breakdown */}
        {!selectedRestaurant && (
          <motion.section
            id="cum-functioneaza"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl shadow-black/20 mb-16"
          >
            <h2 className="text-3xl font-black font-['Outfit'] text-foreground text-center mb-3">
              Cum funcționează?
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-12 max-w-lg mx-auto leading-relaxed">
              Urmează 3 pași ultra-rapizi și încetează să plătești prețuri umflate nejustificat la mâncare.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
              {/* Horizontal lines connecting on desktop */}
              <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 border-t border-dashed border-border -z-10" />

              <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-ring/10 text-ring rounded-2xl flex items-center justify-center mx-auto mb-5 border border-ring/25 shadow-lg shadow-ring/10">
                  <Search className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-extrabold text-ring tracking-[0.2em] uppercase mb-2">
                  Pasul 1
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Caută Restaurantul</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Alege orașul tău și caută restaurantul favorit direct din aplicație.
                </p>
              </div>

              <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/25 shadow-lg shadow-emerald-500/10">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-extrabold text-emerald-500 tracking-[0.2em] uppercase mb-2">
                  Pasul 2
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Compară Prețurile</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vezi instantaneu diferențele de taxe și produse de pe Glovo, Bolt și Wolt.
                </p>
              </div>

              <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-500/25 shadow-lg shadow-blue-500/10">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-extrabold text-blue-500 tracking-[0.2em] uppercase mb-2">
                  Pasul 3
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Comandă Cel Mai Ieftin</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Selectează platforma cu cel mai mic total și finalizează comanda cu link direct.
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Fine Print About Section */}
        <motion.section
          id="despre"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-secondary/50 border border-border rounded-2xl p-6 max-w-4xl mx-auto"
        >
          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-ring fill-ring" /> Despre FoodRadar
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            FoodRadar este o platformă independentă creată cu scop educativ și de asistență în decizia
            de cumpărare. Prețurile afișate sunt actualizate automat via scraping din surse publice și pot fi estimate conform modificărilor platformelor terțe. Te sfătuim să verifici aplicația de destinație înainte de validarea tranzacției. Nu ne asociem legal cu entitățile Glovoapp, Bolt Technology sau Wolt.
          </p>
        </motion.section>
      </main>

      <footer className="bg-card border-t border-border/50 py-12 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border/50 pb-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-ring flex items-center justify-center shadow-lg shadow-ring/25">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-extrabold font-['Outfit'] text-lg text-foreground">
                Food<span className="text-ring">Radar</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termeni și Condiții</a>
              <a href="#" className="hover:text-foreground transition-colors">Politică Cookie</a>
              <a href="#" className="hover:text-foreground transition-colors">Asistență</a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} FoodRadar · Toate drepturile rezervate.
              <a href="/admin" className="inline-flex ml-2 align-middle text-muted-foreground hover:text-foreground opacity-30 hover:opacity-100 transition-all">
                <Settings className="w-3.5 h-3.5" />
              </a>
            </p>
            <p className="text-center md:text-right font-medium">Creat pentru economii destoinice. 🍔💸</p>
          </div>
        </div>
      </footer>

      {/* Comparison Modal Portal / Rendering */}
      <ComparisonModal
        selectedMenuItem={selectedMenuItem}
        selectedRestaurant={selectedRestaurant}
        onClose={() => setSelectedMenuItem(null)}
      />

      {/* Floating Cart Button */}
      <AnimatePresence>
        {selectedRestaurant && cartItems.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            onClick={() => setLocation("/checkout")}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-ring hover:bg-orange-500 text-white font-extrabold px-6 py-4 rounded-full shadow-2xl shadow-ring/30 active:scale-95 transition-all group cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2.5 -right-2.5 bg-white text-ring text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-ring/10">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>
            <span className="text-sm tracking-wide">Vezi Coș & Economii</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
