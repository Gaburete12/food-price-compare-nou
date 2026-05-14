import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, ChevronDown, TrendingDown, Zap, ArrowRight } from "lucide-react";
import { CITIES } from "@/lib/data";

interface HeroSectionProps {
  city: string;
  setCity: (city: string) => void;
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export function HeroSection({
  city,
  setCity,
  query,
  setQuery,
  onSearch,
  isSearching,
}: HeroSectionProps) {
  const [cityOpen, setCityOpen] = React.useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Abstract Background Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ring/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-border">
            <Zap className="w-3.5 h-3.5 text-ring" />
            Comparator Inteligent de Prețuri
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold font-['Outfit'] text-foreground leading-tight tracking-tight mb-6">
            Delivery mai inteligent. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ring to-orange-400">
              Mai ieftin.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Compară instantaneu prețurile de pe Glovo, Bolt Food și Wolt. 
            Oprește-te din a plăti taxe de livrare ascunse.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-card rounded-2xl shadow-2xl shadow-black/5 border border-border p-3 space-y-3 max-w-3xl mx-auto"
        >
          <div className="relative">
            <button
              onClick={() => setCityOpen(!cityOpen)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-secondary/50 hover:bg-secondary rounded-xl transition-colors text-left"
            >
              <MapPin className="w-4 h-4 text-ring flex-shrink-0" />
              <span className="flex-1 text-sm font-semibold text-foreground">{city}</span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  cityOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence>
              {cityOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden"
                >
                  <div className="overflow-y-auto" style={{ maxHeight: "220px" }}>
                    {["Toate orașele", ...CITIES].map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCity(c);
                          setCityOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-medium flex items-center gap-2 ${
                          city === c
                            ? "bg-ring/10 text-ring"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        {city === c && (
                          <span className="w-1.5 h-1.5 rounded-full bg-ring flex-shrink-0" />
                        )}
                        {city !== c && <span className="w-1.5 h-1.5 flex-shrink-0" />}
                        {c}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Caută restaurant (ex: KFC, Pizza Hut...)"
                className="w-full pl-12 pr-4 py-4 bg-secondary/50 border border-transparent rounded-xl text-sm font-medium text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
              />
            </div>
            <button
              onClick={onSearch}
              disabled={isSearching}
              className="bg-ring hover:bg-ring/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-ring/25 whitespace-nowrap"
            >
              {isSearching ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                >
                  <Search className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  Compară
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-8"
        >
          <span className="text-sm text-muted-foreground font-medium">Compară live pe:</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm">
              <div className="w-3 h-3 rounded-full bg-[#FFC244]" />
              <span className="text-xs font-semibold text-foreground">Glovo</span>
            </div>
            <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm">
              <div className="w-3 h-3 rounded-full bg-[#34D186]" />
              <span className="text-xs font-semibold text-foreground">Bolt</span>
            </div>
            <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm">
              <div className="w-3 h-3 rounded-full bg-[#009DE0]" />
              <span className="text-xs font-semibold text-foreground">Wolt</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
