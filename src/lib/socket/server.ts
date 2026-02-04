import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

// Socket event types
export interface ServerToClientEvents {
  // Board events
  'board:updated': (data: { boardId: string; updates: any }) => void;

  // Column events
  'column:created': (data: { boardId: string; column: any }) => void;
  'column:updated': (data: { boardId: string; columnId: string; updates: any }) => void;
  'column:deleted': (data: { boardId: string; columnId: string }) => void;

  // Card events
  'card:created': (data: { boardId: string; columnId: string; card: any }) => void;
  'card:updated': (data: {
    boardId: string;
    columnId: string;
    cardId: string;
    updates: any;
  }) => void;
  'card:deleted': (data: { boardId: string; columnId: string; cardId: string }) => void;
  'card:move': (data: {
    boardId: string;
    cardId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
  }) => void;
}

export interface ClientToServerEvents {
  // Join board room to receive updates
  'board:join': (boardId: string) => void;
  'board:leave': (boardId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  boardId?: string;
}

// Socket.IO server instance
let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export function initSocketServer(
  httpServer: HttpServer
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on(
    'connection',
    (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
      console.log(`Client connected: ${socket.id}`);

      // Join a board room
      socket.on('board:join', (boardId: string) => {
        socket.join(`board:${boardId}`);
        socket.data.boardId = boardId;
        console.log(`Client ${socket.id} joined board: ${boardId}`);
      });

      // Leave a board room
      socket.on('board:leave', (boardId: string) => {
        socket.leave(`board:${boardId}`);
        delete socket.data.boardId;
        console.log(`Client ${socket.id} left board: ${boardId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    }
  );

  return io;
}

export function getSocketServer(): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null {
  return io;
}

// Helper functions to emit events from API routes
export function emitBoardUpdate(boardId: string, updates: any) {
  if (!io) return;
  io.to(`board:${boardId}`).emit('board:updated', { boardId, updates });
}

export function emitColumnCreated(boardId: string, column: any) {
  if (!io) return;
  io.to(`board:${boardId}`).emit('column:created', { boardId, column });
}

export function emitColumnUpdated(boardId: string, columnId: string, updates: any) {
  if (!io) return;
  io.to(`board:${boardId}`).emit('column:updated', { boardId, columnId, updates });
}

export function emitColumnDeleted(boardId: string, columnId: string) {
  if (!io) return;
  io.to(`board:${boardId}`).emit('column:deleted', { boardId, columnId });
}

export function emitCardCreated(boardId: string, columnId: string, card: any) {
  if (!io) return;
  io.to(`board:${boardId}`).emit('card:created', { boardId, columnId, card });
}

export function emitCardUpdated(boardId: string, columnId: string, cardId: string, updates: any) {
  if (!io) return;
  io.to(`board:${boardId}`).emit('card:updated', { boardId, columnId, cardId, updates });
}

export function emitCardDeleted(boardId: string, columnId: string, cardId: string) {
  if (!io) return;
  io.to(`board:${boardId}`).emit('card:deleted', { boardId, columnId, cardId });
}

export function emitCardMoved(
  boardId: string,
  cardId: string,
  fromColumnId: string,
  toColumnId: string,
  newIndex: number
) {
  if (!io) return;
  io.to(`board:${boardId}`).emit('card:move', {
    boardId,
    cardId,
    fromColumnId,
    toColumnId,
    newIndex,
  });
}
