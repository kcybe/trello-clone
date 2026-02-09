'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { useState, useCallback, useEffect } from 'react';

import { Poll, PollResult } from '../types';

interface UsePollsReturn {
  polls: Poll[];
  isLoading: boolean;
  createPoll: (data: CreatePollData) => Promise<Poll | null>;
  vote: (pollId: string, optionIds: string[]) => Promise<PollResult | null>;
  removeVote: (pollId: string) => Promise<void>;
  closePoll: (pollId: string) => Promise<void>;
  reopenPoll: (pollId: string) => Promise<void>;
  deletePoll: (pollId: string) => Promise<void>;
  refreshPolls: () => Promise<void>;
}

interface CreatePollData {
  question: string;
  options: string[];
  allowMultiple?: boolean;
  endsAt?: string;
}

export function usePolls(cardId: string): UsePollsReturn {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPolls = useCallback(async () => {
    try {
      const response = await fetch(`/api/polls/${cardId}`);
      const data = await response.json();
      setPolls(data.polls || []);
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    }
  }, [cardId]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const createPoll = useCallback(
    async (data: CreatePollData): Promise<Poll | null> => {
      if (!user?.id) return null;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/polls/${cardId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            createdBy: user.id,
          }),
        });

        const result = await response.json();

        if (result.poll) {
          setPolls(prev => [...prev, result.poll]);
          return result.poll;
        }

        return null;
      } catch (error) {
        console.error('Failed to create poll:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [cardId, user?.id]
  );

  const vote = useCallback(
    async (pollId: string, optionIds: string[]): Promise<PollResult | null> => {
      if (!user?.id) return null;

      try {
        const response = await fetch(`/api/polls/${pollId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, optionIds }),
        });

        const result = await response.json();

        if (result.success) {
          // Update local state
          setPolls(prev =>
            prev.map(p => {
              if (p.id !== pollId) return p;

              // Update option vote counts
              const updatedOptions = p.options.map(opt => ({
                ...opt,
                voteCount:
                  result.results.find((r: { optionId: string }) => r.optionId === opt.id)
                    ?.voteCount || 0,
              }));

              return { ...p, options: updatedOptions };
            })
          );

          return result;
        }

        return null;
      } catch (error) {
        console.error('Failed to vote:', error);
        return null;
      }
    },
    [user?.id]
  );

  const removeVote = useCallback(
    async (pollId: string) => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/polls/${pollId}/vote?userId=${user.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Refresh polls
          fetchPolls();
        }
      } catch (error) {
        console.error('Failed to remove vote:', error);
      }
    },
    [user?.id, fetchPolls]
  );

  const closePoll = useCallback(async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });

      if (response.ok) {
        setPolls(prev => prev.map(p => (p.id === pollId ? { ...p, isClosed: true } : p)));
      }
    } catch (error) {
      console.error('Failed to close poll:', error);
    }
  }, []);

  const reopenPoll = useCallback(async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reopen' }),
      });

      if (response.ok) {
        setPolls(prev => prev.map(p => (p.id === pollId ? { ...p, isClosed: false } : p)));
      }
    } catch (error) {
      console.error('Failed to reopen poll:', error);
    }
  }, []);

  const deletePoll = useCallback(async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPolls(prev => prev.filter(p => p.id !== pollId));
      }
    } catch (error) {
      console.error('Failed to delete poll:', error);
    }
  }, []);

  return {
    polls,
    isLoading,
    createPoll,
    vote,
    removeVote,
    closePoll,
    reopenPoll,
    deletePoll,
    refreshPolls: fetchPolls,
  };
}
