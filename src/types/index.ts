export type ActivityType =
  | 'card_created'
  | 'card_moved'
  | 'card_edited'
  | 'card_archived'
  | 'card_restored'
  | 'card_deleted'
  | 'card_duplicated'
  | 'comment_added'
  | 'due_date_set'
  | 'due_date_changed'
  | 'label_added'
  | 'member_assigned';

export type Activity = {
  id: string;
  type: ActivityType;
  cardId: string;
  cardTitle: string;
  fromColumnId?: string;
  fromColumnName?: string;
  toColumnId?: string;
  toColumnName?: string;
  description?: string;
  timestamp: Date;
  user: string;
};

export type CardLabel = {
  id: string;
  text: string;
  color: string;
};

export type CardAttachment = {
  id: string;
  name: string;
  url: string;
  type: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
};

export type Checklist = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

export type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
};

export type Card = {
  id: string;
  title: string;
  description?: string;
  labels?: CardLabel[];
  assignee?: string;
  attachments?: CardAttachment[];
  checklists?: Checklist[];
  dueDate?: Date | null;
  createdAt: Date;
  comments?: Comment[];
  archived?: boolean;
  color?: string;
};

export type Column = {
  id: string;
  title: string;
  name: string;
  cards: Card[];
  archivedCards?: Card[];
};

export type Board = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  columns: Column[];
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }>;
};

export type BoardList = {
  boards: Board[];
  currentBoardId: string | null;
};

// API response types
export type ApiBoard = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  columns: ApiColumn[];
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }>;
};

export type ApiColumn = {
  id: string;
  name: string;
  position: number;
  boardId: string;
  cards: ApiCard[];
  createdAt: string;
  updatedAt: string;
};

export type ApiCard = {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  columnId: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  assignees?: Array<{
    id: string;
    name: string;
    email: string;
    image?: string | null;
  }>;
};

export type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
};
