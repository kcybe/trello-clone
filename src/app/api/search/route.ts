import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Search query schema
const searchQuerySchema = z.object({
  query: z.string().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  dateFilter: z
    .enum([
      'any',
      'today',
      'tomorrow',
      'thisWeek',
      'nextWeek',
      'thisMonth',
      'overdue',
      'noDate',
      'specific',
    ])
    .optional(),
  specificDate: z.string().optional().nullable(),
  boardId: z.string().optional(),
  limit: z.number().optional().default(50),
  offset: z.number().optional().default(0),
});

type SearchFilters = z.infer<typeof searchQuerySchema>;

// Helper to build date filter
function buildDateFilter(dateFilter?: string, specificDate?: string | null) {
  if (!dateFilter || dateFilter === 'any') return {};

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  switch (dateFilter) {
    case 'today':
      return {
        dueDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      };
    case 'tomorrow':
      return {
        dueDate: {
          gte: tomorrow,
          lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        },
      };
    case 'thisWeek':
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (5 - today.getDay()));
      return {
        dueDate: {
          gte: today,
          lte: endOfWeek,
        },
      };
    case 'nextWeek':
      return {
        dueDate: {
          gte: nextWeek,
          lt: new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      };
    case 'thisMonth':
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        dueDate: {
          gte: today,
          lte: endOfMonth,
        },
      };
    case 'overdue':
      return {
        dueDate: {
          lt: today,
        },
      };
    case 'noDate':
      return {
        dueDate: null,
      };
    case 'specific':
      if (specificDate) {
        const targetDate = new Date(specificDate);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return {
          dueDate: {
            gte: targetDate,
            lt: nextDay,
          },
        };
      }
      return {};
    default:
      return {};
  }
}

// Calculate relevance score for sorting
function calculateRelevance(
  card: { title: string; description?: string | null },
  query: string
): number {
  const queryLower = query.toLowerCase();
  const titleLower = card.title.toLowerCase();
  const descLower = (card.description || '').toLowerCase();

  let score = 0;

  if (titleLower === queryLower) score += 10;
  else if (titleLower.startsWith(queryLower)) score += 8;
  else if (titleLower.includes(queryLower)) score += 5;

  if (descLower.includes(queryLower)) score += 2;

  return score;
}

