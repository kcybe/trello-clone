'use client';

import { Install, X, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useEffect, useState } from 'react';

import { usePWA, usePWAUpdate } from '../hooks/usePWA';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { isInstallable, isInstalled, installPWA, dismissInstall } = usePWA();
  const { needsUpdate, update } = usePWAUpdate();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // Auto-show install prompt after a delay if installable
  useEffect(() => {
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000); // Show after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  // Show update banner when update is available
  useEffect(() => {
    if (needsUpdate) {
      setShowUpdateBanner(true);
    }
  }, [needsUpdate]);

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setShowInstallPrompt(false);
    }
  };

  if (isInstalled && !needsUpdate) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Install PWA Prompt */}
      {showInstallPrompt && isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:w-96 animate-in slide-in-from-bottom">
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Install className="h-4 w-4" />
                Install Trello Clone
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Install our app for a better experience with offline access.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInstall} className="flex-1">
                  <Install className="h-4 w-4 mr-1" />
                  Install
                </Button>
                <Button variant="outline" size="sm" onClick={dismissInstall}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Available Banner */}
      {showUpdateBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white px-4 py-3 flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5" />
            <div>
              <p className="font-medium">Update Available</p>
              <p className="text-sm opacity-90">A new version of the app is ready.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/20 hover:bg-white/30 border-white/40"
            onClick={update}
          >
            Update Now
          </Button>
        </div>
      )}
    </>
  );
}

// Register service worker
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker
    .register('/sw.js')
    .then(registration => {
      console.log('Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              newWorker.postMessage('update-available');
            }
          });
        }
      });
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}

// Unregister service worker
export function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready.then(registration => {
    registration.unregister().then(success => {
      console.log('Service Worker unregistered:', success);
    });
  });
}
