import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (shared with parent route)
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

// GET /api/polls/[pollId] - Get poll details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;
  const polls = getPolls();
  const poll = polls.get(pollId);

  if (!poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  // Calculate results
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

  const results = poll.options.map(opt => ({
    option: {
      id: opt.id,
      text: opt.text,
      voteCount: opt.votes.length,
    },
    percentage: totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0,
    isLeading: false,
  }));

  // Find leading option(s)
  const maxVotes = Math.max(...results.map(r => r.option.voteCount));
  results.forEach(r => {
    if (r.option.voteCount === maxVotes && maxVotes > 0) {
      r.isLeading = true;
    }
  });

  return NextResponse.json({
    poll,
    results,
    totalVotes,
  });
}

// PATCH /api/polls/[pollId] - Update poll (close, reopen)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;
  const polls = getPolls();
  const poll = polls.get(pollId);

  if (!poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === 'close') {
    poll.isClosed = true;
  } else if (action === 'reopen') {
    poll.isClosed = false;
  }

  return NextResponse.json({ poll });
}

// DELETE /api/polls/[pollId] - Delete poll
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;
  const polls = getPolls();

  if (!polls.has(pollId)) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  polls.delete(pollId);

  return NextResponse.json({ deleted: true });
}
