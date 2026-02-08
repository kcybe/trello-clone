'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Board, Card, Column } from '../../types';
import {
  getSocket,
  useSocket,
  CardCreatedData,
  CardUpdatedData,
  CardDeletedData,
  CardMovedData,
  ColumnCreatedData,
  ColumnDeletedData,
  BoardUpdateData,
} from './client';
import {
  CollaborationUser,
  BoardPresence,
  CollaborativeEdit,
  createCollaborationUser,
  UserAwareness,
  CursorPosition,
} from './collaboration';

// Types for enhanced socket events
interface ExtendedServerToClientEvents {
  // Existing events
  'board:updated': (data: BoardUpdateData) => void;
  'column:created': (data: ColumnCreatedData) => void;
  'column:updated': (data: any) => void;
  'column:deleted': (data: ColumnDeletedData) => void;
  'card:created': (data: CardCreatedData) => void;
  'card:updated': (data: CardUpdatedData) => void;
  'card:deleted': (data: CardDeletedData) => void;
  'card:move': (data: CardMovedData) => void;

  // New collaboration events
  'user:joined': (data: { boardId: string; user: CollaborationUser }) => void;
  'user:left': (data: { boardId: string; userId: string }) => void;
  'presence:update': (data: BoardPresence) => void;
  'cursor:update': (data: { boardId: string; userId: string; cursor: CursorPosition }) => void;
  'editing:start': (data: {
    boardId: string;
    userId: string;
    entityType: 'card' | 'column';
    entityId: string;
  }) => void;
  'editing:stop': (data: {
    boardId: string;
    userId: string;
    entityType: 'card' | 'column';
    entityId: string;
  }) => void;
  'conflict:detected': (data: {
    boardId: string;
    edit: CollaborativeEdit;
    conflictingEdits: CollaborativeEdit[];
  }) => void;
}

interface ExtendedClientToServerEvents {
  'board:join': (boardId: string) => void;
  'board:leave': (boardId: string) => void;

  // New collaboration events
  'presence:join': (data: { boardId: string; user: CollaborationUser }) => void;
  'presence:leave': (data: { boardId: string; userId: string }) => void;
  'cursor:move': (data: { boardId: string; cursor: CursorPosition }) => void;
  'editing:begin': (data: { entityType: 'card' | 'column'; entityId: string }) => void;
  'editing:end': (data: { entityType: 'card' | 'column'; entityId: string }) => void;
  'edit:apply': (data: CollaborativeEdit) => void;
  'conflict:resolve': (data: {
    editId: string;
    resolution: 'accept' | 'reject' | 'merge';
    mergedData?: any;
  }) => void;
}

// Version tracking for conflict resolution
const entityVersions: Map<string, number> = new Map();

