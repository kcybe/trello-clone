/**
 * Slack Webhook Notification Service
 *
 * Formats and sends card event notifications to Slack webhooks
 * using Slack Block Kit format.
 */

export type SlackEventType =
  | 'card_created'
  | 'card_moved'
  | 'card_edited'
  | 'card_deleted'
  | 'comment_added'
  | 'due_date_set'
  | 'member_assigned';

export interface SlackCardInfo {
  id: string;
  title: string;
  columnId?: string;
  columnName?: string;
  description?: string;
  dueDate?: Date | null;
  url?: string;
}

export interface SlackUserInfo {
  id: string;
  name: string;
  email?: string;
}

export interface SlackNotificationPayload {
  webhookUrl: string;
  eventType: SlackEventType;
  card: SlackCardInfo;
  user: SlackUserInfo;
  boardName: string;
  details?: Record<string, unknown>;
}

export interface SlackNotificationResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

// Event type to emoji mapping
const EVENT_EMOJI_MAP: Record<SlackEventType, string> = {
  card_created: ':card_file_box:',
  card_moved: ':arrow_right:',
  card_edited: ':pencil2:',
  card_deleted: ':wastebasket:',
  comment_added: ':speech_balloon:',
  due_date_set: ':calendar:',
  member_assigned: ':bust_in_silhouette:',
};

// Event type to human-readable label
const EVENT_LABEL_MAP: Record<SlackEventType, string> = {
  card_created: 'New Card Created',
  card_moved: 'Card Moved',
  card_edited: 'Card Updated',
  card_deleted: 'Card Deleted',
  comment_added: 'New Comment',
  due_date_set: 'Due Date Set',
  member_assigned: 'Member Assigned',
};

// Slack Block Kit types
interface SlackTextObject {
  type: 'plain_text' | 'mrkdwn';
  text: string;
  emoji?: boolean;
}

interface SlackBlock {
  type: 'header' | 'section' | 'divider' | 'context' | 'actions';
  text?: SlackTextObject;
  accessory?: SlackBlockAccessory;
  elements?: SlackBlockElement[];
  fields?: SlackTextObject[];
}

interface SlackBlockAccessory {
  type: 'button';
  text: SlackTextObject;
  url?: string;
  action_id?: string;
}

interface SlackBlockElement {
  type: 'plain_text' | 'mrkdwn' | 'button';
  text?: SlackTextObject;
  url?: string;
  action_id?: string;
}

/**
 * Format a card event into Slack Block Kit format
 */
export function formatSlackMessage(
  eventType: SlackEventType,
  card: SlackCardInfo,
  user: SlackUserInfo,
  boardName: string,
  details?: Record<string, unknown>
): { blocks: SlackBlock[] } {
  const emoji = EVENT_EMOJI_MAP[eventType];
  const label = EVENT_LABEL_MAP[eventType];
  const timestamp = new Date().toISOString();

  const blocks: SlackBlock[] = [
    // Header block with event type
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${label}`,
        emoji: true,
      },
    },
    // Divider
    { type: 'divider' },
    // Main content section
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Board:*\n${boardName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Card:*\n${card.title}`,
        },
      ],
    },
  ];

  // Add column info if available (for card_moved events)
  if (card.columnName && eventType === 'card_moved') {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Moved to:*\n${card.columnName}`,
      },
    });
  }

  // Add description preview for card_edited events
  if (card.description && eventType === 'card_edited') {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Description:*\n${truncateText(card.description, 200)}`,
      },
    });
  }

  // Add due date info
  if (card.dueDate && eventType === 'due_date_set') {
    const formattedDate = new Date(card.dueDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Due Date:*\n${formattedDate}`,
      },
    });
  }

  // Add assigned member info
  if (eventType === 'member_assigned' && details?.assignedTo) {
    const assignedTo = details.assignedTo as { name: string };
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Assigned To:*\n${assignedTo.name}`,
      },
    });
  }

  // Add comment preview for comment_added events
  if (eventType === 'comment_added' && details?.comment) {
    const comment = details.comment as string;
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Comment:*\n${truncateText(comment, 300)}`,
      },
    });
  }

  // Add user info and timestamp as context
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: {
          type: 'mrkdwn',
          text: `By *${user.name}* • ${formatTimestamp(timestamp)}`,
        },
      },
    ],
  });

  // Add view card button if URL is available
  if (card.url) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Card',
            emoji: true,
          },
          url: card.url,
          action_id: 'view_card',
        },
      ],
    });
  }

  return { blocks };
}

/**
 * Send a notification to a Slack webhook
 */
export async function sendSlackNotification(
  payload: SlackNotificationPayload
): Promise<SlackNotificationResult> {
  const { webhookUrl, eventType, card, user, boardName, details } = payload;

  // Validate webhook URL
  if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/services/')) {
    return {
      success: false,
      error: 'Invalid Slack webhook URL',
    };
  }

  try {
    // Format the message
    const message = formatSlackMessage(eventType, card, user, boardName, details);

    // Send to Slack
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        statusCode: response.status,
        error: `Slack API error: ${response.status} - ${errorText}`,
      };
    }

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Format timestamp for Slack context
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text to a maximum length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}
