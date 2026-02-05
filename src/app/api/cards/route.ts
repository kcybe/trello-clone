import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createCardSchema = z.object({
  title: z.string().min(1, 'Card title is required'),
  description: z.string().optional().nullable(),
  columnId: z.string().min(1, 'Column ID is required'),
  position: z.number().optional(),
  dueDate: z.string().optional().nullable(),
});

// GET /api/cards - List cards for user (optional filter by board)
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId');

    const where: Record<string, unknown> = {};

    if (boardId) {
      where.column = { boardId };
    }

    const cards = await prisma.card.findMany({
      where,
      include: {
        column: {
          include: {
            board: {
              select: { id: true, name: true },
            },
          },
        },
        assignees: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

// POST /api/cards - Create new card
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = createCardSchema.parse(await req.json());

    const { title, description, columnId, position, dueDate } = body;

    // Check if column exists and user has access
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    const hasAccess =
      column.board.ownerId === session.user.id ||
      column.board.members.some((m: { userId: string }) => m.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get max position if not provided
    let cardPosition = position;
    if (cardPosition === undefined) {
      const maxPos = await prisma.card.findFirst({
        where: { columnId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      cardPosition = (maxPos?.position ?? -1) + 1;
    }

    const card = await prisma.card.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        columnId,
        position: cardPosition,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        column: true,
        assignees: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        action: 'card_created',
        entityType: 'card',
        entityId: card.id,
        userId: session.user.id,
        boardId: column.boardId,
        cardId: card.id,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}
