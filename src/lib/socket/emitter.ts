'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

import { getSocket, useSocket } from './client';

// Hook to emit socket events when board changes occur
export function useSocketEmitter(boardId: string | null) {
  const { socket, isConnected, joinBoard, leaveBoard } = useSocket();
  const boardIdRef = useRef(boardId);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  // Update ref when boardId changes
  useEffect(() => {
    boardIdRef.current = boardId;
    if (boardId) {
      joinBoard(boardId);
    }
  }, [boardId, joinBoard]);

  const emitCardCreated = useCallback(
    (columnId: string, card: any) => {
      if (!boardIdRef.current || !socket) return;
      socket.emit('card:created', { boardId: boardIdRef.current, columnId, card });
    },
    [socket]
  );

  const emitCardUpdated = useCallback(
    (columnId: string, cardId: string, updates: any) => {
      if (!boardIdRef.current || !socket) return;
      socket.emit('card:updated', { boardId: boardIdRef.current, columnId, cardId, updates });
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
    (column: any) => {
      if (!boardIdRef.current || !socket) return;
      socket.emit('column:created', { boardId: boardIdRef.current, column });
    },
    [socket]
  );

  const emitColumnUpdated = useCallback(
    (columnId: string, updates: any) => {
      if (!boardIdRef.current || !socket) return;
      socket.emit('column:updated', { boardId: boardIdRef.current, columnId, updates });
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

  const emitBoardUpdated = useCallback(
    (updates: any) => {
      if (!boardIdRef.current || !socket) return;
      socket.emit('board:updated', { boardId: boardIdRef.current, updates });
    },
    [socket]
  );

  return {
    isConnected,
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
