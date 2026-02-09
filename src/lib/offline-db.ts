// IndexedDB database name and version
const DB_NAME = 'trello-clone-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  BOARDS: 'boards',
  CARDS: 'cards',
  COLUMNS: 'columns',
  LABELS: 'labels',
  PENDING_OPERATIONS: 'pending-operations',
  SETTINGS: 'settings',
} as const;

// Database instance
let dbInstance: IDBDatabase | null = null;

// Open database connection
export async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Boards store
      if (!db.objectStoreNames.contains(STORES.BOARDS)) {
        db.createObjectStore(STORES.BOARDS, { keyPath: 'id' });
      }

      // Cards store with indexes
      if (!db.objectStoreNames.contains(STORES.CARDS)) {
        const cardsStore = db.createObjectStore(STORES.CARDS, { keyPath: 'id' });
        cardsStore.createIndex('boardId', 'boardId', { unique: false });
        cardsStore.createIndex('columnId', 'columnId', { unique: false });
        cardsStore.createIndex('dueDate', 'dueDate', { unique: false });
      }

      // Columns store with indexes
      if (!db.objectStoreNames.contains(STORES.COLUMNS)) {
        const columnsStore = db.createObjectStore(STORES.COLUMNS, { keyPath: 'id' });
        columnsStore.createIndex('boardId', 'boardId', { unique: false });
      }

      // Labels store
      if (!db.objectStoreNames.contains(STORES.LABELS)) {
        db.createObjectStore(STORES.LABELS, { keyPath: 'id' });
      }

      // Pending operations store
      if (!db.objectStoreNames.contains(STORES.PENDING_OPERATIONS)) {
        const opsStore = db.createObjectStore(STORES.PENDING_OPERATIONS, { keyPath: 'id' });
        opsStore.createIndex('type', 'type', { unique: false });
        opsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };
  });
}

// Generic CRUD operations
export async function get<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function put<T>(storeName: string, data: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function remove(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clear(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Query by index
export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: string
): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Batch operations
export async function putMany<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    for (const item of items) {
      store.put(item);
    }
  });
}

export async function removeMany(storeName: string, ids: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    for (const id of ids) {
      store.delete(id);
    }
  });
}

// Board-specific operations
export async function getBoard(id: string): Promise<Board | undefined> {
  return get<Board>(STORES.BOARDS, id);
}

export async function getAllBoards(): Promise<Board[]> {
  return getAll<Board>(STORES.BOARDS);
}

export async function saveBoard(board: Board): Promise<void> {
  await put(STORES.BOARDS, board);
}

export async function deleteBoard(id: string): Promise<void> {
  await remove(STORES.BOARDS, id);
  // Also delete associated columns and cards
  const columns = await getByIndex<Column>(STORES.COLUMNS, 'boardId', id);
  const columnIds = columns.map(c => c.id);
  await removeMany(STORES.COLUMNS, columnIds);

  const cards = await getByIndex<Card>(STORES.CARDS, 'boardId', id);
  const cardIds = cards.map(c => c.id);
  await removeMany(STORES.CARDS, cardIds);
}

// Card-specific operations
export async function getCard(id: string): Promise<Card | undefined> {
  return get<Card>(STORES.CARDS, id);
}

export async function getCardsByBoard(boardId: string): Promise<Card[]> {
  return getByIndex<Card>(STORES.CARDS, 'boardId', boardId);
}

export async function getCardsByColumn(columnId: string): Promise<Card[]> {
  return getByIndex<Card>(STORES.CARDS, 'columnId', columnId);
}

export async function saveCard(card: Card): Promise<void> {
  await put(STORES.CARDS, card);
}

export async function deleteCard(id: string): Promise<void> {
  await remove(STORES.CARDS, id);
}

// Column-specific operations
export async function getColumn(id: string): Promise<Column | undefined> {
  return get<Column>(STORES.COLUMNS, id);
}

export async function getColumnsByBoard(boardId: string): Promise<Column[]> {
  return getByIndex<Column>(STORES.COLUMNS, 'boardId', boardId);
}

export async function saveColumn(column: Column): Promise<void> {
  await put(STORES.COLUMNS, column);
}

export async function deleteColumn(id: string): Promise<void> {
  await remove(STORES.COLUMNS, id);
}

// Pending operations (for offline sync)
export interface PendingOperation {
  id: string;
  type: 'board' | 'card' | 'column' | 'label';
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  data?: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export async function addPendingOperation(operation: PendingOperation): Promise<void> {
  await put(STORES.PENDING_OPERATIONS, operation);
}

export async function getPendingOperations(): Promise<PendingOperation[]> {
  return getAll<PendingOperation>(STORES.PENDING_OPERATIONS);
}

export async function removePendingOperation(id: string): Promise<void> {
  await remove(STORES.PENDING_OPERATIONS, id);
}

export async function updatePendingOperation(
  id: string,
  updates: Partial<PendingOperation>
): Promise<void> {
  const existing = await get<PendingOperation>(STORES.PENDING_OPERATIONS, id);
  if (existing) {
    await put(STORES.PENDING_OPERATIONS, { ...existing, ...updates });
  }
}

// Settings operations
export async function getSetting<T>(key: string): Promise<T | undefined> {
  const result = await get<{ key: string; value: T }>(STORES.SETTINGS, key);
  return result?.value;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await put(STORES.SETTINGS, { key, value });
}

// Utility functions
export async function getDBSize(): Promise<{ used: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { used: 0, quota: 0 };
}

export async function clearAllData(): Promise<void> {
  await clear(STORES.BOARDS);
  await clear(STORES.CARDS);
  await clear(STORES.COLUMNS);
  await clear(STORES.LABELS);
  await clear(STORES.PENDING_OPERATIONS);
}

// Type exports
export interface Board {
  id: string;
  title: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  columns?: Column[];
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  order: number;
  cards?: Card[];
}

export interface Card {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  dueDate?: string;
  order: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}
