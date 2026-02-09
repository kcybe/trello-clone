import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createRelationSchema = z.object({
  targetCardId: z.string().min(1, 'Target card ID is required'),
  relationType: z.enum(['blocks', 'blocked_by', 'depends_on', 'related_to']),
});

// GET /api/cards/[cardId]/relations - Get all relations for a card
export async function GET(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    // Check if user has access to the card's board
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        column: {
          board: {
            OR: [
              { ownerId: session?.user?.id },
              { members: { some: { userId: session?.user?.id } } },
            ],
          },
        },
      },
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Get outgoing relations (cards this card points to)
    const outgoingRelations = await prisma.cardRelation.findMany({
      where: { sourceCardId: cardId },
      include: {
        targetCard: {
          include: {
            column: {
              include: {
                board: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    // Get incoming relations (cards that point to this card)
    const incomingRelations = await prisma.cardRelation.findMany({
      where: { targetCardId: cardId },
      include: {
        sourceCard: {
          include: {
            column: {
              include: {
                board: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    const relations = [
      ...outgoingRelations.map(r => ({
        id: r.id,
        sourceCardId: r.sourceCardId,
        targetCardId: r.targetCardId,
        relationType: r.relationType,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        sourceCard: {
          id: r.sourceCard.id,
          title: r.sourceCard.title,
          boardId: r.sourceCard.column.board.id,
          boardName: r.sourceCard.column.board.name,
          columnId: r.sourceCard.columnId,
          columnName: r.sourceCard.column.name,
        },
        targetCard: {
          id: r.targetCard.id,
          title: r.targetCard.title,
          boardId: r.targetCard.column.board.id,
          boardName: r.targetCard.column.board.name,
          columnId: r.targetCard.columnId,
          columnName: r.targetCard.column.name,
        },
      })),
      ...incomingRelations.map(r => ({
        id: r.id,
        sourceCardId: r.sourceCardId,
        targetCardId: r.targetCardId,
        relationType: r.relationType,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        sourceCard: {
          id: r.sourceCard.id,
          title: r.sourceCard.title,
          boardId: r.sourceCard.column.board.id,
          boardName: r.sourceCard.column.board.name,
          columnId: r.sourceCard.columnId,
          columnName: r.sourceCard.column.name,
        },
        targetCard: {
          id: r.targetCard.id,
          title: r.targetCard.title,
          boardId: r.targetCard.column.board.id,
          boardName: r.targetCard.column.board.name,
          columnId: r.targetCard.columnId,
          columnName: r.targetCard.column.name,
        },
      })),
    ];

    return NextResponse.json(relations);
  } catch (error) {
    console.error('Error fetching card relations:', error);
    return NextResponse.json({ error: 'Failed to fetch relations' }, { status: 500 });
  }
}

// POST /api/cards/[cardId]/relations - Create a new relation
export async function POST(req: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = createRelationSchema.parse(await req.json());
    const { targetCardId, relationType } = body;

    // Prevent self-reference
    if (cardId === targetCardId) {
      return NextResponse.json(
        { error: 'Cannot create relation to the same card' },
        { status: 400 }
      );
    }

    // Check if source card exists and user has access
    const sourceCard = await prisma.card.findFirst({
      where: {
        id: cardId,
        column: {
          board: {
            OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
          },
        },
      },
    });

    if (!sourceCard) {
      return NextResponse.json({ error: 'Source card not found' }, { status: 404 });
    }

    // Check if target card exists
    const targetCard = await prisma.card.findUnique({
      where: { id: targetCardId },
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!targetCard) {
      return NextResponse.json({ error: 'Target card not found' }, { status: 404 });
    }

    // Check if relation already exists
    const existingRelation = await prisma.cardRelation.findFirst({
      where: {
        sourceCardId: cardId,
        targetCardId,
      },
    });

    if (existingRelation) {
      return NextResponse.json({ error: 'Relation already exists' }, { status: 409 });
    }

    // Create the relation
    const relation = await prisma.cardRelation.create({
      data: {
        sourceCardId: cardId,
        targetCardId,
        relationType,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        action: 'card_related',
        entityType: 'card_relation',
        entityId: relation.id,
        userId: session.user.id,
        boardId: sourceCard.columnId
          ? (await prisma.column.findUnique({ where: { id: sourceCard.columnId } }))?.boardId
          : null,
        cardId: cardId,
        details: JSON.stringify({
          relationType,
          targetCardTitle: targetCard.title,
          targetBoardName: targetCard.column.board.name,
        }),
      },
    });

    return NextResponse.json(
      {
        id: relation.id,
        sourceCardId: relation.sourceCardId,
        targetCardId: relation.targetCardId,
        relationType: relation.relationType,
        createdAt: relation.createdAt.toISOString(),
        updatedAt: relation.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating card relation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create relation' }, { status: 500 });
  }
}

// DELETE /api/cards/[cardId]/relations - Delete a relation
export async function DELETE(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetCardId = searchParams.get('targetCardId');

    if (!targetCardId) {
      return NextResponse.json({ error: 'Target card ID is required' }, { status: 400 });
    }

    // Find the relation
    const relation = await prisma.cardRelation.findFirst({
      where: {
        sourceCardId: cardId,
        targetCardId,
      },
      include: {
        sourceCard: {
          include: {
            column: {
              include: { board: true },
            },
          },
        },
      },
    });

    if (!relation) {
      return NextResponse.json({ error: 'Relation not found' }, { status: 404 });
    }

    // Verify user has access
    const hasAccess =
      relation.sourceCard.column.board.ownerId === session.user.id ||
      (await prisma.boardMember.findFirst({
        where: {
          boardId: relation.sourceCard.column.board.id,
          userId: session.user.id,
        },
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.cardRelation.delete({
      where: { id: relation.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card relation:', error);
    return NextResponse.json({ error: 'Failed to delete relation' }, { status: 500 });
  }
}
