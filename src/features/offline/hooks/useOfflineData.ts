'use client';

import {
  openDB,
  getAllBoards,
  getBoard,
  saveBoard,
  deleteBoard,
  getCardsByBoard,
  getCard,
  saveCard,
  deleteCard,
  getColumnsByBoard,
  getColumn,
  saveColumn,
  deleteColumn,
  getAll,
  put,
  remove,
  Board,
  Card,
  Column,
  PendingOperation,
  addPendingOperation,
  removePendingOperation,
  getPendingOperations,
} from '@/lib/offline-db';

import { useState, useEffect, useCallback } from 'react';

import { useSyncStore } from './useSyncStore';

interface UseOfflineDataReturn {
  // Board operations
  boards: Board[];
  isLoadingBoards: boolean;
  loadBoards: () => Promise<void>;
  getBoard: (id: string) => Promise<Board | undefined>;
  saveBoard: (board: Board) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;

  // Card operations
  getCardsByBoard: (boardId: string) => Promise<Card[]>;
  getCard: (id: string) => Promise<Card | undefined>;
  saveCard: (card: Card) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;

  // Column operations
  getColumnsByBoard: (boardId: string) => Promise<Column[]>;
  getColumn: (id: string) => Promise<Column | undefined>;
  saveColumn: (column: Column) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;

  // Sync operations
  pendingOperations: PendingOperation[];
  syncNow: () => Promise<void>;
  clearLocalData: () => Promise<void>;
}

export function useOfflineData(): UseOfflineDataReturn {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const {
    isOnline,
    setSyncing,
    setLastSyncTime,
    incrementPendingOperations,
    decrementPendingOperations,
  } = useSyncStore();

  // Load boards from IndexedDB
  const loadBoards = useCallback(async () => {
    setIsLoadingBoards(true);
    try {
      await openDB();
      const loadedBoards = await getAllBoards();
      setBoards(loadedBoards);
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setIsLoadingBoards(false);
    }
  }, []);

  // Load pending operations
  const loadPendingOperations = useCallback(async () => {
    try {
      const ops = await getPendingOperations();
      setPendingOperations(ops);
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBoards();
    loadPendingOperations();
  }, [loadBoards, loadPendingOperations]);

  // Listen for online status to trigger sync
  useEffect(() => {
    if (isOnline) {
      syncNow();
    }
  }, [isOnline]);

  // Board operations
  const getBoardById = useCallback(async (id: string) => {
    await openDB();
    return getBoard(id);
  }, []);

  const saveBoardToDB = useCallback(async (board: Board) => {
    await openDB();
    await saveBoard(board);
    setBoards(prev => {
      const existing = prev.find(b => b.id === board.id);
      if (existing) {
        return prev.map(b => (b.id === board.id ? board : b));
      }
      return [...prev, board];
    });
  }, []);

  const deleteBoardFromDB = useCallback(async (id: string) => {
    await openDB();
    await deleteBoard(id);
    setBoards(prev => prev.filter(b => b.id !== id));
  }, []);

  // Card operations
  const getCardsByBoardId = useCallback(async (boardId: string) => {
    await openDB();
    return getCardsByBoard(boardId);
  }, []);

  const getCardById = useCallback(async (id: string) => {
    await openDB();
    return getCard(id);
  }, []);

  const saveCardToDB = useCallback(async (card: Card) => {
    await openDB();
    await saveCard(card);
  }, []);

  const deleteCardFromDB = useCallback(async (id: string) => {
    await openDB();
    await deleteCard(id);
  }, []);

  // Column operations
  const getColumnsByBoardId = useCallback(async (boardId: string) => {
    await openDB();
    return getColumnsByBoard(boardId);
  }, []);

  const getColumnById = useCallback(async (id: string) => {
    await openDB();
    return getColumn(id);
  }, []);

  const saveColumnToDB = useCallback(async (column: Column) => {
    await openDB();
    await saveColumn(column);
  }, []);

  const deleteColumnFromDB = useCallback(async (id: string) => {
    await openDB();
    await deleteColumn(id);
  }, []);

  // Sync pending operations
  const syncNow = useCallback(async () => {
    if (!isOnline || pendingOperations.length === 0) return;

    setSyncing(true);
    incrementPendingOperations();

    try {
      const ops = await getPendingOperations();

      for (const operation of ops) {
        try {
          const response = await fetch(operation.endpoint, {
            method: operation.method,
            headers: { 'Content-Type': 'application/json' },
            body: operation.data ? JSON.stringify(operation.data) : undefined,
          });

          if (response.ok) {
            await removePendingOperation(operation.id);
            setPendingOperations(prev => prev.filter(op => op.id !== operation.id));
          } else if (response.status === 401) {
            // Unauthorized - might need re-auth
            break;
          }
        } catch (error) {
          console.error('Sync failed for operation:', operation.id, error);
        }
      }

      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
      decrementPendingOperations();
    }
  }, [
    isOnline,
    pendingOperations,
    setSyncing,
    setLastSyncTime,
    incrementPendingOperations,
    decrementPendingOperations,
  ]);

  // Clear all local data
  const clearLocalData = useCallback(async () => {
    await openDB();
    await clearAllData();
    setBoards([]);
    setPendingOperations([]);
  }, []);

  return {
    boards,
    isLoadingBoards,
    loadBoards,
    getBoard: getBoardById,
    saveBoard: saveBoardToDB,
    deleteBoard: deleteBoardFromDB,
    getCardsByBoard: getCardsByBoardId,
    getCard: getCardById,
    saveCard: saveCardToDB,
    deleteCard: deleteCardFromDB,
    getColumnsByBoard: getColumnsByBoardId,
    getColumn: getColumnById,
    saveColumn: saveColumnToDB,
    deleteColumn: deleteColumnFromDB,
    pendingOperations,
    syncNow,
    clearLocalData,
  };
}

// Clear all data helper
async function clearAllData(): Promise<void> {
  const db = await openDB();
  const stores = ['boards', 'cards', 'columns', 'pending-operations'];

  for (const store of stores) {
    const transaction = db.transaction(store, 'readwrite');
    const objectStore = transaction.objectStore(store);
    objectStore.clear();
  }
}
