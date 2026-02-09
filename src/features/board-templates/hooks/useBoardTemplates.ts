import { useState, useCallback } from 'react';

import { BoardTemplate } from '../types';

interface UseBoardTemplatesReturn {
  templates: BoardTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  saveAsTemplate: (data: SaveTemplateData) => Promise<BoardTemplate | null>;
  copyFromTemplate: (data: CopyFromTemplateData) => Promise<BoardTemplate | null>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  updateTemplate: (templateId: string, data: UpdateTemplateData) => Promise<BoardTemplate | null>;
}

interface SaveTemplateData {
  boardId: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
}

interface CopyFromTemplateData {
  templateId: string;
  name: string;
  description?: string;
}

interface UpdateTemplateData {
  name?: string;
  description?: string;
  icon?: string;
}

export function useBoardTemplates(): UseBoardTemplatesReturn {
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveAsTemplate = useCallback(
    async (data: SaveTemplateData): Promise<BoardTemplate | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/templates/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save template');
        }
        const template = await response.json();
        setTemplates(prev => [...prev, template]);
        return template;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save template');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const copyFromTemplate = useCallback(
    async (data: CopyFromTemplateData): Promise<BoardTemplate | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/templates/copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to copy from template');
        }
        const board = await response.json();
        return board;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to copy from template');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(
    async (templateId: string, data: UpdateTemplateData): Promise<BoardTemplate | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/templates/${templateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update template');
        }
        const template = await response.json();
        setTemplates(prev => prev.map(t => (t.id === templateId ? template : t)));
        return template;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update template');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    saveAsTemplate,
    copyFromTemplate,
    deleteTemplate,
    updateTemplate,
  };
}
