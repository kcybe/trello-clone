import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateChecklistSchema = z.object({
  title: z.string().min(1, 'Checklist title is required').optional(),
});

// GET /api/checklists/[id] - Get single checklist
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
        card: {
          select: { id: true, title: true },
        },
      },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    return NextResponse.json(checklist);
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
  }
}

// PUT /api/checklists/[id] - Update checklist
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = updateChecklistSchema.parse(await req.json());

    // Check if checklist exists and user has access
    const existingChecklist = await prisma.checklist.findFirst({
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

    if (!existingChecklist) {
      return NextResponse.json({ error: 'Checklist not found or access denied' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }

    const checklist = await prisma.checklist.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json(checklist);
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 });
  }
}

// DELETE /api/checklists/[id] - Delete checklist
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    await prisma.checklist.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    return NextResponse.json({ error: 'Failed to delete checklist' }, { status: 500 });
  }
}
