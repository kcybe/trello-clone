import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  formatSlackMessage,
  sendSlackNotification,
  SlackEventType,
  SlackCardInfo,
  SlackUserInfo,
  SlackNotificationPayload,
} from '../slack-webhook';

// Mock fetch globally
globalThis.fetch = vi.fn();

describe('Slack Webhook Service', () => {
  describe('formatSlackMessage', () => {
    describe('card_created event', () => {
      it('should format card created message with header and content', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'New Feature',
          columnName: 'To Do',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'John Doe',
        };

        const result = formatSlackMessage('card_created', card, user, 'Test Board');

        expect(result.blocks).toHaveLength(4); // header, divider, section, context
        expect(result.blocks[0].type).toBe('header');
        expect(result.blocks[0].text?.text).toContain(':card_file_box:');
        expect(result.blocks[0].text?.text).toContain('New Card Created');
      });

      it('should include card title and board name', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Bug Fix',
          columnName: 'In Progress',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'Jane Smith',
        };

        const result = formatSlackMessage('card_created', card, user, 'Project Alpha');

        const sectionBlock = result.blocks.find(b => b.type === 'section') as any;
        expect(sectionBlock.fields).toBeDefined();
        expect(sectionBlock.fields[0].text).toContain('Project Alpha');
        expect(sectionBlock.fields[1].text).toContain('Bug Fix');
      });
    });

    describe('card_moved event', () => {
      it('should include column information', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Task 1',
          columnName: 'Done',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'User',
        };

        const result = formatSlackMessage('card_moved', card, user, 'Board');

        const movedSection = result.blocks.find(
          b => b.type === 'section' && b.text?.text?.includes('Moved to')
        ) as any;
        expect(movedSection).toBeDefined();
        expect(movedSection.text.text).toContain('Done');
      });

      it('should use arrow emoji for moved events', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Task',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'User',
        };

        const result = formatSlackMessage('card_moved', card, user, 'Board');

        expect(result.blocks[0].text?.text).toContain(':arrow_right:');
        expect(result.blocks[0].text?.text).toContain('Card Moved');
      });
    });

    describe('card_edited event', () => {
      it('should include description preview', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Updated Task',
          description: 'This is a detailed description of the task that has been updated.',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'Editor',
        };

        const result = formatSlackMessage('card_edited', card, user, 'Board');

        const descSection = result.blocks.find(
          b => b.type === 'section' && b.text?.text?.includes('Description')
        ) as any;
        expect(descSection).toBeDefined();
        expect(descSection.text.text).toContain('This is a detailed description');
      });

      it('should truncate long descriptions', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Task',
          description: 'A'.repeat(500),
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'User',
        };

        const result = formatSlackMessage('card_edited', card, user, 'Board');

        const descSection = result.blocks.find(
          b => b.type === 'section' && b.text?.text?.includes('Description')
        ) as any;
        expect(descSection.text.text.length).toBeLessThan(220); // 200 + prefix + '...'
      });
    });

    describe('card_deleted event', () => {
      it('should use wastebasket emoji', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Deleted Task',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'User',
        };

        const result = formatSlackMessage('card_deleted', card, user, 'Board');

        expect(result.blocks[0].text?.text).toContain(':wastebasket:');
        expect(result.blocks[0].text?.text).toContain('Card Deleted');
      });
    });

    describe('comment_added event', () => {
      it('should include comment preview in details', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Task with Comment',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'Commenter',
        };
        const details = { comment: 'This is a great idea!' };

        const result = formatSlackMessage('comment_added', card, user, 'Board', details);

        const commentSection = result.blocks.find(
          b => b.type === 'section' && b.text?.text?.includes('Comment')
        ) as any;
        expect(commentSection).toBeDefined();
        expect(commentSection.text.text).toContain('This is a great idea!');
      });
    });

    describe('due_date_set event', () => {
      it('should format due date with calendar emoji', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Task with Due Date',
          dueDate: new Date('2024-12-25T14:00:00Z'),
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'User',
        };

        const result = formatSlackMessage('due_date_set', card, user, 'Board');

        expect(result.blocks[0].text?.text).toContain(':calendar:');
        expect(result.blocks[0].text?.text).toContain('Due Date Set');

        const dateSection = result.blocks.find(
          b => b.type === 'section' && b.text?.text?.includes('Due Date')
        ) as any;
        expect(dateSection).toBeDefined();
      });
    });

    describe('member_assigned event', () => {
      it('should include assigned member info', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Assigned Task',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'Assigner',
        };
        const details = { assignedTo: { name: 'Alice Johnson' } };

        const result = formatSlackMessage('member_assigned', card, user, 'Board', details);

        expect(result.blocks[0].text?.text).toContain(':bust_in_silhouette:');
        expect(result.blocks[0].text?.text).toContain('Member Assigned');

        const assignedSection = result.blocks.find(
          b => b.type === 'section' && b.text?.text?.includes('Assigned To')
        ) as any;
        expect(assignedSection).toBeDefined();
        expect(assignedSection.text.text).toContain('Alice Johnson');
      });
    });

    describe('context block', () => {
      it('should include user name and timestamp', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Test Task',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'Test User',
        };

        const result = formatSlackMessage('card_created', card, user, 'Test Board');

        const contextBlock = result.blocks.find(b => b.type === 'context') as any;
        expect(contextBlock).toBeDefined();
        expect(contextBlock.elements[0].text.text).toContain('Test User');
      });
    });

    describe('view card button', () => {
      it('should include action button when URL is provided', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Task',
          url: '/board/card/123',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'User',
        };

        const result = formatSlackMessage('card_created', card, user, 'Board');

        const actionsBlock = result.blocks.find(b => b.type === 'actions') as any;
        expect(actionsBlock).toBeDefined();
        expect(actionsBlock.elements[0].text.text).toBe('View Card');
        expect(actionsBlock.elements[0].url).toBe('/board/card/123');
      });

      it('should not include action button when URL is missing', () => {
        const card: SlackCardInfo = {
          id: 'card-123',
          title: 'Task',
        };
        const user: SlackUserInfo = {
          id: 'user-1',
          name: 'User',
        };

        const result = formatSlackMessage('card_created', card, user, 'Board');

        const actionsBlock = result.blocks.find(b => b.type === 'actions');
        expect(actionsBlock).toBeUndefined();
      });
    });
  });

  describe('sendSlackNotification', () => {
    const mockFetch = globalThis.fetch as vi.Mock;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return success when webhook responds with 200', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const payload: SlackNotificationPayload = {
        webhookUrl: 'https://hooks.slack.com/services/T1JJ3T3L2/A1BRTD4JD/TIiajkdnlazkcOXrIdevi7',
        eventType: 'card_created',
        card: {
          id: 'card-123',
          title: 'Test Card',
          columnName: 'To Do',
        },
        user: {
          id: 'user-1',
          name: 'Test User',
        },
        boardName: 'Test Board',
      };

      const result = await sendSlackNotification(payload);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.error).toBeUndefined();
    });

    it('should return failure for invalid webhook URL', async () => {
      const payload: SlackNotificationPayload = {
        webhookUrl: 'invalid-url',
        eventType: 'card_created',
        card: {
          id: 'card-123',
          title: 'Test Card',
        },
        user: {
          id: 'user-1',
          name: 'Test User',
        },
        boardName: 'Test Board',
      };

      const result = await sendSlackNotification(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Slack webhook URL');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return failure for empty webhook URL', async () => {
      const payload: SlackNotificationPayload = {
        webhookUrl: '',
        eventType: 'card_created',
        card: {
          id: 'card-123',
          title: 'Test Card',
        },
        user: {
          id: 'user-1',
          name: 'Test User',
        },
        boardName: 'Test Board',
      };

      const result = await sendSlackNotification(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Slack webhook URL');
    });

    it('should return failure when webhook responds with error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('channel_not_found'),
      });

      const payload: SlackNotificationPayload = {
        webhookUrl: 'https://hooks.slack.com/services/T1JJ3T3L2/A1BRTD4JD/TIiajkdnlazkcOXrIdevi7',
        eventType: 'card_created',
        card: {
          id: 'card-123',
          title: 'Test Card',
        },
        user: {
          id: 'user-1',
          name: 'Test User',
        },
        boardName: 'Test Board',
      };

      const result = await sendSlackNotification(payload);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.error).toContain('Slack API error');
    });

    it('should return failure when fetch throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const payload: SlackNotificationPayload = {
        webhookUrl: 'https://hooks.slack.com/services/T1JJ3T3L2/A1BRTD4JD/TIiajkdnlazkcOXrIdevi7',
        eventType: 'card_created',
        card: {
          id: 'card-123',
          title: 'Test Card',
        },
        user: {
          id: 'user-1',
          name: 'Test User',
        },
        boardName: 'Test Board',
      };

      const result = await sendSlackNotification(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should call fetch with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const payload: SlackNotificationPayload = {
        webhookUrl: 'https://hooks.slack.com/services/T1JJ3T3L2/A1BRTD4JD/TIiajkdnlazkcOXrIdevi7',
        eventType: 'card_moved',
        card: {
          id: 'card-123',
          title: 'Moved Card',
          columnName: 'In Progress',
        },
        user: {
          id: 'user-1',
          name: 'Mover',
        },
        boardName: 'Project Board',
      };

      await sendSlackNotification(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/T1JJ3T3L2/A1BRTD4JD/TIiajkdnlazkcOXrIdevi7',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should include event details when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const payload: SlackNotificationPayload = {
        webhookUrl: 'https://hooks.slack.com/services/T1JJ3T3L2/A1BRTD4JD/TIiajkdnlazkcOXrIdevi7',
        eventType: 'comment_added',
        card: {
          id: 'card-123',
          title: 'Task with Comment',
        },
        user: {
          id: 'user-1',
          name: 'Commenter',
        },
        boardName: 'Board',
        details: { comment: 'Great work!' },
      };

      await sendSlackNotification(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Great work!'),
        })
      );
    });
  });

  describe('Event Type Constants', () => {
    it('should have all required event types defined', () => {
      const expectedEvents: SlackEventType[] = [
        'card_created',
        'card_moved',
        'card_edited',
        'card_deleted',
        'comment_added',
        'due_date_set',
        'member_assigned',
      ];

      expectedEvents.forEach(event => {
        expect(() =>
          formatSlackMessage(event, { id: '1', title: 'Test' }, { id: '1', name: 'User' }, 'Board')
        ).not.toThrow();
      });
    });
  });
});
