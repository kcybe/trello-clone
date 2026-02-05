import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createChecklistSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  title: z.string().min(1, 'Checklist title is required'),
});

// GET /api/checklists - List checklists for user
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('cardId');

    const where: Record<string, unknown> = {};

    if (cardId) {
      where.cardId = cardId;
      // Also verify user has access to the card's board
      where.card = {
        column: {
          board: {
            OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
          },
        },
      };
    } else {
      // If no cardId, return checklists from boards user has access to
      where.card = {
        column: {
          board: {
            OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
          },
        },
      };
    }

    const checklists = await prisma.checklist.findMany({
      where,
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        card: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(checklists);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    return NextResponse.json({ error: 'Failed to fetch checklists' }, { status: 500 });
  }
}

// POST /api/checklists - Create new checklist
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = createChecklistSchema.parse(await req.json());

    const { cardId, title } = body;

    // Check if card exists and user has access
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: {
          include: {
            board: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const hasAccess =
      card.column.board.ownerId === session.user.id ||
      card.column.board.members.some((m: { userId: string }) => m.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const checklist = await prisma.checklist.create({
      data: {
        title: title.trim(),
        cardId,
      },
      include: {
        items: true,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        action: 'checklist_created',
        entityType: 'checklist',
        entityId: checklist.id,
        userId: session.user.id,
        boardId: card.column.boardId,
        cardId: card.id,
      },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    console.error('Error creating checklist:', error);
    return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 });
  }
}
