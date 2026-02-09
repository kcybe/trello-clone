import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  cardId: z.string().min(1, 'Card ID is required'),
});

// GET /api/comments - List all comments (with optional filters)
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('cardId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (cardId) {
      where.cardId = cardId;
      // Verify user has access to the card's board
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

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        card: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.comment.count({ where });

    return NextResponse.json({
      comments,
      total,
      hasMore: offset + comments.length < total,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/comments - Create a new comment
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = createCommentSchema.parse(await req.json());
    const { content, cardId } = body;

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

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        cardId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        card: {
          select: { id: true, title: true },
        },
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        action: 'commented',
        entityType: 'card',
        entityId: cardId,
        details: JSON.stringify({ commentId: comment.id, preview: content.substring(0, 100) }),
        userId: session.user.id,
        boardId: card.column.boardId,
        cardId: card.id,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
