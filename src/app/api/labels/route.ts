import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createLabelSchema = z.object({
  name: z.string().min(1).max(50, 'Label name must be 1-50 characters'),
  color: z.string().min(1).max(20, 'Color must be 1-20 characters'),
  columnId: z.string().min(1),
});

// GET /api/labels - List all labels for user
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const labels = await prisma.label.findMany({
      where: {
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
  }
}

// POST /api/labels - Create new label
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = createLabelSchema.parse(await req.json());
    const { name, color, columnId } = body;

    // Verify user has access to the column's board
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: {
          OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
        },
      },
    });

    if (!column) {
      return NextResponse.json({ error: 'Column not found or access denied' }, { status: 404 });
    }

    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        color: color.trim(),
        columnId,
      },
      include: {
        column: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
  }
}
