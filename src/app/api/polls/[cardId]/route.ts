import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (replace with database in production)
const polls = new Map<
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
>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  // Get all polls for card
  const cardPolls: typeof polls.values = [];
  polls.forEach(poll => {
    if (poll.cardId === cardId) {
      cardPolls.push(poll);
    }
  });

  return NextResponse.json({ polls: cardPolls });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const body = await request.json();
  const { question, options, allowMultiple, endsAt, createdBy } = body;

  if (!question || !options || options.length < 2) {
    return NextResponse.json(
      { error: 'Question and at least 2 options required' },
      { status: 400 }
    );
  }

  const pollId = `poll-${Date.now()}`;

  const poll = {
    id: pollId,
    cardId,
    question,
    options: options.map((text: string, index: number) => ({
      id: `option-${pollId}-${index}`,
      text,
      votes: [],
    })),
    allowMultiple: allowMultiple || false,
    createdAt: new Date().toISOString(),
    endsAt,
    isClosed: false,
    createdBy,
  };

  polls.set(pollId, poll);

  return NextResponse.json({ poll });
}
