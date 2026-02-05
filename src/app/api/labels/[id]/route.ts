import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().min(1).max(20).optional(),
});

// GET /api/labels/[id] - Get single label
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const label = await prisma.label.findFirst({
      where: {
        id,
        column: {
          board: {
            OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
          },
        },
      },
      include: {
        column: {
          select: { id: true, name: true },
        },
      },
    });

    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    return NextResponse.json(label);
  } catch (error) {
    console.error('Error fetching label:', error);
    return NextResponse.json({ error: 'Failed to fetch label' }, { status: 500 });
  }
}

// PUT /api/labels/[id] - Update label
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, color } = body;

    // Check if user has access
    const existingLabel = await prisma.label.findFirst({
      where: {
        id,
        column: {
          board: {
            OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
          },
        },
      },
    });

    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found or access denied' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color.trim();
    updateData.updatedAt = new Date();

    const label = await prisma.label.update({
      where: { id },
      data: updateData,
      include: {
        column: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(label);
  } catch (error) {
    console.error('Error updating label:', error);
    return NextResponse.json({ error: 'Failed to update label' }, { status: 500 });
  }
}

// DELETE /api/labels/[id] - Delete label
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access
    const label = await prisma.label.findFirst({
      where: {
        id,
        column: {
          board: {
            OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
          },
        },
      },
    });

    if (!label) {
      return NextResponse.json({ error: 'Label not found or access denied' }, { status: 404 });
    }

    await prisma.label.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 });
  }
}