// Hook for enhanced real-time collaboration
export function useCollaborativeBoard(
  boardId: string | null,
  currentBoard: Board | null,
  updateBoard: (updateFn: (board: Board) => Board) => void,
  userId: string | null,
  userName: string | null
) {
  const { socket, isConnected, joinBoard, leaveBoard } = useSocket();
  const [presence, setPresence] = useState<CollaborationUser[]>([]);
  const [activeEditors, setActiveEditors] = useState<Map<string, Set<string>>>(new Map());
  const boardIdRef = useRef(boardId);
  const userRef = useRef<CollaborationUser | null>(null);

  // Initialize user
  useEffect(() => {
    if (userId && userName) {
      userRef.current = createCollaborationUser(userId, userName);
    }
  }, [userId, userName]);

  // Update board ID ref
  useEffect(() => {
    boardIdRef.current = boardId;
  }, [boardId]);

  // Join board and announce presence
  useEffect(() => {
    if (!boardId || !socket || !userRef.current) return;

    joinBoard(boardId);

    // Announce presence
    socket.emit('presence:join', { boardId, user: userRef.current });

    // Set up presence listeners
    const handleUserJoined = (data: { boardId: string; user: CollaborationUser }) => {
      if (data.boardId === boardId) {
        setPresence(prev => {
          const exists = prev.find(u => u.id === data.user.id);
          if (exists) return prev;
          return [...prev, data.user];
        });
      }
    };

    const handleUserLeft = (data: { boardId: string; userId: string }) => {
      if (data.boardId === boardId) {
        setPresence(prev => prev.filter(u => u.id !== data.userId));
      }
    };

    const handlePresenceUpdate = (data: BoardPresence) => {
      if (data.boardId === boardId) {
        setPresence(data.users);
      }
    };

    const handleEditingStart = (data: {
      boardId: string;
      userId: string;
      entityType: 'card' | 'column';
      entityId: string;
    }) => {
      if (data.boardId === boardId && data.userId !== userRef.current?.id) {
        setActiveEditors(prev => {
          const key = `${data.entityType}:${data.entityId}`;
          const editors = new Set(prev.get(key) || []);
          editors.add(data.userId);
          const newMap = new Map(prev);
          newMap.set(key, editors);
          return newMap;
        });
      }
    };

    const handleEditingStop = (data: {
      boardId: string;
      userId: string;
      entityType: 'card' | 'column';
      entityId: string;
    }) => {
      if (data.boardId === boardId && data.userId !== userRef.current?.id) {
        setActiveEditors(prev => {
          const key = `${data.entityType}:${data.entityId}`;
          const editors = new Set(prev.get(key) || []);
          editors.delete(data.userId);
          const newMap = new Map(prev);
          if (editors.size === 0) {
            newMap.delete(key);
          } else {
            newMap.set(key, editors);
          }
          return newMap;
        });
      }
    };

    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('editing:start', handleEditingStart);
    socket.on('editing:stop', handleEditingStop);

    return () => {
      socket.emit('presence:leave', { boardId, userId: userRef.current?.id });
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('editing:start', handleEditingStart);
      socket.off('editing:stop', handleEditingStop);
    };
  }, [boardId, socket, joinBoard, userId]);

  // Set up real-time event listeners
  useEffect(() => {
    if (!boardId || !socket) return;

    const handleCardCreated = (data: CardCreatedData) => {
      if (
        data.card.id.startsWith('card-') &&
        data.card.id.includes(String(Date.now()).slice(0, -4))
      ) {
        // Skip local/optimistic updates
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

    const handleCardUpdated = (data: CardUpdatedData) => {
      // Get current version
      const currentVersion = entityVersions.get(`card:${data.cardId}`) || 0;

      // If incoming update is older, skip it (last-write-wins)
      if (data.updates._version && data.updates._version < currentVersion) {
        console.log('Skipping outdated update for card:', data.cardId);
        return;
      }

      updateBoard(board => ({
        ...board,
        columns: board.columns.map(col =>
          col.id === data.columnId
            ? {
                ...col,
                cards: col.cards.map(card =>
                  card.id === data.cardId
                    ? { ...card, ...data.updates, _version: currentVersion + 1 }
                    : card
                ),
              }
            : col
        ),
      }));

      entityVersions.set(`card:${data.cardId}`, currentVersion + 1);
    };

    const handleCardDeleted = (data: CardDeletedData) => {
      updateBoard(board => ({
        ...board,
        columns: board.columns.map(col =>
          col.id === data.columnId
            ? { ...col, cards: col.cards.filter(card => card.id !== data.cardId) }
            : col
        ),
      }));
    };

    const handleCardMoved = (data: CardMovedData) => {
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

    const handleColumnCreated = (data: ColumnCreatedData) => {
      const column: Column = {
        id: data.column.id,
        title: data.column.title,
        name: data.column.name,
        cards: data.column.cards || [],
      };

      updateBoard(board => ({
        ...board,
        columns: [...board.columns, column],
      }));
    };

    const handleColumnDeleted = (data: ColumnDeletedData) => {
      updateBoard(board => ({
        ...board,
        columns: board.columns.filter(col => col.id !== data.columnId),
      }));
    };

    socket.on('card:created', handleCardCreated);
    socket.on('card:updated', handleCardUpdated);
    socket.on('card:deleted', handleCardDeleted);
    socket.on('card:move', handleCardMoved);
    socket.on('column:created', handleColumnCreated);
    socket.on('column:deleted', handleColumnDeleted);

    return () => {
      socket.off('card:created', handleCardCreated);
      socket.off('card:updated', handleCardUpdated);
      socket.off('card:deleted', handleCardDeleted);
      socket.off('card:move', handleCardMoved);
      socket.off('column:created', handleColumnCreated);
      socket.off('column:deleted', handleColumnDeleted);
    };
  }, [boardId, socket, currentBoard, updateBoard]);

  // Cursor tracking
  const updateCursor = useCallback(
    (cursor: CursorPosition) => {
      if (!boardIdRef.current || !socket || !userRef.current) return;
      socket.emit('cursor:move', { boardId: boardIdRef.current, cursor });
    },
    [socket]
  );

  // Editing indicators
  const startEditing = useCallback(
    (entityType: 'card' | 'column', entityId: string) => {
      if (!boardIdRef.current || !socket || !userRef.current) return;
      socket.emit('editing:begin', { entityType, entityId });
    },
    [socket]
  );

  const stopEditing = useCallback(
    (entityType: 'card' | 'column', entityId: string) => {
      if (!boardIdRef.current || !socket || !userRef.current) return;
      socket.emit('editing:end', { entityType, entityId });
    },
    [socket]
  );

  // Emitter functions
  const emitCardCreated = useCallback(
    (columnId: string, card: Partial<Card>) => {
      if (!boardIdRef.current || !socket) return;
      socket.emit('card:created', { boardId: boardIdRef.current, columnId, card });
    },
    [socket]
  );

  const emitCardUpdated = useCallback(
    (columnId: string, cardId: string, updates: Partial<Card>) => {
      if (!boardIdRef.current || !socket) return;
      const currentVersion = entityVersions.get(`card:${cardId}`) || 0;
      socket.emit('card:updated', {
        boardId: boardIdRef.current,
        columnId,
        cardId,
        updates: { ...updates, _version: currentVersion + 1 },
      });
    },
    [socket]
  );

  const emitCardDeleted = useCallback(
    (columnId: string, cardId: string) => {
      if (!boardIdRef.current || !socket) return;
      socket.emit('card:deleted', { boardId: boardIdRef.current, columnId, cardId });
    },
    [socket]
  );

  const emitCardMoved = useCallback(
    (cardId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
      if (!boardIdRef.current || !socket) return;
      socket.emit('card:move', {
        boardId: boardIdRef.current,
        cardId,
        fromColumnId,
        toColumnId,
        newIndex,
      });
    },
    [socket]
  );

  const emitColumnCreated = useCallback(
    (column: Partial<Column>) => {
      if (!boardIdRef.current || !socket) return;
      socket.emit('column:created', { boardId: boardIdRef.current, column });
    },
    [socket]
  );

  const emitColumnDeleted = useCallback(
    (columnId: string) => {
      if (!boardIdRef.current || !socket) return;
      socket.emit('column:deleted', { boardId: boardIdRef.current, columnId });
    },
    [socket]
  );

  return {
    isConnected,
    presence,
    activeEditors,
    updateCursor,
    startEditing,
    stopEditing,
    emitCardCreated,
    emitCardUpdated,
    emitCardDeleted,
    emitCardMoved,
    emitColumnCreated,
    emitColumnDeleted,
  };
}
