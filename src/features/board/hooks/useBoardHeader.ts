import { BoardHeaderProps } from '@/types';
import { Board, BoardList, SortBy, SortOrder, User, ViewMode } from '@/types';

export interface UseBoardHeaderOptions {
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
  boardHistoryLength: number;
  historyIndex: number;
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
  onRequestNotificationPermission: () => Promise<boolean>;
  onExportBoard: () => void;
  onToggleActivity: () => void;
  onShowShortcuts: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function useBoardHeader(options: UseBoardHeaderOptions): BoardHeaderProps {
  return {
    currentBoard: options.currentBoard,
    boardList: options.boardList,
    view: options.view,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    filterLabel: options.filterLabel,
    filterMember: options.filterMember,
    searchQuery: options.searchQuery,
    isCompact: options.isCompact,
    notificationsEnabled: options.notificationsEnabled,
    user: options.user,
    showActivity: options.showActivity,
    onSwitchBoard: options.onSwitchBoard,
    onCreateBoard: options.onCreateBoard,
    onDeleteBoard: options.onDeleteBoard,
    onDuplicateBoard: options.onDuplicateBoard,
    onSetView: options.onSetView,
    onSetSortBy: options.onSetSortBy,
    onSetSortOrder: options.onSetSortOrder,
    onSetFilterLabel: options.onSetFilterLabel,
    onSetFilterMember: options.onSetFilterMember,
    onSetSearchQuery: options.onSetSearchQuery,
    onToggleCompact: options.onToggleCompact,
    onToggleNotifications: options.onToggleNotifications,
    onRequestNotificationPermission: options.onRequestNotificationPermission,
    onExportBoard: options.onExportBoard,
    onToggleActivity: options.onToggleActivity,
    onShowShortcuts: options.onShowShortcuts,
    onSignIn: options.onSignIn,
    onSignOut: options.onSignOut,
    onUndo: options.onUndo,
    onRedo: options.onRedo,
    historyIndex: options.historyIndex,
    boardHistoryLength: options.boardHistoryLength,
  };
}
