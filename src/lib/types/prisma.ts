/**
 * Prisma Type Exports
 *
 * This module exports all Prisma-related types for use throughout the application.
 */
import type {
  User,
  Session,
  Account,
  Board,
  BoardShare,
  BoardMember,
  Column,
  Card,
  Comment,
  Activity,
  Attachment,
} from '@prisma/client';

// Re-export all models
export type {
  User,
  Session,
  Account,
  Board,
  BoardShare,
  BoardMember,
  Column,
  Card,
  Comment,
  Activity,
  Attachment,
};

// ============ Composite Types ============

export type BoardWithDetails = Board & {
  columns: ColumnWithCards[];
  owner: User;
  members: BoardMemberWithUser[];
  share: BoardShare | null;
};

export type ColumnWithCards = Column & {
  cards: Card[];
};

export type ColumnWithDetails = Column & {
  board: Board;
  cards: Card[];
};

export type CardWithDetails = Card & {
  column: Column;
  assignees: User[];
  comments: CommentWithUser[];
  activities: ActivityWithUser[];
  attachments: Attachment[];
};

export type CardWithAssignees = Card & {
  assignees: User[];
};

export type CommentWithUser = Comment & {
  user: User;
};

export type ActivityWithUser = Activity & {
  user: User;
};

export type BoardMemberWithUser = BoardMember & {
  user: User;
};

export type AttachmentWithDetails = Attachment & {
  card: Card;
};

// ============ Input Types ============

export type CreateBoardInput = {
  name: string;
  description?: string | null;
  color?: string | null;
  ownerId: string;
};

export type UpdateBoardInput = {
  name?: string;
  description?: string | null;
  color?: string | null;
};

export type CreateColumnInput = {
  name: string;
  boardId: string;
  position?: number;
};

export type UpdateColumnInput = {
  name?: string;
  position?: number;
};

export type CreateCardInput = {
  title: string;
  description?: string | null;
  columnId: string;
  position?: number;
  dueDate?: Date | null;
};

export type UpdateCardInput = {
  title?: string;
  description?: string | null;
  columnId?: string;
  position?: number;
  dueDate?: Date | null;
};

export type CreateCommentInput = {
  content: string;
  cardId: string;
  userId: string;
};

export type CreateActivityInput = {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  boardId?: string | null;
  cardId?: string | null;
  details?: string | null;
};

export type CreateAttachmentInput = {
  cardId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
};

// ============ Where Types ============

export type BoardWhereInput = {
  id?: string;
  ownerId?: string;
  name?: { contains?: string };
  description?: { contains?: string };
};

export type ColumnWhereInput = {
  id?: string;
  boardId?: string;
  name?: { contains?: string };
};

export type CardWhereInput = {
  id?: string;
  columnId?: string;
  title?: { contains?: string };
};

export type CommentWhereInput = {
  id?: string;
  cardId?: string;
  userId?: string;
};

export type ActivityWhereInput = {
  id?: string;
  boardId?: string;
  cardId?: string;
  userId?: string;
  entityType?: string;
};

// ============ Order Types ============

export type BoardOrderByInput = {
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
  name?: 'asc' | 'desc';
};

export type ColumnOrderByInput = {
  position?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
};

export type CardOrderByInput = {
  position?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
  dueDate?: 'asc' | 'desc';
};
