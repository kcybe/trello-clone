/**
 * Socket.IO Standalone Server
 *
 * Run this separately from the Next.js app:
 * npx tsx src/lib/socket/server-standalone.ts
 *
 * Or compile and run:
 * npx tsc --esModuleInterop src/lib/socket/server-standalone.ts
 * node src/lib/socket/server-standalone.js
 */
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.SOCKET_PORT || 3001;

interface ServerToClientEvents {
  'board:updated': (data: { boardId: string; updates: any }) => void;
  'column:created': (data: { boardId: string; column: any }) => void;
  'column:updated': (data: { boardId: string; columnId: string; updates: any }) => void;
  'column:deleted': (data: { boardId: string; columnId: string }) => void;
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

interface ClientToServerEvents {
  'board:join': (boardId: string) => void;
  'board:leave': (boardId: string) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  userId?: string;
  boardId?: string;
}

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  }
);

io.on('connection', socket => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('board:join', (boardId: string) => {
    socket.join(`board:${boardId}`);
    socket.data.boardId = boardId;
    console.log(`Client ${socket.id} joined board: ${boardId}`);
  });

  socket.on('board:leave', (boardId: string) => {
    socket.leave(`board:${boardId}`);
    delete socket.data.boardId;
    console.log(`Client ${socket.id} left board: ${boardId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  io.close(() => {
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  io.close(() => {
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
