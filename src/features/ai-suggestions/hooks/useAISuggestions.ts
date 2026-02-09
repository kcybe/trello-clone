import { useState, useCallback } from 'react';

import { CardAISuggestion, GenerateSuggestionsRequest, SuggestionState } from '../types';

interface UseAISuggestionsReturn extends SuggestionState {
  generateSuggestions: (content: string, types?: string[]) => Promise<void>;
  applySuggestion: (suggestion: CardAISuggestion) => void;
  clearSuggestions: () => void;
}

export function useAISuggestions(): UseAISuggestionsReturn {
  const [suggestions, setSuggestions] = useState<CardAISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async (content: string, types?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, types }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applySuggestion = useCallback((suggestion: CardAISuggestion) => {
    // The actual application of suggestions is handled by the component
    // This is a callback for tracking
    console.log('Applied suggestion:', suggestion);
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    generateSuggestions,
    applySuggestion,
    clearSuggestions,
  };
}

// Hook for title suggestions specifically
export function useAITitleSuggestions() {
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTitle = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, types: ['title'] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate title');
      }

      const data = await response.json();
      const titleSuggestion = data.suggestions.find((s: CardAISuggestion) => s.type === 'title');

      if (titleSuggestion && titleSuggestion.suggestions.length > 0) {
        setSuggestedTitle(titleSuggestion.suggestions[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate title');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestedTitle,
    isLoading,
    error,
    generateTitle,
    clearSuggestion: () => setSuggestedTitle(null),
  };
}

// Hook for label suggestions specifically
export function useAILabelSuggestions() {
  const [suggestedLabels, setSuggestedLabels] = useState<Array<{ text: string; color: string }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLabels = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, types: ['labels'] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate labels');
      }

      const data = await response.json();
      const labelSuggestion = data.suggestions.find((s: CardAISuggestion) => s.type === 'labels');

      if (labelSuggestion && 'suggestions' in labelSuggestion) {
        setSuggestedLabels(labelSuggestion.suggestions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate labels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestedLabels,
    isLoading,
    error,
    generateLabels,
    clearLabels: () => setSuggestedLabels([]),
  };
}

// Hook for checklist suggestions specifically
export function useAIChecklistSuggestions() {
  const [suggestedItems, setSuggestedItems] = useState<Array<{ text: string; checked: boolean }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateChecklist = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, types: ['checklist'] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate checklist');
      }

      const data = await response.json();
      const checklistSuggestion = data.suggestions.find(
        (s: CardAISuggestion) => s.type === 'checklist'
      );

      if (checklistSuggestion && 'suggestions' in checklistSuggestion) {
        setSuggestedItems(checklistSuggestion.suggestions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate checklist');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestedItems,
    isLoading,
    error,
    generateChecklist,
    clearChecklist: () => setSuggestedItems([]),
  };
}
