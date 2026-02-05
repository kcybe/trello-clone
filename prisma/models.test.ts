/**
 * Prisma Database Integration Tests
 * 
 * This test suite validates all Prisma model CRUD operations
 * and ensures data integrity with cascade deletes.
 */

import { testPrisma } from './setup';

// Use testPrisma from setup.ts which handles database isolation

describe('Prisma Database Integration', () => {
  // Clean up test database before and after tests
  beforeAll(async () => {
    // Clean up in correct order due to foreign key constraints
    await testPrisma.attachment.deleteMany();
    await testPrisma.activity.deleteMany();
    await testPrisma.comment.deleteMany();
    await testPrisma.card.deleteMany();
    await testPrisma.column.deleteMany();
    await testPrisma.boardShare.deleteMany();
    await testPrisma.boardMember.deleteMany();
    await testPrisma.session.deleteMany();
    await testPrisma.account.deleteMany();
    await testPrisma.board.deleteMany();
    await testPrisma.user.deleteMany();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe('User Model', () => {
    let testUserId: string;

    it('creates a user', async () => {
      const user = await testPrisma.user.create({
        data: {
          id: 'test-user-1',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: 'https://example.com/avatar.png',
        },
      });

      expect(user.id).toBe('test-user-1');
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      testUserId = user.id;
    });

    it('finds user by email', async () => {
      const user = await testPrisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Test User');
    });

    it('updates a user', async () => {
      const user = await testPrisma.user.update({
        where: { id: 'test-user-1' },
        data: { name: 'Updated Name' },
      });

      expect(user.name).toBe('Updated Name');
    });

    it('deletes a user', async () => {
      // Create a user to delete
      await testPrisma.user.create({
        data: {
          id: 'user-to-delete',
          name: 'Delete Me',
          email: 'delete@example.com',
          emailVerified: false,
        },
      });

      await testPrisma.user.delete({ where: { id: 'user-to-delete' } });

      const user = await testPrisma.user.findUnique({ where: { id: 'user-to-delete' } });
      expect(user).toBeNull();
    });
  });

  describe('Board Model', () => {
    let testBoardId: string;
    let testUserId: string;

    beforeAll(async () => {
      // Ensure test user exists
      const user = await testPrisma.user.upsert({
        where: { email: 'board-test@example.com' },
        update: {},
        create: {
          id: 'board-test-user',
          name: 'Board Test User',
          email: 'board-test@example.com',
          emailVerified: true,
        },
      });
      testUserId = user.id;
    });

    it('creates a board with columns', async () => {
      const board = await testPrisma.board.create({
        data: {
          name: 'Test Board',
          description: 'A test board',
          color: '#3B82F6',
          ownerId: testUserId,
          columns: {
            create: [
              { name: 'To Do', position: 0 },
              { name: 'In Progress', position: 1 },
              { name: 'Done', position: 2 },
            ],
          },
        },
        include: { columns: true },
      });

      expect(board.name).toBe('Test Board');
      expect(board.columns).toHaveLength(3);
      testBoardId = board.id;
    });

    it('finds board with columns and cards', async () => {
      const board = await testPrisma.board.findUnique({
        where: { id: testBoardId },
        include: {
          columns: {
            include: { cards: true },
            orderBy: { position: 'asc' },
          },
        },
      });

      expect(board).not.toBeNull();
      expect(board?.columns).toHaveLength(3);
    });

    it('updates a board', async () => {
      const board = await testPrisma.board.update({
        where: { id: testBoardId },
        data: { name: 'Updated Board Name', description: 'Updated description' },
      });

      expect(board.name).toBe('Updated Board Name');
      expect(board.description).toBe('Updated description');
    });

    it('creates board membership', async () => {
      const member = await testPrisma.boardMember.create({
        data: {
          boardId: testBoardId,
          userId: testUserId,
          role: 'admin',
        },
      });

      expect(member.boardId).toBe(testBoardId);
      expect(member.role).toBe('admin');
    });

    it('creates board share settings', async () => {
      const share = await testPrisma.boardShare.create({
        data: {
          boardId: testBoardId,
          shareToken: 'test-share-token-123',
          isPublic: true,
          canEdit: false,
        },
      });

      expect(share.boardId).toBe(testBoardId);
      expect(share.isPublic).toBe(true);
    });

    it('cascades delete on board delete', async () => {
      // Create a board with dependencies
      const board = await testPrisma.board.create({
        data: {
          name: 'Board to Delete',
          ownerId: testUserId,
          columns: {
            create: [{ name: 'Column 1', position: 0 }],
          },
        },
        include: { columns: true },
      });

      const columnId = board.columns[0].id;

      // Add a card
      await testPrisma.card.create({
        data: {
          title: 'Card to Delete',
          columnId,
          position: 0,
        },
      });

      // Delete the board
      await testPrisma.board.delete({ where: { id: board.id } });

      // Verify cascade delete
      const deletedBoard = await testPrisma.board.findUnique({ where: { id: board.id } });
      expect(deletedBoard).toBeNull();

      const deletedColumn = await testPrisma.column.findUnique({ where: { id: columnId } });
      expect(deletedColumn).toBeNull();
    });
  });

  describe('Column Model', () => {
    let testBoardId: string;
    let testColumnId: string;

    beforeAll(async () => {
      const user = await testPrisma.user.upsert({
        where: { email: 'column-test@example.com' },
        update: {},
        create: {
          id: 'column-test-user',
          name: 'Column Test User',
          email: 'column-test@example.com',
          emailVerified: true,
        },
      });

      const board = await testPrisma.board.create({
        data: {
          name: 'Column Test Board',
          ownerId: user.id,
        },
      });
      testBoardId = board.id;
    });

    it('creates a column', async () => {
      const column = await testPrisma.column.create({
        data: {
          name: 'New Column',
          boardId: testBoardId,
          position: 0,
        },
      });

      expect(column.name).toBe('New Column');
      expect(column.boardId).toBe(testBoardId);
      testColumnId = column.id;
    });

    it('finds columns by board', async () => {
      const columns = await testPrisma.column.findMany({
        where: { boardId: testBoardId },
        orderBy: { position: 'asc' },
      });

      expect(columns.length).toBeGreaterThanOrEqual(1);
    });

    it('updates a column', async () => {
      const column = await testPrisma.column.update({
        where: { id: testColumnId },
        data: { name: 'Updated Column Name' },
      });

      expect(column.name).toBe('Updated Column Name');
    });

    it('deletes a column', async () => {
      const column = await testPrisma.column.create({
        data: {
          name: 'Column to Delete',
          boardId: testBoardId,
          position: 10,
        },
      });

      await testPrisma.column.delete({ where: { id: column.id } });

      const deleted = await testPrisma.column.findUnique({ where: { id: column.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('Card Model', () => {
    let testBoardId: string;
    let testColumnId: string;
    let testUserId: string;
    let testCardId: string;

    beforeAll(async () => {
      const user = await testPrisma.user.upsert({
        where: { email: 'card-test@example.com' },
        update: {},
        create: {
          id: 'card-test-user',
          name: 'Card Test User',
          email: 'card-test@example.com',
          emailVerified: true,
        },
      });
      testUserId = user.id;

      const board = await testPrisma.board.create({
        data: {
          name: 'Card Test Board',
          ownerId: user.id,
        },
      });
      testBoardId = board.id;

      const column = await testPrisma.column.create({
        data: {
          name: 'Test Column',
          boardId: testBoardId,
          position: 0,
        },
      });
      testColumnId = column.id;
    });

    it('creates a card', async () => {
      const card = await testPrisma.card.create({
        data: {
          title: 'Test Card',
          description: 'Test description',
          columnId: testColumnId,
          position: 0,
        },
      });

      expect(card.title).toBe('Test Card');
      expect(card.columnId).toBe(testColumnId);
      testCardId = card.id;
    });

    it('finds card with column', async () => {
      const card = await testPrisma.card.findUnique({
        where: { id: testCardId },
        include: { column: true },
      });

      expect(card).not.toBeNull();
      expect(card?.column.name).toBe('Test Column');
    });

    it('updates a card', async () => {
      const card = await testPrisma.card.update({
        where: { id: testCardId },
        data: {
          title: 'Updated Card Title',
          description: 'Updated description',
          dueDate: new Date('2025-12-31'),
        },
      });

      expect(card.title).toBe('Updated Card Title');
      expect(card.dueDate).toBeDefined();
    });

    it('assigns user to card', async () => {
      const card = await testPrisma.card.update({
        where: { id: testCardId },
        data: {
          assignees: {
            connect: { id: testUserId },
          },
        },
        include: { assignees: true },
      });

      expect(card.assignees).toHaveLength(1);
      expect(card.assignees[0].id).toBe(testUserId);
    });

    it('moves card to different column', async () => {
      // Create another column
      const newColumn = await testPrisma.column.create({
        data: {
          name: 'Destination Column',
          boardId: testBoardId,
          position: 1,
        },
      });

      const card = await testPrisma.card.update({
        where: { id: testCardId },
        data: { columnId: newColumn.id },
      });

      expect(card.columnId).toBe(newColumn.id);
    });

    it('deletes a card', async () => {
      const card = await testPrisma.card.create({
        data: {
          title: 'Card to Delete',
          columnId: testColumnId,
          position: 100,
        },
      });

      await testPrisma.card.delete({ where: { id: card.id } });

      const deleted = await testPrisma.card.findUnique({ where: { id: card.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('Comment Model', () => {
    let testCardId: string;
    let testUserId: string;

    beforeAll(async () => {
      const user = await testPrisma.user.upsert({
        where: { email: 'comment-test@example.com' },
        update: {},
        create: {
          id: 'comment-test-user',
          name: 'Comment Test User',
          email: 'comment-test@example.com',
          emailVerified: true,
        },
      });
      testUserId = user.id;

      const board = await testPrisma.board.create({
        data: {
          name: 'Comment Test Board',
          ownerId: user.id,
        },
      });

      const column = await testPrisma.column.create({
        data: {
          name: 'Comment Test Column',
          boardId: board.id,
          position: 0,
        },
      });

      const card = await testPrisma.card.create({
        data: {
          title: 'Comment Test Card',
          columnId: column.id,
          position: 0,
        },
      });
      testCardId = card.id;
    });

    it('creates a comment', async () => {
      const comment = await testPrisma.comment.create({
        data: {
          content: 'This is a test comment',
          cardId: testCardId,
          userId: testUserId,
        },
      });

      expect(comment.content).toBe('This is a test comment');
      expect(comment.cardId).toBe(testCardId);
    });

    it('finds comments by card', async () => {
      const comments = await testPrisma.comment.findMany({
        where: { cardId: testCardId },
        include: { user: true },
      });

      expect(comments.length).toBeGreaterThanOrEqual(1);
      expect(comments[0].user.id).toBe(testUserId);
    });

    it('updates a comment', async () => {
      const comments = await testPrisma.comment.findMany({
        where: { cardId: testCardId },
      });

      const comment = await testPrisma.comment.update({
        where: { id: comments[0].id },
        data: { content: 'Updated comment content' },
      });

      expect(comment.content).toBe('Updated comment content');
    });

    it('deletes a comment', async () => {
      const comment = await testPrisma.comment.create({
        data: {
          content: 'Comment to delete',
          cardId: testCardId,
          userId: testUserId,
        },
      });

      await testPrisma.comment.delete({ where: { id: comment.id } });

      const deleted = await testPrisma.comment.findUnique({ where: { id: comment.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('Activity Model', () => {
    let testBoardId: string;
    let testCardId: string;
    let testColumnId: string;
    let testUserId: string;

    beforeAll(async () => {
      const user = await testPrisma.user.upsert({
        where: { email: 'activity-test@example.com' },
        update: {},
        create: {
          id: 'activity-test-user',
          name: 'Activity Test User',
          email: 'activity-test@example.com',
          emailVerified: true,
        },
      });
      testUserId = user.id;

      const board = await testPrisma.board.create({
        data: {
          name: 'Activity Test Board',
          ownerId: user.id,
        },
      });
      testBoardId = board.id;

      const column = await testPrisma.column.create({
        data: {
          name: 'Activity Test Column',
          boardId: testBoardId,
          position: 0,
        },
      });
      testColumnId = column.id;

      const card = await testPrisma.card.create({
        data: {
          title: 'Activity Test Card',
          columnId: testColumnId,
          position: 0,
        },
      });
      testCardId = card.id;
    });

    it('creates an activity', async () => {
      const activity = await testPrisma.activity.create({
        data: {
          action: 'card_created',
          entityType: 'card',
          entityId: testCardId,
          userId: testUserId,
          boardId: testBoardId,
          cardId: testCardId,
          details: JSON.stringify({ title: 'Activity Test Card' }),
        },
      });

      expect(activity.action).toBe('card_created');
      expect(activity.entityType).toBe('card');
    });

    it('finds activities by board', async () => {
      const activities = await testPrisma.activity.findMany({
        where: { boardId: testBoardId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      expect(activities.length).toBeGreaterThanOrEqual(1);
    });

    it('finds activities by card', async () => {
      const activities = await testPrisma.activity.findMany({
        where: { cardId: testCardId },
      });

      expect(activities.length).toBeGreaterThanOrEqual(1);
    });

    it('deletes activity by entity', async () => {
      const activity = await testPrisma.activity.create({
        data: {
          action: 'test_action',
          entityType: 'card',
          entityId: 'test-entity-id',
          userId: testUserId,
        },
      });

      await testPrisma.activity.deleteMany({
        where: { entityType: 'card', entityId: 'test-entity-id' },
      });

      const deleted = await testPrisma.activity.findUnique({ where: { id: activity.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('Attachment Model', () => {
    let testCardId: string;
    let testUserId: string;

    beforeAll(async () => {
      const user = await testPrisma.user.upsert({
        where: { email: 'attachment-test@example.com' },
        update: {},
        create: {
          id: 'attachment-test-user',
          name: 'Attachment Test User',
          email: 'attachment-test@example.com',
          emailVerified: true,
        },
      });
      testUserId = user.id;

      const board = await testPrisma.board.create({
        data: {
          name: 'Attachment Test Board',
          ownerId: user.id,
        },
      });

      const column = await testPrisma.column.create({
        data: {
          name: 'Attachment Test Column',
          boardId: board.id,
          position: 0,
        },
      });

      const card = await testPrisma.card.create({
        data: {
          title: 'Attachment Test Card',
          columnId: column.id,
          position: 0,
        },
      });
      testCardId = card.id;
    });

    it('creates an attachment', async () => {
      const attachment = await testPrisma.attachment.create({
        data: {
          cardId: testCardId,
          filename: 'test-document.pdf',
          url: '/uploads/test-document.pdf',
          mimeType: 'application/pdf',
          size: 1024000,
        },
      });

      expect(attachment.filename).toBe('test-document.pdf');
      expect(attachment.size).toBe(1024000);
    });

    it('finds attachments by card', async () => {
      const attachments = await testPrisma.attachment.findMany({
        where: { cardId: testCardId },
      });

      expect(attachments.length).toBeGreaterThanOrEqual(1);
    });

    it('deletes an attachment', async () => {
      const attachment = await testPrisma.attachment.create({
        data: {
          cardId: testCardId,
          filename: 'delete-me.pdf',
          url: '/uploads/delete-me.pdf',
          mimeType: 'application/pdf',
          size: 500,
        },
      });

      await testPrisma.attachment.delete({ where: { id: attachment.id } });

      const deleted = await testPrisma.attachment.findUnique({ where: { id: attachment.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('Complex Relationships', () => {
    it('creates a board with nested columns and cards', async () => {
      const user = await testPrisma.user.upsert({
        where: { email: 'nested-test@example.com' },
        update: {},
        create: {
          id: 'nested-test-user',
          name: 'Nested Test User',
          email: 'nested-test@example.com',
          emailVerified: true,
        },
      });

      const board = await testPrisma.board.create({
        data: {
          name: 'Nested Board',
          ownerId: user.id,
          columns: {
            create: [
              {
                name: 'Backlog',
                position: 0,
                cards: {
                  create: [
                    { title: 'Card 1', position: 0 },
                    { title: 'Card 2', position: 1 },
                  ],
                },
              },
              {
                name: 'Sprint',
                position: 1,
                cards: {
                  create: [
                    { title: 'Card 3', position: 0 },
                    { title: 'Card 4', position: 1 },
                    { title: 'Card 5', position: 2 },
                  ],
                },
              },
            ],
          },
        },
        include: {
          columns: {
            include: { cards: true },
            orderBy: { position: 'asc' },
          },
        },
      });

      expect(board.columns).toHaveLength(2);
      expect(board.columns[0].cards).toHaveLength(2);
      expect(board.columns[1].cards).toHaveLength(5);
    });

    it('creates card with assignees and comments', async () => {
      const user1 = await testPrisma.user.upsert({
        where: { email: 'assignee1@example.com' },
        update: {},
        create: {
          id: 'assignee-user-1',
          name: 'Assignee 1',
          email: 'assignee1@example.com',
          emailVerified: true,
        },
      });

      const user2 = await testPrisma.user.upsert({
        where: { email: 'assignee2@example.com' },
        update: {},
        create: {
          id: 'assignee-user-2',
          name: 'Assignee 2',
          email: 'assignee2@example.com',
          emailVerified: true,
        },
      });

      const board = await testPrisma.board.create({
        data: {
          name: 'Assignee Board',
          ownerId: user1.id,
        },
      });

      const column = await testPrisma.column.create({
        data: {
          name: 'Assignee Column',
          boardId: board.id,
          position: 0,
        },
      });

      const card = await testPrisma.card.create({
        data: {
          title: 'Assigned Card',
          columnId: column.id,
          position: 0,
          assignees: {
            connect: [{ id: user1.id }, { id: user2.id }],
          },
          comments: {
            create: [
              {
                content: 'First comment',
                userId: user1.id,
              },
              {
                content: 'Second comment',
                userId: user2.id,
              },
            ],
          },
        },
        include: {
          assignees: true,
          comments: { include: { user: true } },
        },
      });

      expect(card.assignees).toHaveLength(2);
      expect(card.comments).toHaveLength(2);
    });
  });
});
