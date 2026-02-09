// Card Vote Types
export interface CardVote {
  id: string;
  cardId: string;
  userId: string;
  createdAt: string;
}

export interface VoteSummary {
  cardId: string;
  totalVotes: number;
  userVoted: boolean;
  voteCount: number;
}

// Poll Types
export interface Poll {
  id: string;
  cardId: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  createdAt: string;
  endsAt?: string;
  isClosed: boolean;
  createdBy: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: PollVote[];
  voteCount: number;
}

export interface PollVote {
  id: string;
  optionId: string;
  userId: string;
  createdAt: string;
}

export interface PollResult {
  poll: Poll;
  options: Array<{
    option: PollOption;
    percentage: number;
    isLeading: boolean;
  }>;
  totalVotes: number;
  userVoted: boolean;
  userVotes: string[];
  timeRemaining?: number;
}

// API Types
export interface CreatePollRequest {
  cardId: string;
  question: string;
  options: string[];
  allowMultiple?: boolean;
  endsAt?: string;
}

export interface VoteOnPollRequest {
  pollId: string;
  optionIds: string[];
}

export interface PollStatus {
  hasVoted: boolean;
  canVote: boolean;
  isExpired: boolean;
  isClosed: boolean;
}
