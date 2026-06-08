import React, { createContext, useContext, useState, useEffect } from "react";
import { type MenuItem, type Restaurant, type Platform, calculateTotalFees } from "@/lib/data";

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface CartTotals {
  platform: Platform;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  smallOrderFee: number;
  total: number;
  available: boolean;
  missingItemsCount: number;
}

interface CartContextType {
  cartItems: CartItem[];
  activeRestaurantId: string | null;
  addToCart: (item: MenuItem, restaurantId: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotals: (restaurant: Restaurant) => CartTotals[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("foodradar_cart");
    const savedRestId = localStorage.getItem("foodradar_cart_rest_id");
    if (savedCart && savedRestId) {
      try {
        setCartItems(JSON.parse(savedCart));
        setActiveRestaurantId(savedRestId);
      } catch (e) {
        console.error("Failed to parse saved cart", e);
      }
    }
  }, []);

  // Save cart to localStorage when changed
  useEffect(() => {
    if (activeRestaurantId) {
      localStorage.setItem("foodradar_cart", JSON.stringify(cartItems));
      localStorage.setItem("foodradar_cart_rest_id", activeRestaurantId);
    } else {
      localStorage.removeItem("foodradar_cart");
      localStorage.removeItem("foodradar_cart_rest_id");
    }
  }, [cartItems, activeRestaurantId]);

  const addToCart = (item: MenuItem, restaurantId: string) => {
    if (activeRestaurantId && activeRestaurantId !== restaurantId) {
      // If adding item from a different restaurant, clear current cart first
      setCartItems([{ menuItem: item, quantity: 1 }]);
      setActiveRestaurantId(restaurantId);
    } else {
      setActiveRestaurantId(restaurantId);
      setCartItems((prev) => {
        const existing = prev.find((i) => i.menuItem.id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...prev, { menuItem: item, quantity: 1 }];
      });
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((i) => i.menuItem.id !== itemId);
      if (updated.length === 0) {
        setActiveRestaurantId(null);
      }
      return updated;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.menuItem.id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setActiveRestaurantId(null);
  };

  const getCartTotals = (restaurant: Restaurant): CartTotals[] => {
    const platforms: Platform[] = ["glovo", "bolt", "wolt"];

    return platforms.map((platform) => {
      const platformData = restaurant.platforms.find((p) => p.platform === platform);
      if (!platformData || !platformData.available) {
        return {
          platform,
          subtotal: 0,
          deliveryFee: 0,
          serviceFee: 0,
          smallOrderFee: 0,
          total: Infinity,
          available: false,
          missingItemsCount: 0,
        };
      }

      let subtotal = 0;
      let missingItemsCount = 0;

      cartItems.forEach((item) => {
        const itemPriceInfo = item.menuItem.prices.find((p) => p.platform === platform);
        if (itemPriceInfo && itemPriceInfo.available && itemPriceInfo.price > 0) {
          subtotal += itemPriceInfo.price * item.quantity;
        } else {
          missingItemsCount += item.quantity;
        }
      });

      // If all items are missing, the platform is not available
      const isAvailable = missingItemsCount < cartItems.reduce((acc, i) => acc + i.quantity, 0);

      const { totalFee, deliveryFee, serviceFee, smallOrderFee } = calculateTotalFees(
        platformData,
        subtotal
      );

      const total = isAvailable ? subtotal + totalFee : Infinity;

      return {
        platform,
        subtotal,
        deliveryFee,
        serviceFee,
        smallOrderFee,
        total,
        available: isAvailable,
        missingItemsCount,
      };
    });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        activeRestaurantId,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
