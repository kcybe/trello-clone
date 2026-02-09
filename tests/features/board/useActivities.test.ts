import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useActivities } from '../../../src/features/board/hooks/useActivities';
import { JSDOM } from 'jsdom';

// Setup jsdom for document
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// Mock fetch globally
global.fetch = vi.fn();

describe('useActivities', () => {
  const mockActivities = [
    {
      id: 'activity-1',
      type: 'card_created' as const,
      cardId: 'card-1',
      cardTitle: 'Test Card',
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      timestamp: new Date('2024-01-01'),
    },
    {
      id: 'activity-2',
      type: 'card_moved' as const,
      cardId: 'card-1',
      cardTitle: 'Test Card',
      user: { id: 'user-2', name: 'Jane Doe', email: 'jane@example.com' },
      timestamp: new Date('2024-01-02'),
      fromColumnName: 'To Do',
      toColumnName: 'In Progress',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty activities', () => {
      const { result } = renderHook(() => useActivities({ boardId: 'board-1' }));

      expect(result.current.activities).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.hasMore).toBe(false);
    });

    it('should initialize with provided activities', () => {
      const { result } = renderHook(() =>
        useActivities({ boardId: 'board-1', initialActivities: mockActivities })
      );

      expect(result.current.activities).toEqual(mockActivities);
    });
  });

  describe('fetchActivities', () => {
    it('should fetch activities from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activities: mockActivities,
          total: 2,
          hasMore: false,
        }),
      });

      const { result } = renderHook(() => useActivities({ boardId: 'board-1' }));

      await waitFor(() => {
        expect(result.current.activities).toEqual(mockActivities);
        expect(result.current.hasMore).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle pagination', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activities: [mockActivities[0]],
          total: 2,
          hasMore: true,
        }),
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activities: [mockActivities[1]],
          total: 2,
          hasMore: false,
        }),
      });

      const { result } = renderHook(() => useActivities({ boardId: 'board-1', limit: 1 }));

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(1);
        expect(result.current.hasMore).toBe(true);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(2);
        expect(result.current.hasMore).toBe(false);
      });
    });

    it('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Access denied' }),
      });

      const { result } = renderHook(() => useActivities({ boardId: 'board-1' }));

      await waitFor(() => {
        expect(result.current.error).toBe('Access denied');
        expect(result.current.activities).toEqual([]);
      });
    });
  });

  describe('filtering', () => {
    it('should filter by cardId', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activities: [mockActivities[0]],
          total: 1,
          hasMore: false,
        }),
      });

      const { result } = renderHook(() => useActivities({ cardId: 'card-1' }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('cardId=card-1'),
          expect.anything()
        );
      });
    });

    it('should filter by boardId', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activities: mockActivities,
          total: 2,
          hasMore: false,
        }),
      });

      const { result } = renderHook(() => useActivities({ boardId: 'board-1' }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('boardId=board-1'),
          expect.anything()
        );
      });
    });
  });

  describe('refreshActivities', () => {
    it('should refresh activities and reset offset', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activities: mockActivities,
          total: 2,
          hasMore: false,
        }),
      });

      const { result, rerender } = renderHook(() =>
        useActivities({ boardId: 'board-1', limit: 1 })
      );

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(1);
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activities: mockActivities,
          total: 2,
          hasMore: false,
        }),
      });

      await act(async () => {
        await result.current.refreshActivities();
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('offset=0'),
          expect.anything()
        );
      });
    });
  });

  describe('addActivity', () => {
    it('should add a new activity', async () => {
      const newActivity = {
        type: 'card_edited' as const,
        cardId: 'card-1',
        cardTitle: 'Test Card',
        user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...newActivity,
          id: 'activity-3',
          timestamp: new Date(),
        }),
      });

      const { result } = renderHook(() =>
        useActivities({ boardId: 'board-1', initialActivities: mockActivities })
      );

      await act(async () => {
        await result.current.addActivity(newActivity);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity),
      });

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(3);
        expect(result.current.activities[0]).toMatchObject(newActivity);
      });
    });
  });
});
