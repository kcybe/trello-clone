'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingOperations: number;
  syncErrors: Array<{ id: string; error: string; timestamp: number }>;

  // Actions
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: number) => void;
  incrementPendingOperations: () => void;
  decrementPendingOperations: () => void;
  addSyncError: (error: { id: string; error: string }) => void;
  clearSyncErrors: () => void;
  reset: () => void;
}

const initialState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncTime: null as number | null,
  pendingOperations: 0,
  syncErrors: [] as Array<{ id: string; error: string; timestamp: number }>,
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setOnline: online => set({ isOnline: online }),

      setSyncing: syncing => set({ isSyncing: syncing }),

      setLastSyncTime: time => set({ lastSyncTime: time }),

      incrementPendingOperations: () =>
        set(state => ({ pendingOperations: state.pendingOperations + 1 })),

      decrementPendingOperations: () =>
        set(state => ({
          pendingOperations: Math.max(0, state.pendingOperations - 1),
        })),

      addSyncError: error =>
        set(state => ({
          syncErrors: [...state.syncErrors, { ...error, timestamp: Date.now() }].slice(-50), // Keep last 50 errors
        })),

      clearSyncErrors: () => set({ syncErrors: [] }),

      reset: () => set(initialState),
    }),
    {
      name: 'sync-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        lastSyncTime: state.lastSyncTime,
        syncErrors: state.syncErrors,
      }),
    }
  )
);
