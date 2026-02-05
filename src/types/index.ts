// Core Domain Types (Single Source of Truth)

// Activity Types
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
  user?: string;
};

// Label Types
export type CardLabel = {
  id: string;
  text: string;
  color: string;
};

// Attachment Types
export type CardAttachment = {
  id: string;
  name: string;
  url: string;
  type: string;
};

// Checklist Types
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

// Comment Types
export type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
};

// Card Types
export type Card = {
  id: string;
  title: string;
  description?: string;
  labels?: CardLabel[];
  assignee?: string;
  attachments?: CardAttachment[];
  checklists?: Checklist[];
  dueDate?: Date | string | null;
  createdAt: Date | string;
  comments?: Comment[];
  archived?: boolean;
  color?: string;
};

// Column Types
export type Column = {
  id: string;
  title: string;
  name: string;
  cards: Card[];
  archivedCards?: (Card & { archived: true })[];
};

// Board Types
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

// API Response Types (for server communication)
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

// User Types
export type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified?: boolean;
};

// View and Sort Types
export type ViewMode = 'board' | 'calendar';
export type SortBy = 'manual' | 'date' | 'title';
export type SortOrder = 'asc' | 'desc';

// Board Template Types
export type BoardTemplate = {
  id: string;
  name: string;
  description: string;
  columns: string[];
};

// Label Color Types
export type LabelColor = {
  name: string;
  value: string;
};

// Keyboard Shortcut Types
export type KeyboardShortcut = {
  key: string;
  description: string;
};

// Component Props Types
export interface BoardHeaderProps {
  currentBoard: Board | null;
  boardList: BoardList;
  view: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  filterLabel: string;
  filterMember: string;
  searchQuery: string;
  isCompact: boolean;
  notificationsEnabled: boolean;
  user: User | null;
  showActivity: boolean;
  onSwitchBoard: (boardId: string) => void;
  onCreateBoard: (name: string, templateColumns?: string[]) => void;
  onDeleteBoard: (boardId: string) => void;
  onDuplicateBoard: (boardId: string) => void;
  onSetView: (view: ViewMode) => void;
  onSetSortBy: (sortBy: SortBy) => void;
  onSetSortOrder: (order: SortOrder) => void;
  onSetFilterLabel: (label: string) => void;
  onSetFilterMember: (member: string) => void;
  onSetSearchQuery: (query: string) => void;
  onToggleCompact: () => void;
  onToggleNotifications: () => void;
  onRequestNotificationPermission: () => void;
  onExportBoard: () => void;
  onToggleActivity: () => void;
  onShowShortcuts: () => void;
  onOpenTemplates?: () => void;
  onOpenShare?: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  historyIndex: number;
  boardHistoryLength: number;
}

export interface BoardColumnProps {
  column: Column;
  cards: Card[];
  isCompact: boolean;
  isAddCardOpen: string | null;
  moveCardOpen: string | null;
  selectedCardId: string | null;
  onAddCard: (columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onArchiveCard: (columnId: string, cardId: string) => void;
  onDuplicateCard: (columnId: string, cardId: string) => void;
  onMoveCard: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  onOpenAddCard: (columnId: string) => void;
  onCloseAddCard: () => void;
  onSetNewCardTitle: (title: string) => void;
  onSetMoveCardOpen: (cardId: string | null) => void;
  onSelectCard: (card: Card, columnId: string, index: number) => void;
  onEditCard: (card: Card, columnId: string) => void;
  onUnarchiveCard: (columnId: string, cardId: string) => void;
  onPermanentlyDeleteCard: (columnId: string, cardId: string) => void;
}

export interface CardItemProps {
  card: Card;
  index: number;
  isCompact: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onMove: () => void;
}

export interface CardModalProps {
  isOpen: boolean;
  editingCard: {
    id: string;
    title: string;
    description: string;
    labels: CardLabel[];
    assignee: string | undefined;
    attachments: CardAttachment[];
    checklists: Checklist[];
    dueDate: string;
    columnId: string;
    comments: Comment[];
    color: string;
  } | null;
  descTab: 'edit' | 'preview';
  newLabelText: string;
  newMemberName: string;
  showMemberSuggestions: boolean;
  newAttachmentUrl: string;
  newAttachmentName: string;
  newChecklistTitle: string;
  newChecklistItem: string;
  newCommentAuthor: string;
  newCommentText: string;
  onClose: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onSetDescTab: (tab: 'edit' | 'preview') => void;
  onAddLabel: () => void;
  onRemoveLabel: (labelId: string) => void;
  onSetNewLabelText: (text: string) => void;
  onAddMember: () => void;
  onRemoveMember: () => void;
  onSetNewMemberName: (name: string) => void;
  onSetShowMemberSuggestions: (show: boolean) => void;
  onAddAttachment: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onSetNewAttachmentUrl: (url: string) => void;
  onSetNewAttachmentName: (name: string) => void;
  onAddChecklist: () => void;
  onRemoveChecklist: (checklistId: string) => void;
  onSetNewChecklistTitle: (title: string) => void;
  onAddChecklistItem: (checklistId: string) => void;
  onRemoveChecklistItem: (checklistId: string, itemId: string) => void;
  onToggleChecklistItem: (checklistId: string, itemId: string) => void;
  onSetNewChecklistItem: (text: string) => void;
  onAddComment: () => void;
  onDeleteComment: (commentId: string) => void;
  onSetNewCommentAuthor: (author: string) => void;
  onSetNewCommentText: (text: string) => void;
  onSetColor: (color: string) => void;
  onSetDueDate: (date: string) => void;
  onAddUploadedAttachment: (attachment: CardAttachment) => void;
  onSave: () => void;
  getChecklistProgress: (checklist: Checklist) => { checked: number; total: number } | null;
}

export interface BoardFooterProps {
  currentBoard: Board | null;
}

export interface CalendarViewProps {
  board: Board;
  onEditCard: (card: Card, columnId: string) => void;
}
