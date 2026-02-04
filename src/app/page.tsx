'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Board, Card as CardType, ViewMode, SortBy, SortOrder, User } from '@/features/board/types';
import { useBoard, useCards, useActivities } from '@/features/board/hooks';
import { BoardHeader } from '@/features/board/components/BoardHeader';
import { BoardColumn } from '@/features/board/components/BoardColumn';
import { CardModal } from '@/features/board/components/CardModal';
import { BoardFooter } from '@/features/board/components/BoardFooter';
import { ShortcutsModal, AddColumnDialog } from '@/features/board/components/BoardDialogs';
import ActivityPanel from '@/components/ActivityPanel';

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
  const [selectedCard, setSelectedCard] = useState<{ card: CardType; columnId: string; index: number } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const { activities, addActivity } = useActivities();
  const { boardList, historyIndex, isLoaded, currentBoard, createBoard, switchBoard, deleteBoard, duplicateBoard, addColumn, deleteColumn, addCard, archiveCard, unarchiveCard, permanentlyDeleteCard, duplicateCard, moveCard, updateCard, exportBoard, undo, redo, updateCurrentBoard } = useBoard(user);
  const { editingCard, descTab, newLabelText, newMemberName, showMemberSuggestions, newAttachmentUrl, newAttachmentName, newChecklistTitle, newChecklistItem, newCommentAuthor, newCommentText, openEditCard, closeEditCard, updateCardTitle, updateCardDescription, setDescTab, addLabel, removeLabel, setNewLabelText, addMember, removeMember, setNewMemberName, setShowMemberSuggestions, addAttachment, removeAttachment, setNewAttachmentUrl, setNewAttachmentName, addChecklist, removeChecklist, setNewChecklistTitle, addChecklistItem, removeChecklistItem, toggleChecklistItem, setNewChecklistItem, addComment, deleteComment, setNewCommentAuthor, setNewCommentText, setColor, setDueDate, getChecklistProgress } = useCards();

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === '/' && !e.target.value) {
          e.preventDefault();
          document.getElementById('search-input')?.focus();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsAddCardOpen(currentBoard?.columns[0]?.id || null);
      }
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setMoveCardOpen(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentBoard, undo, redo]);

  // Drag and drop
  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination || !currentBoard) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newBoards = boardList.boards.map((b) => {
      if (b.id !== boardList.currentBoardId) return b;

      let newColumns = b.columns;

      if (source.droppableId === destination.droppableId) {
        const column = b.columns.find((col) => col.id === source.droppableId);
        if (!column) return b;
        const newCards = Array.from(column.cards);
        const [removed] = newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, removed);
        newColumns = b.columns.map((col) => col.id === source.droppableId ? { ...col, cards: newCards } : col);
      } else {
        const sourceColumn = b.columns.find((col) => col.id === source.droppableId);
        const destColumn = b.columns.find((col) => col.id === destination.droppableId);
        if (!sourceColumn || !destColumn) return b;
        const sourceCards = Array.from(sourceColumn.cards);
        const destCards = Array.from(destColumn.cards);
        const [removed] = sourceCards.splice(source.index, 1);
        destCards.splice(destination.index, 0, removed);
        newColumns = b.columns.map((col) => {
          if (col.id === source.droppableId) return { ...col, cards: sourceCards };
          if (col.id === destination.droppableId) return { ...col, cards: destCards };
          return col;
        });
      }

      return { ...b, columns: newColumns };
    });

    updateCurrentBoard((board) => ({ ...board, columns: newBoards.find((b) => b.id === board.id)?.columns || board.columns }));
  }, [currentBoard, boardList, updateCurrentBoard]);

  // Handle add card
  const handleAddCard = useCallback((columnId: string) => {
    if (!newCardTitle.trim() || !currentBoard) return;

    const column = currentBoard.columns.find((col) => col.id === columnId);
    addCard(columnId, newCardTitle);
    addActivity('card_created', `card-${Date.now()}`, newCardTitle.trim(), { toColumnId: columnId, toColumnName: column?.title });
    setNewCardTitle('');
    setIsAddCardOpen(null);
  }, [newCardTitle, currentBoard, addCard, addActivity]);

  // Handle card actions with activities
  const handleArchiveCard = useCallback((columnId: string, cardId: string) => {
    const column = currentBoard?.columns.find((col) => col.id === columnId);
    const card = column?.cards.find((c) => c.id === cardId);
    archiveCard(columnId, cardId);
    if (card) addActivity('card_archived', cardId, card.title, { fromColumnId: columnId, fromColumnName: column?.title });
  }, [currentBoard, archiveCard, addActivity]);

  const handleUnarchiveCard = useCallback((columnId: string, cardId: string) => {
    const column = currentBoard?.columns.find((col) => col.id === columnId);
    const card = column?.archivedCards?.find((c) => c.id === cardId);
    unarchiveCard(columnId, cardId);
    if (card) addActivity('card_restored', cardId, card.title, { toColumnId: columnId, toColumnName: column?.title });
  }, [currentBoard, unarchiveCard, addActivity]);

  const handleDuplicateCard = useCallback((columnId: string, cardId: string) => {
    const column = currentBoard?.columns.find((col) => col.id === columnId);
    const card = column?.cards.find((c) => c.id === cardId);
    duplicateCard(columnId, cardId);
    if (card) addActivity('card_duplicated', `card-${Date.now()}`, `${card.title} (Copy)`, { fromColumnId: columnId, fromColumnName: column?.title, description: `Duplicated from "${card.title}"` });
  }, [currentBoard, duplicateCard, addActivity]);

  const handleMoveCard = useCallback((cardId: string, fromColumnId: string, toColumnId: string) => {
    const fromColumn = currentBoard?.columns.find((col) => col.id === fromColumnId);
    const toColumn = currentBoard?.columns.find((col) => col.id === toColumnId);
    const card = fromColumn?.cards.find((c) => c.id === cardId);
    moveCard(cardId, fromColumnId, toColumnId);
    if (card) addActivity('card_moved', cardId, card.title, { fromColumnId, fromColumnName: fromColumn?.title, toColumnId, toColumnName: toColumn?.title });
    setMoveCardOpen(null);
  }, [currentBoard, moveCard, addActivity]);

  // Handle update card from modal
  const handleUpdateCard = useCallback(() => {
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

    addActivity('card_edited', editingCard.id, editingCard.title, { description: 'Changed: title, description' });
    closeEditCard();
  }, [editingCard, currentBoard, updateCard, addActivity, closeEditCard]);

  // Notification permission
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

  if (!isLoaded || !currentBoard) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <BoardHeader
        currentBoard={currentBoard}
        boardList={boardList}
        view={view}
        sortBy={sortBy}
        sortOrder={sortOrder}
        filterLabel={filterLabel}
        filterMember={filterMember}
        searchQuery={searchQuery}
        isCompact={isCompact}
        notificationsEnabled={notificationsEnabled}
        user={user}
        showActivity={showActivity}
        onSwitchBoard={switchBoard}
        onCreateBoard={createBoard}
        onDeleteBoard={deleteBoard}
        onDuplicateBoard={duplicateBoard}
        onSetView={setView}
        onSetSortBy={setSortBy}
        onSetSortOrder={setSortOrder}
        onSetFilterLabel={setFilterLabel}
        onSetFilterMember={setFilterMember}
        onSetSearchQuery={setSearchQuery}
        onToggleCompact={() => setIsCompact(!isCompact)}
        onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)}
        onRequestNotificationPermission={requestNotificationPermission}
        onExportBoard={exportBoard}
        onToggleActivity={() => setShowActivity(!showActivity)}
        onShowShortcuts={() => setShowShortcuts(true)}
        onSignIn={() => {}}
        onSignOut={() => setUser(null)}
        onUndo={undo}
        onRedo={redo}
        historyIndex={historyIndex}
        boardHistoryLength={boardList.history?.length || 0}
      />

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-4 h-[calc(100vh-80px)]">
          {currentBoard.columns.map((column) => (
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
            onAddColumn={(title) => { addColumn(title); setNewColumnTitle(''); }}
            onClear={() => setNewColumnTitle('')}
          />
        </div>
      </DragDropContext>

      <BoardFooter currentBoard={currentBoard} />

      <CardModal
        isOpen={!!editingCard}
        editingCard={editingCard}
        descTab={descTab}
        newLabelText={newLabelText}
        newMemberName={newMemberName}
        showMemberSuggestions={showMemberSuggestions}
        newAttachmentUrl={newAttachmentUrl}
        newAttachmentName={newAttachmentName}
        newChecklistTitle={newChecklistTitle}
        newChecklistItem={newChecklistItem}
        newCommentAuthor={newCommentAuthor}
        newCommentText={newCommentText}
        onClose={closeEditCard}
        onUpdateTitle={updateCardTitle}
        onUpdateDescription={updateCardDescription}
        onSetDescTab={setDescTab}
        onAddLabel={addLabel}
        onRemoveLabel={removeLabel}
        onSetNewLabelText={setNewLabelText}
        onAddMember={addMember}
        onRemoveMember={removeMember}
        onSetNewMemberName={setNewMemberName}
        onSetShowMemberSuggestions={setShowMemberSuggestions}
        onAddAttachment={addAttachment}
        onRemoveAttachment={removeAttachment}
        onSetNewAttachmentUrl={setNewAttachmentUrl}
        onSetNewAttachmentName={setNewAttachmentName}
        onAddChecklist={addChecklist}
        onRemoveChecklist={removeChecklist}
        onSetNewChecklistTitle={setNewChecklistTitle}
        onAddChecklistItem={addChecklistItem}
        onRemoveChecklistItem={removeChecklistItem}
        onToggleChecklistItem={toggleChecklistItem}
        onSetNewChecklistItem={setNewChecklistItem}
        onAddComment={addComment}
        onDeleteComment={deleteComment}
        onSetNewCommentAuthor={setNewCommentAuthor}
        onSetNewCommentText={setNewCommentText}
        onSetColor={setColor}
        onSetDueDate={setDueDate}
        onSave={handleUpdateCard}
      />

      {showActivity && <ActivityPanel activities={activities} onClose={() => setShowActivity(false)} />}
    </div>
  );
}
