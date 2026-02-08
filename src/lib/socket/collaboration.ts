// Real-time collaboration types for concurrent editing
export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  lastActive: number;
}

export interface CursorPosition {
  x: number;
  y: number;
  cardId?: string;
  columnId?: string;
}

export interface BoardPresence {
  boardId: string;
  users: CollaborationUser[];
  timestamp: number;
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'operational-transform' | 'merge';
  timestamp: number;
  sourceUserId: string;
}

export interface CollaborativeEdit {
  id: string;
  type: 'card' | 'column' | 'board';
  entityId: string;
  userId: string;
  operation: 'create' | 'update' | 'delete' | 'move';
  data: any;
  version: number;
  timestamp: number;
  resolved: boolean;
}

export interface EditOperation {
  type: 'set' | 'delete' | 'move' | 'insert';
  path: string[];
  value?: any;
  fromIndex?: number;
  toIndex?: number;
}

export interface OperationalTransform {
  operation: EditOperation;
  baseVersion: number;
  transformedOperation: EditOperation;
}

export interface UserAwareness {
  oding: string;
  user: CollaborationUser;
  selection?: {
    cardId: string;
    columnId: string;
  };
}

// Generate random user color for collaboration
export function generateUserColor(): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Create collaboration user
export function createCollaborationUser(id: string, name: string): CollaborationUser {
  return {
    id,
    name,
    color: generateUserColor(),
    lastActive: Date.now(),
  };
}
