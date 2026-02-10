// Integration Types
export interface IntegrationConfig {
  id: string;
  type: 'slack' | 'discord';
  name: string;
  webhookUrl: string;
  channelId?: string;
  enabled: boolean;
  events: IntegrationEvent[];
  createdAt: string;
  updatedAt: string;
}

export type IntegrationEvent =
  | 'card_created'
  | 'card_moved'
  | 'card_edited'
  | 'card_deleted'
  | 'comment_added'
  | 'due_date_set'
  | 'member_assigned';

// Slack-specific types
export interface SlackWebhookPayload {
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
      emoji?: boolean;
    };
    url?: string;
    action_id?: string;
  }>;
  accessory?: {
    type: string;
    text: {
      type: string;
      text: string;
    };
    url?: string;
  };
}

export interface SlackAttachment {
  color: string;
  title: string;
  title_link?: string;
  text: string;
  fields?: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
  footer?: string;
  ts?: number;
}

// Discord-specific types
export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  thumbnail?: {
    url: string;
  };
}

// Notification Types
export interface NotificationPayload {
  event: IntegrationEvent;
  boardId: string;
  boardName: string;
  card?: {
    id: string;
    title: string;
    columnId?: string;
    columnName?: string;
  };
  user?: {
    id: string;
    name: string;
  };
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface SendNotificationResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// API Request Types
export interface CreateIntegrationRequest {
  type: 'slack' | 'discord';
  name: string;
  webhookUrl: string;
  channelId?: string;
  events: IntegrationEvent[];
}

export interface UpdateIntegrationRequest {
  name?: string;
  webhookUrl?: string;
  channelId?: string;
  events?: IntegrationEvent[];
  enabled?: boolean;
}

// Settings Types
export interface IntegrationSettings {
  defaultChannel?: string;
  mentionUsers?: boolean;
  includeCardDescription?: boolean;
  truncateContent?: boolean;
  maxContentLength?: number;
}

// Event Mapping
export interface EventMapping {
  slackEmoji: string;
  discordEmoji: string;
  defaultColor: number;
}

export const EVENT_MAPPINGS: Record<IntegrationEvent, EventMapping> = {
  card_created: { slackEmoji: ':card_file_box:', discordEmoji: '📋', defaultColor: 0x3b82f6 },
  card_moved: {
    slackEmoji: ':arrows_counterclockwise:',
    discordEmoji: '🔄',
    defaultColor: 0x8b5cf6,
  },
  card_edited: { slackEmoji: ':pencil2:', discordEmoji: '✏️', defaultColor: 0xf59e0b },
  card_deleted: { slackEmoji: ':wastebasket:', discordEmoji: '🗑️', defaultColor: 0xef4444 },
  comment_added: { slackEmoji: ':speech_balloon:', discordEmoji: '💬', defaultColor: 0x22c55e },
  due_date_set: { slackEmoji: ':calendar:', discordEmoji: '📅', defaultColor: 0xec4899 },
  member_assigned: {
    slackEmoji: ':bust_in_silhouette:',
    discordEmoji: '👤',
    defaultColor: 0x14b8a6,
  },
};
