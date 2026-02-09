import { Comment } from '@/types';

import { useState, useCallback, useEffect } from 'react';

interface UseCommentsOptions {
  cardId: string;
  initialComments?: Comment[];
}

interface UseCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  addComment: (content: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  refreshComments: () => Promise<void>;
}

export function useComments({
  cardId,
  initialComments = [],
}: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments from API
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cards/${cardId}/comments`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setIsLoading(false);
    }
  }, [cardId]);

  // Load initial comments
  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments();
    } else {
      setComments(initialComments);
    }
  }, [cardId, initialComments, fetchComments]);

  // Add a new comment
  const addComment = useCallback(
    async (content: string) => {
      setError(null);
      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, cardId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add comment');
        }

        const newComment = await response.json();
        setComments(prev => [...prev, newComment]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add comment');
        throw err;
      }
    },
    [cardId]
  );

  // Edit an existing comment
  const editComment = useCallback(async (commentId: string, content: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to edit comment');
      }

      const updatedComment = await response.json();
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, ...updatedComment, updatedAt: new Date() } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit comment');
      throw err;
    }
  }, []);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      throw err;
    }
  }, []);

  return {
    comments,
    isLoading,
    error,
    addComment,
    editComment,
    deleteComment,
    refreshComments: fetchComments,
  };
}
