'use client';

import { ThumbsUp, ThumbsDown, Users, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useState } from 'react';

import { useCardVotes } from '../hooks/useCardVotes';

interface CardVotingProps {
  cardId: string;
  showCount?: boolean;
  variant?: 'default' | 'compact';
}

export function CardVoting({ cardId, showCount = true, variant = 'default' }: CardVotingProps) {
  const { votes, userVoted, vote, isLoading } = useCardVotes(cardId);
  const [voted, setVoted] = useState(userVoted);

  const handleVote = async () => {
    await vote();
    setVoted(!voted);
  };

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleVote}
        disabled={isLoading}
        className={`gap-1 ${voted ? 'text-primary' : ''}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className="h-4 w-4" />
        )}
        {showCount && <span>{votes}</span>}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={voted ? 'default' : 'outline'}
        size="sm"
        onClick={handleVote}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className={`h-4 w-4 ${voted ? 'fill-current' : ''}`} />
        )}
        <span>{voted ? 'Voted' : 'Vote'}</span>
      </Button>

      {showCount && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {votes} vote{votes !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

// Simple thumbs up/down voting component
interface SimpleVotingProps {
  cardId: string;
}

export function SimpleVoting({ cardId }: SimpleVotingProps) {
  const { votes, userVoted, vote, isLoading } = useCardVotes(cardId);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={userVoted ? 'default' : 'outline'}
        size="icon"
        onClick={vote}
        disabled={isLoading}
        className="h-8 w-8"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className={`h-4 w-4 ${userVoted ? 'fill-current' : ''}`} />
        )}
      </Button>
      <span className="text-sm font-medium">{votes}</span>
    </div>
  );
}
