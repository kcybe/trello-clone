import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const copyFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  name: z.string().min(1, 'Board name is required'),
  description: z.string().optional(),
});

// Built-in templates data
const BUILT_IN_TEMPLATES: Record<string, Array<{ id: string; name: string; color?: string }>> = {
  'kanban-basic': [
    { id: 'backlog', name: 'Backlog', color: '#6b7280' },
    { id: 'todo', name: 'To Do', color: '#3b82f6' },
    { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
    { id: 'review', name: 'Review', color: '#8b5cf6' },
    { id: 'done', name: 'Done', color: '#22c55e' },
  ],
  'scrum-sprint': [
    { id: 'product-backlog', name: 'Product Backlog', color: '#64748b' },
    { id: 'sprint-backlog', name: 'Sprint Backlog', color: '#3b82f6' },
    { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
    { id: 'testing', name: 'Testing', color: '#8b5cf6' },
    { id: 'done', name: 'Done', color: '#22c55e' },
  ],
  'bug-tracking': [
    { id: 'new', name: 'New', color: '#64748b' },
    { id: 'confirmed', name: 'Confirmed', color: '#3b82f6' },
    { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
    { id: 'fixed', name: 'Fixed', color: '#22c55e' },
    { id: 'verified', name: 'Verified', color: '#10b981' },
    { id: 'closed', name: 'Closed', color: '#6b7280' },
  ],
  'marketing-campaign': [
    { id: 'ideas', name: 'Ideas', color: '#8b5cf6' },
    { id: 'planning', name: 'Planning', color: '#3b82f6' },
    { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
    { id: 'review', name: 'Review', color: '#ec4899' },
    { id: 'approved', name: 'Approved', color: '#22c55e' },
    { id: 'live', name: 'Live', color: '#14b8a6' },
  ],
  'weekly-review': [
    { id: 'this-week', name: 'This Week', color: '#3b82f6' },
    { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
    { id: 'completed', name: 'Completed', color: '#22c55e' },
    { id: 'next-week', name: 'Next Week', color: '#64748b' },
    { id: 'notes', name: 'Notes', color: '#8b5cf6' },
  ],
};

// POST /api/templates/copy - Create a new board from a template
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = copyFromTemplateSchema.parse(await req.json());
    const { templateId, name, description } = body;

    let columns: Array<{ id: string; name: string; color?: string }>;
    let templateOwnerId: string | null = null;

    // Check if it's a built-in template
    if (BUILT_IN_TEMPLATES[templateId]) {
      columns = BUILT_IN_TEMPLATES[templateId];
    } else {
      // Check user templates
      const userTemplate = await prisma.boardTemplate.findUnique({
        where: { id: templateId },
      });

      if (!userTemplate) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      if (userTemplate.ownerId && userTemplate.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      columns = JSON.parse(userTemplate.columns) as Array<{ id: string; name: string; color?: string }>;
      templateOwnerId = userTemplate.ownerId;
    }

    // Create the board
    const board = await prisma.board.create({
      data: {
        name,
        description: description || null,
        ownerId: session.user.id,
      },
    });

    // Create columns from template
    const createdColumns = await Promise.all(
      columns.map((col, index) =>
        prisma.column.create({
          data: {
            name: col.name,
            color: col.color || null,
            position: index,
            boardId: board.id,
          },
        })
      )
    );

    // Add owner as board member
    await prisma.boardMember.create({
      data: {
        boardId: board.id,
        userId: session.user.id,
        role: 'admin',
      },
    });

    return NextResponse.json({
      ...board,
      columns: createdColumns.map((col, index) => ({
        id: col.id,
        name: col.name,
        color: col.color,
        position: index,
      })),
    });
  } catch (error) {
    console.error('Error copying from template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create board from template' }, { status: 500 });
  }
}
