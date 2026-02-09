'use client';

import { useEffect, useState, useCallback } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  installPWA: () => Promise<boolean>;
  dismissInstall: () => void;
}

export function usePWA(): UsePWAReturn {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as PWAInstallPrompt);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to install PWA:', error);
      return false;
    }
  }, [installPrompt]);

  const dismissInstall = useCallback(() => {
    setInstallPrompt(null);
  }, []);

  return {
    isInstallable: !!installPrompt && !isInstalled,
    isInstalled,
    installPWA,
    dismissInstall,
  };
}

// PWA Update Available hook
export function usePWAUpdate() {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data === 'update-available') {
          setNeedsUpdate(true);
        }
      });
    }
  }, []);

  const update = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.waiting?.postMessage('skipWaiting');
      });
      window.location.reload();
    }
  }, []);

  return { needsUpdate, update };
}
