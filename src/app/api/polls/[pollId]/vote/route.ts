import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (shared with parent routes)
declare global {
  var __polls:
    | Map<
        string,
        {
          id: string;
          cardId: string;
          question: string;
          options: Array<{
            id: string;
            text: string;
            votes: Array<{ userId: string; createdAt: string }>;
          }>;
          allowMultiple: boolean;
          createdAt: string;
          endsAt?: string;
          isClosed: boolean;
          createdBy: string;
        }
      >
    | undefined;
}

const getPolls = (): Map<string, typeof globalThis.__polls extends infer T ? T : never> => {
  if (!global.__polls) {
    global.__polls = new Map();
  }
  return global.__polls;
};

// POST /api/polls/[pollId]/vote - Vote on a poll
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;
  const polls = getPolls();
  const poll = polls.get(pollId);

  if (!poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  if (poll.isClosed) {
    return NextResponse.json({ error: 'Poll is closed' }, { status: 400 });
  }

  const body = await request.json();
  const { userId, optionIds } = body;

  if (!userId || !optionIds || optionIds.length === 0) {
    return NextResponse.json({ error: 'User ID and option IDs required' }, { status: 400 });
  }

  // Validate option IDs
  const validOptionIds = poll.options.map(o => o.id);
  const invalidOptionIds = optionIds.filter((id: string) => !validOptionIds.includes(id));
  if (invalidOptionIds.length > 0) {
    return NextResponse.json({ error: 'Invalid option IDs' }, { status: 400 });
  }

  // Remove existing votes from this user
  poll.options.forEach(option => {
    const index = option.votes.findIndex(v => v.userId === userId);
    if (index !== -1) {
      option.votes.splice(index, 1);
    }
  });

  // Add new votes
  const timestamp = new Date().toISOString();
  optionIds.forEach((optionId: string) => {
    const option = poll.options.find(o => o.id === optionId);
    if (option) {
      option.votes.push({ userId, createdAt: timestamp });
    }
  });

  // Calculate results
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

  const results = poll.options.map(opt => ({
    optionId: opt.id,
    text: opt.text,
    voteCount: opt.votes.length,
    percentage: totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0,
    userVoted: opt.votes.some(v => v.userId === userId),
  }));

  return NextResponse.json({
    success: true,
    results,
    totalVotes,
  });
}

// DELETE /api/polls/[pollId]/vote - Remove vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;
  const polls = getPolls();
  const poll = polls.get(pollId);

  if (!poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  // Remove all votes from this user
  poll.options.forEach(option => {
    const index = option.votes.findIndex(v => v.userId === userId);
    if (index !== -1) {
      option.votes.splice(index, 1);
    }
  });

  return NextResponse.json({ success: true });
}
