/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

// Mock the auth and prisma modules
jest.mock('../../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    boardTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    board: {
      findUnique: jest.fn(),
    },
  },
}));

import { POST as createTemplate } from '../../../src/app/api/templates/route';
import { POST as copyFromTemplate } from '../../../src/app/api/templates/copy/route';
import { POST as saveAsTemplate } from '../../../src/app/api/templates/save/route';

describe('Templates API', () => {
  let mockReq: jest.Mocked<NextRequest>;
  let mockHeaders: jest.Mocked<Headers>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockHeaders = new Headers();
    mockReq = {
      headers: mockHeaders,
      json: jest.fn(),
    } as unknown as jest.Mocked<NextRequest>;
  });

  describe('POST /api/templates', () => {
    it('should create a template successfully', async () => {
      const { auth } = require('../../../src/lib/auth');
      const { prisma } = require('../../../src/lib/prisma');

      auth.api.getSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      mockReq.json.mockResolvedValue({
        name: 'Test Template',
        description: 'A test template',
        category: 'kanban',
        icon: '📋',
        columns: [
          { id: 'c1', name: 'To Do' },
          { id: 'c2', name: 'Done' },
        ],
      });

      const createdTemplate = {
        id: 'template-123',
        name: 'Test Template',
        description: 'A test template',
        category: 'kanban',
        icon: '📋',
        columns: JSON.stringify([
          { id: 'c1', name: 'To Do' },
          { id: 'c2', name: 'Done' },
        ]),
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.boardTemplate.create.mockResolvedValue(createdTemplate);

      const response = await createTemplate(mockReq);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe('Test Template');
    });

    it('should return 401 for unauthorized users', async () => {
      const { auth } = require('../../../src/lib/auth');
      auth.api.getSession.mockResolvedValue(null);

      const response = await createTemplate(mockReq);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/templates/copy', () => {
    it('should create board from template successfully', async () => {
      const { auth } = require('../../../src/lib/auth');
      const { prisma } = require('../../../src/lib/prisma');

      auth.api.getSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        description: 'A test template',
        category: 'kanban',
        icon: '📋',
        columns: JSON.stringify([
          { id: 'c1', name: 'To Do' },
          { id: 'c2', name: 'Done' },
        ]),
        ownerId: null, // Built-in template
      };

      prisma.boardTemplate.findUnique.mockResolvedValue(mockTemplate);

      mockReq.json.mockResolvedValue({
        templateId: 'template-123',
        name: 'My New Board',
      });

      const mockBoard = {
        id: 'board-123',
        name: 'My New Board',
        description: 'A test template',
        ownerId: 'user-123',
        columns: [
          { id: 'col1', name: 'To Do', position: 0 },
          { id: 'col2', name: 'Done', position: 1 },
        ],
      };

      prisma.board.create.mockResolvedValue(mockBoard);
      prisma.boardMember.create.mockResolvedValue({});

      const response = await copyFromTemplate(mockReq);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe('My New Board');
    });

    it('should return 404 for non-existent template', async () => {
      const { auth } = require('../../../src/lib/auth');
      const { prisma } = require('../../../src/lib/prisma');

      auth.api.getSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      prisma.boardTemplate.findUnique.mockResolvedValue(null);

      mockReq.json.mockResolvedValue({
        templateId: 'non-existent',
      });

      const response = await copyFromTemplate(mockReq);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/templates/save', () => {
    it('should save board as template successfully', async () => {
      const { auth } = require('../../../src/lib/auth');
      const { prisma } = require('../../../src/lib/prisma');

      auth.api.getSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      const mockBoard = {
        id: 'board-123',
        name: 'My Board',
        description: 'Board description',
        ownerId: 'user-123',
        columns: [
          { id: 'col1', name: 'To Do', position: 0 },
          { id: 'col2', name: 'Done', position: 1 },
        ],
      };

      prisma.board.findUnique.mockResolvedValue(mockBoard);

      mockReq.json.mockResolvedValue({
        boardId: 'board-123',
        name: 'My Template',
        description: 'Template description',
        category: 'kanban',
        icon: '📋',
      });

      const createdTemplate = {
        id: 'template-123',
        name: 'My Template',
        description: 'Template description',
        category: 'kanban',
        icon: '📋',
        columns: JSON.stringify([
          { id: 'col1', name: 'To Do' },
          { id: 'col2', name: 'Done' },
        ]),
        ownerId: 'user-123',
      };

      prisma.boardTemplate.create.mockResolvedValue(createdTemplate);

      const response = await saveAsTemplate(mockReq);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe('My Template');
    });

    it('should return 403 for boards owned by other users', async () => {
      const { auth } = require('../../../src/lib/auth');
      const { prisma } = require('../../../src/lib/prisma');

      auth.api.getSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      const mockBoard = {
        id: 'board-123',
        name: 'Other User Board',
        ownerId: 'other-user', // Different owner
      };

      prisma.board.findUnique.mockResolvedValue(mockBoard);

      mockReq.json.mockResolvedValue({
        boardId: 'board-123',
        name: 'My Template',
        category: 'kanban',
      });

      const response = await saveAsTemplate(mockReq);
      expect(response.status).toBe(403);
    });
  });
});