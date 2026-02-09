import { useState, useCallback } from 'react';

import { CardRelation, RelationType, CreateCardRelationRequest } from '../types';

interface UseCardRelationsReturn {
  relations: CardRelation[];
  isLoading: boolean;
  error: string | null;
  fetchRelations: (cardId: string) => Promise<void>;
  createRelation: (cardId: string, data: CreateCardRelationRequest) => Promise<CardRelation | null>;
  deleteRelation: (cardId: string, targetCardId: string) => Promise<boolean>;
  clearRelations: () => void;
}

export function useCardRelations(): UseCardRelationsReturn {
  const [relations, setRelations] = useState<CardRelation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRelations = useCallback(async (cardId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cards/${cardId}/relations`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch relations');
      }
      const data = await response.json();
      setRelations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch relations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRelation = useCallback(
    async (cardId: string, data: CreateCardRelationRequest): Promise<CardRelation | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/cards/${cardId}/relations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create relation');
        }
        const relation = await response.json();
        setRelations(prev => [...prev, relation]);
        return relation;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create relation');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteRelation = useCallback(
    async (cardId: string, targetCardId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/cards/${cardId}/relations?targetCardId=${targetCardId}`,
          {
            method: 'DELETE',
          }
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete relation');
        }
        setRelations(prev => prev.filter(r => r.targetCardId !== targetCardId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete relation');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearRelations = useCallback(() => {
    setRelations([]);
    setError(null);
  }, []);

  return {
    relations,
    isLoading,
    error,
    fetchRelations,
    createRelation,
    deleteRelation,
    clearRelations,
  };
}

// Helper hook for getting blocking/blocked cards
export function useCardBlocking(cardId: string) {
  const { relations, isLoading, error, fetchRelations, createRelation, deleteRelation } =
    useCardRelations();

  const blockingRelations = relations.filter(
    r => r.relationType === 'blocks' && r.sourceCardId === cardId
  );

  const blockedByRelations = relations.filter(
    r => r.relationType === 'blocks' && r.targetCardId === cardId
  );

  const dependsOnRelations = relations.filter(
    r => r.relationType === 'depends_on' && r.targetCardId === cardId
  );

  const isBlocked = blockedByRelations.length > 0;

  return {
    blocking: blockingRelations.map(r => r.targetCard),
    blockedBy: blockedByRelations.map(r => r.sourceCard),
    dependsOn: dependsOnRelations.map(r => r.sourceCard),
    isBlocked,
    isLoading,
    error,
    fetchRelations,
    createRelation,
    deleteRelation,
  };
}
