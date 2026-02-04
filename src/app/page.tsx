"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Board,
  Column,
  Card as CardType,
  ViewMode,
  SortBy,
  SortOrder,
  User,
} from "../features/board/types";
import {
  useBoard,
  useCards,
  useActivities,
  apiBoardToLocal,
  BOARD_TEMPLATES,
} from "../features/board/hooks";
import { BoardHeader } from "../features/board/components/BoardHeader";
import { BoardColumn } from "../features/board/components/BoardColumn";
import { CardModal } from "../features/board/components/CardModal";
import { BoardFooter } from "../features/board/components/BoardFooter";
import ActivityPanel from "@/components/ActivityPanel";

// Keyboard shortcuts
const SHORTCUTS = {
  n: "New card",
  f: "Search",
  "/": "Focus search",
  Escape: "Close dialog",
  ArrowUp: "Navigate up",
  ArrowDown: "Navigate down",
};

export default function Home() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // UI state
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddCardOpen, setIsAddCardOpen] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("board");
  const [sortBy, setSortBy] = useState<SortBy>("manual");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterLabel, setFilterLabel] = useState<string>("");
  const [filterMember, setFilterMember] = useState<string>("");
  const [isCompact, setIsCompact] = useState(false);
  const [moveCardOpen, setMoveCardOpen] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<{
    card: CardType;
    columnId: string;
    index: number;
  } | null>(null);

  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminder1Day, setReminder1Day] = useState(true);
  const [reminder1Hour, setReminder1Hour] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);

  // Activity state
  const [showActivity, setShowActivity] = useState(false);
  const { activities, addActivity } = useActivities();

  // Board state
  const {
    boardList,
    boardHistory,
    historyIndex,
    isLoaded,
    currentBoard,
    createBoard,
    switchBoard,
    deleteBoard,
    duplicateBoard,
    addColumn,
    deleteColumn,
    undo,
    redo,
    updateCurrentBoard,
  } = useBoard(user);

  // Card state
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
    clearCommentForm,
  } = useCards();

  // Load dark mode preference
  useEffect(() => {
    const savedDark = localStorage.getItem("trello-clone-dark");
    if (savedDark) {
      setIsDark(JSON.parse(savedDark));
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDark(true);
    }
  }, []);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("trello-clone-dark", JSON.stringify(isDark));
  }, [isDark]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "/" && !e.target.value) {
          e.preventDefault();
          document.getElementById("search-input")?.focus();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsAddCardOpen(currentBoard?.columns[0]?.id || null);
      }
      if (e.key === "f" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setMoveCardOpen(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentBoard, undo, redo]);

  // Drag and drop
  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result;
      if (!destination || !currentBoard) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      const sourceColumn = currentBoard.columns.find((col: Column) => col.id === source.droppableId);
      const destColumn = currentBoard.columns.find((col: Column) => col.id === destination.droppableId);

      if (!sourceColumn || !destColumn) return;

      const newBoards = boardList.boards.map((b: Board) => {
        if (b.id !== boardList.currentBoardId) return b;

        let newColumns = b.columns;

        if (source.droppableId === destination.droppableId) {
          const newCards = Array.from(sourceColumn.cards);
          const [removed] = newCards.splice(source.index, 1);
          newCards.splice(destination.index, 0, removed);
          newColumns = b.columns.map((col: Column) =>
            col.id === source.droppableId ? { ...col, cards: newCards } : col
          );
        } else {
          const sourceCards = Array.from(sourceColumn.cards);
          const destCards = Array.from(destColumn.cards);
          const [removed] = sourceCards.splice(source.index, 1);
          destCards.splice(destination.index, 0, removed);
          newColumns = b.columns.map((col: Column) => {
            if (col.id === source.droppableId) return { ...col, cards: sourceCards };
            if (col.id === destination.droppableId) return { ...col, cards: destCards };
            return col;
          });
        }

        return { ...b, columns: newColumns };
      });

      updateCurrentBoard((board: Board) => ({
        ...board,
        columns: newBoards.find((b: Board) => b.id === board.id)?.columns || board.columns,
      }));
    },
    [currentBoard, boardList, updateCurrentBoard]
  );

  // Add card
  const handleAddCard = useCallback(
    async (columnId: string) => {
      if (!newCardTitle.trim() || !currentBoard) return;

      const column = currentBoard.columns.find((col: Column) => col.id === columnId);
      const newCard: CardType = {
        id: `card-${Date.now()}`,
        title: newCardTitle.trim(),
        createdAt: new Date(),
        labels: [],
        assignee: undefined,
        attachments: [],
        checklists: [],
        dueDate: null,
        comments: [],
      };

      updateCurrentBoard((board: Board) => ({
        ...board,
        columns: board.columns.map((col: Column) =>
          col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col
        ),
      }));

      addActivity("card_created", newCard.id, newCardTitle.trim(), {
        toColumnId: columnId,
        toColumnName: column?.title,
      });

      setNewCardTitle("");
      setIsAddCardOpen(null);
    },
    [newCardTitle, currentBoard, updateCurrentBoard, addActivity]
  );

  // Delete card
  const handleDeleteCard = useCallback(
    (columnId: string, cardId: string) => {
      if (!currentBoard) return;

      const column = currentBoard.columns.find((col: Column) => col.id === columnId);
      const card = column?.cards.find((c: CardType) => c.id === cardId);
      if (!card) return;

      updateCurrentBoard((board: Board) => ({
        ...board,
        columns: board.columns.map((col: Column) =>
          col.id === columnId
            ? {
                ...col,
                cards: col.cards.filter((c: CardType) => c.id !== cardId),
                archivedCards: [...(col.archivedCards || []), { ...card, archived: true }],
              }
            : col
        ),
      }));
    },
    [currentBoard, updateCurrentBoard]
  );

  // Archive card
  const handleArchiveCard = useCallback(
    (columnId: string, cardId: string) => {
      if (!currentBoard) return;

      const column = currentBoard.columns.find((col: Column) => col.id === columnId);
      const card = column?.cards.find((c: CardType) => c.id === cardId);
      if (!card) return;

      updateCurrentBoard((board: Board) => ({
        ...board,
        columns: board.columns.map((col: Column) =>
          col.id === columnId
            ? {
                ...col,
                cards: col.cards.filter((card: CardType) => card.id !== cardId),
                archivedCards: [...(col.archivedCards || []), { ...card, archived: true }],
              }
            : col
        ),
      }));

      addActivity("card_archived", cardId, card.title, {
        fromColumnId: columnId,
        fromColumnName: column?.title,
      });
    },
    [currentBoard, updateCurrentBoard, addActivity]
  );

  // Unarchive card
  const handleUnarchiveCard = useCallback(
    (columnId: string, cardId: string) => {
      if (!currentBoard) return;

      const column = currentBoard.columns.find((col: Column) => col.id === columnId);
      const card = column?.archivedCards?.find((c: CardType) => c.id === cardId);
      if (!card) return;

      updateCurrentBoard((board: Board) => ({
        ...board,
        columns: board.columns.map((col: Column) =>
          col.id === columnId
            ? {
                ...col,
                cards: [...col.cards, { ...card, archived: false }],
                archivedCards: col.archivedCards?.filter((c: CardType) => c.id !== cardId) || [],
              }
            : col
        ),
      }));

      addActivity("card_restored", cardId, card.title, {
        toColumnId: columnId,
        toColumnName: column?.title,
      });
    },
    [currentBoard, updateCurrentBoard, addActivity]
  );

  // Permanently delete card
  const handlePermanentlyDeleteCard = useCallback(
    (columnId: string, cardId: string) => {
      if (!currentBoard) return;

      const column = currentBoard.columns.find((col: Column) => col.id === columnId);

      updateCurrentBoard((board: Board) => ({
        ...board,
        columns: board.columns.map((col: Column) =>
          col.id === columnId
            ? { ...col, archivedCards: col.archivedCards?.filter((c: CardType) => c.id !== cardId) || [] }
            : col
        ),
      }));
    },
    [currentBoard, updateCurrentBoard]
  );

  // Duplicate card
  const handleDuplicateCard = useCallback(
    (columnId: string, cardId: string) => {
      if (!currentBoard) return;

      const column = currentBoard.columns.find((col: Column) => col.id === columnId);
      const card = column?.cards.find((c: CardType) => c.id === cardId);
      if (!card) return;

      const newCard: CardType = {
        ...card,
        id: `card-${Date.now()}`,
        title: `${card.title} (Copy)`,
        createdAt: new Date(),
        comments: [],
      };

      const cardIndex = column?.cards.findIndex((c: CardType) => c.id === cardId);
      if (cardIndex === undefined || cardIndex === -1) return;

      updateCurrentBoard((board: Board) => ({
        ...board,
        columns: board.columns.map((col: Column) =>
          col.id === columnId
            ? {
                ...col,
                cards: [
                  ...col.cards.slice(0, cardIndex + 1),
                  newCard,
                  ...col.cards.slice(cardIndex + 1),
                ],
              }
            : col
        ),
      }));

      addActivity("card_duplicated", newCard.id, newCard.title, {
        fromColumnId: columnId,
        fromColumnName: column?.title,
        description: `Duplicated from "${card.title}"`,
      });
    },
    [currentBoard, updateCurrentBoard, addActivity]
  );

  // Move card
  const handleMoveCard = useCallback(
    (cardId: string, fromColumnId: string, toColumnId: string) => {
      if (!currentBoard || fromColumnId === toColumnId) return;

      const fromColumn = currentBoard.columns.find((col: Column) => col.id === fromColumnId);
      const toColumn = currentBoard.columns.find((col: Column) => col.id === toColumnId);
      const card = fromColumn?.cards.find((c: CardType) => c.id === cardId);
      if (!card) return;

      updateCurrentBoard((board: Board) => ({
        ...board,
        columns: board.columns.map((col: Column) => {
          if (col.id === fromColumnId) {
            return { ...col, cards: col.cards.filter((c: CardType) => c.id !== cardId) };
          }
          if (col.id === toColumnId) {
            return { ...col, cards: [...col.cards, card] };
          }
          return col;
        }),
      }));

      addActivity("card_moved", cardId, card.title, {
        fromColumnId,
        fromColumnName: fromColumn?.title,
        toColumnId,
        toColumnName: toColumn?.title,
      });

      setMoveCardOpen(null);
    },
    [currentBoard, updateCurrentBoard, addActivity]
  );

  // Export board
  const exportBoard = useCallback(() => {
    if (!currentBoard) return;

    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      board: {
        id: currentBoard.id,
        name: currentBoard.name,
        columns: currentBoard.columns.map((col: Column) => ({
          ...col,
          cards: col.cards.map((card: CardType) => ({
            ...card,
            dueDate: card.dueDate ? new Date(card.dueDate).toISOString() : null,
            createdAt: new Date(card.createdAt).toISOString(),
            archived: card.archived || false,
          })),
          archivedCards: col.archivedCards?.map((card: CardType) => ({
            ...card,
            dueDate: card.dueDate ? new Date(card.dueDate).toISOString() : null,
            createdAt: new Date(card.createdAt).toISOString(),
            archived: true,
          })) || [],
        })),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentBoard.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentBoard]);

  // Update card
  const handleUpdateCard = useCallback(() => {
    if (!editingCard || !currentBoard) return;

    updateCurrentBoard((board: Board) => ({
      ...board,
      columns: board.columns.map((col: Column) =>
        col.id === editingCard.columnId
          ? {
              ...col,
              cards: col.cards.map((card: CardType) =>
                card.id === editingCard.id
                  ? {
                      ...card,
                      title: editingCard.title,
                      description: editingCard.description,
                      labels: editingCard.labels,
                      assignee: editingCard.assignee || undefined,
                      attachments: editingCard.attachments,
                      checklists: editingCard.checklists,
                      dueDate: editingCard.dueDate ? new Date(editingCard.dueDate) : null,
                      comments: editingCard.comments,
                      color: editingCard.color || undefined,
                    }
                  : card
              ),
            }
          : col
      ),
    }));

    addActivity("card_edited", editingCard.id, editingCard.title, {
      description: `Changed: title, description`,
    });

    closeEditCard();
  }, [editingCard, currentBoard, updateCurrentBoard, addActivity, closeEditCard]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      return true;
    }
    return false;
  };

  // Navigate cards
  const navigateCards = useCallback(
    (key: string) => {
      if (!currentBoard) return;

      const allCards: { card: CardType; columnId: string; index: number }[] = [];
      currentBoard.columns.forEach((col: Column) => {
        col.cards.forEach((card: CardType, idx: number) => {
          allCards.push({ card, columnId: col.id, index: idx });
        });
      });

      if (allCards.length === 0) return;

      const currentIndex = selectedCard
        ? allCards.findIndex((c) => c.card.id === selectedCard.card.id)
        : -1;

      let newIndex = currentIndex;

      if (key === "ArrowDown" || key === "ArrowRight") {
        newIndex = currentIndex < allCards.length - 1 ? currentIndex + 1 : 0;
      } else if (key === "ArrowUp" || key === "ArrowLeft") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : allCards.length - 1;
      }

      setSelectedCard(allCards[newIndex]);
    },
    [currentBoard, selectedCard]
  );

  // Loading state
  if (!isLoaded || !currentBoard) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      {/* Header */}
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
        boardHistoryLength={boardHistory.length}
      />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowShortcuts(false)}
        >
          <div className="bg-background rounded-lg p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {Object.entries(SHORTCUTS).map(([key, desc]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{desc}</span>
                  <kbd className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-4 h-[calc(100vh-80px)]">
          {currentBoard.columns.map((column: Column) => (
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
              onPermanentlyDeleteCard={handlePermanentlyDeleteCard}
            />
          ))}

          {/* Add column */}
          <div className="flex-shrink-0 w-72">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add column
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Column</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Column title..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addColumn(newColumnTitle)}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setNewColumnTitle("")}>
                    Cancel
                  </Button>
                  <Button onClick={() => addColumn(newColumnTitle)}>Add</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </DragDropContext>

      {/* Footer */}
      <BoardFooter currentBoard={currentBoard} />

      {/* Card Modal */}
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
        updateCardTitle={updateCardTitle}
        updateCardDescription={updateCardDescription}
        setDescTab={setDescTab}
        addLabel={addLabel}
        removeLabel={removeLabel}
        setNewLabelText={setNewLabelText}
        addMember={addMember}
        removeMember={removeMember}
        setNewMemberName={setNewMemberName}
        setShowMemberSuggestions={setShowMemberSuggestions}
        addAttachment={addAttachment}
        removeAttachment={removeAttachment}
        setNewAttachmentUrl={setNewAttachmentUrl}
        setNewAttachmentName={setNewAttachmentName}
        addChecklist={addChecklist}
        removeChecklist={removeChecklist}
        setNewChecklistTitle={setNewChecklistTitle}
        addChecklistItem={addChecklistItem}
        removeChecklistItem={removeChecklistItem}
        toggleChecklistItem={toggleChecklistItem}
        setNewChecklistItem={setNewChecklistItem}
        addComment={addComment}
        deleteComment={deleteComment}
        setNewCommentAuthor={setNewCommentAuthor}
        setNewCommentText={setNewCommentText}
        setColor={setColor}
        setDueDate={setDueDate}
        getChecklistProgress={getChecklistProgress}
      />

      {/* Activity Panel */}
      {showActivity && <ActivityPanel activities={activities} onClose={() => setShowActivity(false)} />}
    </div>
  );
}
