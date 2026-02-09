import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useComments } from '../../../src/features/board/hooks/useComments';
import { JSDOM } from 'jsdom';

// Setup jsdom for document
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// Mock fetch globally
global.fetch = vi.fn();

describe('useComments', () => {
  const mockComments = [
    {
      id: 'comment-1',
      text: 'Test comment 1',
      author: 'John Doe',
      createdAt: new Date('2024-01-01'),
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
    },
    {
      id: 'comment-2',
      text: 'Test comment 2',
      author: 'Jane Doe',
      createdAt: new Date('2024-01-02'),
      user: { id: 'user-2', name: 'Jane Doe', email: 'jane@example.com' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty comments', () => {
      const { result } = renderHook(() => useComments({ cardId: 'card-1' }));

      expect(result.current.comments).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should initialize with provided comments', () => {
      const { result } = renderHook(() =>
        useComments({ cardId: 'card-1', initialComments: mockComments })
      );

      expect(result.current.comments).toEqual(mockComments);
    });
  });

  describe('fetchComments', () => {
    it('should fetch comments from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
      });

      const { result } = renderHook(() => useComments({ cardId: 'card-1' }));

      await waitFor(() => {
        expect(result.current.comments).toEqual(mockComments);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Access denied' }),
      });

      const { result } = renderHook(() => useComments({ cardId: 'card-1' }));

      await waitFor(() => {
        expect(result.current.error).toBe('Access denied');
        expect(result.current.comments).toEqual([]);
      });
    });
  });

  describe('addComment', () => {
    it('should add a new comment', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments[0],
      });

      const { result } = renderHook(() => useComments({ cardId: 'card-1' }));

      await act(async () => {
        await result.current.addComment('New comment');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'New comment', cardId: 'card-1' }),
      });

      await waitFor(() => {
        expect(result.current.comments).toContainEqual(mockComments[0]);
      });
    });

    it('should handle add comment error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useComments({ cardId: 'card-1' }));

      await act(async () => {
        await expect(result.current.addComment('New comment')).rejects.toThrow();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Unauthorized');
      });
    });
  });

  describe('editComment', () => {
    it('should edit an existing comment', async () => {
      const updatedComment = { ...mockComments[0], text: 'Updated comment' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedComment,
      });

      const { result } = renderHook(() =>
        useComments({ cardId: 'card-1', initialComments: mockComments })
      );

      await act(async () => {
        await result.current.editComment('comment-1', 'Updated comment');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/comments/comment-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated comment' }),
      });

      await waitFor(() => {
        expect(result.current.comments.find(c => c.id === 'comment-1')?.text).toBe('Updated comment');
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Comment deleted' }),
      });

      const { result } = renderHook(() =>
        useComments({ cardId: 'card-1', initialComments: mockComments })
      );

      await act(async () => {
        await result.current.deleteComment('comment-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/comments/comment-1', {
        method: 'DELETE',
      });

      await waitFor(() => {
        expect(result.current.comments).toHaveLength(1);
        expect(result.current.comments.find(c => c.id === 'comment-1')).toBeUndefined();
      });
    });
  });
});
