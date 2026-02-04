'use client';

import { useCallback } from 'react';

import { Board, Column, Card } from '../../types';
import {
  useBoardSocketEvents,
  CardCreatedData,
  CardUpdatedData,
  CardDeletedData,
  CardMovedData,
  ColumnCreatedData,
  ColumnDeletedData,
  BoardUpdateData,
} from './client';

// Helper function to update card in board state
function updateCardInBoard(
  board: Board,
  columnId: string,
  cardId: string,
  updates: Partial<Card>
): Board {
  return {
    ...board,
    columns: board.columns.map(col => {
      if (col.id !== columnId) return col;
      return {
        ...col,
        cards: col.cards.map(card => (card.id === cardId ? { ...card, ...updates } : card)),
      };
    }),
  };
}

// Helper function to delete card from board state
function deleteCardFromBoard(board: Board, columnId: string, cardId: string): Board {
  return {
    ...board,
    columns: board.columns.map(col => {
      if (col.id !== columnId) return col;
      return {
        ...col,
        cards: col.cards.filter(card => card.id !== cardId),
      };
    }),
  };
}

// Helper function to add card to board state
function addCardToBoard(board: Board, columnId: string, card: Card): Board {
  return {
    ...board,
    columns: board.columns.map(col => {
      if (col.id !== columnId) return col;
      return {
        ...col,
        cards: [...col.cards, card],
      };
    }),
  };
}

// Helper function to add column to board state
function addColumnToBoard(board: Board, column: Column): Board {
  return {
    ...board,
    columns: [...board.columns, column],
  };
}

// Helper function to delete column from board state
function deleteColumnFromBoard(board: Board, columnId: string): Board {
  return {
    ...board,
    columns: board.columns.filter(col => col.id !== columnId),
  };
}

// Hook for integrating socket events with board state
export function useSocketSync(
  boardId: string | null,
  currentBoard: Board | null,
  updateBoard: (updateFn: (board: Board) => Board) => void
) {
  const handleCardCreated = useCallback(
    (data: CardCreatedData) => {
      if (!currentBoard || data.card.id.startsWith('card-')) {
        // Skip local/optimistic updates (IDs starting with timestamp prefix)
        return;
      }
      const card: Card = {
        id: data.card.id,
        title: data.card.title,
        description: data.card.description,
        labels: data.card.labels || [],
        assignee: data.card.assignee,
        attachments: data.card.attachments || [],
        checklists: data.card.checklists || [],
        dueDate: data.card.dueDate ? new Date(data.card.dueDate) : null,
        createdAt: new Date(data.card.createdAt),
        comments: data.card.comments || [],
        color: data.card.color,
      };
      updateBoard(board => addCardToBoard(board, data.columnId, card));
    },
    [currentBoard, updateBoard]
  );

  const handleCardUpdated = useCallback(
    (data: CardUpdatedData) => {
      if (!currentBoard) return;
      const updates: Partial<Card> = {
        title: data.updates.title,
        description: data.updates.description,
        labels: data.updates.labels,
        assignee: data.updates.assignee,
        attachments: data.updates.attachments,
        checklists: data.updates.checklists,
        dueDate: data.updates.dueDate ? new Date(data.updates.dueDate) : data.updates.dueDate,
        comments: data.updates.comments,
        color: data.updates.color,
      };
      updateBoard(board => updateCardInBoard(board, data.columnId, data.cardId, updates));
    },
    [currentBoard, updateBoard]
  );

  const handleCardDeleted = useCallback(
    (data: CardDeletedData) => {
      if (!currentBoard) return;
      updateBoard(board => deleteCardFromBoard(board, data.columnId, data.cardId));
    },
    [currentBoard, updateBoard]
  );

  const handleCardMoved = useCallback(
    (data: CardMovedData) => {
      if (!currentBoard) return;
      // Find the card in the source column
      const fromColumn = currentBoard.columns.find(col => col.id === data.fromColumnId);
      const card = fromColumn?.cards.find(c => c.id === data.cardId);
      if (!card) return;

      updateBoard(board => {
        // Remove from source column
        let updatedColumns = board.columns.map(col => {
          if (col.id !== data.fromColumnId) return col;
          return { ...col, cards: col.cards.filter(c => c.id !== data.cardId) };
        });

        // Add to destination column at the correct position
        updatedColumns = updatedColumns.map(col => {
          if (col.id !== data.toColumnId) return col;
          const newCards = [...col.cards];
          newCards.splice(data.newIndex, 0, card);
          return { ...col, cards: newCards };
        });

        return { ...board, columns: updatedColumns };
      });
    },
    [currentBoard, updateBoard]
  );

  const handleColumnCreated = useCallback(
    (data: ColumnCreatedData) => {
      if (!currentBoard) return;
      const column: Column = {
        id: data.column.id,
        title: data.column.title,
        name: data.column.name,
        cards: [],
      };
      updateBoard(board => addColumnToBoard(board, column));
    },
    [currentBoard, updateBoard]
  );

  const handleColumnDeleted = useCallback(
    (data: ColumnDeletedData) => {
      if (!currentBoard) return;
      updateBoard(board => deleteColumnFromBoard(board, data.columnId));
    },
    [currentBoard, updateBoard]
  );

  const handleBoardUpdate = useCallback(
    (data: BoardUpdateData) => {
      if (!currentBoard) return;
      // Apply broad board updates (e.g., name change)
      updateBoard(board => ({ ...board, ...data.updates }));
    },
    [currentBoard, updateBoard]
  );

  // Register socket event listeners
  useBoardSocketEvents(boardId, {
    onBoardUpdate: handleBoardUpdate,
    onColumnCreated: handleColumnCreated,
    onColumnDeleted: handleColumnDeleted,
    onCardCreated: handleCardCreated,
    onCardUpdated: handleCardUpdated,
    onCardDeleted: handleCardDeleted,
    onCardMoved: handleCardMoved,
  });
}

export {
  updateCardInBoard,
  deleteCardFromBoard,
  addCardToBoard,
  addColumnToBoard,
  deleteColumnFromBoard,
};
