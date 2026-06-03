import { useCallback, useState, useRef } from "react";
import { useSearchCache } from "./useSearchCache";

export interface UseProductSearchResult {
  results: any[];
  isLoading: boolean;
  search: (query: string) => void;
  error: string | null;
}

/**
 * Hook pentru căutare de produse cu debounce și caching
 * Comunică cu backend /api/products/search endpoint
 */
export function useProductSearch(): UseProductSearchResult {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const { get: getCached, set: setCached } = useSearchCache<any[]>("productSearchCache");

  const search = useCallback((query: string) => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Reset if empty query
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    // Check cache first
    const cached = getCached(query);
    if (cached) {
      setResults(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce 300ms before making request
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();
        const searchResults = data.results || [];
        
        // Cache the results
        setCached(query, searchResults);
        setResults(searchResults);
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [getCached, setCached]);

  return { results, isLoading, search, error };
}
