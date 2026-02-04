# @Mentions in Cards

Tag team members in card descriptions and comments using @username.

## Overview

Users can mention others using @username syntax. Mentioned users receive notifications.

## User Stories

- As a user, I want to mention @username in card descriptions
- As a user, I want to mention @username in comments
- As a user, I want to see a list of suggested users when typing @
- As a user, I want to receive a notification when mentioned

## Data Model

```typescript
interface Mention {
  id: string;
  cardId: string;
  mentionedUserId: string;
  mentionerUserId: string;
  context: 'description' | 'comment';
  createdAt: Date;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?q=...` | Search users for autocomplete |
| POST | `/api/parse-mentions` | Parse text for mentions |
| GET | `/api/cards/:id/mentions` | Get all mentions on card |

## UI Components

1. `MentionAutocomplete` - Dropdown with user suggestions
2. `MentionParser` - Highlight mentions in rendered text
3. `MentionNotification` - Notification template for mentions

## Implementation Steps

### Phase 1: Basic Mentions
1. Add autocomplete to text inputs
2. Parse @mentions when saving card/comment
3. Create mention records in database
4. Send notifications for new mentions

### Phase 2: Rendering
1. Highlight mentions in descriptions
2. Add clickable link to user profile
3. Show mention count on card

## Complexity: Easy
- Text parsing for @pattern
- User search API
- Notification integration
