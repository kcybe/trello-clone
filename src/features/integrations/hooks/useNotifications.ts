'use client';

import { useCallback } from 'react';

import { NotificationPayload, IntegrationEvent } from '../types';

interface UseNotificationsReturn {
  sendNotification: (payload: NotificationPayload) => Promise<{
    sent: number;
    failed: number;
    results: Array<{ integrationId: string; success: boolean; error?: string }>;
  } | null>;
  sendCardCreated: (
    boardId: string,
    boardName: string,
    card: { id: string; title: string },
    user: { id: string; name: string }
  ) => Promise<boolean>;
  sendCardMoved: (
    boardId: string,
    boardName: string,
    card: { id: string; title: string; columnName: string },
    user: { id: string; name: string }
  ) => Promise<boolean>;
  sendCardEdited: (
    boardId: string,
    boardName: string,
    card: { id: string; title: string },
    user: { id: string; name: string },
    changes?: string
  ) => Promise<boolean>;
  sendCardDeleted: (
    boardId: string,
    boardName: string,
    cardTitle: string,
    user: { id: string; name: string }
  ) => Promise<boolean>;
  sendCommentAdded: (
    boardId: string,
    boardName: string,
    card: { id: string; title: string },
    user: { id: string; name: string },
    commentPreview?: string
  ) => Promise<boolean>;
  sendDueDateSet: (
    boardId: string,
    boardName: string,
    card: { id: string; title: string },
    user: { id: string; name: string },
    dueDate: string
  ) => Promise<boolean>;
  sendMemberAssigned: (
    boardId: string,
    boardName: string,
    card: { id: string; title: string },
    user: { id: string; name: string },
    assignedMember: string
  ) => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  const sendNotification = useCallback(async (payload: NotificationPayload) => {
    try {
      const response = await fetch('/api/integrations/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Failed to send notification:', response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send notification:', error);
      return null;
    }
  }, []);

  const sendCardCreated = useCallback(
    async (
      boardId: string,
      boardName: string,
      card: { id: string; title: string },
      user: { id: string; name: string }
    ): Promise<boolean> => {
      const result = await sendNotification({
        event: 'card_created',
        boardId,
        boardName,
        card,
        user,
        timestamp: new Date().toISOString(),
      });
      return result !== null;
    },
    [sendNotification]
  );

  const sendCardMoved = useCallback(
    async (
      boardId: string,
      boardName: string,
      card: { id: string; title: string; columnName: string },
      user: { id: string; name: string }
    ): Promise<boolean> => {
      const result = await sendNotification({
        event: 'card_moved',
        boardId,
        boardName,
        card,
        user,
        details: {
          from_column: 'Previous Column', // You could track this
          to_column: card.columnName,
        },
        timestamp: new Date().toISOString(),
      });
      return result !== null;
    },
    [sendNotification]
  );

  const sendCardEdited = useCallback(
    async (
      boardId: string,
      boardName: string,
      card: { id: string; title: string },
      user: { id: string; name: string },
      changes?: string
    ): Promise<boolean> => {
      const result = await sendNotification({
        event: 'card_edited',
        boardId,
        boardName,
        card,
        user,
        details: changes ? { changes } : undefined,
        timestamp: new Date().toISOString(),
      });
      return result !== null;
    },
    [sendNotification]
  );

  const sendCardDeleted = useCallback(
    async (
      boardId: string,
      boardName: string,
      cardTitle: string,
      user: { id: string; name: string }
    ): Promise<boolean> => {
      const result = await sendNotification({
        event: 'card_deleted',
        boardId,
        boardName,
        card: {
          id: 'deleted',
          title: cardTitle,
        },
        user,
        timestamp: new Date().toISOString(),
      });
      return result !== null;
    },
    [sendNotification]
  );

  const sendCommentAdded = useCallback(
    async (
      boardId: string,
      boardName: string,
      card: { id: string; title: string },
      user: { id: string; name: string },
      commentPreview?: string
    ): Promise<boolean> => {
      const result = await sendNotification({
        event: 'comment_added',
        boardId,
        boardName,
        card,
        user,
        details: commentPreview
          ? {
              comment:
                commentPreview.length > 100 ? commentPreview.slice(0, 100) + '...' : commentPreview,
            }
          : undefined,
        timestamp: new Date().toISOString(),
      });
      return result !== null;
    },
    [sendNotification]
  );

  const sendDueDateSet = useCallback(
    async (
      boardId: string,
      boardName: string,
      card: { id: string; title: string },
      user: { id: string; name: string },
      dueDate: string
    ): Promise<boolean> => {
      const result = await sendNotification({
        event: 'due_date_set',
        boardId,
        boardName,
        card,
        user,
        details: {
          due_date: new Date(dueDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
        timestamp: new Date().toISOString(),
      });
      return result !== null;
    },
    [sendNotification]
  );

  const sendMemberAssigned = useCallback(
    async (
      boardId: string,
      boardName: string,
      card: { id: string; title: string },
      user: { id: string; name: string },
      assignedMember: string
    ): Promise<boolean> => {
      const result = await sendNotification({
        event: 'member_assigned',
        boardId,
        boardName,
        card,
        user,
        details: {
          assigned_to: assignedMember,
        },
        timestamp: new Date().toISOString(),
      });
      return result !== null;
    },
    [sendNotification]
  );

  return {
    sendNotification,
    sendCardCreated,
    sendCardMoved,
    sendCardEdited,
    sendCardDeleted,
    sendCommentAdded,
    sendDueDateSet,
    sendMemberAssigned,
  };
}
