'use client';

import { DragDropContext, DropResult } from '@hello-pangea/dnd';

import ActivityPanel from '@/components/ActivityPanel';
import { useBoard, useCards, useActivities, useKeyboardShortcuts } from '@/features/board';
import { BoardColumn } from '@/features/board/components/BoardColumn';
import { ShortcutsModal, AddColumnDialog } from '@/features/board/components/BoardDialogs';
import { BoardFooter } from '@/features/board/components/BoardFooter';
import { BoardHeader } from '@/features/board/components/BoardHeader';
import { CardModal } from '@/features/board/components/CardModal';
import { Board, Card as CardType, ViewMode, SortBy, SortOrder, User } from '@/types';

import { useState, useEffect } from 'react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isAddCardOpen, setIsAddCardOpen] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('board');
  const [sortBy, setSortBy] = useState<SortBy>('manual');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterLabel, setFilterLabel] = useState<string>('');
  const [filterMember, setFilterMember] = useState<string>('');
  const [isCompact, setIsCompact] = useState(false);
  const [moveCardOpen, setMoveCardOpen] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<{
    card: CardType;
    columnId: string;
    index: number;
  } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const { activities, addActivity } = useActivities();
  const {
    boardList,
    historyIndex,
    isLoaded,
    currentBoard,
    createBoard,
    switchBoard,
    deleteBoard,
    duplicateBoard,
    addColumn,
    deleteColumn,
    addCard,
    archiveCard,
    unarchiveCard,
    permanentlyDeleteCard,
    duplicateCard,
    moveCard,
    updateCard,
    exportBoard,
    undo,
    redo,
    updateCurrentBoard,
  } = useBoard(user);
  const {
    editingCard,
    descTab,
    newLabelText,
    newMemberName,
    showMemberSuggestions,
    newAttachmentUrl,
    newAttachmentName,
    newChecklistTitle,
    newChecklistItem,
    newCommentAuthor,
    newCommentText,
    openEditCard,
    closeEditCard,
    updateCardTitle,
    updateCardDescription,
    setDescTab,
    addLabel,
    removeLabel,
    setNewLabelText,
    addMember,
    removeMember,
    setNewMemberName,
    setShowMemberSuggestions,
    addAttachment,
    removeAttachment,
    setNewAttachmentUrl,
    setNewAttachmentName,
    addUploadedAttachment,
    addChecklist,
    removeChecklist,
    setNewChecklistTitle,
    addChecklistItem,
    removeChecklistItem,
    toggleChecklistItem,
    setNewChecklistItem,
    addComment,
    deleteComment,
    setNewCommentAuthor,
    setNewCommentText,
    setColor,
    setDueDate,
    getChecklistProgress,
  } = useCards();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewCard: () => setIsAddCardOpen(currentBoard?.columns[0]?.id || null),
    onSearch: () => document.getElementById('search-input')?.focus(),
    onShortcuts: () => setShowShortcuts(true),
    onUndo: undo,
    onRedo: redo,
    onEscape: () => {
      setShowShortcuts(false);
      setMoveCardOpen(null);
    },
    currentBoard,
  });

  // Load dark mode
  useEffect(() => {
    const savedDark = localStorage.getItem('trello-clone-dark');
    if (savedDark) {
      setIsDark(JSON.parse(savedDark));
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('trello-clone-dark', JSON.stringify(isDark));
  }, [isDark]);

  // Drag and drop
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || !currentBoard) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    const newBoards = boardList.boards.map(b => {
      if (b.id !== boardList.currentBoardId) return b;
      let newColumns = b.columns;

      if (source.droppableId === destination.droppableId) {
        const column = b.columns.find(col => col.id === source.droppableId);
        if (!column) return b;
        const newCards = Array.from(column.cards);
        const [removed] = newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, removed);
        newColumns = b.columns.map(col =>
          col.id === source.droppableId ? { ...col, cards: newCards } : col
        );
      } else {
        const sourceColumn = b.columns.find(col => col.id === source.droppableId);
        const destColumn = b.columns.find(col => col.id === destination.droppableId);
        if (!sourceColumn || !destColumn) return b;
        const sourceCards = Array.from(sourceColumn.cards);
        const destCards = Array.from(destColumn.cards);
        const [removed] = sourceCards.splice(source.index, 1);
        destCards.splice(destination.index, 0, removed);
        newColumns = b.columns.map(col => {
          if (col.id === source.droppableId) return { ...col, cards: sourceCards };
          if (col.id === destination.droppableId) return { ...col, cards: destCards };
          return col;
        });
      }
      return { ...b, columns: newColumns };
    });

    updateCurrentBoard(board => ({
      ...board,
      columns: newBoards.find(b => b.id === board.id)?.columns || board.columns,
    }));
  };

  // Card actions
  const handleAddCard = () => {
    if (!newCardTitle.trim() || !currentBoard) return;
    const column = currentBoard.columns.find(col => col.id === isAddCardOpen);
    addCard(isAddCardOpen!, newCardTitle);
    addActivity('card_created', `card-${Date.now()}`, newCardTitle.trim(), {
      toColumnId: isAddCardOpen!,
      toColumnName: column?.title,
    });
    setNewCardTitle('');
    setIsAddCardOpen(null);
  };

  const handleArchiveCard = (columnId: string, cardId: string) => {
    const column = currentBoard?.columns.find(col => col.id === columnId);
    const card = column?.cards.find(c => c.id === cardId);
    archiveCard(columnId, cardId);
    if (card)
      addActivity('card_archived', cardId, card.title, {
        fromColumnId: columnId,
        fromColumnName: column?.title,
      });
  };

  const handleUnarchiveCard = (columnId: string, cardId: string) => {
    const column = currentBoard?.columns.find(col => col.id === columnId);
    const card = column?.archivedCards?.find(c => c.id === cardId);
    unarchiveCard(columnId, cardId);
    if (card)
      addActivity('card_restored', cardId, card.title, {
        toColumnId: columnId,
        toColumnName: column?.title,
      });
  };

  const handleDuplicateCard = (columnId: string, cardId: string) => {
    const column = currentBoard?.columns.find(col => col.id === columnId);
    const card = column?.cards.find(c => c.id === cardId);
    duplicateCard(columnId, cardId);
    if (card)
      addActivity('card_duplicated', `card-${Date.now()}`, `${card.title} (Copy)`, {
        fromColumnId: columnId,
        fromColumnName: column?.title,
        description: `Duplicated from "${card.title}"`,
      });
  };

  const handleMoveCard = (cardId: string, fromColumnId: string, toColumnId: string) => {
    const fromColumn = currentBoard?.columns.find(col => col.id === fromColumnId);
    const toColumn = currentBoard?.columns.find(col => col.id === toColumnId);
    const card = fromColumn?.cards.find(c => c.id === cardId);
    moveCard(cardId, fromColumnId, toColumnId);
    if (card)
      addActivity('card_moved', cardId, card.title, {
        fromColumnId,
        fromColumnName: fromColumn?.title,
        toColumnId,
        toColumnName: toColumn?.title,
      });
    setMoveCardOpen(null);
  };

  const handleUpdateCard = () => {
    if (!editingCard || !currentBoard) return;
    updateCard(editingCard.columnId, editingCard.id, {
      title: editingCard.title,
      description: editingCard.description,
      labels: editingCard.labels,
      assignee: editingCard.assignee || undefined,
      attachments: editingCard.attachments,
      checklists: editingCard.checklists,
      dueDate: editingCard.dueDate ? new Date(editingCard.dueDate) : null,
      comments: editingCard.comments,
      color: editingCard.color || undefined,
    });
    addActivity('card_edited', editingCard.id, editingCard.title, {
      description: 'Changed: title, description',
    });
    closeEditCard();
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      return true;
    }
    return false;
  };

  const handleAddColumn = (title: string) => {
    addColumn(title);
    setNewColumnTitle('');
  };

  if (!isLoaded || !currentBoard) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const headerProps = {
    currentBoard,
    boardList,
    view,
    sortBy,
    sortOrder,
    filterLabel,
    filterMember,
    searchQuery,
    isCompact,
    notificationsEnabled,
    user,
    showActivity,
    onSwitchBoard: switchBoard,
    onCreateBoard: createBoard,
    onDeleteBoard: deleteBoard,
    onDuplicateBoard: duplicateBoard,
    onSetView: setView,
    onSetSortBy: setSortBy,
    onSetSortOrder: setSortOrder,
    onSetFilterLabel: setFilterLabel,
    onSetFilterMember: setFilterMember,
    onSetSearchQuery: setSearchQuery,
    onToggleCompact: () => setIsCompact(!isCompact),
    onToggleNotifications: () => setNotificationsEnabled(!notificationsEnabled),
    onRequestNotificationPermission,
    onExportBoard: exportBoard,
    onToggleActivity: () => setShowActivity(!showActivity),
    onShowShortcuts: () => setShowShortcuts(true),
    onSignIn: () => {},
    onSignOut: () => setUser(null),
    onUndo: undo,
    onRedo: redo,
    historyIndex,
    boardHistoryLength: boardList.history?.length || 0,
  };

  const cardModalProps = {
    isOpen: !!editingCard,
    editingCard,
    descTab,
    newLabelText,
    newMemberName,
    showMemberSuggestions,
    newAttachmentUrl,
    newAttachmentName,
    newChecklistTitle,
    newChecklistItem,
    newCommentAuthor,
    newCommentText,
    onClose: closeEditCard,
    onUpdateTitle: updateCardTitle,
    onUpdateDescription: updateCardDescription,
    onSetDescTab: setDescTab,
    onAddLabel: addLabel,
    onRemoveLabel: removeLabel,
    onSetNewLabelText: setNewLabelText,
    onAddMember: addMember,
    onRemoveMember: removeMember,
    onSetNewMemberName: setNewMemberName,
    onSetShowMemberSuggestions: setShowMemberSuggestions,
    onAddAttachment: addAttachment,
    onRemoveAttachment: removeAttachment,
    onSetNewAttachmentUrl: setNewAttachmentUrl,
    onSetNewAttachmentName: setNewAttachmentName,
    onAddUploadedAttachment: addUploadedAttachment,
    onAddChecklist: addChecklist,
    onRemoveChecklist: removeChecklist,
    onSetNewChecklistTitle: setNewChecklistTitle,
    onAddChecklistItem: addChecklistItem,
    onRemoveChecklistItem: removeChecklistItem,
    onToggleChecklistItem: toggleChecklistItem,
    onSetNewChecklistItem: setNewChecklistItem,
    onAddComment: addComment,
    onDeleteComment: deleteComment,
    onSetNewCommentAuthor: setNewCommentAuthor,
    onSetNewCommentText: setNewCommentText,
    onSetColor: setColor,
    onSetDueDate: setDueDate,
    onSave: handleUpdateCard,
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      <BoardHeader {...headerProps} />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-4 h-[calc(100vh-80px)]">
          {currentBoard.columns.map(column => (
            <BoardColumn
              key={column.id}
              column={column}
              cards={column.cards}
              isCompact={isCompact}
              isAddCardOpen={isAddCardOpen}
              moveCardOpen={moveCardOpen}
              selectedCardId={selectedCard?.card.id}
              onAddCard={handleAddCard}
              onDeleteColumn={deleteColumn}
              onArchiveCard={handleArchiveCard}
              onDuplicateCard={handleDuplicateCard}
              onMoveCard={handleMoveCard}
              onOpenAddCard={setIsAddCardOpen}
              onCloseAddCard={() => setIsAddCardOpen(null)}
              onSetNewCardTitle={setNewCardTitle}
              onSetMoveCardOpen={setMoveCardOpen}
              onSelectCard={setSelectedCard}
              onEditCard={openEditCard}
              onUnarchiveCard={handleUnarchiveCard}
              onPermanentlyDeleteCard={permanentlyDeleteCard}
            />
          ))}

          <AddColumnDialog
            newColumnTitle={newColumnTitle}
            onSetNewColumnTitle={setNewColumnTitle}
            onAddColumn={handleAddColumn}
            onClear={() => setNewColumnTitle('')}
          />
        </div>
      </DragDropContext>

      <BoardFooter currentBoard={currentBoard} />
      <CardModal {...cardModalProps} />

      {showActivity && (
        <ActivityPanel activities={activities} onClose={() => setShowActivity(false)} />
      )}
    </div>
  );
}
