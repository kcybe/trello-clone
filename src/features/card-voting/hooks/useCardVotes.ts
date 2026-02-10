'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { useState, useCallback, useEffect } from 'react';

interface UseCardVotesReturn {
  votes: number;
  userVoted: boolean;
  vote: () => Promise<void>;
  isLoading: boolean;
}

export function useCardVotes(cardId: string): UseCardVotesReturn {
  const { user } = useAuth();
  const [votes, setVotes] = useState(0);
  const [userVoted, setUserVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/cards/${cardId}/votes`);
      const data = await response.json();

      setVotes(data.totalVotes || 0);
      setUserVoted(data.votes?.some((v: { userId: string }) => v.userId === user?.id) || false);
    } catch (error) {
      console.error('Failed to fetch votes:', error);
    }
  }, [cardId, user?.id]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const vote = useCallback(async () => {
    if (!user?.id || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/cards/${cardId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (data.voted) {
        setVotes(v => v + 1);
        setUserVoted(true);
      } else {
        setVotes(v => Math.max(0, v - 1));
        setUserVoted(false);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cardId, user?.id, isLoading]);

  return { votes, userVoted, vote, isLoading };
}
