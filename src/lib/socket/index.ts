// Socket.IO client utilities
export * from './client';

// Socket sync hooks
export * from './hooks';

// Socket emitter hooks
export * from './emitter';

// Real-time board hook
export * from './real-time';

// Collaboration features
export * from './collaboration';
export * from './useCollaborativeBoard';

// Re-export types for convenience
export type {
  BoardUpdateData,
  ColumnCreatedData,
  ColumnUpdatedData,
  ColumnDeletedData,
  CardCreatedData,
  CardUpdatedData,
  CardDeletedData,
  CardMovedData,
} from './client';
