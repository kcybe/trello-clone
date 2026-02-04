// Board Types
export interface Board {
  id: string;
  name: string;
  description?: string;
  color?: string;
  columns: Column[];
  createdAt: Date | number;
  updatedAt: Date | number;
  ownerId: string;
}

export interface BoardList {
  boards: Board[];
  currentBoardId: string | null;
}

// Column Types
export interface Column {
  id: string;
  title: string;
  name: string;
  cards: Card[];
  archivedCards?: (Card & { archived: true })[];
}

// Card Types
export interface Card {
  id: string;
  title: string;
  description?: string;
  labels: CardLabel[];
  assignee?: string;
  attachments: CardAttachment[];
  checklists: Checklist[];
  dueDate?: Date | string | null;
  createdAt: Date | string;
  comments: Comment[];
  color?: string;
  archived?: boolean;
}

// Label Types
export interface CardLabel {
  id: string;
  text: string;
  color: string;
}

// Attachment Types
export interface CardAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

// Checklist Types
export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

// Comment Types
export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: Date | string;
}

// Activity Types
export type ActivityType =
  | 'card_created'
  | 'card_edited'
  | 'card_moved'
  | 'card_archived'
  | 'card_restored'
  | 'card_duplicated'
  | 'card_deleted'
  | 'label_added'
  | 'member_assigned'
  | 'comment_added'
  | 'due_date_set'
  | 'due_date_changed';

export interface Activity {
  id: string;
  type: ActivityType;
  cardId: string;
  cardTitle: string;
  timestamp: Date;
  user?: string;
  fromColumnId?: string;
  fromColumnName?: string;
  toColumnId?: string;
  toColumnName?: string;
  description?: string;
}

// API Types (for server communication)
export interface ApiBoard {
  id: string;
  name: string;
  description?: string;
  color?: string;
  columns: ApiColumn[];
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface ApiColumn {
  id: string;
  name: string;
  boardId: string;
  cards: ApiCard[];
}

export interface ApiCard {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  assignees?: Array<{ id: string; name: string; email: string }>;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
}

// View and Sort Types
export type ViewMode = 'board' | 'calendar';
export type SortBy = 'manual' | 'date' | 'title';
export type SortOrder = 'asc' | 'desc';

// Board Template Types
export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  columns: string[];
}

// Label Color Types
export interface LabelColor {
  name: string;
  value: string;
}

// Keyboard Shortcut Types
export interface KeyboardShortcut {
  key: string;
  description: string;
}

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
  onSave: () => void;
}

export interface BoardFooterProps {
  currentBoard: Board | null;
}

export interface CalendarViewProps {
  board: Board;
  onEditCard: (card: Card, columnId: string) => void;
}
