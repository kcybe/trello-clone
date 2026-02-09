import { useState, useCallback, useMemo, useEffect } from 'react';

import {
  SearchFilters,
  SearchResult,
  CardSearchResult,
  SearchHistoryItem,
  SearchSuggestion,
} from '../types/search';

interface UseSearchOptions {
  boardId?: string;
  maxHistoryItems?: number;
}

interface UseSearchReturn {
  // State
  isLoading: boolean;
  results: SearchResult | null;
  searchHistory: SearchHistoryItem[];
  suggestions: SearchSuggestion[];

  // Actions
  search: (filters: SearchFilters) => Promise<void>;
  clearSearch: () => void;
  clearHistory: () => void;
  removeHistoryItem: (index: number) => void;
  saveToHistory: (filters: SearchFilters, resultCount: number) => void;
  getSuggestions: (query: string) => Promise<SearchSuggestion[]>;
  loadMore: () => Promise<void>;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { boardId, maxHistoryItems = 10 } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Pagination state
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  // Main search function
  const search = useCallback(
    async (filters: SearchFilters) => {
      setIsLoading(true);
      setCurrentFilters(filters);
      setOffset(0);

      try {
        const params = new URLSearchParams();

        if (filters.text) params.set('query', filters.text);
        if (filters.labels?.length) params.set('labels', filters.labels.join(','));
        if (filters.assignees?.length) params.set('assignees', filters.assignees.join(','));
        if (filters.dateFilter) params.set('dateFilter', filters.dateFilter);
        if (filters.specificDate) params.set('specificDate', filters.specificDate.toISOString());
        if (boardId) params.set('boardId', boardId);
        params.set('limit', LIMIT.toString());
        params.set('offset', '0');

        const response = await fetch(`/api/search?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          setResults(data);
        } else {
          throw new Error('Search failed');
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    },
    [boardId]
  );

  // Load more results (pagination)
  const loadMore = useCallback(async () => {
    if (!results?.hasMore || isLoading) return;

    setIsLoading(true);
    const newOffset = offset + LIMIT;
    setOffset(newOffset);

    try {
      const params = new URLSearchParams();

      if (currentFilters.text) params.set('query', currentFilters.text);
      if (currentFilters.labels?.length) params.set('labels', currentFilters.labels.join(','));
      if (currentFilters.assignees?.length)
        params.set('assignees', currentFilters.assignees.join(','));
      if (currentFilters.dateFilter) params.set('dateFilter', currentFilters.dateFilter);
      if (currentFilters.specificDate)
        params.set('specificDate', currentFilters.specificDate.toISOString());
      if (boardId) params.set('boardId', boardId);
      params.set('limit', LIMIT.toString());
      params.set('offset', newOffset.toString());

      const response = await fetch(`/api/search?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setResults(prev =>
          prev
            ? {
                ...prev,
                cards: [...prev.cards, ...data.cards],
                hasMore: data.hasMore,
              }
            : data
        );
      }
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [results, offset, currentFilters, boardId, isLoading]);

  // Clear search results
  const clearSearch = useCallback(() => {
    setResults(null);
    setCurrentFilters({});
    setOffset(0);
  }, []);

  // Save search to history
  const saveToHistory = useCallback(
    (filters: SearchFilters, resultCount: number) => {
      const historyItem: SearchHistoryItem = {
        query: filters.text || '',
        filters,
        timestamp: new Date(),
        resultCount,
      };

      setSearchHistory(prev => {
        const newHistory = [historyItem, ...prev.slice(0, maxHistoryItems - 1)];
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        }
        return newHistory;
      });
    },
    [maxHistoryItems]
  );

  // Load search history from localStorage
  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('searchHistory');
      if (saved) {
        try {
          setSearchHistory(JSON.parse(saved));
        } catch {
          // Ignore invalid JSON
        }
      }
    }
  });

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('searchHistory');
    }
  }, []);

  // Remove single history item
  const removeHistoryItem = useCallback((index: number) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter((_, i) => i !== index);
      if (typeof window !== 'undefined') {
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }
      return newHistory;
    });
  }, []);

  // Get search suggestions
  const getSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    if (!query || query.length < 2) return [];

    try {
      const params = new URLSearchParams();
      params.set('query', query.slice(0, 20)); // Limit query length
      params.set('limit', '5');

      const response = await fetch(`/api/search?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();

        // Convert card results to suggestions
        const cardSuggestions: SearchSuggestion[] =
          data.cards?.map((card: CardSearchResult) => ({
            type: 'card' as const,
            value: card.title,
          })) || [];

        return cardSuggestions;
      }
    } catch (error) {
      console.error('Suggestions error:', error);
    }

    return [];
  }, []);

  return {
    isLoading,
    results,
    searchHistory,
    suggestions: [],
    search,
    clearSearch,
    clearHistory,
    removeHistoryItem,
    saveToHistory,
    getSuggestions,
    loadMore,
  };
}

export default useSearch;
