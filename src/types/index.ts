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
  cards: Card[];
  archivedCards?: Card[];
};

export type Board = {
  columns: Column[];
};
