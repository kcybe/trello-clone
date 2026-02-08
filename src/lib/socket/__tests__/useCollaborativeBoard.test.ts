import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Board, Card, Column } from '../../types';
import { getSocket, useSocket } from '../client';
import { CollaborationUser, CursorPosition } from '../collaboration';
import { useCollaborativeBoard } from '../useCollaborativeBoard';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    id: 'mock-socket-id',
    connected: true,
    disconnected: false,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock useSocket hook
vi.mock('../client', () => ({
  useSocket: vi.fn(() => ({
    socket: {
      id: 'mock-socket-id',
      connected: true,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isConnected: true,
    joinBoard: vi.fn(),
    leaveBoard: vi.fn(),
  })),
  getSocket: vi.fn(() => ({
    id: 'mock-socket-id',
    connected: true,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
}));

// Setup jsdom for document
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

describe('useCollaborativeBoard', () => {
  const mockBoard: Board = {
    id: 'board-1',
    name: 'Test Board',
    columns: [
      {
        id: 'col-1',
        title: 'To Do',
        name: 'to-do',
        cards: [
          {
            id: 'card-1',
            title: 'Test Card',
            description: 'Test Description',
            labels: [],
            attachments: [],
            checklists: [],
            comments: [],
            createdAt: new Date(),
          },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: 'user-1',
  };

  const mockUpdateBoard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Connection Status', () => {
    it('should return isConnected as true when socket is connected', () => {
      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      expect(result.current.isConnected).toBe(true);
    });

    it('should handle socket disconnection', () => {
      vi.mocked(useSocket).mockReturnValue({
        socket: null,
        isConnected: false,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Presence Management', () => {
    it('should track other users presence', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket: any = {
        on: vi.fn((event, callback) => {
          if (event === 'user:joined') {
            callback({
              boardId: 'board-1',
              user: {
                id: 'user-2',
                name: 'Other User',
                color: '#FF6B6B',
                lastActive: Date.now(),
              },
            });
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(useSocket).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      expect(result.current.presence).toHaveLength(1);
      expect(result.current.presence[0].id).toBe('user-2');
    });

    it('should remove users when they leave', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket: any = {
        on: vi.fn((event, callback) => {
          if (event === 'user:left') {
            callback({
              boardId: 'board-1',
              userId: 'user-2',
            });
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(useSocket).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      expect(result.current.presence).toHaveLength(0);
    });
  });

  describe('Cursor Updates', () => {
    it('should emit cursor position updates', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket: any = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(useSocket).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      const cursor: CursorPosition = {
        x: 100,
        y: 200,
        cardId: 'card-1',
      };

      act(() => {
        result.current.updateCursor(cursor);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('cursor:move', {
        boardId: 'board-1',
        cursor,
      });
    });
  });

  describe('Editing Indicators', () => {
    it('should track active editors', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket: any = {
        on: vi.fn((event, callback) => {
          if (event === 'editing:start') {
            callback({
              boardId: 'board-1',
              userId: 'user-2',
              entityType: 'card',
              entityId: 'card-1',
            });
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(useSocket).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      const editors = result.current.activeEditors.get('card:card-1');
      expect(editors).toBeDefined();
      expect(editors?.has('user-2')).toBe(true);
    });

    it('should stop tracking editors when editing ends', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket: any = {
        on: vi.fn((event, callback) => {
          if (event === 'editing:stop') {
            callback({
              boardId: 'board-1',
              userId: 'user-2',
              entityType: 'card',
              entityId: 'card-1',
            });
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(useSocket).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      expect(result.current.activeEditors.get('card:card-1')).toBeUndefined();
    });
  });

  describe('Card Events', () => {
    it('should emit card created event', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket: any = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(useSocket).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      const newCard: Partial<Card> = {
        id: 'card-new',
        title: 'New Card',
      };

      act(() => {
        result.current.emitCardCreated('col-1', newCard);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('card:created', {
        boardId: 'board-1',
        columnId: 'col-1',
        card: expect.objectContaining({
          id: 'card-new',
          title: 'New Card',
        }),
      });
    });

    it('should emit card updated event with version', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket: any = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(useSocket).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      act(() => {
        result.current.emitCardUpdated('col-1', 'card-1', { title: 'Updated Title' });
      });

      // Find the card:updated call (ignoring presence:join)
      const cardUpdatedCall = mockSocket.emit.mock.calls.find(call => call[0] === 'card:updated');

      expect(cardUpdatedCall).toBeDefined();
      expect(cardUpdatedCall[1]).toEqual({
        boardId: 'board-1',
        columnId: 'col-1',
        cardId: 'card-1',
        updates: expect.objectContaining({
          title: 'Updated Title',
          _version: 1,
        }),
      });
    });

    it('should emit card deleted event', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket: any = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(useSocket).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      act(() => {
        result.current.emitCardDeleted('col-1', 'card-1');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('card:deleted', {
        boardId: 'board-1',
        columnId: 'col-1',
        cardId: 'card-1',
      });
    });
  });

  describe('Column Events', () => {
    it('should emit column created event', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket: any = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(useSocket).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      const newColumn: Partial<Column> = {
        id: 'col-new',
        title: 'New Column',
        name: 'new-column',
        cards: [],
      };

      act(() => {
        result.current.emitColumnCreated(newColumn);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('column:created', {
        boardId: 'board-1',
        column: expect.objectContaining({
          id: 'col-new',
          title: 'New Column',
        }),
      });
    });

    it('should emit column deleted event', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket: any = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(useSocket).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        joinBoard: vi.fn(),
        leaveBoard: vi.fn(),
      });

      const { result } = renderHook(() =>
        useCollaborativeBoard('board-1', mockBoard, mockUpdateBoard, 'user-1', 'Test User')
      );

      act(() => {
        result.current.emitColumnDeleted('col-1');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('column:deleted', {
        boardId: 'board-1',
        columnId: 'col-1',
      });
    });
  });
});
