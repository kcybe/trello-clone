const CACHE_NAME = 'trello-clone-v1';
const STATIC_CACHE = 'trello-clone-static-v1';
const DYNAMIC_CACHE = 'trello-clone-dynamic-v1';
const API_CACHE = 'trello-clone-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

// API endpoints to cache
const API_PATTERNS = [
  /\/api\/boards/,
  /\/api\/cards/,
  /\/api\/columns/,
  /\/api\/labels/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name !== API_CACHE &&
              name !== CACHE_NAME
            );
          })
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - network first, cache fallback
  if (API_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets - cache first, network fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Dynamic content - stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Network first strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Cache first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(cacheName);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || (await fetchPromise) || new Response('Offline', { status: 503 });
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Background sync for offline mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-boards') {
    event.waitUntil(syncBoards());
  } else if (event.tag === 'sync-cards') {
    event.waitUntil(syncCards());
  } else if (event.tag === 'sync-columns') {
    event.waitUntil(syncColumns());
  }
});

// Sync functions
async function syncBoards() {
  const db = await openDB();
  const pendingBoards = await db.getAll('pending-operations', 'board');

  for (const operation of pendingBoards) {
    try {
      await fetch('/api/boards' + (operation.id ? `/${operation.id}` : ''), {
        method: operation.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation.data),
      });
      await db.delete('pending-operations', operation.id);
    } catch (error) {
      console.error('Failed to sync board:', error);
    }
  }
}

async function syncCards() {
  const db = await openDB();
  const pendingCards = await db.getAll('pending-operations', 'card');

  for (const operation of pendingCards) {
    try {
      await fetch(`/api/cards/${operation.id}`, {
        method: operation.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation.data),
      });
      await db.delete('pending-operations', operation.id);
    } catch (error) {
      console.error('Failed to sync card:', error);
    }
  }
}

async function syncColumns() {
  const db = await openDB();
  const pendingColumns = await db.getAll('pending-operations', 'column');

  for (const operation of pendingColumns) {
    try {
      await fetch(`/api/boards/${operation.boardId}/columns${operation.id ? `/${operation.id}` : ''}`, {
        method: operation.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation.data),
      });
      await db.delete('pending-operations', operation.id);
    } catch (error) {
      console.error('Failed to sync column:', error);
    }
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('trello-clone-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Pending operations store
      if (!db.objectStoreNames.contains('pending-operations')) {
        const opsStore = db.createObjectStore('pending-operations', { keyPath: 'id' });
        opsStore.createIndex('type', 'type', { unique: false });
      }

      // Cached boards store
      if (!db.objectStoreNames.contains('boards')) {
        db.createObjectStore('boards', { keyPath: 'id' });
      }

      // Cached cards store
      if (!db.objectStoreNames.contains('cards')) {
        const cardsStore = db.createObjectStore('cards', { keyPath: 'id' });
        cardsStore.createIndex('boardId', 'boardId', { unique: false });
        cardsStore.createIndex('columnId', 'columnId', { unique: false });
      }

      // Cached columns store
      if (!db.objectStoreNames.contains('columns')) {
        const columnsStore = db.createObjectStore('columns', { keyPath: 'id' });
        columnsStore.createIndex('boardId', 'boardId', { unique: false });
      }
    };
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'default',
    data: data.url || '/',
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});

// Message handler for manual sync
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_BOARD') {
    event.waitUntil(cacheBoard(event.data.board));
  }

  if (event.data.type === 'CLEAR_OFFLINE_DATA') {
    event.waitUntil(clearOfflineData());
  }
});

async function cacheBoard(board) {
  const db = await openDB();

  // Cache board
  await db.put('boards', board);

  // Cache columns
  for (const column of board.columns) {
    await db.put('columns', { ...column, boardId: board.id });

    // Cache cards
    for (const card of column.cards) {
      await db.put('cards', { ...card, boardId: board.id, columnId: column.id });
    }
  }
}

async function clearOfflineData() {
  const db = await openDB();
  await db.clear('boards');
  await db.clear('cards');
  await db.clear('columns');
  await db.clear('pending-operations');
}