// GET /api/search - Search cards with filters
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const query: SearchFilters = {
      query: searchParams.get('query') || undefined,
      labels: searchParams.get('labels')?.split(',').filter(Boolean) || undefined,
      assignees: searchParams.get('assignees')?.split(',').filter(Boolean) || undefined,
      dateFilter: (searchParams.get('dateFilter') as SearchFilters['dateFilter']) || undefined,
      specificDate: searchParams.get('specificDate') || undefined,
      boardId: searchParams.get('boardId') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    };

    const validatedQuery = searchQuerySchema.parse(query);

    const where: Record<string, unknown> = {};

    if (validatedQuery.query) {
      where.OR = [
        { title: { contains: validatedQuery.query } },
        { description: { contains: validatedQuery.query } },
      ];
    }

    if (validatedQuery.labels && validatedQuery.labels.length > 0) {
      where.column = {
        labels: {
          some: {
            name: { in: validatedQuery.labels },
          },
        },
      };
    }

    if (validatedQuery.assignees && validatedQuery.assignees.length > 0) {
      where.assignees = {
        some: {
          OR: [
            { name: { in: validatedQuery.assignees } },
            { email: { in: validatedQuery.assignees } },
            { id: { in: validatedQuery.assignees } },
          ],
        },
      };
    }

    const dateFilter = buildDateFilter(validatedQuery.dateFilter, validatedQuery.specificDate);
    if (Object.keys(dateFilter).length > 0) {
      Object.assign(where, dateFilter);
    }

    if (validatedQuery.boardId) {
      where.column = {
        ...((where.column as object) || {}),
        boardId: validatedQuery.boardId,
      };
    } else {
      where.column = {
        ...((where.column as object) || {}),
        board: {
          OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
        },
      };
    }

    const [cards, totalCount] = await Promise.all([
      prisma.card.findMany({
        where,
        include: {
          column: {
            include: {
              board: {
                select: { id: true, name: true },
              },
            },
          },
          assignees: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        take: validatedQuery.limit,
        skip: validatedQuery.offset,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.card.count({ where }),
    ]);

    const results = cards.map(card => ({
      id: card.id,
      title: card.title,
      description: card.description || undefined,
      labels: [],
      assignee: card.assignees[0]?.name,
      assignees: card.assignees,
      dueDate: card.dueDate,
      columnId: card.columnId,
      columnName: card.column.name,
      boardId: card.column.board.id,
      boardName: card.column.board.name,
      matchedFields: validatedQuery.query
        ? [
            ...(card.title.toLowerCase().includes(validatedQuery.query.toLowerCase())
              ? ['title']
              : []),
            ...(card.description?.toLowerCase().includes(validatedQuery.query.toLowerCase())
              ? ['description']
              : []),
          ]
        : [],
      relevanceScore: validatedQuery.query ? calculateRelevance(card, validatedQuery.query) : 1,
    }));

    return NextResponse.json({
      cards: results,
      totalCount,
      hasMore: validatedQuery.offset + results.length < totalCount,
    });
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid search query',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

// POST /api/search - Advanced search with body
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedQuery = searchQuerySchema.parse(body);

    const where: Record<string, unknown> = {};

    if (validatedQuery.query) {
      where.OR = [
        { title: { contains: validatedQuery.query } },
        { description: { contains: validatedQuery.query } },
      ];
    }

    if (validatedQuery.labels && validatedQuery.labels.length > 0) {
      where.column = {
        labels: {
          some: {
            name: { in: validatedQuery.labels },
          },
        },
      };
    }

    if (validatedQuery.assignees && validatedQuery.assignees.length > 0) {
      where.assignees = {
        some: {
          OR: [
            { name: { in: validatedQuery.assignees } },
            { email: { in: validatedQuery.assignees } },
            { id: { in: validatedQuery.assignees } },
          ],
        },
      };
    }

    const dateFilter = buildDateFilter(validatedQuery.dateFilter, validatedQuery.specificDate);
    if (Object.keys(dateFilter).length > 0) {
      Object.assign(where, dateFilter);
    }

    if (validatedQuery.boardId) {
      where.column = {
        ...((where.column as object) || {}),
        boardId: validatedQuery.boardId,
      };
    } else {
      where.column = {
        ...((where.column as object) || {}),
        board: {
          OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
        },
      };
    }

    const [cards, totalCount] = await Promise.all([
      prisma.card.findMany({
        where,
        include: {
          column: {
            include: {
              board: {
                select: { id: true, name: true },
              },
            },
          },
          assignees: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        take: validatedQuery.limit,
        skip: validatedQuery.offset,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.card.count({ where }),
    ]);

    const results = cards.map(card => ({
      id: card.id,
      title: card.title,
      description: card.description || undefined,
      labels: [],
      assignee: card.assignees[0]?.name,
      assignees: card.assignees,
      dueDate: card.dueDate,
      columnId: card.columnId,
      columnName: card.column.name,
      boardId: card.column.board.id,
      boardName: card.column.board.name,
      matchedFields: validatedQuery.query
        ? [
            ...(card.title.toLowerCase().includes(validatedQuery.query?.toLowerCase() || '')
              ? ['title']
              : []),
            ...(card.description?.toLowerCase().includes(validatedQuery.query?.toLowerCase() || '')
              ? ['description']
              : []),
          ]
        : [],
      relevanceScore: validatedQuery.query
        ? calculateRelevance(card, validatedQuery.query || '')
        : 1,
    }));

    return NextResponse.json({
      cards: results,
      totalCount,
      hasMore: validatedQuery.offset + results.length < totalCount,
    });
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid search query',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
