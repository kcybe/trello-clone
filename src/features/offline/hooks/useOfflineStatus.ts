'use client';

import { useState, useEffect, useCallback } from 'react';

import { useSyncStore } from './useSyncStore';

interface UseOfflineStatusReturn {
  isOnline: boolean;
  wasOffline: boolean;
  wentOnlineAt: number | null;
  connectionType: string | null;
  effectiveType: string | null;
  isFast: boolean;
  checkConnection: () => Promise<void>;
}

export function useOfflineStatus(): UseOfflineStatusReturn {
  const { isOnline, setOnline } = useSyncStore();
  const [wasOffline, setWasOffline] = useState(false);
  const [wentOnlineAt, setWentOnlineAt] = useState<number | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [effectiveType, setEffectiveType] = useState<string | null>(null);

  const updateOnlineStatus = useCallback(() => {
    const online = navigator.onLine;
    setOnline(online);

    if (online && !isOnline) {
      setWentOnlineAt(Date.now());
      setTimeout(() => setWentOnlineAt(null), 5000);
    }

    setWasOffline(!online);
  }, [isOnline, setOnline]);

  const updateConnectionInfo = useCallback(() => {
    if ('connection' in navigator) {
      const conn = (navigator as Navigator & { connection: NetworkInformation }).connection;

      if (conn) {
        setConnectionType(conn.type);
        setEffectiveType(conn.effectiveType);

        // Listen for changes
        conn.addEventListener('change', updateConnectionInfo);
      }
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/health', { method: 'HEAD' });
      setOnline(response.ok);
    } catch {
      setOnline(false);
    }
  }, [setOnline]);

  useEffect(() => {
    // Initial status
    setOnline(navigator.onLine);
    setWasOffline(!navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listen for connection changes
    updateConnectionInfo();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);

      if ('connection' in navigator) {
        const conn = (navigator as Navigator & { connection: NetworkInformation }).connection;
        conn?.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [updateOnlineStatus, updateConnectionInfo, setOnline]);

  // Determine if connection is fast enough
  const isFast = effectiveType === '4g' || effectiveType === '3g';

  return {
    isOnline,
    wasOffline,
    wentOnlineAt,
    connectionType,
    effectiveType,
    isFast,
    checkConnection,
  };
}
