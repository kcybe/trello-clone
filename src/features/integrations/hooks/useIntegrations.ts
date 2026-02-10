'use client';

import { useState, useCallback } from 'react';

import { IntegrationConfig, IntegrationEvent, CreateIntegrationRequest } from '../types';

interface UseIntegrationsReturn {
  integrations: IntegrationConfig[];
  isLoading: boolean;
  error?: string;
  createIntegration: (data: CreateIntegrationRequest) => Promise<IntegrationConfig | null>;
  updateIntegration: (id: string, updates: Partial<IntegrationConfig>) => Promise<boolean>;
  deleteIntegration: (id: string) => Promise<boolean>;
  testIntegration: (id: string) => Promise<boolean>;
  toggleIntegration: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useIntegrations(): UseIntegrationsReturn {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations');
      const data = await response.json();
      setIntegrations(data.integrations || []);
      setError(undefined);
    } catch (err) {
      setError('Failed to fetch integrations');
      console.error('Failed to fetch integrations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createIntegration = useCallback(
    async (data: CreateIntegrationRequest): Promise<IntegrationConfig | null> => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error.error || 'Failed to create integration');
          return null;
        }

        const result = await response.json();
        setIntegrations(prev => [...prev, result.integration]);
        return result.integration;
      } catch (err) {
        setError('Failed to create integration');
        console.error('Failed to create integration:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateIntegration = useCallback(
    async (id: string, updates: Partial<IntegrationConfig>): Promise<boolean> => {
      try {
        // For demo, we'll update locally
        setIntegrations(prev =>
          prev.map(int =>
            int.id === id ? { ...int, ...updates, updatedAt: new Date().toISOString() } : int
          )
        );
        return true;
      } catch (err) {
        console.error('Failed to update integration:', err);
        return false;
      }
    },
    []
  );

  const deleteIntegration = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIntegrations(prev => prev.filter(int => int.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete integration:', err);
      return false;
    }
  }, []);

  const testIntegration = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const integration = integrations.find(int => int.id === id);
        if (!integration) return false;

        // Send a test notification
        const response = await fetch('/api/integrations/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'card_created',
            boardId: 'test-board',
            boardName: 'Test Board',
            card: {
              id: 'test-card',
              title: 'Test Card',
              columnName: 'Test Column',
            },
            user: {
              id: 'test-user',
              name: 'Test User',
            },
            details: {
              description: 'This is a test notification from Trello Clone',
            },
            timestamp: new Date().toISOString(),
          }),
        });

        return response.ok;
      } catch (err) {
        console.error('Failed to test integration:', err);
        return false;
      }
    },
    [integrations]
  );

  const toggleIntegration = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIntegrations(prev =>
        prev.map(int =>
          int.id === id
            ? { ...int, enabled: !int.enabled, updatedAt: new Date().toISOString() }
            : int
        )
      );
      return true;
    } catch (err) {
      console.error('Failed to toggle integration:', err);
      return false;
    }
  }, []);

  return {
    integrations,
    isLoading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    toggleIntegration,
    refresh: fetchIntegrations,
  };
}
