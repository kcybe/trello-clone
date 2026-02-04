'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useSocketEmitter, useRealTimeBoard } from '../../../lib/socket';
import { Board, Card, Column } from '../types';
import { useBoard, UseBoardReturn } from './useBoard';

// Extended useBoard return type with socket functionality
export interface UseBoardSocketReturn extends UseBoardReturn {
  // Socket status
  isSocketConnected: boolean;

  // Socket emit functions (for external use)
  emitCardCreated: (columnId: string, card: Partial<Card>) => void;
  emitCardUpdated: (columnId: string, cardId: string, updates: Partial<Card>) => void;
  emitCardDeleted: (columnId: string, cardId: string) => void;
  emitCardMoved: (
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    newIndex: number
  ) => void;
  emitColumnCreated: (column: Partial<Column>) => void;
  emitColumnUpdated: (columnId: string, updates: Partial<Column>) => void;
  emitColumnDeleted: (columnId: string) => void;
  emitBoardUpdated: (updates: Partial<Board>) => void;
}

export function useBoardSocket(user: { id: string } | null): UseBoardSocketReturn {
  // Get the base board state and actions
  const boardActions = useBoard(user);

  // Get the current board ID
  const currentBoardId = boardActions.currentBoard?.id || null;

  // Socket emitter for sending events
  const {
    isConnected: isSocketConnected,
    emitCardCreated,
    emitCardUpdated,
    emitCardDeleted,
    emitCardMoved,
    emitColumnCreated,
    emitColumnUpdated,
    emitColumnDeleted,
    emitBoardUpdated,
  } = useSocketEmitter(currentBoardId);

  // Real-time board for receiving updates
  useRealTimeBoard(currentBoardId, boardActions.currentBoard, boardActions.updateCurrentBoard);

  // Wrap the CRUD operations to emit socket events
  const addCard = useCallback(
    (columnId: string, title: string) => {
      // First add locally
      boardActions.addCard(columnId, title);

      // Then emit socket event
      const newCard: Partial<Card> = {
        id: `card-${Date.now()}`,
        title,
        createdAt: new Date().toISOString(),
        labels: [],
        attachments: [],
        checklists: [],
        comments: [],
      };
      emitCardCreated(columnId, newCard);
    },
    [boardActions, emitCardCreated]
  );

  const deleteCard = useCallback(
    (columnId: string, cardId: string) => {
      boardActions.deleteCard(columnId, cardId);
      emitCardDeleted(columnId, cardId);
    },
    [boardActions, emitCardDeleted]
  );

  const archiveCard = useCallback(
    (columnId: string, cardId: string) => {
      boardActions.archiveCard(columnId, cardId);
      emitCardDeleted(columnId, cardId);
    },
    [boardActions, emitCardDeleted]
  );

  const unarchiveCard = useCallback(
    (columnId: string, cardId: string) => {
      boardActions.unarchiveCard(columnId, cardId);
      // Re-create the card in the column
      const column = boardActions.currentBoard?.columns.find(c => c.id === columnId);
      const card = column?.archivedCards?.find(c => c.id === cardId);
      if (card) {
        emitCardCreated(columnId, { ...card, archived: undefined });
      }
    },
    [boardActions, emitCardCreated]
  );

  const permanentlyDeleteCard = useCallback(
    (columnId: string, cardId: string) => {
      boardActions.permanentlyDeleteCard(columnId, cardId);
      emitCardDeleted(columnId, cardId);
    },
    [boardActions, emitCardDeleted]
  );

  const duplicateCard = useCallback(
    (columnId: string, cardId: string) => {
      boardActions.duplicateCard(columnId, cardId);
      // Find the new card and emit created event
      const column = boardActions.currentBoard?.columns.find(c => c.id === columnId);
      const cards = column?.cards || [];
      const newCard = cards.find(c => c.id.startsWith('card-') && c.title.includes('(Copy)'));
      if (newCard) {
        emitCardCreated(columnId, newCard);
      }
    },
    [boardActions, emitCardCreated]
  );

  const moveCard = useCallback(
    (cardId: string, fromColumnId: string, toColumnId: string) => {
      boardActions.moveCard(cardId, fromColumnId, toColumnId);
      // Find the new index in the destination column
      const toColumn = boardActions.currentBoard?.columns.find(c => c.id === toColumnId);
      const newIndex = toColumn?.cards.findIndex(c => c.id === cardId) ?? 0;
      emitCardMoved(cardId, fromColumnId, toColumnId, newIndex);
    },
    [boardActions, emitCardMoved]
  );

  const updateCard = useCallback(
    (columnId: string, cardId: string, updates: Partial<Card>) => {
      boardActions.updateCard(columnId, cardId, updates);
      emitCardUpdated(columnId, cardId, updates);
    },
    [boardActions, emitCardUpdated]
  );

  const addColumn = useCallback(
    async (name: string) => {
      boardActions.addColumn(name);
      const newColumn: Partial<Column> = {
        id: `col-${Date.now()}`,
        title: name,
        name: name,
        cards: [],
      };
      emitColumnCreated(newColumn);
    },
    [boardActions, emitColumnCreated]
  );

  const deleteColumn = useCallback(
    async (columnId: string) => {
      boardActions.deleteColumn(columnId);
      emitColumnDeleted(columnId);
    },
    [boardActions, emitColumnDeleted]
  );

  const updateCurrentBoard = useCallback(
    (updateFn: (board: Board) => Board) => {
      boardActions.updateCurrentBoard(updateFn);
      // Get the updated board and emit changes
      if (boardActions.currentBoard) {
        const updates = updateFn(boardActions.currentBoard);
        if (updates.name !== boardActions.currentBoard.name) {
          emitBoardUpdated({ name: updates.name });
        }
      }
    },
    [boardActions, emitBoardUpdated]
  );

  return {
    ...boardActions,
    isSocketConnected,
    addCard,
    deleteCard,
    archiveCard,
    unarchiveCard,
    permanentlyDeleteCard,
    duplicateCard,
    moveCard,
    updateCard,
    addColumn,
    deleteColumn,
    updateCurrentBoard,
    emitCardCreated,
    emitCardUpdated,
    emitCardDeleted,
    emitCardMoved,
    emitColumnCreated,
    emitColumnUpdated,
    emitColumnDeleted,
    emitBoardUpdated,
  };
}
