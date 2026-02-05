/**
 * Prisma Service Layer
 *
 * This module provides a centralized service layer for Prisma database operations.
 * Use these services instead of direct Prisma calls in API routes for better
 * code organization and reusability.
 */
import type {
  Prisma,
  Board,
  Column,
  Card,
  User,
  BoardMember,
  Comment,
  Activity,
  Attachment,
  BoardShare,
} from '@prisma/client';

import { prisma } from '@/lib/prisma';

// ============ User Service ============

export const userService = {
  async create(data: Prisma.UserCreateArgs['data']): Promise<User> {
    return prisma.user.create({ data });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findAll(): Promise<User[]> {
    return prisma.user.findMany();
  },

  async update(id: string, data: Prisma.UserUpdateArgs['data']): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  },

  async findBoards(userId: string): Promise<Board[]> {
    return prisma.board.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });
  },
};

// ============ Board Service ============

export const boardService = {
  async create(data: Prisma.BoardCreateArgs['data']): Promise<Board> {
    return prisma.board.create({ data });
  },

  async findById(
    id: string
  ): Promise<(Board & { columns: Column[]; owner: User; members: BoardMember[] }) | null> {
    return prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          include: { cards: true },
          orderBy: { position: 'asc' },
        },
        owner: true,
        members: {
          include: { user: true },
        },
      },
    });
  },

  async findAll(userId?: string): Promise<Board[]> {
    const where = userId ? { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } : {};
    return prisma.board.findMany({
      where,
      include: {
        columns: {
          include: { cards: true },
          orderBy: { position: 'asc' },
        },
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async update(id: string, data: Prisma.BoardUpdateArgs['data']): Promise<Board> {
    return prisma.board.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.board.delete({ where: { id } });
  },

  async addMember(boardId: string, userId: string, role: string = 'member'): Promise<BoardMember> {
    return prisma.boardMember.create({
      data: { boardId, userId, role },
    });
  },

  async removeMember(boardId: string, userId: string): Promise<void> {
    await prisma.boardMember.delete({
      where: { boardId_userId: { boardId, userId } },
    });
  },

  async getMembers(boardId: string): Promise<BoardMember[]> {
    return prisma.boardMember.findMany({
      where: { boardId },
      include: { user: true },
    });
  },

  async setShareSettings(
    boardId: string,
    settings: { isPublic?: boolean; canEdit?: boolean }
  ): Promise<BoardShare> {
    return prisma.boardShare.upsert({
      where: { boardId },
      update: { ...settings, updatedAt: new Date() },
      create: { boardId, shareToken: generateShareToken(), ...settings },
    });
  },

  async findByShareToken(shareToken: string): Promise<Board | null> {
    return prisma.board.findFirst({
      where: { share: { shareToken } },
      include: {
        columns: {
          include: { cards: true },
          orderBy: { position: 'asc' },
        },
        owner: { select: { id: true, name: true, email: true, image: true } },
      },
    });
  },
};

// ============ Column Service ============

export const columnService = {
  async create(data: Prisma.ColumnCreateArgs['data']): Promise<Column> {
    const maxPosition = await prisma.column.findFirst({
      where: { boardId: data.boardId as string },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return prisma.column.create({
      data: {
        ...data,
        position: (maxPosition?.position ?? -1) + 1,
      },
    });
  },

  async findById(id: string): Promise<Column | null> {
    return prisma.column.findUnique({
      where: { id },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
  },

  async findByBoard(boardId: string): Promise<Column[]> {
    return prisma.column.findMany({
      where: { boardId },
      include: { cards: { orderBy: { position: 'asc' } } },
      orderBy: { position: 'asc' },
    });
  },

  async update(id: string, data: Prisma.ColumnUpdateArgs['data']): Promise<Column> {
    return prisma.column.update({ where: { id }, data });
  },

  async delete(id: string): Promise<void> {
    await prisma.column.delete({ where: { id } });
  },

  async reorder(boardId: string, columnIds: string[]): Promise<void> {
    await prisma.$transaction(
      columnIds.map((id, index) =>
        prisma.column.update({
          where: { id },
          data: { position: index },
        })
      )
    );
  },
};

// ============ Card Service ============

export const cardService = {
  async create(data: Prisma.CardCreateArgs['data']): Promise<Card> {
    const { columnId } = data as { columnId: string };
    const maxPosition = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return prisma.card.create({
      data: {
        ...data,
        position: (maxPosition?.position ?? -1) + 1,
      },
    });
  },

  async findById(
    id: string
  ): Promise<(Card & { column: Column; assignees: User[]; comments: Comment[] }) | null> {
    return prisma.card.findUnique({
      where: { id },
      include: {
        column: true,
        assignees: true,
        comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      },
    });
  },

  async findByColumn(columnId: string): Promise<Card[]> {
    return prisma.card.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
    });
  },

  async update(id: string, data: Prisma.CardUpdateArgs['data']): Promise<Card> {
    return prisma.card.update({ where: { id }, data });
  },

  async delete(id: string): Promise<void> {
    await prisma.card.delete({ where: { id } });
  },

  async moveToColumn(cardId: string, newColumnId: string): Promise<Card> {
    const maxPosition = await prisma.card.findFirst({
      where: { columnId: newColumnId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return prisma.card.update({
      where: { id: cardId },
      data: {
        columnId: newColumnId,
        position: (maxPosition?.position ?? -1) + 1,
      },
    });
  },

  async assignToUser(cardId: string, userId: string): Promise<void> {
    await prisma.card.update({
      where: { id: cardId },
      data: { assignees: { connect: { id: userId } } },
    });
  },

  async unassignFromUser(cardId: string, userId: string): Promise<void> {
    await prisma.card.update({
      where: { id: cardId },
      data: { assignees: { disconnect: { id: userId } } },
    });
  },

  async reorderWithinColumn(columnId: string, cardIds: string[]): Promise<void> {
    await prisma.$transaction(
      cardIds.map((id, index) =>
        prisma.card.update({
          where: { id },
          data: { position: index },
        })
      )
    );
  },
};

// ============ Comment Service ============

export const commentService = {
  async create(data: Prisma.CommentCreateArgs['data']): Promise<Comment> {
    return prisma.comment.create({ data });
  },

  async findByCard(cardId: string): Promise<Comment[]> {
    return prisma.comment.findMany({
      where: { cardId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  async update(id: string, content: string): Promise<Comment> {
    return prisma.comment.update({
      where: { id },
      data: { content, updatedAt: new Date() },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.comment.delete({ where: { id } });
  },
};

// ============ Activity Service ============

export const activityService = {
  async create(data: Prisma.ActivityCreateArgs['data']): Promise<Activity> {
    return prisma.activity.create({ data });
  },

  async findByBoard(boardId: string): Promise<Activity[]> {
    return prisma.activity.findMany({
      where: { boardId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findByCard(cardId: string): Promise<Activity[]> {
    return prisma.activity.findMany({
      where: { cardId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async deleteByEntity(entityType: string, entityId: string): Promise<void> {
    await prisma.activity.deleteMany({
      where: { entityType, entityId },
    });
  },
};

// ============ Attachment Service ============

export const attachmentService = {
  async create(data: Prisma.AttachmentCreateArgs['data']): Promise<Attachment> {
    return prisma.attachment.create({ data });
  },

  async findByCard(cardId: string): Promise<Attachment[]> {
    return prisma.attachment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.attachment.delete({ where: { id } });
  },
};

// ============ Utility Functions ============

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Export all services as a single object
export const prismaServices = {
  user: userService,
  board: boardService,
  column: columnService,
  card: cardService,
  comment: commentService,
  activity: activityService,
  attachment: attachmentService,
};
