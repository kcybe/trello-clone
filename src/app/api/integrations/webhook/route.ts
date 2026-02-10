import { NextRequest, NextResponse } from 'next/server';

import { EVENT_MAPPINGS } from '../../types';

// In-memory storage for demo
const integrations = new Map<
  string,
  {
    id: string;
    type: 'slack' | 'discord';
    name: string;
    webhookUrl: string;
    channelId?: string;
    enabled: boolean;
    events: string[];
  }
>();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event, boardId, boardName, card, user, details, timestamp } = body;

  if (!event || !boardId || !boardName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const mapping = EVENT_MAPPINGS[event as keyof typeof EVENT_MAPPINGS];
  if (!mapping) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
  }

  // Get all enabled integrations for this event
  const enabledIntegrations = Array.from(integrations.values()).filter(
    int => int.enabled && int.events.includes(event)
  );

  const results: Array<{ integrationId: string; success: boolean; error?: string }> = [];

  for (const integration of enabledIntegrations) {
    try {
      let payload: Record<string, unknown>;

      if (integration.type === 'slack') {
        payload = createSlackPayload(
          event,
          boardName,
          card,
          user,
          details,
          timestamp,
          mapping.slackEmoji
        );
      } else {
        payload = createDiscordPayload(
          event,
          boardName,
          card,
          user,
          details,
          timestamp,
          mapping.discordEmoji,
          mapping.defaultColor
        );
      }

      const response = await fetch(integration.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      results.push({
        integrationId: integration.id,
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      });
    } catch (error) {
      results.push({
        integrationId: integration.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  });
}

function createSlackPayload(
  event: string,
  boardName: string,
  card?: { id: string; title: string; columnName?: string },
  user?: { name: string },
  details?: Record<string, unknown>,
  timestamp?: string,
  emoji?: string
) {
  const eventLabels: Record<string, string> = {
    card_created: 'New Card Created',
    card_moved: 'Card Moved',
    card_edited: 'Card Updated',
    card_deleted: 'Card Deleted',
    comment_added: 'New Comment',
    due_date_set: 'Due Date Set',
    member_assigned: 'Member Assigned',
  };

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${eventLabels[event] || event}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Board:* ${boardName}`,
      },
    },
  ];

  if (card) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Card:* ${card.title}${card.columnName ? `\n*Column:* ${card.columnName}` : ''}`,
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Card',
        },
        url: `/card/${card.id}`,
      },
    } as Record<string, unknown>);
  }

  if (user) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `By: ${user.name}`,
        },
      ],
    });
  }

  if (details) {
    const detailText = Object.entries(details)
      .map(([key, value]) => `*${key}:* ${value}`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: detailText,
      },
    });
  }

  return { blocks };
}

function createDiscordPayload(
  event: string,
  boardName: string,
  card?: { id: string; title: string; columnName?: string },
  user?: { name: string },
  details?: Record<string, unknown>,
  timestamp?: string,
  emoji?: string,
  color?: number
) {
  const eventLabels: Record<string, string> = {
    card_created: 'New Card Created',
    card_moved: 'Card Moved',
    card_edited: 'Card Updated',
    card_deleted: 'Card Deleted',
    comment_added: 'New Comment',
    due_date_set: 'Due Date Set',
    member_assigned: 'Member Assigned',
  };

  const embed: {
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: { text: string };
    timestamp?: string;
    url?: string;
  } = {
    title: `${emoji} ${eventLabels[event] || event}`,
    color: color || 0x3b82f6,
    fields: [
      {
        name: 'Board',
        value: boardName,
        inline: true,
      },
    ],
  };

  if (card) {
    embed.fields?.push({
      name: 'Card',
      value: card.title,
      inline: true,
    });

    if (card.columnName) {
      embed.fields?.push({
        name: 'Column',
        value: card.columnName,
        inline: true,
      });
    }

    embed.url = `/card/${card.id}`;
  }

  if (user) {
    embed.fields?.push({
      name: 'By',
      value: user.name,
      inline: true,
    });
  }

  if (details) {
    Object.entries(details).forEach(([key, value]) => {
      embed.fields?.push({
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        value: String(value),
        inline: true,
      });
    });
  }

  embed.footer = {
    text: 'Trello Clone',
  };

  if (timestamp) {
    embed.timestamp = timestamp;
  }

  return {
    username: 'Trello Clone',
    embeds: [embed],
  };
}
