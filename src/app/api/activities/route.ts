import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createActivitySchema = z.object({
  action: z.string().min(1, 'Action is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
  details: z.string().optional(),
  boardId: z.string().optional(),
  cardId: z.string().optional(),
});

// GET /api/activities - List activities (with optional filters)
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId');
    const cardId = searchParams.get('cardId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    // If filtering by boardId, verify user has access
    if (boardId) {
      where.boardId = boardId;
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          members: true,
        },
      });

      if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
      }

      const hasAccess =
        board.ownerId === session.user.id ||
        board.members.some((m: { userId: string }) => m.userId === session.user.id);

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // If filtering by cardId, verify user has access
    if (cardId) {
      where.cardId = cardId;
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
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        board: {
          select: { id: true, name: true },
        },
        card: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.activity.count({ where });

    return NextResponse.json({
      activities,
      total,
      hasMore: offset + activities.length < total,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// POST /api/activities - Create a new activity (for internal use)
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = createActivitySchema.parse(await req.json());
    const { action, entityType, entityId, details, boardId, cardId } = body;

    // Verify board access if boardId is provided
    if (boardId) {
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          members: true,
        },
      });

      if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
      }

      const hasAccess =
        board.ownerId === session.user.id ||
        board.members.some((m: { userId: string }) => m.userId === session.user.id);

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const activity = await prisma.activity.create({
      data: {
        action,
        entityType,
        entityId,
        details: details || null,
        userId: session.user.id,
        boardId: boardId || null,
        cardId: cardId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        board: {
          select: { id: true, name: true },
        },
        card: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
