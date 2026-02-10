'use client';

import { Sync, Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useState, useEffect, useCallback } from 'react';

import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { useSyncStore } from '../hooks/useSyncStore';

interface OfflineBannerProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

export function OfflineBanner({ position = 'bottom', showDetails = false }: OfflineBannerProps) {
  const { isOnline, wasOffline, wentOnlineAt, effectiveType, isFast, checkConnection } =
    useOfflineStatus();
  const { isSyncing, lastSyncTime, pendingOperations } = useSyncStore();
  const [showSyncDetails, setShowSyncDetails] = useState(false);

  // Auto-hide after going back online
  useEffect(() => {
    if (isOnline && wentOnlineAt) {
      const timer = setTimeout(() => {
        // Keep showing but maybe fade
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wentOnlineAt]);

  if (isOnline && !wasOffline && pendingOperations === 0) {
    return null;
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50`}>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5" />
            <div>
              <p className="font-medium">You're offline</p>
              <p className="text-sm opacity-90">
                Changes will be saved locally and synced when you're back online.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/20 hover:bg-white/30 border-white/40"
            onClick={checkConnection}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Check
          </Button>
        </div>
      )}

      {/* Back Online Banner */}
      {isOnline && wasOffline && (
        <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-between animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <Wifi className="h-5 w-5" />
            <div>
              <p className="font-medium">You're back online!</p>
              <p className="text-sm opacity-90">Syncing your changes...</p>
            </div>
          </div>
          {pendingOperations > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 hover:bg-white/30 border-white/40"
              onClick={() => setShowSyncDetails(true)}
            >
              <Sync className="h-4 w-4 mr-1" />
              {pendingOperations} pending
            </Button>
          )}
        </div>
      )}

      {/* Sync Status */}
      {isSyncing && (
        <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-center gap-2">
          <Sync className="h-4 w-4 animate-spin" />
          <span>Syncing...</span>
        </div>
      )}

      {/* Pending Operations Warning */}
      {isOnline && pendingOperations > 0 && !isSyncing && (
        <div className="bg-yellow-500 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudOff className="h-4 w-4" />
            <span className="text-sm">{pendingOperations} changes pending sync</span>
          </div>
          <span className="text-xs">Last synced: {formatLastSync(lastSyncTime)}</span>
        </div>
      )}

      {/* Connection Quality Badge */}
      {showDetails && isOnline && effectiveType && (
        <div
          className={`fixed bottom-20 right-4 px-3 py-1 rounded-full text-xs font-medium ${
            isFast ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {effectiveType.toUpperCase()}
        </div>
      )}
    </div>
  );
}

// Sync Status Indicator - smaller version for header/toolbar
export function SyncStatusIndicator() {
  const { isOnline, effectiveType } = useOfflineStatus();
  const { isSyncing, pendingOperations } = useSyncStore();

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1 text-blue-500">
        <Sync className="h-4 w-4 animate-spin" />
        <span className="text-xs">Syncing</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1 text-red-500">
        <WifiOff className="h-4 w-4" />
        <span className="text-xs">Offline</span>
      </div>
    );
  }

  if (pendingOperations > 0) {
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <CloudOff className="h-4 w-4" />
        <span className="text-xs">{pendingOperations}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-green-500">
      <Wifi className="h-4 w-4" />
      <span className="text-xs">Online</span>
    </div>
  );
}
