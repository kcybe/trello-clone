export type Card = {
  id: string;
  title: string;
  description?: string;
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
