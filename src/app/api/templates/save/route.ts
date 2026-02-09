import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const saveAsTemplateSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.enum(['kanban', 'scrum', 'bug-tracking', 'marketing', 'weekly-review']).optional(),
  icon: z.string().default('📋'),
});

// POST /api/templates/save - Save an existing board as a template
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = saveAsTemplateSchema.parse(await req.json());
    const { boardId, name, description, category, icon } = body;

    // Check if board exists and user has access
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: { orderBy: { position: 'asc' } } },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Only board owner can save as template
    if (board.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the board owner can save it as a template' }, { status: 403 });
    }

    // Extract column structure from board
    const columns = board.columns.map(col => ({
      id: col.id,
      name: col.name,
      color: col.color || undefined,
    }));

    // Create template from board
    const template = await prisma.boardTemplate.create({
      data: {
        name,
        description: description || board.description || null,
        category: category || 'kanban',
        icon,
        columns: JSON.stringify(columns),
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error saving board as template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save board as template' }, { status: 500 });
  }
}
