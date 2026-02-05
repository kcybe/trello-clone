import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateItemSchema = z.object({
  text: z.string().min(1, 'Item text is required').optional(),
  checked: z.boolean().optional(),
});

// GET /api/checklists/[id]/items/[itemId] - Get single checklist item
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.checklistItem.findFirst({
      where: {
        id: itemId,
        checklistId: id,
        checklist: {
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
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching checklist item:', error);
    return NextResponse.json({ error: 'Failed to fetch checklist item' }, { status: 500 });
  }
}

// PUT /api/checklists/[id]/items/[itemId] - Update checklist item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = updateItemSchema.parse(await req.json());

    // Check if item exists and user has access
    const existingItem = await prisma.checklistItem.findFirst({
      where: {
        id: itemId,
        checklistId: id,
        checklist: {
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
      },
      include: {
        checklist: {
          include: {
            card: {
              include: {
                column: {
                  include: { board: true },
                },
              },
            },
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Checklist item not found or access denied' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (body.text !== undefined) {
      updateData.text = body.text.trim();
    }
    if (body.checked !== undefined) {
      updateData.checked = body.checked;
    }

    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating checklist item:', error);
    return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 });
  }
}

// DELETE /api/checklists/[id]/items/[itemId] - Delete checklist item
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if item exists and user has access
    const item = await prisma.checklistItem.findFirst({
      where: {
        id: itemId,
        checklistId: id,
        checklist: {
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
      },
      include: {
        checklist: {
          include: {
            card: {
              include: {
                column: {
                  include: { board: true },
                },
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Checklist item not found or access denied' },
        { status: 404 }
      );
    }

    await prisma.checklistItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    return NextResponse.json({ error: 'Failed to delete checklist item' }, { status: 500 });
  }
}
