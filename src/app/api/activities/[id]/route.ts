import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateActivitySchema = z.object({
  details: z.string().optional(),
});

// GET /api/activities/[id] - Get a single activity
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const activity = await prisma.activity.findUnique({
      where: { id },
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

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Check if user has access to the board/card
    if (activity.boardId) {
      const board = await prisma.board.findUnique({
        where: { id: activity.boardId },
        include: {
          members: true,
        },
      });

      if (board) {
        const hasAccess =
          board.ownerId === session.user.id ||
          board.members.some((m: { userId: string }) => m.userId === session.user.id);

        if (!hasAccess) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

// PUT /api/activities/[id] - Update an activity (admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = updateActivitySchema.parse(await req.json());
    const { details } = body;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        board: true,
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Only board owner can update activities
    if (activity.board && activity.board.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only board owner can update activities' },
        { status: 403 }
      );
    }

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        details: details || null,
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

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}

// DELETE /api/activities/[id] - Delete an activity (admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        board: true,
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Only board owner can delete activities
    if (activity.board && activity.board.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only board owner can delete activities' },
        { status: 403 }
      );
    }

    await prisma.activity.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}
