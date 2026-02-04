export type CardLabel = {
  id: string;
  text: string;
  color: string;
};

export type Card = {
  id: string;
  title: string;
  description?: string;
  labels?: CardLabel[];
  dueDate?: Date | null;
  createdAt: Date;
};

export type Column = {
  id: string;
  title: string;
  cards: Card[];
};

export type Board = {
  columns: Column[];
};
