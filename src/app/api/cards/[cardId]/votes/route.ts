import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (replace with database in production)
const votes = new Map<string, Map<string, { userId: string; createdAt: string }[]>>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  // Get votes for card
  const cardVotes = votes.get(cardId) || new Map();
  const allVotes: { userId: string; createdAt: string }[] = [];

  cardVotes.forEach(voteList => {
    allVotes.push(...voteList);
  });

  const totalVotes = allVotes.length;

  return NextResponse.json({
    cardId,
    totalVotes,
    votes: allVotes,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  // Initialize card votes if needed
  if (!votes.has(cardId)) {
    votes.set(cardId, new Map());
  }

  const cardVotes = votes.get(cardId)!;

  // Check if user already voted
  let userHasVoted = false;
  cardVotes.forEach(voteList => {
    if (voteList.some(v => v.userId === userId)) {
      userHasVoted = true;
    }
  });

  if (userHasVoted) {
    // Remove vote (toggle off)
    cardVotes.forEach((voteList, emoji) => {
      const index = voteList.findIndex(v => v.userId === userId);
      if (index !== -1) {
        voteList.splice(index, 1);
        if (voteList.length === 0) {
          cardVotes.delete(emoji);
        }
      }
    });

    return NextResponse.json({ voted: false, message: 'Vote removed' });
  }

  // Add vote with default emoji
  const emoji = '👍';
  if (!cardVotes.has(emoji)) {
    cardVotes.set(emoji, []);
  }
  cardVotes.get(emoji)!.push({
    userId,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ voted: true, message: 'Vote added' });
}
