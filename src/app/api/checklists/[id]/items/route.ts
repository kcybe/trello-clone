import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createItemSchema = z.object({
  text: z.string().min(1, 'Item text is required'),
});

// GET /api/checklists/[id]/items - Get items for a checklist
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checklist = await prisma.checklist.findFirst({
      where: {
        id,
        card: {
          column: {
            board: {
              OR: [
                { ownerId: session.user.id },
                { members: { some: { userId: session.user.id } } },
              ],
            },
          },
        },
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    return NextResponse.json(checklist.items);
  } catch (error) {
    console.error('Error fetching checklist items:', error);
    return NextResponse.json({ error: 'Failed to fetch checklist items' }, { status: 500 });
  }
}

// POST /api/checklists/[id]/items - Create new checklist item
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = createItemSchema.parse(await req.json());

    const { text } = body;

    // Check if checklist exists and user has access
    const checklist = await prisma.checklist.findFirst({
      where: {
        id,
        card: {
          column: {
            board: {
              OR: [
                { ownerId: session.user.id },
                { members: { some: { userId: session.user.id } } },
              ],
            },
          },
        },
      },
      include: {
        card: {
          include: {
            column: {
              include: { board: true },
            },
          },
        },
      },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found or access denied' }, { status: 404 });
    }

    const item = await prisma.checklistItem.create({
      data: {
        text: text.trim(),
        checklistId: id,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        action: 'checklist_item_created',
        entityType: 'checklist_item',
        entityId: item.id,
        userId: session.user.id,
        boardId: checklist.card.column.boardId,
        cardId: checklist.cardId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating checklist item:', error);
    return NextResponse.json({ error: 'Failed to create checklist item' }, { status: 500 });
  }
}
