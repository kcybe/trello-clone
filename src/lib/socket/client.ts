'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// Socket event types (mirrored from server)
export interface BoardUpdateData {
  boardId: string;
  updates: any;
}

export interface ColumnCreatedData {
  boardId: string;
  column: any;
}

export interface ColumnUpdatedData {
  boardId: string;
  columnId: string;
  updates: any;
}

export interface ColumnDeletedData {
  boardId: string;
  columnId: string;
}

export interface CardCreatedData {
  boardId: string;
  columnId: string;
  card: any;
}

export interface CardUpdatedData {
  boardId: string;
  columnId: string;
  cardId: string;
  updates: any;
}

export interface CardDeletedData {
  boardId: string;
  columnId: string;
  cardId: string;
}

export interface CardMovedData {
  boardId: string;
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  newIndex: number;
}

export interface SocketEvents {
  'board:updated': (data: BoardUpdateData) => void;
  'column:created': (data: ColumnCreatedData) => void;
  'column:updated': (data: ColumnUpdatedData) => void;
  'column:deleted': (data: ColumnDeletedData) => void;
  'card:created': (data: CardCreatedData) => void;
  'card:updated': (data: CardUpdatedData) => void;
  'card:deleted': (data: CardDeletedData) => void;
  'card:move': (data: CardMovedData) => void;
}

// Default socket URL - uses NEXT_PUBLIC environment variable
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Socket type (using any to avoid type issues)
type SocketType = {
  id: string;
  connected: boolean;
  disconnected: boolean;
  on: (event: string, fn: (...args: any[]) => void) => SocketType;
  off: (event: string, fn?: (...args: any[]) => void) => SocketType;
  emit: (event: string, ...args: any[]) => SocketType;
  disconnect: () => SocketType;
};

// Singleton socket instance
let socket: SocketType | null = null;

export function getSocket(): SocketType | null {
  if (!socket) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const io = require('socket.io-client');
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket?.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket?.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
    });

    socket?.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    socket?.on('reconnect', (attemptNumber: number) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    socket?.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });
  }

  return socket;
}

// Hook for using socket in React components
export function useSocket() {
  const socketRef = useRef<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    socketRef.current = sock;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);

    setIsConnected(sock.connected);

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
    };
  }, []);

  const joinBoard = useCallback((boardId: string) => {
    const sock = socketRef.current || getSocket();
    if (!sock) return;
    sock.emit('board:join', boardId);
  }, []);

  const leaveBoard = useCallback((boardId: string) => {
    const sock = socketRef.current || getSocket();
    if (!sock) return;
    sock.emit('board:leave', boardId);
  }, []);

  return {
    socket: socketRef.current || getSocket() || null,
    isConnected,
    joinBoard,
    leaveBoard,
  };
}

// Hook for listening to board updates
export function useBoardSocketEvents(
  boardId: string | null,
  handlers: {
    onBoardUpdate?: (data: BoardUpdateData) => void;
    onColumnCreated?: (data: ColumnCreatedData) => void;
    onColumnUpdated?: (data: ColumnUpdatedData) => void;
    onColumnDeleted?: (data: ColumnDeletedData) => void;
    onCardCreated?: (data: CardCreatedData) => void;
    onCardUpdated?: (data: CardUpdatedData) => void;
    onCardDeleted?: (data: CardDeletedData) => void;
    onCardMoved?: (data: CardMovedData) => void;
  }
) {
  const { socket, isConnected, joinBoard, leaveBoard } = useSocket();

  useEffect(() => {
    if (!boardId) return;
    if (!socket) return;

    // Join the board room
    joinBoard(boardId);

    // Set up event listeners
    if (handlers.onBoardUpdate) {
      socket.on('board:updated', handlers.onBoardUpdate);
    }
    if (handlers.onColumnCreated) {
      socket.on('column:created', handlers.onColumnCreated);
    }
    if (handlers.onColumnUpdated) {
      socket.on('column:updated', handlers.onColumnUpdated);
    }
    if (handlers.onColumnDeleted) {
      socket.on('column:deleted', handlers.onColumnDeleted);
    }
    if (handlers.onCardCreated) {
      socket.on('card:created', handlers.onCardCreated);
    }
    if (handlers.onCardUpdated) {
      socket.on('card:updated', handlers.onCardUpdated);
    }
    if (handlers.onCardDeleted) {
      socket.on('card:deleted', handlers.onCardDeleted);
    }
    if (handlers.onCardMoved) {
      socket.on('card:move', handlers.onCardMoved);
    }

    return () => {
      // Leave the board room
      leaveBoard(boardId);

      // Clean up event listeners
      if (handlers.onBoardUpdate) {
        socket.off('board:updated', handlers.onBoardUpdate);
      }
      if (handlers.onColumnCreated) {
        socket.off('column:created', handlers.onColumnCreated);
      }
      if (handlers.onColumnUpdated) {
        socket.off('column:updated', handlers.onColumnUpdated);
      }
      if (handlers.onColumnDeleted) {
        socket.off('column:deleted', handlers.onColumnDeleted);
      }
      if (handlers.onCardCreated) {
        socket.off('card:created', handlers.onCardCreated);
      }
      if (handlers.onCardUpdated) {
        socket.off('card:updated', handlers.onCardUpdated);
      }
      if (handlers.onCardDeleted) {
        socket.off('card:deleted', handlers.onCardDeleted);
      }
      if (handlers.onCardMoved) {
        socket.off('card:move', handlers.onCardMoved);
      }
    };
  }, [boardId, socket, isConnected, joinBoard, leaveBoard, handlers]);

  return { isConnected };
}

// Disconnect socket (for cleanup)
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
