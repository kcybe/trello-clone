import { Activity } from '@/types';

import { useState, useCallback, useEffect } from 'react';

interface UseActivitiesOptions {
  boardId?: string;
  cardId?: string;
  initialActivities?: Activity[];
  limit?: number;
}

interface UseActivitiesReturn {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Promise<void>;
}

export function useActivities({
  boardId,
  cardId,
  initialActivities = [],
  limit = 50,
}: UseActivitiesOptions = {}): UseActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Build query params
  const getQueryParams = useCallback(
    (offsetParam: number = 0) => {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', offsetParam.toString());
      if (boardId) params.set('boardId', boardId);
      if (cardId) params.set('cardId', cardId);
      return params.toString();
    },
    [boardId, cardId, limit]
  );

  // Fetch activities from API
  const fetchActivities = useCallback(
    async (offsetParam: number = 0, append: boolean = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = getQueryParams(offsetParam);
        const response = await fetch(`/api/activities?${queryParams}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch activities');
        }
        const data = await response.json();

        setActivities(prev => (append ? [...prev, ...data.activities] : data.activities));
        setHasMore(data.hasMore);
        setOffset(offsetParam + data.activities.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      } finally {
        setIsLoading(false);
      }
    },
    [getQueryParams]
  );

  // Load initial activities
  useEffect(() => {
    if (initialActivities.length === 0) {
      fetchActivities(0, false);
    }
  }, [boardId, cardId, initialActivities, fetchActivities]);

  // Load more activities (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchActivities(offset, true);
  }, [hasMore, isLoading, offset, fetchActivities]);

  // Refresh activities
  const refreshActivities = useCallback(async () => {
    setOffset(0);
    await fetchActivities(0, false);
  }, [fetchActivities]);

  // Add a new activity (for internal use)
  const addActivity = useCallback(async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add activity');
      }

      const newActivity = await response.json();
      setActivities(prev => [newActivity, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add activity');
      throw err;
    }
  }, []);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    loadMore,
    refreshActivities,
    addActivity,
  };
}
