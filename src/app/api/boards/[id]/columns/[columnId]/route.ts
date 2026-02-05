import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitColumnDeleted, emitColumnUpdated } from '@/lib/socket/server-only';

const updateColumnSchema = z.object({
  name: z.string().min(1).max(50, 'Column name must be 1-50 characters').optional(),
  position: z.number().int().optional(),
});

// GET /api/boards/[id]/columns/[columnId] - Get a single column
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  try {
    const { id: boardId, columnId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to the board
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        boardId,
      },
      include: {
        cards: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    return NextResponse.json(column);
  } catch (error) {
    console.error('Error fetching column:', error);
    return NextResponse.json({ error: 'Failed to fetch column' }, { status: 500 });
  }
}

// PUT /api/boards/[id]/columns/[columnId] - Update a column
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  try {
    const { id: boardId, columnId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to the board
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: { in: ['admin', 'member'] } } } },
        ],
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
    }

    const body = updateColumnSchema.parse(await req.json());
    const { name, position } = body;

    // Check if column exists
    const existingColumn = await prisma.column.findFirst({
      where: { id: columnId, boardId },
    });

    if (!existingColumn) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (position !== undefined) updateData.position = position;

    const column = await prisma.column.update({
      where: { id: columnId },
      data: updateData,
      include: {
        cards: true,
      },
    });

    // Emit socket event
    emitColumnUpdated(boardId, columnId, updateData);

    return NextResponse.json(column);
  } catch (error) {
    console.error('Error updating column:', error);
    return NextResponse.json({ error: 'Failed to update column' }, { status: 500 });
  }
}

// DELETE /api/boards/[id]/columns/[columnId] - Delete a column
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  try {
    const { id: boardId, columnId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to the board (must be owner or admin)
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: 'admin' } } },
        ],
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
    }

    // Check if column exists
    const column = await prisma.column.findFirst({
      where: { id: columnId, boardId },
    });

    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    // Delete the column (cascade will delete cards)
    await prisma.column.delete({
      where: { id: columnId },
    });

    // Emit socket event
    emitColumnDeleted(boardId, columnId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting column:', error);
    return NextResponse.json({ error: 'Failed to delete column' }, { status: 500 });
  }
}
