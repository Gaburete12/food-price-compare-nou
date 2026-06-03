import { useCallback, useRef, useEffect } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for caching search results with TTL
 * Reduces API calls when searching for the same products
 */
export function useSearchCache<T>(cacheKey: string = "searchCache") {
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  useEffect(() => {
    // Load cache from localStorage on mount
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      try {
        const cached = JSON.parse(saved);
        cacheRef.current = new Map(Object.entries(cached));
      } catch (e) {
        console.error("Failed to load cache:", e);
      }
    }
  }, [cacheKey]);

  const get = useCallback(
    (key: string): T | null => {
      const entry = cacheRef.current.get(key);

      if (!entry) return null;

      // Check if cache is expired
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        cacheRef.current.delete(key);
        return null;
      }

      return entry.data;
    },
    []
  );

  const set = useCallback(
    (key: string, data: T) => {
      cacheRef.current.set(key, {
        data,
        timestamp: Date.now(),
      });

      // Save to localStorage
      const obj = Object.fromEntries(cacheRef.current);
      localStorage.setItem(cacheKey, JSON.stringify(obj));
    },
    [cacheKey]
  );

  const clear = useCallback(() => {
    cacheRef.current.clear();
    localStorage.removeItem(cacheKey);
  }, [cacheKey]);

  return { get, set, clear };
}
