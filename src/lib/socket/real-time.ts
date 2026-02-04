'use client';

import { useCallback, useRef, useEffect } from 'react';

import { Board, Column, Card } from '../../features/board/types';
import { getSocket } from './client';

// Types for optimistic updates
export interface OptimisticCard {
  id: string;
  title: string;
  description?: string;
  labels: any[];
  assignee?: string;
  attachments: any[];
  checklists: any[];
  dueDate?: string | null;
  createdAt: string;
  comments: any[];
  color?: string;
  columnId: string;
}

export interface OptimisticColumn {
  id: string;
  title: string;
  name: string;
  cards: OptimisticCard[];
}

// Hook to handle real-time board updates
export function useRealTimeBoard(
  boardId: string | null,
  currentBoard: Board | null,
  updateBoard: (updateFn: (board: Board) => Board) => void
) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const boardIdRef = useRef(boardId);

  // Initialize socket
  useEffect(() => {
    socketRef.current = getSocket();

    return () => {
      // Cleanup handled by singleton
    };
  }, []);

  // Update board ID ref
  useEffect(() => {
    boardIdRef.current = boardId;
  }, [boardId]);

  // Join board room when connected and boardId is available
  useEffect(() => {
    if (!boardId || !socketRef.current) return;

    const socket = socketRef.current;

    const onConnect = () => {
      socket.emit('board:join', boardId);
    };

    const onDisconnect = () => {
      // Will reconnect automatically
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      socket.emit('board:join', boardId);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.emit('board:leave', boardId);
    };
  }, [boardId]);

  // Set up event listeners
  useEffect(() => {
    if (!boardId || !socketRef.current) return;

    const socket = socketRef.current;

    // Card events
    const handleCardCreated = (data: { columnId: string; card: OptimisticCard }) => {
      // Skip if this is our own local update (ID matches timestamp pattern)
      if (
        data.card.id.startsWith('card-') &&
        data.card.id.includes(String(Date.now()).slice(0, -4))
      ) {
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

      updateBoard(board => ({
        ...board,
        columns: board.columns.map(col =>
          col.id === data.columnId ? { ...col, cards: [...col.cards, card] } : col
        ),
      }));
    };

    const handleCardUpdated = (data: { columnId: string; cardId: string; updates: any }) => {
      updateBoard(board => ({
        ...board,
        columns: board.columns.map(col =>
          col.id === data.columnId
            ? {
                ...col,
                cards: col.cards.map(card =>
                  card.id === data.cardId ? { ...card, ...data.updates } : card
                ),
              }
            : col
        ),
      }));
    };

    const handleCardDeleted = (data: { columnId: string; cardId: string }) => {
      updateBoard(board => ({
        ...board,
        columns: board.columns.map(col =>
          col.id === data.columnId
            ? { ...col, cards: col.cards.filter(card => card.id !== data.cardId) }
            : col
        ),
      }));
    };

    const handleCardMoved = (data: {
      cardId: string;
      fromColumnId: string;
      toColumnId: string;
      newIndex: number;
    }) => {
      // Find the card
      const fromColumn = currentBoard?.columns.find(col => col.id === data.fromColumnId);
      const card = fromColumn?.cards.find(c => c.id === data.cardId);
      if (!card) return;

      updateBoard(board => {
        let newColumns = board.columns.map(col => {
          if (col.id === data.fromColumnId) {
            return { ...col, cards: col.cards.filter(c => c.id !== data.cardId) };
          }
          return col;
        });

        newColumns = newColumns.map(col => {
          if (col.id === data.toColumnId) {
            const newCards = [...col.cards];
            newCards.splice(data.newIndex, 0, card);
            return { ...col, cards: newCards };
          }
          return col;
        });

        return { ...board, columns: newColumns };
      });
    };

    // Column events
    const handleColumnCreated = (data: { column: OptimisticColumn }) => {
      const column: Column = {
        id: data.column.id,
        title: data.column.title,
        name: data.column.name,
        cards: data.column.cards.map(card => ({
          ...card,
          createdAt: new Date(card.createdAt),
          dueDate: card.dueDate ? new Date(card.dueDate) : null,
        })),
      };

      updateBoard(board => ({
        ...board,
        columns: [...board.columns, column],
      }));
    };

    const handleColumnUpdated = (data: { columnId: string; updates: any }) => {
      updateBoard(board => ({
        ...board,
        columns: board.columns.map(col =>
          col.id === data.columnId ? { ...col, ...data.updates } : col
        ),
      }));
    };

    const handleColumnDeleted = (data: { columnId: string }) => {
      updateBoard(board => ({
        ...board,
        columns: board.columns.filter(col => col.id !== data.columnId),
      }));
    };

    // Board events
    const handleBoardUpdated = (data: { updates: any }) => {
      updateBoard(board => ({
        ...board,
        ...data.updates,
      }));
    };

    // Register listeners
    socket.on('card:created', handleCardCreated);
    socket.on('card:updated', handleCardUpdated);
    socket.on('card:deleted', handleCardDeleted);
    socket.on('card:move', handleCardMoved);
    socket.on('column:created', handleColumnCreated);
    socket.on('column:updated', handleColumnUpdated);
    socket.on('column:deleted', handleColumnDeleted);
    socket.on('board:updated', handleBoardUpdated);

    // Cleanup
    return () => {
      socket.off('card:created', handleCardCreated);
      socket.off('card:updated', handleCardUpdated);
      socket.off('card:deleted', handleCardDeleted);
      socket.off('card:move', handleCardMoved);
      socket.off('column:created', handleColumnCreated);
      socket.off('column:updated', handleColumnUpdated);
      socket.off('column:deleted', handleColumnDeleted);
      socket.off('board:updated', handleBoardUpdated);
    };
  }, [boardId, currentBoard, updateBoard]);

  // Emitter functions for sending updates
  const emitCardCreated = useCallback((columnId: string, card: OptimisticCard) => {
    if (!boardIdRef.current || !socketRef.current) return;
    socketRef.current.emit('card:created', { boardId: boardIdRef.current, columnId, card });
  }, []);

  const emitCardUpdated = useCallback((columnId: string, cardId: string, updates: any) => {
    if (!boardIdRef.current || !socketRef.current) return;
    socketRef.current.emit('card:updated', {
      boardId: boardIdRef.current,
      columnId,
      cardId,
      updates,
    });
  }, []);

  const emitCardDeleted = useCallback((columnId: string, cardId: string) => {
    if (!boardIdRef.current || !socketRef.current) return;
    socketRef.current.emit('card:deleted', { boardId: boardIdRef.current, columnId, cardId });
  }, []);

  const emitCardMoved = useCallback(
    (cardId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
      if (!boardIdRef.current || !socketRef.current) return;
      socketRef.current.emit('card:move', {
        boardId: boardIdRef.current,
        cardId,
        fromColumnId,
        toColumnId,
        newIndex,
      });
    },
    []
  );

  const emitColumnCreated = useCallback((column: OptimisticColumn) => {
    if (!boardIdRef.current || !socketRef.current) return;
    socketRef.current.emit('column:created', { boardId: boardIdRef.current, column });
  }, []);

  const emitColumnUpdated = useCallback((columnId: string, updates: any) => {
    if (!boardIdRef.current || !socketRef.current) return;
    socketRef.current.emit('column:updated', { boardId: boardIdRef.current, columnId, updates });
  }, []);

  const emitColumnDeleted = useCallback((columnId: string) => {
    if (!boardIdRef.current || !socketRef.current) return;
    socketRef.current.emit('column:deleted', { boardId: boardIdRef.current, columnId });
  }, []);

  const emitBoardUpdated = useCallback((updates: any) => {
    if (!boardIdRef.current || !socketRef.current) return;
    socketRef.current.emit('board:updated', { boardId: boardIdRef.current, updates });
  }, []);

  return {
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
