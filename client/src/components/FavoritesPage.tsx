import React, { useState, useEffect } from "react";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Favorite {
  id: string;
  name: string;
  restaurant: string;
  price: number;
  platform: string;
  timestamp: number;
}

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("favoriteProducts");
    if (saved) {
      const items = JSON.parse(saved);
      setFavorites(items);
      setIsEmpty(items.length === 0);
    } else {
      setIsEmpty(true);
    }
  }, []);

  const removeFavorite = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    localStorage.setItem("favoriteProducts", JSON.stringify(updated));
    setIsEmpty(updated.length === 0);
  };

  const clearAll = () => {
    if (confirm("Ești sigur că vrei să ștergi toate favoritele?")) {
      setFavorites([]);
      localStorage.removeItem("favoriteProducts");
      setIsEmpty(true);
    }
  };

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Heart className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-semibold mb-2">Nu ai produse favorite</h3>
        <p className="text-muted-foreground text-sm">
          Adaugă produse la favorite apăsând pe inimă în timpul căutării
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="fill-red-500 text-red-500" />
          Favoritele mele ({favorites.length})
        </h2>
        {favorites.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAll}
            className="text-xs"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Șterge tot
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className="p-4 border rounded-lg hover:shadow-lg transition-shadow bg-card"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold line-clamp-2">{fav.name}</h4>
                <p className="text-sm text-muted-foreground">{fav.restaurant}</p>
              </div>
              <button
                onClick={() => removeFavorite(fav.id)}
                className="flex-shrink-0 ml-2"
              >
                <Heart className="w-5 h-5 fill-red-500 text-red-500 hover:opacity-70" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Badge className="capitalize">{fav.platform}</Badge>
              </div>
              <span className="font-bold text-lg">{fav.price.toFixed(2)} RON</span>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Salvat: {new Date(fav.timestamp).toLocaleDateString("ro-RO")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
