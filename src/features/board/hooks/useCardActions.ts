import { Board, Card as CardType } from '@/types';

import { useActivities } from './useActivities';
import { useCards } from './useCards';

export interface UseCardActionOptions {
  currentBoard: Board | null;
  isAddCardOpen: string | null;
  newCardTitle: string;
  editingCard: {
    card: CardType;
    columnId: string;
    index: number;
  } | null;
  addActivity: (type: string, id: string, title: string, details?: Record<string, unknown>) => void;
  addCard: (columnId: string, title: string) => void;
  archiveCard: (columnId: string, cardId: string) => void;
  unarchiveCard: (columnId: string, cardId: string) => void;
  duplicateCard: (columnId: string, cardId: string) => void;
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  updateCard: (columnId: string, cardId: string, updates: Partial<CardType>) => void;
}

export function useCardActions(options: UseCardActionOptions) {
  const {
    currentBoard,
    isAddCardOpen,
    newCardTitle,
    editingCard,
    addActivity,
    addCard,
    archiveCard,
    unarchiveCard,
    duplicateCard,
    moveCard,
    updateCard,
  } = options;

  const handleAddCard = () => {
    if (!newCardTitle.trim() || !currentBoard) return;
    const column = currentBoard.columns.find(col => col.id === isAddCardOpen);
    addCard(isAddCardOpen!, newCardTitle);
    addActivity('card_created', `card-${Date.now()}`, newCardTitle.trim(), {
      toColumnId: isAddCardOpen!,
      toColumnName: column?.title,
    });
    // Return the title to clear (caller handles state)
    return newCardTitle;
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
  };

  return {
    handleAddCard,
    handleArchiveCard,
    handleUnarchiveCard,
    handleDuplicateCard,
    handleMoveCard,
    handleUpdateCard,
  };
}
