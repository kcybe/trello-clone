// Search Types for Advanced Search Feature

export type SearchFilterType = 'labels' | 'assignees' | 'dueDate' | 'text';

export type DateFilterOption =
  | 'any'
  | 'today'
  | 'tomorrow'
  | 'thisWeek'
  | 'nextWeek'
  | 'thisMonth'
  | 'overdue'
  | 'noDate'
  | 'specific';

export interface SearchFilters {
  text?: string;
  labels?: string[];
  assignees?: string[];
  dateFilter?: DateFilterOption;
  specificDate?: Date;
}

export interface SearchResult {
  cards: CardSearchResult[];
  totalCount: number;
  hasMore: boolean;
}

export interface CardSearchResult {
  id: string;
  title: string;
  description?: string;
  labels: CardLabel[];
  assignee?: string;
  assignees?: Array<{
    id: string;
    name: string;
    email: string;
    image?: string | null;
  }>;
  dueDate?: Date | string | null;
  columnId: string;
  columnName: string;
  boardId: string;
  boardName: string;
  matchedFields?: string[];
  relevanceScore?: number;
}

export interface SearchSuggestion {
  type: 'label' | 'assignee' | 'card';
  value: string;
  count?: number;
}

export interface SearchHistoryItem {
  query: string;
  filters: SearchFilters;
  timestamp: Date;
  resultCount: number;
}
