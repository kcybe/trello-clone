import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { GET, POST } from './route';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAuth = auth as jest.Mocked<typeof auth>;

describe('Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.api.getSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
      session: { id: 'session-1' },
    });

    mockPrisma.card.findMany.mockResolvedValue([]);
    mockPrisma.card.count.mockResolvedValue(0);
  });

  describe('GET /api/search', () => {
    it('returns unauthorized when no session', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/search');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('searches cards with text query', async () => {
      mockPrisma.card.findMany.mockResolvedValue([
        {
          id: 'card-1',
          title: 'Test Card',
          description: 'Test description',
          position: 0,
          columnId: 'col-1',
          dueDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          column: {
            name: 'To Do',
            board: { id: 'board-1', name: 'Test Board' },
          },
          assignees: [],
        },
      ]);
      mockPrisma.card.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/search?query=Test');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.cards).toHaveLength(1);
      expect(data.cards[0].title).toBe('Test Card');
      expect(data.totalCount).toBe(1);
    });

    it('filters cards by labels', async () => {
      mockPrisma.card.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/search?labels=Urgent,High%20Priority');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            column: expect.objectContaining({
              labels: expect.objectContaining({
                some: expect.objectContaining({
                  name: { in: ['Urgent', 'High Priority'] },
                }),
              }),
            }),
          }),
        })
      );
    });

    it('filters cards by assignees', async () => {
      mockPrisma.card.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost/api/search?assignees=alice@example.com,bob@example.com'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignees: expect.objectContaining({
              some: expect.objectContaining({
                OR: expect.arrayContaining([
                  { email: { in: ['alice@example.com', 'bob@example.com'] } },
                ]),
              }),
            }),
          }),
        })
      );
    });

    it('filters cards by due date - today', async () => {
      mockPrisma.card.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/search?dateFilter=today');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: expect.objectContaining({
              gte: expect.any(Date),
              lt: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('respects pagination parameters', async () => {
      mockPrisma.card.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/search?limit=10&offset=20');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe('POST /api/search', () => {
    it('returns unauthorized when no session', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'test' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('searches cards with body parameters', async () => {
      mockPrisma.card.findMany.mockResolvedValue([
        {
          id: 'card-1',
          title: 'Body Search Card',
          description: 'Body description',
          position: 0,
          columnId: 'col-1',
          dueDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          column: {
            name: 'To Do',
            board: { id: 'board-1', name: 'Test Board' },
          },
          assignees: [],
        },
      ]);
      mockPrisma.card.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'body search',
          labels: ['Bug'],
          assignees: ['alice@example.com'],
          dateFilter: 'overdue',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.cards).toHaveLength(1);
      expect(data.cards[0].title).toBe('Body Search Card');
    });
  });
});
