import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.enum(['kanban', 'scrum', 'bug-tracking', 'marketing', 'weekly-review']),
  icon: z.string().default('📋'),
  columns: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string().optional(),
    })
  ),
});

// GET /api/templates - List all templates (built-in + user-created)
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    // Built-in templates
    const builtInTemplates = [
      {
        id: 'kanban-basic',
        name: 'Kanban Board',
        description: 'A classic Kanban board for managing work items',
        category: 'kanban',
        icon: '📋',
        columns: JSON.stringify([
          { id: 'backlog', name: 'Backlog', color: '#6b7280' },
          { id: 'todo', name: 'To Do', color: '#3b82f6' },
          { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
          { id: 'review', name: 'Review', color: '#8b5cf6' },
          { id: 'done', name: 'Done', color: '#22c55e' },
        ]),
      },
      {
        id: 'scrum-sprint',
        name: 'Scrum Sprint',
        description: 'Sprint planning and tracking with Scrum methodology',
        category: 'scrum',
        icon: '🏃',
        columns: JSON.stringify([
          { id: 'product-backlog', name: 'Product Backlog', color: '#64748b' },
          { id: 'sprint-backlog', name: 'Sprint Backlog', color: '#3b82f6' },
          { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
          { id: 'testing', name: 'Testing', color: '#8b5cf6' },
          { id: 'done', name: 'Done', color: '#22c55e' },
        ]),
      },
      {
        id: 'bug-tracking',
        name: 'Bug Tracking',
        description: 'Track and manage software bugs',
        category: 'bug-tracking',
        icon: '🐛',
        columns: JSON.stringify([
          { id: 'new', name: 'New', color: '#64748b' },
          { id: 'confirmed', name: 'Confirmed', color: '#3b82f6' },
          { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
          { id: 'fixed', name: 'Fixed', color: '#22c55e' },
          { id: 'verified', name: 'Verified', color: '#10b981' },
          { id: 'closed', name: 'Closed', color: '#6b7280' },
        ]),
      },
    ];

    // If authenticated, also get user-created templates
    let userTemplates: Array<{
      id: string;
      name: string;
      description: string | null;
      category: string;
      icon: string;
      columns: string;
      ownerId: string | null;
    }> = [];

    if (session?.user) {
      userTemplates = await prisma.boardTemplate.findMany({
        where: { ownerId: session.user.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    const templates = [...builtInTemplates, ...userTemplates];

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/templates - Create a new user template
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = createTemplateSchema.parse(await req.json());

    const template = await prisma.boardTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        icon: body.icon,
        columns: JSON.stringify(body.columns),
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
